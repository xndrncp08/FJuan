/**
 * SeasonSelector – Dropdown to select F1 season year
 * 
 * Features:
 * - Generates years from 1950 to current year
 * - Responsive layout: label and dropdown side-by-side on desktop, stacked on mobile
 * - Consistent styling with other panels
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SeasonSelectorProps {
  season: string;
  onSeasonChange: (season: string) => void;
}

export default function SeasonSelector({
  season,
  onSeasonChange,
}: SeasonSelectorProps) {
  const currentYear = new Date().getFullYear();
  // Generate years from 1950 to current (descending)
  const years = Array.from({ length: currentYear - 1949 }, (_, i) =>
    (currentYear - i).toString()
  );

  return (
    <div className="mb-10">
      <div className="relative overflow-hidden bg-[#111] border border-white/10">
        {/* Top red accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />

        <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
          {/* Left side – label */}
          <div>
            <span className="label-overline block mb-1">Season</span>
            <p className="text-white/35 text-xs">
              Select a Formula 1 championship year
            </p>
          </div>

          {/* Right side – dropdown (pushes to right on desktop) */}
          <div className="md:ml-auto md:min-w-[220px] w-full md:w-auto">
            <Select value={season} onValueChange={onSeasonChange}>
              <SelectTrigger className="h-11 w-full text-white font-medium border-white/10 bg-white/[0.03] focus:ring-0 focus:ring-offset-0 font-condensed font-bold text-base tracking-wide rounded-none">
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent className="border-white/10 max-h-[360px] bg-[#141414] rounded-none">
                {years.map((year) => (
                  <SelectItem
                    key={year}
                    value={year}
                    className="text-white focus:bg-white/10 focus:text-white font-condensed font-bold"
                  >
                    {year} Season
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}