import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { inviteMember, removeMember } from "@/lib/actions/members";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { FormDialog } from "@/components/ui/form-dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

const inputClass =
  "rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground";

export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const { accountId, memberId, permissions } = await requireSessionAccount();
  const canManage = permissions.includes("members.manage");
  const [members, roles] = await Promise.all([
    prisma.member.findMany({
      where: { accountId },
      include: { role: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({ where: { accountId }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <ToastFromParams ok={ok} error={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Miembros del equipo</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Los roles y sus permisos se administran en{" "}
            <Link href="/dashboard/members/roles" className="underline underline-offset-4 hover:text-foreground">
              Roles
            </Link>
            .
          </p>
        </div>
        {canManage && (
          <FormDialog
            title="Invitar miembro"
            description="Se le manda una contraseña temporal por correo."
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
              <Select
                label="Rol"
                name="roleId"
                defaultValue={roles.find((r) => r.name === "Solo lectura")?.id ?? roles[0]?.id}
                options={roles.map((r) => ({ value: r.id, label: r.name }))}
              />
              <SubmitButton className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Invitar
              </SubmitButton>
            </form>
          </FormDialog>
        )}
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
                {m.email} · {m.role.name}
              </p>
            </div>
            {canManage && m.id !== memberId && (
              <form action={removeMember.bind(null, m.id)}>
                <SubmitButton className="text-xs text-red-400 underline underline-offset-4">Quitar</SubmitButton>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
