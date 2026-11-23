// X/Twitter uses the same card as Open Graph.
import { BRAND } from "@/lib/brand";
import { OG_SIZE } from "@/lib/og";
import OgImage from "./opengraph-image";

export const alt = `${BRAND.name}: WAEC, NECO and JAMB practice with every answer explained`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return OgImage();
}
