"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSessionAccount } from "@/lib/tenant";

function back(message?: string, kind: "error" | "ok" = "error") {
  const qs = message ? `?${kind}=${encodeURIComponent(message)}` : "";
  redirect(`/dashboard/account${qs}`);
}

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
});

export async function updateAccountProfile(formData: FormData) {
  const { memberId } = await requireSessionAccount();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) back("Revisa los campos del formulario");

  const existing = await prisma.member.findUnique({ where: { email: parsed.data!.email } });
  if (existing && existing.id !== memberId) back("Ese correo ya lo usa otra cuenta");

  await prisma.member.update({
    where: { id: memberId },
    data: { name: parsed.data!.name, email: parsed.data!.email },
  });

  revalidatePath("/dashboard/account");
  back("Datos actualizados.", "ok");
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas nuevas no coinciden",
  });

export async function updateAccountPassword(formData: FormData) {
  const { memberId } = await requireSessionAccount();

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) back(parsed.error.issues[0]?.message ?? "Revisa los campos del formulario");

  const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId } });
  const valid = await bcrypt.compare(parsed.data!.currentPassword, member.passwordHash);
  if (!valid) back("La contraseña actual no es correcta");

  const passwordHash = await bcrypt.hash(parsed.data!.newPassword, 10);
  await prisma.member.update({ where: { id: memberId }, data: { passwordHash } });

  back("Contraseña actualizada.", "ok");
}
