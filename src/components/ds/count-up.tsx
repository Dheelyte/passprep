"use client";

import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts from `from` to `to` (or snaps when reduced motion is on). Bumps when the value changes. */
export function CountUp({ to, from = 0, duration = 700, className }: { to: number; from?: number; duration?: number; className?: string }) {
  const [value, setValue] = useState(from);
  const [bump, setBump] = useState(0);
  const prev = useRef(from);
  useEffect(() => {
    const start = prev.current;
    prev.current = to;
    if (start === to) return;
    if (reduced()) {
      const t = setTimeout(() => setValue(to), 0);
      return () => clearTimeout(t);
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setValue(Math.round(start + (to - start) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setBump((b) => b + 1);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <span key={bump} className={`inline-block ${bump ? "anim-bump" : ""} ${className ?? ""}`}>
      {value.toLocaleString("en-NG")}
    </span>
  );
}
