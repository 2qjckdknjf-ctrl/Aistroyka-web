import { describe, expect, it, vi } from "vitest";
import {
  createCustomerIntakeDraft,
  draftFromStorageRow,
  parseCreateCustomerIntakeInput,
  updateCustomerIntakeDraft,
} from "./customer-intake.service";

function mockUpdate(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn();
  const builder: { eq: (...args: unknown[]) => unknown; select: () => { maybeSingle: typeof maybeSingle } } = {
    eq: (...args: unknown[]) => {
      eq(...args);
      return builder;
    },
    select: () => ({ maybeSingle }),
  };
  return {
    supabase: { from: vi.fn().mockReturnValue({ update: () => builder }) },
    eq,
  };
}

describe("parseCreateCustomerIntakeInput", () => {
  it("rejects missing title", () => {
    expect(parseCreateCustomerIntakeInput({ description: "x" })).toEqual({ error: "title required" });
  });

  it("rejects null title", () => {
    expect(parseCreateCustomerIntakeInput({ title: null, description: "x" })).toEqual({ error: "title required" });
  });

  it("rejects non-string title", () => {
    expect(parseCreateCustomerIntakeInput({ title: 1, description: "x" })).toEqual({ error: "title required" });
  });

  it("rejects missing description", () => {
    expect(parseCreateCustomerIntakeInput({ title: "Kitchen" })).toEqual({ error: "description required" });
  });

  it("rejects non-string description", () => {
    expect(parseCreateCustomerIntakeInput({ title: "Kitchen", description: {} })).toEqual({
      error: "description required",
    });
  });

  it("trims valid strings", () => {
    const parsed = parseCreateCustomerIntakeInput({ title: "  Kitchen  ", description: "  Need remodel  " });
    expect(parsed).toMatchObject({
      input: { title: "Kitchen", description: "Need remodel", location: { precision: "city" } },
    });
    expect("project_id" in (parsed as { input: object }).input).toBe(false);
    expect(parseCreateCustomerIntakeInput((parsed as { input: object }).input)).toMatchObject({
      input: { title: "Kitchen", description: "Need remodel" },
    });
  });

  it("rejects empty or unknown location.precision", () => {
    expect(
      parseCreateCustomerIntakeInput({ title: "Kitchen", description: "Need remodel", location: {} })
    ).toEqual({ error: "location.precision is invalid" });
    expect(
      parseCreateCustomerIntakeInput({
        title: "Kitchen",
        description: "Need remodel",
        location: { precision: "unknown" },
      })
    ).toEqual({ error: "location.precision is invalid" });
  });

  it("rejects questions that are not an array of strings", () => {
    expect(
      parseCreateCustomerIntakeInput({ title: "Kitchen", description: "Need remodel", questions: {} })
    ).toEqual({ error: "questions must be an array of strings" });
    expect(
      parseCreateCustomerIntakeInput({ title: "Kitchen", description: "Need remodel", questions: [{}] })
    ).toEqual({ error: "questions must be an array of strings" });
    expect(
      parseCreateCustomerIntakeInput({ title: "Kitchen", description: "Need remodel", questions: [1] })
    ).toEqual({ error: "questions must be an array of strings" });
  });

  it("accepts trimmed valid questions", () => {
    const parsed = parseCreateCustomerIntakeInput({
      title: "Kitchen",
      description: "Need remodel",
      questions: ["  Timeline?  "],
    });
    expect(parsed).toMatchObject({ input: { questions: ["Timeline?"] } });
  });

  it("rejects invalid media_refs", () => {
    expect(
      parseCreateCustomerIntakeInput({ title: "Kitchen", description: "Need remodel", media_refs: {} })
    ).toEqual({ error: "media_refs must be an array" });
    expect(
      parseCreateCustomerIntakeInput({
        title: "Kitchen",
        description: "Need remodel",
        media_refs: [{ kind: "unknown", media_id: "m1" }],
      })
    ).toEqual({ error: "media_refs.kind is invalid" });
    expect(
      parseCreateCustomerIntakeInput({
        title: "Kitchen",
        description: "Need remodel",
        media_refs: [{ kind: "image" }],
      })
    ).toEqual({ error: "media_refs requires media_id or url" });
  });

  it("accepts valid media_refs", () => {
    const parsed = parseCreateCustomerIntakeInput({
      title: "Kitchen",
      description: "Need remodel",
      media_refs: [{ kind: "image", media_id: "img-1" }],
    });
    expect(parsed).toMatchObject({ input: { media_refs: [{ kind: "image", media_id: "img-1" }] } });
  });
});

