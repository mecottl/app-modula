export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "modula-theme";

/**
 * Script inyectado antes del primer paint (ver src/app/layout.tsx) para
 * fijar `data-theme` en <html> sin parpadeo: localStorage manda si el
 * usuario ya eligió, si no se respeta `prefers-color-scheme`, y si
 * tampoco hay eso se queda en oscuro (el default histórico de la app).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage puede fallar (modo privado, storage bloqueado) — el
    // toggle sigue funcionando para la sesión actual, solo no persiste.
  }
}
