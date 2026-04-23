import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import PageTransition from "@/components/PageTransition";
import PredictionChat from "@/components/prediction/PredictionChat";

export const metadata: Metadata = {
  title: "FJuanDASH — Formula 1 Statistics & Analytics",
  description:
    "Real-time Formula 1 driver statistics, live telemetry, race calendar, and historical data analysis",
  keywords: [
    "F1",
    "Formula 1",
    "statistics",
    "telemetry",
    "racing",
    "drivers",
    "standings",
  ],
  authors: [{ name: "F1 Stats" }],
  openGraph: {
    title: "F1DASH — Formula 1 Statistics & Analytics",
    description: "Comprehensive Formula 1 statistics and analytics",
    type: "website",
  },
};

// ─── Fetch next race prediction for Nacho Bot ─────────────────────────────────
// Runs server-side at layout level, cached 10 minutes.
// If the fetch fails for any reason, Nacho Bot simply won't render —
// the rest of the app is completely unaffected.

async function getNextRacePrediction() {
  try {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const res = await fetch(`${origin}/api/prediction`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    return res.json();
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

        {/* Nacho Bot — outside <Providers> and all page wrappers so
            position: fixed is always relative to the viewport, never
            trapped inside a transformed or overflow-clipped ancestor. */}
        {prediction && <PredictionChat prediction={prediction} />}
      </body>
    </html>
  );
}