import type { ChildProcess } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createPayLink, fulfilPayment, startCheckout, verifyAndFulfil } from "@/lib/billing";
import { isPremium } from "@/lib/entitlements";
import { verifyTransaction } from "@/lib/paystack";
import { cleanup, makeStudent, startMockPaystack } from "./helpers";

let mock: ChildProcess;
const users: string[] = [];
beforeAll(async () => {
  mock = await startMockPaystack();
});
afterAll(async () => {
  mock?.kill();
  await cleanup(users);
});

const refOf = (url: string) => new URL(url).searchParams.get("reference")!;
const pay = (url: string) => fetch(url, { redirect: "manual" }); // mock checkout marks it paid

describe("payments", () => {
  it("parent pays a termly plan by transfer via pay link → premium for 120 days, exactly once", async () => {
    const u = await makeStudent("Billing Tester");
    users.push(u.id);
    const link = await createPayLink(u.id);
    expect(await createPayLink(u.id)).toMatchObject({ id: link.id }); // reuses the live link

    const url = await startCheckout({ userId: u.id, plan: "TERMLY", mode: "FIXED_PERIOD", payerEmail: "parent@example.com", payLinkId: link.id });
    const ref = refOf(url);

    // Before paying: verify reports pending → no access.
    const pending = await verifyAndFulfil(ref);
    expect(pending.result).toBe("mismatch");
    expect(isPremium(await db.subscription.findUnique({ where: { userId: u.id } }))).toBe(false);

    await pay(url);
    const tx = await verifyTransaction(ref);
    // Verify-callback and webhook racing: only one grants time.
    const results = await Promise.all([fulfilPayment(tx), fulfilPayment(tx)]);
    expect(results.sort()).toEqual(["duplicate", "granted"]);
    expect(await fulfilPayment(tx)).toBe("duplicate");

    const sub = await db.subscription.findUniqueOrThrow({ where: { userId: u.id } });
    expect(sub).toMatchObject({ plan: "TERMLY", mode: "FIXED_PERIOD", status: "NON_RENEWING" });
    const days = (sub.currentPeriodEnd.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(119.9);
    expect(days).toBeLessThan(120.1);
    expect(isPremium(sub)).toBe(true);
    const payment = await db.payment.findUniqueOrThrow({ where: { reference: ref } });
    expect(payment).toMatchObject({ status: "SUCCESS", channel: "bank_transfer", payLinkId: link.id });
  });

  it("an early renewal stacks on the remaining time", async () => {
    const u = await makeStudent();
    users.push(u.id);
    for (let i = 0; i < 2; i++) {
      const url = await startCheckout({ userId: u.id, plan: "MONTHLY", mode: "FIXED_PERIOD", payerEmail: "p@example.com" });
      await pay(url);
      expect((await verifyAndFulfil(refOf(url))).result).toBe("granted");
    }
    const sub = await db.subscription.findUniqueOrThrow({ where: { userId: u.id } });
    expect(Math.round((sub.currentPeriodEnd.getTime() - Date.now()) / 86_400_000)).toBe(60);
  });

  it("auto-renew falls back to a one-off payment when no Paystack plan code is configured", async () => {
    const u = await makeStudent();
    users.push(u.id);
    await startCheckout({ userId: u.id, plan: "MONTHLY", mode: "AUTO_RENEW", payerEmail: "p@example.com" });
    const p = await db.payment.findFirstOrThrow({ where: { userId: u.id } });
    expect(p.mode).toBe("FIXED_PERIOD");
  });

  it("refuses to grant when the paid amount is lower than the plan price", async () => {
    const u = await makeStudent();
    users.push(u.id);
    const url = await startCheckout({ userId: u.id, plan: "YEARLY", mode: "FIXED_PERIOD", payerEmail: "p@example.com" });
    await pay(url);
    const tx = await verifyTransaction(refOf(url));
    expect(await fulfilPayment({ ...tx, amount: tx.amount - 100 })).toBe("mismatch");
    expect(await db.subscription.findUnique({ where: { userId: u.id } })).toBeNull();
  });
});
