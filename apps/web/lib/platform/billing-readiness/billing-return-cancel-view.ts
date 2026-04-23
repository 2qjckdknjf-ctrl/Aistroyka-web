/**
 * Billing return/cancel page view model (Step 16).
 * Pure copy/state. No billing activation. Success redirect ≠ subscription activation.
 */

export interface ReturnPageCopy {
  title: string;
  message: string;
  awaitingConfirmation: true;
  backHref: string;
}

export interface CancelPageCopy {
  title: string;
  message: string;
  cancelled: true;
  backHref: string;
}

/**
 * Copy for success return page.
 * User sees "awaiting confirmation" — no immediate entitlement change.
 */
export function getReturnPageCopy(): ReturnPageCopy {
  return {
    title: "Checkout initiated",
    message:
      "Your payment is being processed. Subscription activation will be confirmed shortly. " +
      "No immediate entitlement change — we will update your plan once the provider confirms.",
    awaitingConfirmation: true,
    backHref: "/billing",
  };
}

/**
 * Copy for cancel return page.
 * User sees "cancelled" — no payment, no activation.
 */
export function getCancelPageCopy(): CancelPageCopy {
  return {
    title: "Checkout cancelled",
    message: "No payment was made. Your plan remains unchanged.",
    cancelled: true,
    backHref: "/billing",
  };
}
