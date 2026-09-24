/** Claves de permiso válidas para un Role (issue #72). */
export const PERMISSIONS = [
  {
    key: "catalog.write",
    label: "Editar catálogo",
    description: "General, marca, modelos, categorías y promociones.",
  },
  {
    key: "quotes.manage",
    label: "Gestionar cotizaciones",
    description: "Cambiar estado y eliminar datos de un lead.",
  },
  {
    key: "integration.manage",
    label: "Integración",
    description: "Snippet, entorno, dominios autorizados y token.",
  },
  {
    key: "development.delete",
    label: "Eliminar desarrollo",
    description: "Borra un desarrollo completo: catálogo, cotizaciones, todo.",
  },
  {
    key: "members.manage",
    label: "Miembros y roles",
    description: "Invitar/quitar miembros, crear/editar/eliminar roles.",
  },
  {
    key: "billing.manage",
    label: "Facturación",
    description: "Cambiar de plan y gestionar tarjetas guardadas.",
  },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export function isPermissionKey(value: string): value is PermissionKey {
  return PERMISSIONS.some((p) => p.key === value);
}

/** Roles semilla de una cuenta nueva — editables/eliminables después, como cualquier Role (issue #72). */
export const DEFAULT_ROLE_SEEDS: { name: string; permissions: PermissionKey[] }[] = [
  { name: "Administrador", permissions: PERMISSIONS.map((p) => p.key) },
  { name: "Editor de catálogo", permissions: ["catalog.write", "quotes.manage"] },
  { name: "Solo lectura", permissions: [] },
];
