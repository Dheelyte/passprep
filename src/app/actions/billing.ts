"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { readSession } from "@/lib/session";
import { createPayLink, startCheckout } from "@/lib/billing";
import { disableSubscription } from "@/lib/paystack";
import { normalizeEmail } from "@/lib/identity";
import { rateLimit } from "@/lib/rate-limit";
import { track } from "@/lib/events";
import { appUrl } from "@/lib/app-url";

export type CheckoutState = { error?: string } | undefined;

const checkoutSchema = z.object({
  plan: z.enum(["MONTHLY", "TERMLY", "YEARLY", "EXAM_PASS"], { message: "Choose a plan" }),
  mode: z.enum(["AUTO_RENEW", "FIXED_PERIOD"]).default("FIXED_PERIOD"),
  email: z.string().trim(),
});

async function go(userId: string, form: FormData, payLinkId?: string): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse({ plan: form.get("plan"), mode: form.get("mode") ?? undefined, email: form.get("email") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const email = normalizeEmail(parsed.data.email);
  if (!email) return { error: "Enter a valid email address for the payment receipt." };
  if (!rateLimit(`checkout:${userId}`, 10, 10 * 60_000)) return { error: "Too many attempts. Please wait a few minutes." };

  let url: string;
  try {
    url = await startCheckout({ userId, plan: parsed.data.plan, mode: parsed.data.mode, payerEmail: email, payLinkId });
  } catch (e) {
    console.error("checkout failed", e);
    return { error: "We couldn't reach the payment provider. Please try again." };
  }
  redirect(url);
}

/** Student (logged in) pays for themselves. */
export async function checkout(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const s = await readSession();
  if (!s) redirect("/login?next=/premium");
  return go(s.uid, form);
}

/** Parent pays via a shared link, no account needed. */
export async function checkoutViaPayLink(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const token = String(form.get("token") ?? "");
  const link = await db.payLink.findUnique({ where: { token } });
  if (!link || link.expiresAt < new Date()) return { error: "This payment link has expired. Ask your child to send a new one." };
  return go(link.studentId, form, link.id);
}

export async function getParentLink(): Promise<{ url: string }> {
  const s = await readSession();
  if (!s) redirect("/login");
  const link = await createPayLink(s.uid);
  track("paylink_created", s.uid);
  return { url: `${await appUrl()}/pay/${link.token}` };
}

export async function cancelAutoRenew(): Promise<{ ok: boolean; message: string }> {
  const s = await readSession();
  if (!s) redirect("/login");
  const sub = await db.subscription.findUnique({ where: { userId: s.uid } });
  if (!sub || sub.mode !== "AUTO_RENEW" || sub.status !== "ACTIVE")
    return { ok: false, message: "There's no automatic renewal to cancel." };
  if (sub.paystackSubscriptionCode && sub.paystackEmailToken) {
    try {
      await disableSubscription(sub.paystackSubscriptionCode, sub.paystackEmailToken);
    } catch (e) {
      console.error("disable subscription failed", e);
      return { ok: false, message: "We couldn't cancel right now. Please try again in a few minutes." };
    }
  }
  await db.subscription.update({ where: { id: sub.id }, data: { status: "NON_RENEWING" } });
  track("cancel", s.uid, { plan: sub.plan });
  return { ok: true, message: "Automatic renewal cancelled. You keep Premium until the end of the period you paid for." };
}
