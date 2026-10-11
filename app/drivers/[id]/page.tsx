import { Suspense } from "react";
import DriverProfile from "./DriverProfile";
import { RouteLoading } from "@/components/ui/RouteLoading";

export const metadata = { title: "Driver career" };
export default async function DriverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense fallback={<RouteLoading label="Loading driver career" variant="profile" />}><DriverProfile driverId={id} /></Suspense>;
}
