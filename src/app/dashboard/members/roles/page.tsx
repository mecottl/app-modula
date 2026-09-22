import { Info, Pencil, Plus } from "lucide-react";
import { requirePermission } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { createRole, updateRole, deleteRole } from "@/lib/actions/roles";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { FormDialog } from "@/components/ui/form-dialog";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ValidatedInput } from "@/components/ui/validated-input";

export const dynamic = "force-dynamic";

function PermissionCheckboxes({ selected }: { selected?: PermissionKey[] }) {
  const selectedSet = new Set(selected ?? []);
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm">Permisos</legend>
      {PERMISSIONS.map((p) => (
        <label key={p.key} className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="permissions" value={p.key} defaultChecked={selectedSet.has(p.key)} />
          {p.label}
          <span className="group relative inline-flex">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 w-56 -translate-x-1/2 scale-95 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground opacity-0 shadow-md transition-[opacity,transform] duration-150 group-hover:scale-100 group-hover:opacity-100"
            >
              {p.description}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  // La página misma exige el permiso — un miembro sin members.manage no
  // puede ni ver qué roles/permisos existen en la cuenta.
  const { accountId } = await requirePermission("members.manage");
  const roles = await prisma.role.findMany({
    where: { accountId },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <ToastFromParams ok={ok} error={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Roles</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Crea los roles que necesites y decide qué puede hacer cada uno.
          </p>
        </div>
        <FormDialog
          title="Crear rol"
          trigger={
            <Button size="sm" className="gap-2 rounded-full">
              <Plus className="h-4 w-4" />
              Nuevo rol
            </Button>
          }
        >
          <form action={createRole} className="flex flex-col gap-4">
            <ValidatedInput label="Nombre" name="name" required maxLength={60} autoFocus />
            <PermissionCheckboxes />
            <SubmitButton className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Crear
            </SubmitButton>
          </form>
        </FormDialog>
      </div>

      <ul className="flex flex-col gap-3">
        {roles.map((role) => (
          <li
            key={role.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
          >
            <div>
              <p className="font-medium">{role.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {role.permissions.length === 0
                  ? "Sin permisos (solo lectura)"
                  : `${role.permissions.length} permiso${role.permissions.length === 1 ? "" : "s"}`}{" "}
                · {role._count.members} miembro{role._count.members === 1 ? "" : "s"}
              </p>
            </div>
            <FormDialog
              title="Editar rol"
              trigger={
                <button
                  type="button"
                  aria-label="Editar rol"
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              }
            >
              <form action={updateRole.bind(null, role.id)} className="flex flex-col gap-4">
                <ValidatedInput label="Nombre" name="name" required maxLength={60} defaultValue={role.name} />
                <PermissionCheckboxes selected={role.permissions as PermissionKey[]} />
                <SubmitButton className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                  Guardar
                </SubmitButton>
              </form>
              <form action={deleteRole.bind(null, role.id)} className="mt-4 border-t border-border pt-4">
                <SubmitButton
                  disabled={role._count.members > 0}
                  title={role._count.members > 0 ? "Reasigna a sus miembros antes de eliminarlo" : undefined}
                  className="text-sm text-red-400 underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Eliminar rol
                </SubmitButton>
              </form>
            </FormDialog>
          </li>
        ))}
      </ul>
    </div>
  );
}
