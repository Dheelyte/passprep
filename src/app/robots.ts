import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Private areas are also marked noindex; blocking them here saves crawl budget.
const PRIVATE = ["/admin", "/api/", "/dashboard", "/subjects", "/practice", "/progress", "/leaderboard", "/account", "/premium", "/onboarding", "/pay/", "/payment/"];

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  // Only the production site should be indexed; previews and local copies ask crawlers to stay away.
  const indexable = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production";
  return {
    rules: indexable ? { userAgent: "*", allow: "/", disallow: PRIVATE } : { userAgent: "*", disallow: "/" },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
