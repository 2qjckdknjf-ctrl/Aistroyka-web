import { Suspense } from "react";
import { StakeholderInviteClient } from "./StakeholderInviteClient";

export default function StakeholderInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-aistroyka-text-tertiary" role="status">
          Loading…
        </div>
      }
    >
      <StakeholderInviteClient />
    </Suspense>
  );
}
