"use client";

import { useEffect, useState } from "react";

/**
 * Iframe del widget embebido dentro de Integración (issue #41), para que
 * la desarrolladora lo vea sin salir del dashboard ni copiar el snippet.
 * Escucha el mismo `postMessage` de auto-ajuste de altura que el snippet
 * público instala en el sitio real.
 */
export function WidgetLivePreview({ src, slug }: { src: string; slug: string }) {
  const [height, setHeight] = useState(560);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "modula:resize" && event.data.slug === slug) {
        setHeight(event.data.height);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [slug]);

  return (
    <iframe
      src={src}
      style={{ width: "100%", height, border: 0, display: "block" }}
      title="Vista previa en vivo del widget"
    />
  );
}
