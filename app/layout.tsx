import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import PageTransition from "@/components/PageTransition";
import PredictionChat from "@/components/prediction/PredictionChat";
import { getNextRace } from "@/lib/api/jolpica";
import { generateRacePrediction } from "@/lib/types/prediction/engine";

export const metadata: Metadata = {
  title: "FJuanDASH — Formula 1 Statistics & Analytics",
  description:
    "Real-time Formula 1 driver statistics, live telemetry, race calendar, and historical data analysis",
  keywords: ["F1", "Formula 1", "statistics", "telemetry", "racing", "drivers", "standings"],
  authors: [{ name: "F1 Stats" }],
  openGraph: {
    title: "F1DASH — Formula 1 Statistics & Analytics",
    description: "Comprehensive Formula 1 statistics and analytics",
    type: "website",
  },
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
}: {
  children: React.ReactNode;
}) {
  const prediction = await getNextRacePrediction();

  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <Navbar />
          <PageTransition>{children}</PageTransition>
          <Footer />
        </Providers>

        {prediction && <PredictionChat prediction={prediction} />}
      </body>
    </html>
  );
}