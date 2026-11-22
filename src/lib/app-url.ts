import "server-only";
import { headers } from "next/headers";

const clean = (u: string) => u.trim().replace(/\/+$/, "");

/**
 * The public address of this deployment, for links that leave the app
 * (parent pay links, Paystack's return URL). In order:
 * 1. APP_URL, if set (use it to pin your custom domain);
 * 2. the host of the current request (correct on Vercel, previews included);
 * 3. Vercel's production domain; 4. localhost for development.
 */
export async function appUrl(): Promise<string> {
  if (process.env.APP_URL?.trim()) return clean(process.env.APP_URL);
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
      return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
    }
  } catch {
    // outside a request (scripts, tests)
  }
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${clean(vercel)}`;
  return "http://localhost:3100";
}
