/**
 * app/telemetry/page.tsx
 *
 * 3D track telemetry: circuit elevation ribbon with a braking/throttle
 * heatmap and a car marker synced to a lap timeline. Optional
 * ?session=<OpenF1 session_key>; defaults to the latest completed race.
 */

import { PageHeader, Section } from "@/components/ui/Section";
import TelemetryCockpit from "@/components/telemetry/TelemetryCockpit";

export const metadata = {
  title: "3D telemetry",
  description: "Interactive 3D circuit telemetry: elevation, braking and throttle zones, and lap playback from OpenF1 car data.",
};

export default async function TelemetryPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session } = await searchParams;
  const sessionKey = session && /^\d+$/.test(session) ? Number(session) : undefined;
  return (
    <>
      <PageHeader
        eyebrow="Telemetry cockpit"
        title="Track Telemetry"
        watermark="3D"
        description="Every braking zone, full-throttle run, and lift on one lap, mapped onto the circuit in 3D. Scrub the timeline or press play."
      />
      <Section className="pt-0 sm:pt-0">
        <TelemetryCockpit initialSession={sessionKey} />
      </Section>
    </>
  );
}
