# Design audit — before the redesign

## Stack and styling
- Next.js 16 App Router (Cache Components: each page has a static shell, and per-user data streams in behind `<Suspense>`), React 19, Tailwind CSS v4.
- Styling: tokens in `src/app/globals.css` (`:root` and a dark `@media` block), plus a few `@utility` helpers (`card`, `btn-*`, `input`, `chip`, `skeleton`). No component library and no icon set. Inline SVG is used in two places.
- System font stack only. KaTeX CSS is loaded globally.

## Screens and states
| Area | Screens | States that exist |
|---|---|---|
| Public | Landing `/`, Sign up, Log in, Parent pay `/pay/[token]`, Payment result | loading skeleton, expired link, payment pending / failed / success, unknown payment |
| Onboarding | `/onboarding` (one long form) | validation error |
| Student | Dashboard, Subjects, Subject topics, Practice runner, Leaderboard, Progress, Subject progress, Premium, Account | skeleton lists, "no scores yet", "no practice yet", "coming soon" topics, renewal banner, practice summary, daily-limit paywall, locked video, report form |
| Admin | Overview, Import, Review queue, Question bank, Question editor, Flags, Metrics | empty queue, no flags, import errors, no data yet |
| System | 404 (Next.js default), errors (Next.js default) | — |

## What looks generic
- System font everywhere and an all-green, flat SaaS palette: nothing says "students" or "Nigeria".
- **Emoji used as icons and rewards** (🔥 🥇 🎉 ⭐ 🔒 ✅ ▶), which render differently on every Android skin.
- The same `rounded-2xl` bordered white card for everything: subject, topic, KPI, paywall. No hierarchy.
- The landing page is the template layout: hero, then a grid of four identical boxes, then four numbered steps.
- Copy is serviceable but flat ("Your subjects", "See all", "Questions coming soon").
- Topics are a plain numbered list. There is no sense of a journey or of mastery.
- The leaderboard is a plain list. There is no podium, no rank movement and no reason to care about the reset.
- Correct and wrong answers only change colour. There's no reward moment, and the wrong state is a harsh red fill.

## What's inconsistent
- Some buttons are `<Link className="btn-…">`, some are `<button>`, some are inline styled (`btn bg-bad`). The pressed state is missing everywhere.
- Mastery and status chips each use their own one-off colour mixes.
- Headings range from `text-lg` to `text-4xl` with no scale. Numbers (points, streak, rank) look like body text.
- Dark mode follows the system only. There's no manual toggle.
- No subject identity: Maths and Physics look identical.
- Error and 404 pages are framework defaults.

## What breaks or is weak on small screens (360px)
- The onboarding class picker is a 4-column grid; "JSS 3" and "SS 3" crowd together at 360px.
- Dashboard streak/points card: two columns of text squeeze, and "x of y free questions left today" wraps badly.
- Leaderboard rows: name, flame, points and class compete; long names truncate early.
- Practice option buttons are fine for touch (min 56px), but the explanation panel is a grey box with no structure, and long display maths can push the card wider.
- The plan picker shows the price and "Popular with parents" chip together, which wraps awkwardly at 360px.
- The admin question bank needs horizontal scroll on phones. That's acceptable for admin.

## Constraints for the redesign
- Don't change logic, data models, API calls, routes or payment flows. The new elements (badges, streak calendar, rank change) are **read-only** views of existing tables (`attempts`, `weekly_scores`, `users`).
- Keep the JS budget. The baseline today is about 214 KB gzipped on the subject page, and nearly all of that is the framework. Add no animation library: CSS keyframes and the Web Animations API only.

---

## After the redesign

**System:** warm paper and ink tokens with dark mode (deep navy) and a manual toggle that doesn't flash. Electric-lime accent, one colour per subject, and "sticker" borders with hard shadows that push down on press. Bricolage Grotesque with Atkinson Hyperlegible Next, Lucide icons, and CSS-only textures (graph paper, ruled lines). 20 shared components are in `src/components/ds` (see `DESIGN_SYSTEM.md`). Every token pair passes WCAG AA in both themes (`scripts/check-contrast.mts`). The old one-off `ui.tsx` helpers and emoji icons are gone.

