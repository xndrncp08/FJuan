import { Result, DriverRaceResult, DriverStats } from "../types/driver";

// Calculate driver statistics from race results
export function calculateDriverStats(
  results: Result[],
  driverId: string,
): Partial<DriverStats> {
  const driverResults = results.filter((r) => r.Driver.driverId === driverId);

  const totalRaces = driverResults.length;
  const totalWins = driverResults.filter((r) => r.position === "1").length;
  const totalPodiums = driverResults.filter(
    (r) => parseInt(r.position) <= 3,
  ).length;
  const totalPoints = driverResults.reduce(
    (sum, r) => sum + parseFloat(r.points),
    0,
  );
  const dnfCount = driverResults.filter(
    (r) => !r.status.includes("Finished") && !r.status.includes("Lap"),
  ).length;

  const finishPositions = driverResults
    .filter((r) => r.position && parseInt(r.position) > 0)
    .map((r) => parseInt(r.position));

  const avgFinishPosition =
    finishPositions.length > 0
      ? finishPositions.reduce((sum, pos) => sum + pos, 0) /
        finishPositions.length
      : 0;

  const bestFinish =
    finishPositions.length > 0 ? Math.min(...finishPositions) : 0;
  const worstFinish =
    finishPositions.length > 0 ? Math.max(...finishPositions) : 0;

  const retirementRate = totalRaces > 0 ? (dnfCount / totalRaces) * 100 : 0;
  const winRate = totalRaces > 0 ? (totalWins / totalRaces) * 100 : 0;
  const podiumRate = totalRaces > 0 ? (totalPodiums / totalRaces) * 100 : 0;
  const pointsPerRace = totalRaces > 0 ? totalPoints / totalRaces : 0;

  return {
    totalRaces,
    totalWins,
    totalPodiums,
    totalPoints,
    dnfCount,
    retirementRate,
    avgFinishPosition,
    bestFinish,
    worstFinish,
    winRate,
    podiumRate,
    pointsPerRace,
  };
}

// Calculate head-to-head record against teammate
export function calculateH2HRecord(
  driverResults: DriverRaceResult[],
  teammateResults: DriverRaceResult[],
): { wins: number; losses: number; draws: number } {
  let wins = 0;
  let losses = 0;
  let draws = 0;

  const raceMap = new Map<
    string,
    { driver?: DriverRaceResult; teammate?: DriverRaceResult }
  >();

  driverResults.forEach((r) => {
    const key = `${r.season}-${r.round}`;
    const existing = raceMap.get(key) || {};
    raceMap.set(key, { ...existing, driver: r });
  });

  teammateResults.forEach((r) => {
    const key = `${r.season}-${r.round}`;
    const existing = raceMap.get(key) || {};
    raceMap.set(key, { ...existing, teammate: r });
  });

  raceMap.forEach(({ driver, teammate }) => {
    if (!driver || !teammate) return;

    const driverPos = parseInt(driver.position);
    const teammatePos = parseInt(teammate.position);

    if (driverPos < teammatePos) wins++;
    else if (driverPos > teammatePos) losses++;
    else draws++;
  });

  return { wins, losses, draws };
}

// Calculate average finishing position
export function calculateAvgFinishPosition(results: Result[]): number {
  const finishedResults = results.filter(
    (r) =>
      r.position && parseInt(r.position) > 0 && r.status.includes("Finished"),
  );
  if (finishedResults.length === 0) return 0;
  return (
    finishedResults.reduce((sum, r) => sum + parseInt(r.position), 0) /
    finishedResults.length
  );
}

// Calculate average qualifying position
export function calculateAvgQualifyingPosition(results: Result[]): number {
  const qualifyingPositions = results
    .filter((r) => r.grid && parseInt(r.grid) > 0)
    .map((r) => parseInt(r.grid));
  if (qualifyingPositions.length === 0) return 0;
  return (
    qualifyingPositions.reduce((sum, pos) => sum + pos, 0) /
    qualifyingPositions.length
  );
}

