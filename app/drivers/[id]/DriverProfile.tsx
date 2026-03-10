import Link from "next/link";
import { getDriverStats } from "@/lib/api/fetchers";
import {
  getNationalityFlag,
  getTeamColor,
  formatPercentage,
} from "@/lib/utils/format";

interface Props {
  driverId: string;
}

export default async function DriverProfile({ driverId }: Props) {
  const stats = await getDriverStats(driverId);

  if (!stats) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#060606",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "2rem",
              color: "rgba(255,255,255,0.2)",
            }}
          >
            DRIVER NOT FOUND
          </p>
          <Link
            href="/drivers"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#E10600",
              textDecoration: "none",
              display: "block",
              marginTop: "1rem",
            }}
          >
            ← All Drivers
          </Link>
        </div>
      </main>
    );
  }

  const { driver, seasonResults } = stats;
  const flag = getNationalityFlag(driver.nationality);
  const teamColor = getTeamColor(stats.currentTeam?.name || "");

  const statBlocks = [
    {
      label: "Championships",
      value: stats.totalChampionships,
      accent: stats.totalChampionships > 0,
    },
    { label: "Race Wins", value: stats.totalWins, accent: false },
    { label: "Podiums", value: stats.totalPodiums, accent: false },
    { label: "Pole Positions", value: stats.totalPoles, accent: false },
    { label: "Fastest Laps", value: stats.totalFastestLaps, accent: false },
    { label: "Total Points", value: stats.totalPoints, accent: false },
    { label: "Races", value: stats.totalRaces, accent: false },
    {
      label: "Win Rate",
      value: formatPercentage(stats.winRate),
      accent: false,
    },
    { label: "Avg Finish", value: stats.avgFinishPosition, accent: false },
    { label: "DNFs", value: stats.dnfCount, accent: false },
    { label: "Pts / Race", value: stats.pointsPerRace, accent: false },
    {
      label: "Podium Rate",
      value: formatPercentage(stats.podiumRate),
      accent: false,
    },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#060606" }}>
      <section
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ height: "2px", background: teamColor || "#E10600" }} />
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            paddingRight: "2rem",
            pointerEvents: "none",
            userSelect: "none",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(8rem, 20vw, 18rem)",
              color: "rgba(255,255,255,0.02)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            {driver.permanentNumber || driver.code || "00"}
          </span>
        </div>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "clamp(1.5rem, 4vw, 3rem) 1.5rem",
          }}
        >
          <Link
            href="/drivers"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "1.5rem",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              textDecoration: "none",
            }}
          >
            ← Standings
          </Link>
          <div style={{ marginBottom: "0.5rem" }}>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: "0.72rem",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#E10600",
              }}
            >
              {flag} {driver.nationality} · #
              {driver.permanentNumber || driver.code || "—"}
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(2rem, 7vw, 5.5rem)",
              color: "white",
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              margin: "0 0 0.5rem",
            }}
          >
            {driver.givenName.toUpperCase()}
            <br />
            <span style={{ color: teamColor || "#E10600" }}>
              {driver.familyName.toUpperCase()}
            </span>
          </h1>
          {stats.currentTeam && (
            <p
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 500,
                fontSize: "1rem",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.08em",
                marginBottom: "1.5rem",
              }}
            >
              {stats.currentTeam.name}
            </p>
          )}
          {/* Hero stats — 2 cols on mobile, 4 on desktop */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              maxWidth: "fit-content",
            }}
            className="sm-4-cols"
          >
            {statBlocks.slice(0, 4).map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "1rem 1.5rem 0",
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
                    color: s.accent ? "#E10600" : "white",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.68rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginTop: "0.2rem",
                    paddingBottom: "0.75rem",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "clamp(1.5rem, 4vw, 3rem) 1.5rem",
        }}
      >
        {/* Career Statistics */}
        <div style={{ marginBottom: "3rem" }}>
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: "0.68rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              display: "block",
              marginBottom: "1rem",
            }}
          >
            Career Statistics
          </span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "1px",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {statBlocks.map((s, i) => (
              <div
                key={i}
                style={{ background: "#0d0d0d", padding: "1rem 1.25rem" }}
              >
                <div
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
                    color: s.accent ? "#E10600" : "white",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.65rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginTop: "0.3rem",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Career Info */}
        <div style={{ marginBottom: "3rem" }}>
          <span
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: "0.68rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              display: "block",
              marginBottom: "1rem",
            }}
          >
            Career Info
          </span>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            }}
          >
            {[
              {
                label: "Date of Birth",
                value: driver.dateOfBirth
                  ? new Date(driver.dateOfBirth).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A",
              },
              { label: "Nationality", value: `${flag} ${driver.nationality}` },
              { label: "Current Team", value: stats.currentTeam?.name || "—" },
              {
                label: "Career Span",
                value: `${stats.careerSpan.yearsActive} seasons`,
              },
              { label: "Best Finish", value: `P${stats.bestFinish}` },
              { label: "Worst Finish", value: `P${stats.worstFinish}` },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "1.25rem",
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.62rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                    marginBottom: "0.3rem",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "0.88rem",
                    color: "white",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Season History */}
        {seasonResults && seasonResults.length > 0 && (
          <div>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                fontSize: "0.68rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                display: "block",
                marginBottom: "1rem",
              }}
            >
              Season History
            </span>
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                overflowX: "auto",
              }}
            >
              <div style={{ minWidth: "420px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "4.5rem 1fr 4rem 4rem 4.5rem 5.5rem",
                    padding: "0.6rem 1rem",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    background: "#0d0d0d",
                  }}
                >
                  {["Year", "Team", "Wins", "Pods", "Races", "Points"].map(
                    (h) => (
                      <div
                        key={h}
                        style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 600,
                          fontSize: "0.62rem",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.2)",
                        }}
                      >
                        {h}
                      </div>
                    ),
                  )}
                </div>
                {seasonResults.slice(0, 30).map((season) => (
                  <div
                    key={season.season}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "4.5rem 1fr 4rem 4rem 4.5rem 5.5rem",
                      padding: "0.7rem 1rem",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "0.9rem",
                        color: "white",
                      }}
                    >
                      {season.season}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.78rem",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {season.team}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "0.9rem",
                        color:
                          season.wins > 0 ? "#E10600" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {season.wins}
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.78rem",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {season.podiums}
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.78rem",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {season.races}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Russo One', sans-serif",
                        fontSize: "0.9rem",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      {season.points}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "3rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/drivers"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              textDecoration: "none",
            }}
          >
            ← All Drivers
          </Link>
          <Link
            href="/compare"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#E10600",
              textDecoration: "none",
            }}
          >
            Compare Drivers →
          </Link>
        </div>
      </div>
    </main>
  );
}
