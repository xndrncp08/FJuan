import { Suspense } from "react";
import { getDriverIndex } from "@/lib/api/driverIndex";
import { RouteLoading } from "@/components/ui/RouteLoading";
import CompareClient from "./CompareClient";

export const metadata = { title: "Compare drivers" };

async function Comparison() {
  const historicalDrivers = await getDriverIndex();
  return <CompareClient historicalDrivers={historicalDrivers} />;
}

export default function ComparePage() {
  return <Suspense fallback={<RouteLoading label="Loading driver index" />}><Comparison /></Suspense>;
}
