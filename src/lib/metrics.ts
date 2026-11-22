import "server-only";
import { db } from "./db";

// Product metrics from the plan's "How we'll measure success" section.
// All days/weeks are Lagos time: timestamps are stored in UTC, Lagos = UTC+1.
// "Active" on a day = answered at least one question that day.

const n = (v: bigint | number | null | undefined) => Number(v ?? 0);

export async function weeklySignups(weeks = 8) {
  const rows = await db.$queryRaw<{ week: Date; signups: bigint; activated: bigint }[]>`
    SELECT date_trunc('week', (u.created_at + interval '1 hour'))::date AS week,
           COUNT(*) AS signups,
           COUNT(*) FILTER (WHERE EXISTS (
             SELECT 1 FROM attempts a WHERE a.user_id = u.id AND a.created_at < u.created_at + interval '24 hours'
           )) AS activated
    FROM users u
    WHERE u.role = 'STUDENT' AND u.created_at >= now() - (${weeks}::int * interval '1 week')
    GROUP BY 1 ORDER BY 1`;
  return rows.map((r) => ({ week: r.week, signups: n(r.signups), activated: n(r.activated) }));
}

export async function signupSources(days = 30) {
  const rows = await db.$queryRaw<{ source: string; c: bigint }[]>`
    SELECT COALESCE(NULLIF(signup_source, ''), '(direct)') AS source, COUNT(*) AS c
    FROM users WHERE role = 'STUDENT' AND created_at >= now() - (${days}::int * interval '1 day')
    GROUP BY 1 ORDER BY 2 DESC LIMIT 10`;
  return rows.map((r) => ({ source: r.source, count: n(r.c) }));
}

/** Weekly signup cohorts: % active exactly on day 1, 7 and 30 after the signup day. */
export async function retentionCohorts(weeks = 8) {
  const rows = await db.$queryRaw<{ week: Date; size: bigint; d1: bigint; d7: bigint; d30: bigint; d1_elig: bigint; d7_elig: bigint; d30_elig: bigint }[]>`
    WITH cohort AS (
      SELECT id, (created_at + interval '1 hour')::date AS d0,
             date_trunc('week', (created_at + interval '1 hour'))::date AS week
      FROM users WHERE role = 'STUDENT' AND created_at >= now() - (${weeks}::int * interval '1 week')
    ), today AS (SELECT (now() + interval '1 hour')::date AS t)
    SELECT c.week, COUNT(*) AS size,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM attempts a WHERE a.user_id = c.id AND a.lagos_date = c.d0 + 1)) AS d1,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM attempts a WHERE a.user_id = c.id AND a.lagos_date = c.d0 + 7)) AS d7,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM attempts a WHERE a.user_id = c.id AND a.lagos_date = c.d0 + 30)) AS d30,
      COUNT(*) FILTER (WHERE c.d0 + 1 <= (SELECT t FROM today)) AS d1_elig,
      COUNT(*) FILTER (WHERE c.d0 + 7 <= (SELECT t FROM today)) AS d7_elig,
      COUNT(*) FILTER (WHERE c.d0 + 30 <= (SELECT t FROM today)) AS d30_elig
    FROM cohort c GROUP BY 1 ORDER BY 1`;
  const pct = (a: bigint, b: bigint) => (n(b) ? n(a) / n(b) : null);
  return rows.map((r) => ({ week: r.week, size: n(r.size), d1: pct(r.d1, r.d1_elig), d7: pct(r.d7, r.d7_elig), d30: pct(r.d30, r.d30_elig) }));
}

export async function practiceVolume(weeks = 8) {
  const rows = await db.$queryRaw<{ week: Date; answers: bigint; students: bigint }[]>`
    SELECT date_trunc('week', lagos_date)::date AS week, COUNT(*) AS answers, COUNT(DISTINCT user_id) AS students
    FROM attempts WHERE lagos_date >= (now() + interval '1 hour')::date - (${weeks}::int * 7)
    GROUP BY 1 ORDER BY 1`;
  return rows.map((r) => ({ week: r.week, answers: n(r.answers), students: n(r.students), perStudent: n(r.students) ? n(r.answers) / n(r.students) : 0 }));
}

