'use client';

import { useQuery, useQueries } from '@tanstack/react-query';
import { getCurrentDrivers, getCurrentStandings } from '../api/fetchers';
import { getDriverStandings, getDriversBySeason } from '../api/jolpica';
import type { DriverStats } from '../types/driver';

async function fetchDriverStats(driverId: string, signal: AbortSignal): Promise<DriverStats> {
  const response = await fetch(`/api/drivers/${encodeURIComponent(driverId)}/stats`, { signal });
  if (!response.ok) throw new Error('Driver statistics are unavailable.');
  return response.json();
}

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers', 'current'],
    queryFn: getCurrentDrivers,
    staleTime: 1000 * 60 * 10,
  });
}

export function useDriverStandings(season = 'current') {
  return useQuery({
    queryKey: ['standings', 'drivers', season],
    queryFn: () => season === 'current' ? getCurrentStandings() : getDriverStandings(season),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDriverStats(driverId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['driver', driverId, 'stats'],
    queryFn: ({ signal }) => fetchDriverStats(driverId, signal),
    enabled: !!driverId && enabled,
    staleTime: 1000 * 60 * 30,
  });
}

export function useDriverComparison(driverId1: string, driverId2: string) {
  return useQuery({
    queryKey: ['comparison', driverId1, driverId2],
    queryFn: async ({ signal }) => {
      const [driver1Stats, driver2Stats] = await Promise.all([fetchDriverStats(driverId1, signal), fetchDriverStats(driverId2, signal)]);
      return { driver1Stats, driver2Stats };
    },
    enabled: !!driverId1 && !!driverId2,
    staleTime: 1000 * 60 * 15,
  });
}

export function useMultipleDriverStats(driverIds: string[]) {
  return useQueries({
    queries: driverIds.map(driverId => ({
      queryKey: ['driver', driverId, 'stats'],
      queryFn: ({ signal }) => fetchDriverStats(driverId, signal),
      staleTime: 1000 * 60 * 30,
    })),
  });
}

export function useDriversBySeason(season: string) {
  return useQuery({
    queryKey: ['drivers', season],
    queryFn: () => getDriversBySeason(season),
    enabled: !!season,
    staleTime: 1000 * 60 * 60,
  });
}
