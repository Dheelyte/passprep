/** Light haptic tap where supported (Android Chrome). No-op elsewhere or with reduced motion. */
export function haptic(pattern: number | number[] = 12) {
  try {
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
