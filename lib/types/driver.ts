// Driver type definitions
export interface Driver {
  driverId: string;
  permanentNumber: string;
  code: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
  url: string;
}

export interface DriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: Driver;
  Constructors: Constructor[];
}

export interface Constructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}

export interface DriverStats {
  driver: Driver;
  totalRaces: number;
  totalWins: number;
  totalPodiums: number;
  totalPoles: number;
  totalFastestLaps: number;
  totalPoints: number;
  totalChampionships: number;
  dnfCount: number;
  retirementRate: number;
  avgFinishPosition: number;
  avgQualifyingPosition: number;
  bestFinish: number;
  worstFinish: number;
  pointsPerRace: number;
  winRate: number;
  podiumRate: number;
  currentTeam?: Constructor;
  careerSpan: {
    firstRace: string;
    lastRace: string;
    yearsActive: number;
  };
  seasonResults: SeasonResult[];
}

export interface SeasonResult {
  season: string;
  team: string;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  points: number;
  position: number;
}

export interface RaceResult {
  season: string;
  round: string;
  raceName: string;
  Circuit: Circuit;
  date: string;
  time?: string;
  Results: Result[];
}

export interface Result {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: Driver;
  Constructor: Constructor;
  grid: string;
  laps: string;
  status: string;
  Time?: {
    millis: string;
    time: string;
  };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: {
      time: string;
    };
    AverageSpeed: {
      units: string;
      speed: string;
    };
  };
}

export interface Circuit {
  circuitId: string;
  url: string;
  circuitName: string;
  Location: Location;
}

export interface Location {
  lat: string;
  long: string;
  locality: string;
  country: string;
}

export interface QualifyingResult {
  number: string;
  position: string;
  Driver: Driver;
  Constructor: Constructor;
  Q1: string;
  Q2?: string;
  Q3?: string;
}

// Extended driver profile for detailed pages
export interface DriverProfile extends DriverStats {
  bio?: string;
  height?: string;
  placeOfBirth?: string;
  teamColor?: string;
  number?: string;
  recentForm: Result[];
  careerHighlights: string[];
  strengths: string[];
}

export interface DriverRaceResult extends Result {
  season: string;
  round: string;
  raceName: string;
}