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
      {/* Dominant colour: Sunshine — today, streak and goal */}
      <header className="bleed -mt-5 border-b-2 border-line bg-sun pb-6 pt-5 text-on-fill">
        <h1 className="text-3xl font-extrabold">Hi {firstName}</h1>
        <p className="mt-1 font-semibold">{greeting(day.streak, day.practisedToday)}</p>
        <div className="mt-4 grid grid-cols-[0.85fr_1.15fr] gap-2.5">
          <div className="flex items-center gap-2 border-2 border-line bg-card px-2.5 py-3 text-ink shadow-sticker [border-radius:var(--r-sticker)]">
            <Flame days={day.streak} size={day.streak >= 7 ? 46 : day.streak >= 3 ? 40 : 34} />
            <span>
              <span className="num block text-4xl">{day.streak}</span>
              <span className="text-xs font-bold text-ink-2">day streak</span>
            </span>
          </div>
          <div className="flex items-center gap-2 border-2 border-line bg-card px-2.5 py-3 text-ink shadow-sticker [border-radius:var(--r-sticker)]">
            <ProgressRing value={day.answeredToday / goal} size={52} stroke={7} tone="primary" label={`${day.answeredToday} of ${goal} questions today`}>
              <span className="num text-sm">{Math.min(day.answeredToday, 99)}/{goal}</span>
            </ProgressRing>
            <span className="min-w-0">
              <span className="block font-display font-extrabold leading-tight">{goalDone ? "Goal smashed!" : "Today's goal"}</span>
              <span className="block text-xs font-bold text-ink-2">{goalDone ? "Extra = bonus" : `${goal - day.answeredToday} to go`}</span>
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm font-bold">
          {day.premium ? <Chip tone="primary">Premium · unlimited</Chip> : <>{day.remaining} free left today</>}
        </p>
      </header>

      {welcome ? (
        <Card tone="grape" className="anim-rise relative overflow-hidden text-center">
          <Stamp tone="sun" animate>You&apos;re in</Stamp>
          <div className="mt-3 flex justify-center"><Flame days={1} size={56} /></div>
          <p className="mt-2 font-display text-xl font-extrabold">Day 1 starts now.</p>
          <p className="text-sm font-semibold">Answer your first question to light your streak.</p>
          <ButtonLink href="/subjects" variant="secondary" className="mt-4" iconRight={<ArrowRight className="size-5" />}>Pick a topic</ButtonLink>
        </Card>
      ) : null}

      {day.daysLeft !== null && day.daysLeft <= 7 && !day.renewsAutomatically ? (
        <CardLink href="/premium" tone="coral" className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-bold">
            <Clock aria-hidden className="size-5 shrink-0" />
            Premium ends in {day.daysLeft} day{day.daysLeft === 1 ? "" : "s"}. Renew so unlimited practice doesn&apos;t stop.
          </span>
          <ArrowRight aria-hidden className="size-5 shrink-0" />
        </CardLink>
      ) : null}

      {open ? (
        <CardLink href={`/practice/${open.id}`} tone="primary" className="flex items-center gap-4 p-5">
          <span data-subject={subjectScope(open.topic.subject.slug)} className="grid size-12 shrink-0 place-items-center rounded-[10px] border-2 border-line bg-subj text-on-subj">
            <SubjectIcon slug={open.topic.subject.slug} className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Continue where you stopped</span>
            <span className="block truncate font-display text-xl font-extrabold">{open.topic.name}</span>
            <ProgressBar value={open.answered} max={open.questionIds.length} label={`${open.answered} of ${open.questionIds.length} answered`} tone="sun" size="sm" className="mt-2" />
          </span>
          <ArrowRight aria-hidden className="size-6 shrink-0" />
        </CardLink>
      ) : (
        <ButtonLink href="/subjects" block size="lg" iconRight={<ArrowRight className="size-5" />}>
          Start practising
        </ButtonLink>
      )}

      <section aria-labelledby="subjects-h">
        <div className="mb-2 flex items-end justify-between">
          <h2 id="subjects-h" className="text-xl font-extrabold">Your subjects</h2>
          <Link href="/onboarding" className="text-sm font-bold underline decoration-primary decoration-[3px] underline-offset-2">Edit</Link>
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
                  <CardLink href={`/subjects/${s.slug}`} tone="subject" className="flex h-full min-h-36 flex-col justify-between">
                    <span className="flex items-start justify-between">
                      <span className="grid size-10 place-items-center rounded-full border-2 border-line bg-card text-ink">
                        <SubjectIcon slug={s.slug} />
                      </span>
                      {strong ? <span className="num flex items-center gap-0.5 rounded-full border-2 border-line bg-sun px-2 py-0.5 text-sm text-on-fill" aria-label={`${strong} strong topics`}>{strong}<Star aria-hidden className="size-3.5" fill="currentColor" /></span> : null}
                    </span>
                    <span className="mt-3 block">
                      <span className="block font-display text-lg font-extrabold leading-tight">{s.name}</span>
                      <span className="block text-xs font-bold">{s.questionCount ? `${tried}/${topics.length} topics started` : "Coming soon"}</span>
                      {s.questionCount ? <ProgressBar value={tried} max={Math.max(1, topics.length)} label={`${s.name}: ${tried} of ${topics.length} topics started`} tone="sun" size="sm" className="mt-2" /> : null}
                    </span>
                  </CardLink>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <CardLink href="/leaderboard" className="flex items-center gap-4" aria-label="This week's leaderboard">
        <span className="flex flex-col items-center rounded-[10px] border-2 border-line bg-sun px-3 py-2 text-on-fill">
          <span className="text-xs font-bold">Rank</span>
          <span className="num text-3xl">{board.me ? `#${board.me.rank}` : "–"}</span>
        </span>
        <span className="min-w-0 flex-1">
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
