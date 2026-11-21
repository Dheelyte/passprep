# Design system — "the study desk, turned into a game"

**Bold colour-blocking.** Colour fills big areas: screen headers, full-width sections and whole cards. Cream paper is the *resting* background between the blocks. The shapes are "sticker" style: 2px ink borders and hard offset shadows, with no blurred shadows, glassmorphism, glows or gradient backgrounds. Admin screens use the same tokens without the game styling (`.calm`).

Everything lives in `src/app/globals.css` (tokens and utilities) and `src/components/ds/` (React components). Use the components and don't restyle them per screen.

## Colour

Tailwind classes come from `@theme`, e.g. `bg-primary`, `text-on-subj`, `bg-sun-soft`. Contrast is checked by `npx tsx scripts/check-contrast.mts`, which covers every text-on-fill, deep-on-tint and text-on-surface pair in light and dark mode. All pass WCAG AA.

### Palette

| Role | Token | Light | Text on it |
|---|---|---|---|
| Ink | `ink` / `line` / shadow | `#16131F` | — |
| Paper (resting bg) | `paper` | `#FFF8EC` | ink |
| White (cards) | `card` | `#FFFFFF` | ink |
| **Primary**: Electric Cobalt | `primary` · `primary-soft` · `primary-ink` | `#3355FF` · `#E3E8FF` · `#1A2C99` | **white** (`on-primary`, 5.4:1) |
| **Reward**: Sunshine | `sun` · `sun-soft` · `sun-ink` | `#FFC933` | ink (11.9:1) |
| **Pop**: Hot Coral | `coral` · `coral-soft` · `coral-ink` | `#FF5C5C` | ink (6.1:1) |
| Premium: Grape | `grape` · `grape-soft` · `grape-ink` | `#7448FF`¹ | **white** (`on-grape`) |
| Correct: Leaf | `ok` · `ok-soft` · `ok-ink` | `#34C759` | ink, with a check icon |
| Wrong: Soft Coral | `oops` · `oops-soft` · `oops-ink` | `#FF8A7A` | ink, with a cross icon |
| Podium | `sun` / `silver` / `bronze` | `#FFC933` / `#C9CED8` / `#E08A4F` | ink |

¹ The spec's Grape `#8E5CFF` fails AA with both ink (4.47) and white (4.10), so it's deepened to `#7448FF`, which passes with white text. Economics uses the same Grape.

### Subjects

Each subject has a bright **fill**, a light **tint** for backgrounds, a **deep** shade for text on the tint, and an **on** colour for text on the fill.

| Subject | Fill | Tint | Deep | Text on fill |
|---|---|---|---|---|
| Mathematics | `#3355FF` | `#E3E8FF` | `#1A2C99` | white |
| Physics | `#FF7A1A` | `#FFE9D6` | `#8A3A00` | ink |
| Chemistry | `#00B8A9` | `#D6F7F4` | `#005C55` | ink |
| Biology | `#34C759` | `#DDF7E3` | `#146B2C` | ink |
| English | `#E83E8C` | `#FCE1EE` | `#8A1650` | ink |
| Economics | `#7448FF` | `#EDE4FF` | `#4A2299` | white |
| Government | `#FF5C5C` | `#FFE2E0` | `#9B1C1C` | ink |
| Literature | `#C77DFF` | `#F4E6FF` | `#5E1A99` | ink |
| Geography | `#2BB3FF` | `#DCF2FF` | `#00527A` | ink |
| Other subjects (`general`) | Sunshine set | | | ink |

- `data-subject="<slug>"` on any element scopes `bg-subj`, `bg-subj-soft`, `text-subj-ink` and `text-on-subj` (and tints skeletons).
- `data-screen="<slug>"` on a page tints the **whole screen** (the body background becomes the subject tint).

### Dark mode

- Background `#121024` (deep ink-navy), cards `#1E1B33`, text `#F6F2FF`.
- Bright fills stay the same, so the text-on-fill rules are identical in both themes.
- Tints become deep tinted navies, and the deep shades become light pastels so text on tints still passes.
- Primary as *text* is `primary-ink` (`#A9B8FF` in dark). Raw Cobalt is only used for fills and large text.

### Where colour goes

| Screen | Dominant block | Supporting colours |
|---|---|---|
| Landing | Cobalt hero → paper → subject tiles → **Sunshine** streak section → **Grape** parents/pricing → **Coral** final CTA | floating subject stickers, sunshine points badge |
| Home | **Sunshine** header (streak + goal) | Cobalt "Continue" card, subject-filled cards |
| Subjects list | **Cobalt** header | one fully coloured card per subject |
| Subject / topic path | **Subject colour** header plus subject-tinted page | nodes: mastered = filled, in progress = half-filled, not started = outline |
| Practice | **Subject tint** page with a subject-coloured top bar | white option cards; chosen fills Leaf or Soft Coral; points and streak in Sunshine |
| Explanations | ruled page | **Sunshine marker** on key steps (`**bold**`); key terms (`*italic*`) get a wavy underline in the subject colour; step numbers in the subject colour |
| Leaderboard | **Cobalt** header with gold / silver / bronze podium | own row in Cobalt, rank-up pills in Leaf, rank-down in Soft Coral |
| Progress | **Coral** header | subject-coloured cards and bars |
| Profile | **Cobalt** identity card | Sunshine streak calendar, colourful badge sheet (locked = grey silhouettes) |
| Premium / paywall | **Grape** header and upgrade sheet | Sunshine buttons and highlights |
| Auth / onboarding | **Cobalt** screen with white form cards | Sunshine for checked choices and CTAs |
| Empty / error / loading | Sunshine-tint / coral-tint cards with colourful doodles | skeletons tinted in the section colour (`--skel`) |

