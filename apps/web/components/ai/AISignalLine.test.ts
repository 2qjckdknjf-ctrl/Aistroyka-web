import { describe, it, expect } from "vitest";
import { getAISignalLineProps, getAISignalLinePropsFromScore } from "./AISignalLine";

describe("getAISignalLinePropsFromScore", () => {
  it("0–30 -> idle (subtle)", () => {
    expect(getAISignalLinePropsFromScore(0)).toMatchObject({ visible: true, colorClass: "bg-aistroyka-text-tertiary/40", pulse: false });
    expect(getAISignalLinePropsFromScore(30)).toMatchObject({ visible: true, colorClass: "bg-aistroyka-text-tertiary/40", pulse: false });
  });
  it("31–60 -> indigo (accent)", () => {
    expect(getAISignalLinePropsFromScore(31)).toMatchObject({ visible: true, colorClass: "bg-aistroyka-accent", pulse: false });
    expect(getAISignalLinePropsFromScore(60)).toMatchObject({ visible: true, colorClass: "bg-aistroyka-accent", pulse: false });
  });
  it("61–80 -> warning", () => {
    expect(getAISignalLinePropsFromScore(61)).toMatchObject({ visible: true, colorClass: "bg-aistroyka-warning", pulse: false });
    expect(getAISignalLinePropsFromScore(80)).toMatchObject({ visible: true, colorClass: "bg-aistroyka-warning", pulse: false });
  });
  it("81–100 -> danger", () => {
    expect(getAISignalLinePropsFromScore(81)).toMatchObject({ visible: true, colorClass: "bg-aistroyka-error", pulse: false });
    expect(getAISignalLinePropsFromScore(100)).toMatchObject({ visible: true, colorClass: "bg-aistroyka-error", pulse: false });
  });
});

describe("getAISignalLineProps", () => {
  it("idle -> hidden", () => {
    expect(getAISignalLineProps("idle")).toEqual({ visible: false, colorClass: "", pulse: false });
  });

  it("analyzing -> visible, accent, pulse", () => {
    expect(getAISignalLineProps("analyzing")).toEqual({
      visible: true,
      colorClass: "bg-aistroyka-accent",
      pulse: true,
    });
  });

  it("risk_detected without severity -> warning", () => {
    expect(getAISignalLineProps("risk_detected")).toEqual({
      visible: true,
      colorClass: "bg-aistroyka-warning",
      pulse: false,
    });
  });

  it("risk_detected with severity <= 70 -> warning", () => {
    expect(getAISignalLineProps("risk_detected", 70)).toEqual({
      visible: true,
      colorClass: "bg-aistroyka-warning",
      pulse: false,
    });
  });

  it("risk_detected with severity > 70 -> danger", () => {
    expect(getAISignalLineProps("risk_detected", 71)).toEqual({
      visible: true,
      colorClass: "bg-aistroyka-error",
      pulse: false,
    });
  });

  it("optimization_found -> accent/80", () => {
    expect(getAISignalLineProps("optimization_found")).toEqual({
      visible: true,
      colorClass: "bg-aistroyka-accent/80",
      pulse: false,
    });
  });

  it("milestone_achieved -> success", () => {
    expect(getAISignalLineProps("milestone_achieved")).toEqual({
      visible: true,
      colorClass: "bg-aistroyka-success",
      pulse: false,
    });
  });
});
