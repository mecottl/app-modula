"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

const step1Schema = z.object({
  companyName: z.string().min(2).max(120),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export type CreateAccountError =
  | "invalid_companyName"
  | "invalid_name"
  | "invalid_email"
  | "invalid_password"
  | "email_taken";

export type CreateAccountResult = { success: true } | { success: false; error: CreateAccountError };

/**
 * Paso 1 del registro (src/app/register/register-wizard.tsx, paso 1 de
 * 2): crea la Account + el primer Member (ADMINISTRADOR) e inicia
 * sesión. El plan y el pago se eligen en el paso 2, en la misma
 * pantalla, con la ventana de tarjeta embebida
 * (src/components/billing/subscribe-flow.tsx) — nunca se activa un
 * plan de forma optimista aquí.
 */
export async function createAccount(formData: FormData): Promise<CreateAccountResult> {
  const parsed = step1Schema.safeParse({
    companyName: formData.get("companyName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const error: CreateAccountError =
      field === "companyName"
        ? "invalid_companyName"
        : field === "name"
          ? "invalid_name"
          : field === "email"
            ? "invalid_email"
            : "invalid_password";
    return { success: false, error };
  }

  const { companyName, name, email, password } = parsed.data;

  const existing = await prisma.member.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "email_taken" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.account.create({
    data: {
      name: companyName,
      members: {
        create: { name, email, passwordHash, role: "ADMINISTRADOR" },
      },
    },
  });

  await signIn("credentials", { email, password, redirect: false });

  return { success: true };
}
