import type { NextAuthConfig } from "next-auth";

/**
 * Config de NextAuth compatible con Edge (sin el provider de
 * Credentials, que depende de bcrypt y Prisma — ninguno corre en el
 * runtime Edge de middleware.ts). El middleware solo necesita decodificar
 * el JWT de la cookie de sesión, no autenticar; separar esto evita que
 * el bundle del middleware arrastre bcrypt/Prisma y supere el límite de
 * tamaño de Vercel para Edge Functions (1 MB en el plan gratuito).
 */
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accountId = user.accountId;
        token.role = user.role;
        token.tokenVersion = user.tokenVersion;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.accountId = token.accountId as string;
        session.user.role = token.role as string;
        session.user.tokenVersion = token.tokenVersion as number;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
