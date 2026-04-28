/**
 * DriversPage — Championship Standings page with season selector.
 *
 * Cinematic F1 broadcast aesthetic matching PredictionClient design system:
 *   - Rich fixed background: dot-grid + diagonal slashes + radial glow + scan lines + speed lines
 *   - Season selector panel with red accent bar
 *   - Top 3: podium cards with gold/silver/bronze accents, points bars, team colour dots
 *   - Full standings: compact rows with inline points bar visualisation
 *   - Staggered entrance animations throughout
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDriverStandings } from "@/lib/hooks/useDrivers";

const currentYear = new Date().getFullYear();
const SEASONS = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i);

const PODIUM = [
  { bar: "#C9A84C", glow: "rgba(201,168,76,0.12)",  border: "rgba(201,168,76,0.25)", text: "#C9A84C",  label: "LEADER" },
  { bar: "#9BA5B2", glow: "rgba(155,165,178,0.08)", border: "rgba(155,165,178,0.2)",  text: "#9BA5B2",  label: "2ND"    },
  { bar: "#A0674A", glow: "rgba(160,103,74,0.12)",  border: "rgba(160,103,74,0.25)", text: "#A0674A",  label: "3RD"    },
];

const QUICK_YEARS = [2025, 2024, 2023, 2022, 2021];

const TEAM_COLORS: Record<string, string> = {
  "Red Bull": "#3671C6", "Ferrari": "#E8002D", "Mercedes": "#27F4D2",
  "McLaren": "#FF8000", "Aston Martin": "#229971", "Alpine": "#FF87BC",
  "Williams": "#64C4FF", "RB": "#6692FF", "Kick Sauber": "#52E252", "Haas": "#B6BABD",
};

const KEYFRAMES = `
  @keyframes dpSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dpFadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes dpSpeedLine {
    0%   { transform: translateX(-10%); opacity: 0; }
    10%  { opacity: 1; } 90% { opacity: 1; }
    100% { transform: translateX(130vw); opacity: 0; }
  }
  @keyframes dpSpin { to { transform: rotate(360deg); } }
  @keyframes dpPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.85); }
  }
  @keyframes dpPulseRing {
    0% { transform: scale(0.5); opacity: 0.8; }
    100% { transform: scale(2.5); opacity: 0; }
  }

  .dp-btn-ghost {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.35);
    font-family: 'Rajdhani', sans-serif; font-weight: 700;
    font-size: 0.65rem; letter-spacing: 0.16em; text-transform: uppercase;
    padding: 0.5rem 1.1rem; cursor: pointer; transition: all 0.15s ease;
  }
  .dp-btn-ghost:hover {
    border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.03);
  }
  .dp-btn-active {
    background: #E10600; border: 1px solid #E10600; color: white;
    font-family: 'Rajdhani', sans-serif; font-weight: 700;
    font-size: 0.65rem; letter-spacing: 0.16em; text-transform: uppercase;
    padding: 0.5rem 1.1rem; cursor: pointer;
  }
  .dp-row:hover {
    background: rgba(255,255,255,0.03) !important;
    border-left-color: rgba(225,6,0,0.5) !important;
  }
  .dp-row:hover .dp-arrow { color: rgba(255,255,255,0.4) !important; }
  .dp-podium:hover { transform: translateY(-2px); }
  .dp-podium { transition: transform 0.2s ease; }
  .dp-podium:hover .dp-phover { opacity: 1 !important; }
`;

async function fetchSeasonStandings(season: string) {
  try {
    const res  = await fetch(`https://api.jolpi.ca/ergast/f1/${season}/driverStandings.json`, { cache: "force-cache" });
    const data = await res.json();
    return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
  } catch { return []; }
}

function SectionHeader({ overline, title, subtitle }: { overline: string; title?: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
        <div style={{ width: "16px", height: "2px", background: "#E10600", flexShrink: 0 }} />
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#E10600" }}>
          {overline}
        </span>
      </div>
      {title && <h2 style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(1.1rem,2.5vw,1.5rem)", textTransform: "uppercase", color: "white", letterSpacing: "-0.01em", margin: "0 0 0.2rem", lineHeight: 1 }}>{title}</h2>}
      {subtitle && <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", margin: 0, letterSpacing: "0.04em" }}>{subtitle}</p>}
    </div>
  );
}

export default function DriversPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const [seasonDrivers,  setSeasonDrivers]  = useState<any[]>([]);
  const [seasonLoading,  setSeasonLoading]  = useState(false);
  const [displaySeason,  setDisplaySeason]  = useState(currentYear.toString());
  const { data: drivers, isLoading } = useDriverStandings();

  useEffect(() => {
    const load = async () => {
      if (selectedSeason === "current") {
        setSeasonDrivers(drivers || []); setDisplaySeason(currentYear.toString()); setSeasonLoading(false);
      } else {
        setSeasonLoading(true);
        setSeasonDrivers(await fetchSeasonStandings(selectedSeason));
        setDisplaySeason(selectedSeason); setSeasonLoading(false);
      }
    };
    load();
  }, [selectedSeason, drivers]);

  const isDataLoading = (selectedSeason === "current" && isLoading) || seasonLoading;
  const maxPoints = Math.max(...seasonDrivers.map(d => parseFloat(d.points) || 0), 1);

  return (
    <main style={{ minHeight: "100vh", background: "#060606", position: "relative" }}>
      <style>{KEYFRAMES}</style>

      {/* ══ Fixed background layers ═══════════════════════════════════════ */}
      {/* Dot grid */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      {/* Diagonal slash */}
      <div style={{ position: "fixed", top: 0, right: 0, width: "55%", height: "100vh", background: "linear-gradient(105deg, transparent 48%, rgba(225,6,0,0.022) 48%, rgba(225,6,0,0.04) 56%, transparent 56%)", pointerEvents: "none", zIndex: 0 }} />
      {/* Radial glow top-right */}
      <div style={{ position: "fixed", top: "-20%", right: "-10%", width: "65%", height: "80vh", background: "radial-gradient(ellipse at top right, rgba(225,6,0,0.065) 0%, rgba(225,6,0,0.018) 40%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      {/* Speed lines */}
      {[
        { top: "12%", width: "38%", delay: "0s",   op: 0.055 },
        { top: "30%", width: "58%", delay: "0.5s", op: 0.038 },
        { top: "52%", width: "28%", delay: "1s",   op: 0.065 },
        { top: "68%", width: "48%", delay: "0.3s", op: 0.045 },
        { top: "84%", width: "34%", delay: "1.3s", op: 0.035 },
      ].map((l, i) => (
        <div key={i} style={{ position: "fixed", top: l.top, left: "-5%", width: l.width, height: "1px", background: `linear-gradient(90deg, transparent 0%, rgba(225,6,0,${l.op * 3}) 30%, rgba(255,255,255,${l.op}) 70%, transparent 100%)`, animation: `dpSpeedLine 4s linear ${l.delay} infinite`, pointerEvents: "none", zIndex: 0 }} />
      ))}
      {/* Scan lines */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.055) 2px, rgba(0,0,0,0.055) 4px)", pointerEvents: "none", zIndex: 0 }} />

      {/* ══ Page content ══════════════════════════════════════════════════ */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "clamp(3rem,6vw,5rem) clamp(1.25rem,4vw,1.5rem)" }}>
          {/* Ghost watermark */}
          <div style={{ position: "absolute", right: "-1%", bottom: "-20%", fontFamily: "'Russo One', sans-serif", fontSize: "clamp(10rem,22vw,20rem)", color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.028)", lineHeight: 1, pointerEvents: "none", userSelect: "none", animation: "dpFadeIn 1.2s ease forwards" }}>
            F1
          </div>

          <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative" }}>
            {/* Back */}
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", textDecoration: "none", marginBottom: "1.75rem", transition: "color 0.15s ease" }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M11 6H1M6 11L1 6l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Home
            </Link>

            {/* Live dot + overline */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", animation: "dpSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both" }}>
              <div style={{ position: "relative", width: "6px", height: "6px" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#E10600", animation: "dpPulse 2s ease-in-out infinite" }} />
                <div style={{ position: "absolute", inset: "-3px", borderRadius: "50%", background: "rgba(225,6,0,0.3)", animation: "dpPulseRing 2s ease-in-out infinite" }} />
              </div>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#E10600" }}>Championship</span>
            </div>

            <h1 style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(3rem,9vw,6.5rem)", lineHeight: 0.92, textTransform: "uppercase", color: "white", letterSpacing: "-0.025em", margin: "0 0 0.6rem", animation: "dpSlideUp 0.6s 0.08s cubic-bezier(0.16,1,0.3,1) both" }}>
              Driver <span style={{ color: "#E10600" }}>Standings</span>
            </h1>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 500, fontSize: "clamp(0.8rem,1.8vw,1rem)", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, animation: "dpSlideUp 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both" }}>
              {displaySeason} Season · Drivers' Championship
            </p>
          </div>

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #E10600 0%, rgba(225,6,0,0.4) 35%, transparent 65%)" }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "60%", background: "linear-gradient(180deg, #E10600 0%, transparent 100%)" }} />
        </section>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2.5rem clamp(1.25rem,4vw,1.5rem)" }}>

          {/* ── Season Selector ──────────────────────────────────────────── */}
          <div style={{ position: "relative", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(8,8,8,0.85)", backdropFilter: "blur(8px)", marginBottom: "2.5rem", animation: "dpSlideUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both" }}>
            <div style={{ height: "2px", background: "#E10600" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <SectionHeader overline="Select Season" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                <button onClick={() => setSelectedSeason("current")} className={selectedSeason === "current" ? "dp-btn-active" : "dp-btn-ghost"}>Current</button>
                {QUICK_YEARS.map(year => (
                  <button key={year} onClick={() => setSelectedSeason(year.toString())} className={selectedSeason === year.toString() ? "dp-btn-active" : "dp-btn-ghost"}>{year}</button>
                ))}
                <select
                  value={selectedSeason === "current" || QUICK_YEARS.includes(Number(selectedSeason)) ? "" : selectedSeason}
                  onChange={e => e.target.value && setSelectedSeason(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.5rem 1rem", cursor: "pointer", outline: "none" }}
                >
                  <option value="">More years...</option>
                  {SEASONS.map(year => <option key={year} value={year.toString()} style={{ background: "#141414" }}>{year}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Loading ──────────────────────────────────────────────────── */}
          {isDataLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "5rem 0" }}>
              <div style={{ width: "28px", height: "28px", border: "2px solid rgba(255,255,255,0.07)", borderTopColor: "#E10600", borderRadius: "50%", animation: "dpSpin 0.75s linear infinite" }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Loading standings...</span>
            </div>

          ) : seasonDrivers.length === 0 ? (
            <div style={{ padding: "5rem 2rem", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
              <div style={{ width: "16px", height: "2px", background: "#E10600", margin: "0 auto 1.5rem" }} />
              <p style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.15)" }}>No data for {displaySeason}</p>
            </div>

          ) : (
            <>
              {/* ── Podium ───────────────────────────────────────────────── */}
              {seasonDrivers.length >= 3 && (
                <section style={{ marginBottom: "3rem" }}>
                  <SectionHeader overline="Podium Positions" title="Championship Leaders" subtitle="Top 3 drivers in this season's standings" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "2px" }}>
                    {seasonDrivers.slice(0, 3).map((standing, index) => {
                      const driver = standing.Driver;
                      const team   = standing.Constructors[0]?.name || "Unknown";
                      const col    = PODIUM[index];
                      const tc     = TEAM_COLORS[team] || "rgba(255,255,255,0.3)";
                      const pBar   = (parseFloat(standing.points) / maxPoints) * 100;
                      return (
                        <Link key={driver.driverId} href={`/drivers/${driver.driverId}`} style={{ textDecoration: "none" }}>
                          <div className="dp-podium" style={{ position: "relative", overflow: "hidden", background: "rgba(10,10,10,0.92)", border: `1px solid ${col.border}`, borderTop: `3px solid ${col.bar}`, animation: `dpSlideUp 0.6s ${0.1 * index + 0.3}s cubic-bezier(0.16,1,0.3,1) both` }}>
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100px", background: `linear-gradient(180deg, ${col.glow} 0%, transparent 100%)`, pointerEvents: "none" }} />
                            <div className="dp-phover" style={{ position: "absolute", inset: 0, opacity: 0, background: col.glow, transition: "opacity 0.3s ease", pointerEvents: "none" }} />
                            <div style={{ position: "absolute", right: "-4%", bottom: "-8%", fontFamily: "'Russo One', sans-serif", fontSize: "clamp(6rem,12vw,9rem)", color: "transparent", WebkitTextStroke: `1px ${col.bar}18`, lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>{standing.position}</div>

                            <div style={{ padding: "1.75rem", position: "relative" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", padding: "0.2rem 0.6rem", marginBottom: "1.25rem", background: `${col.bar}18`, border: `1px solid ${col.bar}44` }}>
                                <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.6rem", color: col.text, letterSpacing: "0.1em" }}>P{standing.position} · {col.label}</span>
                              </div>

                              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.9rem", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", lineHeight: 1 }}>{driver.givenName}</div>
                              <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(1.6rem,4vw,2.2rem)", textTransform: "uppercase", color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>{driver.familyName}</div>

                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: tc }} />
                                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: tc }}>{team}</span>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "rgba(255,255,255,0.06)" }}>
                                {[{ val: standing.points, lab: "Points", bar: pBar, barColor: col.bar }, { val: standing.wins, lab: "Wins", bar: 0, barColor: "transparent" }].map((s, si) => (
                                  <div key={si} style={{ background: "#0d0d0d", padding: "0.75rem 1rem" }}>
                                    <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.5rem", color: si === 0 ? col.text : "white", lineHeight: 1 }}>{s.val}</div>
                                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginTop: "3px" }}>{s.lab}</div>
                                    <div style={{ height: "2px", background: "rgba(255,255,255,0.06)", marginTop: "6px", overflow: "hidden" }}>
                                      {si === 0 && <div style={{ height: "100%", width: `${s.bar}%`, background: s.barColor }} />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── Full standings ────────────────────────────────────────── */}
              <section>
                <SectionHeader overline="Full Classification" title="All Drivers" subtitle="Points bar scaled to championship leader · red = points-scoring positions" />

                {/* Header row */}
                <div style={{ display: "grid", gridTemplateColumns: "3rem 0.9rem 1fr 1fr 7rem 3.5rem 1.25rem", gap: "0.75rem", padding: "0.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(6,6,6,0.95)", backdropFilter: "blur(4px)" }}>
                  {["Pos", "", "Driver", "Team", "Points", "Wins", ""].map((h, i) => (
                    <div key={i} style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>{h}</div>
                  ))}
                </div>

                <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderTop: "none" }}>
                  {(seasonDrivers.length > 3 ? seasonDrivers.slice(3) : seasonDrivers).map((standing, i) => {
                    const driver   = standing.Driver;
                    const team     = standing.Constructors[0]?.name || "Unknown";
                    const tc       = TEAM_COLORS[team] || "rgba(255,255,255,0.25)";
                    const pBar     = (parseFloat(standing.points) / maxPoints) * 100;
                    const isTop10  = parseInt(standing.position) <= 10;
                    return (
                      <Link key={driver.driverId} href={`/drivers/${driver.driverId}`} style={{ textDecoration: "none", display: "block" }}>
                        <div className="dp-row" style={{ display: "grid", gridTemplateColumns: "3rem 0.9rem 1fr 1fr 7rem 3.5rem 1.25rem", gap: "0.75rem", padding: "0.85rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", borderLeft: "2px solid transparent", transition: "all 0.15s ease", background: i % 2 === 0 ? "rgba(255,255,255,0.008)" : "transparent", animation: `dpSlideUp 0.4s ${Math.min(i * 0.022, 0.55) + 0.5}s cubic-bezier(0.16,1,0.3,1) both` }}>

                          {/* Position */}
                          <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.15rem", color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>{standing.position}</div>

                          {/* Team dot */}
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: tc, flexShrink: 0 }} />

                          {/* Driver */}
                          <div>
                            <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.88rem", textTransform: "uppercase", color: "white", letterSpacing: "-0.01em" }}>
                              {driver.givenName} {driver.familyName}
                            </span>
                            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.58rem", color: "rgba(255,255,255,0.22)", letterSpacing: "0.06em", marginLeft: "0.45rem" }}>
                              #{driver.permanentNumber || "—"}
                            </span>
                          </div>

                          {/* Team */}
                          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.63rem", letterSpacing: "0.08em", textTransform: "uppercase", color: tc, opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{team}</div>

                          {/* Points + bar */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                              <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1rem", color: isTop10 ? "#E10600" : "rgba(255,255,255,0.45)", lineHeight: 1 }}>{standing.points}</span>
                              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.45rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>PTS</span>
                            </div>
                            <div style={{ height: "2px", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pBar}%`, background: isTop10 ? "linear-gradient(90deg,#E10600,rgba(225,6,0,0.55))" : "rgba(255,255,255,0.12)" }} />
                            </div>
                          </div>

                          {/* Wins */}
                          <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1rem", color: parseInt(standing.wins) > 0 ? "white" : "rgba(255,255,255,0.15)", textAlign: "center" }}>
                            {standing.wins}
                            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.45rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>Wins</div>
                          </div>

                          {/* Arrow */}
                          <div className="dp-arrow" style={{ color: "rgba(255,255,255,0.1)", transition: "color 0.15s ease" }}>
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}