import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export default auth(function proxy(request: NextRequest) {
  const session = (request as NextRequest & { auth?: { user?: unknown } }).auth;
  const { pathname } = request.nextUrl;

  const isLoggedIn = !!session?.user;
  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnAdmin = pathname.startsWith("/admin");
  const isOnLogin = pathname === "/login";

  if (isOnLogin && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if ((isOnDashboard || isOnAdmin) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
