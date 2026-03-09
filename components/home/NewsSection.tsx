"use client";

const NewsSection = ({ news }: { news: any[] }) => {
  if (!news || news.length === 0) return null;

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-10 pb-8 border-b border-white/[0.06]">
        <div>
          <span className="label-overline block mb-3">Latest</span>
          <h2
            className="font-display font-black text-white"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: 0.95,
              textTransform: "uppercase",
            }}
          >
            F1 News
          </h2>
        </div>
      </div>

      {/* Featured article + list */}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-0" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Featured */}
        {news[0] && (
          <a
            href={news[0].link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group border-r border-white/[0.07] p-8 relative overflow-hidden"
            style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at top right, rgba(225,6,0,0.05) 0%, transparent 70%)" }}
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <span className="live-dot" />
                <span className="label-overline">{news[0].source}</span>
                <span className="data-readout ml-auto">{getRelativeTime(news[0].pubDate || news[0].date || "")}</span>
              </div>

              <h3
                className="font-display font-black text-white leading-tight mb-4 group-hover:text-white/90 transition-colors"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.75rem",
                  lineHeight: 1.05,
                  textTransform: "uppercase",
                }}
              >
                {news[0].title}
              </h3>

              <p className="text-white/40 text-sm leading-relaxed mb-8 line-clamp-4">
                {news[0].description}
              </p>

              <div
                className="flex items-center gap-2 text-white/30 group-hover:text-[#E10600] transition-colors"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                Read Article
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform duration-200 group-hover:translate-x-1">
                  <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </a>
        )}

        {/* Secondary articles list */}
        <div className="flex flex-col">
          {news.slice(1, 5).map((article, index) => (
            <a
              key={index}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block group px-6 py-5 border-b border-white/[0.07] last:border-b-0 relative overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ background: "rgba(225,6,0,0.03)" }}
              />
              <div className="relative flex items-start gap-4">
                <span
                  className="font-mono-f1 text-white/15 text-xs pt-1 min-w-[1.5rem]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  0{index + 2}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="label-overline text-[0.6rem]">{article.source}</span>
                    <span className="data-readout ml-auto text-[0.65rem]">{getRelativeTime(article.pubDate || article.date || "")}</span>
                  </div>
                  <h4
                    className="text-white/80 group-hover:text-white transition-colors leading-tight line-clamp-2"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", lineHeight: 1.2 }}
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
