import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Rajdhani, Russo_One } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/PageTransition";
import PredictionChat from "@/components/prediction/PredictionChat";
import { getNextRace } from "@/lib/api/jolpica";
import { generateRacePrediction } from "@/lib/prediction/engine";

// Brand type: Russo One for display, Rajdhani for UI, JetBrains Mono for
// timing data. Self-hosted by next/font so they always load (no FOUT from a
// third-party stylesheet) and exposed as CSS variables for globals.css.
const display = Russo_One({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const ui = Rajdhani({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-ui", display: "swap" });
const mono = JetBrains_Mono({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-data", display: "swap" });

export const metadata: Metadata = {
  title: { default: "FJUAN — Formula 1 Statistics & Analytics", template: "%s · FJUAN" },
  description:
    "Real-time Formula 1 driver statistics, live telemetry, race calendar, and historical data analysis",
  keywords: ["F1", "Formula 1", "statistics", "telemetry", "racing", "drivers", "standings"],
  authors: [{ name: "Xander Rancap" }],
  // Absolute URLs for the OG/Twitter cards: explicit override, else the
  // Vercel production domain, else local dev.
  // `||`, not `??`: an empty variable (e.g. copied from .env.example) must
  // fall through too, or new URL("") throws on every page.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  ),
  openGraph: {
    title: "FJUAN — Formula 1 Statistics & Analytics",
    description: "Comprehensive Formula 1 statistics and analytics",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#140605",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// ─── Get prediction directly — no internal HTTP fetch ────────────────────────
async function getNextRacePrediction() {
  try {
    const nextRace = await getNextRace();
    if (!nextRace) return null;

    return await generateRacePrediction(
      new Date().getFullYear().toString(),
      nextRace.round,
      nextRace.raceName,
      nextRace.Circuit.circuitId,
      nextRace.Circuit.circuitName,
      nextRace.date,
      3,
    );
  } catch {
    return null;
  }
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  /** Floating windows for detail pages (app/@modal). */
  modal: React.ReactNode;
}) {
  const prediction = await getNextRacePrediction();

  return (
    <html lang="en" className={`dark ${display.variable} ${ui.variable} ${mono.variable}`}>
      <body>
        <Providers>
          <Navbar />
          <PageTransition>{children}</PageTransition>
          <Footer />
          {modal}
        </Providers>

        {prediction && <PredictionChat prediction={prediction} />}
      </body>
    </html>
  );
}