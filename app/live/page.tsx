"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Session, Driver, LapData, Stint, PitStop, CarTelemetry, safeArray } from "@/components/live/types";
import { Spinner } from "@/components/live/ui";
import SessionSearch from "@/components/live/SessionSearch";
import DriverSelector from "@/components/live/DriverSelector";
import StatsSummary from "@/components/live/StatsSummary";
import TelemetryPanel from "@/components/live/TelemetryPanel";
import TyrePanel from "@/components/live/TyrePanel";
import LapTimesPanel from "@/components/live/LapTimesPanel";

export default function LivePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [laps, setLaps] = useState<LapData[]>([]);
  const [stints, setStints] = useState<Stint[]>([]);
  const [pits, setPits] = useState<PitStop[]>([]);
  const [car, setCar] = useState<CarTelemetry | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch drivers when a session is selected
  useEffect(() => {
    if (!session) return;
    const load = async () => {
      try {
        const res = await fetch(`https://api.openf1.org/v1/drivers?session_key=${session.session_key}`);
        const data = await res.json();
        // Remove duplicates by driver_number
        const unique = Array.from(
          new Map(safeArray<Driver>(data).map((d) => [d.driver_number, d])).values()
        ).sort((a, b) => a.driver_number - b.driver_number);
        setDrivers(unique);
        setSelectedDriver(null);
        setLaps([]); setStints([]); setPits([]); setCar(null);
      } catch {
        setDrivers([]);
      }
    };
    load();
  }, [session]);

  // Fetch detailed data when a driver is selected
  useEffect(() => {
    if (!session || !selectedDriver) return;
    const load = async () => {
      setLoading(true);
      const key = session.session_key;
      const dn = selectedDriver;
      try {
        const [lapsRes, stintsRes, pitsRes, carRes] = await Promise.allSettled([
          fetch(`https://api.openf1.org/v1/laps?session_key=${key}&driver_number=${dn}`).then((r) => r.json()),
          fetch(`https://api.openf1.org/v1/stints?session_key=${key}&driver_number=${dn}`).then((r) => r.json()),
          fetch(`https://api.openf1.org/v1/pit?session_key=${key}&driver_number=${dn}`).then((r) => r.json()),
          fetch(`https://api.openf1.org/v1/car_data?session_key=${key}&driver_number=${dn}&speed>=100`).then((r) => r.json()),
        ]);
        setLaps(lapsRes.status === "fulfilled" ? safeArray<LapData>(lapsRes.value) : []);
        setStints(stintsRes.status === "fulfilled" ? safeArray<Stint>(stintsRes.value) : []);
        setPits(pitsRes.status === "fulfilled" ? safeArray<PitStop>(pitsRes.value) : []);
        const carData = carRes.status === "fulfilled" ? safeArray<CarTelemetry>(carRes.value) : [];
        setCar(carData.length > 0 ? carData[carData.length - 1] : null);
      } catch { }
      setLoading(false);
    };
    load();
  }, [session, selectedDriver]);

  const selectedDriverObj = drivers.find((d) => d.driver_number === selectedDriver) ?? null;
  const validLaps = laps.filter((l) => l.lap_duration && l.lap_duration > 0 && !l.is_pit_out_lap);
  const fastestLap = validLaps.length > 0 ? Math.min(...validLaps.map((l) => l.lap_duration!)) : 0;

  const handleSessionSelect = (s: Session) => {
    setSession(s);
    setDrivers([]);
    setSelectedDriver(null);
    setLaps([]); setStints([]); setPits([]); setCar(null);
  };

  const handleClearSession = () => {
    setSession(null);
    setDrivers([]);
    setSelectedDriver(null);
    setLaps([]); setStints([]); setPits([]); setCar(null);
  };

  const showData = !loading && selectedDriver && laps.length > 0;
  const showEmpty = !loading && session && selectedDriver && laps.length === 0;

  return (
    <main className="min-h-screen bg-[#060606]">
      <Hero session={session} />

      {/* Responsive container: padding scales from 1rem on mobile to 1.5rem on desktop */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Session search – always on top */}
        <div className="mb-6 md:mb-8">
          <SessionSearch onSelect={handleSessionSelect} />
        </div>

        {/* Session banner (shows after selection) */}
        {session && <SessionBanner session={session} onClear={handleClearSession} />}

        {/* Driver selector – appears after session loaded */}
        {session && drivers.length > 0 && (
          <div className="mb-6 md:mb-8">
            <DriverSelector drivers={drivers} selected={selectedDriver} onSelect={setSelectedDriver} />
          </div>
        )}

        {loading && <Spinner />}

        {/* Main data panels – stacked on mobile, side-by-side on desktop */}
        {showData && (
          <>
            <StatsSummary laps={laps} driver={selectedDriverObj} />
            {/* Grid: 1 column on mobile, 2 columns on medium screens and up */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              <TelemetryPanel car={car} />
              <TyrePanel stints={stints} pits={pits} totalLaps={laps.length} />
            </div>
            <LapTimesPanel laps={laps} fastestLap={fastestLap} />
          </>
        )}

        {/* Empty state when no lap data found */}
        {showEmpty && (
          <div className="py-12 px-4 text-center border border-white/10 bg-[#0a0a0a]">
            <div className="font-display text-sm uppercase tracking-[0.2em] text-white/20 mb-2">No Data</div>
            <p className="text-white/20 text-sm">No lap data for this driver in this session.</p>
          </div>
        )}

        {/* Prompt when no session selected */}
        {!session && <PromptState />}
      </div>
    </main>
  );
}