export async function streakStats() {
  const [r] = await db.$queryRaw<{ active: bigint; avg_streak: number | null; seven_plus: bigint }[]>`
    SELECT COUNT(*) AS active, AVG(current_streak)::float AS avg_streak, COUNT(*) FILTER (WHERE current_streak >= 7) AS seven_plus
    FROM users WHERE role = 'STUDENT' AND last_active_date >= (now() + interval '1 hour')::date - 1`;
  return { activeStreakers: n(r?.active), avgStreak: r?.avg_streak ?? 0, sevenPlus: n(r?.seven_plus) };
}

/** Learning signal: accuracy on a student's first 5 vs latest 5 answers in a topic (pairs with ≥10 answers). */
export async function topicImprovement() {
  const [r] = await db.$queryRaw<{ pairs: bigint; first_acc: number | null; last_acc: number | null; improved: bigint }[]>`
    WITH ranked AS (
      SELECT a.user_id, q.topic_id, a.is_correct,
             ROW_NUMBER() OVER (PARTITION BY a.user_id, q.topic_id ORDER BY a.created_at) AS rn_first,
             ROW_NUMBER() OVER (PARTITION BY a.user_id, q.topic_id ORDER BY a.created_at DESC) AS rn_last,
             COUNT(*) OVER (PARTITION BY a.user_id, q.topic_id) AS total
      FROM attempts a JOIN questions q ON q.id = a.question_id
    ), pairs AS (
      SELECT user_id, topic_id,
             AVG(CASE WHEN rn_first <= 5 THEN is_correct::int END) AS first_acc,
             AVG(CASE WHEN rn_last <= 5 THEN is_correct::int END) AS last_acc
      FROM ranked WHERE total >= 10 GROUP BY 1, 2
    )
    SELECT COUNT(*) AS pairs, AVG(first_acc)::float AS first_acc, AVG(last_acc)::float AS last_acc,
           COUNT(*) FILTER (WHERE last_acc > first_acc) AS improved FROM pairs`;
  return { pairs: n(r?.pairs), firstAcc: r?.first_acc ?? null, lastAcc: r?.last_acc ?? null, improved: n(r?.improved) };
}

export async function mostMissed(limit = 10) {
  const rows = await db.$queryRaw<{ id: string; stem: string; topic: string; total: bigint; wrong: bigint }[]>`
    SELECT q.id, q.stem, t.name AS topic, COUNT(*) AS total, COUNT(*) FILTER (WHERE NOT a.is_correct) AS wrong
    FROM attempts a JOIN questions q ON q.id = a.question_id JOIN topics t ON t.id = q.topic_id
    WHERE a.created_at >= now() - interval '30 days'
    GROUP BY q.id, q.stem, t.name HAVING COUNT(*) >= 10
    ORDER BY COUNT(*) FILTER (WHERE NOT a.is_correct)::float / COUNT(*) DESC LIMIT ${limit}::int`;
  return rows.map((r) => ({ id: r.id, stem: r.stem, topic: r.topic, total: n(r.total), wrongRate: n(r.wrong) / n(r.total) }));
}

/**
 * Are videos useful? Of wrong answers in the last 30 days, how often a video was opened,
 * and whether the student's *next* answer was correct, with vs without watching.
 */
