import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Clock, Star } from "lucide-react";
import { RankChange } from "@/components/rank-change";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { mySubjects, studentToday } from "@/lib/student";
import { weeklyLeaderboard } from "@/lib/leaderboard";
import { subjectProgress } from "@/lib/progress";
import { lastWeekRank } from "@/lib/gamify";
import { daysAgo } from "@/lib/time";
import { subjectScope } from "@/lib/subjects";
import { ButtonLink, Card, CardLink, Chip, EmptyState, Flame, ProgressBar, ProgressRing, SkeletonDashboard, Stamp } from "@/components/ds";
import { SubjectIcon } from "@/components/subject-icon";

export const metadata: Metadata = { title: "Home" };

/** Visual daily target only (doesn't change limits). */
const DAILY_GOAL = 10;

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<SkeletonDashboard />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

function greeting(streak: number, practisedToday: boolean) {
  if (practisedToday) return "Today's streak is locked in. Sharp.";
  if (streak >= 7) return "Big streak. Don't let it cool down.";
  if (streak > 0) return "Answer one question to keep the flame going.";
  return "One question today starts your streak.";
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  const user = await requireUser();
  const welcome = (await searchParams).welcome === "1";
  const [day, subjects, board, prevRank, open] = await Promise.all([
    studentToday(user),
    mySubjects(user.id),
    weeklyLeaderboard(user.id, 3),
    lastWeekRank(user.id),
    db.practiceSession.findFirst({
      where: { userId: user.id, finishedAt: null, startedAt: { gt: daysAgo(2) } },
      orderBy: { startedAt: "desc" },
      include: { topic: { select: { name: true, subject: { select: { slug: true, name: true } } } } },
    }),
  ]);
  const progress = await Promise.all(subjects.map((s) => subjectProgress(user.id, s.id)));
  const firstName = user.name.split(" ")[0];
  const goal = Math.min(DAILY_GOAL, day.premium ? DAILY_GOAL : day.limit);
  const goalDone = day.answeredToday >= goal;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold">Hi {firstName}</h1>
        <p className="muted mt-1">{greeting(day.streak, day.practisedToday)}</p>
      </div>

      {welcome ? (
        <Card tone="lime" className="anim-rise relative overflow-hidden text-center">
          <Stamp tone="ok" animate className="bg-card">You&apos;re in</Stamp>
          <div className="mt-3 flex justify-center"><Flame days={1} size={56} /></div>
          <p className="mt-2 font-display text-xl font-extrabold">Day 1 starts now.</p>
          <p className="text-sm font-semibold">Answer your first question to light your streak.</p>
          <ButtonLink href="/subjects" variant="secondary" className="mt-4" iconRight={<ArrowRight className="size-5" />}>Pick a topic</ButtonLink>
        </Card>
      ) : null}

      {day.daysLeft !== null && day.daysLeft <= 7 && !day.renewsAutomatically ? (
        <CardLink href="/premium" tone="lime" className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-bold">
            <Clock aria-hidden className="size-5 shrink-0" />
            Premium ends in {day.daysLeft} day{day.daysLeft === 1 ? "" : "s"}. Renew so unlimited practice doesn&apos;t stop.
          </span>
          <ArrowRight aria-hidden className="size-5 shrink-0" />
        </CardLink>
      ) : null}

      {/* Today: streak + goal */}
      <Card className="grid grid-cols-[auto_1fr] items-center gap-4" aria-label="Today">
        <div className="flex flex-col items-center">
          <Flame days={day.streak} size={day.streak >= 7 ? 64 : day.streak >= 3 ? 56 : 48} />
          <span className="num mt-1 text-4xl">{day.streak}</span>
          <span className="text-xs font-bold text-ink-2">day streak</span>
        </div>
        <div className="flex items-center gap-4 border-l-2 border-dashed border-rule pl-4">
          <ProgressRing value={day.answeredToday / goal} size={72} stroke={8} tone="lime" label={`${day.answeredToday} of ${goal} questions today`}>
            <span className="num text-lg">{Math.min(day.answeredToday, 99)}<span className="text-xs text-ink-2">/{goal}</span></span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="font-display font-extrabold leading-tight">{goalDone ? "Goal smashed!" : "Today's goal"}</p>
            <p className="muted text-sm">{goalDone ? "Anything extra is bonus." : `${goal - day.answeredToday} more to hit ${goal}.`}</p>
            {day.premium ? (
              <Chip tone="lime" className="mt-1.5">Premium</Chip>
            ) : (
              <p className="mt-1 text-xs font-semibold text-ink-2">{day.remaining} free left today</p>
            )}
          </div>
        </div>
      </Card>

      {open ? (
        <div data-subject={subjectScope(open.topic.subject.slug)}>
          <CardLink href={`/practice/${open.id}`} tone="subject-soft" className="flex items-center gap-4 p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-[10px] border-2 border-line bg-subj text-on-fill">
              <SubjectIcon slug={open.topic.subject.slug} className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink-2">Continue where you stopped</span>
              <span className="block truncate font-display text-lg font-extrabold">{open.topic.name}</span>
              <ProgressBar value={open.answered} max={open.questionIds.length} label={`${open.answered} of ${open.questionIds.length} answered`} tone="subject" size="sm" className="mt-2" />
            </span>
            <ArrowRight aria-hidden className="size-6 shrink-0" />
          </CardLink>
        </div>
      ) : (
        <ButtonLink href="/subjects" block size="lg" iconRight={<ArrowRight className="size-5" />}>
          Start practising
        </ButtonLink>
      )}

      <section aria-labelledby="subjects-h">
        <div className="mb-2 flex items-end justify-between">
          <h2 id="subjects-h" className="text-xl font-extrabold">Your subjects</h2>
          <Link href="/onboarding" className="text-sm font-bold underline decoration-lime decoration-[3px] underline-offset-2">Edit</Link>
        </div>
        {subjects.length === 0 ? (
          <EmptyState title="No subjects yet" body="Pick the subjects you're writing and we'll line up the topics." action={<ButtonLink href="/onboarding">Choose subjects</ButtonLink>} />
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {subjects.map((s, i) => {
              const topics = progress[i];
              const strong = topics.filter((t) => t.mastery === "strong").length;
              const tried = topics.filter((t) => t.attempts > 0).length;
              return (
                <li key={s.id} data-subject={subjectScope(s.slug)}>
                  <CardLink href={`/subjects/${s.slug}`} padded={false} className="h-full overflow-hidden">
                    <span className="flex items-center justify-between border-b-2 border-line bg-subj px-3 py-2 text-on-fill">
                      <SubjectIcon slug={s.slug} />
                      {strong ? <span className="num flex items-center gap-0.5 text-sm" aria-label={`${strong} strong topics`}>{strong}<Star aria-hidden className="size-3.5" fill="currentColor" /></span> : null}
                    </span>
                    <span className="block p-3">
                      <span className="block font-display font-extrabold leading-tight">{s.name}</span>
                      <span className="muted block text-xs">{s.questionCount ? `${tried}/${topics.length} topics started` : "Coming soon"}</span>
                      {s.questionCount ? <ProgressBar value={tried} max={Math.max(1, topics.length)} label={`${s.name}: ${tried} of ${topics.length} topics started`} tone="subject" size="sm" className="mt-2" /> : null}
                    </span>
                  </CardLink>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CardLink href="/leaderboard" className="flex items-center gap-4" aria-label="This week's leaderboard">
        <span className="flex flex-col items-center">
          <span className="text-xs font-bold text-ink-2">Rank</span>
          <span className="num text-4xl">{board.me ? `#${board.me.rank}` : "–"}</span>
        </span>
        <span className="min-w-0 flex-1 border-l-2 border-dashed border-rule pl-4">
          <span className="block font-display font-extrabold">This week&apos;s leaderboard</span>
          {board.me ? (
            <RankChange now={board.me.rank} prev={prevRank} />
          ) : (
            <span className="muted block text-sm">Answer a question to get on the board.</span>
          )}
          {board.rows[0] && board.me?.rank !== 1 ? (
            <span className="muted block truncate text-xs">Top: {board.rows[0].name} · {board.rows[0].points} pts</span>
          ) : null}
        </span>
        <ArrowRight aria-hidden className="size-5 shrink-0" />
      </CardLink>
    </div>
  );
}
