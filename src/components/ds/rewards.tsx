import { cn } from "./cn";

/**
 * Streak flame that grows with streak length: grey when out, small at 1–2 days,
 * full at 7+, with an extra inner flame at 30+.
 */
export function Flame({ days, size = 32, animate = true, className }: { days: number; size?: number; animate?: boolean; className?: string }) {
  const lit = days > 0;
  const scale = !lit ? 0.85 : days < 3 ? 0.8 : days < 7 ? 0.9 : 1;
  return (
    <svg aria-hidden viewBox="0 0 48 56" width={size} height={size * (56 / 48)} className={cn("shrink-0 overflow-visible", className)}>
      <g className={lit && animate ? "flame-flicker" : undefined} style={{ transform: `scale(${scale})`, transformOrigin: "50% 100%" }}>
        <path
          d="M24 2 C 30 12, 44 20, 44 35 C 44 47, 35 54, 24 54 C 13 54, 4 47, 4 35 C 4 26, 10 20, 14 14 C 15 22, 18 25, 21 26 C 20 17, 21 9, 24 2 Z"
          fill={lit ? "var(--physics)" : "var(--paper-2)"}
          stroke="var(--line)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {lit ? (
          <path d="M24 26 C 28 32, 33 36, 33 42 C 33 48, 29 51, 24 51 C 19 51, 15 48, 15 42 C 15 37, 19 33, 24 26 Z" fill="var(--gold)" stroke="var(--line)" strokeWidth="2" strokeLinejoin="round" />
        ) : null}
        {days >= 30 ? <path d="M24 36 C 26 40, 28 42, 28 45 C 28 48, 26 49, 24 49 C 22 49, 20 48, 20 45 C 20 42, 22 40, 24 36 Z" fill="#fffdf7" /> : null}
      </g>
    </svg>
  );
}

export function TrophyIcon({ size = 40, place = 1 }: { size?: number; place?: 1 | 2 | 3 }) {
  const fill = { 1: "var(--gold)", 2: "#c9ccd6", 3: "#d08a4f" }[place];
  return (
    <svg aria-hidden viewBox="0 0 48 48" width={size} height={size}>
      <path d="M14 6 H34 V18 C34 25, 30 30, 24 30 C18 30, 14 25, 14 18 Z" fill={fill} stroke="var(--line)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M14 10 H7 C7 18, 10 21, 15 22 M34 10 H41 C41 18, 38 21, 33 22" fill="none" stroke="var(--line)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 30 V36 H28 V30 M15 42 H33 V36 H15 Z" fill={fill} stroke="var(--line)" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="24" y="22" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1c1a16" fontFamily="var(--font-bricolage), sans-serif">{place}</text>
    </svg>
  );
}

export type BadgeDef = { id: string; name: string; hint: string; earned: boolean; shape: "circle" | "star" | "shield" | "burst"; color: string; glyph: string };

/** Collectible sticker badge. Unearned badges render as a dashed silhouette with the hint. */
export function StickerBadge({ badge, size = 76 }: { badge: BadgeDef; size?: number }) {
  const paths = {
    circle: "M40 4 A36 36 0 1 1 39.9 4 Z",
    star: "M40 3 L49 27 L75 28 L55 44 L62 70 L40 55 L18 70 L25 44 L5 28 L31 27 Z",
    shield: "M40 4 L72 14 V38 C72 58, 56 70, 40 76 C24 70, 8 58, 8 38 V14 Z",
    burst: "M40 2 L48 14 L62 8 L63 23 L77 26 L69 39 L78 51 L64 55 L62 70 L48 64 L40 77 L32 64 L18 70 L16 55 L2 51 L11 39 L3 26 L17 23 L18 8 L32 14 Z",
  };
  return (
    <figure className="flex w-24 flex-col items-center gap-1.5 text-center">
      <svg viewBox="0 0 80 80" width={size} height={size} role="img" aria-label={`${badge.name}${badge.earned ? " (earned)" : " (locked)"}`} className={badge.earned ? "drop-shadow-[3px_3px_0_var(--shadow-ink)]" : ""}>
        <path
          d={paths[badge.shape]}
          fill={badge.earned ? badge.color : "transparent"}
          stroke={badge.earned ? "var(--line)" : "var(--ink-2)"}
          strokeWidth={badge.earned ? 3 : 2}
          strokeDasharray={badge.earned ? undefined : "5 5"}
          strokeLinejoin="round"
        />
        <text x="40" y="48" textAnchor="middle" fontSize="22" fontWeight="800" fill={badge.earned ? "#1c1a16" : "var(--ink-2)"} fontFamily="var(--font-bricolage), sans-serif">
          {badge.earned ? badge.glyph : "?"}
        </text>
      </svg>
      <figcaption className="text-xs leading-tight">
        <span className="block font-display font-bold">{badge.name}</span>
        <span className="muted">{badge.hint}</span>
      </figcaption>
    </figure>
  );
}
