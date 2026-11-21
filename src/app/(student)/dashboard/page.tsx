import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { mySubjects, studentToday } from "@/lib/student";
import { weeklyLeaderboard } from "@/lib/leaderboard";
import { daysAgo } from "@/lib/time";
import { SkeletonList, StreakFlame } from "@/components/ui";

export const metadata: Metadata = { title: "Home" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<SkeletonList rows={5} />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await requireUser();
  const [day, subjects, board, open] = await Promise.all([
    studentToday(user),
    mySubjects(user.id),
    weeklyLeaderboard(user.id, 3),
    db.practiceSession.findFirst({
      where: { userId: user.id, finishedAt: null, startedAt: { gt: daysAgo(2) } },
      orderBy: { startedAt: "desc" },
      include: { topic: { select: { name: true } } },
    }),
  ]);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Hi {firstName}</h1>

      {day.daysLeft !== null && day.daysLeft <= 7 && !day.renewsAutomatically ? (
        <Link href="/premium" className="card flex items-center justify-between gap-3 border-accent bg-accent-soft">
          <span className="text-sm font-medium">
            Premium ends in {day.daysLeft} day{day.daysLeft === 1 ? "" : "s"}. Renew so you don&apos;t lose unlimited practice.
          </span>
          <span className="font-semibold text-brand">Renew</span>
        </Link>
      ) : null}

      <section className="card flex items-center justify-between" aria-label="Your streak">
        <div>
          <p className="muted text-sm">Daily streak</p>
          <StreakFlame days={day.streak} size="lg" />
          <p className="muted mt-1 text-sm">
            {day.practisedToday ? "You've practised today. Come back tomorrow!" : day.streak > 0 ? "Answer one question today to keep it." : "Answer a question to start a streak."}
          </p>
        </div>
        <div className="text-right">
          <p className="muted text-sm">Points</p>
          <p className="text-2xl font-bold">{user.totalPoints.toLocaleString("en-NG")}</p>
          {day.premium ? (
            <span className="chip bg-brand-soft text-brand">Premium</span>
          ) : (
            <p className="muted text-sm">{day.remaining} of {day.limit} free questions left today</p>
          )}
        </div>
      </section>

      {open ? (
        <Link href={`/practice/${open.id}`} className="card flex items-center justify-between border-brand">
          <span>
            <span className="block text-sm text-muted">Continue where you stopped</span>
            <span className="font-semibold">{open.topic.name} · {open.answered}/{open.questionIds.length}</span>
          </span>
          <span className="btn-primary min-h-10 px-4">Continue</span>
        </Link>
      ) : null}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your subjects</h2>
          <Link href="/onboarding" className="text-sm font-semibold text-brand">Edit</Link>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {subjects.map((s) => (
            <li key={s.id}>
              <Link href={`/subjects/${s.slug}`} className="card block h-full hover:border-brand">
                <span className="block font-semibold">{s.name}</span>
                <span className="muted text-sm">{s.questionCount ? `${s.questionCount} questions` : "Coming soon"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">This week&apos;s leaders</h2>
          <Link href="/leaderboard" className="text-sm font-semibold text-brand">See all</Link>
        </div>
        {board.rows.length === 0 ? (
          <p className="muted text-sm">No one has scored yet this week. Be the first!</p>
        ) : (
          <ol className="space-y-1">
            {board.rows.map((r) => (
              <li key={r.userId} className="flex justify-between text-sm">
                <span>{r.rank}. {r.name}</span>
                <span className="font-semibold">{r.points} pts</span>
              </li>
            ))}
          </ol>
        )}
        <p className="muted mt-2 text-sm">
          {board.me ? <>You&apos;re <strong className="text-text">#{board.me.rank}</strong> with {board.me.points} points.</> : "Answer questions to join the leaderboard."}
        </p>
      </section>
    </div>
  );
}
