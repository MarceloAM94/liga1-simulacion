"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import type { MatchEvent, CardData } from "@/types/database"

interface RoundResult {
  roundIndex: number
  roundName: string
  rivalSeasonId: string
  rivalTeamName: string
  rivalYear: number
  goalsFor: number
  goalsAgainst: number
  wentToPenalties: boolean
  penaltyResult: "won" | "lost" | null
  events: MatchEvent[]
}

interface SimulateData {
  rounds: RoundResult[]
  eliminatedIn: string
  isChampion: boolean
  cardData: CardData
  status: string
}

const EVENT_ICONS: Record<string, string> = {
  goal_for: "⚽",
  goal_against: "⚽",
  yellow_card: "🟨",
  red_card: "🟥",
  save: "🧤",
}

const EVENT_LABELS: Record<string, string> = {
  goal_for: "Gol",
  goal_against: "Gol rival",
  yellow_card: "Amarilla",
  red_card: "Roja",
  save: "Atajada",
}

function EventTimeline({ events }: { events: MatchEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-zinc-500 italic">Sin eventos destacados</p>
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {events.map((ev, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <span className="text-xs text-zinc-500 w-8 shrink-0 font-mono">
            {ev.minute}&apos;
          </span>
          <span className="shrink-0">{EVENT_ICONS[ev.event_type] ?? "•"}</span>
          <span className="text-zinc-300">
            {ev.description ?? EVENT_LABELS[ev.event_type] ?? ev.event_type}
          </span>
        </div>
      ))}
    </div>
  )
}

