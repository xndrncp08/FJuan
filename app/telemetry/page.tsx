/**
 * app/telemetry/page.tsx
 *
 * 3D track telemetry: circuit elevation ribbon with a braking/throttle
 * heatmap and a car marker synced to a lap timeline. Optional
 * ?session=<OpenF1 session_key>&driver=<car number>; defaults to the
 * latest completed race and its winner.
 */

import { PageHeader, Section } from "@/components/ui/Section";
import TelemetryCockpit from "@/components/telemetry/TelemetryCockpit";

export const metadata = {
  title: "3D telemetry",
  description: "Lap-vs-lap 3D telemetry: ghost car, live time delta, mini-sectors, g-g diagram, corner analysis and a full channel stack from OpenF1 car data.",
};

export default async function TelemetryPage({ searchParams }: { searchParams: Promise<{ session?: string; driver?: string }> }) {
  const { session, driver } = await searchParams;
  const sessionKey = session && /^\d+$/.test(session) ? Number(session) : undefined;
  const driverNumber = driver && /^\d+$/.test(driver) ? Number(driver) : undefined;
  return (
    <>
      <PageHeader
        eyebrow="Telemetry workstation"
        title="Telemetry Lab"
        watermark="3D"
        description="Two fastest laps, one circuit. Ghost car, live gap, mini-sectors, g-forces and every corner's braking point, straight from the car data."
      />
      <Section className="pt-0 sm:pt-0">
        <TelemetryCockpit initialSession={sessionKey} initialDriver={driverNumber} />
      </Section>
    </>
  );
}
