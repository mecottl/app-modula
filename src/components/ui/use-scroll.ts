"use client";

import * as React from "react";

/**
 * Devuelve `true` cuando la página se ha desplazado más allá de
 * `threshold` píxeles. Usado por Header (header-2.tsx) para activar el
 * fondo con blur y el borde al hacer scroll.
 */
export function useScroll(threshold = 0) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
