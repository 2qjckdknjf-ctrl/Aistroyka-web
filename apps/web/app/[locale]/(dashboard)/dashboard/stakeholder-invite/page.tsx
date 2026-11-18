import { Suspense } from "react";
import { StakeholderInviteCanonPage } from "./StakeholderInviteCanonPage";

export default function StakeholderInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="canon-glass p-8 text-center text-[var(--canon-text-muted)]" role="status">
          Loading…
        </div>
      }
    >
      <StakeholderInviteCanonPage />
    </Suspense>
  );
}
