"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { Card, SectionHeader, Tabs, Tab, TabPanel, Skeleton, EmptyState } from "@/components/ui";

interface Project {
  id: string;
  name: string;
  tenant_id: string;
  created_at?: string;
}

interface Summary {
  activeWorkers: number;
  openReports: number;
  aiAnalyses: number;
}

export function DashboardProjectDetailClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("workers");

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/projects/${projectId}`, { credentials: "include" }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Not found"))
      ),
      fetch(`/api/v1/projects/${projectId}/summary`, { credentials: "include" }).then((r) =>
        r.ok ? r.json() : Promise.resolve({ data: { activeWorkers: 0, openReports: 0, aiAnalyses: 0 } })
      ),
    ])
      .then(([projRes, sumRes]) => {
        setProject((projRes as { data: Project }).data);
        setSummary((sumRes as { data: Summary }).data);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setProject(null);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading && !project) {
    return (
      <Card>
        <Skeleton lines={4} />
      </Card>
    );
  }

  if (error || !project) {
    return (
      <Card>
        <EmptyState
          icon={<span className="text-2xl">⚠️</span>}
          title="Project not found"
          subtitle={error ?? "You may not have access to this project."}
          action={<Link href="/dashboard/projects" className="text-aistroyka-accent hover:underline">← Back to projects</Link>}
        />
      </Card>
    );
  }

  const sum = summary ?? { activeWorkers: 0, openReports: 0, aiAnalyses: 0 };

  return (
    <>
      <div className="mb-4">
        <Link
          href="/dashboard/projects"
          className="text-aistroyka-subheadline text-aistroyka-accent hover:underline focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2 rounded"
        >
          ← Projects
        </Link>
      </div>
      <SectionHeader title={project.name} subtitle={`Project overview and tabs.`} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6" aria-label="Project summary">
        <Card className="border-l-4 border-l-aistroyka-accent">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Active workers</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{sum.activeWorkers}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-info">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Open reports</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{sum.openReports}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-success">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">AI analyses</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">{sum.aiAnalyses}</p>
        </Card>
        <Card className="border-l-4 border-l-aistroyka-warning">
          <p className="text-aistroyka-caption font-medium uppercase tracking-wide text-aistroyka-text-tertiary">Pending uploads</p>
          <p className="mt-1 text-aistroyka-title3 font-semibold text-aistroyka-text-primary">—</p>
        </Card>
      </section>

      <Card>
        <Tabs aria-label="Project sections">
          <Tab id="tab-workers" selected={activeTab === "workers"} onSelect={() => setActiveTab("workers")} aria-controls="panel-workers">
            Workers
          </Tab>
          <Tab id="tab-reports" selected={activeTab === "reports"} onSelect={() => setActiveTab("reports")} aria-controls="panel-reports">
            Reports
          </Tab>
          <Tab id="tab-uploads" selected={activeTab === "uploads"} onSelect={() => setActiveTab("uploads")} aria-controls="panel-uploads">
            Uploads
          </Tab>
          <Tab id="tab-ai" selected={activeTab === "ai"} onSelect={() => setActiveTab("ai")} aria-controls="panel-ai">
            AI
          </Tab>
        </Tabs>
        <TabPanel id="panel-workers" selected={activeTab === "workers"} aria-labelledby="tab-workers">
          <EmptyState icon={<span className="text-2xl">👷</span>} title="Workers" subtitle="Worker list for this project will be built in Stage 3." />
        </TabPanel>
        <TabPanel id="panel-reports" selected={activeTab === "reports"} aria-labelledby="tab-reports">
          <EmptyState icon={<span className="text-2xl">📋</span>} title="Reports" subtitle="Reports for this project will be built in Stage 3." />
        </TabPanel>
        <TabPanel id="panel-uploads" selected={activeTab === "uploads"} aria-labelledby="tab-uploads">
          <EmptyState icon={<span className="text-2xl">📤</span>} title="Uploads" subtitle="Upload sessions for this project will be built in Stage 4." />
        </TabPanel>
        <TabPanel id="panel-ai" selected={activeTab === "ai"} aria-labelledby="tab-ai">
          <EmptyState icon={<span className="text-2xl">🤖</span>} title="AI" subtitle="AI analyses for this project will be built in Stage 6." />
        </TabPanel>
      </Card>
    </>
  );
}
