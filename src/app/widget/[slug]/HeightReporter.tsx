"use client";

import { useEffect, useRef } from "react";

/**
 * Informa la altura real del contenido al documento padre vía
 * `window.postMessage` (README.md sección 9.2), para que el `iframe` del
 * sitio anfitrión se redimensione y se evite el scroll doble.
 */
export function HeightReporter({ slug }: { slug: string }) {
  const lastHeight = useRef(0);

  useEffect(() => {
    const report = () => {
      const height = document.documentElement.scrollHeight;
      if (height !== lastHeight.current) {
        lastHeight.current = height;
        window.parent.postMessage({ type: "modula:resize", slug, height }, "*");
      }
    };

    report();
    const observer = new ResizeObserver(report);
    observer.observe(document.documentElement);
    window.addEventListener("load", report);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", report);
    };
  }, [slug]);

  return null;
}
