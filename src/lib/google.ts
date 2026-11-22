import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { db } from "./db";
import { track } from "./events";

// "Continue with Google": OAuth 2.0 authorization-code flow with PKCE, an anti-CSRF `state`
// and a `nonce` bound to the ID token. Google's ID token is verified against its published keys.

const AUTH_URL = process.env.GOOGLE_AUTH_URL ?? "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = process.env.GOOGLE_TOKEN_URL ?? "https://oauth2.googleapis.com/token";
const JWKS_URL = process.env.GOOGLE_JWKS_URL ?? "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export const OAUTH_COOKIE = "pp_oauth";

export function googleEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string) {
  // Must match the redirect URI registered in Google Cloud exactly.
  const base = process.env.APP_URL?.trim() ? process.env.APP_URL.trim().replace(/\/+$/, "") : origin;
  return `${base}/api/auth/google/callback`;
}

const b64url = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");
const random = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));

export type OAuthState = { state: string; verifier: string; nonce: string; next?: string; source?: string };

/** Builds the Google consent URL plus the secrets to keep in a short-lived httpOnly cookie. */
export async function startGoogleAuth(origin: string, opts: { next?: string; source?: string } = {}) {
  const st: OAuthState = { state: random(), verifier: random(48), nonce: random(), ...opts };
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(st.verifier))));
  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state: st.state,
    nonce: st.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return { url: url.toString(), cookie: JSON.stringify(st) };
}

export function parseOAuthCookie(raw: string | undefined): OAuthState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return typeof v?.state === "string" && typeof v.verifier === "string" && typeof v.nonce === "string" ? v : null;
  } catch {
    return null;
  }
}

export type GoogleProfile = { sub: string; email?: string; emailVerified: boolean; name?: string };

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

/** Exchanges the code for tokens and returns the verified identity from the ID token. */
export async function finishGoogleAuth(code: string, st: OAuthState, origin: string): Promise<GoogleProfile> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
      code_verifier: st.verifier,
    }),
  });
  if (!res.ok) throw new Error(`google token exchange failed: ${res.status}`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("google returned no id_token");

  jwks ??= createRemoteJWKSet(new URL(JWKS_URL));
  const { payload } = await jwtVerify(id_token, jwks, { issuer: ISSUERS, audience: process.env.GOOGLE_CLIENT_ID! });
  if (payload.nonce !== st.nonce) throw new Error("google id_token nonce mismatch");
  if (typeof payload.sub !== "string") throw new Error("google id_token has no sub");
  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email.toLowerCase() : undefined,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : undefined,
  };
}

export class GoogleSignInError extends Error {}

/**
 * Finds the account for a Google identity, linking or creating one:
 * 1. already linked (same Google id) → that account;
 * 2. an account with the same, Google-verified email → link it;
 * 3. otherwise → new student account (no password).
 */
export async function signInWithGoogle(p: GoogleProfile, source?: string) {
  const linked = await db.user.findUnique({ where: { googleId: p.sub } });
  if (linked) {
    track("login", linked.id, { method: "google" });
    return { user: linked, created: false };
  }
  if (!p.email || !p.emailVerified) throw new GoogleSignInError("Your Google account has no verified email address.");

  const existing = await db.user.findUnique({ where: { email: p.email } });
  if (existing) {
    if (existing.googleId) throw new GoogleSignInError("This email is already linked to a different Google account.");
    // Email sign-ups here are never verified, so anyone could have registered this address with a
    // password. Google has now proved who owns it: link the account and drop that unverified password.
    const user = await db.user.update({ where: { id: existing.id }, data: { googleId: p.sub, passwordHash: null } });
    track("login", user.id, { method: "google", linked: true });
    return { user, created: false };
  }

  const name = (p.name?.trim() || p.email.split("@")[0]).slice(0, 60);
  const user = await db.user.create({ data: { email: p.email, googleId: p.sub, name, signupSource: source?.slice(0, 80) || null } });
  track("signup", user.id, { method: "google", source: user.signupSource });
  return { user, created: true };
}
