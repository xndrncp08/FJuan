import { FloatingWindow } from "@/components/ui/FloatingWindow";

export default async function RaceWindowLayout({ children, params }: { children: React.ReactNode; params: Promise<{ season: string; round: string }> }) {
  const { season, round } = await params;
  return (
    <FloatingWindow eyebrow={`${season} · Round ${round}`} title="Race results">
      {children}
    </FloatingWindow>
  );
}