| Screen | What changed |
|---|---|
| Practice | Moved to a distraction-free `(focus)` layout (same URL) on graph paper. The sticky top bar has exit, a set progress bar, the streak flame and a points counter that counts up with a floating "+10". The question card has a subject-coloured header. Options are big sticker buttons with letter tiles. Correct pops with a tick, the word "Correct", light haptics and varied praise. Wrong shakes gently in calm clay with "Your answer", and the right answer is marked "Right answer". The explanation is a ruled "Workings" page whose numbered steps slide in one by one, plus a margin note after a wrong answer. "Watch the solution" opens a bottom sheet with the question one tap away and a ~10 KB poster; the iframe only loads on play. Locked videos open a friendly upgrade sheet. Reporting a question moved into a sheet. |
| Set results | Count-up score, a rubber stamp (Sharp! / Solid / Keep going), a points pill, retry or next-topic actions, and an expandable "Review what you missed" list with the workings. |
| Free limit | A non-aggressive upgrade sheet (what Premium unlocks, ask a parent, "Not now") plus a "Day done" stamp card. |
| Home | Leads with today: a growing flame with the streak count, a daily-goal ring, and a big subject-coloured "Continue where you stopped" card. Subject cards come in subject colours with icons and progress bars. A compact rank card shows movement against last week. There's a "You're in" celebration after onboarding (`/dashboard?welcome=1`). |
| Subjects / topics | Subject list with colour blocks and icons. Each subject is a zig-zag **level map**: numbered nodes connected by dotted paths, with mastered (subject fill and tick), in progress (accuracy ring), not started and coming soon (dashed lock). Subtopics are pill buttons. The header shows topic, started and mastered counts. |
| Leaderboard | Podium for the top 3 with trophies, rank-change arrows against last week, a live countdown to the Monday reset, a "You climbed N places" celebration, and your own row pinned above the nav. |
| Progress | Per-subject cards with strong / needs-work / not-started counts, subject-coloured accuracy bars, mastery chips (icon plus words) and a "Practise this next" action. The Premium detail view has a graph-paper weekly chart, difficulty rings and most-missed questions. |
| Profile | Avatar, class and exam chips, a stats grid, a 5-week streak calendar, a sticker-badge collection (locked silhouettes), subjects, plan (cancel renewal through a confirm sheet) and settings (theme toggle, edit plan, log out). |
| Premium / pay | Free-vs-Premium table with icons and the Premium column highlighted. Plan picker as sticker radio cards, payment methods shown with icons, and the ask-a-parent WhatsApp share. The parent pay page shows the child's avatar, questions practised and streak. Payment result: a "Paid" stamp for success, an hourglass for pending, a calm card for failed. |
| Landing | A self-answering question card in the hero (wrong, workings, then right, +10, streak 6 → 7). "How a study session goes" on an exercise-book page with a circled-word callout. Subject stickers, the streak and leaderboard hooks, a dark parents band with methods and live plan prices (cached query, still a static page), an FAQ and a final CTA. Subtle scroll reveals. |
| Auth / onboarding | Graph-paper auth pages with sticker forms and labelled hints. Onboarding is three one-question screens (class, exams, subjects) with big tappable choices, a progress bar and Back. |
| States | Content-shaped skeletons (dashboard, question, level map), doodled empty states with a next action, a friendly error page with an offline variant, and a 404 ("This page don waka"). |
| Admin | Same tokens inside `.calm`: flat buttons, thin borders, dense inputs, and a theme toggle. Old token classes are mapped across. |

**New read-only data** (no schema changes): badges, the streak calendar, rank change and per-user stats, all in `src/lib/gamify.ts`.

**Verification**
- Typecheck, lint and production build pass.
- 35 unit tests, 19 DB integration tests and 28 HTTP smoke checks pass on the production build. The smoke checks cover every student, admin and public page, plus the webhook and verify routes.
- The Playwright journey spec was updated for the new onboarding, sheet and option labels.

