import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — exam practice`,
    short_name: BRAND.name,
    description: BRAND.tagline,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fbf6ec",
    theme_color: "#fbf6ec",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
