import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DriverSelectorProps {
  driver1Id: string;
  driver2Id: string;
  onDriver1Change: (id: string) => void;
  onDriver2Change: (id: string) => void;
  allDrivers: any[];
}

export default function DriverSelector({
  driver1Id,
  driver2Id,
  onDriver1Change,
  onDriver2Change,
  allDrivers,
}: DriverSelectorProps) {
  const selectStyle = {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: "1rem",
    letterSpacing: "0.04em",
    borderRadius: 0,
  };

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

        <div className="p-8">
          <span className="label-overline block mb-6">Select Drivers</span>

          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            {/* Driver 1 */}
            <div>
              <div className="stat-label mb-3" style={{ color: "#E10600" }}>
                Driver 1
              </div>
              <Select value={driver1Id} onValueChange={onDriver1Change}>
                <SelectTrigger
                  className="h-12 text-white border-white/10 bg-white/[0.03] focus:ring-0 focus:ring-offset-0"
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

            {/* VS divider */}
            <div className="flex items-center justify-center">
              <div
                className="px-4 py-2 text-center"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  fontSize: "1.25rem",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                VS
              </div>
            </div>

            {/* Driver 2 */}
            <div>
              <div className="stat-label mb-3">Driver 2</div>
              <Select value={driver2Id} onValueChange={onDriver2Change}>
                <SelectTrigger
                  className="h-12 text-white border-white/10 bg-white/[0.03] focus:ring-0 focus:ring-offset-0"
                  style={{
                    ...selectStyle,
                    borderLeft: "2px solid rgba(255,255,255,0.3)",
                  }}
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
