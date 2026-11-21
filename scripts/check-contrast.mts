// WCAG AA contrast check for the design tokens in src/app/globals.css (light + dark).
// Run: npx tsx scripts/check-contrast.mts
import { readFileSync } from "node:fs";

const css = readFileSync("src/app/globals.css", "utf8");
function block(selector: string) {
  const i = css.indexOf(selector);
  const body = css.slice(css.indexOf("{", i) + 1, css.indexOf("}", i));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}
const light = block(":root {");
const dark = { ...light, ...block(':root[data-theme="dark"]') };

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground, background, minimum] — 4.5 text, 3 large text / UI components
const INK_ON_FILL = "#1c1a16";
const subjects = ["maths", "physics", "chemistry", "biology", "english", "general"];
const pairs: [string, string, number][] = [
  ["ink", "paper", 4.5], ["ink", "card", 4.5], ["ink-2", "paper", 4.5], ["ink-2", "card", 4.5], ["ink-2", "paper-2", 4.5],
  ["ok", "ok-soft", 4.5], ["ok", "card", 4.5], ["oops", "oops-soft", 4.5], ["oops", "card", 4.5],
  ["danger", "danger-soft", 4.5], ["info", "info-soft", 4.5], ["info", "card", 4.5],
  ["line", "paper", 3], ["focus", "paper", 3], ["band-ink", "band", 4.5], ["band-muted", "band", 4.5], ["band-ink", "band-card", 4.5], ["band-line", "band", 3], ["lime", "band", 4.5],
  ...subjects.flatMap((s) => [[`${s}-ink`, `${s}-soft`, 4.5], [`${s}-ink`, "card", 4.5], [`${s}-ink`, "paper", 4.5]] as [string, string, number][]),
];

let fails = 0;
for (const [name, t] of [["light", light], ["dark", dark]] as const) {
  const rows: string[] = [];
  for (const [fg, bg, min] of pairs) {
    const r = ratio(t[fg], t[bg]);
    if (r < min) fails++;
    rows.push(`${r >= min ? "ok  " : "FAIL"} ${r.toFixed(2).padStart(5)}  ${fg} on ${bg}`);
  }
  // ink text on bright fills (lime buttons, subject fills, gold)
  for (const fill of ["lime", "lime-2", "gold", ...subjects]) {
    const r = ratio(INK_ON_FILL, t[fill]);
    if (r < 4.5) fails++;
    rows.push(`${r >= 4.5 ? "ok  " : "FAIL"} ${r.toFixed(2).padStart(5)}  ink(#1c1a16) on ${fill}`);
  }
  console.log(`\n== ${name}\n${rows.join("\n")}`);
}
console.log(fails ? `\n${fails} pairs below AA` : "\nall pairs meet WCAG AA");
process.exit(fails ? 1 : 0);
