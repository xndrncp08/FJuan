"use client";

import { useState, useEffect } from "react";
import LiveHero from "@/components/live/LiveHero";
import SessionControl from "@/components/live/Sessioncontrol";
import TelemetryChart from "@/components/live/TelemetryChart";
import EmptyState from "@/components/live/EmptyState";

export default function LivePage() {
  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setTelemetryData((prev) => {
          const newData = [...prev];
          const time = new Date().toLocaleTimeString();
          newData.push({
            time,
            verstappen: Math.floor(Math.random() * 50) + 280,
            hamilton: Math.floor(Math.random() * 50) + 275,
            leclerc: Math.floor(Math.random() * 50) + 270,
          });
          if (newData.length > 20) newData.shift();
          return newData;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  const rpmData = telemetryData.map((d) => ({
    time: d.time,
    verstappen: d.verstappen * 45,
    hamilton: d.hamilton * 44,
    leclerc: d.leclerc * 43,
  }));

  const driverKeys = [
    { key: "verstappen", name: "VER #1", color: "#3671C6" },
    { key: "hamilton", name: "HAM #44", color: "#27F4D2" },
    { key: "leclerc", name: "LEC #16", color: "#E8002D" },
  ];

  return (
    <main className="min-h-screen" style={{ background: "#080808" }}>
      <LiveHero />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <SessionControl isLive={isLive} onToggle={() => setIsLive(!isLive)} />

        {telemetryData.length > 0 ? (
          <div className="space-y-6">
            <TelemetryChart
              data={telemetryData}
              title="Speed Comparison (km/h)"
              dataKeys={driverKeys}
              yAxisDomain={[250, 350]}
            />
            <TelemetryChart
              data={rpmData}
              title="RPM Comparison"
              dataKeys={driverKeys}
              yAxisDomain={[10000, 15000]}
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  );
}