// Hero section with responsive text sizing
function Hero({ session }: { session: Session | null }) {
  return (
    <section className="relative border-b border-white/10 overflow-hidden">
      {/* Red top accent line */}
      <div className="h-[2px] bg-f1-red" />

      {/* Giant background watermark – smaller on mobile */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center pr-4 md:pr-8 pointer-events-none">
        <span className="font-display text-[clamp(4rem,15vw,12rem)] text-white/5 leading-none">F1</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/40 text-xs uppercase tracking-[0.15em] mb-6 hover:text-white/70 transition"
        >
          ← Home
        </Link>

        {/* Status label */}
        <div className="flex items-center gap-2 mb-2">
          <span className="live-dot" />
          <span className="text-f1-red text-[0.7rem] md:text-xs font-semibold tracking-[0.2em] uppercase">
            {session ? `${session.circuit_short_name} · ${session.session_name}` : "Session Telemetry"}
          </span>
        </div>

        {/* Main title – scales with screen size */}
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-white leading-[0.92] tracking-[-0.02em] mb-2">
          RACE<span className="text-f1-red">DATA</span>
        </h1>
        <p className="text-white/40 text-sm md:text-base max-w-md">
          Browse any F1 session and explore real telemetry, lap times, tyre strategy, and car data.
        </p>
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#060606] to-transparent pointer-events-none" />
    </section>
  );
}

// Session banner – shows selected session info with change button
function SessionBanner({ session, onClear }: { session: Session; onClear: () => void }) {
  return (
    <div className="mb-6 p-3 md:p-4 bg-red-600/10 border border-red-600/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <div className="font-bold text-white text-sm md:text-base uppercase tracking-wide">
          {session.circuit_short_name} — {session.session_name}
        </div>
        <div className="text-white/40 text-[0.65rem] md:text-xs mt-1">
          {session.country_name} ·{" "}
          {new Date(session.date_start).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>
      <button onClick={onClear} className="btn-ghost text-xs py-1.5 px-3">
        Change Session
      </button>
    </div>
  );
}

// Empty prompt when no session is loaded
function PromptState() {
  return (
    <div className="py-16 px-4 text-center border border-white/5 bg-[#0a0a0a]">
      <div className="font-display text-sm uppercase tracking-[0.2em] text-white/20 mb-2">
        Select a Year and Race Above
      </div>
      <p className="text-white/20 text-sm">
        Use the dropdowns to find a session, then pick a driver to load their data.
      </p>
    </div>
  );
}