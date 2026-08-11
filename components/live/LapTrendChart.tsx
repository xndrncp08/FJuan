/**
 * components/live/LapTrendChart.tsx
 *
 * Lap-time-over-race line chart with a personal-best reference line.
 * Recolored to the shared brand palette (RED for the trace/reference line);
 * the tooltip and grid use the same off-white/ink neutrals as the rest of
 * the live dashboard.
 */
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { LapData, formatLapTime } from "./types";
import { INK, RED, RGB } from "@/lib/theme/palette";

interface Props {
  laps: LapData[];
  fastestLap: number;
}

interface ChartPoint {
  lap: number;
  time: number | null;
  isPit: boolean;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ChartPoint;
  return (
    <div
      style={{
        background: INK,
        border: `1px solid rgba(${RGB.red},0.3)`,
        padding: "0.6rem 0.85rem",
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      <div
        style={{
          fontSize: "0.55rem",
          fontWeight: 700,
          letterSpacing: "0.16em",
          color: RED,
          textTransform: "uppercase",
          marginBottom: "4px",
        }}
      >
        Lap {d.lap}
      </div>
      {d.isPit ? (
        <div style={{ fontSize: "0.65rem", color: `rgba(${RGB.paper},0.3)` }}>
          Pit Out Lap
        </div>
      ) : d.time ? (
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: `rgba(${RGB.paper},0.8)`,
          }}
        >
          {formatLapTime(d.time)}
        </div>
      ) : (
        <div style={{ fontSize: "0.65rem", color: `rgba(${RGB.paper},0.2)` }}>
          —
        </div>
      )}
    </div>
  );
}

function fmtY(val: number) {
  if (!val) return "";
  const mins = Math.floor(val / 60);
  const secs = (val % 60).toFixed(1).padStart(4, "0");
  return mins > 0 ? `${mins}:${secs}` : `${secs}s`;
}

export default function LapTrendChart({ laps, fastestLap }: Props) {
  const data: ChartPoint[] = laps.map((l) => ({
    lap: l.lap_number,
    time: l.is_pit_out_lap || !l.lap_duration ? null : l.lap_duration,
    isPit: l.is_pit_out_lap,
  }));

  const valid = data.filter((d) => d.time !== null).map((d) => d.time!);
  const minT = valid.length > 0 ? Math.min(...valid) : 0;
  const maxT = valid.length > 0 ? Math.max(...valid) : 120;
  const pad = (maxT - minT) * 0.1 || 2;
  const domain: [number, number] = [minT - pad, maxT + pad];

  if (data.length === 0) {
    return (
      <div
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.6rem",
          color: `rgba(${RGB.paper},0.15)`,
          letterSpacing: "0.1em",
          padding: "1rem 0",
        }}
      >
        NO LAP DATA
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="2 6"
            stroke={`rgba(${RGB.paper},0.04)`}
            vertical={false}
          />
          <XAxis
            dataKey="lap"
            stroke={`rgba(${RGB.paper},0.07)`}
            tick={{
              fill: `rgba(${RGB.paper},0.2)`,
              fontSize: 9,
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
            }}
            tickLine={false}
          />
          <YAxis
            stroke={`rgba(${RGB.paper},0.07)`}
            domain={domain}
            tickFormatter={fmtY}
            tick={{
              fill: `rgba(${RGB.paper},0.2)`,
              fontSize: 9,
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600,
            }}
            tickLine={false}
            width={52}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: `rgba(${RGB.red},0.3)`,
              strokeWidth: 1,
              strokeDasharray: "3 3",
            }}
          />
          {fastestLap > 0 && (
            <ReferenceLine
              y={fastestLap}
              stroke={RED}
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: "PB",
                position: "insideTopLeft",
                fill: RED,
                fontSize: 8,
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="time"
            stroke={RED}
            strokeWidth={1.5}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (!payload.time) return <g key={`dot-${payload.lap}`} />;
              const isFastest = Math.abs(payload.time - fastestLap) < 0.001;
              return (
                <circle
                  key={`dot-${payload.lap}`}
                  cx={cx}
                  cy={cy}
                  r={isFastest ? 4 : 2}
                  fill={isFastest ? RED : INK}
                  stroke={isFastest ? RED : `rgba(${RGB.red},0.4)`}
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={{ r: 4, fill: RED, stroke: "none" }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          marginTop: "0.75rem",
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.52rem",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: `rgba(${RGB.paper},0.2)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: "16px", height: "1.5px", background: RED }} />
          <span>Lap Time</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <svg width="16" height="4">
            <line
              x1="0"
              y1="2"
              x2="16"
              y2="2"
              stroke={RED}
              strokeWidth="1"
              strokeDasharray="3 2"
            />
          </svg>
          <span>Personal Best</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: RED,
            }}
          />
          <span>Fastest Lap</span>
        </div>
      </div>
    </div>
  );
}
