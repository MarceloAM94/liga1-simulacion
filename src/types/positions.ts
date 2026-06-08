export const POSITION_LABELS: Record<string, string> = {
  POR: "POR", DFC: "DFC", LI: "LI", LD: "LD",
  CAI: "CAI", CAD: "CAD", MCD: "MCD", MC: "MC",
  MI: "MI", MD: "MD", CAM: "CAM", EI: "EI",
  ED: "ED", DC: "DC", SD: "SD",
}

export function translatePositions(positions: string[]): string {
  return positions.join(" / ")
}

export function getAvailablePositionCodes(
  formationSlots: { position_code: string }[],
  selectedSlots: { position_code: string }[]
): string[] {
  const total: Record<string, number> = {}
  for (const s of formationSlots) {
    total[s.position_code] = (total[s.position_code] || 0) + 1
  }
  const filled: Record<string, number> = {}
  for (const s of selectedSlots) {
    filled[s.position_code] = (filled[s.position_code] || 0) + 1
  }
  return Object.keys(total).filter(
    (p) => (filled[p] || 0) < (total[p] || 0)
  )
}

export function hasAvailablePosition(
  playerPositions: string[],
  formationSlots: { position_code: string }[],
  selectedSlots: { position_code: string }[]
): boolean {
  const available = getAvailablePositionCodes(formationSlots, selectedSlots)
  return playerPositions.some((p) => available.includes(p))
}

export function getHighlightedSlots(
  playerPositions: string[],
  formationSlots: { position_code: string; slot_index: number }[],
  selectedSlots: { position_code: string }[]
): number[] {
  const available = getAvailablePositionCodes(formationSlots, selectedSlots)
  const usable = playerPositions.filter((p) => available.includes(p))
  return formationSlots
    .filter((s) => usable.includes(s.position_code))
    .map((s) => s.slot_index)
}
