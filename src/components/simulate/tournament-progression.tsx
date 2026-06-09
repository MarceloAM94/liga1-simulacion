"use client"

import { useState, useCallback } from "react"
import { MatchAnimator } from "./match-animator"
import { CardGenerator } from "./card-generator"
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

interface TournamentData {
  rounds: RoundResult[]
  eliminatedIn: string
  isChampion: boolean
  cardData: CardData
}

function BracketView({
  rounds,
  currentIndex,
  isChampion,
  finished,
}: {
  rounds: RoundResult[]
  currentIndex: number
  isChampion: boolean
  finished: boolean
}) {
  const ALL_ROUNDS = ["Octavos de final", "Cuartos de final", "Semifinal", "Final"]

  return (
    <div className="flex gap-2 overflow-x-auto pb-3">
      {ALL_ROUNDS.map((name, i) => {
        const hasData = i < rounds.length
        const isPast = i < currentIndex && hasData
        const isCurrent = i === currentIndex
        const isFuture = i > currentIndex
        const eliminatedHere = finished && !isChampion && i === rounds.length - 1 && i === currentIndex

        let won = false
        if (hasData) {
          won =
            rounds[i].goalsFor > rounds[i].goalsAgainst ||
            (rounds[i].goalsFor === rounds[i].goalsAgainst && rounds[i].penaltyResult === "won")
        }

        return (
          <div key={i} className="flex flex-col items-center shrink-0">
            <div
              className={`w-28 border rounded-lg p-2 text-center transition-all duration-300 ${
                isCurrent && !finished
                  ? "border-zinc-400 bg-zinc-900 scale-105"
                  : isPast
                  ? won
                    ? "border-emerald-700 bg-emerald-950/30 opacity-60"
                    : "border-red-700 bg-red-950/30 opacity-60"
                  : "border-zinc-800 bg-zinc-900/50 opacity-40"
              }`}
            >
              <p className="text-[9px] text-zinc-500 uppercase tracking-wide mb-1 truncate">
                {name}
              </p>
              {isPast ? (
                <>
                  <p className="text-base font-black">
                    {rounds[i].goalsFor} - {rounds[i].goalsAgainst}
                  </p>
                  <p className="text-[9px] text-zinc-500 truncate">{rounds[i].rivalTeamName}</p>
                </>
              ) : (
                <>
                  <p className="text-base font-black text-zinc-600">?-?</p>
                  <p className="text-[9px] text-zinc-700 truncate">???</p>
                </>
              )}
            </div>
            {i < ALL_ROUNDS.length - 1 && <div className="h-4 w-px bg-zinc-800" />}
          </div>
        )
      })}
      {/* Champion trophy */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-28 border-2 rounded-lg p-2 text-center transition-all duration-300 ${
            finished && isChampion
              ? "border-yellow-500 bg-yellow-950/20"
              : "border-zinc-800 bg-zinc-900/50 opacity-20"
          }`}
        >
          <p className="text-[9px] uppercase tracking-wide text-yellow-500 font-bold">
            ¡Campeón!
          </p>
          <p className="text-lg">🏆</p>
        </div>
      </div>
    </div>
  )
}

function MatchHistoryCards({ rounds }: { rounds: RoundResult[] }) {
  const positionLabels: Record<string, string> = {
    POR: "POR", DFC: "DFC", LI: "LI", LD: "LD",
    MC: "MC", MCD: "MCD", MI: "MI", MD: "MD", CAM: "CAM",
    EI: "EI", ED: "ED", DC: "DC", SD: "SD",
    CAI: "CAI", CAD: "CAD",
  }

  const EVENT_LABELS: Record<string, string> = {
    goal_for: "Gol",
    goal_against: "Gol rival",
    yellow_card: "Amarilla",
    red_card: "Roja",
    save: "Atajada",
  }

  return (
    <div className="space-y-3">
      {rounds.map((round, i) => {
        const won =
          round.goalsFor > round.goalsAgainst ||
          (round.goalsFor === round.goalsAgainst && round.penaltyResult === "won")

        return (
          <details
            key={i}
            className={`border rounded-xl overflow-hidden ${
              won
                ? "border-emerald-700 bg-emerald-950/20"
                : "border-red-700 bg-red-950/20"
            }`}
          >
            <summary className="p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">
                    {round.roundName}
                  </p>
                  <p className="text-sm text-zinc-300">
                    vs {round.rivalTeamName} ({round.rivalYear})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-black ${
                    won ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {round.goalsFor} - {round.goalsAgainst}
                  </span>
                  <span className="text-xs text-zinc-600">▼</span>
                </div>
              </div>
              {round.wentToPenalties && (
                <p className="text-xs text-zinc-500 mt-1">
                  Penales: {round.penaltyResult === "won" ? "Ganaste" : "Perdiste"}
                </p>
              )}
            </summary>
            <div className="px-4 pb-4 space-y-1">
              {round.events.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">Sin eventos destacados</p>
              ) : (
                round.events.map((ev, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm py-0.5">
                    <span className="text-xs text-zinc-500 w-8 shrink-0 font-mono">
                      {ev.minute}&apos;
                    </span>
                    <span className="text-zinc-300">
                      {ev.description ?? EVENT_LABELS[ev.event_type] ?? ev.event_type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </details>
        )
      })}
    </div>
  )
}

export function TournamentProgression({ data, sessionId }: { data: TournamentData; sessionId: string }) {
  const [currentRound, setCurrentRound] = useState(0)
  const [finished, setFinished] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [resimulating, setResimulating] = useState(false)

  const handleMatchComplete = useCallback(() => {
    const next = currentRound + 1
    if (next >= data.rounds.length) {
      setFinished(true)
    } else {
      // Check if current match was a loss
      const round = data.rounds[currentRound]
      const won =
        round.goalsFor > round.goalsAgainst ||
        (round.goalsFor === round.goalsAgainst && round.penaltyResult === "won")
      if (!won) {
        setFinished(true)
      } else {
        setCurrentRound(next)
      }
    }
  }, [currentRound, data.rounds])

  const handleResimulate = useCallback(async () => {
    setResimulating(true)
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, force: true }),
      })
      if (!res.ok) throw new Error("Error al re-simular")
      window.location.reload()
    } catch {
      setResimulating(false)
      alert("Error al re-simular. Intenta de nuevo.")
    }
  }, [sessionId])

  return (
    <div className="flex flex-1 flex-col p-4 gap-5 max-w-3xl mx-auto w-full">
      <header>
        <h1 className="text-2xl font-bold">Resultados del Torneo</h1>
      </header>

      <BracketView
        rounds={data.rounds}
        currentIndex={currentRound}
        isChampion={data.isChampion}
        finished={finished}
      />

      {!finished && currentRound < data.rounds.length ? (
        <MatchAnimator
          key={currentRound}
          round={data.rounds[currentRound]}
          onComplete={handleMatchComplete}
        />
      ) : (
        <div className="space-y-5">
          {showCard && (
            <CardGenerator cardData={data.cardData} isChampion={data.isChampion} />
          )}
          {!showCard && (
            <>
              <h2 className="text-lg font-bold text-zinc-200">Historial de partidos</h2>
              <MatchHistoryCards rounds={data.rounds} />
            </>
          )}
        </div>
      )}

      {finished && (
        <div className="flex flex-wrap justify-center gap-3 pb-8">
          <button
            onClick={handleResimulate}
            disabled={resimulating}
            className="px-5 py-3 bg-zinc-800 rounded-xl text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {resimulating ? "Simulando..." : "Repetir simulación"}
          </button>
          <button
            onClick={() => setShowCard((s) => !s)}
            className="px-5 py-3 bg-zinc-800 rounded-xl text-sm hover:bg-zinc-700 transition-colors"
          >
            {showCard ? "Volver al historial" : "Ver card"}
          </button>
          <a
            href="/"
            className="px-5 py-3 bg-emerald-800 rounded-xl text-sm hover:bg-emerald-700 transition-colors font-medium"
          >
            Volver a jugar
          </a>
        </div>
      )}
    </div>
  )
}
