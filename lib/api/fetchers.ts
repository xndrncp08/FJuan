import * as jolpica from "./jolpica";
import * as openf1 from "./openf1";
import {
  Driver,
  DriverStats,
  Constructor,
  DriverRaceResult,
  SeasonResult,
} from "../types/driver";
import championshipData from "../data/championships.json";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";

// Fetch ALL paginated results for a driver - handles Hamilton's 350+ races
async function fetchAllDriverResults(driverId: string): Promise<any[]> {
  const pageSize = 100;
  let offset = 0;
  let allRaces: any[] = [];
  let total = Infinity;

  while (offset < total) {
    const res = await fetch(
      `${BASE_URL}/drivers/${driverId}/results.json?limit=${pageSize}&offset=${offset}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) break;
    const data = await res.json();
    const mrData = data?.MRData;
    total = parseInt(mrData?.total || "0");
    const races = mrData?.RaceTable?.Races || [];
    allRaces = [...allRaces, ...races];
    offset += pageSize;
    if (races.length === 0) break;
  }

  return allRaces;
}

// Fetch ALL career qualifying results for pole positions
async function fetchAllDriverQualifying(driverId: string): Promise<any[]> {
  const pageSize = 100;
  let offset = 0;
  let allRaces: any[] = [];
  let total = Infinity;

  while (offset < total) {
    const res = await fetch(
      `${BASE_URL}/drivers/${driverId}/qualifying.json?limit=${pageSize}&offset=${offset}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) break;
    const data = await res.json();
    const mrData = data?.MRData;
    total = parseInt(mrData?.total || "0");
    const races = mrData?.RaceTable?.Races || [];
    allRaces = [...allRaces, ...races];
    offset += pageSize;
    if (races.length === 0) break;
  }

  return allRaces;
}

export async function getCurrentDrivers(): Promise<Driver[]> {
  return jolpica.getCurrentDrivers();
}

export async function getCurrentStandings(): Promise<any[]> {
  return jolpica.getCurrentDriverStandings();
}

