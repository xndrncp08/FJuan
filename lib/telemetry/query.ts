import type { TelemetryQuery } from "./provider";

export function parseTelemetryQuery(params: URLSearchParams): TelemetryQuery {
  const source = params.get("source") ?? "auto";
  if (source !== "auto" && source !== "openf1" && source !== "synthetic") throw new Error("Invalid telemetry source.");
  const query: TelemetryQuery = { source, circuit: params.get("circuit") ?? undefined };
  for (const [param, key] of [["session_key", "sessionKey"], ["driver", "driverNumber"], ["lap", "lap"]] as const) {
    const value = params.get(param);
    if (value === null) continue;
    const number = Number(value);
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(number)) throw new Error(`${param} must be a positive integer.`);
    query[key] = number;
  }
  return query;
}
