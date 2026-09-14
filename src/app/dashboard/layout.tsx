import { LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AppToaster } from "@/components/dashboard/app-toaster";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarFooter = (
    <div className="flex items-center gap-2">
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
        className="min-w-0 flex-1"
      >
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </form>
      <ThemeToggle />
    </div>
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar footer={sidebarFooter} />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
      <AppToaster />
    </SidebarProvider>
  );
}
