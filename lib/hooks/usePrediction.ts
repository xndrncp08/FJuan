/**
 * lib/hooks/usePrediction.ts
 *
 * React Query hook that fetches a race winner prediction from
 * GET /api/prediction.
 *
 * Usage:
 *   const { prediction, isLoading, error } = usePrediction();
 *   const { prediction } = usePrediction({ season: "2025", round: "5" });
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { RacePrediction } from "@/lib/types/prediction";

interface UsePredictionOptions {
  season?: string;
  round?: string;
  /** If false, the query won't run (useful for conditional fetching) */
  enabled?: boolean;
}

async function fetchPrediction(
  season?: string,
  round?: string
): Promise<RacePrediction> {
  // Build query string only when params are explicitly provided
  const params = new URLSearchParams();
  if (season) params.set("season", season);
  if (round)  params.set("round", round);

  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`/api/prediction${qs}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to fetch prediction");
  }

  return res.json();
}

export function usePrediction(options: UsePredictionOptions = {}) {
  const { season, round, enabled = true } = options;

  const query = useQuery<RacePrediction, Error>({
    // Cache key includes season + round so different races are cached separately
    queryKey: ["prediction", season ?? "next", round ?? "next"],
    queryFn: () => fetchPrediction(season, round),
    enabled,
    // Keep data fresh for 10 minutes (matches server-side cache)
    staleTime: 10 * 60 * 1000,
    // Retry once on failure before showing an error
    retry: 1,
  });

  return {
    prediction: query.data ?? null,
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
    error:      query.error?.message ?? null,
    refetch:    query.refetch,
  };
}