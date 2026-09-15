import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

/**
 * Protege las rutas del dashboard administrativo: sin sesión válida,
 * redirige a /login. La resolución de tenant (`accountId`) ocurre más
 * abajo, en src/lib/tenant.ts, a partir de esa misma sesión.
 *
 * Usa `authConfig` (sin el provider de Credentials/bcrypt/Prisma) en
 * vez de `auth` de src/auth.ts — el middleware corre en el runtime
 * Edge de Vercel, que no soporta esos módulos de Node y además tiene
 * un límite de tamaño de bundle (1 MB en el plan gratuito) que la
 * config completa supera.
 */
export default NextAuth(authConfig).auth((req) => {
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");
  if (isDashboardRoute && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
