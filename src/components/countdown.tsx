"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60_000));
  return { d: Math.floor(m / 1440), h: Math.floor((m % 1440) / 60), m: m % 60 };
}

/** Live countdown (updates each minute). Server renders the initial value, so it works without JS. */
export function Countdown({ to, initialMs }: { to: string; initialMs: number }) {
  const [ms, setMs] = useState(initialMs);
  useEffect(() => {
    const target = new Date(to).getTime();
    const tick = () => setMs(target - Date.now());
    const id = setInterval(tick, 30_000);
    tick();
    return () => clearInterval(id);
  }, [to]);
  const { d, h, m } = parts(ms);
  return (
    <span className="num tabular-nums" aria-label={`${d} days ${h} hours ${m} minutes until reset`}>
      {d > 0 ? `${d}d ` : ""}
      {h}h {String(m).padStart(2, "0")}m
    </span>
  );
}
