import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — exam practice`,
    short_name: BRAND.name,
    description: BRAND.tagline,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6f7f4",
    theme_color: "#0f7b4f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
