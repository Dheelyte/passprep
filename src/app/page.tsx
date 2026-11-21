import Link from "next/link";
import { Logo } from "@/components/logo";
import { BRAND } from "@/lib/brand";
import { renderInline, renderMarkdown } from "@/lib/markdown";

// Fully static page: prerendered and served instantly, even on slow networks.

const sample = {
  stem: "Evaluate $27^{-\\frac{2}{3}}$.",
  options: ["$\\frac{1}{9}$", "$9$", "$-9$", "$\\frac{1}{3}$"],
  chosen: 2,
  correct: 0,
  explanation:
    "Deal with each part of the power in turn:\n\n1. **Negative power** means reciprocal: $\\dfrac{1}{27^{\\frac{2}{3}}}$\n2. **Denominator 3** means cube root: $\\sqrt[3]{27} = 3$\n3. **Numerator 2** means square: $3^2 = 9$\n\nSo the answer is $\\dfrac{1}{9}$. A negative power never makes the answer negative — it flips it.",
};

const pains = [
  { t: "Answers without reasons", d: "Most past-question books only show the right option. Here, every question comes with full working." },
  { t: "Questions grouped by year", d: "Practise one topic until you master it, in the order the syllabus teaches it." },
  { t: "Stuck at night with no teacher", d: "Watch a short video of a teacher solving the question — any time." },
  { t: "Hard to keep going alone", d: "Daily streaks, points and a weekly leaderboard keep revision going until exam day." },
];

const steps = [
  { t: "Pick your class, exams and subjects", d: "Sign up with your phone number in under two minutes." },
  { t: "Choose a topic", d: "Topics follow the WAEC, NECO and JAMB syllabus, from Number Bases to Probability." },
  { t: "Answer 10 questions", d: "See right away if you're correct — then read the step-by-step explanation." },
  { t: "Come back tomorrow", d: "Keep your streak, climb the leaderboard and watch weak topics turn strong." },
];

const faqs = [
  { q: "Is it really free?", a: "Yes. Every subject and topic, written explanations, streaks and the leaderboard are free. Free accounts get a set number of questions each day. Premium removes the limit and unlocks every video solution." },
  { q: "Will it work on my phone and data?", a: "Yes. It's a website built for low-cost Android phones and slow connections — no app download. Videos only load when you tap to watch them." },
  { q: "Who writes the questions?", a: "Teachers write original questions in the WAEC, NECO and JAMB style. A second teacher checks every question and explanation before it goes live, and you can report any question you think is wrong." },
  { q: "Which subjects are available?", a: "We're starting with Mathematics (SS 1 – SS 3) and Physics, with Chemistry, Biology and English coming next." },
  { q: "How do parents pay for Premium?", a: "Monthly, per term or yearly — by bank transfer, USSD or card through Paystack. Students can send their parent a payment link on WhatsApp. Bank transfer plans don't renew automatically." },
];

