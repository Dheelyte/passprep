import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Overridable so end-to-end tests can point at a local mock.
const BASE = process.env.PAYSTACK_API_BASE ?? "https://api.paystack.co";

function secret() {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return k;
}

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || !json.status) throw new Error(`Paystack ${path} failed: ${json.message ?? res.status}`);
  return json.data as T;
}

export type InitializeInput = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  plan?: string; // PLN_xxx → Paystack creates a card subscription
  channels?: ("card" | "bank" | "ussd" | "bank_transfer" | "qr" | "mobile_money")[];
  metadata?: Record<string, unknown>;
};

export function initializeTransaction(i: InitializeInput) {
  return call<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: {
      email: i.email,
      amount: i.amountKobo,
      reference: i.reference,
      callback_url: i.callbackUrl,
      plan: i.plan,
      channels: i.channels,
      metadata: i.metadata,
    },
  });
}

export type PaystackTransaction = {
  reference: string;
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending" | "reversed";
  amount: number;
  channel: string;
  paid_at: string | null;
  customer: { email: string; customer_code: string };
  plan?: { plan_code?: string } | string | null;
  metadata?: Record<string, unknown> | string | null;
};

export function verifyTransaction(reference: string) {
  return call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function disableSubscription(code: string, emailToken: string) {
  return call<unknown>("/subscription/disable", { method: "POST", body: { code, token: emailToken } });
}

/** Paystack signs the raw body with HMAC-SHA512 using the secret key. */
export function verifyWebhookSignature(rawBody: string, signature: string | null, key = process.env.PAYSTACK_SECRET_KEY): boolean {
  if (!signature || !key) return false;
  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
