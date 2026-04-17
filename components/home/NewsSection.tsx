/**
 * NewsSection — homepage F1 news feed.
 *
 * Layout:
 *   - Featured article (left half): large title, excerpt, read link
 *   - Secondary articles (right half): numbered list, 4 items
 *
 * Data source: Autosport RSS feed via news-fetcher.
 * Returns null if no articles are available.
 */
"use client";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/**
 * Returns a human-readable relative timestamp.
 * e.g. "Today", "Yesterday", "3d ago", "Apr 12"
 */
function getRelativeTime(dateString: string): string {
  if (!dateString) return "";
  const date     = new Date(dateString);
  const now      = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─────────────────────────────────────────────────────────────────────────── */

const NewsSection = ({ news }: { news: any[] }) => {
  /* Bail out gracefully if no articles */
  if (!news || news.length === 0) return null;

  const featured  = news[0];          /* First article — shown large on the left */
  const secondary = news.slice(1, 5); /* Articles 2–5 — compact list on the right */

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">

      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-10 pb-8 border-b border-white/[0.06]">
        <div>
          <span className="label-overline block mb-3">Latest</span>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
            fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.95,
            textTransform: "uppercase", color: "white",
          }}>
            F1 News
          </h2>
        </div>

        {/* External link to full news source — desktop only */}
        <a
          href="https://www.autosport.com/f1"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-back hidden md:flex"
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.30)"}
        >
          More News
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>

      {/* ── News grid ───────────────────────────────────────────────────── */}
      <div
        className="grid lg:grid-cols-[1fr_1fr]"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >

        {/* Featured article — left column */}
        {featured && (
          <a
            href={featured.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
            style={{ borderRight: "1px solid rgba(255,255,255,0.07)", textDecoration: "none" }}
          >
            <div className="relative overflow-hidden h-full p-8" style={{ background: "#0e0e0e" }}>

              {/* Hover radial glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{
                background: "radial-gradient(ellipse at top right, rgba(225,6,0,0.06) 0%, transparent 70%)",
              }} />

              {/* 40px red accent bar */}
              <div style={{ height: "2px", background: "#E10600", width: "40px", marginBottom: "1.5rem" }} />

              <div className="relative">
                {/* Source + timestamp row */}
                <div className="flex items-center gap-3 mb-5">
                  <span className="live-dot" />
                  <span style={{
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                    fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase",
                    color: "#E10600",
                  }}>
                    {featured.source}
                  </span>
                  <span className="data-readout ml-auto" style={{ fontSize: "0.65rem" }}>
                    {getRelativeTime(featured.pubDate || featured.date || "")}
                  </span>
                </div>

                {/* Article title */}
                <h3
                  className="group-hover:text-white/90 transition-colors"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
                    fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", lineHeight: 1.05,
                    textTransform: "uppercase", color: "white", marginBottom: "1rem",
                  }}
                >
                  {featured.title}
                </h3>

                {/* Article excerpt — 4-line clamp */}
                <p style={{
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 400, fontSize: "0.92rem",
                  lineHeight: 1.7, color: "rgba(255,255,255,0.38)",
                  marginBottom: "2rem",
                  display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {featured.description}
                </p>

                {/* Read link — arrow slides right on group hover */}
                <div
                  className="flex items-center gap-2 group-hover:text-[#E10600] transition-colors"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                    fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.28)",
                  }}
                >
                  Read Article
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform duration-200 group-hover:translate-x-1">
                    <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </a>
        )}

        {/* Secondary articles — right column list */}
        <div className="flex flex-col">
          {secondary.map((article, index) => (
            <a
              key={index}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
              style={{
                padding: "1.4rem 1.75rem",
                borderBottom: index < secondary.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                textDecoration: "none",
                position: "relative", overflow: "hidden",
                flex: 1,
              }}
            >
              {/* Subtle hover wash */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ background: "rgba(255,255,255,0.018)" }} />

              <div className="relative flex items-start gap-4">
                {/* Article index number */}
                <span className="data-readout" style={{ fontSize: "0.62rem", paddingTop: "3px", minWidth: "1.5rem" }}>
                  0{index + 2}
                </span>

                <div className="flex-1 min-w-0">
                  {/* Source + timestamp row */}
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{
                      fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                      fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase",
                      color: "#E10600",
                    }}>
                      {article.source}
                    </span>
                    <span className="data-readout ml-auto" style={{ fontSize: "0.6rem" }}>
                      {getRelativeTime(article.pubDate || article.date || "")}
                    </span>
                  </div>

                  {/* Article title — 2-line clamp */}
                  <h4
                    className="group-hover:text-white transition-colors"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                      fontSize: "1rem", lineHeight: 1.2, color: "rgba(255,255,255,0.75)",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}
                  >
                    {article.title}
                  </h4>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
