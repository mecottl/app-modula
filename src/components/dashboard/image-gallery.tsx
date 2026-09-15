"use client";

import { useRef, useState, useTransition } from "react";
import { ImageIcon, Plus, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Galería de imágenes de un elemento del catálogo (Model/FinishLevel/
 * Extra — issue #47). A diferencia de LogoUploader (una sola imagen que
 * se reemplaza), aquí se acumulan varias: miniaturas con botón de
 * quitar, más un botón para agregar otra.
 */
export function ImageGallery({
  images,
  addAction,
  removeAction,
}: {
  images: string[];
  addAction: (formData: FormData) => Promise<string[]>;
  removeAction: (url: string) => Promise<string[]>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(images);
  const [pending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("image", file);
    startTransition(async () => {
      try {
        const updated = await addAction(formData);
        setItems(updated);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  function handleRemove(url: string) {
    startTransition(async () => {
      try {
        const updated = await removeAction(url);
        setItems(updated);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo quitar la imagen");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">Imágenes</span>
      <div className="flex flex-wrap gap-2">
        {items.map((url) => (
          <div key={url} className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen subida por el usuario, no un asset del proyecto */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              disabled={pending}
              aria-label="Quitar imagen"
              className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-foreground opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          aria-label="Agregar imagen"
          className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
        >
          {pending ? <ImageIcon className="h-5 w-5 animate-pulse" /> : <Plus className="h-5 w-5" />}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />
      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP o SVG, máx. 5 MB cada una.</p>
    </div>
  );
}
