import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "./db";
import { readSession } from "./session";

/** Data Access Layer: the one place that turns the session cookie into a user. */
export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;
  return db.user.findUnique({
    where: { id: session.uid },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      classLevel: true,
      exams: true,
      onboarded: true,
      currentStreak: true,
      longestStreak: true,
      lastActiveDate: true,
      totalPoints: true,
      subscription: { select: { plan: true, mode: true, status: true, currentPeriodEnd: true } },
    },
  });
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Require a signed-in user; students who haven't onboarded are sent to onboarding. */
export async function requireUser(opts: { allowUnonboarded?: boolean } = {}): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!opts.allowUnonboarded && user.role === "STUDENT" && !user.onboarded) redirect("/onboarding");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser({ allowUnonboarded: true });
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}
