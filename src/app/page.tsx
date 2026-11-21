import Link from "next/link";
import { cacheLife } from "next/cache";
import { ArrowRight, BookOpen, Check, CreditCard, Landmark, Lightbulb, Play, Smartphone, Target } from "lucide-react";
import { Logo } from "@/components/logo";
import { BRAND } from "@/lib/brand";
import { renderInline, renderMarkdown } from "@/lib/markdown";
import { activePlans } from "@/lib/billing";
import { FREE_DAILY_LIMIT } from "@/lib/entitlements";
import { ButtonLink, Chip, Circled, DoodleArrow, Flame, TrophyIcon, Underline, Avatar } from "@/components/ds";
import { ThemeToggle } from "@/components/ds/theme-toggle";
import { RevealOnScroll } from "@/components/ds/reveal";
import { HeroDemo } from "@/components/hero-demo";
import { SubjectIcon } from "@/components/subject-icon";

// Static page: prerendered and served instantly, even on 3G. Plan prices come from a cached query.

async function plans() {
  "use cache";
  cacheLife("hours");
  return activePlans();
}

const demo = {
  stem: "Evaluate $27^{-\\frac{2}{3}}$.",
  options: ["$\\frac{1}{9}$", "$9$", "$-9$", "$\\frac{1}{3}$"],
  workings: "1. **Negative power** → flip it: $\\dfrac{1}{27^{2/3}}$\n2. **Cube root** of 27 is 3\n3. **Square** it: $3^2 = 9$, so the answer is $\\frac{1}{9}$",
};

const subjects = [
  { slug: "mathematics", name: "Mathematics", live: true },
  { slug: "physics", name: "Physics", live: true },
  { slug: "chemistry", name: "Chemistry", live: false },
  { slug: "biology", name: "Biology", live: false },
  { slug: "english", name: "English", live: false },
];

const faqs = [
  { q: "Is it really free?", a: `Yes. Every subject, every topic, the written workings, streaks and the leaderboard are free. Free accounts get ${FREE_DAILY_LIMIT} questions a day. Premium removes the limit and unlocks every video solution.` },
  { q: "Will it chop my data?", a: "No app to download. It's a light website built for budget Android phones and slow networks. Videos only load when you tap play." },
  { q: "Who writes the questions?", a: "Teachers write original questions in WAEC, NECO and JAMB style. A second teacher checks every question and its workings before it goes live, and you can report anything that looks off." },
  { q: "Which subjects are ready?", a: "Mathematics and Physics now. Chemistry, Biology and English are next." },
  { q: "How do parents pay?", a: "Monthly, per term or yearly — by bank transfer, USSD or card through Paystack. You can send your parent a payment link on WhatsApp. Transfer plans never renew on their own." },
];

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG")}`;

