# PassPrep: WAEC, NECO & JAMB practice

A mobile-first web app where Nigerian secondary school students practise topic by topic, get a step-by-step explanation for every answer, watch video solutions (Premium), and keep up daily streaks and a weekly leaderboard. Parents pay for Premium with Paystack: card (auto-renew) or bank transfer/USSD (fixed period).

"PassPrep" is a working name. To rename the app, change `src/lib/brand.ts`.

## Stack

- **Next.js 16** (App Router, Cache Components, Server Actions), React 19, TypeScript, Tailwind CSS v4
- **PostgreSQL 16** + Prisma 6
- Session cookie auth (signed JWT via `jose`, bcrypt passwords). Students sign in with a phone number **or** an email address.
- Markdown + KaTeX rendered on the server, so phones get HTML and no maths library
- Paystack (transactions, subscriptions, webhooks)
- Vitest (unit + DB integration), Playwright (browser end-to-end tests)

## Getting started

```bash
cp .env.example .env            # then set SESSION_SECRET (openssl rand -base64 32)
npm install
npm run db:up                   # Postgres on 127.0.0.1:5433 (docker compose)
npx prisma migrate dev          # create the schema
npm run db:seed                 # syllabus + 36 sample questions, plan prices, demo users
npm run dev                     # http://localhost:3100
```

Demo logins (password `password123`):

| Who | Login |
| --- | --- |
| Student (Tobi, SS 2) | `08012345678` |
| Admin | `admin@example.com` |
| Teacher (author) | `teacher@example.com` |
| Teacher (reviewer) | `reviewer@example.com` |

## How it's organised

```
prisma/schema.prisma          data model (+ CHECK constraints in the init migration)
prisma/seed-data/*.csv        starter content, in the same format teachers import
src/lib/                      server logic
  auth.ts session.ts          Data Access Layer (getCurrentUser / requireUser / requireRole)
  practice.ts                 set selection, answering (points, streak, limit, idempotency)
  streaks.ts points.ts time.ts  pure rules (Africa/Lagos days and weeks)
  entitlements.ts             free daily limit, Premium, video access
  progress.ts leaderboard.ts  strong/weak topics, weekly ranking
  billing.ts paystack.ts      checkout, fulfilment (idempotent), webhooks, pay links
  import.ts import-commit.ts  spreadsheet parsing, validation, import
  metrics.ts                  success metrics from the product plan
src/app/(auth)                sign up, log in, onboarding
src/app/(student)             dashboard, subjects, practice, leaderboard, progress, premium, account
src/app/pay/[token]           parent payment page (no account needed)
src/app/admin                 import, review queue, question bank, flags, metrics
src/app/api/paystack          verify callback + webhook
```

## Product rules (where to change them)

| Rule | Default | Where |
| --- | --- | --- |
| Free questions per day | 20 | `FREE_DAILY_LIMIT` env |
| Points | +10 correct, +2 wrong, 0 for re-solving; streak bonuses | `src/lib/points.ts` |
| Streak | first answer of each Lagos day; missing a day resets it | `src/lib/streaks.ts` |
| Leaderboard | weekly, Monday 00:00 Lagos; shows first name + initial | `src/lib/leaderboard.ts` |
| Mastery | last 20 answers per topic; strong ≥ 75%, weak < 50%, rated after 5 answers | `src/lib/progress.ts` |
| Practice set | 10 questions: unseen first, then previously wrong, then solved; easy → hard | `src/lib/practice.ts` |
| Plans and prices | **placeholders**: ₦1,500 monthly / ₦4,000 term (120 days) / ₦10,000 year / ₦3,000 exam pass (90 days) | `plan_prices` table (`prisma/seed.ts`) |

## Content workflow

