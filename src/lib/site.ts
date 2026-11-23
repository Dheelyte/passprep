import { BRAND } from "./brand";

const clean = (u: string) => u.trim().replace(/\/+$/, "");

/**
 * The canonical public address, for SEO: canonical links, sitemap, robots.txt, share cards.
 * Unlike appUrl() it never looks at the request, so previews don't advertise themselves as canonical.
 * APP_URL (your custom domain) → Vercel's production domain → localhost.
 */
export function siteUrl(): string {
  if (process.env.APP_URL?.trim()) return clean(process.env.APP_URL);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${clean(process.env.VERCEL_PROJECT_PRODUCTION_URL)}`;
  return "http://localhost:3100";
}

/** The site-wide share card (src/app/opengraph-image.tsx). */
export const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${BRAND.name}: WAEC, NECO and JAMB practice with every answer explained` };

/**
 * Base Open Graph fields. A page's `openGraph` replaces its parent's, including the share image,
 * so pages below the root spread this in (`withImage`) to keep the card.
 */
export const ogBase = (opts: { withImage?: boolean } = {}) => ({
  type: "website" as const, siteName: BRAND.name, locale: "en_NG", ...(opts.withImage ? { images: [OG_IMAGE] } : {}),
});

export const SITE = {
  title: `${BRAND.name}: WAEC, NECO & JAMB practice with every answer explained`,
  description:
    "Practise WAEC, NECO and JAMB questions topic by topic. Every answer is explained step by step, with video solutions. Free to start on any phone.",
  keywords: [
    "WAEC practice questions", "NECO practice questions", "JAMB practice questions", "WAEC mathematics", "WAEC preparation",
    "SS1 SS2 SS3 revision", "exam practice Nigeria", "step by step solutions", "video solutions",
  ],
};
