"use client";

import { useEffect } from "react";

/**
 * Arms scroll reveals for elements with [data-reveal]. Content is visible by default;
 * only when IntersectionObserver exists do we hide-then-reveal (so no-JS and old browsers see everything).
 */
export function RevealOnScroll() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    // Anything already on screen stays visible; only below-the-fold content animates in.
    for (const el of els) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      io.observe(el);
    }
    root.classList.add("reveal-armed");
    return () => io.disconnect();
  }, []);
  return null;
}
