// WCAG AA contrast check for the colour tokens in src/app/globals.css (light + dark).
// Run: npx tsx scripts/check-contrast.mts
import { readFileSync } from "node:fs";

const css = readFileSync("src/app/globals.css", "utf8");
function block(selector: string) {
  const i = css.indexOf(selector);
  const body = css.slice(css.indexOf("{", i) + 1, css.indexOf("}", i));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]));
}
const light = block(":root {");
const dark = { ...light, ...block(':root[data-theme="dark"]') };

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const INK = "#16131f";
const subjects = ["maths", "physics", "chemistry", "biology", "english", "economics", "government", "literature", "geography", "general"];
type Pair = [fg: string, bg: string, min: number];
const pairs = (t: Record<string, string>): Pair[] => [
  // text on surfaces
  [t.ink, t.paper, 4.5], [t.ink, t.card, 4.5], [t["ink-2"], t.paper, 4.5], [t["ink-2"], t.card, 4.5],
  [t["primary-ink"], t.paper, 4.5], [t["primary-ink"], t.card, 4.5], [t["primary-ink"], t["primary-soft"], 4.5],
  [t["sun-ink"], t["sun-soft"], 4.5], [t["coral-ink"], t["coral-soft"], 4.5], [t["grape-ink"], t["grape-soft"], 4.5],
  [t["ok-ink"], t["ok-soft"], 4.5], [t["ok-ink"], t.card, 4.5], [t["oops-ink"], t["oops-soft"], 4.5], [t.danger, t["danger-soft"], 4.5],
  [t.ink, t["sun-soft"], 4.5], [t.ink, t["coral-soft"], 4.5], [t.ink, t["oops-soft"], 4.5], [t.ink, t["primary-soft"], 4.5],
  // text on bright fills (the fill's designated text colour)
  [t["on-primary"], t.primary, 4.5], [t["on-grape"], t.grape, 4.5],
  [INK, t.sun, 4.5], [INK, t.coral, 4.5], [INK, t.ok, 4.5], [INK, t.oops, 4.5], [INK, t.silver, 4.5], [INK, t.bronze, 4.5],
  ...subjects.flatMap((s): Pair[] => [[t[`${s}-on`], t[s], 4.5], [t[`${s}-ink`], t[`${s}-soft`], 4.5], [t.ink, t[`${s}-soft`], 4.5], [t["ink-2"], t[`${s}-soft`], 4.5]]),
  // non-text UI
  [t.focus, t.paper, 3], [t.primary, t.paper, 3],
];
const names = (t: Record<string, string>) => Object.fromEntries(Object.entries(t).map(([k, v]) => [v, k]));

let fails = 0;
for (const [label, t] of [["light", light], ["dark", dark]] as const) {
  const n: Record<string, string> = { ...names(t), [INK]: "ink-on-fill" };
  const rows = pairs(t).map(([fg, bg, min]) => {
    const r = ratio(fg, bg);
    if (r < min) fails++;
    return `${r >= min ? "ok  " : "FAIL"} ${r.toFixed(2).padStart(5)}  ${n[fg] ?? fg} on ${n[bg] ?? bg}`;
  });
  console.log(`\n== ${label}\n${rows.join("\n")}`);
}
console.log(fails ? `\n${fails} pairs below AA` : "\nall pairs meet WCAG AA");
process.exit(fails ? 1 : 0);
