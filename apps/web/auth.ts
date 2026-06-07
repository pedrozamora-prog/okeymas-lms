import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
        ssoToken: { label: "SSO Token", type: "text"   },
      },
      async authorize(credentials) {
        try {
          const { prisma } = await import("@/lib/prisma");

          // ── SSO token flow ──────────────────────────────────────────────
          if (credentials?.ssoToken) {
            const tokenRecord = await prisma.ssoToken.findUnique({
              where: { id: credentials.ssoToken as string },
            });
            if (!tokenRecord || tokenRecord.expiresAt < new Date()) return null;

            // Consume token (delete)
            await prisma.ssoToken.delete({ where: { id: tokenRecord.id } });

            const user = await prisma.user.findUnique({
              where:   { id: tokenRecord.userId },
              include: { organization: { select: { id: true, name: true } } },
            });
            if (!user || !user.isActive) return null;

            import("@/lib/audit").then(({ createAuditLog }) =>
              createAuditLog({ action: "USER_LOGIN", userId: user.id, organizationId: user.organizationId, entity: "User", entityId: user.id, metadata: { method: "SSO" } })
            );

            return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, department: user.departmentId, organizationId: user.organizationId, organizationName: user.organization.name };
          }

          // ── Password flow ───────────────────────────────────────────────
          if (!credentials?.email || !credentials?.password) return null;

          const user = await prisma.user.findUnique({
            where:   { email: credentials.email as string },
            include: { organization: { select: { id: true, name: true } } },
          });

          if (!user || !user.hashedPassword || !user.isActive) return null;

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.hashedPassword
          );
          if (!passwordMatch) return null;

          import("@/lib/audit").then(({ createAuditLog }) =>
            createAuditLog({ action: "USER_LOGIN", userId: user.id, organizationId: user.organizationId, entity: "User", entityId: user.id })
          );

          return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, department: user.departmentId, organizationId: user.organizationId, organizationName: user.organization.name };
        } catch (err) {
          console.error("[AUTH] error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.department = (user as { department?: string }).department;
        token.organizationId = (user as { organizationId?: string }).organizationId;
        token.organizationName = (user as { organizationName?: string }).organizationName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { department?: string }).department = token.department as string | undefined;
        (session.user as { organizationId?: string }).organizationId = token.organizationId as string;
        (session.user as { organizationName?: string }).organizationName = token.organizationName as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
});
