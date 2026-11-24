/**
 * In-memory supplier order ACK / idempotency rehearsal (D10).
 * No DB writes, no HTTP, no payments — synthetic only.
 */

export type RehearsalAckStatus = "pending" | "acked" | "lost" | "duplicate_suppressed";

export type SupplierOrderRehearsalEvent = {
  idempotency_key: string;
  supplier_name: string;
  amount_minor: string;
  ack_status: RehearsalAckStatus;
};

export type SupplierOrderRehearsalResult = {
  accepted: boolean;
  ack_status: RehearsalAckStatus;
  reason: "ok" | "lost_ack_unreconciled" | "duplicate_suppressed";
};

/**
 * Simulate placing a draft order intent. Lost ACK never becomes paid;
 * duplicate idempotency keys are suppressed.
 */
export function simulateSupplierOrderAck(
  prior: readonly SupplierOrderRehearsalEvent[],
  next: Omit<SupplierOrderRehearsalEvent, "ack_status"> & {
    simulate: "ack" | "lost_ack" | "duplicate";
  }
): SupplierOrderRehearsalResult {
  const existing = prior.find((event) => event.idempotency_key === next.idempotency_key);
  if (existing || next.simulate === "duplicate") {
    return {
      accepted: false,
      ack_status: "duplicate_suppressed",
      reason: "duplicate_suppressed",
    };
  }
  if (next.simulate === "lost_ack") {
    return {
      accepted: false,
      ack_status: "lost",
      reason: "lost_ack_unreconciled",
    };
  }
  return {
    accepted: true,
    ack_status: "acked",
    reason: "ok",
  };
}
