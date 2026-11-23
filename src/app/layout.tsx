import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import localFont from "next/font/local";
import "katex/dist/katex.min.css";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { SITE, ogBase, siteUrl } from "@/lib/site";

// Two families max: a characterful display face and a body face built for legibility.
const display = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-bricolage" });
// Atkinson is self-hosted (the same variable Latin file Google serves): Next.js has no stored metrics for it,
// so from Google it couldn't build a size-matched fallback. From a local file it measures the font itself,
// which keeps text from jumping when the font arrives on slow connections.
const body = localFont({
  src: "./fonts/atkinson-hyperlegible-next-latin-wght-normal.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-atkinson",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE.title, template: `%s · ${BRAND.name}` },
  description: SITE.description,
  keywords: SITE.keywords,
  applicationName: BRAND.name,
  category: "education",
  manifest: "/manifest.webmanifest",
  openGraph: { ...ogBase(), title: SITE.title, description: SITE.description },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: "default" },
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
