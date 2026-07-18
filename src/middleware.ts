import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/ava/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  // Legacy manage URL: send everyone to the shared professor/admin surface.
  const legacyManage = pathname.match(/^\/ava\/admin\/turmas\/([^/]+)\/?$/);
  if (legacyManage) {
    return NextResponse.redirect(
      new URL(`/ava/turmas/${legacyManage[1]}/gerir`, req.nextUrl.origin),
    );
  }

  if (pathname.startsWith("/ava/admin")) {
    if (role === "admin") {
      return NextResponse.next();
    }

    if (role) {
      const dest =
        role === "professor" ? "/ava/professor" : "/ava";
      return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
    }
  }

  if (pathname.startsWith("/ava/professor")) {
    if (role === "professor") {
      return NextResponse.next();
    }
    if (role === "admin") {
      return NextResponse.redirect(new URL("/ava/admin", req.nextUrl.origin));
    }
    if (role) {
      return NextResponse.redirect(new URL("/ava", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/ava/:path*"],
};
