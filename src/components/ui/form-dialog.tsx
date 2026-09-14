"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./dialog";

/**
 * Envuelve un <form action={serverAction}> existente en un modal, en vez
 * de mostrarlo siempre visible al fondo de la lista (issue "mejorar la
 * distribución de agregar/actualizar catálogo, extras, etc."). El form
 * en sí no cambia — sigue siendo una Server Action normal con
 * redirect+revalidatePath — así que al enviarse y redirigir de vuelta a
 * la misma página, este componente se remonta con `open` en `false` por
 * defecto y el modal se cierra solo.
 */
const SIZE_CLASSES = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
} as const;

export function FormDialog({
  trigger,
  title,
  description,
  size = "md",
  children,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  size?: keyof typeof SIZE_CLASSES;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={SIZE_CLASSES[size]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
