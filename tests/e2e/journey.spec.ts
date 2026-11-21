import { createHmac } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

// Tobi's journey from the product plan, with FREE_DAILY_LIMIT=3 and a mock Paystack.

const phone = `080${Math.floor(10_000_000 + Math.random() * 89_999_999)}`;
const password = "secret123";

async function startTopic(page: Page, topic: string) {
  await page.goto("/subjects/mathematics");
  // subtopics are pill buttons labelled "Practise <name>"
  await page.getByRole("button", { name: `Practise ${topic}` }).click();
  await page.waitForURL(/\/practice\//);
}

/** Answer the current question (first option); returns whether a video was locked/open/none. */
async function answerCurrent(page: Page) {
  await page.getByRole("button", { name: /^Option A/ }).click();
  await expect(page.getByRole("heading", { name: "Workings" })).toBeVisible();
  const video = page.getByRole("button", { name: /Watch the solution/ });
  if (!(await video.isVisible())) return "none";
  return (await video.innerText()).includes("Premium") ? "locked" : "open";
}

test.describe.serial("student journey", () => {
  let payUrl = "";

  test("signs up with a phone number and onboards", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start practising free" }).first().click();
    await page.getByLabel("Your name").fill("Tobi Test");
    await page.getByLabel("Phone number or email").fill(phone);
    await page.getByLabel("Create a password").fill(password);
    await page.getByRole("button", { name: "Create free account" }).click();

    await page.waitForURL(/\/onboarding/);
    await page.getByText("SS 2", { exact: true }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByText("WAEC", { exact: true }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByText("Mathematics", { exact: true }).click();
    await page.getByRole("button", { name: "I'm ready" }).click();

    await page.waitForURL(/\/dashboard\?welcome=1/);
    await expect(page.getByText("You're in")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hi Tobi" })).toBeVisible();
    await expect(page.getByText("3 free left today")).toBeVisible();
  });

  test("practises a topic, sees explanations, locked video, then hits the free limit", async ({ page }) => {
    await login(page);
    await startTopic(page, "Logarithms"); // 3 questions, one with a Premium-only video
    const videos: string[] = [];
    for (let i = 0; i < 3; i++) {
      videos.push(await answerCurrent(page));
      await page.getByRole("button", { name: /Next question|See my score/ }).click();
    }
    expect(videos).toContain("locked");
    await expect(page.getByText(/\+\d+ points/)).toBeVisible(); // summary

    await startTopic(page, "Indices");
    await page.getByRole("button", { name: /^Option A/ }).click();
    await expect(page.getByRole("dialog", { name: "That's today's free questions" })).toBeVisible();

    await page.getByRole("dialog").getByRole("link", { name: "Ask a parent to pay" }).click();
    await page.getByRole("button", { name: "Create a payment link for my parent" }).click();
    payUrl = (await page.locator("p.break-all").innerText()).trim();
    expect(payUrl).toMatch(/\/pay\/[\w-]+$/);
  });

  test("parent pays a termly plan by bank transfer via the shared link", async ({ browser }) => {
    const parent = await (await browser.newContext()).newPage();
    await parent.goto(payUrl);
    await expect(parent.getByRole("heading", { name: /Unlock Premium for Tobi/ })).toBeVisible();
    await parent.getByText("Per term", { exact: false }).first().click();
    await parent.getByLabel(/Email for the receipt/).fill("parent@example.com");
    await parent.getByRole("button", { name: /Pay securely/ }).click();
    await expect(parent.getByRole("heading", { name: "Premium is unlocked!" })).toBeVisible({ timeout: 30_000 });
  });

  test("premium student practises without limit and can open videos", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard");
    await expect(page.getByText("Premium · unlimited")).toBeVisible(); // chip in the Sunshine header

    await startTopic(page, "Logarithms");
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      seen.push(await answerCurrent(page));
      await page.getByRole("button", { name: /Next question|See my score/ }).click();
    }
    expect(seen).toContain("open");
    expect(seen).not.toContain("locked");

    await page.goto("/leaderboard");
    await expect(page.getByText("(you)")).toBeVisible();
    await page.goto("/progress");
    await expect(page.getByRole("heading", { name: "Mathematics" })).toBeVisible();
  });

  async function login(page: Page) {
    await page.goto("/login");
    await page.getByLabel("Phone number or email").fill(phone);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL(/\/dashboard/);
  }
});

test("webhook rejects bad signatures and accepts signed events", async ({ request }) => {
  const body = JSON.stringify({ event: "subscription.not_renew", data: { subscription_code: "SUB_none" } });
  const bad = await request.post("/api/paystack/webhook", { data: body, headers: { "content-type": "application/json", "x-paystack-signature": "00" } });
  expect(bad.status()).toBe(401);
  const sig = createHmac("sha512", "sk_test_e2e_secret").update(body).digest("hex");
  const ok = await request.post("/api/paystack/webhook", { data: body, headers: { "content-type": "application/json", "x-paystack-signature": sig } });
  expect(ok.status()).toBe(200);
});

test("signed-out visitors are sent to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
});
