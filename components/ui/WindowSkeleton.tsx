/** Placeholder shown inside a FloatingWindow while its page streams in. */

import { Skeleton } from "@/components/ui/States";

export function WindowSkeleton() {
  return (
    <div className="space-y-4 px-5 pb-10 pt-6 sm:px-8 sm:pt-8" role="status" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-12 w-3/4 max-w-md" />
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-6 h-56 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
