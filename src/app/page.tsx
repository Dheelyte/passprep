import Link from "next/link";
import { cacheLife } from "next/cache";
import { ArrowRight, BookOpen, Check, CreditCard, Landmark, Lightbulb, Medal, Play, Smartphone, Target } from "lucide-react";
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
  try {
    const list = await activePlans();
    cacheLife("hours");
    return list;
  } catch (e) {
    // Never fail the whole page (or the build) over prices: show it without the price list and retry soon.
    console.error("landing: could not load plan prices", e);
    cacheLife("minutes");
    return [];
  }
}

const demo = {
  stem: "Evaluate $27^{-\\frac{2}{3}}$.",
  options: ["$\\frac{1}{9}$", "$9$", "$-9$", "$\\frac{1}{3}$"],
  workings: "1. **Negative power** → flip it: $\\dfrac{1}{27^{2/3}}$\n2. **Cube root** of 27 is 3\n3. **Square** it: $3^2 = 9$, so the answer is $\\frac{1}{9}$",
};

const subjects = [
  { slug: "mathematics", name: "Mathematics", status: "Ready now" },
  { slug: "physics", name: "Physics", status: "Starting now" },
  { slug: "chemistry", name: "Chemistry", status: "Coming soon" },
  { slug: "biology", name: "Biology", status: "Coming soon" },
  { slug: "english", name: "English", status: "Coming soon" },
];

const faqs = [
  { q: "Is it really free?", a: `Yes. Every subject, every topic, the written workings, streaks and the leaderboard are free. Free accounts get ${FREE_DAILY_LIMIT} questions a day. Premium removes the limit and unlocks every video solution.` },
  { q: "Will it chop my data?", a: "No app to download. It's a light website built for budget Android phones and slow networks. Videos only load when you tap play. Works on any phone with a browser." },
  { q: "Who writes the questions?", a: "Teachers write original questions in WAEC, NECO and JAMB style. A second teacher checks every question and its workings before it goes live, and you can report anything that looks off." },
  { q: "Which subjects are ready?", a: "Mathematics is ready now, and Physics is starting with its first topics. Chemistry, Biology and English are next." },
  { q: "How do parents pay?", a: "Monthly, per term or yearly — by bank transfer, USSD or card through Paystack. You can send your parent a payment link on WhatsApp. Transfer plans never renew on their own." },
];

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG")}`;

