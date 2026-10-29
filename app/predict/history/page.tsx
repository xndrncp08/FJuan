/**
 * app/predict/history/page.tsx
 *
 * Prediction archive: the classification engine's call for any finished
 * race, against the real result.
 */

import { Suspense } from "react";
import { PageHeader, Section } from "@/components/ui/Section";
import { RouteLoading } from "@/components/ui/RouteLoading";
import PredictionArchive from "@/components/prediction/PredictionArchive";

export const metadata = {
  title: "Prediction archive",
  description: "FJUAN's race prediction for every finished Grand Prix, against what actually happened.",
};

export default function PredictionHistoryPage() {
  return (
    <>
      <PageHeader
        back={{ href: "/predict", label: "Predict" }}
        eyebrow="Model evaluation"
        title="Prediction Archive"
        watermark="CALL"
        description="Compare a saved pre-race snapshot with the final result. Each prediction horizon is evaluated separately; races without a snapshot are excluded."
      />
      <Section className="pt-0 sm:pt-0">
        <Suspense fallback={<RouteLoading label="Loading archive" />}>
          <PredictionArchive />
        </Suspense>
      </Section>
    </>
  );
}
