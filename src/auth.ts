import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

/**
 * Autenticación del dashboard administrativo (sección 10 del README):
 * credenciales propias + NextAuth con sesión JWT, en vez de construir
 * un sistema de sesiones/roles desde cero. `accountId` y `role` viajan
 * en el token para que el resto del backend pueda derivar el tenant
 * directamente de la sesión (ver src/lib/tenant.ts). Extiende
 * `authConfig` (compatible con Edge) agregando el provider de
 * Credentials, que sí necesita el runtime Node de las rutas/acciones
 * normales — nunca se usa en middleware.ts.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const member = await prisma.member.findUnique({ where: { email } });
        if (!member) return null;

        const valid = await bcrypt.compare(password, member.passwordHash);
        if (!valid) return null;

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          accountId: member.accountId,
          tokenVersion: member.tokenVersion,
        };
      },
    }),
  ],
});
