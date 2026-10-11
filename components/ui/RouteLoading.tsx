import { Skeleton } from "./States";

export function RouteLoading({ label = "Loading page", variant = "data" }: { label?: string; variant?: "data" | "profile" | "search" }) {
  return (
    <div className="container-page pb-16 pt-12 sm:pt-20" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <p className="eyebrow mb-4">{label}</p>
      <Skeleton className="h-12 w-full max-w-lg sm:h-16" />
      <Skeleton className="mt-5 h-5 w-full max-w-md" />
      {variant === "search" ? <Skeleton className="mt-8 h-14" /> : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className={variant === "profile" ? "h-24" : "h-12"} />)}
        </div>
      )}
      <div className="card mt-8 space-y-4 p-5 sm:p-6">
        <Skeleton className="mb-6 h-5 w-40" />
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}
      </div>
    </div>
  );
}
