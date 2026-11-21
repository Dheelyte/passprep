import { describe, expect, it } from "vitest";
import * as m from "@/lib/metrics";

// Every metrics query must run against real Postgres (catches SQL/type errors such as date - bigint).
describe("metrics queries", () => {
  it.each(Object.entries(m))("%s runs", async (_name, fn) => {
    const res = await (fn as () => Promise<unknown>)();
    expect(res).toBeDefined();
  });
});
