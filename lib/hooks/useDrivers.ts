'use client';

import { useQuery, useQueries } from '@tanstack/react-query';
import { getCurrentDrivers, getCurrentStandings, getDriverStats, getDriverComparison } from '../api/fetchers';

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers', 'current'],
    queryFn: getCurrentDrivers,
    staleTime: 1000 * 60 * 10,
  });
}

export function useDriverStandings() {
  return useQuery({
    queryKey: ['standings', 'drivers', 'current'],
    queryFn: getCurrentStandings,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDriverStats(driverId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['driver', driverId, 'stats'],
    queryFn: () => getDriverStats(driverId),
    enabled: !!driverId && enabled,
    staleTime: 1000 * 60 * 30,
  });
}

export function useDriverComparison(driverId1: string, driverId2: string) {
  return useQuery({
    queryKey: ['comparison', driverId1, driverId2],
    queryFn: () => getDriverComparison(driverId1, driverId2),
    enabled: !!driverId1 && !!driverId2,
    staleTime: 1000 * 60 * 15,
  });
}

export function useMultipleDriverStats(driverIds: string[]) {
  return useQueries({
    queries: driverIds.map(driverId => ({
      queryKey: ['driver', driverId, 'stats'],
      queryFn: () => getDriverStats(driverId),
      staleTime: 1000 * 60 * 30,
    })),
  });
}

export function useDriversBySeason(season: string) {
  return useQuery({
    queryKey: ['drivers', season],
    queryFn: () => getCurrentDrivers(),
    enabled: !!season,
    staleTime: 1000 * 60 * 60,
  });
}