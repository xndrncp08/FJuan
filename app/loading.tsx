import { Skeleton } from "@/components/ui/States";

// Shown while a server-rendered page streams in, so navigation responds
// immediately with the page's shape instead of freezing on the old page.
export default function Loading() {
  return (
    <div className="container-page pb-16 pt-10 sm:pt-16" role="status" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-12 w-full max-w-sm sm:h-16" />
      <Skeleton className="mt-4 h-5 w-full max-w-lg" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 rounded-lg" />
        ))}
      </div>
      <Skeleton className="mt-5 h-80 rounded-lg" />
    </div>
  );
}
