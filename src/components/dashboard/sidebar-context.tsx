"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type DevelopmentNavTab = { href: string; label: string };

export type DevelopmentNav = {
  id: string;
  name: string;
  tabs: DevelopmentNavTab[];
};

type SidebarContextValue = {
  developmentNav: DevelopmentNav | null;
  setDevelopmentNav: (nav: DevelopmentNav | null) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * El layout de un desarrollo específico (developments/[id]/layout.tsx)
 * vive anidado varios niveles por debajo del Sidebar (que se renderiza
 * una sola vez en dashboard/layout.tsx). Para que sus pestañas
 * (Catálogo, Acabados, etc.) aparezcan DENTRO del sidebar como
 * subcategoría desplegable en vez de una barra de tabs aparte en el
 * contenido, se anuncian vía este contexto compartido en vez de props
 * — el layout del desarrollo no puede pasarle props directamente al
 * Sidebar porque no lo renderiza él.
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [developmentNav, setDevelopmentNav] = useState<DevelopmentNav | null>(null);
  return (
    <SidebarContext.Provider value={{ developmentNav, setDevelopmentNav }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebarContext debe usarse dentro de SidebarProvider");
  return ctx;
}
