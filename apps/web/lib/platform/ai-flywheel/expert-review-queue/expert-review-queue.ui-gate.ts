/**
 * UI gate for expert review admin page.
 */

import { isExpertReviewAdminUiEnabled } from "./expert-review-queue.flags";

export function isExpertReviewQueueUiEnabled(): boolean {
  return isExpertReviewAdminUiEnabled();
}
