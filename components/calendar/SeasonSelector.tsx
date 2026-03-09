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
  const years = Array.from({ length: currentYear - 1949 }, (_, i) =>
    (currentYear - i).toString(),
  );

  return (
    <div className="max-w-7xl mx-auto px-6 mb-12">
      <div
        className="relative overflow-hidden"
        style={{
          background: "#111",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />
        <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <span className="label-overline block mb-1">Season</span>
            <p className="text-white/35 text-xs">
              Select a Formula 1 championship year
            </p>
          </div>
          <div className="md:ml-auto md:min-w-[220px]">
            <Select value={season} onValueChange={onSeasonChange}>
              <SelectTrigger
                className="h-11 text-white font-medium border-white/10 bg-white/[0.03] focus:ring-0 focus:ring-offset-0"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  letterSpacing: "0.04em",
                  borderRadius: 0,
                }}
              >
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent
                className="border-white/10 max-h-[360px]"
                style={{ background: "#141414", borderRadius: 0 }}
              >
                {years.map((year) => (
                  <SelectItem
                    key={year}
                    value={year}
                    className="text-white focus:bg-white/10 focus:text-white"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                    }}
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
