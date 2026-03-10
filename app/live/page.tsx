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

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      try {
        const res = await fetch(`https://api.openf1.org/v1/drivers?session_key=${session.session_key}`);
        const data = await res.json();
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
    <main style={{ background: "#060606", minHeight: "100vh" }}>
      <Hero session={session} />

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <SessionSearch onSelect={handleSessionSelect} />
        </div>

        {session && <SessionBanner session={session} onClear={handleClearSession} />}

        {session && drivers.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <DriverSelector drivers={drivers} selected={selectedDriver} onSelect={setSelectedDriver} />
          </div>
        )}

        {loading && <Spinner />}

        {showData && (
          <>
            <StatsSummary laps={laps} driver={selectedDriverObj} />
            <div className="live-data-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <TelemetryPanel car={car} />
              <TyrePanel stints={stints} pits={pits} totalLaps={laps.length} />
            </div>
            <LapTimesPanel laps={laps} fastestLap={fastestLap} />
          </>
        )}

        {showEmpty && (
          <div style={{ padding: "4rem 2rem", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0a" }}>
            <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>No Data</div>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.2)" }}>No lap data for this driver in this session.</p>
          </div>
        )}

        {!session && <PromptState />}
      </div>
    </main>
  );
}

function Hero({ session }: { session: Session | null }) {
  return (
    <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
      <div style={{ height: "2px", background: "#E10600" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", paddingRight: "2rem", pointerEvents: "none", overflow: "hidden" }}>
        <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(6rem, 18vw, 16rem)", color: "rgba(255,255,255,0.02)", lineHeight: 1 }}>F1</span>
      </div>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "2rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>← Home</Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
          <span className="live-dot" />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#E10600" }}>
            {session ? `${session.circuit_short_name} · ${session.session_name}` : "Session Telemetry"}
          </span>
        </div>
        <h1 style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(3rem, 8vw, 6rem)", color: "white", lineHeight: 0.92, letterSpacing: "-0.02em", margin: "0 0 0.75rem" }}>
          RACE<span style={{ color: "#E10600" }}>DATA</span>
        </h1>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 400, fontSize: "1rem", color: "rgba(255,255,255,0.38)", maxWidth: "420px" }}>
          Browse any F1 session and explore real telemetry, lap times, tyre strategy, and car data.
        </p>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "80px", background: "linear-gradient(to bottom, transparent, #060606)", pointerEvents: "none" }} />
    </section>
  );
}

function SessionBanner({ session, onClear }: { session: Session; onClear: () => void }) {
  return (
    <div style={{ marginBottom: "2rem", padding: "1rem 1.25rem", background: "rgba(225,6,0,0.06)", border: "1px solid rgba(225,6,0,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
      <div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "white", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {session.circuit_short_name} — {session.session_name}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
          {session.country_name} · {new Date(session.date_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
      </div>
      <button onClick={onClear} className="btn-ghost" style={{ fontSize: "0.72rem", padding: "0.4rem 0.85rem" }}>Change Session</button>
    </div>
  );
}

function PromptState() {
  return (
    <div style={{ padding: "5rem 2rem", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)", background: "#0a0a0a" }}>
      <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1rem", color: "rgba(255,255,255,0.15)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
        Select a Year and Race Above
      </div>
      <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.18)" }}>
        Use the dropdowns to find a session, then pick a driver to load their data.
      </p>
    </div>
  );
}