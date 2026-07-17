import type { NextAuthConfig } from "next-auth";

import type { UserRole } from "@/lib/ava/schema";

export const authConfig = {
  providers: [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/ava/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (!pathname.startsWith("/ava")) return true;

      const isPublic =
        pathname === "/ava/login" ||
        pathname.startsWith("/ava/login/") ||
        pathname === "/ava/convite" ||
        pathname.startsWith("/ava/convite/");

      if (isPublic) return true;
      return !!auth?.user;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
