"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyTheme, getCurrentTheme, type Theme } from "@/lib/theme";

/**
 * Botón sol/luna para cambiar entre modo claro y oscuro (issue #57). El
 * ícono muestra el destino del click (sol = va a claro, luna = va a
 * oscuro), como en el resto de togglers de tema comunes.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // El script inline en layout.tsx ya fijó data-theme en <html> antes
    // del primer paint (para no parpadear) — este efecto solo sincroniza
    // el estado de React con ese atributo externo tras hidratar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(getCurrentTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
