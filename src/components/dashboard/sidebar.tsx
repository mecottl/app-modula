"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Building2, ChevronDown, CreditCard, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "./sidebar-context";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";

type NavChild = { href: string; label: string };
type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
};

const STATIC_NAV: NavItem[] = [
  { href: "/dashboard/developments", label: "Desarrollos", icon: Building2 },
  { href: "/dashboard/members", label: "Miembros", icon: Users },
  {
    href: "/dashboard/billing",
    label: "Facturación",
    icon: CreditCard,
    children: [
      { href: "/dashboard/billing", label: "Resumen" },
      { href: "/dashboard/billing/cards", label: "Tarjetas" },
    ],
  },
];

function NavSection({
  item,
  contextLabel,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  contextLabel?: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActiveBranch = pathname === item.href || pathname.startsWith(item.href + "/");
  const [open, setOpen] = useState(isActiveBranch);
  // Reabre la sección automáticamente al navegar a una ruta dentro de
  // ella (ej. al hacer clic en un link de otra sección), sin pisar que
  // el usuario la haya cerrado manualmente mientras ya estaba activa.
  const [trackedActive, setTrackedActive] = useState(isActiveBranch);
  if (isActiveBranch !== trackedActive) {
    setTrackedActive(isActiveBranch);
    if (isActiveBranch) setOpen(true);
  }

  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);

  return (
    <div>
      <div className="flex items-center gap-1">
        <Link
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
            isActiveBranch && !hasChildren
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? `Contraer ${item.label}` : `Expandir ${item.label}`}
            aria-expanded={open}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>

      {hasChildren && open && (
        <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
          {contextLabel && (
            <p className="truncate px-2 py-1 text-xs font-medium text-foreground">{contextLabel}</p>
          )}
          {item.children!.map((child) => {
            const active = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "truncate rounded-md px-2 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { developmentNav } = useSidebarContext();

  const nav: NavItem[] = STATIC_NAV.map((item) => {
    if (item.href !== "/dashboard/developments" || !developmentNav) return item;
    return {
      ...item,
      children: developmentNav.tabs.map((tab) => ({
        href: `/dashboard/developments/${developmentNav.id}/${tab.href}`,
        label: tab.label,
      })),
    };
  });

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {nav.map((item) => (
        <NavSection
          key={item.href}
          item={item}
          pathname={pathname}
          onNavigate={onNavigate}
          contextLabel={item.href === "/dashboard/developments" ? developmentNav?.name : undefined}
        />
      ))}
    </nav>
  );
}

export function Sidebar({ footer }: { footer?: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Barra superior solo en mobile: logo + botón de menú */}
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/LOGO-BLANCO.svg" alt="MODULA" className="h-3.5 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          className="p-1 text-foreground"
        >
          <MenuToggleIcon open={mobileOpen} className="h-6 w-6" />
        </button>
      </div>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex h-full w-72 flex-col border-r border-border bg-background">
            <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            {footer && <div className="border-t border-border p-3">{footer}</div>}
          </div>
        </div>
      )}

      {/* Sidebar fijo en desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background md:flex">
        <Link href="/dashboard" className="flex items-center px-5 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/LOGO-BLANCO.svg" alt="MODULA" className="h-4 w-auto" />
        </Link>
        <SidebarNav pathname={pathname} />
        {footer && <div className="border-t border-border p-3">{footer}</div>}
      </aside>
    </>
  );
}
