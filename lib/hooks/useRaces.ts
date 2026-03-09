'use client';

import { useQuery } from '@tanstack/react-query';
import { getRaceCalendar, getNextRace, getRaceResultsDetailed } from '../api/fetchers';

export function useRaceCalendar(season: string = 'current') {
  return useQuery({
    queryKey: ['calendar', season],
    queryFn: () => getRaceCalendar(season),
    staleTime: 1000 * 60 * 60,
  });
}

export function useNextRace() {
  return useQuery({
    queryKey: ['race', 'next'],
    queryFn: getNextRace,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
}

export function useRaceResults(season: string, round: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['race', season, round, 'results'],
    queryFn: () => getRaceResultsDetailed(season, round),
    enabled: !!season && !!round && enabled,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useCurrentSeasonRaces() {
  return useQuery({
    queryKey: ['races', 'current', 'completed'],
    queryFn: async () => {
      const calendar = await getRaceCalendar('current');
      return calendar.filter((r: any) => r.isPast);
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useUpcomingRaces() {
  return useQuery({
    queryKey: ['races', 'upcoming'],
    queryFn: async () => {
      const calendar = await getRaceCalendar('current');
      return calendar.filter((r: any) => !r.isPast);
    },
    staleTime: 1000 * 60 * 5,
  });
}