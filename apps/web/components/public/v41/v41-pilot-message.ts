export type PilotLeadInput = {
  name: string;
  email: string;
  company: string;
  objectsRange: string;
};

export type ContactLeadPayload = {
  name: string;
  email: string;
  company: string;
  message: string;
};

/** Maps the public pilot modal onto the existing `/api/contact` contract. */
export function buildPilotLeadPayload(input: PilotLeadInput): ContactLeadPayload {
  return {
    name: input.name.trim(),
    email: input.email.trim(),
    company: input.company.trim(),
    message: `Pilot request. Active objects: ${input.objectsRange.trim()}`,
  };
}
