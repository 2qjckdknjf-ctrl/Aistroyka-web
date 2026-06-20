import { GlassLink } from "@/components/design/liquid-glass";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 px-4">
      <div className="card-elevated max-w-md text-center">
        <h1 className="text-xl font-bold text-aistroyka-text-primary">Page not found</h1>
        <p className="mt-3 text-aistroyka-text-secondary">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <GlassLink href="/" className="mt-6 inline-block">
          Go home
        </GlassLink>
      </div>
    </div>
  );
}