export async function getDriverStats(driverId: string): Promise<DriverStats | null> {
  try {
    // Fetch driver info, standings, and all career data in parallel
    const [driverRes, currentStandingsRes, fastestLapsRes] =
      await Promise.allSettled([
        jolpica.getDriver(driverId),
        jolpica.getCurrentDriverStandings(),
        jolpica.getDriverFastestLaps(driverId),
      ]);

    const driverData = driverRes.status === "fulfilled" ? driverRes.value : null;
    if (!driverData) return null;

    const standings = currentStandingsRes.status === "fulfilled" ? currentStandingsRes.value : [];
    const fastestLaps = fastestLapsRes.status === "fulfilled" ? fastestLapsRes.value : [];

    // Fetch ALL career results and qualifying with pagination (sequential to avoid rate limits)
    const [allRaces, allQualifying] = await Promise.all([
      fetchAllDriverResults(driverId),
      fetchAllDriverQualifying(driverId),
    ]);

    // Calculate career stats from full result set
    const totalRaces = allRaces.length;
    const firstSeason = allRaces[0]?.season || "Unknown";
    const lastSeason = allRaces[allRaces.length - 1]?.season || "Unknown";
    const yearsActive = parseInt(lastSeason) - parseInt(firstSeason);

    let totalWins = 0;
    let totalPodiums = 0;
    let totalPoints = 0;
    let dnfCount = 0;
    const finishPositions: number[] = [];

    allRaces.forEach((race: any) => {
      const result = race.Results?.[0];
      if (!result) return;

      const pos = parseInt(result.position);
      const pts = parseFloat(result.points || "0");
      const status: string = result.status || "";

      totalPoints += pts;
      if (pos === 1) totalWins++;
      if (pos >= 1 && pos <= 3) totalPodiums++;
      if (pos > 0) finishPositions.push(pos);
      if (!status.includes("Finished") && !status.includes("Lap")) dnfCount++;
    });

    const avgFinishPosition =
      finishPositions.length > 0
        ? finishPositions.reduce((a, b) => a + b, 0) / finishPositions.length
        : 0;

    const bestFinish = finishPositions.length > 0 ? Math.min(...finishPositions) : 0;
    const worstFinish = finishPositions.length > 0 ? Math.max(...finishPositions) : 0;
    const winRate = totalRaces > 0 ? (totalWins / totalRaces) * 100 : 0;
    const podiumRate = totalRaces > 0 ? (totalPodiums / totalRaces) * 100 : 0;
    const retirementRate = totalRaces > 0 ? (dnfCount / totalRaces) * 100 : 0;
    const pointsPerRace = totalRaces > 0 ? totalPoints / totalRaces : 0;

    // Career poles from full qualifying history
    const totalPoles = allQualifying.filter(
      (race: any) => race.QualifyingResults?.[0]?.position === "1"
    ).length;

    // Championships from static JSON — accurate and never changes
    const totalChampionships = (championshipData as Record<string, number>)[driverId] ?? 0;

    // Season-by-season breakdown
    const seasonMap = new Map<string, { wins: number; podiums: number; points: number; races: number; team: string }>();
    allRaces.forEach((race: any) => {
      const result = race.Results?.[0];
      if (!result) return;
      const season = race.season;
      const pos = parseInt(result.position);
      const pts = parseFloat(result.points || "0");
      const team = result.Constructor?.name || "Unknown";

      if (!seasonMap.has(season)) {
        seasonMap.set(season, { wins: 0, podiums: 0, points: 0, races: 0, team });
      }
      const s = seasonMap.get(season)!;
      s.races++;
      s.points += pts;
      s.team = team; // last team of season
      if (pos === 1) s.wins++;
      if (pos >= 1 && pos <= 3) s.podiums++;
    });

    const seasonResults: SeasonResult[] = Array.from(seasonMap.entries())
      .map(([season, s]) => ({
        season,
        team: s.team,
        races: s.races,
        wins: s.wins,
        podiums: s.podiums,
        poles: 0,
        points: s.points,
        position: 0,
      }))
      .sort((a, b) => parseInt(b.season) - parseInt(a.season));

    // Current team from standings or last race
    let currentTeam: Constructor | undefined;
    const currentStanding = standings.find(
      (s: any) => s.Driver.driverId === driverId
    );
    if (currentStanding?.Constructors?.[0]) {
      currentTeam = currentStanding.Constructors[0];
    }
    if (!currentTeam && allRaces.length > 0) {
      currentTeam = allRaces[allRaces.length - 1]?.Results?.[0]?.Constructor;
    }

    return {
      driver: driverData,
      totalRaces,
      totalWins,
      totalPodiums,
      totalPoles,
      totalFastestLaps: fastestLaps.length,
      totalPoints: Math.round(totalPoints * 10) / 10,
      totalChampionships,
      dnfCount,
      retirementRate,
      avgFinishPosition: Math.round(avgFinishPosition * 10) / 10,
      avgQualifyingPosition: 0,
      bestFinish,
      worstFinish,
      pointsPerRace: Math.round(pointsPerRace * 100) / 100,
      winRate: Math.round(winRate * 10) / 10,
      podiumRate: Math.round(podiumRate * 10) / 10,
      currentTeam,
      careerSpan: {
        firstRace: allRaces[0]?.raceName || "Unknown",
        lastRace: allRaces[allRaces.length - 1]?.raceName || "Unknown",
        yearsActive,
      },
      seasonResults,
    };
  } catch (error) {
    console.error(`Error fetching stats for driver ${driverId}:`, error);
    return null;
  }
}

export async function getDriverComparison(driverId1: string, driverId2: string) {
  const [driver1Stats, driver2Stats] = await Promise.all([
    getDriverStats(driverId1),
    getDriverStats(driverId2),
  ]);
  return { driver1Stats, driver2Stats };
}

export async function getRaceCalendar(season: string) {
  return jolpica.getRaceCalendar(season);
}

export async function getNextRace() {
  return jolpica.getNextRace();
}

export async function getRaceResultsDetailed(season: string, round: string) {
  return jolpica.getRaceResults(season, round);
}

export async function getLiveSessionData() {
  return openf1.getLiveSession();
}

export async function getSessions(options?: any) {
  return openf1.getSessions(options);
}

export async function isSessionLive(sessionKey: number) {
  return openf1.isSessionLive(sessionKey);
}

export async function getSessionTelemetry(sessionKey: number) {
  return openf1.getSessionTelemetry(sessionKey);
}

export async function getDriverPerformanceSummary(sessionKey: number, driverNumber: number) {
  return openf1.getDriverPerformanceSummary(sessionKey, driverNumber);
}

export async function getLaps(params: { session_key: number; driver_number: number }) {
  return openf1.getLaps(params);
}

export async function getStints(params: { session_key: number; driver_number: number }) {
  return openf1.getStints(params);
}

export async function streamSessionData(
  sessionKey: number,
  callback: (data: any) => void,
  interval: number,
) {
  return openf1.streamSessionData(sessionKey, callback, interval);
}