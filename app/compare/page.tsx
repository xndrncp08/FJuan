"use client";

import { useState } from "react";
import { useDrivers, useDriverStats, useDriverStandings } from "@/lib/hooks/useDrivers";
import { DriverStats } from "@/lib/types/driver";
import {
  CompareHero,
  DriverSelector,
  DriverBanner,
  StatsBattle,
  ChartsSection,
  Skeleton,
  D1_COLOR,
} from "@/components/compare";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMostRecentTeam(driverStats: DriverStats, standings: any[]): string {
  if (standings?.length) {
    const s = standings.find((s: any) => s?.Driver?.driverId === driverStats.driver.driverId);
    if (s?.Constructors?.[0]?.name) return s.Constructors[0].name;
  }
  if (driverStats.seasonResults?.length) return driverStats.seasonResults[0].team;
  return driverStats.currentTeam?.name ?? "N/A";
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const [driver1Id, setDriver1Id] = useState("max_verstappen");
  const [driver2Id, setDriver2Id] = useState("hamilton");

  const { data: allDrivers, isLoading: driversLoading } = useDrivers();
  const { data: d1Stats, isLoading: d1Loading } = useDriverStats(driver1Id);
  const { data: d2Stats, isLoading: d2Loading } = useDriverStats(driver2Id);
  const { data: standings } = useDriverStandings();

  const isLoading = driversLoading || d1Loading || d2Loading;

  const team1 = d1Stats ? getMostRecentTeam(d1Stats, standings ?? []) : "";
  const team2 = d2Stats ? getMostRecentTeam(d2Stats, standings ?? []) : "";

  return (
    <main style={{ minHeight: "100vh", background: "#060606" }}>
      <CompareHero />

      <div style={{
        maxWidth: "1280px", margin: "0 auto",
        padding: "2.5rem clamp(1.25rem,4vw,1.5rem)",
      }}>
        <DriverSelector
          driver1Id={driver1Id}
          driver2Id={driver2Id}
          onDriver1Change={setDriver1Id}
          onDriver2Change={setDriver2Id}
          allDrivers={allDrivers ?? []}
        />

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <Skeleton h={220} />
            <Skeleton h={480} />
            <Skeleton h={420} />
          </div>
        ) : d1Stats && d2Stats ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <DriverBanner d1={d1Stats} d2={d2Stats} team1={team1} team2={team2} />
            {/* ── Charts section — the new nerdy stuff ── */}
            <ChartsSection d1={d1Stats} d2={d2Stats} team1={team1} team2={team2} />
            {/* ── Raw stat battle rows below ── */}
            <StatsBattle d1={d1Stats} d2={d2Stats} />
          </div>
        ) : (
          <div style={{
            padding: "5rem 2rem", textAlign: "center",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ width: "32px", height: "2px", background: D1_COLOR, margin: "0 auto 1rem" }} />
            <p style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "0.9rem", textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em",
            }}>
              Unable to load driver data. Please try again.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes compareSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes comparePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        @media (max-width: 600px) {
          .compare-selector-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}