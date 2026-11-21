import { NextResponse, type NextRequest } from "next/server";
import { verifyAndFulfil } from "@/lib/billing";

// Paystack redirects the payer here after checkout (?reference=…&trxref=…).
// Verifying server-side unlocks Premium immediately instead of waiting for the webhook.
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("reference") ?? req.nextUrl.searchParams.get("trxref");
  const result = new URL("/payment/result", req.nextUrl.origin);
  if (!ref || !/^[\w.-]{6,100}$/.test(ref)) return NextResponse.redirect(result);
  result.searchParams.set("ref", ref);
  try {
    await verifyAndFulfil(ref);
  } catch (e) {
    // Bank transfers may not be confirmed yet; the webhook will finish the job.
    console.error("verify failed", ref, e);
  }
  return NextResponse.redirect(result);
}
