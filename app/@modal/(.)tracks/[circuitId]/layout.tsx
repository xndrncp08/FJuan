import { FloatingWindow } from "@/components/ui/FloatingWindow";
import { circuitName } from "@/components/tracks/CircuitDetail";

export default async function CircuitWindowLayout({ children, params }: { children: React.ReactNode; params: Promise<{ circuitId: string }> }) {
  const { circuitId } = await params;
  return (
    <FloatingWindow eyebrow="Circuit" title={circuitName(circuitId)}>
      {children}
    </FloatingWindow>
  );
}
