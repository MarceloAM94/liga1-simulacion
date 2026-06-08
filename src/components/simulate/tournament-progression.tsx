"use client"

import { useState, useCallback } from "react"
import { MatchAnimator } from "./match-animator"
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
}: {
  rounds: RoundResult[]
  currentIndex: number
  isChampion: boolean
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-3">
      {rounds.map((round, i) => {
        const won =
          round.goalsFor > round.goalsAgainst ||
          (round.goalsFor === round.goalsAgainst && round.penaltyResult === "won")
        const isPast = i < currentIndex
        const isCurrent = i === currentIndex
        const isLast = i === rounds.length - 1

        return (
          <div key={i} className="flex flex-col items-center shrink-0">
            <div
              className={`w-28 border rounded-lg p-2 text-center transition-all duration-300 ${
                isCurrent
                  ? "border-zinc-400 bg-zinc-900 scale-105"
                  : isPast
                  ? won
                    ? "border-emerald-700 bg-emerald-950/30 opacity-60"
                    : "border-red-700 bg-red-950/30 opacity-60"
                  : "border-zinc-800 bg-zinc-900/50 opacity-40"
              }`}
            >
              <p className="text-[9px] text-zinc-500 uppercase tracking-wide mb-1 truncate">
                {round.roundName}
              </p>
              {isPast ? (
                <>
                  <p className="text-base font-black">
                    {round.goalsFor} - {round.goalsAgainst}
                  </p>
                  <p className="text-[9px] text-zinc-500 truncate">{round.rivalTeamName}</p>
                </>
              ) : (
                <p className="text-base font-black text-zinc-600">?-?</p>
              )}
            </div>
            {!isLast && <div className="h-4 w-px bg-zinc-800" />}
          </div>
        )
      })}
      {isChampion && (
        <div className="flex flex-col items-center shrink-0">
          <div
            className={`w-28 border-2 rounded-lg p-2 text-center transition-all duration-300 ${
              currentIndex >= rounds.length
                ? "border-yellow-500 bg-yellow-950/20"
                : "border-zinc-800 bg-zinc-900/50 opacity-40"
            }`}
          >
            <p className="text-[9px] uppercase tracking-wide text-yellow-500 font-bold">
              ¡Campeón!
            </p>
            <p className="text-lg">🏆</p>
          </div>
        </div>
      )}
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
                    <span className="shrink-0">{EVENT_ICONS[ev.event_type] ?? "•"}</span>
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

function ChampionsCard({
  cardData,
  isChampion,
}: {
  cardData: CardData
  isChampion: boolean
}) {
  const positionLabels: Record<string, string> = {
    POR: "POR", DFC: "DFC", LI: "LI", LD: "LD",
    MC: "MC", MCD: "MCD", MI: "MI", MD: "MD", CAM: "CAM",
    EI: "EI", ED: "ED", DC: "DC", SD: "SD",
    CAI: "CAI", CAD: "CAD",
  }

  const won =
    cardData.phase_reached === "Campeón"

  return (
    <div
      className={`border-2 rounded-xl p-5 animate-in fade-in duration-500 ${
        won
          ? "border-yellow-500 bg-yellow-950/20"
          : "border-zinc-700 bg-zinc-900/50"
      }`}
    >
      <h2
        className={`text-xl font-black mb-1 ${
          won ? "text-yellow-400" : "text-zinc-300"
        }`}
      >
        {won ? "¡CAMPEÓN!" : "Torneo finalizado"}
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

export function TournamentProgression({ data }: { data: TournamentData }) {
  const [currentRound, setCurrentRound] = useState(0)
  const [finished, setFinished] = useState(false)

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

  return (
    <div className="flex flex-1 flex-col p-4 gap-5 max-w-3xl mx-auto w-full">
      <header>
        <h1 className="text-2xl font-bold">Resultados del Torneo</h1>
      </header>

      <BracketView
        rounds={data.rounds}
        currentIndex={finished ? data.rounds.length : currentRound}
        isChampion={data.isChampion}
      />

      {!finished && currentRound < data.rounds.length ? (
        <MatchAnimator
          key={currentRound}
          round={data.rounds[currentRound]}
          onComplete={handleMatchComplete}
        />
      ) : (
        <div className="space-y-5">
          <ChampionsCard cardData={data.cardData} isChampion={data.isChampion} />
          <h2 className="text-lg font-bold text-zinc-200">Historial de partidos</h2>
          <MatchHistoryCards rounds={data.rounds} />
        </div>
      )}

      {finished && (
        <div className="flex justify-center pb-8">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-zinc-800 rounded-xl text-sm hover:bg-zinc-700"
          >
            Volver al draft
          </button>
        </div>
      )}
    </div>
  )
}
