/**
 * components/home/NewsSection.tsx
 *
 * Editorial news grid: one featured story plus four secondary links.
 * Sits below LastRaceSection and shares the same SECTION_BACKGROUND
 * gradient (lib/theme/palette.ts), so the two sections read as one
 * continuous surface with no visible seam or divider between them.
 */
"use client";

import { motion } from "framer-motion";
import { RED, PAPER, RGB, SECTION_BACKGROUND } from "../../lib/theme/palette";

/** Formats an ISO date as "Today", "Yesterday", "Nd ago", or "Mon D". */
function getRelativeTime(dateString: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const NewsSection = ({ news }: { news: any[] }) => {
  if (!news || news.length === 0) return null;

  const featured = news[0];
  const secondary = news.slice(1, 5);

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "clamp(5rem, 10vw, 9rem) 0",
        background: SECTION_BACKGROUND,
      }}
    >
      {/* Ambient glow, continuing the warm-red atmosphere from the section
          above. */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          right: "-10%",
          width: "55%",
          height: "70%",
          background: `radial-gradient(circle, rgba(${RGB.red},0.1) 0%, rgba(${RGB.red},0.025) 40%, transparent 72%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.25,
          pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(${RGB.paper},0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(${RGB.paper},0.025) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          maskImage:
            "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
        }}
      />

      {/* Oversized outlined "NEWS" watermark, purely decorative. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-3%",
          bottom: "-5%",
          fontFamily: "'Russo One', sans-serif",
          fontSize: "clamp(8rem, 22vw, 22rem)",
          lineHeight: 0.7,
          color: "transparent",
          WebkitTextStroke: `1px rgba(${RGB.paper},0.025)`,
          letterSpacing: "-0.08em",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        NEWS
      </div>

      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 clamp(1.25rem, 4vw, 2rem)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header: eyebrow, title, description, "More News" link. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65 }}
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "2rem",
            marginBottom: "3rem",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                marginBottom: "1rem",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: RED,
                  boxShadow: `0 0 14px rgba(${RGB.red},0.65)`,
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.46rem",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: RED,
                }}
              >
                Intelligence Feed
              </span>
            </div>

            <h2
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
                lineHeight: 0.86,
                letterSpacing: "-0.05em",
                textTransform: "uppercase",
                color: PAPER,
                margin: 0,
              }}
            >
              F1 News
            </h2>

            <p
              style={{
                margin: "1rem 0 0",
                maxWidth: "460px",
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: `rgba(${RGB.paper},0.38)`,
              }}
            >
              The latest stories, paddock updates, and developments from around
              the Formula 1 world.
            </p>
          </div>

          <a
            href="https://www.autosport.com/f1"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              padding: "0.7rem 1rem",
              background: `rgba(${RGB.paper},0.045)`,
              border: `1px solid rgba(${RGB.paper},0.09)`,
              color: `rgba(${RGB.paper},0.5)`,
              textDecoration: "none",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "0.68rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = `rgba(${RGB.red},0.1)`;
              el.style.borderColor = `rgba(${RGB.red},0.4)`;
              el.style.color = PAPER;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = `rgba(${RGB.paper},0.045)`;
              el.style.borderColor = `rgba(${RGB.paper},0.09)`;
              el.style.color = `rgba(${RGB.paper},0.5)`;
            }}
          >
            More News
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path
                d="M1 6h10M6 1l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </motion.div>

        {/* Featured story (left) + four secondary links (right). */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
            gap: "1rem",
          }}
          className="news-layout"
        >
          {featured && (
            <motion.a
              href={featured.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7 }}
              whileHover={{ y: -5 }}
              style={{
                position: "relative",
                minHeight: "500px",
                padding: "clamp(1.5rem, 4vw, 2.5rem)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                overflow: "hidden",
                background: `linear-gradient(145deg, rgba(${RGB.paper},0.075), rgba(${RGB.paper},0.025) 60%, rgba(${RGB.red},0.045))`,
                border: `1px solid rgba(${RGB.paper},0.09)`,
                textDecoration: "none",
                boxShadow: `0 30px 90px rgba(${RGB.ink},0.4)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: "-20%",
                  top: "-25%",
                  width: "75%",
                  height: "75%",
                  background: `radial-gradient(circle, rgba(${RGB.red},0.16), transparent 68%)`,
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: "-5%",
                  top: "30%",
                  width: "55%",
                  height: "1px",
                  background: `linear-gradient(90deg, transparent, rgba(${RGB.red},0.3), transparent)`,
                  transform: "rotate(-22deg)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    marginBottom: "4rem",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: RED,
                      boxShadow: `0 0 12px rgba(${RGB.red},0.7)`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.44rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: RED,
                    }}
                  >
                    {featured.source}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "0.42rem",
                      color: `rgba(${RGB.paper},0.28)`,
                    }}
                  >
                    {getRelativeTime(featured.pubDate || featured.date || "")}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "clamp(1.9rem, 4vw, 3.3rem)",
                    lineHeight: 0.96,
                    letterSpacing: "-0.035em",
                    textTransform: "uppercase",
                    color: PAPER,
                    margin: 0,
                    maxWidth: "720px",
                  }}
                >
                  {featured.title}
                </h3>
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <p
                  style={{
                    maxWidth: "620px",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.95rem",
                    lineHeight: 1.65,
                    color: `rgba(${RGB.paper},0.42)`,
                    margin: "2rem 0",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {featured.description}
                </p>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "9px",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: `rgba(${RGB.paper},0.65)`,
                  }}
                >
                  Read Article
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "25px",
                      height: "25px",
                      background: RED,
                      color: PAPER,
                    }}
                  >
                    →
                  </span>
                </div>
              </div>
            </motion.a>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {secondary.map((article, index) => (
              <motion.a
                key={index}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                whileHover={{ x: 5 }}
                style={{
                  position: "relative",
                  flex: 1,
                  minHeight: "115px",
                  padding: "1.25rem 1.4rem",
                  display: "flex",
                  gap: "1rem",
                  overflow: "hidden",
                  background: `linear-gradient(120deg, rgba(${RGB.paper},0.055), rgba(${RGB.paper},0.018))`,
                  border: `1px solid rgba(${RGB.paper},0.075)`,
                  textDecoration: "none",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(120deg, rgba(${RGB.red},0.08), rgba(${RGB.paper},0.025))`;
                  e.currentTarget.style.borderColor = `rgba(${RGB.red},0.25)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(120deg, rgba(${RGB.paper},0.055), rgba(${RGB.paper},0.018))`;
                  e.currentTarget.style.borderColor = `rgba(${RGB.paper},0.075)`;
                }}
              >
                <span
                  style={{
                    fontFamily: "'Russo One', sans-serif",
                    fontSize: "1.5rem",
                    lineHeight: 1,
                    color: `rgba(${RGB.paper},0.12)`,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {String(index + 2).padStart(2, "0")}
                </span>

                <div
                  style={{
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "0.7rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.4rem",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: RED,
                      }}
                    >
                      {article.source}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.4rem",
                        color: `rgba(${RGB.paper},0.24)`,
                      }}
                    >
                      {getRelativeTime(article.pubDate || article.date || "")}
                    </span>
                  </div>

                  <h4
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 800,
                      fontSize: "1.05rem",
                      lineHeight: 1.12,
                      textTransform: "uppercase",
                      color: `rgba(${RGB.paper},0.76)`,
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {article.title}
                  </h4>
                </div>

                <span
                  style={{
                    position: "absolute",
                    right: "1rem",
                    bottom: "0.8rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.55rem",
                    color: `rgba(${RGB.red},0.6)`,
                  }}
                >
                  ↗
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 850px) {
          .news-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .news-layout {
            gap: 0.75rem !important;
          }
        }
      `}</style>
    </section>
  );
};

export default NewsSection;
