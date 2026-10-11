import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function SearchField({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="field-label">{label}</span>
      <span className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-label-3" aria-hidden />
        <input type="search" {...props} className="field-control w-full pl-10 pr-3" />
      </span>
    </label>
  );
}

export function SelectField({ label, className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="field-label">{label}</span>
      <span className="relative block">
        <select {...props} className="field-control w-full appearance-none pl-3 pr-9">{children}</select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-label-3" aria-hidden />
      </span>
    </label>
  );
}
