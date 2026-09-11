import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Protege las rutas del dashboard administrativo: sin sesión válida,
 * redirige a /login. La resolución de tenant (`accountId`) ocurre más
 * abajo, en src/lib/tenant.ts, a partir de esa misma sesión.
 */
export default auth((req) => {
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
