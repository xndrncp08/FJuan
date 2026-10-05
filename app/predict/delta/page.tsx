/**
 * app/predict/delta/page.tsx
 *
 * Prediction vs. actual: the race-pace model and the classification engine
 * scored against real race data.
 */

import { PageHeader, Section } from "@/components/ui/Section";
import DeltaDashboard from "@/components/prediction/delta/DeltaDashboard";

export const metadata = {
  title: "Prediction vs actual",
  description: "How FJUAN's lap-time and race-result models compare with what actually happened: lap, sector and cornering-speed deltas, pit windows, and accuracy.",
};

export default function DeltaPage() {
  return (
    <>
      <PageHeader
        back={{ href: "/predict", label: "Predict" }}
        eyebrow="Model review"
        title="Prediction Delta"
        watermark="Δ"
        description="The race-pace model is fitted on a handful of early laps, then predicts the rest of the race. Every number below is scored only on laps it never saw."
      />
      <Section className="pt-0 sm:pt-0">
        <DeltaDashboard />
      </Section>
    </>
  );
}
