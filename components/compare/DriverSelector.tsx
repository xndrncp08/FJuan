import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { D1_COLOR } from "./constants";

interface DriverSelectorProps {
  driver1Id: string;
  driver2Id: string;
  onDriver1Change: (id: string) => void;
  onDriver2Change: (id: string) => void;
  allDrivers: any[];
}

export function DriverSelector({
  driver1Id, driver2Id, onDriver1Change, onDriver2Change, allDrivers,
}: DriverSelectorProps) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "#0a0a0a",
      border: "1px solid rgba(255,255,255,0.07)",
      borderTop: "3px solid #E10600",
      marginBottom: "3rem",
      animation: "compareSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both",
    }}>
      <div style={{ padding: "1.75rem clamp(1.25rem,4vw,2rem)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          marginBottom: "1.25rem",
        }}>
          <div style={{ width: "16px", height: "2px", background: D1_COLOR }} />
          <span style={{
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: "0.6rem", letterSpacing: "0.22em",
            textTransform: "uppercase", color: D1_COLOR,
          }}>
            Select Drivers
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: "1rem",
            alignItems: "center",
          }}
          className="compare-selector-grid"
        >
          {/* Driver 1 */}
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.46rem", fontWeight: 500,
              color: D1_COLOR, letterSpacing: "0.12em",
              textTransform: "uppercase", marginBottom: "0.5rem",
            }}>
              Driver 01
            </div>
            <Select value={driver1Id} onValueChange={onDriver1Change}>
              <SelectTrigger style={{
                height: "48px", width: "100%",
                fontFamily: "'Russo One', sans-serif",
                fontSize: "0.85rem", letterSpacing: "0.02em",
                background: "rgba(225,6,0,0.04)",
                border: "1px solid rgba(225,6,0,0.25)",
                borderLeft: `3px solid ${D1_COLOR}`,
                color: "white", borderRadius: 0,
              }}>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, maxHeight: "320px" }}>
                {allDrivers?.map((d: any) => (
                  <SelectItem key={d.driverId} value={d.driverId} style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: "white" }}>
                    {d.givenName} {d.familyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VS divider */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 0.5rem",
          }}>
            <div style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: "clamp(1rem, 3vw, 1.4rem)",
              color: "rgba(255,255,255,0.12)",
              letterSpacing: "0.08em",
            }}>
              VS
            </div>
          </div>

          {/* Driver 2 */}
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.46rem", fontWeight: 500,
              color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em",
              textTransform: "uppercase", marginBottom: "0.5rem",
            }}>
              Driver 02
            </div>
            <Select value={driver2Id} onValueChange={onDriver2Change}>
              <SelectTrigger style={{
                height: "48px", width: "100%",
                fontFamily: "'Russo One', sans-serif",
                fontSize: "0.85rem", letterSpacing: "0.02em",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderLeft: `3px solid rgba(255,255,255,0.3)`,
                color: "white", borderRadius: 0,
              }}>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, maxHeight: "320px" }}>
                {allDrivers?.map((d: any) => (
                  <SelectItem key={d.driverId} value={d.driverId} style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: "white" }}>
                    {d.givenName} {d.familyName}
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