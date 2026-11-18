
import { Link } from "@/i18n/navigation";
import { OperatorWorkbenchClient } from "./OperatorWorkbenchClient";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

export default function AdminOperatorPage() {
  return (
    <>
      <DashboardGlassCard className="mb-6 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          Operator Workbench
        </h1>
        <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Full operator surface for running platform operations, validating runtime health, and shipping controlled changes.
        </p>
        <p className="mt-3">
          <Link href="/admin" className="text-aistroyka-subheadline font-medium text-aistroyka-accent hover:underline">
            ← Back to admin
          </Link>
        </p>
      </DashboardGlassCard>
      <OperatorWorkbenchClient />
    </>
  );
}
