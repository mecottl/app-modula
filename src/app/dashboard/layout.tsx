import Link from "next/link";
import { signOut } from "@/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            MODULA
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/dashboard/developments" className="transition-colors hover:text-foreground">
              Desarrollos
            </Link>
            <Link href="/dashboard/members" className="transition-colors hover:text-foreground">
              Miembros
            </Link>
            <Link href="/dashboard/billing" className="transition-colors hover:text-foreground">
              Facturación
            </Link>
          </nav>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Cerrar sesión
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
