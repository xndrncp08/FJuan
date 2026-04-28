/**
 * DriverProfile — cinematic F1 broadcast driver statistics page.
 *
 * Full design system alignment with PredictionClient / PredictionHero:
 *   - Fixed layered background: dot-grid + diagonal slash (team-colour) + radial glow + speed lines + scan lines
 *   - Hero: ghost driver number watermark, team-colour accents, pulsing live dot, staggered slide-up
 *   - Headline stats: top-4 strip with border grid
 *   - Career Statistics: 12-stat grid, accent bar on championships
 *   - Career Info: biographic tiles
 *   - Season History: full table with dual bar vis (points + wins), position badges
 *   - Bottom nav: back + compare links
 */
import Link from "next/link";
import { getDriverStats } from "@/lib/api/fetchers";
import { getNationalityFlag, getTeamColor, formatPercentage } from "@/lib/utils/format";

interface Props { driverId: string; }

const TEAM_COLORS: Record<string, string> = {
  red_bull: "#3671C6", ferrari: "#E8002D", mercedes: "#27F4D2",
  mclaren: "#FF8000", aston_martin: "#229971", alpine: "#FF87BC",
  williams: "#64C4FF", rb: "#6692FF", kick_sauber: "#52E252", haas: "#B6BABD",
};

const KEYFRAMES = `
  @keyframes dpSlideUp {
    from { opacity: 0; transform: translateY(20px); }
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
  @keyframes dpPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.85); }
  }
  @keyframes dpPulseRing {
    0% { transform: scale(0.5); opacity: 0.8; }
    100% { transform: scale(2.5); opacity: 0; }
  }

  .dp-stat-cell { transition: background 0.15s ease; }
  .dp-stat-cell:hover { background: rgba(255,255,255,0.03) !important; }
  .dp-season-row { transition: all 0.15s ease; }
  .dp-season-row:hover { background: rgba(255,255,255,0.03) !important; border-left-color: rgba(225,6,0,0.5) !important; }
  .dp-nav-link { transition: color 0.15s ease; }
  .dp-nav-link:hover { color: rgba(255,255,255,0.65) !important; }

  @media (max-width: 600px) {
    .dp-hero-name { font-size: clamp(2.5rem,12vw,4rem) !important; }
    .dp-headline-strip { grid-template-columns: repeat(2,1fr) !important; }
    .dp-season-grid { grid-template-columns: 3.5rem 1fr 4rem 3rem 3rem 3rem 4rem !important; }
  }
`;