export default function Home() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost min-h-10 px-3 text-sm">Log in</Link>
          <Link href="/signup" className="btn-primary min-h-10 px-4 text-sm">Start free</Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-5xl items-center gap-8 px-4 pb-12 pt-6 md:grid-cols-2 md:pt-12">
          <div>
            <p className="chip mb-3 bg-brand-soft text-brand">For JSS 3 – SS 3 · WAEC · NECO · JAMB</p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Master every WAEC, NECO and JAMB topic in 10-question sets
            </h1>
            <p className="muted mt-4 text-lg">
              Practise topic by topic. Get a step-by-step explanation for every answer — and a short video when you&apos;re stuck.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link href="/signup" className="btn-primary text-lg">Start practising free</Link>
              <a href="#how" className="btn-secondary">See how it works</a>
            </div>
            <p className="muted mt-3 text-sm">No payment needed. Sign up with your phone number.</p>
          </div>

          <figure className="card shadow-sm" aria-label="Example question with explanation">
            <figcaption className="muted mb-2 flex justify-between text-xs">
              <span>Mathematics › Indices</span>
              <span>Question 3 of 10</span>
            </figcaption>
            <div className="prose-q mb-3" dangerouslySetInnerHTML={{ __html: renderMarkdown(sample.stem) }} />
            <ul className="space-y-1.5">
              {sample.options.map((o, i) => {
                const state = i === sample.correct ? "border-ok bg-ok-soft" : i === sample.chosen ? "border-bad bg-bad-soft" : "border-border opacity-70";
                return (
                  <li key={i} className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 ${state}`}>
                    <span className="grid size-7 place-items-center rounded-full bg-surface-2 text-xs font-bold">{i === sample.correct ? "✓" : i === sample.chosen ? "✗" : "ABCD"[i]}</span>
                    <span className="prose-q" dangerouslySetInnerHTML={{ __html: renderInline(o) }} />
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 rounded-xl bg-bad-soft px-3 py-2 text-sm font-semibold text-bad">Not quite — the answer is A.</p>
            <div className="mt-2 rounded-xl bg-surface-2 p-3 text-sm">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Step-by-step</p>
              <div className="prose-q" dangerouslySetInnerHTML={{ __html: renderMarkdown(sample.explanation) }} />
            </div>
            <p className="mt-2 rounded-xl border border-border px-3 py-2 text-center text-sm font-semibold">▶ Watch solution</p>
          </figure>
        </section>

        <section className="bg-surface py-12">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-bold">Revision that actually teaches you</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {pains.map((p) => (
                <li key={p.t} className="rounded-2xl border border-border p-4">
                  <h3 className="font-semibold">{p.t}</h3>
                  <p className="muted mt-1 text-sm">{p.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-5xl scroll-mt-4 px-4 py-12">
          <h2 className="text-2xl font-bold">How it works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.t} className="card">
                <span className="grid size-8 place-items-center rounded-full bg-brand font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 font-semibold">{s.t}</h3>
                <p className="muted mt-1 text-sm">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-brand-soft py-12">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold">For parents</h2>
              <p className="mt-2">
                Your child starts free. When they want unlimited practice and every video solution, choose a monthly, termly or yearly Premium plan.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>✅ Pay by bank transfer, USSD or card (secured by Paystack)</li>
                <li>✅ Your child can send you a payment link — no account needed</li>
                <li>✅ Bank transfer plans never renew without you</li>
                <li>✅ See their strong and weak topics</li>
              </ul>
            </div>
            <div className="card self-start">
              <h3 className="font-semibold">Free vs Premium</h3>
              <table className="mt-2 w-full text-sm">
                <tbody className="divide-y divide-border">
                  {[
                    ["All subjects and topics", "✓", "✓"],
                    ["Step-by-step explanations", "✓", "✓"],
                    ["Practice questions", "Daily limit", "Unlimited"],
                    ["Video solutions", "Samples", "All"],
                    ["Progress tracking", "Basic", "Detailed"],
                  ].map(([f, a, b]) => (
                    <tr key={f}>
                      <th scope="row" className="py-2 text-left font-medium">{f}</th>
                      <td className="muted py-2">{a}</td>
                      <td className="py-2 font-semibold text-brand">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="text-2xl font-bold">Questions</h2>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
            {faqs.map((f) => (
              <details key={f.q} className="group px-4 py-3">
                <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between font-semibold">
                  {f.q}
                  <span aria-hidden className="text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="muted mt-1 text-sm">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-4 pb-16 text-center">
          <h2 className="text-2xl font-bold">Your next exam is closer than you think</h2>
          <p className="muted mt-2">Start with one topic today. It&apos;s free.</p>
          <Link href="/signup" className="btn-primary mt-5 text-lg">Start practising free</Link>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted">
        © {BRAND.name} · Built in Nigeria for Nigerian students
      </footer>
    </>
  );
}