export default async function Home() {
  const planList = await plans();
  return (
    <>
      <RevealOnScroll />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Logo />
        <nav className="flex items-center gap-1" aria-label="Account">
          <ThemeToggle />
          <Link href="/login" className="btn-ghost min-h-10 px-3 text-sm">Log in</Link>
          <ButtonLink href="/signup" size="sm" className="hidden sm:inline-flex">Start free</ButtonLink>
        </nav>
      </header>

      <main className="flex-1 overflow-x-clip">
        {/* HERO */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-6 md:grid-cols-[1.1fr_1fr] md:pt-14">
          <div>
            <p className="mb-4 flex flex-wrap gap-1.5">
              <Chip tone="neutral">JSS 3 – SS 3</Chip>
              <Chip tone="lime">WAEC · NECO · JAMB</Chip>
            </p>
            <h1 className="text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl">
              Ten questions. Every answer <Underline>explained</Underline>.
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink-2">
              Practise one topic at a time. Get the workings for every answer, a teacher&apos;s video when you&apos;re stuck, and a streak that keeps you coming back.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/signup" size="lg" iconRight={<ArrowRight className="size-5" />}>Start practising free</ButtonLink>
              <span className="text-sm font-semibold text-ink-2">No payment. Sign up with your phone number.</span>
            </div>
          </div>
          <HeroDemo stemHtml={renderMarkdown(demo.stem)} optionsHtml={demo.options.map((o) => renderInline(o))} workingsHtml={renderMarkdown(demo.workings)} />
        </section>

        {/* HOW IT WORKS — an exercise-book page */}
        <section className="border-y-2 border-line bg-paper-2 py-16" aria-labelledby="how-h">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="how-h" className="text-3xl font-extrabold sm:text-4xl" data-reveal>How a study session goes</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.2fr]">
              <ol className="ruled border-2 border-line py-4 pl-14 pr-4 shadow-sticker [border-radius:var(--r-sticker)]" data-reveal>
                {[
                  { icon: BookOpen, t: "Pick a topic", d: "Topics follow the syllabus — Number Bases, Motion, all the way through." },
                  { icon: Target, t: "Answer ten questions", d: "Tap your answer. You know right away if you got it." },
                  { icon: Lightbulb, t: "Read the workings", d: "Every answer comes with clear, step-by-step workings — not just the option." },
                  { icon: Play, t: "Still stuck? Watch it", d: "A short video of a teacher solving that exact question." },
                ].map(({ icon: Icon, t, d }, i) => (
                  <li key={t} className="relative py-2.5">
                    <span className="num absolute -left-11 top-2.5 grid size-8 place-items-center rounded-full border-2 border-line bg-lime text-sm text-on-fill">{i + 1}</span>
                    <p className="flex items-center gap-2 font-display text-lg font-extrabold"><Icon aria-hidden className="size-5" />{t}</p>
                    <p className="text-ink-2">{d}</p>
                  </li>
                ))}
              </ol>
              <div className="relative flex flex-col justify-center gap-5" data-reveal>
                <p className="max-w-md text-2xl font-display font-extrabold leading-snug">
                  Past-question books give you the option. We show you <Circled>how</Circled> to get it.
                </p>
                <DoodleArrow className="hidden text-ink-2 md:block" />
                <div className="sticker max-w-md -rotate-1 p-4">
                  <p className="mb-1 font-display text-xs font-extrabold uppercase tracking-wider text-ink-2">Workings</p>
                  <div className="prose-q workings pl-10 text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(demo.workings) }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUBJECTS */}
        <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="subj-h">
          <h2 id="subj-h" className="text-3xl font-extrabold sm:text-4xl" data-reveal>Your subjects, your colours</h2>
          <p className="muted mt-2 max-w-lg" data-reveal>Starting with the big ones. Each subject is a path of topics you unlock and master.</p>
          <ul className="mt-6 flex flex-wrap gap-3" data-reveal>
            {subjects.map((s, i) => (
              <li key={s.slug} data-subject={s.slug} style={{ rotate: `${[-2, 1.5, -1, 2, -1.5][i]}deg` }}>
                <span className={`flex items-center gap-2 border-2 border-line px-4 py-3 font-display text-lg font-extrabold [border-radius:var(--r-sticker)] ${s.live ? "bg-subj text-on-fill shadow-sticker" : "border-dashed bg-card text-ink-2"}`}>
                  <SubjectIcon slug={s.slug} className="size-6" />
                  {s.name}
                  {!s.live ? <span className="text-xs font-bold">soon</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* STREAK + LEADERBOARD HOOK */}
        <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-2" aria-labelledby="habit-h">
          <div className="sticker p-6" data-reveal>
            <h2 id="habit-h" className="text-3xl font-extrabold">Keep the flame alive</h2>
            <p className="muted mt-2">Answer one question a day and your streak grows. Miss a day and it starts again. Simple, and it works.</p>
            <div className="mt-5 flex items-end gap-2" aria-label="Example: a 7-day streak">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <div key={d} className="flex flex-1 flex-col items-center gap-1">
                  <Flame days={d} size={14 + d * 3} animate={d === 7} />
                  <span className="text-xs font-bold text-ink-2">{["M", "T", "W", "T", "F", "S", "S"][d - 1]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="sticker p-6" data-reveal>
            <h2 className="text-3xl font-extrabold">Climb the weekly board</h2>
            <p className="muted mt-2">Points for every question. Fresh leaderboard every Monday, so anyone can top it.</p>
            <ol className="mt-5 space-y-2" aria-label="Example leaderboard">
              {[
                { n: "Chidinma O.", p: 320, place: 1 as const },
                { n: "Ibrahim M.", p: 280, place: 2 as const },
                { n: "Funke A.", p: 240, place: 3 as const },
              ].map((r) => (
                <li key={r.n} className="flex items-center gap-3 rounded-[10px] border-2 border-line bg-paper px-3 py-2">
                  <TrophyIcon place={r.place} size={28} />
                  <Avatar name={r.n} size="sm" />
                  <span className="flex-1 font-display font-extrabold">{r.n}</span>
                  <span className="num">{r.p}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* PARENTS */}
        <section className="bg-band py-16 text-band-ink" aria-labelledby="parents-h">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
            <div data-reveal>
              <p className="font-display text-sm font-extrabold uppercase tracking-widest text-lime">For parents</p>
              <h2 id="parents-h" className="mt-2 text-3xl font-extrabold sm:text-4xl">Proof they&apos;re studying. A price that makes sense.</h2>
              <p className="mt-4 text-band-muted">Your child starts free. When they want unlimited practice and every video solution, choose a plan that fits — monthly, per term or for the whole year.</p>
              <ul className="mt-6 space-y-3">
                {[
                  "See strong and weak topics at a glance",
                  "Pay by bank transfer, USSD or card (secured by Paystack)",
                  "Your child can send you a payment link — no account needed",
                  "Transfer plans never renew without you",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-lime text-on-fill"><Check aria-hidden className="size-4" strokeWidth={3} /></span>
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-6 flex items-center gap-4 text-sm font-bold text-band-muted">
                <span className="flex items-center gap-1.5"><Landmark aria-hidden className="size-5" /> Transfer</span>
                <span className="flex items-center gap-1.5"><Smartphone aria-hidden className="size-5" /> USSD</span>
                <span className="flex items-center gap-1.5"><CreditCard aria-hidden className="size-5" /> Card</span>
              </p>
            </div>

            <div id="pricing" className="scroll-mt-6" data-reveal>
              <h3 className="mb-4 font-display text-xl font-extrabold">Premium plans</h3>
              <ul className="space-y-3">
                {planList.map((p) => (
                  <li key={p.code} className={`flex items-center justify-between gap-3 border-2 px-4 py-3 [border-radius:var(--r-sticker)] ${p.code === "TERMLY" ? "border-lime bg-lime text-on-fill" : "border-band-line bg-band-card"}`}>
                    <span>
                      <span className="block font-display text-lg font-extrabold">{p.name}</span>
                      <span className="text-sm opacity-80">{p.periodDays} days{p.code === "TERMLY" ? " · a full school term" : ""}</span>
                    </span>
                    <span className="num text-2xl">{naira(p.amountKobo)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-band-muted">Free plan: {FREE_DAILY_LIMIT} questions a day, written workings, streaks and the leaderboard — forever.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-16" aria-labelledby="faq-h">
          <h2 id="faq-h" className="text-3xl font-extrabold" data-reveal>Questions people ask</h2>
          <div className="mt-6 space-y-3" data-reveal>
            {faqs.map((f) => (
              <details key={f.q} className="group border-2 border-line bg-card [border-radius:var(--r-sticker)] open:shadow-sticker-sm">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-display text-lg font-extrabold">
                  {f.q}
                  <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-line bg-lime text-on-fill transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <p className="px-4 pb-4 text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-4 pb-20" data-reveal>
          <div className="sticker graph-paper mx-auto max-w-3xl px-6 py-10 text-center shadow-sticker-lg">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Your exam no go wait for you.</h2>
            <p className="muted mx-auto mt-3 max-w-md">Start with one topic today. Ten questions. Ten minutes. Free.</p>
            <ButtonLink href="/signup" size="lg" className="mt-6" iconRight={<ArrowRight className="size-5" />}>Start practising free</ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-line py-6 text-center text-sm text-ink-2">
        © {BRAND.name} · Made in Nigeria for Nigerian students
      </footer>
    </>
  );
}
