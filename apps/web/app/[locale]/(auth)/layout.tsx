import { BuildStamp } from "@/components/BuildStamp";

/**
 * Auth layout: login/register. Includes build marker so unauthenticated users
 * can visually confirm deployed build (matches /api/health buildStamp.sha7).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
      <footer
        className="mt-auto py-2 text-center text-aistroyka-caption text-aistroyka-text-tertiary"
        aria-hidden="true"
      >
        <BuildStamp />
      </footer>
    </div>
  );
}
