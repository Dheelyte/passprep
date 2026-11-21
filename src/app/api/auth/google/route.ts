import { NextResponse, type NextRequest } from "next/server";
import { googleEnabled, OAUTH_COOKIE, startGoogleAuth } from "@/lib/google";

const safeNext = (s: string | null) => (s && s.startsWith("/") && !s.startsWith("//") ? s : undefined);

// GET /api/auth/google?next=/premium&source=… → Google's account chooser.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (!googleEnabled()) return NextResponse.redirect(new URL("/login?error=google_off", req.nextUrl.origin));
  const { url, cookie } = await startGoogleAuth(req.nextUrl.origin, { next: safeNext(sp.get("next")), source: sp.get("source")?.slice(0, 80) || undefined });
  const res = NextResponse.redirect(url);
  res.cookies.set(OAUTH_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // sent on Google's top-level redirect back to us
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
