import type {
  ClientRequestKind,
  CreateClientRequestInput,
  DecisionRequestType,
} from "@/lib/domain/client-requests/client-requests.types";

export function kindForDecisionType(type: DecisionRequestType): ClientRequestKind {
  switch (type) {
    case "design_choice":
    case "material_choice":
      return "choice";
    case "document_approval":
      return "document_review";
    case "general_question":
    case "other":
      return "feedback";
    case "estimate_approval":
    case "cost_change_customer_facing":
    case "schedule_change":
    case "work_acceptance":
      return "approve_or_reject";
  }
}

export function createInputFromDecisionBody(body: Record<string, unknown>): CreateClientRequestInput {
  const type = body.type as DecisionRequestType;
  return {
    kind: kindForDecisionType(type),
    decision_type: type,
    priority: body.priority as CreateClientRequestInput["priority"],
    title: typeof body.title === "string" ? body.title : "",
    instructions: typeof body.description === "string" ? body.description : null,
    choice_options: Array.isArray(body.choice_options)
      ? body.choice_options.filter((x): x is string => typeof x === "string")
      : null,
    linked_entity_type:
      body.linked_entity_type === "document" || body.linked_entity_type === "milestone"
        ? body.linked_entity_type
        : null,
    linked_entity_id: typeof body.linked_entity_id === "string" ? body.linked_entity_id : null,
    assigned_to: typeof body.assigned_to === "string" ? body.assigned_to : null,
    due_at: typeof body.due_at === "string" ? body.due_at : null,
    customer_visible_amount:
      typeof body.customer_visible_amount === "number" ? body.customer_visible_amount : null,
    customer_visible_currency:
      typeof body.customer_visible_currency === "string" ? body.customer_visible_currency : null,
  };
}
