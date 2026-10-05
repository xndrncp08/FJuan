import { FloatingWindow } from "@/components/ui/FloatingWindow";
import { carPageTitle } from "@/components/teams/CarDetail";

export default async function CarWindowLayout({ children, params }: { children: React.ReactNode; params: Promise<{ constructorId: string }> }) {
  const { constructorId } = await params;
  return (
    <FloatingWindow eyebrow="The car" title={carPageTitle(constructorId)}>
      {children}
    </FloatingWindow>
  );
}
