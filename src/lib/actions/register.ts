"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { stripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/baseUrl";

const planSchema = z.enum(["BASICO", "PROFESIONAL"]);

const registerSchema = z.object({
  companyName: z.string().min(2).max(120),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  plan: planSchema,
});

/**
 * Códigos cortos en vez de mensajes ya armados: la página de registro
 * (src/app/register/page.tsx) tiene su propio diseño de error por
 * código (icono + texto), en vez de reutilizar el texto plano del login.
 */
type RegisterErrorCode =
  | "invalid_companyName"
  | "invalid_name"
  | "invalid_email"
  | "invalid_password"
  | "invalid_plan"
  | "email_taken"
  | "stripe_unavailable";

function backToRegister(plan: string, code: RegisterErrorCode): never {
  redirect(`/register?plan=${encodeURIComponent(plan)}&error=${code}`);
}

/**
 * Alta de una nueva cuenta (README.md — landing "Planes"): crea la
 * Account + el primer Member (ADMINISTRADOR), inicia sesión, y manda
 * directo a Stripe Checkout para el plan elegido. El plan real de la
 * cuenta (`Account.plan`) solo se activa vía webhook cuando Stripe
 * confirma el pago — igual que en src/lib/actions/billing.ts, aquí
 * nunca se marca como pagado de forma optimista.
 */
export async function registerAccount(formData: FormData) {
  const rawPlan = formData.get("plan");
  const plan = typeof rawPlan === "string" ? rawPlan : "BASICO";

  const parsed = registerSchema.safeParse({
    companyName: formData.get("companyName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    plan: rawPlan,
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const code: RegisterErrorCode =
      field === "companyName"
        ? "invalid_companyName"
        : field === "name"
          ? "invalid_name"
          : field === "email"
            ? "invalid_email"
            : field === "password"
              ? "invalid_password"
              : "invalid_plan";
    backToRegister(plan, code);
  }
  const { companyName, name, email, password } = parsed.data!;
  const validPlan = parsed.data!.plan;

  const priceId = STRIPE_PRICE_IDS[validPlan];
  if (!priceId) {
    backToRegister(validPlan, "stripe_unavailable");
  }

  const existing = await prisma.member.findUnique({ where: { email } });
  if (existing) {
    backToRegister(validPlan, "email_taken");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const account = await prisma.account.create({
    data: {
      name: companyName,
      members: {
        create: {
          name,
          email,
          passwordHash,
          role: "ADMINISTRADOR",
        },
      },
    },
  });

  await signIn("credentials", { email, password, redirect: false });

  const baseUrl = await getBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    client_reference_id: account.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dashboard/billing?checkout=cancelled`,
    metadata: { accountId: account.id },
    subscription_data: { metadata: { accountId: account.id } },
  });

  if (!session.url) {
    // La cuenta ya se creó y la sesión ya inició en este punto — no tiene
    // caso mandar de vuelta a /register (el correo ya estaría "tomado").
    redirect(`/dashboard/billing?error=${encodeURIComponent("No se pudo iniciar el pago")}`);
  }

  redirect(session.url!);
}
