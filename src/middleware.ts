import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/ava/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/ava/admin")) {
    const isClassManage = /^\/ava\/admin\/turmas\/[^/]+/.test(pathname);

    if (role === "admin") {
      return NextResponse.next();
    }

    if (isClassManage && role === "professor") {
      return NextResponse.next();
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
