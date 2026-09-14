"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Las server actions del dashboard comunican el resultado redirigiendo
 * con `?ok=`/`?error=`/`?warning=` (patrón de progressive enhancement:
 * funciona incluso sin JS). Este componente muestra ese mensaje como
 * toast en vez de un párrafo de color fijo en la página (issue "UX:
 * feedback de guardado con toasts en vez de query params"), y limpia
 * el query param para que refrescar la página no lo vuelva a mostrar.
 */
export function ToastFromParams({
  ok,
  error,
  warning,
  info,
}: {
  ok?: string;
  error?: string;
  warning?: string;
  info?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    if (!ok && !error && !warning && !info) return;
    shown.current = true;

    if (error) toast.error(error);
    else if (warning) toast.warning(warning);
    else if (ok) toast.success(ok);
    else if (info) toast.info(info);

    router.replace(pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
