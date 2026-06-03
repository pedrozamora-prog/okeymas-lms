import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const { prisma } = await import("@/lib/prisma");

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: { organization: { select: { id: true, name: true } } },
          });

          console.log("[AUTH] user found:", user ? user.email : "null");

          if (!user || !user.hashedPassword || !user.isActive) {
            console.log("[AUTH] early return — user/hash/active check failed");
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.hashedPassword
          );

          console.log("[AUTH] passwordMatch:", passwordMatch);

          if (!passwordMatch) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            department: user.department,
            organizationId: user.organizationId,
            organizationName: user.organization.name,
          };
        } catch (err) {
          console.error("[AUTH] authorize error:", err);
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
