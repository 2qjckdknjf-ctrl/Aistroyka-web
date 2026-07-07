import type { RomaEntityId } from "../shared";

export type RomaDependencyKind = "depends_on" | "exposes" | "affects" | "requires_probe" | "owned_by";

export type RomaDependency = {
  id: RomaEntityId;
  fromId: RomaEntityId;
  toId: RomaEntityId;
  kind: RomaDependencyKind;
  label?: string;
};

export type RomaDependencyGraph = {
  nodes: readonly RomaEntityId[];
  edges: readonly RomaDependency[];
};
