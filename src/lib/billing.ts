import "server-only";
import { randomBytes } from "node:crypto";
import type { BillingMode, PlanCode, Prisma } from "@prisma/client";
import { db } from "./db";
import { initializeTransaction, verifyTransaction, type PaystackTransaction } from "./paystack";
import { track } from "./events";

const DAY_MS = 86_400_000;
/** Grace after an auto-renew due date, so a slightly late renewal doesn't lock the student out. */
const RENEWAL_GRACE_DAYS = 2;

export function newReference() {
  return `pp_${Date.now().toString(36)}_${randomBytes(6).toString("hex")}`;
}

export async function activePlans() {
  return db.planPrice.findMany({ where: { isActive: true }, orderBy: { amountKobo: "asc" } });
}

/** New period end: extend from the later of now or the current end, so early renewals aren't lost. */
export function extendPeriod(currentEnd: Date | null, periodDays: number, now = new Date()): Date {
  const base = currentEnd && currentEnd > now ? currentEnd : now;
  return new Date(base.getTime() + periodDays * DAY_MS);
}

export async function startCheckout(opts: {
  userId: string;
  plan: PlanCode;
  mode: BillingMode;
  payerEmail: string;
  payLinkId?: string;
}) {
  const price = await db.planPrice.findUnique({ where: { code: opts.plan } });
  if (!price || !price.isActive) throw new Error("Plan not available");
  const autoRenew = opts.mode === "AUTO_RENEW" && !!price.paystackPlan;
  const mode: BillingMode = autoRenew ? "AUTO_RENEW" : "FIXED_PERIOD";
  const reference = newReference();

  await db.payment.create({
    data: {
      reference,
      userId: opts.userId,
      plan: price.code,
      mode,
      amountKobo: price.amountKobo,
      payerEmail: opts.payerEmail,
      payLinkId: opts.payLinkId,
    },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3100";
  const init = await initializeTransaction({
    email: opts.payerEmail,
    amountKobo: price.amountKobo,
    reference,
    callbackUrl: `${appUrl}/api/paystack/verify`,
    plan: autoRenew ? price.paystackPlan! : undefined,
    channels: autoRenew ? ["card"] : ["card", "bank_transfer", "ussd", "bank"],
    metadata: { userId: opts.userId, plan: price.code, mode },
  });
  track("checkout_started", opts.userId, { plan: price.code, mode, viaPayLink: !!opts.payLinkId });
  return init.authorization_url;
}

/**
 * Mark a payment successful and grant access, exactly once.
 * The PENDING→SUCCESS transition is the idempotency guard: verify-callback and
 * webhook can both call this concurrently and only one grants time.
 */
export async function fulfilPayment(tx: PaystackTransaction): Promise<"granted" | "duplicate" | "unknown" | "mismatch"> {
  const payment = await db.payment.findUnique({ where: { reference: tx.reference } });
  if (!payment) return "unknown";
  if (tx.status !== "success") {
    if (payment.status === "PENDING") {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: tx.status === "abandoned" ? "ABANDONED" : "FAILED", raw: tx as unknown as Prisma.InputJsonValue },
      });
    }
    return "mismatch";
  }
  if (tx.amount < payment.amountKobo) return "mismatch";

  const price = await db.planPrice.findUniqueOrThrow({ where: { code: payment.plan } });
  const now = new Date();

  return db.$transaction(async (t) => {
    const flipped = await t.payment.updateMany({
      where: { id: payment.id, status: { not: "SUCCESS" } },
      data: {
        status: "SUCCESS",
        channel: tx.channel,
        paidAt: tx.paid_at ? new Date(tx.paid_at) : now,
        raw: tx as unknown as Prisma.InputJsonValue,
      },
    });
    if (flipped.count === 0) return "duplicate" as const;

    const existing = await t.subscription.findUnique({ where: { userId: payment.userId } });
    const currentPeriodEnd = extendPeriod(existing?.currentPeriodEnd ?? null, price.periodDays, now);
    const data = {
      plan: payment.plan,
      mode: payment.mode,
      status: payment.mode === "AUTO_RENEW" ? ("ACTIVE" as const) : ("NON_RENEWING" as const),
      currentPeriodEnd,
      paystackCustomerCode: tx.customer?.customer_code ?? existing?.paystackCustomerCode,
    };
    await t.subscription.upsert({ where: { userId: payment.userId }, create: { userId: payment.userId, ...data }, update: data });
    track(existing ? "renewal" : "upgrade", payment.userId, { plan: payment.plan, mode: payment.mode, channel: tx.channel });
    return "granted" as const;
  });
}

