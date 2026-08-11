/**
 * app/live/page.tsx
 *
 * Live telemetry page: session search -> driver selection -> full
 * telemetry dashboard (stats, car telemetry, tyres, sector deltas, lap
 * table, lap trend chart).
 *
 * Colors come from lib/theme/palette.ts, the same file the marketing
 * sections (Hero/LastRace/News/Dashboard) use, so this page reads as part
 * of the same site rather than a separately-styled tool.
 *
 * A few colors are intentionally kept outside the brand palette, documented
 * where they're used: green/amber/red for PB-delta tiers (a motorsport
 * telemetry convention), and distinct hues per telemetry channel so four
 * traces stay tellable apart at a glance.
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Session,
  Driver,
  LapData,
  Stint,
  PitStop,
  CarTelemetry,
  safeArray,
} from "@/components/live/types";
import SessionSearch from "@/components/live/SessionSearch";
import DriverSelector from "@/components/live/DriverSelector";
import StatsSummary from "@/components/live/StatsSummary";
import TelemetryPanel from "@/components/live/TelemetryPanel";
import TyrePanel from "@/components/live/TyrePanel";
import LapTimesPanel from "@/components/live/LapTimesPanel";
import LapTrendChart from "@/components/live/LapTrendChart";
import SectorDeltaPanel from "@/components/live/SectorDeltaPanel";
import { INK, RED, PAPER, RGB } from "@/lib/theme/palette";

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
        const res = await fetch(
          `https://api.openf1.org/v1/drivers?session_key=${session.session_key}`,
        );
        const data = await res.json();
        const unique = Array.from(
          new Map(
            safeArray<Driver>(data).map((d) => [d.driver_number, d]),
          ).values(),
        ).sort((a, b) => a.driver_number - b.driver_number);
        setDrivers(unique);
        setSelectedDriver(null);
        setLaps([]);
        setStints([]);
        setPits([]);
        setCar(null);
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
          fetch(
            `https://api.openf1.org/v1/laps?session_key=${key}&driver_number=${dn}`,
          ).then((r) => r.json()),
          fetch(
            `https://api.openf1.org/v1/stints?session_key=${key}&driver_number=${dn}`,
          ).then((r) => r.json()),
          fetch(
            `https://api.openf1.org/v1/pit?session_key=${key}&driver_number=${dn}`,
          ).then((r) => r.json()),
          fetch(
            `https://api.openf1.org/v1/car_data?session_key=${key}&driver_number=${dn}&speed>=100`,
          ).then((r) => r.json()),
        ]);
        setLaps(
          lapsRes.status === "fulfilled"
            ? safeArray<LapData>(lapsRes.value)
            : [],
        );
        setStints(
          stintsRes.status === "fulfilled"
            ? safeArray<Stint>(stintsRes.value)
            : [],
        );
        setPits(
          pitsRes.status === "fulfilled"
            ? safeArray<PitStop>(pitsRes.value)
            : [],
        );
        const carData =
          carRes.status === "fulfilled"
            ? safeArray<CarTelemetry>(carRes.value)
            : [];
        setCar(carData.length > 0 ? carData[carData.length - 1] : null);
      } catch {
        /* silent */
      }
      setLoading(false);
    };
    load();
  }, [session, selectedDriver]);

  const selectedDriverObj =
    drivers.find((d) => d.driver_number === selectedDriver) ?? null;
  const validLaps = laps.filter(
    (l) => l.lap_duration && l.lap_duration > 0 && !l.is_pit_out_lap,
  );
  const fastestLap =
    validLaps.length > 0
      ? Math.min(...validLaps.map((l) => l.lap_duration!))
      : 0;

  const handleSessionSelect = (s: Session) => {
    setSession(s);
    setDrivers([]);
    setSelectedDriver(null);
    setLaps([]);
    setStints([]);
    setPits([]);
    setCar(null);
  };
  const handleClearSession = () => {
    setSession(null);
    setDrivers([]);
    setSelectedDriver(null);
    setLaps([]);
    setStints([]);
    setPits([]);
    setCar(null);
  };

  const showData = !loading && !!selectedDriver && laps.length > 0;
  const showEmpty =
    !loading && !!session && !!selectedDriver && laps.length === 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: INK,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Scan-line overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 50,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(${RGB.ink},0.25) 2px, rgba(${RGB.ink},0.25) 4px)`,
          backgroundSize: "100% 4px",
        }}
      />

      <LiveHero session={session} />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "3rem clamp(1rem,4vw,1.5rem)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Section label="01 · Session" delay={0}>
          <SessionSearch onSelect={handleSessionSelect} />
        </Section>

        {session && (
          <SessionBanner session={session} onClear={handleClearSession} />
        )}

        {session && drivers.length > 0 && (
          <Section label="02 · Driver" delay={0.05}>
            <DriverSelector
              drivers={drivers}
              selected={selectedDriver}
              onSelect={setSelectedDriver}
            />
          </Section>
        )}

        {loading && (
          <div
            style={{
              padding: "5rem 0",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Spinner />
          </div>
        )}

        {showData && (
          <Dashboard
            laps={laps}
            stints={stints}
            pits={pits}
            car={car}
            fastestLap={fastestLap}
            driver={selectedDriverObj}
          />
        )}

        {showEmpty && <EmptyState />}
        {!session && <PromptState />}
      </div>

      <Styles />
    </main>
  );
}

/** Hero banner. Warm heat-bloom glow, matching HeroSection's visual language. */
function LiveHero({ session }: { session: Session | null }) {
  const circuitShort = session
    ? session.circuit_short_name.split(" ")[0].toUpperCase()
    : "LIVE";

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: INK,
        minHeight: "clamp(280px, 35vw, 420px)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(${RGB.paper},0.04) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }}
      />

      {/* Speed lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {[
          { top: "20%", width: "40%", delay: "0s", opacity: 0.08 },
          { top: "38%", width: "55%", delay: "0.5s", opacity: 0.05 },
          { top: "55%", width: "30%", delay: "0.9s", opacity: 0.07 },
          { top: "72%", width: "45%", delay: "0.3s", opacity: 0.04 },
        ].map((l, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: l.top,
              left: "-5%",
              width: l.width,
              height: "1px",
              background: `linear-gradient(90deg, transparent 0%, rgba(${RGB.red},${l.opacity * 3}) 30%, rgba(${RGB.paper},${l.opacity}) 70%, transparent 100%)`,
              animation: `speedLine 3s linear ${l.delay} infinite`,
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-5%",
          width: "45%",
          height: "140%",
          background: `linear-gradient(105deg, transparent 45%, rgba(${RGB.red},0.04) 45%, rgba(${RGB.red},0.08) 55%, transparent 55%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "-30%",
          right: "-10%",
          width: "70%",
          height: "130%",
          background: `radial-gradient(ellipse at top right, rgba(${RGB.ember},0.14) 0%, rgba(${RGB.red},0.05) 40%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: "-2%",
          bottom: "-15%",
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(6rem,16vw,16rem)",
          color: "transparent",
          WebkitTextStroke: `1px rgba(${RGB.paper},0.03)`,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {circuitShort}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: `linear-gradient(90deg, ${RED} 0%, rgba(${RGB.red},0.4) 40%, transparent 70%)`,
          zIndex: 3,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "3px",
          height: "60%",
          background: `linear-gradient(180deg, ${RED} 0%, transparent 100%)`,
          zIndex: 3,
        }}
      />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
          padding: "clamp(2.5rem,5vw,4rem) clamp(1rem,4vw,1.5rem)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: `rgba(${RGB.paper},0.25)`,
            textDecoration: "none",
            marginBottom: "1.5rem",
            transition: "color 0.15s",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path
              d="M11 6H1M6 11L1 6l5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Home
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <div style={{ position: "relative", width: "6px", height: "6px" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: RED,
                animation: "heroPulse 2s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "-3px",
                borderRadius: "50%",
                background: `rgba(${RGB.red},0.3)`,
                animation: "heroPulseRing 2s ease-in-out infinite",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: RED,
            }}
          >
            {session
              ? `${session.circuit_short_name} · ${session.session_name}`
              : "Live Telemetry"}
          </span>
        </div>

        <h1
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "clamp(2.5rem, 8vw, 6rem)",
            lineHeight: 0.92,
            textTransform: "uppercase",
            color: PAPER,
            letterSpacing: "-0.025em",
            margin: "0 0 0.5rem",
          }}
        >
          Race <span style={{ color: RED }}>Data</span>
        </h1>

        <p
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.8rem",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: `rgba(${RGB.paper},0.25)`,
            margin: 0,
          }}
        >
          {session
            ? `${session.country_name} · ${session.year} · ${session.session_name}`
            : "Browse sessions · Driver telemetry · Lap analysis"}
        </p>
      </div>
    </section>
  );
}

function Section({
  label,
  delay,
  children,
}: {
  label: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: "2rem",
        animation: `slideUp 0.6s ${delay}s cubic-bezier(0.16,1,0.3,1) both`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ width: "16px", height: "2px", background: RED }} />
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: RED,
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function SessionBanner({
  session,
  onClear,
}: {
  session: Session;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        padding: "0.85rem 1.25rem",
        background: `rgba(${RGB.red},0.06)`,
        borderTop: `1px solid rgba(${RGB.paper},0.07)`,
        borderRight: `1px solid rgba(${RGB.paper},0.07)`,
        borderBottom: `1px solid rgba(${RGB.paper},0.07)`,
        borderLeft: `3px solid ${RED}`,
        animation: "slideUp 0.45s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: "0.8rem",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            color: PAPER,
            marginBottom: "2px",
          }}
        >
          {session.circuit_short_name} — {session.session_name}
        </div>
        <div
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.6rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: `rgba(${RGB.paper},0.3)`,
          }}
        >
          {session.country_name} ·{" "}
          {new Date(session.date_start).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>
      <button
        onClick={onClear}
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: `rgba(${RGB.paper},0.3)`,
          background: "transparent",
          border: `1px solid rgba(${RGB.paper},0.1)`,
          padding: "0.4rem 0.9rem",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            `rgba(${RGB.red},0.5)`;
          (e.currentTarget as HTMLButtonElement).style.color = RED;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            `rgba(${RGB.paper},0.1)`;
          (e.currentTarget as HTMLButtonElement).style.color =
            `rgba(${RGB.paper},0.3)`;
        }}
      >
        ⌫ Change Session
      </button>
    </div>
  );
}

function Dashboard({
  laps,
  stints,
  pits,
  car,
  fastestLap,
  driver,
}: {
  laps: LapData[];
  stints: Stint[];
  pits: PitStop[];
  car: CarTelemetry | null;
  fastestLap: number;
  driver: Driver | null;
}) {
  return (
    <div
      style={{
        animation: "slideUp 0.5s 0.05s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <div style={{ marginBottom: "2px" }}>
        <StatsSummary laps={laps} driver={driver} />
      </div>

      <div
        className="live-dashboard-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)",
          gap: "2px",
          marginBottom: "2px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <DataPanel label="Car Telemetry">
            <TelemetryPanel car={car} />
          </DataPanel>
          <DataPanel label="Tyre Strategy">
            <TyrePanel stints={stints} pits={pits} totalLaps={laps.length} />
          </DataPanel>
          <DataPanel label="Sector Deltas vs Personal Best">
            <SectorDeltaPanel laps={laps} />
          </DataPanel>
        </div>

        <DataPanel label="Lap Times">
          <LapTimesPanel laps={laps} fastestLap={fastestLap} />
        </DataPanel>
      </div>

      <DataPanel label="Lap Time Trend">
        <LapTrendChart laps={laps} fastestLap={fastestLap} />
      </DataPanel>
    </div>
  );
}

/** Shared card chrome: labeled header + padded content area. Every panel
    (TelemetryPanel, TyrePanel, LapTimesPanel, etc.) renders only its
    content — this is the single place that owns the border/label/dot. */
function DataPanel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: INK,
        border: `1px solid rgba(${RGB.paper},0.07)`,
        borderTop: `2px solid ${RED}`,
        marginBottom: 0,
      }}
    >
      <div
        style={{
          padding: "0.55rem 1.25rem",
          borderBottom: `1px solid rgba(${RGB.paper},0.06)`,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: `rgba(${RGB.paper},0.015)`,
        }}
      >
        <div
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: RED,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.52rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: `rgba(${RGB.paper},0.25)`,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ padding: "1.25rem" }}>{children}</div>
    </div>
  );
}

function PromptState() {
  return (
    <div
      style={{
        padding: "5rem 2rem",
        textAlign: "center",
        border: `1px solid rgba(${RGB.paper},0.06)`,
        background: `rgba(${RGB.paper},0.01)`,
        animation: "slideUp 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "2px",
          background: RED,
          margin: "0 auto 1.5rem",
        }}
      />
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: `rgba(${RGB.paper},0.25)`,
          marginBottom: "0.5rem",
        }}
      >
        Select a Session
      </div>
      <p
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.72rem",
          color: `rgba(${RGB.paper},0.12)`,
          margin: 0,
          letterSpacing: "0.04em",
        }}
      >
        Choose a year and race above to begin exploring telemetry data.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: "4rem 2rem",
        textAlign: "center",
        border: `1px solid rgba(${RGB.paper},0.06)`,
        background: `rgba(${RGB.paper},0.01)`,
      }}
    >
      <div
        style={{
          width: "32px",
          height: "2px",
          background: RED,
          margin: "0 auto 1.5rem",
        }}
      />
      <div
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: `rgba(${RGB.paper},0.25)`,
          marginBottom: "0.5rem",
        }}
      >
        No Data Found
      </div>
      <p
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.72rem",
          color: `rgba(${RGB.paper},0.12)`,
          margin: 0,
        }}
      >
        No lap data recorded for this driver in this session.
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: "32px",
          height: "32px",
          border: `2px solid rgba(${RGB.paper},0.06)`,
          borderTopColor: RED,
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
          margin: "0 auto 1rem",
        }}
      />
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.55rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: `rgba(${RGB.paper},0.2)`,
        }}
      >
        Loading Data...
      </div>
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes speedLine {
        0%   { transform: translateX(-10%); opacity: 0; }
        10%  { opacity: 1; }
        90%  { opacity: 1; }
        100% { transform: translateX(120vw); opacity: 0; }
      }
      @keyframes heroPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.85); opacity: 0.7; } }
      @keyframes heroPulseRing { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
      @media (max-width: 900px) { .live-dashboard-grid { grid-template-columns: 1fr !important; } }
    `}</style>
  );
}
