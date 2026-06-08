"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import type {
  Season, Team, SquadPlayerWithPlayer, FormationSlot,
  SelectedSlot, Formation,
} from "@/types/database"
import { getAvailablePositionCodes, getHighlightedSlots } from "@/types/positions"
import { Pitch } from "@/components/draft/pitch"
import { SquadList } from "@/components/draft/squad-list"
import { DrawButton } from "@/components/draft/draw-button"

const DEFAULT_FORMATION_ID = "f1000000-0000-0000-0000-000000000001"

interface DraftData {
  season: Season & { team: Team }
  team: Team
  squad_players: SquadPlayerWithPlayer[]
}

type Phase = "welcome" | "drawn" | "selecting" | "assigning" | "complete"

export default function DraftPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [formation, setFormation] = useState<Formation | null>(null)
  const [slots, setSlots] = useState<FormationSlot[]>([])
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([])
  const [draft, setDraft] = useState<DraftData | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<SquadPlayerWithPlayer | null>(null)
  const [highlightedSlotIndices, setHighlightedSlotIndices] = useState<number[]>([])
  const [phase, setPhase] = useState<Phase>("welcome")
  const [drawnSeasons, setDrawnSeasons] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availablePositionCodes = useMemo(
    () => getAvailablePositionCodes(slots, selectedSlots),
    [slots, selectedSlots]
  )

  useEffect(() => {
    const sid = localStorage.getItem("liga1_session_id")
    if (!sid) {
      router.push("/")
      return
    }
    setSessionId(sid)
    loadGameState(sid)
  }, [router])

  const loadGameState = async (sid: string) => {
    try {
      const res = await fetch(`/api/game?session_id=${sid}`)
      if (!res.ok) return
      const data = await res.json()
      if (!data) return

      setFormation(data.formation)
      setSlots(data.formation?.slots ?? [])
      setSelectedSlots(data.slots ?? [])

      if (data.session?.drawn_season_ids?.length > 0) {
        setDrawnSeasons(data.session.drawn_season_ids)
      }

      if (data.slots?.length === 11) {
        setPhase("complete")
      } else if (data.session?.status === "draft" && data.slots?.length > 0) {
        setPhase("drawn")
      }
    } catch {
      // ok
    }
  }

  const handleDraw = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    setSelectedPlayer(null)
    setHighlightedSlotIndices([])

    try {
      const res = await fetch("/api/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          formation_id: DEFAULT_FORMATION_ID,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      setDraft(data.draw)
      setPhase("drawn")
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const handleSelectPlayer = useCallback(
    (player: SquadPlayerWithPlayer) => {
      if (phase !== "drawn" && phase !== "selecting") return

      if (selectedPlayer?.id === player.id) {
        setSelectedPlayer(null)
        setHighlightedSlotIndices([])
        setPhase("drawn")
        return
      }

      setSelectedPlayer(player)
      setHighlightedSlotIndices(
        getHighlightedSlots(player.positions, slots, selectedSlots)
      )
      setPhase("selecting")
    },
    [phase, slots, selectedSlots, selectedPlayer]
  )

  const handleSimulate = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error)
        return
      }

      router.push(`/simulate?session_id=${sessionId}`)
    } catch {
      setError("Error al simular")
    } finally {
      setLoading(false)
    }
  }, [sessionId, router])

  const handleAssignSlot = useCallback(
    async (slotIndex: number) => {
      if (!sessionId || !selectedPlayer || phase !== "selecting") return

      setLoading(true)
      setError(null)

      try {
        const res = await fetch("/api/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            squad_player_id: selectedPlayer.id,
            slot_index: slotIndex,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error)
          return
        }

        setSelectedSlots((prev) => [...prev, data.selectedSlot])

        if (data.isComplete) {
          setPhase("complete")
        } else {
          setDraft(null)
          setPhase("welcome")
        }

        setSelectedPlayer(null)
        setHighlightedSlotIndices([])
      } catch {
        setError("Error al asignar")
      } finally {
        setLoading(false)
      }
    },
    [sessionId, selectedPlayer, phase]
  )

  const placedCount = selectedSlots.length

  return (
    <div className="flex flex-1 flex-col p-4 gap-4 max-w-7xl mx-auto w-full">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Liga 1 Perú Simulador</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">
            {placedCount}/11 colocados
          </span>
          <DrawButton
            phase={phase}
            loading={loading}
            onDraw={handleDraw}
            onSimulate={handleSimulate}
          />
        </div>
      </header>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-1 gap-4 flex-col lg:flex-row">
        <Pitch
          slots={slots}
          selectedSlots={selectedSlots}
          highlightedSlotIndices={highlightedSlotIndices}
          formationName={formation?.name ?? null}
          onSlotClick={handleAssignSlot}
        />

        <div className="w-full lg:w-80 flex flex-col gap-4">
          {draft && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">
                {draft.season.year} — {draft.team?.name ?? draft.season.team.name}
              </p>
              <p className="text-lg font-bold">{draft.team.name}</p>
            </div>
          )}

          <SquadList
            players={draft?.squad_players ?? []}
            selectedPlayer={selectedPlayer}
            availablePositionCodes={availablePositionCodes}
            onSelectPlayer={handleSelectPlayer}
          />
        </div>
      </div>
    </div>
  )
}
