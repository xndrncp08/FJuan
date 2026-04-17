export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-white/30 text-[0.65rem] uppercase tracking-[0.2em] font-semibold mb-3 md:mb-4">
      {children}
    </div>
  );
}

export function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="relative bg-[#0e0e0e] border border-white/10 overflow-hidden"
      style={style}
    >
      {/* Red top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-f1-red" />
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-f1-red border-t-transparent rounded-full animate-spin mb-3" />
      <div className="font-mono text-[0.65rem] text-white/30 tracking-wide">
        LOADING TELEMETRY...
      </div>
    </div>
  );
}