// Shared design for generated share cards (Open Graph / Twitter / WhatsApp previews).
// Rendered by next/og (Satori): flexbox only, inline styles, fonts loaded from assets/fonts.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { BRAND } from "./brand";

export const OG_SIZE = { width: 1200, height: 630 };

export const C = {
  ink: "#16131f", paper: "#fff8ec", card: "#ffffff", primary: "#3355ff", sun: "#ffc933", sunSoft: "#fff1c4",
  coral: "#ff5c5c", grape: "#7448ff", ok: "#34c759", okSoft: "#ddf7e3", muted: "#5b566b",
};

// Read synchronously, once: async file reads would stop Next from building the images ahead of time.
const font = (f: string) => readFileSync(join(process.cwd(), "assets/fonts", f));
let fonts: ReturnType<typeof load> | undefined;
const load = () => {
  const [display, displaySemi, body] = [
    font("bricolage-grotesque-latin-800-normal.woff"),
    font("bricolage-grotesque-latin-600-normal.woff"),
    font("atkinson-hyperlegible-next-latin-700-normal.woff"),
  ];
  return [
    { name: "Display", data: display, weight: 800 as const, style: "normal" as const },
    { name: "Display", data: displaySemi, weight: 600 as const, style: "normal" as const },
    { name: "Body", data: body, weight: 700 as const, style: "normal" as const },
  ];
};

export function ogFonts() {
  return (fonts ??= load());
}

/** The tick-in-a-sticker logo, as in the app. */
export function OgLogo({ size = 56 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.3 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" style={{ transform: "rotate(-6deg)" }}>
        <rect x="3" y="3" width="34" height="34" rx="9" fill={C.ink} />
        <rect x="1" y="1" width="34" height="34" rx="9" fill={C.sun} stroke={C.ink} strokeWidth="2.5" />
        <path d="M10 19 L16 25 L27 11" fill="none" stroke={C.ink} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily: "Display", fontWeight: 800, fontSize: size * 0.72, letterSpacing: -1 }}>{BRAND.name}</span>
    </div>
  );
}

/** A bordered "sticker" with the hard offset shadow used across the app. */
export function Sticker({ children, bg = C.card, rotate = 0, style }: { children: ReactNode; bg?: string; rotate?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: "flex", background: bg, border: `4px solid ${C.ink}`, borderRadius: 22, boxShadow: `8px 8px 0 ${C.ink}`,
        transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Pill({ children, bg, color = C.ink, rotate = 0 }: { children: ReactNode; bg: string; color?: string; rotate?: number }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 10, background: bg, color, border: `3px solid ${C.ink}`, borderRadius: 999,
        padding: "8px 20px", fontFamily: "Display", fontWeight: 800, fontSize: 26, boxShadow: `4px 4px 0 ${C.ink}`,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      {children}
    </div>
  );
}

export function Check({ size = 28, color = C.ink }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