**Couldn't do**
- **Screenshots at 360 / 768 / 1280 in both themes, and the Playwright run.** Chromium's system libraries can't be installed on this machine (blocked by the permission system). Instead I worked out the tightest 360px layouts by hand and tightened them: leaderboard rows hide avatars on phones, plan prices shrink, and the level-map zig-zag is narrowed. **Please run `npx playwright install --with-deps chromium && npm run test:e2e` and look over the screens before shipping.**
- **Bundle:** JS on the subject page went from about 214 to about 224 KB gzipped (+10 KB, ~5%), from Lucide icons and the small client helpers. Fonts add about 75 KB of preloaded woff2 (I cut this from 111 KB by dropping Bricolage's optical-size axis). CSS is 15 KB gzipped.
- **Day 1 of the streak** still starts on the first answer (the logic is unchanged). The "You're in" moment invites that first answer instead of faking it.
- **Rank arrows** compare with last week's final rank. There's no within-week history to show day-to-day movement.

---

## Colour pass: bold colour-blocking (after feedback that the redesign felt muted)

Layout, components, typography and the sticker style are unchanged. Colour now fills large areas.

- **Tokens replaced:**
  - Ink `#16131F` and paper `#FFF8EC` as the resting background, white cards.
  - Cobalt as primary, Sunshine as reward, Hot Coral as pop.
  - Leaf / Soft Coral for correct and wrong.
  - Ten subject sets (fill, tint, deep shade, text-on-fill).
  - Dark mode on `#121024` with `#1E1B33` cards.
- **Contrast:** every text-on-fill and text-on-tint pair is checked by `scripts/check-contrast.mts` in both themes, and all pass AA. That decided the text colours: **white only on Cobalt and Grape**, ink everywhere else. The spec's Grape `#8E5CFF` fails with both ink and white, so it's deepened to `#7448FF`.
- **Screens:**
  - **Landing:** Cobalt hero with floating multi-colour stickers, filled subject tiles, a Sunshine streak/leaderboard band, a Grape parents/pricing band and a Coral final CTA.
  - **Home:** Sunshine header with streak and goal, a Cobalt "Continue" card, subject cards fully filled.
  - **Subjects:** Cobalt header and filled cards.
  - **Subject path:** the whole screen tinted by `data-screen`, a subject header, and nodes that are filled, half-filled or outlined.
  - **Practice:** subject-tint page and subject top bar, white options, Leaf/Soft Coral fills, Sunshine counters; Sunshine marker and subject-colour underlines in the workings.
  - **Leaderboard:** Cobalt header with a gold/silver/bronze podium, own row in Cobalt, Leaf/Soft Coral movement pills.
  - **Progress:** Coral header.
  - **Profile:** Cobalt identity card, colour stat tiles, Sunshine streak calendar, a colourful badge sheet with grey locked silhouettes.
  - **Premium / paywall:** Grape header and upgrade sheet with Sunshine buttons.
  - **Auth / onboarding:** Cobalt screen with white cards.
  - **States:** colourful doodles, tinted empty and error cards, skeletons tinted per section.
- **360px:** each colour block was worked out by hand and adjusted: full-bleed headers keep their content aligned with the column, and the dashboard header tiles were tightened. Small pills on coloured fills use a fixed white background, so they read the same in dark mode. A source scan confirmed that every bright fill sets an AA-safe text colour.
- **Still not done:** real screenshots at 360px in both themes. Chromium can't run on this machine. Please run the Playwright suite or check on a device.

## Desktop pass

- **Layout:** a sidebar replaces the bottom bar from 1024px up, and the main column widens to `max-w-6xl` with desktop grids on each screen. Full-bleed colour headers are sidebar-aware.
- **Podium:** each place has its own colour (gold / silver / bronze steps, a place-coloured avatar ring, white name plates and a points pill on the step).
- **Reported unstyled buttons** ("Start free", onboarding "Next"): both use `btn-sun`. It's generated correctly in both the dev and production CSS here, so the likely cause is a stale `globals.css` or Turbopack cache in the copied project.

## Dark-mode visibility pass

- **Root cause:** dark-mode outlines and hard shadows used a near-black `--line` on the navy background, so buttons, inputs, cards, options and progress tracks lost their edges. The dark `--line` is now chalk `#9B93C9`, the shadows are black, and the dividers are stronger. `check-contrast.mts` now also checks outline against background, card and paper-2 (all ≥ 3:1).
- Sunshine marker highlights in explanations now force ink text. It previously inherited the light dark-mode text and was unreadable.
- **Landing:** removed the hero's "No payment…" line. The hero CTA is a full-width (on phones) Sunshine button. The final CTA on Coral uses the new high-contrast **Ink** button.

## Sidebar overlap fix

- The sidebar was `position: fixed` with the content offset by padding, and the full-bleed headers were sized with `100vw` (which includes the scrollbar), so content could slide under the sidebar.
- The shell is now a two-column grid with a sticky sidebar column, and full-bleed blocks use container-query units on the content column.
- It's responsive in three steps: phones (top and bottom bars), tablets 768–1023px (icon rail), desktop ≥1024px (full sidebar).
