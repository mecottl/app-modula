/** Claves de permiso válidas para un Role (issue #72). */
export const PERMISSIONS = [
  { key: "catalog.write", label: "Editar catálogo (general, marca, modelos, acabados, extras, promociones)" },
  { key: "quotes.manage", label: "Gestionar cotizaciones (cambiar estado, eliminar datos de un lead)" },
  { key: "integration.manage", label: "Integración (snippet, entorno, dominios, token)" },
  { key: "development.delete", label: "Eliminar un desarrollo completo" },
  { key: "members.manage", label: "Miembros y roles (invitar/quitar miembros, crear/editar roles)" },
  { key: "billing.manage", label: "Facturación (plan, tarjetas)" },
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
