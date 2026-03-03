import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 px-4">
      <h1 className="text-xl font-bold text-aistroyka-text-primary">Page not found</h1>
      <p className="text-center text-aistroyka-text-secondary">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <Link href="/" className="btn-primary">
        Go home
      </Link>
    </div>
  );
}
