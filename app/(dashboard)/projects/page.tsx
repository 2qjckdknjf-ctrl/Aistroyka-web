import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateProjectForm } from "./CreateProjectForm";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <CreateProjectForm />
      </div>
      {projects && projects.length > 0 ? (
        <div className="mt-4 overflow-x-auto border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/projects/${p.id}`}
                      className="text-gray-900 underline hover:no-underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">
          No projects. Create one using the form above.
        </p>
      )}
    </main>
  );
}
