import type { FormationSlot, SelectedSlot } from "@/types/database"

interface PitchProps {
  slots: FormationSlot[]
  selectedSlots: SelectedSlot[]
  highlightedSlots: FormationSlot[]
  formationName: string | null
  onSlotClick: (slotIndex: number) => void
}

const positionLabels: Record<string, string> = {
  GK: "POR", CB: "DFC", LB: "LI", RB: "LD",
  LWB: "CIL", RWB: "CID", CDM: "MCD", CM: "MC",
  LM: "MI", RM: "MD", CAM: "MCO", LW: "EI",
  RW: "ED", CF: "DC", ST: "DC",
}

const slotPositions: Record<number, { top: string; left: string }> = {
  0: { top: "92%", left: "50%" },   // GK
  1: { top: "75%", left: "20%" },   // CB
  2: { top: "75%", left: "80%" },   // CB
  3: { top: "68%", left: "50%" },   // CB (libero)
  4: { top: "60%", left: "8%" },    // LB
  5: { top: "60%", left: "92%" },   // RB
  6: { top: "45%", left: "50%" },   // CDM
  7: { top: "35%", left: "25%" },   // CM
  8: { top: "35%", left: "75%" },   // CM
  9: { top: "20%", left: "20%" },   // LW
  10: { top: "20%", left: "80%" },  // RW
  11: { top: "12%", left: "50%" },  // ST
}

export function Pitch({
  slots,
  selectedSlots,
  highlightedSlots,
  formationName,
  onSlotClick,
}: PitchProps) {
  const isHighlighted = (index: number) =>
    highlightedSlots.some((s) => s.slot_index === index)

  const isOccupied = (index: number) =>
    selectedSlots.some((s) => s.slot_index === index)

  const getSlotPlayer = (index: number) =>
    selectedSlots.find((s) => s.slot_index === index)

  return (
    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {formationName && (
        <div className="px-4 py-2 border-b border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">
            {formationName}
          </p>
        </div>
      )}

      <div className="relative mx-auto w-full" style={{ maxWidth: "600px", aspectRatio: "3/4" }}>
        {/* Cancha SVG */}
        <svg
          viewBox="0 0 300 400"
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 0 }}
        >
          <rect width="300" height="400" fill="#1a6b3c" rx="4" />
          <rect x="10" y="10" width="280" height="380" fill="none" stroke="#2a8b4c" strokeWidth="2" rx="2" />
          <line x1="10" y1="200" x2="290" y2="200" stroke="#2a8b4c" strokeWidth="2" />
          <circle cx="150" cy="200" r="30" fill="none" stroke="#2a8b4c" strokeWidth="2" />
          <circle cx="150" cy="200" r="4" fill="#2a8b4c" />
          {/* Área superior */}
          <rect x="75" y="10" width="150" height="60" fill="none" stroke="#2a8b4c" strokeWidth="2" />
          <rect x="100" y="10" width="100" height="25" fill="none" stroke="#2a8b4c" strokeWidth="2" />
          {/* Área inferior */}
          <rect x="75" y="330" width="150" height="60" fill="none" stroke="#2a8b4c" strokeWidth="2" />
          <rect x="100" y="365" width="100" height="25" fill="none" stroke="#2a8b4c" strokeWidth="2" />
        </svg>

        {/* Slots */}
        {slots.map((slot) => {
          const index = slot.slot_index
          const pos = slotPositions[index] ?? { top: "50%", left: "50%" }
          const occupied = isOccupied(index)
          const highlighted = isHighlighted(index)
          const slotPlayer = getSlotPlayer(index)

          return (
            <button
              key={slot.id}
              onClick={() => {
                if (highlighted && !occupied) {
                  onSlotClick(index)
                }
              }}
              disabled={!highlighted || occupied}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200
                flex flex-col items-center justify-center
                ${occupied ? "cursor-default" : highlighted ? "cursor-pointer" : "cursor-not-allowed"}
              `}
              style={{ top: pos.top, left: pos.left, zIndex: 1 }}
            >
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  text-xs font-bold border-2 transition-all
                  ${
                    occupied
                      ? "bg-emerald-800 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-900/50"
                      : highlighted
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse hover:bg-emerald-500/40"
                        : "bg-zinc-800/60 border-zinc-700 text-zinc-500"
                  }
                `}
              >
                {occupied ? (
                  <span className="text-[10px] leading-tight text-center">
                    {slotPlayer?.player_name?.slice(0, 2) ?? ""}
                  </span>
                ) : (
                  <span className="text-[10px]">{positionLabels[slot.position_code] ?? slot.position_code}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
