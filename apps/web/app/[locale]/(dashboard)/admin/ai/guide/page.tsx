import { Card } from "@/components/ui";
import { AIGuideAnalyticsClient } from "./AIGuideAnalyticsClient";

export default function AdminAIGuideAnalyticsPage() {
  return (
    <>
      <Card className="mb-6 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-bold tracking-tight text-aistroyka-text-primary sm:text-aistroyka-title">
          AI Guide Analytics
        </h1>
        <p className="mt-1 text-aistroyka-subheadline text-aistroyka-text-secondary">
          Adoption and execution quality for the in-product AI Guide (open, ask, click-through, completion).
        </p>
      </Card>
      <AIGuideAnalyticsClient />
    </>
  );
}

