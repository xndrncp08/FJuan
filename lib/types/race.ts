// Race and calendar type definitions
export interface Race {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: Circuit;
  date: string;
  time?: string;
  FirstPractice?: SessionInfo;
  SecondPractice?: SessionInfo;
  ThirdPractice?: SessionInfo;
  Qualifying?: SessionInfo;
  Sprint?: SessionInfo;
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

export interface SessionInfo {
  date: string;
  time?: string;
}

export interface RaceWeekend {
  race: Race;
  sessions: SessionSchedule[];
  countdown?: CountdownInfo;
  weather?: WeatherInfo;
}

export interface SessionSchedule {
  name: string;
  date: string;
  time: string;
  localTime: string;
  isComplete: boolean;
}

export interface CountdownInfo {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  nextSession: string;
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  chanceOfRain: number;
}

// Constructor standings
export interface ConstructorStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Constructor: Constructor;
}

export interface Constructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}

export interface ConstructorStats {
  constructor: Constructor;
  standings: ConstructorStanding;
  drivers: string[];
  totalWins: number;
  totalPodiums: number;
  totalPoles: number;
  totalPoints: number;
  championships: number;
  recentResults: ConstructorRaceResult[];
}

export interface ConstructorRaceResult {
  race: string;
  date: string;
  driver1Position: string;
  driver2Position: string;
  points: number;
}

// Season and championship data
export interface Season {
  season: string;
  url: string;
}

export interface StandingsTable {
  season: string;
  round?: string;
  DriverStandings?: DriverStanding[];
  ConstructorStandings?: ConstructorStanding[];
}

export interface DriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: Driver;
  Constructors: Constructor[];
}

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