### Rules

1. **One dominant colour per screen or section.** Everything else is a supporting accent.
2. Bright fills carry **ink** text. Only Cobalt and Grape (and Maths/Economics) carry **white**. Never put white on Sunshine, Tangerine, Leaf, Teal or Coral.
3. Never use colour alone for meaning. Correct and wrong always get an icon and words too.
4. Flat colour only. Gradients are reserved for tiny deliberate places (the streak flame) and are never used for backgrounds.
5. A small pill or tick that sits on a coloured fill uses a fixed white background (`bg-white`), so it reads the same in dark mode.

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

- `graph-paper`: faint grid in the current subject colour over the subject tint (practice).
- `ruled`: exercise-book lines with a red margin (the explanation "Workings" panel).
- `workings`: turns numbered steps into ruled lines with subject-coloured step numbers, Sunshine marker on **bold** and a subject-colour wavy underline on *italic* key terms.

## Components (`src/components/ds`)

| Component | Notes |
|---|---|
| `Button` / `ButtonLink` | `variant`: primary (Cobalt, white text) · sun (Sunshine, for use on Cobalt/Grape surfaces and rewards) · secondary · ghost (inherits its surface's text colour) · danger. `size`: sm · md · lg. `block`, `icon`, `iconRight`, `loading` (spinner plus disabled). Pushes into its shadow on press. |
| `SubmitButton` | Client. Shows `loading` while the parent `<form>`'s server action is pending. |
| `Card` / `CardLink` | Sticker surface. `tone`: card · paper · primary · sun · coral · grape · subject · subject-soft · ok · oops · info. `flat` removes the shadow, `padded={false}` removes padding. `CardLink` presses like a button. |
| `Chip` | Small pill: neutral · sun · primary · coral · grape · ok · oops · info · subject · subject-fill. Pair state colours with an `icon`. |
| `Stamp` | Rotated rubber stamp for results and achievements. `animate` runs the stamp-in. |
| `Field`, `Input`, `Textarea`, `Select`, `FormError` | `Field` wires the label, hint and error ids. Inputs use `aria-describedby` for hints. |
| `ProgressBar` / `ProgressRing` | Bar for sets and goals; ring for accuracy and mastery (`tone`: sun · primary · subject · ok). Both have accessible labels. |
| `Avatar` | Initials with a stable colour per name. |
| `Skeleton`, `SkeletonList`, `SkeletonDashboard`, `SkeletonQuestion`, `SkeletonPath` | Content-shaped loaders inside an `aria-busy` region. |
| `EmptyState` / `ErrorState` | Inline doodle illustration plus a next action. `ErrorState offline` shows the offline variant. |
| `Sheet` | Client. Bottom sheet on phones, centred modal from `sm` up. `tone`: card · grape · primary. Built on `<dialog>`, so focus trap and Esc come from the browser. |
| `Toast` | Client. One transient message, `aria-live`. |
| `Tabs` | URL-driven tabs; work without JS. |
| `ScreenHeader` | Full-bleed colour block at the top of a screen (`tone`: primary · sun · coral · grape · subject). The `bleed` utility makes any block full-width. |
| `Flame` | Streak flame that grows with streak length and goes grey when the streak is out. |
| `TrophyIcon`, `StickerBadge` | Podium trophies; collectible badges (locked = dashed silhouette plus a hint). |
| `Underline`, `Circled`, `MarginNote`, `DoodleArrow` | Hand-drawn emphasis. Use sparingly: at most one per screen. |
| `CountUp`, `ThemeToggle`, `RevealOnScroll`, `haptic()` | Small client helpers (count animation, theme, scroll reveals, light vibration). |

Icons come from **Lucide** only (`lucide-react`, tree-shaken), at stroke 2–2.5 with `aria-hidden` and a text label next to them. Don't use emoji as icons.

## Rules of thumb

- One Cobalt (or Sunshine on Cobalt/Grape surfaces) button per view is *the* action. Everything else is secondary or ghost.
- Subject colour goes on the subject's surfaces (cards, path nodes, bars). It is never the primary action.
- Show correct and wrong with **icon plus words plus colour**, never colour alone. "Wrong" is calm clay, never shaming red.
- Touch targets are at least 48px (`min-h-12`). Options are 56px.
- Copy voice: an older sibling who aced their exams. Short, warm, a little Naija ("No wahala", "You dey try"), never babyish.
- Admin pages sit inside `.calm`, which gives flat buttons, 1.5px borders and denser inputs. Don't add game styling there.
