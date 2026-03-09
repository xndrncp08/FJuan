// OpenF1 API Client for live telemetry and real-time data
const BASE_URL = 'https://api.openf1.org/v1';

// Generic fetch function
async function fetchFromOpenF1<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  try {
    const url = new URL(`${BASE_URL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 0 }, // No caching for live data
    });

    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching from OpenF1 ${endpoint}:`, error);
    throw error;
  }
}

// Get all sessions
export async function getSessions(params?: {
  year?: number;
  country_name?: string;
  session_name?: string;
  session_key?: number;
}) {
  return fetchFromOpenF1<any[]>('/sessions', params);
}

// Get latest session
export async function getLatestSession() {
  const sessions = await getSessions();
  return sessions.length > 0 ? sessions[sessions.length - 1] : null;
}

// Get live session (currently active)
export async function getLiveSession() {
  try {
    const sessions = await getSessions();
    const now = new Date();
    
    const liveSession = sessions.find((session: any) => {
      const start = new Date(session.date_start);
      const end = new Date(session.date_end);
      return now >= start && now <= end;
    });
    
    return liveSession || null;
  } catch (error) {
    console.error('Error getting live session:', error);
    return null;
  }
}

// Get car data (telemetry)
export async function getCarData(params: {
  session_key: number;
  driver_number?: number;
  speed?: number;
}) {
  return fetchFromOpenF1<any[]>('/car_data', params);
}

// Get position data
export async function getPositions(params: {
  session_key: number;
  driver_number?: number;
}) {
  return fetchFromOpenF1<any[]>('/position', params);
}

// Get lap data
export async function getLaps(params: {
  session_key: number;
  driver_number?: number;
  lap_number?: number;
}) {
  return fetchFromOpenF1<any[]>('/laps', params);
}

// Get intervals (gaps between drivers)
export async function getIntervals(params: {
  session_key: number;
  driver_number?: number;
}) {
  return fetchFromOpenF1<any[]>('/intervals', params);
}

// Get stints (tire strategy)
export async function getStints(params: {
  session_key: number;
  driver_number?: number;
}) {
  return fetchFromOpenF1<any[]>('/stints', params);
}

// Get pit stops
export async function getPitStops(params: {
  session_key: number;
  driver_number?: number;
}) {
  return fetchFromOpenF1<any[]>('/pit', params);
}

// Get race control messages
export async function getRaceControl(params: {
  session_key: number;
}) {
  return fetchFromOpenF1<any[]>('/race_control', params);
}

// Get team radio messages
export async function getTeamRadio(params: {
  session_key: number;
  driver_number?: number;
}) {
  return fetchFromOpenF1<any[]>('/team_radio', params);
}

// Get weather data
export async function getWeather(params: {
  session_key: number;
}) {
  return fetchFromOpenF1<any[]>('/weather', params);
}

// Get location data (GPS coordinates)
export async function getLocation(params: {
  session_key: number;
  driver_number?: number;
}) {
  return fetchFromOpenF1<any[]>('/location', params);
}

// Get driver list for a session
export async function getDrivers(session_key: number): Promise<number[]> {
  try {
    const positions = await getPositions({ session_key });
    const driverNumbers = [...new Set(positions.map(p => p.driver_number))];
    return driverNumbers.sort((a, b) => a - b);
  } catch (error) {
    console.error('Error getting drivers:', error);
    return [];
  }
}

// Get real-time telemetry for all drivers in a session
export async function getSessionTelemetry(session_key: number, limit: number = 100) {
  try {
    const drivers = await getDrivers(session_key);
    
    const telemetryPromises = drivers.map(async (driver_number) => {
      try {
        const [carData, laps, positions] = await Promise.all([
          getCarData({ session_key, driver_number }).catch(() => []),
          getLaps({ session_key, driver_number }).catch(() => []),
          getPositions({ session_key, driver_number }).catch(() => []),
        ]);

        const latestCar = carData.length > 0 ? carData[carData.length - 1] : null;
        const latestPosition = positions.length > 0 ? positions[positions.length - 1] : null;
        const latestLap = laps.length > 0 ? laps[laps.length - 1] : null;

        return {
          driver_number,
          telemetry: {
            speed: latestCar?.speed || 0,
            rpm: latestCar?.rpm || 0,
            gear: latestCar?.n_gear || 0,
            throttle: latestCar?.throttle || 0,
            brake: latestCar?.brake || 0,
            drs: latestCar?.drs || 0,
          },
          position: latestPosition?.position || 0,
          lap_number: latestLap?.lap_number || 0,
          lap_time: latestLap?.lap_duration || 0,
        };
      } catch (error) {
        console.error(`Error fetching telemetry for driver ${driver_number}:`, error);
        return null;
      }
    });

    const results = await Promise.all(telemetryPromises);
    return results.filter(r => r !== null);
  } catch (error) {
    console.error('Error getting session telemetry:', error);
    return [];
  }
}

// Stream real-time updates (polling simulation)
export async function streamSessionData(
  session_key: number,
  callback: (data: any) => void,
  interval: number = 5000
): Promise<() => void> {
  const pollData = async () => {
    try {
      const data = await getSessionTelemetry(session_key);
      callback(data);
    } catch (error) {
      console.error('Error polling session data:', error);
    }
  };

  // Initial fetch
  await pollData();

  // Set up polling
  const intervalId = setInterval(pollData, interval);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

// Get driver performance summary
export async function getDriverPerformanceSummary(
  session_key: number,
  driver_number: number
) {
  try {
    const [laps, stints, carData] = await Promise.all([
      getLaps({ session_key, driver_number }),
      getStints({ session_key, driver_number }),
      getCarData({ session_key, driver_number }),
    ]);

    const completedLaps = laps.filter(l => l.lap_duration > 0);
    const avgLapTime = completedLaps.length > 0
      ? completedLaps.reduce((sum, l) => sum + l.lap_duration, 0) / completedLaps.length
      : 0;

    const fastestLap = completedLaps.length > 0
      ? Math.min(...completedLaps.map(l => l.lap_duration))
      : 0;

    const topSpeed = carData.length > 0
      ? Math.max(...carData.map(d => d.speed))
      : 0;

    return {
      driver_number,
      total_laps: laps.length,
      completed_laps: completedLaps.length,
      avg_lap_time: avgLapTime,
      fastest_lap: fastestLap,
      top_speed: topSpeed,
      stints: stints.length,
      tire_compounds: [...new Set(stints.map(s => s.compound))],
    };
  } catch (error) {
    console.error(`Error getting performance summary for driver ${driver_number}:`, error);
    throw error;
  }
}

// Check if session is live
export async function isSessionLive(session_key: number): Promise<boolean> {
  try {
    const sessions = await getSessions({ session_key });
    if (sessions.length === 0) return false;

    const session = sessions[0];
    const now = new Date();
    const startDate = new Date(session.date_start);
    const endDate = new Date(session.date_end);

    return now >= startDate && now <= endDate;
  } catch (error) {
    console.error('Error checking if session is live:', error);
    return false;
  }
}