function MatchCard({ round }: { round: RoundResult }) {
  const won =
    round.goalsFor > round.goalsAgainst ||
    (round.goalsFor === round.goalsAgainst && round.penaltyResult === "won")

  return (
    <div
      className={`border rounded-xl p-4 ${
        won
          ? "border-emerald-700 bg-emerald-950/30"
          : "border-red-700 bg-red-950/30"
      }`}
    >
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
        {round.roundName}
      </p>

      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-bold">Tu equipo</span>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black">{round.goalsFor}</span>
          <span className="text-zinc-600 font-bold">-</span>
          <span className="text-3xl font-black">{round.goalsAgainst}</span>
        </div>
        <span className="text-lg font-bold text-right">
          {round.rivalTeamName} ({round.rivalYear})
        </span>
      </div>

      {round.wentToPenalties && (
        <p className="text-sm text-zinc-400 mb-2">
          Definido por penales —{" "}
          {round.penaltyResult === "won" ? "Ganaste" : "Perdiste"}
        </p>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300">
          Ver eventos del partido
        </summary>
        <div className="mt-2">
          <EventTimeline events={round.events} />
        </div>
      </details>
    </div>
  )
}

function ChampionsCard({ cardData, isChampion }: { cardData: CardData; isChampion: boolean }) {
  const positionLabels: Record<string, string> = {
    POR: "POR", DFC: "DFC", LI: "LI", LD: "LD",
    MC: "MC", MCD: "MCD", MI: "MI", MD: "MD", CAM: "CAM",
    EI: "EI", ED: "ED", DC: "DC", SD: "SD",
    CAI: "CAI", CAD: "CAD",
  }

  return (
    <div className={`border-2 rounded-xl p-6 ${
      isChampion
        ? "border-yellow-500 bg-yellow-950/20"
        : "border-zinc-700 bg-zinc-900/50"
    }`}>
      <h2 className={`text-xl font-black mb-1 ${
        isChampion ? "text-yellow-400" : "text-zinc-300"
      }`}>
        {isChampion ? "¡CAMPEÓN!" : "Torneo finalizado"}
      </h2>
      <p className="text-sm text-zinc-400 mb-4">
        Llegaste hasta:{" "}
        <span className="font-semibold text-zinc-200">{cardData.phase_reached}</span>
      </p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-black text-zinc-100">{cardData.goals_for}</p>
          <p className="text-xs text-zinc-500">Goles a favor</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-zinc-100">{cardData.goals_against}</p>
          <p className="text-xs text-zinc-500">Goles en contra</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-zinc-100">{cardData.wins}</p>
          <p className="text-xs text-zinc-500">Victorias</p>
        </div>
      </div>

      <div className="text-center mb-4">
        <p className="text-xs text-zinc-500">Overall del equipo</p>
        <p className="text-3xl font-black text-zinc-100">{cardData.team_overall}</p>
      </div>

      <h3 className="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wide">
        Plantilla
      </h3>
      <div className="space-y-1">
        {cardData.players.map((p, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-zinc-300">
              {positionLabels[p.position_code] ?? p.position_code}
            </span>
            <span className="text-zinc-100 font-medium">{p.display_name}</span>
            <span className="text-zinc-400 font-mono text-xs">{p.rating}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BracketView({ rounds, isChampion }: { rounds: RoundResult[]; isChampion: boolean }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {rounds.map((round, i) => {
        const won =
          round.goalsFor > round.goalsAgainst ||
          (round.goalsFor === round.goalsAgainst && round.penaltyResult === "won")
        const isLast = i === rounds.length - 1

        return (
          <div key={i} className="flex flex-col items-center shrink-0">
            <div
              className={`w-32 border rounded-lg p-3 text-center ${
                i === rounds.length - 1 && isChampion
                  ? "border-yellow-600 bg-yellow-950/30"
                  : won
                  ? "border-emerald-700 bg-emerald-950/30"
                  : "border-red-700 bg-red-950/30"
              }`}
            >
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                {round.roundName}
              </p>
              <p className="text-lg font-black">{round.goalsFor} - {round.goalsAgainst}</p>
              <p className="text-[10px] text-zinc-400 truncate">{round.rivalTeamName}</p>
            </div>
            {!isLast && (
              <div className="h-6 w-px bg-zinc-700" />
            )}
          </div>
        )
      })}
      {isChampion && (
        <div className="flex flex-col items-center shrink-0">
          <div className="w-32 border-2 border-yellow-500 rounded-lg p-3 text-center bg-yellow-950/20">
            <p className="text-[10px] uppercase tracking-wide text-yellow-400 font-bold">
              ¡Campeón!
            </p>
            <p className="text-lg">🏆</p>
          </div>
        </div>
      )}
    </div>
  )
}

function SimulateContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")

  const [data, setData] = useState<SimulateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      router.push("/")
      return
    }

    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/results?session_id=${sessionId}`)
        if (!res.ok) {
          const errData = await res.json()
          setError(errData.error ?? "Error al cargar resultados")
          return
        }
        const result = await res.json()
        setData(result)
      } catch {
        setError("Error de conexión")
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [sessionId, router])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-400 animate-pulse">Cargando resultados...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => router.push("/draft")}
          className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700"
        >
          Volver al draft
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Sin datos</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col p-4 gap-6 max-w-3xl mx-auto w-full">
      <header>
        <h1 className="text-2xl font-bold">Resultados del Torneo</h1>
      </header>

      {data.status === "draft" && (
        <div className="bg-amber-900/50 border border-amber-700 text-amber-200 px-4 py-2 rounded-lg text-sm">
          Este torneo aún no se ha simulado. Ve al draft para iniciar la simulación.
        </div>
      )}

      <BracketView rounds={data.rounds} isChampion={data.isChampion} />

      <div className="space-y-3">
        {data.rounds.map((round, i) => (
          <MatchCard key={i} round={round} />
        ))}
      </div>

      <ChampionsCard cardData={data.cardData} isChampion={data.isChampion} />

      <div className="flex justify-center pb-8">
        <button
          onClick={() => router.push("/draft")}
          className="px-6 py-3 bg-zinc-800 rounded-xl text-sm hover:bg-zinc-700"
        >
          Volver al draft
        </button>
      </div>
    </div>
  )
}

export default function SimulatePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-400 animate-pulse">Cargando...</p>
      </div>
    }>
      <SimulateContent />
    </Suspense>
  )
}
