import type { Metadata } from "next";
import { Suspense } from "react";
import { Hourglass, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { weeklyLeaderboard, type LeaderRow } from "@/lib/leaderboard";
import { lastWeekRanks } from "@/lib/gamify";
import { hoursUntil, lagosWeekEndsAt } from "@/lib/time";
import { CLASS_LABEL } from "@/lib/subjects";
import { Avatar, ButtonLink, Card, EmptyState, Flame, ScreenHeader, SkeletonList, TrophyIcon, cn } from "@/components/ds";
import { Countdown } from "@/components/countdown";
import { MovePill } from "@/components/rank-change";

export const metadata: Metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <>
          <ScreenHeader tone="primary" title="This week's ranks" subtitle="Points from questions answered since Monday." />
          <SkeletonList rows={8} />
        </>
      }
    >
      <Board />
    </Suspense>
  );
}

function Row({ r, mine, prev }: { r: LeaderRow; mine: boolean; prev: number | undefined }) {
  return (
    <div className={cn("flex min-h-16 items-center gap-1.5 px-2.5 py-2 sm:gap-2.5 sm:px-3", mine ? "bg-primary text-on-primary" : "bg-card")}>
      <span className="num w-7 text-center text-lg">{r.rank}</span>
      <span className="w-10 text-center"><MovePill diff={prev === undefined ? null : prev - r.rank} compact /></span>
      <span className="hidden sm:block"><Avatar name={r.name} size="sm" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display font-extrabold">{r.name}{mine ? " (you)" : ""}</span>
        {r.classLevel ? <span className={cn("text-xs", mine ? "font-semibold" : "text-ink-2")}>{CLASS_LABEL[r.classLevel]}</span> : null}
      </span>
      <span className="flex items-center gap-0.5 rounded-full border-2 border-line bg-sun px-1.5 text-on-fill" aria-label={`${r.streak} day streak`}>
        <Flame days={r.streak} size={14} animate={false} />
        <span className="num text-sm">{r.streak}</span>
      </span>
      <span className="w-14 text-right sm:w-16"><span className="num text-lg">{r.points}</span><span className="text-xs font-bold"> pts</span></span>
    </div>
  );
}

async function Board() {
  const user = await requireUser();
  const [{ rows, me }, prevRanks] = await Promise.all([weeklyLeaderboard(user.id, 50), lastWeekRanks()]);
  const ends = lagosWeekEndsAt();
  const msLeft = hoursUntil(ends) * 3_600_000;
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const myPrev = prevRanks.get(user.id);
  const climbed = me && myPrev ? myPrev - me.rank : 0;

  return (
    <div className="space-y-5">
      {/* Dominant colour: Cobalt, with a gold / silver / bronze podium */}
      <ScreenHeader
        tone="primary"
        title="This week's ranks"
        subtitle="Points from questions answered since Monday."
        eyebrow={
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-sun px-3 py-1 text-sm font-bold text-on-fill">
            <Hourglass aria-hidden className="size-4" /> Resets in <Countdown to={ends.toISOString()} initialMs={msLeft} />
          </span>
        }
        className="mb-0"
      >
        {podium.length ? (
          <ol className="mx-auto grid max-w-xl grid-cols-3 items-end gap-2 sm:gap-4" aria-label="Top three">
            {[podium[1], podium[0], podium[2]].map((r, i) => {
              if (!r) return <li key={i} aria-hidden />;
              const place = r.rank as 1 | 2 | 3;
              const style = {
                1: { step: "h-32 bg-sun", ring: "bg-sun", plate: "bg-sun", label: "1st" },
                2: { step: "h-24 bg-silver", ring: "bg-silver", plate: "bg-silver", label: "2nd" },
                3: { step: "h-16 bg-bronze", ring: "bg-bronze", plate: "bg-bronze", label: "3rd" },
              }[place];
              const mine = r.userId === user.id;
              return (
                <li key={r.userId} className="flex flex-col items-center text-center">
                  <TrophyIcon place={place} size={place === 1 ? 46 : 34} />
                  <span className={cn("mt-1 rounded-full border-2 border-line p-1 shadow-sticker-sm", style.ring)}>
                    <Avatar name={r.name} size={place === 1 ? "md" : "sm"} />
                  </span>
                  <span className="mt-2 w-full truncate rounded-[8px] border-2 border-line bg-white px-1.5 py-0.5 font-display text-sm font-extrabold text-[#16131f]">
                    {r.name}{mine ? " (you)" : ""}
                  </span>
                  <span className={cn("mt-2 flex w-full flex-col items-center justify-start gap-1 border-2 border-b-0 border-line pt-2 text-on-fill shadow-sticker [border-radius:12px_12px_0_0]", style.step)}>
                    <span className="num text-3xl leading-none">{style.label}</span>
                    <span className="rounded-full border-2 border-line bg-white px-2 text-xs font-extrabold text-[#16131f]">{r.points} pts</span>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : null}
      </ScreenHeader>

      <div className="mx-auto max-w-3xl space-y-5">
      {climbed > 0 ? (
        <Card tone="sun" className="anim-rise flex items-center gap-3">
          <TrendingUp aria-hidden className="size-6 shrink-0" />
          <p className="font-display font-extrabold">You climbed {climbed} place{climbed === 1 ? "" : "s"} since last week. Keep pushing!</p>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title="The board is empty" body="Nobody has scored this week yet. Answer one question and you're on top." action={<ButtonLink href="/subjects">Start practising</ButtonLink>} />
      ) : rest.length ? (
        <ol start={4} className="sticker divide-y-2 divide-dashed divide-rule overflow-hidden p-0" aria-label="Ranks 4 and below">
          {rest.map((r) => (
            <li key={r.userId}>
              <Row r={r} mine={r.userId === user.id} prev={prevRanks.get(r.userId)} />
            </li>
          ))}
        </ol>
      ) : null}

      {/* Your row, always visible above the bottom nav */}
      <div className="sticky bottom-20 z-20 md:bottom-6">
        {me ? (
          <div className="overflow-hidden border-2 border-line shadow-sticker [border-radius:var(--r-sticker)]" aria-label="Your position">
            <Row r={me} mine prev={myPrev} />
          </div>
        ) : (
          <Card tone="sun" className="text-center font-display font-extrabold">You&apos;re not on the board yet. One correct answer = 10 points.</Card>
        )}
      </div>

      <p className="muted text-xs">Correct +10 · wrong +2 (for trying) · streak milestones earn bonus points. Re-solving a question you already got right earns nothing.</p>
      </div>
    </div>
  );
}