function SectionHeader({ overline, title, subtitle, delay = "0s" }: { overline: string; title?: string; subtitle?: string; delay?: string }) {
  return (
    <div style={{ marginBottom: "1.75rem", animation: `dpSlideUp 0.6s ${delay} cubic-bezier(0.16,1,0.3,1) both` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
        <div style={{ width: "16px", height: "2px", background: "#E10600", flexShrink: 0 }} />
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#E10600" }}>{overline}</span>
      </div>
      {title && <h2 style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(1.1rem,2.5vw,1.5rem)", textTransform: "uppercase", color: "white", letterSpacing: "-0.01em", margin: "0 0 0.2rem", lineHeight: 1 }}>{title}</h2>}
      {subtitle && <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", margin: 0, letterSpacing: "0.04em" }}>{subtitle}</p>}
    </div>
  );
}

export default async function DriverProfile({ driverId }: Props) {
  const stats = await getDriverStats(driverId);

  if (!stats) {
    return (
      <main style={{ minHeight: "100vh", background: "#060606", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{KEYFRAMES}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "16px", height: "2px", background: "#E10600", margin: "0 auto 1.5rem" }} />
          <p style={{ fontFamily: "'Russo One', sans-serif", fontSize: "1.5rem", textTransform: "uppercase", color: "rgba(255,255,255,0.15)", letterSpacing: "0.08em", margin: "0 0 1.5rem" }}>Driver Not Found</p>
          <Link href="/drivers" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#E10600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M11 6H1M6 11L1 6l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            All Drivers
          </Link>
        </div>
      </main>
    );
  }

  const { driver, seasonResults } = stats;
  const flag      = getNationalityFlag(driver.nationality);
  const teamColor = getTeamColor(stats.currentTeam?.name || "") || TEAM_COLORS[stats.currentTeam?.constructorId || ""] || "#E10600";
  const driverNum = driver.permanentNumber || driver.code || "00";

  const statBlocks = [
    { label: "Championships",  value: stats.totalChampionships,           accent: stats.totalChampionships > 0 },
    { label: "Race Wins",      value: stats.totalWins,                    accent: false },
    { label: "Podiums",        value: stats.totalPodiums,                 accent: false },
    { label: "Pole Positions", value: stats.totalPoles,                   accent: false },
    { label: "Fastest Laps",   value: stats.totalFastestLaps,             accent: false },
    { label: "Total Points",   value: stats.totalPoints,                  accent: false },
    { label: "Races",          value: stats.totalRaces,                   accent: false },
    { label: "Win Rate",       value: formatPercentage(stats.winRate),    accent: false },
    { label: "Avg Finish",     value: stats.avgFinishPosition,            accent: false },
    { label: "DNFs",           value: stats.dnfCount,                     accent: false },
    { label: "Pts / Race",     value: stats.pointsPerRace,                accent: false },
    { label: "Podium Rate",    value: formatPercentage(stats.podiumRate), accent: false },
  ];

  const infoItems = [
    { label: "Date of Birth",  value: driver.dateOfBirth ? new Date(driver.dateOfBirth).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "N/A" },
    { label: "Nationality",    value: `${flag} ${driver.nationality}` },
    { label: "Current Team",   value: stats.currentTeam?.name || "—" },
    { label: "Career Span",    value: `${stats.careerSpan.yearsActive} seasons` },
    { label: "Best Finish",    value: `P${stats.bestFinish}` },
    { label: "Worst Finish",   value: `P${stats.worstFinish}` },
  ];

  const maxWins = Math.max(...(seasonResults?.map(s => s.wins) || []), 1);
  const maxPts  = Math.max(...(seasonResults?.map(s => s.points) || []), 1);

  return (
    <main style={{ minHeight: "100vh", background: "#060606", position: "relative" }}>
      <style>{KEYFRAMES}</style>

      {/* ══ Fixed background layers ═══════════════════════════════════════ */}
      {/* Dot grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none", zIndex: 0 }} />
      {/* Diagonal slash — team-colour tinted */}
      <div style={{ position: "fixed", top: 0, right: 0, width: "55%", height: "100vh", background: `linear-gradient(105deg, transparent 48%, ${teamColor}10 48%, ${teamColor}1e 56%, transparent 56%)`, pointerEvents: "none", zIndex: 0 }} />
      {/* Radial glow — team colour */}
      <div style={{ position: "fixed", top: "-20%", right: "-10%", width: "65%", height: "80vh", background: `radial-gradient(ellipse at top right, ${teamColor}18 0%, ${teamColor}06 40%, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      {/* Speed lines */}
      {[
        { top: "14%", width: "40%", delay: "0s",   op: 0.055 },
        { top: "32%", width: "56%", delay: "0.5s", op: 0.038 },
        { top: "54%", width: "26%", delay: "1s",   op: 0.065 },
        { top: "70%", width: "46%", delay: "0.3s", op: 0.045 },
        { top: "86%", width: "32%", delay: "1.3s", op: 0.032 },
      ].map((l, i) => (
        <div key={i} style={{ position: "fixed", top: l.top, left: "-5%", width: l.width, height: "1px", background: `linear-gradient(90deg, transparent 0%, rgba(225,6,0,${l.op * 3}) 30%, rgba(255,255,255,${l.op}) 70%, transparent 100%)`, animation: `dpSpeedLine 4s linear ${l.delay} infinite`, pointerEvents: "none", zIndex: 0 }} />
      ))}
      {/* Scan lines */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.055) 2px, rgba(0,0,0,0.055) 4px)", pointerEvents: "none", zIndex: 0 }} />

      {/* ══ Content ═══════════════════════════════════════════════════════ */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.07)", minHeight: "clamp(340px,45vw,520px)", display: "flex", alignItems: "center" }}>

          {/* Ghost driver number */}
          <div style={{ position: "absolute", right: "-2%", bottom: "-15%", fontFamily: "'Russo One', sans-serif", fontSize: "clamp(10rem,22vw,22rem)", color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.032)", lineHeight: 1, pointerEvents: "none", userSelect: "none", animation: "dpFadeIn 1.2s ease forwards" }}>
            {driverNum}
          </div>

          <div style={{ position: "relative", zIndex: 2, maxWidth: "1280px", margin: "0 auto", width: "100%", padding: "clamp(2.5rem,5vw,4.5rem) clamp(1.25rem,4vw,1.5rem)" }}>

            {/* Back */}
            <div style={{ animation: "dpSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both" }}>
              <Link href="/drivers" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", textDecoration: "none", marginBottom: "1.75rem", transition: "color 0.15s ease" }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M11 6H1M6 11L1 6l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Standings
              </Link>
            </div>

            {/* Nationality + number + live dot */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", animation: "dpSlideUp 0.55s 0.05s cubic-bezier(0.16,1,0.3,1) both" }}>
              <div style={{ position: "relative", width: "6px", height: "6px" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: teamColor, animation: "dpPulse 2s ease-in-out infinite" }} />
                <div style={{ position: "absolute", inset: "-3px", borderRadius: "50%", background: `${teamColor}55`, animation: "dpPulseRing 2s ease-in-out infinite" }} />
              </div>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
                {flag} {driver.nationality}
              </span>
              <div style={{ width: "1px", height: "10px", background: "rgba(255,255,255,0.1)" }} />
              <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.7rem", color: teamColor, letterSpacing: "0.06em" }}>
                #{driverNum}
              </span>
            </div>

            {/* Driver name */}
            <h1 className="dp-hero-name" style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(2.8rem,8vw,5.5rem)", color: "white", lineHeight: 0.92, letterSpacing: "-0.025em", margin: "0 0 0.5rem", textTransform: "uppercase", animation: "dpSlideUp 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both" }}>
              {driver.givenName.toUpperCase()}<br />
              <span style={{ color: teamColor }}>{driver.familyName.toUpperCase()}</span>
            </h1>

            {/* Team */}
            {stats.currentTeam && (
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", color: teamColor, margin: "0 0 2rem", opacity: 0.85, animation: "dpSlideUp 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both" }}>
                {stats.currentTeam.name}
              </p>
            )}

            {/* Headline stats strip */}
            <div className="dp-headline-strip" style={{ display: "grid", gridTemplateColumns: "repeat(4,auto)", width: "fit-content", borderTop: "1px solid rgba(255,255,255,0.07)", borderLeft: "1px solid rgba(255,255,255,0.07)", animation: "dpSlideUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) both" }}>
              {statBlocks.slice(0, 4).map((s, i) => (
                <div key={i} style={{ padding: "1rem 1.75rem 0.85rem", borderRight: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", minWidth: "90px" }}>
                  <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(1.3rem,3vw,2rem)", color: s.accent ? "#E10600" : "white", lineHeight: 1, letterSpacing: "-0.02em" }}>{s.value}</div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginTop: "4px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom team-colour line */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${teamColor} 0%, ${teamColor}66 30%, rgba(225,6,0,0.3) 60%, transparent 80%)`, zIndex: 3 }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "60%", background: `linear-gradient(180deg, ${teamColor} 0%, transparent 100%)`, zIndex: 3 }} />
        </section>

        {/* ══ Body ══════════════════════════════════════════════════════════ */}
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(2rem,4vw,3.5rem) clamp(1.25rem,4vw,1.5rem)" }}>

          {/* ── Career Statistics ─────────────────────────────────────────── */}
          <section style={{ marginBottom: "3.5rem" }}>
            <SectionHeader overline="Performance Data" title="Career Statistics" subtitle="All-time cumulative figures across every season competed" delay="0.25s" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: "1px", background: "rgba(255,255,255,0.06)", animation: "dpSlideUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both" }}>
              {statBlocks.map((s, i) => (
                <div key={i} className="dp-stat-cell" style={{ background: "rgba(8,8,8,0.9)", backdropFilter: "blur(4px)", padding: "1.1rem 1.25rem", position: "relative", overflow: "hidden", cursor: "default" }}>
                  {s.accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "#E10600" }} />}
                  <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "clamp(1.3rem,3vw,1.7rem)", color: s.accent ? "#E10600" : "white", lineHeight: 1, letterSpacing: "-0.02em" }}>{s.value}</div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginTop: "4px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Career Info ───────────────────────────────────────────────── */}
          <section style={{ marginBottom: "3.5rem" }}>
            <SectionHeader overline="Driver Profile" title="Career Info" subtitle="Biographical details and career milestones" delay="0.35s" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "1px", background: "rgba(255,255,255,0.06)", animation: "dpSlideUp 0.6s 0.4s cubic-bezier(0.16,1,0.3,1) both" }}>
              {infoItems.map((item, i) => (
                <div key={i} style={{ background: "rgba(8,8,8,0.9)", backdropFilter: "blur(4px)", padding: "1.25rem" }}>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: "0.4rem" }}>{item.label}</div>
                  <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.88rem", color: "white", letterSpacing: "0.01em" }}>{item.value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Season History ────────────────────────────────────────────── */}
          {seasonResults && seasonResults.length > 0 && (
            <section style={{ marginBottom: "3.5rem" }}>
              <SectionHeader overline="Track Record" title="Season History" subtitle="Per-season breakdown — red bar = wins scaled to career best · grey bar = points" delay="0.45s" />
              <div style={{ border: "1px solid rgba(255,255,255,0.07)", overflowX: "auto", animation: "dpSlideUp 0.6s 0.5s cubic-bezier(0.16,1,0.3,1) both" }}>
                <div style={{ minWidth: "560px" }}>

                  {/* Header */}
                  <div className="dp-season-grid" style={{ display: "grid", gridTemplateColumns: "4rem 1fr 5.5rem 4.5rem 4rem 3.5rem 4.5rem", padding: "0.65rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(6,6,6,0.95)", gap: "0.75rem" }}>
                    {["Year", "Team", "Points", "Wins", "Pods", "Races", "Finish"].map(h => (
                      <div key={h} style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>{h}</div>
                    ))}
                  </div>

                  {/* Rows */}
                  {seasonResults.slice(0, 30).map((season, i) => {
                    const wBar = (season.wins   / maxWins) * 100;
                    const pBar = (season.points / maxPts)  * 100;
                    return (
                      <div key={season.season} className="dp-season-row dp-season-grid" style={{ display: "grid", gridTemplateColumns: "4rem 1fr 5.5rem 4.5rem 4rem 3.5rem 4.5rem", padding: "0.85rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", gap: "0.75rem", borderLeft: "2px solid transparent", background: i % 2 === 0 ? "rgba(255,255,255,0.008)" : "transparent", animation: `dpSlideUp 0.4s ${Math.min(i * 0.025, 0.6) + 0.5}s cubic-bezier(0.16,1,0.3,1) both` }}>

                        {/* Year */}
                        <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.88rem", color: "white", letterSpacing: "-0.01em" }}>{season.season}</div>

                        {/* Team */}
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.7rem", color: "rgba(255,255,255,0.38)", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{season.team}</div>

                        {/* Points + bar */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                            <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>{season.points}</span>
                          </div>
                          <div style={{ height: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pBar}%`, background: "rgba(255,255,255,0.22)" }} />
                          </div>
                        </div>

                        {/* Wins + bar */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                            <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.85rem", color: season.wins > 0 ? "#E10600" : "rgba(255,255,255,0.18)" }}>{season.wins}</span>
                          </div>
                          <div style={{ height: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            {season.wins > 0 && <div style={{ height: "100%", width: `${wBar}%`, background: "#E10600" }} />}
                          </div>
                        </div>

                        {/* Podiums */}
                        <div style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.85rem", color: season.podiums > 0 ? "rgba(255,215,0,0.65)" : "rgba(255,255,255,0.18)" }}>{season.podiums}</div>

                        {/* Races */}
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: "0.72rem", color: "rgba(255,255,255,0.25)" }}>{season.races}</div>

                        {/* Championship position badge */}
                        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.15rem 0.5rem", background: season.position === 1 ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${season.position === 1 ? "rgba(255,215,0,0.28)" : "rgba(255,255,255,0.07)"}` }}>
                          <span style={{ fontFamily: "'Russo One', sans-serif", fontSize: "0.6rem", color: season.position === 1 ? "#FFD700" : "rgba(255,255,255,0.28)", letterSpacing: "0.04em" }}>P{season.position ?? "—"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ── Bottom nav ────────────────────────────────────────────────── */}
          <div style={{ paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "2.5rem", flexWrap: "wrap", alignItems: "center", animation: "dpSlideUp 0.6s 0.65s cubic-bezier(0.16,1,0.3,1) both" }}>
            <Link href="/drivers" className="dp-nav-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M11 6H1M6 11L1 6l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              All Drivers
            </Link>
            <Link href="/compare" className="dp-nav-link" style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#E10600", textDecoration: "none" }}>
              Compare Drivers
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}