export async function videoEffect() {
  const [r] = await db.$queryRaw<{ wrong_with_video: bigint; wrong_total: bigint; next_ok_video: bigint; next_n_video: bigint; next_ok_none: bigint; next_n_none: bigint }[]>`
    WITH wrong AS (
      SELECT a.id, a.user_id, a.question_id, a.created_at, q.video_url IS NOT NULL AS has_video
      FROM attempts a JOIN questions q ON q.id = a.question_id
      WHERE NOT a.is_correct AND a.created_at >= now() - interval '30 days'
    ), tagged AS (
      SELECT w.*,
        EXISTS (SELECT 1 FROM events e WHERE e.type = 'video_opened' AND e.user_id = w.user_id
                AND e.props->>'questionId' = w.question_id AND e.created_at BETWEEN w.created_at AND w.created_at + interval '30 minutes') AS watched,
        (SELECT a2.is_correct FROM attempts a2 WHERE a2.user_id = w.user_id AND a2.created_at > w.created_at
         ORDER BY a2.created_at LIMIT 1) AS next_correct
      FROM wrong w WHERE w.has_video
    )
    SELECT COUNT(*) FILTER (WHERE watched) AS wrong_with_video, COUNT(*) AS wrong_total,
           COUNT(*) FILTER (WHERE watched AND next_correct) AS next_ok_video, COUNT(*) FILTER (WHERE watched AND next_correct IS NOT NULL) AS next_n_video,
           COUNT(*) FILTER (WHERE NOT watched AND next_correct) AS next_ok_none, COUNT(*) FILTER (WHERE NOT watched AND next_correct IS NOT NULL) AS next_n_none
    FROM tagged`;
  const ratio = (a: bigint | undefined, b: bigint | undefined) => (n(b) ? n(a) / n(b) : null);
  return {
    wrongWithVideoAvailable: n(r?.wrong_total),
    watchRate: ratio(r?.wrong_with_video, r?.wrong_total),
    nextCorrectAfterVideo: ratio(r?.next_ok_video, r?.next_n_video),
    nextCorrectWithoutVideo: ratio(r?.next_ok_none, r?.next_n_none),
  };
}

export async function conversion() {
  const [r] = await db.$queryRaw<{ students: bigint; paid: bigint; paywall_seen: bigint; paid_after_paywall: bigint; active_premium: bigint }[]>`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'STUDENT') AS students,
      (SELECT COUNT(DISTINCT user_id) FROM payments WHERE status = 'SUCCESS') AS paid,
      (SELECT COUNT(DISTINCT user_id) FROM events WHERE type = 'paywall_shown') AS paywall_seen,
      (SELECT COUNT(DISTINCT p.user_id) FROM payments p WHERE p.status = 'SUCCESS'
         AND EXISTS (SELECT 1 FROM events e WHERE e.type = 'paywall_shown' AND e.user_id = p.user_id AND e.created_at < p.paid_at)) AS paid_after_paywall,
      (SELECT COUNT(*) FROM subscriptions WHERE current_period_end > now() AND status <> 'EXPIRED') AS active_premium`;
  return {
    students: n(r?.students),
    paid: n(r?.paid),
    activePremium: n(r?.active_premium),
    paywallSeen: n(r?.paywall_seen),
    paidAfterPaywall: n(r?.paid_after_paywall),
  };
}

export async function paymentMix(days = 90) {
  const rows = await db.$queryRaw<{ plan: string; mode: string; channel: string | null; c: bigint; kobo: bigint; via_link: bigint }[]>`
    SELECT plan::text, mode::text, channel, COUNT(*) AS c, SUM(amount_kobo) AS kobo, COUNT(pay_link_id) AS via_link
    FROM payments WHERE status = 'SUCCESS' AND paid_at >= now() - (${days}::int * interval '1 day')
    GROUP BY 1, 2, 3 ORDER BY 4 DESC`;
  return rows.map((r) => ({ plan: r.plan, mode: r.mode, channel: r.channel ?? "unknown", count: n(r.c), revenueKobo: n(r.kobo), viaParentLink: n(r.via_link) }));
}

/**
 * Renewal rate: of paid periods that ended in the last 90 days, the share where the
 * student paid again (any plan) between 14 days before and 7 days after the period end.
 */
export async function renewalRate() {
  const [r] = await db.$queryRaw<{ ended: bigint; renewed: bigint }[]>`
    WITH periods AS (
      SELECT p.user_id, p.paid_at + (pp.period_days * interval '1 day') AS period_end, p.id
      FROM payments p JOIN plan_prices pp ON pp.code = p.plan
      WHERE p.status = 'SUCCESS'
    )
    SELECT COUNT(*) AS ended,
           COUNT(*) FILTER (WHERE EXISTS (
             SELECT 1 FROM payments p2 WHERE p2.user_id = pe.user_id AND p2.status = 'SUCCESS' AND p2.id <> pe.id
               AND p2.paid_at BETWEEN pe.period_end - interval '14 days' AND pe.period_end + interval '7 days')) AS renewed
    FROM periods pe WHERE pe.period_end BETWEEN now() - interval '90 days' AND now()`;
  return { ended: n(r?.ended), renewed: n(r?.renewed), rate: n(r?.ended) ? n(r?.renewed) / n(r?.ended) : null };
}
