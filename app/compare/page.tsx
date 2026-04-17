"use client";

/**
 * Driver Comparison Page
 * 
 * Allows users to select two Formula 1 drivers and compare their career statistics
 * side-by-side. Fetches data from Ergast API via custom hooks.
 * 
 * Features:
 * - Dynamic driver selection from all F1 drivers
 * - Profile cards with personal info and career highlights
 * - Statistical comparison bars with percentage splits
 * - Additional metrics (fastest laps, DNFs, points per race)
 * - Fully responsive: stacks vertically on mobile, side-by-side on desktop
 */

import { useState } from "react";
import CompareHero from "@/components/compare/CompareHero";
import DriverSelector from "@/components/compare/DriverSelector";
import DriverProfileCard from "@/components/compare/DriverProfileCard";
import StatComparison from "@/components/compare/StatComparison";
import AdditionalStats from "@/components/compare/AdditionalStats";
import { useDrivers, useDriverStats, useDriverStandings } from "@/lib/hooks/useDrivers";
import { DriverStats } from "@/lib/types/driver";

export default function ComparePage() {
  // State for selected driver IDs (using Ergast driverId strings like "max_verstappen")
  const [driver1Id, setDriver1Id] = useState<string>("max_verstappen");
  const [driver2Id, setDriver2Id] = useState<string>("hamilton");

  // Fetch all drivers list, individual driver stats, and current season standings
  const { data: allDrivers, isLoading: driversLoading } = useDrivers();
  const { data: driver1Stats, isLoading: driver1Loading } = useDriverStats(driver1Id);
  const { data: driver2Stats, isLoading: driver2Loading } = useDriverStats(driver2Id);
  const { data: currentStandings } = useDriverStandings();

  const isLoading = driversLoading || driver1Loading || driver2Loading;

  /**
   * Get the most recent team for a driver
   * Priority: current season standings > seasonResults > currentTeam property
   */
  const getMostRecentTeam = (driverStats: DriverStats | undefined): string => {
    if (!driverStats) return "N/A";
    
    // First try to get team from current standings
    if (currentStandings && Array.isArray(currentStandings)) {
      const standing = currentStandings.find(
        (s: any) => s?.Driver?.driverId === driverStats.driver.driverId
      );
      if (standing?.Constructors?.[0]?.name) return standing.Constructors[0].name;
    }
    
    // Fallback to most recent season result
    if (driverStats.seasonResults && driverStats.seasonResults.length > 0) {
      return driverStats.seasonResults[0].team;
    }
    
    // Final fallback
    return driverStats.currentTeam?.name || "N/A";
  };

  /**
   * Build comparison data array for the StatComparison component
   * Includes wins, podiums, poles, points, races, and various rates
   */
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
    <main className="min-h-screen bg-[#080808]">
      {/* Hero section with title and background effects */}
      <CompareHero />

      {/* Main content container - responsive padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        
        {/* Driver selector - two dropdowns with VS divider */}
        <DriverSelector
          driver1Id={driver1Id}
          driver2Id={driver2Id}
          onDriver1Change={setDriver1Id}
          onDriver2Change={setDriver2Id}
          allDrivers={allDrivers || []}
        />

        {/* Loading state with spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 md:py-32">
            <div className="w-8 h-8 border-2 border-[#E10600] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="data-readout">Loading driver data...</p>
          </div>
        ) : driver1Stats && driver2Stats ? (
          <>
            {/* Driver Profile Cards - grid: column on mobile, 2 columns on md+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mb-8 md:mb-12">
              {/* Left card with red border separator on desktop */}
              <div className="md:border-r border-white/10">
                <DriverProfileCard 
                  driverStats={driver1Stats} 
                  isDriver1={true} 
                  currentTeam={getMostRecentTeam(driver1Stats)} 
                />
              </div>
              <div>
                <DriverProfileCard 
                  driverStats={driver2Stats} 
                  isDriver1={false} 
                  currentTeam={getMostRecentTeam(driver2Stats)} 
                />
              </div>
            </div>

            {/* Statistical comparison bars */}
            <StatComparison compareStats={compareStats} />

            {/* Additional stats grid - stacks on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="md:border-r border-white/10">
                <AdditionalStats driverStats={driver1Stats} isDriver1={true} />
              </div>
              <div>
                <AdditionalStats driverStats={driver2Stats} isDriver1={false} />
              </div>
            </div>
          </>
        ) : (
          // Error state when data fails to load
          <div className="py-16 md:py-20 text-center bg-[#111] border border-white/10">
            <p className="font-condensed font-bold text-lg uppercase tracking-wide text-white/30">
              Unable to load driver data. Please try again.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}