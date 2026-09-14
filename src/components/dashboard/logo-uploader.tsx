"use client";

import { useRef, useState, useTransition } from "react";
import { ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LogoUploader({
  currentLogoUrl,
  uploadAction,
}: {
  currentLogoUrl: string | null;
  uploadAction: (formData: FormData) => Promise<string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [pending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    const formData = new FormData();
    formData.set("logo", file);
    startTransition(async () => {
      try {
        const uploadedUrl = await uploadAction(formData);
        setPreview(uploadedUrl);
        toast.success("Logo actualizado.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen");
        setPreview(currentLogoUrl);
      } finally {
        URL.revokeObjectURL(localPreview);
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview de una imagen subida por el usuario, no un asset del proyecto
          <img src={preview} alt="Logo" className="h-full w-full object-contain" />
        ) : (
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        )}
      </span>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {pending ? "Subiendo…" : "Subir imagen"}
        </Button>
        <p className="mt-1.5 text-xs text-muted-foreground">PNG, JPG, WEBP o SVG — máx. 5 MB.</p>
      </div>
    </div>
  );
}