describe("createCustomerIntakeDraft", () => {
  it("rejects empty title without throwing", async () => {
    const r = await createCustomerIntakeDraft({} as never, { tenantId: "t", userId: "u" } as never, {
      title: " ",
      description: "need a kitchen",
    });
    expect(r.error).toMatch(/title/);
  });

  it("rejects foreign project_id before insert", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle }),
          }),
        }),
      }),
    };
    const r = await createCustomerIntakeDraft(supabase as never, { tenantId: "t1", userId: "u" } as never, {
      title: "Kitchen",
      description: "Need remodel",
      project_id: "foreign-project",
    });
    expect(r.error).toMatch(/project_id/);
    expect(r.data).toBeNull();
  });

  it("propagates project lookup failure instead of inserting", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle }),
          }),
        }),
      }),
    };
    const r = await createCustomerIntakeDraft(supabase as never, { tenantId: "t1", userId: "u" } as never, {
      title: "Kitchen",
      description: "Need remodel",
      project_id: "p1",
    });
    expect(r.error).toBe("Project lookup failed");
  });

  it("inserts a draft without AI fields", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "d1",
        tenant_id: "t",
        project_id: null,
        title: "Kitchen",
        description: "Need remodel",
        site_context: null,
        location: { precision: "city" },
        requested_work_type: "remodel",
        budget_range: null,
        desired_start: null,
        desired_end: null,
        media_refs: [],
        questions: [],
        status: "draft",
        created_at: "2026-10-03T00:00:00Z",
        updated_at: "2026-10-03T00:00:00Z",
      },
      error: null,
    });
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: () => ({ select: () => ({ maybeSingle }) }),
      }),
    };
    const r = await createCustomerIntakeDraft(supabase as never, { tenantId: "t", userId: "u" } as never, {
      title: "Kitchen",
      description: "Need remodel",
      requested_work_type: "remodel",
    });
    expect(r.error).toBe("");
    expect(r.data?.status).toBe("draft");
    expect(JSON.stringify(r.data)).not.toMatch(/analysis|matching|ai_result/i);
  });
});

describe("updateCustomerIntakeDraft", () => {
  it("denies tenant_id rewrite at the application layer", async () => {
    const r = await updateCustomerIntakeDraft({} as never, { tenantId: "t1", userId: "u" } as never, "d1", {
      tenant_id: "t2",
      title: "Kitchen",
    });
    expect(r.error).toMatch(/tenant_id is immutable/);
  });

  it("denies foreign project_id on update", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({ maybeSingle }),
          }),
        }),
      }),
    };
    const r = await updateCustomerIntakeDraft(supabase as never, { tenantId: "t1", userId: "u" } as never, "d1", {
      project_id: "other-tenant-project",
    });
    expect(r.error).toMatch(/project_id/);
  });

  it("allows a normal draft content update for the creator", async () => {
    const { supabase, eq } = mockUpdate({
      data: {
        id: "d1",
        tenant_id: "t1",
        project_id: null,
        title: "Kitchen 2",
        description: "Need remodel",
        site_context: null,
        location: { precision: "city" },
        media_refs: [],
        questions: [],
        status: "draft",
        created_at: "2026-10-03T00:00:00Z",
        updated_at: "2026-10-03T00:00:01Z",
      },
      error: null,
    });
    const r = await updateCustomerIntakeDraft(supabase as never, { tenantId: "t1", userId: "u" } as never, "d1", {
      title: "Kitchen 2",
    });
    expect(r.error).toBe("");
    expect(r.data?.title).toBe("Kitchen 2");
    expect(eq).toHaveBeenCalledWith("id", "d1");
    expect(eq).toHaveBeenCalledWith("tenant_id", "t1");
    expect(eq).toHaveBeenCalledWith("created_by", "u");
  });

  it("returns Update denied when RLS/membership hides the row", async () => {
    const { supabase } = mockUpdate({ data: null, error: null });
    const r = await updateCustomerIntakeDraft(supabase as never, { tenantId: "t1", userId: "revoked" } as never, "d1", {
      description: "still trying",
    });
    expect(r.error).toBe("Update denied");
  });
});

describe("draftFromStorageRow", () => {
  it("does not cast malformed stored questions or media_refs", () => {
    expect(
      draftFromStorageRow({
        id: "d1",
        tenant_id: "t1",
        title: "Kitchen",
        description: "Need remodel",
        location: { precision: "city" },
        questions: [{}],
        media_refs: [],
        status: "draft",
      })
    ).toBeNull();
    expect(
      draftFromStorageRow({
        id: "d1",
        tenant_id: "t1",
        title: "Kitchen",
        description: "Need remodel",
        location: { precision: "city" },
        questions: [],
        media_refs: [{ kind: "unknown" }],
        status: "draft",
      })
    ).toBeNull();
  });
});
