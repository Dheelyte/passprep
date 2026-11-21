import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { exportJWK, generateKeyPair, SignJWT, type JWK } from "jose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { cleanup } from "./helpers";

// A fake Google: /token returns an ID token signed with our own key, /certs publishes that key.
const CLIENT_ID = "test-client.apps.googleusercontent.com";
let server: Server;
let privateKey: CryptoKey;
let jwk: JWK;
let nextClaims: Record<string, unknown> = {};
let lastTokenRequest: URLSearchParams | null = null;
const users: string[] = [];
let g: typeof import("@/lib/google");

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  jwk = { ...(await exportJWK(pair.publicKey)), kid: "k1", alg: "RS256", use: "sig" };
  server = createServer(async (req, res) => {
    if (req.url === "/certs") return void res.end(JSON.stringify({ keys: [jwk] }));
    let body = "";
    for await (const c of req) body += c;
    lastTokenRequest = new URLSearchParams(body);
    const id_token = await new SignJWT(nextClaims)
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuer((nextClaims.iss as string) ?? "https://accounts.google.com")
      .setAudience((nextClaims.aud as string) ?? CLIENT_ID)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ id_token, access_token: "x" }));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  Object.assign(process.env, { GOOGLE_CLIENT_ID: CLIENT_ID, GOOGLE_CLIENT_SECRET: "secret", GOOGLE_TOKEN_URL: `${base}/token`, GOOGLE_JWKS_URL: `${base}/certs` });
  g = await import("@/lib/google"); // reads the URLs above at load time
});
afterAll(async () => {
  server?.close();
  await cleanup(users);
});

const uniq = () => Math.random().toString(36).slice(2, 10);

async function roundTrip(claims: Record<string, unknown>) {
  const { url, cookie } = await g.startGoogleAuth("http://localhost:3100", { next: "/premium" });
  const st = g.parseOAuthCookie(cookie)!;
  nextClaims = { nonce: st.nonce, ...claims };
  return { url: new URL(url), st, profile: await g.finishGoogleAuth("the-code", st, "http://localhost:3100") };
}

describe("Google sign-in", () => {
  it("sends PKCE + state + nonce, verifies the ID token, and creates a password-less student", async () => {
    const sub = `g-${uniq()}`;
    const email = `Ada.${uniq()}@Gmail.com`;
    const { url, st, profile } = await roundTrip({ sub, email, email_verified: true, name: "Ada Obi" });

    expect(url.searchParams.get("state")).toBe(st.state);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3100/api/auth/google/callback");
    expect(lastTokenRequest?.get("code_verifier")).toBe(st.verifier);
    expect(profile).toEqual({ sub, email: email.toLowerCase(), emailVerified: true, name: "Ada Obi" });

    const first = await g.signInWithGoogle(profile, "whatsapp");
    users.push(first.user.id);
    expect(first.created).toBe(true);
    expect(first.user).toMatchObject({ email: email.toLowerCase(), googleId: sub, passwordHash: null, name: "Ada Obi", onboarded: false, signupSource: "whatsapp" });

    const again = await g.signInWithGoogle(profile);
    expect(again).toMatchObject({ created: false, user: { id: first.user.id } });
  });

  it("links an existing email account and drops its unverified password", async () => {
    const email = `linked.${uniq()}@example.com`;
    const existing = await db.user.create({ data: { email, name: "Linked", passwordHash: "bcrypt-hash", onboarded: true } });
    users.push(existing.id);
    const { user, created } = await g.signInWithGoogle({ sub: `g-${uniq()}`, email, emailVerified: true });
    expect(created).toBe(false);
    expect(user).toMatchObject({ id: existing.id, passwordHash: null });
    expect(user.googleId).toMatch(/^g-/);
  });

  it("refuses unverified emails, emails linked to another Google account, wrong nonce and wrong audience", async () => {
    await expect(g.signInWithGoogle({ sub: `g-${uniq()}`, email: `x.${uniq()}@example.com`, emailVerified: false })).rejects.toBeInstanceOf(g.GoogleSignInError);

    const email = `taken.${uniq()}@example.com`;
    const owner = await db.user.create({ data: { email, name: "Owner", googleId: `g-${uniq()}` } });
    users.push(owner.id);
    await expect(g.signInWithGoogle({ sub: `g-${uniq()}`, email, emailVerified: true })).rejects.toThrow(/different Google account/);

    await expect(roundTrip({ sub: "s", nonce: "replayed" })).rejects.toThrow(/nonce/);
    await expect(roundTrip({ sub: "s", aud: "someone-else" })).rejects.toThrow();
    await expect(roundTrip({ sub: "s", iss: "https://evil.example" })).rejects.toThrow();
  });

  it("rejects a tampered state cookie", () => {
    expect(g.parseOAuthCookie("not json")).toBeNull();
    expect(g.parseOAuthCookie(JSON.stringify({ state: "a" }))).toBeNull();
  });
});
