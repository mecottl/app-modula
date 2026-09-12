import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { inviteMember, removeMember } from "@/lib/actions/members";

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
      <div>
        <h1 className="text-xl font-semibold">Miembros del equipo</h1>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        {ok && <p className="mt-2 text-sm text-green-400">{ok}</p>}
      </div>

      <ul className="flex flex-col gap-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded border p-3 text-sm">
            <div>
              <p className="font-medium">
                {m.name} {m.id === memberId && "(tú)"}
              </p>
              <p className="text-muted-foreground">
                {m.email} — {roleLabels[m.role] ?? m.role}
              </p>
            </div>
            {m.id !== memberId && (
              <form action={removeMember.bind(null, m.id)}>
                <button type="submit" className="text-xs text-red-400 underline">
                  Quitar
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>

      <section className="rounded border p-4">
        <h2 className="font-medium">Invitar miembro</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Solo un administrador puede invitar o quitar miembros.
        </p>
        <form action={inviteMember} className="mt-3 flex flex-col gap-3 sm:max-w-sm">
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <input name="name" required maxLength={120} className="rounded border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Correo
            <input name="email" type="email" required className="rounded border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Rol
            <select name="role" defaultValue="SOLO_LECTURA" className="rounded border px-3 py-2">
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="EDITOR_CATALOGO">Editor de catálogo</option>
              <option value="SOLO_LECTURA">Solo lectura</option>
            </select>
          </label>
          <button type="submit" className="self-start rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
            Invitar
          </button>
        </form>
      </section>
    </div>
  );
}
