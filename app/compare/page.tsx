"use client";

import { useState } from "react";
import CompareHero from "@/components/compare/CompareHero";
import DriverSelector from "@/components/compare/DriverSelector";
import DriverProfileCard from "@/components/compare/DriverProfileCard";
import StatComparison from "@/components/compare/StatComparison";
import AdditionalStats from "@/components/compare/AdditionalStats";
import { useDrivers, useDriverStats, useDriverStandings } from "@/lib/hooks/useDrivers";
import { DriverStats } from "@/lib/types/driver";

export default function ComparePage() {
  const [driver1Id, setDriver1Id] = useState<string>("max_verstappen");
  const [driver2Id, setDriver2Id] = useState<string>("hamilton");

  const { data: allDrivers, isLoading: driversLoading } = useDrivers();
  const { data: driver1Stats, isLoading: driver1Loading } = useDriverStats(driver1Id);
  const { data: driver2Stats, isLoading: driver2Loading } = useDriverStats(driver2Id);
  const { data: currentStandings } = useDriverStandings();

  const isLoading = driversLoading || driver1Loading || driver2Loading;

  const getMostRecentTeam = (driverStats: DriverStats | undefined) => {
    if (!driverStats) return "N/A";
    if (currentStandings && Array.isArray(currentStandings)) {
      const standing = currentStandings.find((s: any) => s?.Driver?.driverId === driverStats.driver.driverId);
      if (standing?.Constructors?.[0]?.name) return standing.Constructors[0].name;
    }
    if (driverStats.seasonResults && driverStats.seasonResults.length > 0) return driverStats.seasonResults[0].team;
    return driverStats.currentTeam?.name || "N/A";
  };

  const compareStats = driver1Stats && driver2Stats
    ? [
        { label: "Total Wins", d1: driver1Stats.totalWins, d2: driver2Stats.totalWins },
        { label: "Total Podiums", d1: driver1Stats.totalPodiums, d2: driver2Stats.totalPodiums },
        { label: "Pole Positions", d1: driver1Stats.totalPoles, d2: driver2Stats.totalPoles },
        { label: "Total Points", d1: driver1Stats.totalPoints, d2: driver2Stats.totalPoints },
        { label: "Races", d1: driver1Stats.totalRaces, d2: driver2Stats.totalRaces },
        { label: "Win Rate", d1: driver1Stats.winRate, d2: driver2Stats.winRate, isPercentage: true },
        { label: "Podium Rate", d1: driver1Stats.podiumRate, d2: driver2Stats.podiumRate, isPercentage: true },
        { label: "Avg Finish Position", d1: driver1Stats.avgFinishPosition, d2: driver2Stats.avgFinishPosition, isAverage: true },
      ]
    : [];

  return (
    <main className="min-h-screen" style={{ background: "#080808" }}>
      <CompareHero />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <DriverSelector
          driver1Id={driver1Id}
          driver2Id={driver2Id}
          onDriver1Change={setDriver1Id}
          onDriver2Change={setDriver2Id}
          allDrivers={allDrivers || []}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-[#E10600] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="data-readout">Loading driver data...</p>
          </div>
        ) : driver1Stats && driver2Stats ? (
          <>
            {/* Driver Profile Cards */}
            <div className="grid md:grid-cols-2 gap-0 mb-10" style={{ borderRight: "none" }}>
              <div style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>
                <DriverProfileCard driverStats={driver1Stats} isDriver1={true} currentTeam={getMostRecentTeam(driver1Stats)} />
              </div>
              <div>
                <DriverProfileCard driverStats={driver2Stats} isDriver1={false} currentTeam={getMostRecentTeam(driver2Stats)} />
              </div>
            </div>

            {/* Stats Comparison */}
            <StatComparison compareStats={compareStats} />

            {/* Additional Stats */}
            <div className="grid md:grid-cols-2 gap-0" style={{ borderRight: "none" }}>
              <div style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>
                <AdditionalStats driverStats={driver1Stats} isDriver1={true} />
              </div>
              <div>
                <AdditionalStats driverStats={driver2Stats} isDriver1={false} />
              </div>
            </div>
          </>
        ) : (
          <div
            className="py-20 text-center"
            style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)" }}>
              Unable to load driver data. Please try again.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
