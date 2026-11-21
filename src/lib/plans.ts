import "server-only";
import { activePlans } from "./billing";
import type { PlanView } from "@/components/plan-picker";

export async function planViews(): Promise<PlanView[]> {
  const plans = await activePlans();
  return plans.map((p) => ({ code: p.code, name: p.name, amountKobo: p.amountKobo, periodDays: p.periodDays, autoRenewAvailable: !!p.paystackPlan }));
}
