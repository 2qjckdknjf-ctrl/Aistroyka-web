export type PilotLeadInput = {
  name: string;
  email: string;
  company: string;
  objectsRange: string;
  plan?: string;
  role?: string;
  channel?: string;
  goals?: string;
};

export type ContactLeadPayload = {
  name: string;
  email: string;
  company: string;
  message: string;
};

function optionalLine(label: string, value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? `${label}: ${trimmed}` : null;
}

/** Maps the public pilot modal onto the existing `/api/contact` contract. */
export function buildPilotLeadPayload(input: PilotLeadInput): ContactLeadPayload {
  const extras = [
    optionalLine("Plan", input.plan),
    optionalLine("Role", input.role),
    optionalLine("Channel", input.channel),
    optionalLine("Goals", input.goals),
  ].filter((line): line is string => Boolean(line));
  const message = [`Pilot request. Active objects: ${input.objectsRange.trim()}`, ...extras].join(" ");
  return {
    name: input.name.trim(),
    email: input.email.trim(),
    company: input.company.trim(),
    message,
  };
}
