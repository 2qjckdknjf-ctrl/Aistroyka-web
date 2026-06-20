import { BuildStamp } from "@/components/BuildStamp";
import { PublicAmbientField } from "@/components/public/PublicAmbientField";

/**
 * Auth layout: login/register. Includes build marker so unauthenticated users
 * can visually confirm deployed build (matches /api/health buildStamp.sha7).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-ambient-shell relative flex min-h-screen flex-col">
      <PublicAmbientField />
      <main className="relative z-10 flex-1">{children}</main>
      <footer
        className="relative z-10 mt-auto py-2 text-center text-aistroyka-caption text-aistroyka-text-tertiary"
        aria-hidden="true"
      >
        <BuildStamp />
      </footer>
    </div>
  );
}
