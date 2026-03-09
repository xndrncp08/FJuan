interface SessionControlProps {
  isLive: boolean;
  onToggle: () => void;
}

export default function SessionControl({ isLive, onToggle }: SessionControlProps) {
  return (
    <div
      className="relative overflow-hidden mb-10"
      style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />
      <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="label-overline block mb-2">Session Status</span>
          <div className="flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: isLive ? "#E10600" : "rgba(255,255,255,0.2)",
                boxShadow: isLive ? "0 0 0 0 rgba(225,6,0,0.4)" : "none",
                animation: isLive ? "pulse-live 1.5s ease-in-out infinite" : "none",
              }}
            />
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: isLive ? "white" : "rgba(255,255,255,0.35)",
              }}
            >
              {isLive ? "Demo Telemetry Streaming" : "No Active Session"}
            </span>
          </div>
          {!isLive && (
            <p className="data-readout mt-2">Press Start Demo to begin simulated data stream</p>
          )}
        </div>

        <button
          onClick={onToggle}
          className={isLive ? "btn-ghost" : "btn-primary"}
        >
          {isLive ? "Stop Demo" : "Start Demo"}
        </button>
      </div>
    </div>
  );
}
