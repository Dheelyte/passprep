import { NextResponse, type NextRequest } from "next/server";
import { createSession } from "@/lib/session";
import { finishGoogleAuth, GoogleSignInError, OAUTH_COOKIE, parseOAuthCookie, signInWithGoogle } from "@/lib/google";

// Google redirects here with ?code&state (or ?error=access_denied when the user cancels).
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const sp = req.nextUrl.searchParams;
  const st = parseOAuthCookie(req.cookies.get(OAUTH_COOKIE)?.value);
  const fail = (error: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${error}`, origin));
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
    return res;
  };

  if (sp.get("error")) return fail("google_cancelled");
  const code = sp.get("code");
  if (!code || !st || sp.get("state") !== st.state) return fail("google_state");

  let dest: string;
  try {
    const profile = await finishGoogleAuth(code, st, origin);
    const { user } = await signInWithGoogle(profile, st.source);
    await createSession(user.id);
    dest = user.role !== "STUDENT" ? (st.next ?? "/admin") : user.onboarded ? (st.next ?? "/dashboard") : "/onboarding";
  } catch (e) {
    if (e instanceof GoogleSignInError) return fail(e.message.includes("different") ? "google_conflict" : "google_email");
    console.error("google sign-in failed", e);
    return fail("google_failed");
  }
  const res = NextResponse.redirect(new URL(dest, origin));
  res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
  return res;
}
