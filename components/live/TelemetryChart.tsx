import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface TelemetryChartProps {
  data: any[];
  title: string;
  dataKeys: { key: string; name: string; color: string }[];
  yAxisDomain: [number, number];
}

export default function TelemetryChart({ data, title, dataKeys, yAxisDomain }: TelemetryChartProps) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />

      <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <span className="live-dot" />
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "white",
            }}
          >
            {title}
          </span>
        </div>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              stroke="rgba(255,255,255,0.1)"
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.1)"
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
              domain={yAxisDomain}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#141414",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 0,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.75rem",
              }}
              labelStyle={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}
              itemStyle={{ color: "rgba(255,255,255,0.8)" }}
            />
            <Legend
              wrapperStyle={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            />
            {dataKeys.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.name}
                stroke={item.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: item.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
