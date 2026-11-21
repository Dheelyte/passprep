import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { SESSION_COOKIE_NAME } from "./session-cookie";

const COOKIE = SESSION_COOKIE_NAME;
const MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { uid: string };

export async function encodeSession(uid: string): Promise<string> {
  return new SignJWT({ uid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_S}s`)
    .sign(key());
}

export async function decodeSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return typeof payload.uid === "string" ? { uid: payload.uid } : null;
  } catch {
    return null;
  }
}

export async function createSession(uid: string) {
  const token = await encodeSession(uid);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function readSession(): Promise<SessionPayload | null> {
  return decodeSession((await cookies()).get(COOKIE)?.value);
}

export const SESSION_COOKIE = COOKIE;