export async function verifyAndFulfil(reference: string) {
  const tx = await verifyTransaction(reference);
  return { tx, result: await fulfilPayment(tx) };
}

// ---- Webhook handling for auto-renew (card) subscriptions ----

type SubscriptionEvent = {
  subscription_code: string;
  email_token: string;
  status: string;
  next_payment_date: string | null;
  plan: { plan_code: string };
  customer: { customer_code: string; email: string };
};

async function subscriptionByCustomer(customerCode: string) {
  return db.subscription.findFirst({ where: { paystackCustomerCode: customerCode } });
}

export async function onSubscriptionCreate(d: SubscriptionEvent) {
  const sub = await subscriptionByCustomer(d.customer.customer_code);
  // Can arrive before charge.success is processed: fail so Paystack retries later.
  if (!sub) throw new Error(`no subscription yet for customer ${d.customer.customer_code}`);
  await db.subscription.update({
    where: { id: sub.id },
    data: {
      paystackSubscriptionCode: d.subscription_code,
      paystackEmailToken: d.email_token,
      status: "ACTIVE",
      mode: "AUTO_RENEW",
      ...(d.next_payment_date
        ? { currentPeriodEnd: new Date(new Date(d.next_payment_date).getTime() + RENEWAL_GRACE_DAYS * DAY_MS) }
        : {}),
    },
  });
}

/** A recurring charge that Paystack initiated (reference we didn't create). */
export async function onRecurringCharge(tx: PaystackTransaction & { plan?: { plan_code?: string } | null }) {
  const sub = await subscriptionByCustomer(tx.customer.customer_code);
  if (!sub) return;
  const price = await db.planPrice.findUnique({ where: { code: sub.plan } });
  if (!price) return;
  try {
    await db.$transaction([
      db.payment.create({
        data: {
          reference: tx.reference,
          userId: sub.userId,
          plan: sub.plan,
          mode: "AUTO_RENEW",
          amountKobo: tx.amount,
          payerEmail: tx.customer.email,
          channel: tx.channel,
          status: "SUCCESS",
          paidAt: tx.paid_at ? new Date(tx.paid_at) : new Date(),
          raw: tx as unknown as Prisma.InputJsonValue,
        },
      }),
      db.subscription.update({
        where: { id: sub.id },
        data: { status: "ACTIVE", currentPeriodEnd: extendPeriod(sub.currentPeriodEnd, price.periodDays) },
      }),
    ]);
    track("renewal", sub.userId, { plan: sub.plan, mode: "AUTO_RENEW", channel: tx.channel });
  } catch (e) {
    if ((e as { code?: string }).code !== "P2002") throw e; // duplicate webhook → already processed
  }
}

export async function onSubscriptionStatus(d: SubscriptionEvent, status: "NON_RENEWING" | "PAST_DUE" | "EXPIRED") {
  const sub = await db.subscription.findUnique({ where: { paystackSubscriptionCode: d.subscription_code } });
  if (!sub) return;
  await db.subscription.update({ where: { id: sub.id }, data: { status } });
}

// ---- Parent pay links ----

export async function createPayLink(studentId: string) {
  const existing = await db.payLink.findFirst({
    where: { studentId, expiresAt: { gt: new Date(Date.now() + DAY_MS) } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  return db.payLink.create({
    data: { studentId, token: randomBytes(16).toString("base64url"), expiresAt: new Date(Date.now() + 14 * DAY_MS) },
  });
}
