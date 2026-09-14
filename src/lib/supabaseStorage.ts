import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase Storage con la service role key (bypassa RLS) —
 * separado de Prisma, que es quien maneja la base de datos en el resto
 * del proyecto. Solo se usa server-side para subir archivos (logo del
 * desarrollo y, desde issue #47, imágenes de Model/FinishLevel/Extra).
 */
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    : null;

export const MEDIA_BUCKET = "development-media";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

async function uploadImage(path: string, file: File): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error("Storage no configurado (falta SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato de imagen no soportado (usa PNG, JPG, WEBP o SVG)");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("La imagen no puede pesar más de 5 MB");
  }

  const { error } = await supabaseAdmin.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) {
    throw new Error(`No se pudo subir la imagen: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadDevelopmentImage(developmentId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  return uploadImage(`${developmentId}/logo-${Date.now()}.${ext}`, file);
}

/**
 * Imagen de un elemento del catálogo (Model/FinishLevel/Extra) — issue
 * #47 "subir renders/imágenes por modelo, acabado y extra". A
 * diferencia del logo (una sola imagen que se reemplaza), cada entidad
 * guarda un arreglo de URLs (`imageUrls`), así que el archivo se sube
 * con un nombre único y se agrega a la lista en vez de sobrescribir.
 */
export async function uploadCatalogImage(
  developmentId: string,
  category: "models" | "finishes" | "extras",
  entityId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  return uploadImage(`${developmentId}/${category}/${entityId}/${Date.now()}.${ext}`, file);
}
