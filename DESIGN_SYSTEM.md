# Design system — "the study desk, turned into a game"

Warm exercise-book paper, ink outlines, one loud accent (electric lime), and a colour for each subject. Student screens use the "sticker" shape language. Admin screens use the same tokens without the game styling (`.calm`).

Everything lives in `src/app/globals.css` (tokens and utilities) and `src/components/ds/` (React components). Use the components and don't restyle them per screen.

## Tokens

### Colour

Tailwind colour classes come from `@theme`, e.g. `bg-paper`, `text-ink-2`, `border-line`. Contrast is checked by `npx tsx scripts/check-contrast.mts`; every pair passes WCAG AA in both themes.

| Token | Use |
|---|---|
| `paper` / `paper-2` / `card` | page background / sunken areas / raised surfaces |
| `ink` / `ink-2` | body text / secondary text |
| `line` | 2px sticker borders (ink in light mode, chalk in dark mode) |
| `rule` | faint ruled lines, graph paper, dashed dividers |
| `lime` (+`lime-2`, `lime-soft`) | **the** accent: primary actions, rewards, "you" highlights. Always put `text-on-fill` on it |
| `ok`, `oops`, `danger`, `info` (+`-soft`) | correct / gentle "not quite" (clay, not alarm red) / destructive / informational |
| `gold` | 1st place, "popular" tags |
| `subj`, `subj-soft`, `subj-ink` | subject colour. Set by `data-subject="mathematics|physics|chemistry|biology|english"` on any ancestor |
| `band*` | always-dark contrast band (the parents section) |
| `on-fill` | ink text on bright fills (lime, gold, subject), the same in both themes |

Dark mode is a deep ink navy (`#0e1524`) with chalk outlines. It follows the system setting, and `ThemeToggle` stores a manual choice (`localStorage.theme` → `<html data-theme>`). An inline head script applies it before first paint, so there's no flash.

### Type

- **Display:** Bricolage Grotesque (`font-display`, also used for all `h1`–`h3`). Use the `num` utility for chunky numbers: points, streaks, ranks, scores.
- **Body:** Atkinson Hyperlegible Next (`font-sans`), designed for legibility at small sizes.
- Both are self-hosted by `next/font`, Latin subset only, `display: swap`. Together they preload about 75 KB of woff2.
- Scale: `text-xs` 12 · `sm` 14 · `base` 16 · `lg` 18 · `xl` 20 · `2xl` 24 · `3xl` 30 (page titles) · `4xl`+ (hero, scores).

### Space, shape, depth

- Spacing uses Tailwind's 4px base: `gap-2/3/4/5`, page gutters `px-4`, and sections spaced `space-y-5`.
- Radii: `--r-sm` 6, `--r-md` 10 (inputs, buttons), `--r-lg` 14, and `--r-sticker` `14px 10px 16px 12px` (slightly hand-cut, used for cards and options).
- Border: `--border` is 2px, in `line`.
- Shadows are hard offsets, never blurred: `shadow-sticker-sm` (2px), `shadow-sticker` (3px), `shadow-sticker-lg` (5px).

### Motion

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 120ms | press / hover |
| `--dur` | 200ms | most transitions |
| `--dur-slow` | 320ms | entrances, pop |
| `--dur-celebrate` | 600ms | stamps, score reveals |
| `--ease-out` / `--ease-spring` | | settle / bouncy reward |

- Animations use transform and opacity only.
- Ready-made classes: `anim-pop` (correct), `anim-shake` (wrong, gentle), `anim-rise` (enter), `anim-stamp` (badges), `anim-bump` (counter changed), `anim-float` (+points), `flame-flicker`.
- `steps-reveal` staggers explanation steps.
- Scroll reveals: add `data-reveal` and mount `<RevealOnScroll />` once on the page.
- With `prefers-reduced-motion`, movement becomes a short fade and press transforms are disabled.

### Textures (pure CSS, no images)

- `graph-paper`: practice and auth backgrounds.
- `ruled`: exercise-book lines with a red margin (the explanation "Workings" panel).
- `workings`: turns numbered steps into ruled lines with lime step numbers and highlighter-marked **bold** words.

## Components (`src/components/ds`)

| Component | Notes |
|---|---|
| `Button` / `ButtonLink` | `variant`: primary (lime) · secondary · ghost · danger. `size`: sm · md · lg. `block`, `icon`, `iconRight`, `loading` (spinner plus disabled). Pushes into its shadow on press. |
| `SubmitButton` | Client. Shows `loading` while the parent `<form>`'s server action is pending. |
| `Card` / `CardLink` | Sticker surface. `tone`: card · paper · lime · subject · subject-soft · ok · oops · info. `flat` removes the shadow, `padded={false}` removes padding. `CardLink` presses like a button. |
| `Chip` | Small pill: neutral · lime · ok · oops · info · subject · gold. Pair state colours with an `icon`. |
| `Stamp` | Rotated rubber stamp for results and achievements. `animate` runs the stamp-in. |
| `Field`, `Input`, `Textarea`, `Select`, `FormError` | `Field` wires the label, hint and error ids. Inputs use `aria-describedby` for hints. |
| `ProgressBar` / `ProgressRing` | Bar for sets and goals; ring for accuracy and mastery (`tone`: lime · subject · ok). Both have accessible labels. |
| `Avatar` | Initials with a stable colour per name. |
| `Skeleton`, `SkeletonList`, `SkeletonDashboard`, `SkeletonQuestion`, `SkeletonPath` | Content-shaped loaders inside an `aria-busy` region. |
| `EmptyState` / `ErrorState` | Inline doodle illustration plus a next action. `ErrorState offline` shows the offline variant. |
| `Sheet` | Client. Bottom sheet on phones, centred modal from `sm` up. Built on `<dialog>`, so focus trap and Esc come from the browser. |
| `Toast` | Client. One transient message, `aria-live`. |
| `Tabs` | URL-driven tabs; work without JS. |
| `Flame` | Streak flame that grows with streak length and goes grey when the streak is out. |
| `TrophyIcon`, `StickerBadge` | Podium trophies; collectible badges (locked = dashed silhouette plus a hint). |
| `Underline`, `Circled`, `MarginNote`, `DoodleArrow` | Hand-drawn emphasis. Use sparingly: at most one per screen. |
| `CountUp`, `ThemeToggle`, `RevealOnScroll`, `haptic()` | Small client helpers (count animation, theme, scroll reveals, light vibration). |

Icons come from **Lucide** only (`lucide-react`, tree-shaken), at stroke 2–2.5 with `aria-hidden` and a text label next to them. Don't use emoji as icons.

## Rules of thumb

- One lime thing per view should be *the* action. Everything else is secondary or ghost.
- Subject colour goes on the subject's surfaces (cards, path nodes, bars). It is never the primary action.
- Show correct and wrong with **icon plus words plus colour**, never colour alone. "Wrong" is calm clay, never shaming red.
- Touch targets are at least 48px (`min-h-12`). Options are 56px.
- Copy voice: an older sibling who aced their exams. Short, warm, a little Naija ("No wahala", "You dey try"), never babyish.
- Admin pages sit inside `.calm`, which gives flat buttons, 1.5px borders and denser inputs. Don't add game styling there.
