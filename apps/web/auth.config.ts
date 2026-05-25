import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnLogin = nextUrl.pathname === "/login";

      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if ((isOnDashboard || isOnAdmin) && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      if (isOnAdmin) {
        const role = (auth?.user as { role?: string })?.role;
        const adminRoles = ["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"];
        if (!adminRoles.includes(role ?? "")) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
