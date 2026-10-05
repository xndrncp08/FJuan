/**
 * app/tracks/[circuitId]/page.tsx — One circuit.
 * Opened from a list, the same view appears in a floating window instead
 * (app/@modal/(.)tracks/[circuitId]).
 */

import CircuitDetail, { circuitName } from "@/components/tracks/CircuitDetail";

export async function generateMetadata({ params }: { params: Promise<{ circuitId: string }> }) {
  const { circuitId } = await params;
  return { title: circuitName(circuitId) };
}

export default async function TrackDetailPage({ params }: { params: Promise<{ circuitId: string }> }) {
  const { circuitId } = await params;
  return <CircuitDetail circuitId={circuitId} variant="page" />;
}
