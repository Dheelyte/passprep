import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { C, Check, OG_SIZE, OgLogo, Pill, Sticker, ogFonts } from "@/lib/og";

// The site-wide share card (WhatsApp, X, Facebook, LinkedIn, Slack…). Generated once at build time.
export const alt = `${BRAND.name}: WAEC, NECO and JAMB practice with every answer explained`;
export const size = OG_SIZE;
export const contentType = "image/png";

function Flame({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 48 56">
      <path d="M24 3 C30 14 42 20 42 35 C42 46 34 53 24 53 C14 53 6 46 6 35 C6 26 12 21 16 14 C18 20 21 23 24 24 C22 16 21 9 24 3 Z" fill={C.coral} stroke={C.ink} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M24 30 C28 35 32 38 32 43 C32 48 28 50 24 50 C20 50 16 48 16 43 C16 39 20 36 24 30 Z" fill={C.sun} stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

function Option({ letter, children, state }: { letter: string; children: React.ReactNode; state?: "right" | "idle" }) {
  const right = state === "right";
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 16, background: right ? C.okSoft : C.card, border: `3px solid ${C.ink}`, borderRadius: 16,
        padding: "10px 16px", boxShadow: right ? "none" : `4px 4px 0 ${C.ink}`, fontFamily: "Body", fontWeight: 700, fontSize: 30,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 10, border: `3px solid ${C.ink}`, background: right ? C.ok : C.paper, fontFamily: "Display", fontWeight: 800, fontSize: 24 }}>
        {right ? <Check size={26} /> : letter}
      </div>
      {children}
    </div>
  );
}

const Frac = ({ n, d }: { n: string; d: string }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: 22, lineHeight: 1 }}>
    <span>{n}</span>
    <div style={{ width: 22, height: 3, background: C.ink, margin: "3px 0" }} />
    <span>{d}</span>
  </div>
);

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: C.primary, color: "#fff", padding: "48px 60px", fontFamily: "Body" }}>
        {/* left: brand + promise */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 600 }}>
          <div style={{ display: "flex", color: "#fff" }}>
            <OgLogo size={58} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Display", fontWeight: 800, fontSize: 60, lineHeight: 1.02, letterSpacing: -1.5 }}>
              <span>WAEC, NECO &amp; JAMB practice with every answer&nbsp;</span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                explained
                <svg width="260" height="16" viewBox="0 0 300 18" style={{ marginTop: -4 }}>
                  <path d="M4 12 C 70 2, 150 4, 296 9" fill="none" stroke={C.sun} strokeWidth="9" strokeLinecap="round" />
                </svg>
              </span>
            </div>
            <div style={{ display: "flex", fontSize: 28, marginTop: 18, opacity: 0.95 }}>Step-by-step workings and video solutions. Free on any phone.</div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <Pill bg={C.sun}>Start free</Pill>
            <Pill bg={C.card}>JSS 3 to SS 3</Pill>
          </div>
        </div>

        {/* right: a sample question, answered */}
        <div style={{ display: "flex", position: "relative", flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
          <Sticker rotate={2} style={{ flexDirection: "column", width: 440, marginTop: 20, color: C.ink, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.sun, borderBottom: `4px solid ${C.ink}`, padding: "14px 22px", fontFamily: "Display", fontWeight: 800, fontSize: 26 }}>
              <span>Indices · Q3 of 10</span>
              <span style={{ fontSize: 20, fontFamily: "Body", background: C.card, border: `3px solid ${C.ink}`, borderRadius: 999, padding: "2px 12px" }}>WAEC</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "flex-start", fontFamily: "Body", fontWeight: 700, fontSize: 34, marginBottom: 4 }}>
                Evaluate 27
                <span style={{ fontSize: 22, marginTop: -4, marginLeft: 2 }}>−2/3</span>
              </div>
              <Option letter="A" state="right"><Frac n="1" d="9" /></Option>
              <Option letter="B">9</Option>
              <Option letter="C">−9</Option>
            </div>
          </Sticker>
          <div style={{ display: "flex", position: "absolute", top: 18, left: 28 }}>
            <Pill bg={C.card} rotate={-4}><Flame size={24} /> 7 day streak</Pill>
          </div>
          <div style={{ display: "flex", position: "absolute", bottom: 18, right: 24 }}>
            <Pill bg={C.ok} rotate={-3}><Check size={26} /> Sharp! +10 pts</Pill>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  );
}
