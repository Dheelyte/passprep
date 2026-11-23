import type { Metadata } from "next";
import { Suspense } from "react";
import { LogOut, Settings } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isPremium, premiumForEveryone } from "@/lib/entitlements";
import { logout } from "@/app/actions/auth";
import { activeDays, badgesFor, userStats } from "@/lib/gamify";
import { displayStreak } from "@/lib/streaks";
import { CLASS_LABEL, subjectScope } from "@/lib/subjects";
import { Avatar, ButtonLink, Card, Chip, SkeletonList, StickerBadge } from "@/components/ds";
import { SubmitButton } from "@/components/ds/submit-button";
import { ThemeToggle } from "@/components/ds/theme-toggle";
import { CancelRenewal } from "@/components/cancel-renewal";
import { StreakCalendar } from "@/components/streak-calendar";
import { SubjectIcon } from "@/components/subject-icon";

export const metadata: Metadata = { title: "Profile" };

const PLAN: Record<string, string> = { MONTHLY: "Monthly", TERMLY: "Per term", YEARLY: "Yearly", EXAM_PASS: "Exam season pass" };

export default function AccountPage() {
  return (
    <Suspense fallback={<SkeletonList rows={5} />}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  const user = await requireUser({ allowUnonboarded: true });
  const [stats, cal, subjects] = await Promise.all([
    userStats(user.id),
    activeDays(user.id, 35),
    db.userSubject.findMany({ where: { userId: user.id }, include: { subject: true }, orderBy: { subject: { order: "asc" } } }),
  ]);
  const streak = displayStreak(user, cal.today);
  const badges = badgesFor(stats, { current: streak, longest: user.longestStreak });
  const earned = badges.filter((b) => b.earned).length;
  const sub = user.subscription;
  const premium = isPremium(sub);
  const fmt = (d: Date) => d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : null;

  return (
    <div className="space-y-5">
      <Card tone="primary" className="flex items-center gap-4">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold">{user.name}</h1>
          <p className="truncate text-sm font-semibold">{user.phone ?? user.email}</p>
          <p className="mt-1 flex flex-wrap gap-1.5">
            {user.classLevel ? <Chip tone="sun">{CLASS_LABEL[user.classLevel]}</Chip> : null}
            {user.exams.map((e) => <Chip key={e} className="text-ink">{e}</Chip>)}
            {premium ? <Chip tone="grape">Premium</Chip> : null}
          </p>
        </div>
      </Card>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "Points", v: user.totalPoints.toLocaleString("en-NG"), c: "bg-sun text-on-fill" },
          { k: "Answered", v: stats.answered.toLocaleString("en-NG"), c: "bg-card" },
          { k: "Accuracy", v: accuracy === null ? "–" : `${accuracy}%`, c: "bg-ok text-on-fill" },
          { k: "Best streak", v: `${user.longestStreak}d`, c: "bg-coral text-on-fill" },
        ].map((s) => (
          <div key={s.k} className={`sticker px-3 py-3 text-center ${s.c}`}>
            <dt className="text-xs font-bold">{s.k}</dt>
            <dd className="num mt-1 text-3xl">{s.v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <Card as="section" aria-labelledby="cal-h">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="cal-h" className="text-lg font-extrabold">Streak calendar</h2>
          <span className="text-sm font-bold">{streak} day{streak === 1 ? "" : "s"} now</span>
        </div>
        <StreakCalendar from={cal.from} today={cal.today} active={cal.active} />
      </Card>

      <Card as="section" aria-labelledby="badges-h">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="badges-h" className="text-lg font-extrabold">Sticker collection</h2>
          <span className="text-sm font-bold">{earned}/{badges.length}</span>
        </div>
        <ul className="grid grid-cols-3 justify-items-center gap-y-4 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
          {badges.map((b) => <li key={b.id}><StickerBadge badge={b} size={64} /></li>)}
        </ul>
      </Card>

      </div>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <Card as="section" aria-labelledby="subj-h">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="subj-h" className="text-lg font-extrabold">Subjects</h2>
          <ButtonLink href="/onboarding?step=subjects" variant="ghost" size="sm">Change</ButtonLink>
        </div>
        <ul className="flex flex-wrap gap-2">
          {subjects.map(({ subject: s }) => (
            <li key={s.id} data-subject={subjectScope(s.slug)} className="flex items-center gap-1.5 rounded-full border-2 border-line bg-subj px-3 py-1 font-bold text-on-subj">
              <SubjectIcon slug={s.slug} className="size-4" /> {s.name}
            </li>
          ))}
        </ul>
      </Card>

      <Card as="section" aria-labelledby="plan-h" className="space-y-3">
        <h2 id="plan-h" className="text-lg font-extrabold">Plan</h2>
        {premiumForEveryone() ? (
          <p className="text-sm"><strong>Premium (test mode)</strong>. Every account has Premium because PREMIUM_FOR_EVERYONE is on.</p>
        ) : premium && sub ? (
          <>
            <p className="text-sm">
              <strong>Premium · {PLAN[sub.plan]}</strong>, {sub.mode === "AUTO_RENEW" && sub.status === "ACTIVE" ? `renews on ${fmt(sub.currentPeriodEnd)}` : `ends on ${fmt(sub.currentPeriodEnd)}`}
            </p>
            {sub.mode === "AUTO_RENEW" && sub.status === "ACTIVE" ? <CancelRenewal /> : <ButtonLink href="/premium" variant="secondary" block>Add more time</ButtonLink>}
          </>
        ) : (
          <>
            <p className="muted text-sm">Free plan{sub ? ` · Premium ended on ${fmt(sub.currentPeriodEnd)}` : ""}</p>
            <ButtonLink href="/premium" block>See Premium</ButtonLink>
          </>
        )}
      </Card>

      </div>
      <Card as="section" aria-labelledby="settings-h" flat className="space-y-1">
        <h2 id="settings-h" className="mb-1 flex items-center gap-2 text-lg font-extrabold"><Settings aria-hidden className="size-5" /> Settings</h2>
        <div className="flex min-h-12 items-center justify-between border-b-2 border-dashed border-rule">
          <span className="font-semibold">Light / dark mode</span>
          <ThemeToggle />
        </div>
        <div className="flex min-h-12 items-center justify-between border-b-2 border-dashed border-rule">
          <span className="font-semibold">Class, exams and subjects</span>
          <ButtonLink href="/onboarding" variant="ghost" size="sm">Edit</ButtonLink>
        </div>
        {user.role !== "STUDENT" ? (
          <div className="flex min-h-12 items-center justify-between border-b-2 border-dashed border-rule">
            <span className="font-semibold">Content admin</span>
            <ButtonLink href="/admin" variant="ghost" size="sm">Open</ButtonLink>
          </div>
        ) : null}
        <form action={logout} className="pt-2">
          <SubmitButton variant="ghost" block icon={<LogOut className="size-5" />}>Log out</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