export default async function Home() {
  const planList = await plans();
  return (
    <>
      <RevealOnScroll />
      {/* HERO — Cobalt block */}
      <div className="bg-primary text-on-primary">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <Logo />
          <nav className="flex items-center gap-1" aria-label="Account">
            <ThemeToggle />
            <Link href="/login" className="btn-ghost min-h-10 px-3 text-sm">Log in</Link>
            <ButtonLink href="/signup" variant="sun" size="sm" className="hidden sm:inline-flex">Start free</ButtonLink>
          </nav>
        </header>
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-8 md:grid-cols-[1.1fr_1fr] md:pt-14">
          <div>
            <p className="mb-4 flex flex-wrap gap-1.5">
              <Chip tone="neutral" className="text-ink">JSS 3 – SS 3</Chip>
              <Chip tone="sun">WAEC · NECO · JAMB</Chip>
            </p>
            <h1 className="text-[2.25rem] font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              WAEC, NECO &amp; JAMB practice with every answer <Underline>explained</Underline>
            </h1>
            <p className="mt-5 max-w-md text-lg font-semibold">
              Pick a topic from your syllabus and answer 10 questions. Every answer shows the working, so you learn the method, not just the letter. Stuck? Watch a teacher solve that exact question.
            </p>
            <div className="mt-8">
              <ButtonLink href="/signup" variant="sun" size="lg" className="w-full sm:w-auto" iconRight={<ArrowRight className="size-5" />}>Start practising free</ButtonLink>
            </div>
          </div>
          <div className="relative text-ink">
            {/* floating stickers */}
            <span aria-hidden data-subject="physics" className="absolute -left-2 top-1/3 z-20 hidden -rotate-12 items-center gap-1.5 rounded-full border-2 border-line bg-subj px-3 py-1 font-display text-sm font-extrabold text-on-subj shadow-sticker-sm sm:flex"><SubjectIcon slug="physics" className="size-4" /> Physics</span>
            <span aria-hidden data-subject="chemistry" className="absolute -right-3 bottom-10 z-20 flex rotate-6 items-center gap-1.5 rounded-full border-2 border-line bg-subj px-3 py-1 font-display text-sm font-extrabold text-on-subj shadow-sticker-sm"><SubjectIcon slug="chemistry" className="size-4" /> Chemistry</span>
            <span aria-hidden data-subject="english" className="absolute -bottom-5 left-6 z-20 flex -rotate-3 items-center gap-1.5 rounded-full border-2 border-line bg-subj px-3 py-1 font-display text-sm font-extrabold text-on-subj shadow-sticker-sm"><Medal className="size-4" /> Badge unlocked</span>
            <HeroDemo stemHtml={renderMarkdown(demo.stem)} optionsHtml={demo.options.map((o) => renderInline(o))} workingsHtml={renderMarkdown(demo.workings)} />
          </div>
        </section>
      </div>

      <main className="flex-1">
        {/* HOW IT WORKS — paper rest + exercise book */}
        <section className="border-y-2 border-line py-16" aria-labelledby="how-h">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="how-h" className="text-3xl font-extrabold sm:text-4xl" data-reveal>How a study session goes</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.2fr]">
              <ol className="ruled border-2 border-line py-4 pl-14 pr-4 shadow-sticker [border-radius:var(--r-sticker)]" data-reveal>
                {[
                  { icon: BookOpen, t: "Pick a topic", d: "Number Bases, Motion, Indices: topics follow the syllabus, so you study what's on the exam.", c: "bg-primary text-on-primary" },
                  { icon: Target, t: "Answer 10 questions", d: "Tap an answer and know at once if you got it. No waiting for a teacher to mark it.", c: "bg-coral text-on-fill" },
                  { icon: Lightbulb, t: "Read the workings", d: "Every answer is explained step by step, so next time you can solve it yourself.", c: "bg-sun text-on-fill" },
                  { icon: Play, t: "Still stuck? Watch it", d: "A short video of a teacher solving that exact question.", c: "bg-ok text-on-fill" },
                ].map(({ icon: Icon, t, d, c }, i) => (
                  <li key={t} className="relative py-2.5">
                    <span className={`num absolute -left-11 top-2.5 grid size-8 place-items-center rounded-full border-2 border-line text-sm ${c}`}>{i + 1}</span>
                    <p className="flex items-center gap-2 font-display text-lg font-extrabold"><Icon aria-hidden className="size-5" />{t}</p>
                    <p className="text-ink-2">{d}</p>
                  </li>
                ))}
              </ol>
              <div className="relative flex flex-col justify-center gap-5" data-reveal data-subject="mathematics">
                <p className="max-w-md font-display text-2xl font-extrabold leading-snug">
                  Past-question books give you the option. We show you <Circled color="var(--coral)">how</Circled> to get it.
                </p>
                <DoodleArrow className="hidden text-coral md:block" />
                <div className="sticker max-w-md -rotate-1 p-4">
                  <p className="mb-1 font-display text-xs font-extrabold uppercase tracking-wider text-ink-2">Workings</p>
                  <div className="prose-q workings pl-10 text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(demo.workings) }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUBJECTS — each in its own colour */}
        <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="subj-h">
          <h2 id="subj-h" className="text-3xl font-extrabold sm:text-4xl" data-reveal>Start with Maths. More subjects are on the way.</h2>
          <p className="muted mt-2 max-w-lg" data-reveal>Each subject is a path of syllabus topics. Clear one, unlock the next.</p>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5" data-reveal>
            {subjects.map((s, i) => (
              <li key={s.slug} data-subject={s.slug} style={{ rotate: `${[-2, 1.5, -1, 2, -1.5][i]}deg` }}>
                <span className={`flex min-h-32 flex-col justify-between border-2 border-line bg-subj p-4 text-on-subj shadow-sticker [border-radius:var(--r-sticker)]`}>
                  <span className="grid size-11 place-items-center rounded-full border-2 border-line bg-card text-ink"><SubjectIcon slug={s.slug} className="size-6" /></span>
                  <span>
                    <span className="block font-display text-xl font-extrabold">{s.name}</span>
                    <span className="text-sm font-bold">{s.status}</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* STREAK + LEADERBOARD — Sunshine block */}
        <section className="border-y-2 border-line bg-sun py-16 text-on-fill" aria-labelledby="habit-h">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-2">
            <div className="sticker p-6 text-ink" data-reveal>
              <h2 id="habit-h" className="text-3xl font-extrabold">Keep the flame alive</h2>
              <p className="muted mt-2">Answer one question a day and your streak grows. Miss a day and it starts again from zero.</p>
              <div className="mt-5 flex items-end gap-2" aria-label="Example: a 7-day streak">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <div key={d} className="flex flex-1 flex-col items-center gap-1">
                    <Flame days={d} size={14 + d * 3} animate={d === 7} />
                    <span className="text-xs font-bold text-ink-2">{["M", "T", "W", "T", "F", "S", "S"][d - 1]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="sticker p-6 text-ink" data-reveal>
              <h2 className="text-3xl font-extrabold">Climb the weekly board</h2>
              <p className="muted mt-2">Every question earns points. The board resets every Monday, so a new student can be top by Friday.</p>
              <ol className="mt-5 space-y-2" aria-label="Example leaderboard">
                {[
                  { n: "Chidinma O.", p: 320, place: 1 as const, c: "bg-sun" },
                  { n: "Ibrahim M.", p: 280, place: 2 as const, c: "bg-silver" },
                  { n: "Funke A.", p: 240, place: 3 as const, c: "bg-bronze" },
                ].map((r) => (
                  <li key={r.n} className={`flex items-center gap-3 rounded-[10px] border-2 border-line px-3 py-2 text-on-fill ${r.c}`}>
                    <TrophyIcon place={r.place} size={28} />
                    <Avatar name={r.n} size="sm" />
                    <span className="flex-1 font-display font-extrabold">{r.n}</span>
                    <span className="num">{r.p}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* PARENTS + PRICING — Grape block with Sunshine highlights */}
        <section className="bg-grape py-16 text-on-grape" aria-labelledby="parents-h">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
            <div data-reveal>
              <p className="inline-block rounded-full border-2 border-line bg-sun px-3 py-0.5 font-display text-sm font-extrabold uppercase tracking-widest text-on-fill">For parents</p>
              <h2 id="parents-h" className="mt-3 text-3xl font-extrabold sm:text-4xl">Proof they&apos;re studying. A price that makes sense.</h2>
              <p className="mt-4 font-semibold">Your child starts free. When they&apos;re ready for unlimited practice and every video solution, pick monthly, per term or yearly. Pay by transfer, USSD or card.</p>
              <ul className="mt-6 space-y-3 font-semibold">
                {[
                  "See their strong and weak topics at a glance",
                  "Pay by bank transfer, USSD or card, secured by Paystack",
                  "Your child can send you a payment link on WhatsApp. You don't need an account.",
                  "Transfer plans never renew on their own",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 border-line bg-sun text-on-fill"><Check aria-hidden className="size-4" strokeWidth={3} /></span>
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-6 flex flex-wrap items-center gap-2 text-sm font-bold">
                {[{ I: Landmark, t: "Transfer" }, { I: Smartphone, t: "USSD" }, { I: CreditCard, t: "Card" }].map(({ I, t }) => (
                  <span key={t} className="flex items-center gap-1.5 rounded-full border-2 border-line bg-card px-3 py-1 text-ink"><I aria-hidden className="size-4" /> {t}</span>
                ))}
              </p>
            </div>

            <div id="pricing" className="scroll-mt-6" data-reveal>
              <h3 className="mb-4 font-display text-xl font-extrabold">Premium plans</h3>
              {planList.length === 0 ? <p className="font-semibold">Monthly, per term or yearly. See prices after you sign up.</p> : null}
              <ul className="space-y-3">
                {planList.map((p) => (
                  <li key={p.code} className={`flex items-center justify-between gap-3 border-2 border-line px-4 py-3 shadow-sticker [border-radius:var(--r-sticker)] ${p.code === "TERMLY" ? "bg-sun text-on-fill" : "bg-card text-ink"}`}>
                    <span>
                      <span className="block font-display text-lg font-extrabold">{p.name}</span>
                      <span className="text-sm font-semibold">{p.periodDays} days{p.code === "TERMLY" ? " · a full school term" : ""}</span>
                    </span>
                    <span className="num text-2xl">{naira(p.amountKobo)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-semibold">Free plan: {FREE_DAILY_LIMIT} questions a day, written workings, streaks and the leaderboard — forever.</p>
            </div>
          </div>
        </section>

        {/* FAQ — paper rest */}
        <section className="mx-auto max-w-3xl px-4 py-16" aria-labelledby="faq-h">
          <h2 id="faq-h" className="text-3xl font-extrabold" data-reveal>Questions people ask</h2>
          <div className="mt-6 space-y-3" data-reveal>
            {faqs.map((f) => (
              <details key={f.q} className="group border-2 border-line bg-card [border-radius:var(--r-sticker)] open:shadow-sticker-sm">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-display text-lg font-extrabold">
                  {f.q}
                  <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-line bg-coral text-on-fill transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <p className="px-4 pb-4 text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL CTA — Coral block */}
        <section className="border-t-2 border-line bg-coral px-4 py-16 text-center text-on-fill" data-reveal>
          <h2 className="text-3xl font-extrabold sm:text-5xl">WAEC is coming. Start your first topic tonight.</h2>
          <p className="mx-auto mt-3 max-w-md text-lg font-semibold">One topic. 10 questions. Free, and you don&apos;t need a card.</p>
          <ButtonLink href="/signup" variant="ink" size="lg" className="mt-6 w-full sm:w-auto" iconRight={<ArrowRight className="size-5" />}>Start practising free</ButtonLink>
        </section>
      </main>

      <footer className="border-t-2 border-line bg-ink py-6 text-center text-sm font-semibold text-paper">
        © {BRAND.name} · Made in Nigeria for Nigerian students
      </footer>
    </>
  );
}
