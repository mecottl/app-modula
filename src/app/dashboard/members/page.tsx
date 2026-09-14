import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { inviteMember, removeMember } from "@/lib/actions/members";
import { ToastFromParams } from "@/components/ui/toast-from-params";

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
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Miembros del equipo</h1>
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

      <section className="rounded-xl border border-border p-6">
        <h2 className="font-medium">Invitar miembro</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Solo un administrador puede invitar o quitar miembros.
        </p>
        <form action={inviteMember} className="mt-4 flex flex-col gap-4 sm:max-w-sm">
          <label className="flex flex-col gap-1.5 text-sm">
            Nombre
            <input
              name="name"
              required
              maxLength={120}
              className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Correo
            <input
              name="email"
              type="email"
              required
              className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Rol
            <select
              name="role"
              defaultValue="SOLO_LECTURA"
              className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
            >
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
      </section>
    </div>
  );
}
