/**
 * app/teams/[constructorId]/car/page.tsx — The team's current car.
 * Opened from the site, the same view appears in a floating window instead
 * (app/@modal/(.)teams/[constructorId]/car).
 */

import CarDetail, { carPageTitle } from "@/components/teams/CarDetail";

export async function generateMetadata({ params }: { params: Promise<{ constructorId: string }> }) {
  const { constructorId } = await params;
  return { title: carPageTitle(constructorId) };
}

export default async function TeamCarPage({ params }: { params: Promise<{ constructorId: string }> }) {
  const { constructorId } = await params;
  return <CarDetail constructorId={constructorId} variant="page" />;
}
