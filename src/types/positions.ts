export const POSITION_LABELS: Record<string, string> = {
  GK: "POR", CB: "DFC", LB: "LI", RB: "LD",
  LWB: "CIL", RWB: "CID", CDM: "MCD", CM: "MC",
  LM: "MI", RM: "MD", CAM: "MCO", LW: "EI",
  RW: "ED", CF: "DC", ST: "DC",
}

export function translatePositions(positions: string[]): string {
  return positions.map((p) => POSITION_LABELS[p] ?? p).join(" / ")
}
