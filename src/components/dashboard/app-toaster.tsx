"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { getCurrentTheme, type Theme } from "@/lib/theme";

/**
 * Envuelve el Toaster de sonner para que siga el tema activo (issue
 * #57) — sonner no lee `data-theme` por sí solo, así que observamos el
 * atributo en <html> y le pasamos el valor como prop.
 */
export function AppToaster() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const sync = () => setTheme(getCurrentTheme());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return <Toaster theme={theme} position="bottom-right" richColors />;
}
