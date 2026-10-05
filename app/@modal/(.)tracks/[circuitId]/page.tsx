import CircuitDetail from "@/components/tracks/CircuitDetail";

export default async function CircuitWindow({ params }: { params: Promise<{ circuitId: string }> }) {
  const { circuitId } = await params;
  return <CircuitDetail circuitId={circuitId} variant="window" />;
}
