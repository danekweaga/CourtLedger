export interface LineMovementInsight {
  direction: "up" | "down" | "flat" | "unknown";
  magnitude: number;
  value_gone: boolean;
  inflated_line: boolean;
  summary: string;
}

export function analyzeLineMovement(
  opening: number | null,
  current: number,
  side: "over" | "under" | null,
): LineMovementInsight {
  if (opening == null || !Number.isFinite(opening) || opening <= 0) {
    return {
      direction: "unknown",
      magnitude: 0,
      value_gone: false,
      inflated_line: false,
      summary: "No reliable opening line — treat CLV and steam reads as low confidence.",
    };
  }

  const delta = current - opening;
  const magnitude = Math.abs(delta);
  const direction: LineMovementInsight["direction"] = magnitude < 0.2 ? "flat" : delta > 0 ? "up" : "down";

  let value_gone = false;
  let inflated_line = false;

  if (side === "over") {
    value_gone = delta >= 0.75;
    inflated_line = delta <= -1.0;
  } else if (side === "under") {
    value_gone = delta <= -0.75;
    inflated_line = delta >= 1.0;
  } else {
    value_gone = magnitude >= 1.25;
    inflated_line = magnitude >= 1.5;
  }

  return {
    direction,
    magnitude: Math.round(magnitude * 100) / 100,
    value_gone,
    inflated_line,
    summary: `Line ${opening} → ${current} (${direction}, ${magnitude.toFixed(2)} u).`,
  };
}
