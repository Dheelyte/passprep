import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { C, Check, OG_SIZE, OgLogo, Pill, Sticker, ogFonts } from "@/lib/og";

// Preview for parent pay links (/pay/…), which students send on WhatsApp.
// Deliberately generic: no student details, so it's the same image for every link and built once.
export const alt = `Your child is asking for ${BRAND.name} Premium`;
export const size = OG_SIZE;
export const contentType = "image/png";

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: 999, background: C.sun, border: `3px solid ${C.ink}` }}>
        <Check size={24} />
      </div>
      {children}
    </div>
  );
}

function Lock() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24">
      <rect x="4" y="10" width="16" height="11" rx="3" fill={C.sun} stroke={C.ink} strokeWidth="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: C.grape, color: "#fff", padding: "48px 60px", fontFamily: "Body" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <OgLogo size={54} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex" }}>
              <Pill bg={C.sun}>For parents</Pill>
            </div>
            <div style={{ display: "flex", fontFamily: "Display", fontWeight: 800, fontSize: 66, lineHeight: 1.02, letterSpacing: -2 }}>
              Your child is asking for Premium
            </div>
            <div style={{ display: "flex", fontSize: 28, opacity: 0.95 }}>See the plans and pay. No account needed.</div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <Pill bg={C.card}>Transfer</Pill>
            <Pill bg={C.card}>USSD</Pill>
            <Pill bg={C.card}>Card</Pill>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
          <Sticker rotate={2} style={{ flexDirection: "column", width: 400, color: C.ink, padding: 30, gap: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "Display", fontWeight: 800, fontSize: 34 }}>
              <Lock /> Premium
            </div>
            <Row>Unlimited practice</Row>
            <Row>Every video solution</Row>
            <Row>Detailed progress</Row>
            <div style={{ display: "flex", justifyContent: "center", background: C.sun, border: `3px solid ${C.ink}`, borderRadius: 16, padding: "14px 0", fontFamily: "Display", fontWeight: 800, fontSize: 30, boxShadow: `4px 4px 0 ${C.ink}` }}>
              Pay securely
            </div>
          </Sticker>
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  );
}
