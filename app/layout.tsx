import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";

export const metadata: Metadata = {
  title: "FJuanDASH — Formula 1 Statistics & Analytics",
  description: "Real-time Formula 1 driver statistics, live telemetry, race calendar, and historical data analysis",
  keywords: ["F1", "Formula 1", "statistics", "telemetry", "racing", "drivers", "standings"],
  authors: [{ name: "F1 Stats" }],
  openGraph: {
    title: "F1DASH — Formula 1 Statistics & Analytics",
    description: "Comprehensive Formula 1 statistics and analytics",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
