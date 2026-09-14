"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Building2, ChevronDown, CreditCard, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { getCurrentTheme } from "@/lib/theme";
import { DEVELOPMENT_TABS } from "@/lib/developmentTabs";

type DevelopmentRow = { id: string; name: string };

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

/**
 * Árbol de desarrollos dentro de "Desarrollos" (issue "que se vea como
 * un árbol"): cada desarrollo es su propio acordeón, y solo uno puede
 * estar desplegado a la vez (abrir otro cierra el anterior) — mismo
 * principio que un árbol de archivos. Al abrirlo se ven sus pestañas
 * completas (Catálogo, Acabados, etc.), igual que antes se veían solo
 * para el desarrollo que se estuviera viendo.
 */
function DevelopmentTree({
  developments,
  pathname,
  onNavigate,
}: {
  developments: DevelopmentRow[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const activeDevId = useMemo(() => {
    const match = pathname.match(/^\/dashboard\/developments\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const [openId, setOpenId] = useState<string | null>(activeDevId);
  // Al navegar a otro desarrollo (ej. desde un link fuera del árbol),
  // ese pasa a ser el único abierto, sin pisar que el usuario haya
  // cerrado manualmente el que ya estaba activo.
  const [trackedActive, setTrackedActive] = useState(activeDevId);
  if (activeDevId !== trackedActive) {
    setTrackedActive(activeDevId);
    if (activeDevId) setOpenId(activeDevId);
  }

  if (developments.length === 0) {
    return <p className="px-2 py-1 text-xs text-muted-foreground">Sin desarrollos aún.</p>;
  }

  return (
    <>
      {developments.map((dev) => {
        const isOpen = openId === dev.id;
        return (
          <div key={dev.id}>
            <div className="flex items-center gap-1">
              <Link
                href={`/dashboard/developments/${dev.id}/general`}
                onClick={onNavigate}
                className={cn(
                  "flex-1 truncate rounded-md px-2 py-2 text-sm transition-colors",
                  dev.id === activeDevId
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {dev.name}
              </Link>
              <button
                type="button"
                onClick={() => setOpenId((v) => (v === dev.id ? null : dev.id))}
                aria-label={isOpen ? `Contraer ${dev.name}` : `Expandir ${dev.name}`}
                aria-expanded={isOpen}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
              </button>
            </div>
            {isOpen && (
              <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-border pl-3">
                {DEVELOPMENT_TABS.map((tab) => {
                  const href = `/dashboard/developments/${dev.id}/${tab.href}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={tab.href}
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        "truncate rounded-md px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function NavSection({
  item,
  pathname,
  onNavigate,
  customTree,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  customTree?: ReactNode;
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
  const hasChildren = Boolean(item.children?.length) || Boolean(customTree);

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
        <div className="ml-4 mt-1 flex flex-col gap-1.5 border-l border-border pl-3">
          {customTree ??
            item.children!.map((child) => {
              const active = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "truncate rounded-md px-2 py-2 text-sm transition-colors",
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

function SidebarNav({
  pathname,
  developments,
  onNavigate,
}: {
  pathname: string;
  developments: DevelopmentRow[];
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {STATIC_NAV.map((item) => (
        <NavSection
          key={item.href}
          item={item}
          pathname={pathname}
          onNavigate={onNavigate}
          customTree={
            item.href === "/dashboard/developments" ? (
              <DevelopmentTree developments={developments} pathname={pathname} onNavigate={onNavigate} />
            ) : undefined
          }
        />
      ))}
    </nav>
  );
}

export function Sidebar({ developments, footer }: { developments: DevelopmentRow[]; footer?: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/LOGO-BLANCO.svg");

  useEffect(() => {
    const sync = () => setLogoSrc(getCurrentTheme() === "light" ? "/LOGO-NEGRO.svg" : "/LOGO-BLANCO.svg");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Barra superior solo en mobile: logo + botón de menú */}
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="MODULA" className="h-3.5 w-auto" />
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
            <SidebarNav pathname={pathname} developments={developments} onNavigate={() => setMobileOpen(false)} />
            {footer && <div className="border-t border-border p-3">{footer}</div>}
          </div>
        </div>
      )}

      {/* Sidebar fijo en desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background md:flex">
        <Link href="/dashboard" className="flex items-center px-5 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="MODULA" className="h-4 w-auto" />
        </Link>
        <SidebarNav pathname={pathname} developments={developments} />
        {footer && <div className="border-t border-border p-3">{footer}</div>}
      </aside>
    </>
  );
}
