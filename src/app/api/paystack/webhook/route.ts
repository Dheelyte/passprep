import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhookSignature, verifyTransaction, type PaystackTransaction } from "@/lib/paystack";
import { fulfilPayment, onRecurringCharge, onSubscriptionCreate, onSubscriptionStatus } from "@/lib/billing";

// Paystack webhook. Signed with HMAC-SHA512 of the raw body.
// Always re-verify charges with the API instead of trusting the payload amount.
// Return 200 quickly for handled/ignored events; non-2xx makes Paystack retry.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  try {
    switch (event.event) {
      case "charge.success": {
        const reference = String(event.data.reference ?? "");
        const tx = await verifyTransaction(reference);
        const outcome = await fulfilPayment(tx);
        if (outcome === "unknown" && tx.status === "success" && tx.plan) {
          await onRecurringCharge(tx as PaystackTransaction & { plan: { plan_code?: string } });
        }
        break;
      }
      case "subscription.create":
        await onSubscriptionCreate(event.data as unknown as Parameters<typeof onSubscriptionCreate>[0]);
        break;
      case "subscription.not_renew":
        await onSubscriptionStatus(event.data as never, "NON_RENEWING");
        break;
      case "invoice.payment_failed":
        if (event.data.subscription)
          await onSubscriptionStatus(event.data.subscription as never, "PAST_DUE");
        break;
      case "subscription.disable":
        // Access stays until currentPeriodEnd; entitlement checks use the date.
        await onSubscriptionStatus(event.data as never, "NON_RENEWING");
        break;
      default:
        break;
    }
  } catch (e) {
    console.error("webhook handling failed", event.event, e);
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
