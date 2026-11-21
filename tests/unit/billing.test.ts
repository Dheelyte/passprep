import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { verifyWebhookSignature } from "@/lib/paystack";
import { extendPeriod } from "@/lib/billing";

describe("paystack webhook signature", () => {
  const key = "sk_test_abc";
  const body = JSON.stringify({ event: "charge.success", data: { reference: "r1" } });
  const sig = createHmac("sha512", key).update(body).digest("hex");
  it("accepts a valid signature", () => expect(verifyWebhookSignature(body, sig, key)).toBe(true));
  it("rejects a tampered body", () => expect(verifyWebhookSignature(body + " ", sig, key)).toBe(false));
  it("rejects missing or malformed signatures", () => {
    expect(verifyWebhookSignature(body, null, key)).toBe(false);
    expect(verifyWebhookSignature(body, "zz", key)).toBe(false);
  });
});

describe("extendPeriod", () => {
  const now = new Date("2026-11-21T00:00:00Z");
  it("starts from now when expired or new", () => {
    expect(extendPeriod(null, 30, now).toISOString()).toBe("2026-12-21T00:00:00.000Z");
    expect(extendPeriod(new Date("2026-01-01"), 30, now).toISOString()).toBe("2026-12-21T00:00:00.000Z");
  });
  it("stacks on remaining time for early renewals", () => {
    expect(extendPeriod(new Date("2026-11-30T00:00:00Z"), 30, now).toISOString()).toBe("2026-12-30T00:00:00.000Z");
  });
});
