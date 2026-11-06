// Next.js 16 "proxy" (formerly middleware): /admin requires a valid admin session cookie.
// Pages also check the session themselves (lib/admin/session.js) as a second layer.
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifyToken } from "./lib/admin/token";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  if (verifyToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
