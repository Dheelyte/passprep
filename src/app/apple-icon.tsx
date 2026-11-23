import { ImageResponse } from "next/og";

// Home-screen icon for iPhones (they ignore SVG favicons). Full-bleed sun square with the tick: iOS rounds the corners.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#ffc933" }}>
        <svg width="120" height="120" viewBox="0 0 40 40">
          <path d="M9 21 L16 28 L31 11" fill="none" stroke="#16131f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
