/**
 * components/ui/chart.tsx
 *
 * Shared Recharts pieces so every chart reads as one system: quiet axes,
 * faint horizontal grid only, and one tooltip style.
 */

export const AXIS = {
  axisLine: false,
  tickLine: false,
  tick: { fill: "rgba(245,233,228,0.54)", fontSize: 11, fontFamily: "var(--font-data), monospace" },
} as const;

export const GRID = { vertical: false, stroke: "rgba(245,233,228,0.07)" } as const;

export const CURSOR_BAR = { fill: "rgba(245,233,228,0.04)" } as const;
export const CURSOR_LINE = { stroke: "rgba(245,233,228,0.18)", strokeWidth: 1 } as const;

type Row = { label: string; value: React.ReactNode; color?: string };

/**
 * Tooltip content. Pass `format` to turn Recharts' payload into rows, or
 * let it default to "series name: value".
 */
export function ChartTooltip({
  active,
  payload,
  label,
  title,
  format,
}: {
  active?: boolean;
  payload?: any[];
  label?: React.ReactNode;
  title?: (label: any, payload: any[]) => React.ReactNode;
  format?: (payload: any[]) => Row[];
}) {
  if (!active || !payload?.length) return null;
  const rows: Row[] = format
    ? format(payload)
    : payload.map((p) => ({ label: String(p.name ?? p.dataKey), value: p.value, color: p.color ?? p.fill }));

  return (
    <div className="min-w-[150px] border border-separator border-t-accent bg-surface-3 px-3 py-2.5 shadow-popover">
      <div className="label-caps mb-1.5 text-[0.75rem] text-label-2">{title ? title(label, payload) : label}</div>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-footnote">
            <span className="flex items-center gap-1.5 text-label-3">
              {r.color && <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />}
              {r.label}
            </span>
            <span className="font-mono text-[0.8125rem] font-medium text-paper">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
