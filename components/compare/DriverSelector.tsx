"use client";

/**
 * DriverSelector Component
 * 
 * Two dropdown selectors allowing users to pick two drivers to compare.
 * Features:
 * - "VS" divider between selectors
 * - Red accent on Driver 1 selector (left)
 * - Responsive: stacks vertically on mobile, row on desktop
 * - Uses shadcn/ui Select components with custom styling
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DriverSelectorProps {
  driver1Id: string;           // Currently selected driver ID for left slot
  driver2Id: string;           // Currently selected driver ID for right slot
  onDriver1Change: (id: string) => void;
  onDriver2Change: (id: string) => void;
  allDrivers: any[];           // Array of driver objects from Ergast API
}

export default function DriverSelector({
  driver1Id,
  driver2Id,
  onDriver1Change,
  onDriver2Change,
  allDrivers,
}: DriverSelectorProps) {
  // Consistent font styling for select triggers
  const selectStyle = {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: "1rem",
    letterSpacing: "0.04em",
    borderRadius: 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 md:mb-12">
      {/* Main container panel */}
      <div className="relative overflow-hidden bg-[#111] border border-white/10">
        {/* Top red accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E10600]" />

        <div className="p-5 md:p-8">
          {/* Section label */}
          <span className="label-overline block mb-4 md:mb-6">Select Drivers</span>

          {/* Responsive grid: column on mobile, 3 columns on md+ (1fr auto 1fr) */}
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-4">
            
            {/* Driver 1 selector - red accent border */}
            <div className="flex-1">
              <div className="stat-label mb-2 text-[#E10600]">Driver 1</div>
              <Select value={driver1Id} onValueChange={onDriver1Change}>
                <SelectTrigger
                  className="h-12 w-full text-white border-white/10 bg-white/[0.03] focus:ring-0 focus:ring-offset-0"
                  style={{ ...selectStyle, borderLeft: "2px solid #E10600" }}
                >
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent
                  className="border-white/10 max-h-[320px]"
                  style={{ background: "#141414", borderRadius: 0 }}
                >
                  {allDrivers?.map((driver: any) => (
                    <SelectItem
                      key={driver.driverId}
                      value={driver.driverId}
                      className="text-white focus:bg-white/10 focus:text-white"
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      {driver.givenName} {driver.familyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* VS divider - hidden on mobile, visible on md+ */}
            <div className="flex items-center justify-center md:px-2">
              <div className="px-4 py-2 text-center border border-white/10 bg-transparent">
                <span className="font-condensed font-black text-lg tracking-wider text-white/30">
                  VS
                </span>
              </div>
            </div>

            {/* Driver 2 selector - subtle white border accent */}
            <div className="flex-1">
              <div className="stat-label mb-2">Driver 2</div>
              <Select value={driver2Id} onValueChange={onDriver2Change}>
                <SelectTrigger
                  className="h-12 w-full text-white border-white/10 bg-white/[0.03] focus:ring-0 focus:ring-offset-0"
                  style={{ ...selectStyle, borderLeft: "2px solid rgba(255,255,255,0.3)" }}
                >
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent
                  className="border-white/10 max-h-[320px]"
                  style={{ background: "#141414", borderRadius: 0 }}
                >
                  {allDrivers?.map((driver: any) => (
                    <SelectItem
                      key={driver.driverId}
                      value={driver.driverId}
                      className="text-white focus:bg-white/10 focus:text-white"
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      {driver.givenName} {driver.familyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}