1. **Syllabus** (admins): `Admin → Import → Syllabus` using `public/templates/syllabus-template.csv`. Re-importing updates names, order and tags. It never deletes anything.
2. **Questions** (teachers): fill `questions-template.xlsx` or `.csv`. Press **Check file** to see errors for each row (missing explanation, bad options, unknown topic, duplicates, invalid YouTube link). Press **Import** to load the valid rows. They arrive as **In review**.
3. **Review**: a *different* teacher approves the question (it is then published) or rejects it with a note. Authors cannot approve their own questions, and a teacher's edit to a live question sends it back to review.
4. **Improve**: in `Admin → Questions`, sort by *Most often answered wrong*, and work through the student reports in `Admin → Flags`.

The seed's YouTube links (`PLACEHOLD0x`) are placeholders. Replace them with real solution videos.

## Deploying (Vercel)

1. Create a Postgres database (Neon or Supabase from the Vercel Marketplace, or any hosted Postgres) and copy its connection string.
2. In Vercel → Project → Settings → Environment Variables, set `DATABASE_URL`, `SESSION_SECRET` (32+ random characters), `APP_URL` (e.g. `https://yourapp.vercel.app`, no trailing slash), `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `FREE_DAILY_LIMIT`, and optionally `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
3. Deploy. `npm run build` runs `prisma migrate deploy` first, so tables and default plan prices are created on the first deploy.
4. Create your admin account once, from your own machine: `DATABASE_URL="<production url>" npm run db:create-admin -- you@example.com "a-long-password" "Your Name"`.
5. Load the starter syllabus and sample questions: `DATABASE_URL="<production url>" npm run db:seed:content`. It is safe to run again: it skips questions that already exist, creates no accounts and leaves prices alone.
6. Add your own content at `/admin/import` (templates are in `public/templates`).

Don't run plain `npm run db:seed` on production: it creates demo staff accounts with the password `password123`.

## Google sign-in

1. In Google Cloud Console → APIs & Services → Credentials, create an **OAuth client ID** (type: Web application).
2. Add the authorised redirect URI `<APP_URL>/api/auth/google/callback` (e.g. `http://localhost:3100/api/auth/google/callback`).
3. Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` and restart. "Continue with Google" appears on the login and signup pages; it stays hidden while either is unset.

How accounts match: a returning Google user is found by their Google id. Otherwise an account with the same verified email is linked. Because email sign-ups here are never verified, linking removes that account's password, so from then on it signs in with Google only. A brand-new Google user gets a password-less student account and goes through onboarding. The flow uses PKCE, `state` and `nonce`, and checks the ID token against Google's keys (`src/lib/google.ts`).

## Payments (Paystack)

- Set `PAYSTACK_SECRET_KEY`, and set the webhook URL in the Paystack dashboard to `https://<your-domain>/api/paystack/webhook`.
- **Bank transfer / USSD / one-off card**: buys `period_days` of access. Paying again early adds time on top of what's left. A renewal banner shows 7 days before the end.
- **Card auto-renew**: create Plans in Paystack and put their `PLN_…` codes in `plan_prices.paystack_plan` (or set `PAYSTACK_PLAN_MONTHLY/TERMLY/YEARLY` before seeding). Without a plan code, checkout falls back to a one-off payment.
- Access unlocks immediately: the callback (`/api/paystack/verify`) verifies the payment with the Paystack API. The webhook repeats the same work, and both are safe to run together. A payment moves from pending to paid exactly once, the paid amount must cover the plan price, and webhook signatures are checked with HMAC-SHA512.
- **Ask a parent**: students create a 14-day link (`/pay/<token>`) and share it on WhatsApp. The parent pays without an account.

## Tests

```bash
npm test                    # unit tests (pure rules, import validation, webhook signature)
npm run test:integration    # against the dev DB + a mock Paystack: practice, limits, payments, import
npx tsx --env-file=.env tests/smoke.mts   # HTTP smoke test of every page (server on :3100 + mock Paystack on :3199, see playwright.config.ts env)
npm run test:e2e            # Playwright browser journey (needs `npx playwright install --with-deps chromium`)
```

## Not built yet (from the plan's later phases)

- Past questions and timed mock exams
- Parent and school/teacher progress views
- Email/SMS renewal reminders (the in-app banner exists)
- In-app ratings
- Shared rate limiting for more than one server instance (the current limiter is in memory)
# passprep
