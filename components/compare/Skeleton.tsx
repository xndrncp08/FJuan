interface SkeletonProps {
  h?: number;
}

export function Skeleton({ h = 120 }: SkeletonProps) {
  return (
    <div style={{
      height: h,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.05)",
      animation: "comparePulse 1.6s ease-in-out infinite",
    }} />
  );
}