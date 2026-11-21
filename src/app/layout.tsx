import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { BRAND } from "@/lib/brand";

// Two families max: a characterful display face and a body face built for legibility.
const display = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-bricolage" });
const body = Atkinson_Hyperlegible_Next({ subsets: ["latin"], display: "swap", variable: "--font-atkinson" });

export const metadata: Metadata = {
  title: { default: `${BRAND.name}: WAEC, NECO & JAMB practice with every answer explained`, template: `%s · ${BRAND.name}` },
  description: "Practise WAEC, NECO and JAMB questions topic by topic. Every answer explained step by step, with video solutions. Start free on any phone.",
  applicationName: BRAND.name,
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1524" },
  ],
};

// Applies a saved light/dark choice before first paint (no flash). No saved choice → follow the system.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${display.variable} ${body.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
