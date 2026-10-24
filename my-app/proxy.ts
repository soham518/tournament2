import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Edge-safe instance: only verifies the JWT cookie, no Credentials provider.
const { auth } = NextAuth(authConfig);

const ADMIN_PREFIX = "/admin";
const PLAYER_PREFIX = "/dashboard";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!user || (user.role !== "TOURNAMENT_ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (pathname.startsWith(PLAYER_PREFIX)) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
