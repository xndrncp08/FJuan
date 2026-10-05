import CarDetail from "@/components/teams/CarDetail";

export default async function CarWindow({ params }: { params: Promise<{ constructorId: string }> }) {
  const { constructorId } = await params;
  return <CarDetail constructorId={constructorId} variant="window" />;
}
