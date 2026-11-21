import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

// Optimistic check only (cookie present). Real authorization happens in the
// Data Access Layer (lib/auth.ts) and in every server action.
export function proxy(req: NextRequest) {
  if (!req.cookies.has(SESSION_COOKIE_NAME)) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/subjects/:path*", "/practice/:path*", "/leaderboard", "/progress/:path*", "/premium", "/account", "/onboarding", "/admin/:path*"],
};
