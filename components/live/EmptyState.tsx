export default function EmptyState() {
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="h-[2px]" style={{ background: "rgba(255,255,255,0.1)" }} />
      <div className="py-32 text-center px-6">
        <div
          className="mb-3"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: "1.25rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          No telemetry data available
        </div>
        <p className="data-readout">Start the demo to see simulated real-time telemetry</p>
      </div>
    </div>
  );
}
