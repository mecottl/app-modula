import { requireSessionAccount } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import {
  updateAccountName,
  requestEmailChange,
  cancelEmailChange,
  updateAccountPassword,
} from "@/lib/actions/account";
import { ToastFromParams } from "@/components/ui/toast-from-params";
import { ValidatedInput } from "@/components/ui/validated-input";
import { SubmitButton } from "@/components/ui/submit-button";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const { memberId } = await requireSessionAccount();
  const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId } });
  const pendingEmailChange = await prisma.verificationToken.findFirst({
    where: { memberId, type: "EMAIL_CHANGE", usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

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
        <h2 className="font-medium">Nombre</h2>
        <form action={updateAccountName} className="flex flex-col gap-4">
          <ValidatedInput label="Nombre" name="name" required maxLength={120} defaultValue={member.name} />
          <SubmitButton className="self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            Guardar
          </SubmitButton>
        </form>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="font-medium">Correo</h2>
        <p className="text-sm text-muted-foreground">
          Actual: <span className="text-foreground">{member.email}</span>
        </p>

        {pendingEmailChange ? (
          <div className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
            <p>
              Tienes un cambio de correo pendiente a{" "}
              <span className="font-medium text-foreground">{pendingEmailChange.payload}</span>. Confirma
              desde el enlace que te mandamos a esa dirección.
            </p>
            <form action={cancelEmailChange}>
              <SubmitButton className="text-sm text-destructive underline underline-offset-4">
                Cancelar cambio
              </SubmitButton>
            </form>
          </div>
        ) : (
          <form action={requestEmailChange} className="flex flex-col gap-4">
            <ValidatedInput label="Correo nuevo" name="email" type="email" required placeholder={member.email} />
            <SubmitButton className="self-start rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground">
              Pedir cambio
            </SubmitButton>
          </form>
        )}
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
          <SubmitButton className="self-start rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground">
            Actualizar contraseña
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
