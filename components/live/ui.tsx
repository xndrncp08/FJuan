export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
      fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase",
      color: "rgba(255,255,255,0.25)", marginBottom: "1rem",
    }}>
      {children}
    </div>
  );
}

export function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#0e0e0e",
      border: "1px solid rgba(255,255,255,0.07)",
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "#E10600" }} />
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
      <div style={{
        width: "32px", height: "32px",
        border: "2px solid #E10600", borderTopColor: "transparent",
        borderRadius: "50%", animation: "spin-ring 0.8s linear infinite",
        marginBottom: "1rem",
      }} />
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
        LOADING TELEMETRY...
      </div>
    </div>
  );
}
