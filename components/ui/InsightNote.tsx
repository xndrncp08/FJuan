import { Info, ChevronDown } from "lucide-react";

export function InsightNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="insight-note group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-subhead font-semibold text-label-2 [&::-webkit-details-marker]:hidden">
        <Info className="h-4 w-4 shrink-0 text-tint" aria-hidden />
        <span className="min-w-0 flex-1">{title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-label-3 transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="max-w-[75ch] pb-4 pt-1 text-subhead leading-relaxed text-label-2">{children}</div>
    </details>
  );
}
