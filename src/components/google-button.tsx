import { buttonClass } from "./ds/button";

/** Plain link (not a form) so it works before hydration on slow phones. */
export function GoogleButton({ next, source, label = "Continue with Google" }: { next?: string; source?: string; label?: string }) {
  const qs = new URLSearchParams();
  if (next) qs.set("next", next);
  if (source) qs.set("source", source);
  const href = `/api/auth/google${qs.size ? `?${qs}` : ""}`;
  return (
    <>
      <a href={href} className={buttonClass({ variant: "secondary", block: true, size: "lg" })}>
        <GoogleG />
        {label}
      </a>
      <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-ink-2" aria-hidden>
        <span className="h-0.5 flex-1 bg-rule" /> or <span className="h-0.5 flex-1 bg-rule" />
      </p>
    </>
  );
}

// Google's multicolour "G", as its sign-in branding guidelines require.
function GoogleG() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-5 shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
