import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Autenticación del dashboard administrativo (sección 10 del README):
 * credenciales propias + NextAuth con sesión JWT, en vez de construir
 * un sistema de sesiones/roles desde cero. `accountId` y `role` viajan
 * en el token para que el resto del backend pueda derivar el tenant
 * directamente de la sesión (ver src/lib/tenant.ts).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
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
          role: member.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accountId = user.accountId;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.accountId = token.accountId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
