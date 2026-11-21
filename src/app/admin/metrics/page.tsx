import { Suspense, type ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import * as m from "@/lib/metrics";
import { PageHeader, SkeletonList } from "@/components/ui";

export default function MetricsPage() {
  return (
    <>
      <PageHeader title="Success metrics" subtitle="Are students signing up, coming back, learning — and are parents paying? Targets are set after the pilot." />
      <Suspense fallback={<SkeletonList rows={6} />}>
        <Metrics />
      </Suspense>
    </>
  );
}

const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}%`);
const wk = (d: Date) => d.toISOString().slice(5, 10);
const naira = (k: number) => `₦${(k / 100).toLocaleString("en-NG")}`;

function Kpi({ title, question, children, rule }: { title: string; question: string; children: ReactNode; rule: string }) {
  return (
    <section className="card space-y-2">
      <header>
        <p className="muted text-xs font-semibold uppercase tracking-wide">{question}</p>
        <h2 className="font-semibold">{title}</h2>
      </header>
      {children}
      <p className="muted border-t border-border pt-2 text-xs"><strong>Decision rule:</strong> {rule}</p>
    </section>
  );
}

function Bars({ data }: { data: { label: string; value: number; display: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <p className="muted text-sm">No data yet.</p>;
  return (
    <div className="flex h-28 items-end gap-1.5" role="img" aria-label={data.map((d) => `${d.label}: ${d.display}`).join(", ")}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-semibold">{d.display}</span>
          <div className="w-full rounded-t bg-brand" style={{ height: `${Math.max(3, (d.value / max) * 80)}px` }} />
          <span className="muted text-[10px]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

async function Metrics() {
  await requireRole("ADMIN");
  const [signups, sources, cohorts, volume, streaks, improvement, missed, video, conv, mix, renewal] = await Promise.all([
    m.weeklySignups(),
    m.signupSources(),
    m.retentionCohorts(),
    m.practiceVolume(),
    m.streakStats(),
    m.topicImprovement(),
    m.mostMissed(),
    m.videoEffect(),
    m.conversion(),
    m.paymentMix(),
    m.renewalRate(),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Kpi title="New sign-ups per week" question="Are students signing up?" rule="If activation (answered a question within 24h) drops below the pilot baseline, fix onboarding before spending on acquisition.">
        <Bars data={signups.map((s) => ({ label: wk(s.week), value: s.signups, display: String(s.signups) }))} />
        <p className="text-sm">
          Activation (last 8 weeks): <strong>{pct(signups.reduce((a, s) => a + s.signups, 0) ? signups.reduce((a, s) => a + s.activated, 0) / signups.reduce((a, s) => a + s.signups, 0) : null)}</strong>
        </p>
        <p className="muted text-xs">Top sources (30d): {sources.map((s) => `${s.source} ${s.count}`).join(" · ") || "–"}</p>
      </Kpi>

      <Kpi title="Retention by signup week" question="Do they come back?" rule="Compare curve shape across cohorts. A sharp D1 drop points to first-session value; a D7→D30 drop points to habit (streaks, reminders).">
        <table className="w-full text-sm">
          <thead className="muted text-left text-xs"><tr><th>Cohort</th><th>Size</th><th>D1</th><th>D7</th><th>D30</th></tr></thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.week.toISOString()} className="border-t border-border"><td>{wk(c.week)}</td><td>{c.size}</td><td>{pct(c.d1)}</td><td>{pct(c.d7)}</td><td>{pct(c.d30)}</td></tr>
            ))}
          </tbody>
        </table>
        {cohorts.length === 0 ? <p className="muted text-sm">No cohorts yet.</p> : null}
        <p className="text-sm">
          Active streakers: <strong>{streaks.activeStreakers}</strong> · average streak <strong>{streaks.avgStreak.toFixed(1)}</strong> days · 7+ days: <strong>{streaks.sevenPlus}</strong>
        </p>
      </Kpi>

      <Kpi title="Questions answered per student per week" question="Are they practising?" rule="If per-student volume falls while active students hold steady, content depth may be the limit — add questions to the most-practised topics.">
        <Bars data={volume.map((v) => ({ label: wk(v.week), value: v.perStudent, display: v.perStudent.toFixed(0) }))} />
        <p className="muted text-xs">Total answers last week: {volume.at(-1)?.answers ?? 0} by {volume.at(-1)?.students ?? 0} students</p>
      </Kpi>

      <Kpi title="Score improvement on the same topic" question="Is the content helping?" rule="If fewer than half of student-topic pairs improve, review explanations in the weakest topics first.">
        <p className="text-sm">
          First 5 answers <strong>{pct(improvement.firstAcc)}</strong> → latest 5 answers <strong>{pct(improvement.lastAcc)}</strong>
        </p>
        <p className="muted text-xs">{improvement.pairs} student-topic pairs with 10+ answers · {improvement.improved} improved</p>
        <h3 className="pt-1 text-sm font-semibold">Most often answered wrong (30d, 10+ answers)</h3>
        <ul className="space-y-1 text-sm">
          {missed.map((q) => (
            <li key={q.id} className="flex gap-2">
              <span className="w-10 shrink-0 font-semibold text-bad">{pct(q.wrongRate)}</span>
              <a href={`/admin/questions/${q.id}`} className="line-clamp-1 text-brand underline">{q.topic}: {q.stem}</a>
            </li>
          ))}
          {missed.length === 0 ? <li className="muted">Not enough answers yet.</li> : null}
        </ul>
      </Kpi>

      <Kpi title="Video solutions after a wrong answer" question="Are the videos useful?" rule="If students who watch don't do better on the next question than those who don't, review video choice/length before adding more.">
        <p className="text-sm">Watched after a wrong answer: <strong>{pct(video.watchRate)}</strong> <span className="muted">of {video.wrongWithVideoAvailable} wrong answers that had a video</span></p>
        <p className="text-sm">Next question correct — after video <strong>{pct(video.nextCorrectAfterVideo)}</strong> vs without <strong>{pct(video.nextCorrectWithoutVideo)}</strong></p>
      </Kpi>

      <Kpi title="Free → Premium" question="Will parents pay?" rule="If paywall viewers rarely pay, test price/plan framing; if few students reach the paywall, the free limit may be too generous.">
        <p className="text-sm">
          Paid at least once: <strong>{conv.paid}</strong> of {conv.students} students (<strong>{pct(conv.students ? conv.paid / conv.students : null)}</strong>) · active Premium now: <strong>{conv.activePremium}</strong>
        </p>
        <p className="text-sm">Saw the daily-limit paywall: {conv.paywallSeen} · paid afterwards: <strong>{pct(conv.paywallSeen ? conv.paidAfterPaywall / conv.paywallSeen : null)}</strong></p>
        <table className="w-full text-sm">
          <thead className="muted text-left text-xs"><tr><th>Plan</th><th>Billing</th><th>Channel</th><th>#</th><th>Revenue</th><th>Parent link</th></tr></thead>
          <tbody>
            {mix.map((r, i) => (
              <tr key={i} className="border-t border-border"><td>{r.plan.toLowerCase()}</td><td>{r.mode === "AUTO_RENEW" ? "auto" : "one-off"}</td><td>{r.channel}</td><td>{r.count}</td><td>{naira(r.revenueKobo)}</td><td>{r.viaParentLink}</td></tr>
            ))}
          </tbody>
        </table>
        {mix.length === 0 ? <p className="muted text-sm">No payments in the last 90 days.</p> : null}
      </Kpi>

      <Kpi title="Renewal rate" question="Do payers stay?" rule="If one-off (transfer) renewals trail card auto-renewals, strengthen the 7-day reminder and pay-link flow.">
        <p className="text-sm">
          <strong>{pct(renewal.rate)}</strong> of {renewal.ended} paid periods that ended in the last 90 days were renewed (paid again from 14 days before to 7 days after the end).
        </p>
      </Kpi>

      <Kpi title="Ratings & feedback" question="Are users happy?" rule="Add a 1-tap rating after the 3rd practice set before the pilot.">
        <p className="muted text-sm">In-app ratings aren&apos;t built yet. Student question reports are on the Flags page.</p>
      </Kpi>
    </div>
  );
}
