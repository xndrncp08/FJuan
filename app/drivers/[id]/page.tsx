import { Suspense } from "react";
import DriverProfile from "./DriverProfile";
import { Skeleton } from "@/components/ui/States";

export default async function DriverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <DriverProfile driverId={id} />
    </Suspense>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container-page pb-16 pt-12" role="status" aria-busy="true" aria-label="Loading driver">
      <Skeleton className="mb-6 h-6 w-24" />
      <Skeleton className="mb-3 h-5 w-48" />
      <Skeleton className="h-16 w-full max-w-md" />
      <Skeleton className="mt-8 h-32 rounded-lg" />
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
