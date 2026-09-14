import { UserPlus } from "lucide-react";
import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { inviteMember, removeMember } from "@/lib/actions/members";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { FormDialog } from "@/components/ui/form-dialog";
import { Button } from "@/components/ui/button";

const inputClass =
  "rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  EDITOR_CATALOGO: "Editor de catálogo",
  SOLO_LECTURA: "Solo lectura",
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const { accountId, memberId } = await requireSessionAccount();
  const members = await prisma.member.findMany({
    where: { accountId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <ToastFromParams ok={ok} error={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Miembros del equipo</h1>
        <FormDialog
          title="Invitar miembro"
          description="Solo un administrador puede invitar o quitar miembros."
          trigger={
            <Button size="sm" className="gap-2 rounded-full">
              <UserPlus className="h-4 w-4" />
              Invitar miembro
            </Button>
          }
        >
          <form action={inviteMember} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              Nombre
              <input name="name" required maxLength={120} autoFocus className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Correo
              <input name="email" type="email" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Rol
              <select name="role" defaultValue="SOLO_LECTURA" className={inputClass}>
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="EDITOR_CATALOGO">Editor de catálogo</option>
                <option value="SOLO_LECTURA">Solo lectura</option>
              </select>
            </label>
            <button
              type="submit"
              className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Invitar
            </button>
          </form>
        </FormDialog>
      </div>

      <ul className="flex flex-col gap-3">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-xl border border-border p-4 text-sm"
          >
            <div>
              <p className="font-medium">
                {m.name} {m.id === memberId && <span className="text-muted-foreground">(tú)</span>}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {m.email} · {roleLabels[m.role] ?? m.role}
              </p>
            </div>
            {m.id !== memberId && (
              <form action={removeMember.bind(null, m.id)}>
                <button type="submit" className="text-xs text-red-400 underline underline-offset-4">
                  Quitar
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
