'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { 
  getLiveSessionData, 
  getSessions, 
  isSessionLive, 
  getSessionTelemetry, 
  getDriverPerformanceSummary, 
  getLaps, 
  getStints, 
  streamSessionData 
} from '../api/fetchers';

export function useLiveSession() {
  return useQuery({
    queryKey: ['session', 'live'],
    queryFn: getLiveSessionData,
    refetchInterval: 5000,
    staleTime: 0,
  });
}

export function useLiveTelemetry(sessionKey: number | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['telemetry', sessionKey],
    queryFn: () => sessionKey ? getSessionTelemetry(sessionKey) : null,
    enabled: !!sessionKey && enabled,
    refetchInterval: 3000,
    staleTime: 0,
  });
}

export function useLatestSessions(limit: number = 5) {
  return useQuery({
    queryKey: ['sessions', 'latest', limit],
    queryFn: async () => {
      const sessions = await getSessions();
      return sessions.slice(-limit).reverse();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useIsSessionLive(sessionKey: number | null) {
  return useQuery({
    queryKey: ['session', sessionKey, 'live'],
    queryFn: () => sessionKey ? isSessionLive(sessionKey) : false,
    enabled: !!sessionKey,
    refetchInterval: 10000,
  });
}

export function useDriverPerformance(sessionKey: number | null, driverNumber: number | null) {
  return useQuery({
    queryKey: ['performance', sessionKey, driverNumber],
    queryFn: () => (sessionKey && driverNumber) ? getDriverPerformanceSummary(sessionKey, driverNumber) : null,
    enabled: !!sessionKey && !!driverNumber,
    staleTime: 1000 * 60,
  });
}

export function useStreamingTelemetry(sessionKey: number | null) {
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!sessionKey) return;
    
    setIsStreaming(true);
    const cleanup = streamSessionData(sessionKey, (data) => setTelemetryData(data), 5000);
    
    return () => {
      cleanup.then(fn => fn());
      setIsStreaming(false);
    };
  }, [sessionKey]);

  return { data: telemetryData, isStreaming };
}

export function useDriverLaps(sessionKey: number | null, driverNumber: number | null) {
  return useQuery({
    queryKey: ['laps', sessionKey, driverNumber],
    queryFn: () => (sessionKey && driverNumber) ? getLaps({ session_key: sessionKey, driver_number: driverNumber }) : null,
    enabled: !!sessionKey && !!driverNumber,
    staleTime: 1000 * 30,
  });
}

export function useTireStrategy(sessionKey: number | null, driverNumber: number | null) {
  return useQuery({
    queryKey: ['stints', sessionKey, driverNumber],
    queryFn: () => (sessionKey && driverNumber) ? getStints({ session_key: sessionKey, driver_number: driverNumber }) : null,
    enabled: !!sessionKey && !!driverNumber,
    staleTime: 1000 * 60,
  });
}