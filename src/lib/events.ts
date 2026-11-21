import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";

export type EventType =
  | "signup"
  | "login"
  | "onboarded"
  | "plan_edited"
  | "practice_started"
  | "question_answered"
  | "video_opened"
  | "video_locked"
  | "paywall_shown"
  | "paylink_created"
  | "checkout_started"
  | "upgrade"
  | "renewal"
  | "cancel"
  | "flag";

/** Fire-and-forget analytics; never let tracking break a request. */
export function track(type: EventType, userId: string | null, props?: Prisma.InputJsonValue) {
  db.event.create({ data: { type, userId, props } }).catch((e) => console.error("track failed", type, e));
}
