import { afterEach, describe, expect, it, vi } from "vitest";

const hdrs = new Map<string, string>();
vi.mock("next/headers", () => ({ headers: async () => ({ get: (k: string) => hdrs.get(k) ?? null }) }));
const { appUrl } = await import("@/lib/app-url");

afterEach(() => {
  hdrs.clear();
  vi.unstubAllEnvs();
});

describe("appUrl", () => {
  it("prefers APP_URL and strips trailing slashes", async () => {
    vi.stubEnv("APP_URL", "https://passprep.ng/");
    hdrs.set("host", "other.vercel.app");
    expect(await appUrl()).toBe("https://passprep.ng");
  });
  it("uses the request host when APP_URL is missing or empty (the Vercel case)", async () => {
    vi.stubEnv("APP_URL", "");
    hdrs.set("x-forwarded-host", "passprep.vercel.app");
    hdrs.set("x-forwarded-proto", "https");
    expect(await appUrl()).toBe("https://passprep.vercel.app");
  });
  it("falls back to Vercel's production domain, then localhost", async () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "passprep.vercel.app");
    expect(await appUrl()).toBe("https://passprep.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(await appUrl()).toBe("http://localhost:3100");
  });
});