// Calculate points per race
export function calculatePointsPerRace(points: number, races: number): number {
  return races > 0 ? points / races : 0;
}

// Calculate win rate
export function calculateWinRate(wins: number, races: number): number {
  return races > 0 ? (wins / races) * 100 : 0;
}

// Calculate podium rate  
export function calculatePodiumRate(podiums: number, races: number): number {
  return races > 0 ? (podiums / races) * 100 : 0;
}

// Calculate retirement rate
export function calculateRetirementRate(dnfs: number, races: number): number {
  return races > 0 ? (dnfs / races) * 100 : 0;
}

// Calculate points efficiency
export function calculatePointsEfficiency(
  pointsScored: number,
  maxPossiblePoints: number,
): number {
  return maxPossiblePoints > 0 ? (pointsScored / maxPossiblePoints) * 100 : 0;
}

// Calculate position change
export function calculatePositionChange(
  currentPosition: number,
  previousPosition: number,
): number {
  return previousPosition - currentPosition;
}

// Calculate average lap time
export function calculateAverageLapTime(lapTimes: number[]): number {
  if (lapTimes.length === 0) return 0;
  return lapTimes.reduce((sum, t) => sum + t, 0) / lapTimes.length;
}

// Calculate consistency (lower = better)
export function calculateConsistencyScore(results: Result[]): number {
  const positions = results
    .filter((r) => r.position && parseInt(r.position) > 0)
    .map((r) => parseInt(r.position));
  if (positions.length === 0) return 0;
  const avg = positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
  const variance =
    positions.reduce((sum, pos) => sum + Math.pow(pos - avg, 2), 0) /
    positions.length;
  return Math.sqrt(variance);
}

// Calculate recent form (last n races)
export function calculateRecentForm(
  results: Result[],
  numRaces: number = 5,
): number {
  return calculateAvgFinishPosition(results.slice(-numRaces));
}

// Calculate momentum
export function calculateMomentum(results: Result[]): number {
  const overallAvg = calculateAvgFinishPosition(results);
  const recentAvg = calculateRecentForm(results, 5);
  return recentAvg - overallAvg; // negative = better form
}

// Compare two drivers
export interface DriverComparison {
  driver1: {
    wins: number;
    podiums: number;
    points: number;
    avgPosition: number;
    winRate: number;
    podiumRate: number;
  };
  driver2: {
    wins: number;
    podiums: number;
    points: number;
    avgPosition: number;
    winRate: number;
    podiumRate: number;
  };
  advantage: string;
}

export function compareDrivers(
  driver1Results: Result[],
  driver2Results: Result[],
): DriverComparison {
  const d1Stats = calculateDriverStats(
    driver1Results,
    driver1Results[0]?.Driver.driverId || "",
  );
  const d2Stats = calculateDriverStats(
    driver2Results,
    driver2Results[0]?.Driver.driverId || "",
  );

  const d1WinRate = calculateWinRate(
    d1Stats.totalWins || 0,
    d1Stats.totalRaces || 0,
  );
  const d2WinRate = calculateWinRate(
    d2Stats.totalWins || 0,
    d2Stats.totalRaces || 0,
  );

  let advantage = "Even";
  if (d1WinRate > d2WinRate + 5) advantage = "Driver 1";
  else if (d2WinRate > d1WinRate + 5) advantage = "Driver 2";

  return {
    driver1: {
      wins: d1Stats.totalWins || 0,
      podiums: d1Stats.totalPodiums || 0,
      points: d1Stats.totalPoints || 0,
      avgPosition: d1Stats.avgFinishPosition || 0,
      winRate: d1WinRate,
      podiumRate: d1Stats.podiumRate || 0,
    },
    driver2: {
      wins: d2Stats.totalWins || 0,
      podiums: d2Stats.totalPodiums || 0,
      points: d2Stats.totalPoints || 0,
      avgPosition: d2Stats.avgFinishPosition || 0,
      winRate: d2WinRate,
      podiumRate: d2Stats.podiumRate || 0,
    },
    advantage,
  };
}