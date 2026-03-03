import { SkeletonCard } from "@/components/ui/Skeleton";

export default function GovernanceLoading() {
  return (
    <main className="mx-auto max-w-4xl px-aistroyka-4 py-aistroyka-8">
      <div className="mb-aistroyka-6 h-6 w-48 rounded bg-aistroyka-text-tertiary/20" />
      <div className="mb-aistroyka-8 h-16 w-full rounded bg-aistroyka-text-tertiary/20" />
      <div className="space-y-aistroyka-6">
        <SkeletonCard className="mb-aistroyka-6" />
        <SkeletonCard className="mb-aistroyka-6" />
        <SkeletonCard />
      </div>
    </main>
  );
}
