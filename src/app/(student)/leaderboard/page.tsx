import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { weeklyLeaderboard } from "@/lib/leaderboard";
import { hoursUntil, lagosWeekEndsAt } from "@/lib/time";
import { PageHeader, SkeletonList, StreakFlame } from "@/components/ui";

export const metadata: Metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  return (
    <>
      <PageHeader title="This week's leaderboard" subtitle="Points from questions answered this week. Resets every Monday." />
      <Suspense fallback={<SkeletonList rows={8} />}>
        <Board />
      </Suspense>
    </>
  );
}

const CLASS_LABEL: Record<string, string> = { JSS3: "JSS 3", SS1: "SS 1", SS2: "SS 2", SS3: "SS 3" };

async function Board() {
  const user = await requireUser();
  const { rows, me } = await weeklyLeaderboard(user.id, 50);
  const ends = lagosWeekEndsAt();
  const hoursLeft = hoursUntil(ends);
  const timeLeft = hoursLeft > 48 ? `${Math.floor(hoursLeft / 24)} days` : `${hoursLeft} hours`;

  return (
    <>
      <p className="mb-3 text-sm"><span className="chip bg-accent-soft">⏳ {timeLeft} left this week</span></p>
      {me && !rows.some((r) => r.userId === user.id) ? (
        <p className="card mb-3 border-brand text-sm">You&apos;re <strong>#{me.rank}</strong> with {me.points} points. Keep going!</p>
      ) : null}
      {rows.length === 0 ? (
        <p className="card muted">No scores yet this week. Answer a question to take first place!</p>
      ) : (
        <ol className="card divide-y divide-border p-0">
          {rows.map((r) => {
            const mine = r.userId === user.id;
            return (
              <li key={r.userId} className={`flex min-h-14 items-center gap-3 px-4 py-2 ${mine ? "bg-brand-soft" : ""}`}>
                <span className={`w-8 text-center font-bold ${r.rank <= 3 ? "text-xl" : "text-muted"}`}>
                  {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : r.rank}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.name}{mine ? " (you)" : ""}</span>
                  {r.classLevel ? <span className="muted text-xs">{CLASS_LABEL[r.classLevel]}</span> : null}
                </span>
                <StreakFlame days={r.streak} />
                <span className="w-20 text-right font-bold">{r.points}<span className="muted text-xs font-normal"> pts</span></span>
              </li>
            );
          })}
        </ol>
      )}
      <p className="muted mt-3 text-xs">Correct answer +10 · wrong answer +2 · streak milestones earn bonus points. Re-answering a question you already solved earns no points.</p>
    </>
  );
}
