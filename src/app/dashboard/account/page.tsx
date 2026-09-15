import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { updateAccountProfile, updateAccountPassword } from "@/lib/actions/account";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { ValidatedInput } from "@/components/ui/validated-input";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const { memberId } = await requireSessionAccount();
  const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId } });

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <ToastFromParams ok={ok} error={error} />

      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tu cuenta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estos datos son personales, de tu usuario, no de la desarrolladora.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-medium">Datos personales</h2>
        <form action={updateAccountProfile} className="flex flex-col gap-4">
          <ValidatedInput label="Nombre" name="name" required maxLength={120} defaultValue={member.name} />
          <ValidatedInput label="Correo" name="email" type="email" required defaultValue={member.email} />
          <button
            type="submit"
            className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Guardar
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="font-medium">Cambiar contraseña</h2>
        <form action={updateAccountPassword} className="flex flex-col gap-4">
          <ValidatedInput label="Contraseña actual" name="currentPassword" type="password" required />
          <ValidatedInput label="Contraseña nueva" name="newPassword" type="password" required minLength={8} />
          <ValidatedInput
            label="Confirmar contraseña nueva"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
          />
          <button
            type="submit"
            className="self-start rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground"
          >
            Actualizar contraseña
          </button>
        </form>
      </section>
    </div>
  );
}
