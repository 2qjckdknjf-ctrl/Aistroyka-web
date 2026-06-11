import Link from "next/link";
import { NavLogout } from "./NavLogout";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/billing", label: "Billing" },
  { href: "/admin", label: "Admin" },
];

export function Nav({ userEmail }: { userEmail?: string }) {
  return (
    <nav className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-medium">
            Aistroyka
          </Link>
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="text-sm text-gray-500" title="Current tenant">
              {userEmail}
            </span>
          )}
          <NavLogout />
        </div>
      </div>
    </nav>
  );
}
