"use client"

import { useState, useEffect, useRef } from "react"
import type { MatchEvent } from "@/types/database"

interface RoundResult {
  roundIndex: number
  roundName: string
  rivalTeamName: string
  rivalYear: number
  goalsFor: number
  goalsAgainst: number
  wentToPenalties: boolean
  penaltyResult: "won" | "lost" | null
  events: MatchEvent[]
}

const EVENT_STYLES: Record<string, string> = {
  goal_for: "bg-emerald-900/40 border-emerald-700",
  goal_against: "bg-red-900/40 border-red-700",
  yellow_card: "bg-yellow-900/30 border-yellow-700",
  red_card: "bg-red-900/50 border-red-600",
  save: "bg-blue-900/30 border-blue-700",
}

interface PenaltyKick {
  team: "user" | "rival"
  scored: boolean
  round: number
}

function generatePenaltyKicks(result: "won" | "lost"): PenaltyKick[] {
  const tryGenerate = (): { kicks: PenaltyKick[]; us: number; them: number } => {
    const kicks: PenaltyKick[] = []
    let us = 0, them = 0
    const totalRounds = 5

    for (let r = 1; r <= totalRounds; r++) {
      const remaining = totalRounds - r
      const userScored = Math.random() < 0.75
      const rivalScored = Math.random() < 0.75
      if (userScored) us++
      if (rivalScored) them++
      kicks.push({ team: "user", scored: userScored, round: r })
      kicks.push({ team: "rival", scored: rivalScored, round: r })
      if (us > them + remaining || them > us + remaining) break
    }

    if (kicks.length === 10 && us === them) {
      let round = 6
      while (true) {
        const userScored = Math.random() < 0.75
        const rivalScored = Math.random() < 0.75
        if (userScored) us++
        if (rivalScored) them++
        kicks.push({ team: "user", scored: userScored, round })
        kicks.push({ team: "rival", scored: rivalScored, round })
        if (us !== them) break
        round++
      }
    }

    return { kicks, us, them }
  }

  let attempt = 0
  while (attempt < 100) {
    const { kicks, us, them } = tryGenerate()
    const userWon = us > them
    if ((result === "won" && userWon) || (result === "lost" && !userWon)) {
      return kicks
    }
    attempt++
  }
  return []
}

function PenaltyShootoutView({
  result,
  onComplete,
}: {
  result: { penaltyResult: "won" | "lost" | null }
  onComplete: () => void
}) {
  const allKicks = useRef<PenaltyKick[]>([])
  const [shown, setShown] = useState(0)
  const [done, setDone] = useState(false)
  const suddenDeathRef = useRef(false)

  if (allKicks.current.length === 0) {
    allKicks.current = generatePenaltyKicks(result.penaltyResult ?? "lost")
  }

  const kickRef = useRef(0)
  useEffect(() => {
    if (done) return
    const interval = setInterval(() => {
      const idx = kickRef.current
      if (idx >= allKicks.current.length) {
        setDone(true)
        clearInterval(interval)
        return
      }

      setShown((s) => s + 1)

      const completedAfter = idx + 1
      const prevKicks = allKicks.current.slice(0, completedAfter)
      const u = prevKicks.filter((k) => k.team === "user")
      const r = prevKicks.filter((k) => k.team === "rival")
      if (u.length > 0 && u.length === r.length) {
        const us = u.filter((k) => k.scored).length
        const them = r.filter((k) => k.scored).length
        const roundsDone = u.length

        if (roundsDone >= 5) {
          if (us !== them) {
            setDone(true)
            clearInterval(interval)
            return
          }
          suddenDeathRef.current = true
        } else {
          const remaining = 5 - roundsDone
          if (us > them + remaining || them > us + remaining) {
            setDone(true)
            clearInterval(interval)
            return
          }
        }
      }

      kickRef.current = idx + 1
    }, 1200)
    return () => clearInterval(interval)
  }, [done])

  useEffect(() => {
    if (done) {
      const t = setTimeout(onComplete, 2000)
      return () => clearTimeout(t)
    }
  }, [done, onComplete])

  const allUserKicks = allKicks.current.filter((k) => k.team === "user")
  const allRivalKicks = allKicks.current.filter((k) => k.team === "rival")
  const displayedKicks = allKicks.current.slice(0, shown)
  const userKicks = displayedKicks.filter((k) => k.team === "user")
  const rivalKicks = displayedKicks.filter((k) => k.team === "rival")
  const userScore = userKicks.filter((k) => k.scored).length
  const rivalScore = rivalKicks.filter((k) => k.scored).length
  const suddenDeath = suddenDeathRef.current

  const normalRounds = 5
  const sdRounds = done && suddenDeath ? Math.max(0, Math.max(allUserKicks.length, allRivalKicks.length) - 5) : 0

  return (
    <div className="border border-zinc-700 rounded-xl p-4 bg-zinc-900/80 mt-3">
      <h3 className="text-sm font-bold text-center mb-3 uppercase tracking-wide text-zinc-300">
        Tanda de penales
        {suddenDeath && (
          <span className="text-yellow-500 ml-2">(Muerte súbita)</span>
        )}
      </h3>

      <div className="flex justify-center gap-8">
        <div className="text-center">
          <p className="text-xs text-zinc-500 mb-2">Tu equipo</p>
          <div className="flex flex-wrap justify-center gap-1 max-w-[200px]">
            {Array.from({ length: normalRounds }).map((_, i) => {
              const kick = userKicks[i]
              return (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border ${
                    kick
                      ? kick.scored
                        ? "bg-emerald-900/60 border-emerald-600"
                        : "bg-red-900/60 border-red-600"
                      : "bg-zinc-800 border-zinc-700"
                  }`}
                >
                  {kick ? (kick.scored ? "⚽" : "✕") : i === userKicks.length ? (
                    <span className="animate-pulse text-zinc-500">•</span>
                  ) : (
                    ""
                  )}
                </div>
              )
            })}
            {sdRounds > 0 && (
              <>
                <div className="w-full h-px bg-zinc-700 my-1" />
                {Array.from({ length: sdRounds }).map((_, i) => {
                  const kick = userKicks[5 + i]
                  return (
                    <div
                      key={`sd-${i}`}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border ${
                        kick
                          ? kick.scored
                            ? "bg-emerald-900/60 border-emerald-600"
                            : "bg-red-900/60 border-red-600"
                          : "bg-zinc-800 border-zinc-700"
                      }`}
                    >
                      {kick ? (kick.scored ? "⚽" : "✕") : i === userKicks.length - 5 ? (
                        <span className="animate-pulse text-zinc-500">•</span>
                      ) : (
                        ""
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
          <p className="text-lg font-black mt-2">{userScore}</p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <p className="text-2xl font-black text-zinc-600">:</p>
        </div>

        <div className="text-center">
          <p className="text-xs text-zinc-500 mb-2">Rival</p>
          <div className="flex flex-wrap justify-center gap-1 max-w-[200px]">
            {Array.from({ length: normalRounds }).map((_, i) => {
              const kick = rivalKicks[i]
              return (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border ${
                    kick
                      ? kick.scored
                        ? "bg-emerald-900/60 border-emerald-600"
                        : "bg-red-900/60 border-red-600"
                      : "bg-zinc-800 border-zinc-700"
                  }`}
                >
                  {kick ? (kick.scored ? "⚽" : "✕") : i === rivalKicks.length ? (
                    <span className="animate-pulse text-zinc-500">•</span>
                  ) : (
                    ""
                  )}
                </div>
              )
            })}
            {sdRounds > 0 && (
              <>
                <div className="w-full h-px bg-zinc-700 my-1" />
                {Array.from({ length: sdRounds }).map((_, i) => {
                  const kick = rivalKicks[5 + i]
                  return (
                    <div
                      key={`sd-${i}`}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border ${
                        kick
                          ? kick.scored
                            ? "bg-emerald-900/60 border-emerald-600"
                            : "bg-red-900/60 border-red-600"
                          : "bg-zinc-800 border-zinc-700"
                      }`}
                    >
                      {kick ? (kick.scored ? "⚽" : "✕") : i === rivalKicks.length - 5 ? (
                        <span className="animate-pulse text-zinc-500">•</span>
                      ) : (
                        ""
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
          <p className="text-lg font-black mt-2">{rivalScore}</p>
        </div>
      </div>

      {done && (
        <p className="text-center text-sm font-bold mt-3 text-zinc-200">
          {result.penaltyResult === "won" ? "¡Ganaste por penales!" : "Perdiste por penales"}
        </p>
      )}
    </div>
  )
}

function EventItem({
  event,
  visible,
  delay,
}: {
  event: MatchEvent
  visible: boolean
  delay: number
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [visible, delay])

  if (!show) return null

  return (
    <div
      className={`flex items-start gap-2 text-sm p-2 rounded-lg border ${EVENT_STYLES[event.event_type] ?? "border-zinc-800"} animate-in fade-in slide-in-from-left-2 duration-300`}
    >
      <span className="text-xs text-zinc-500 w-8 shrink-0 font-mono">
        {event.minute}&apos;
      </span>
      <span className="text-zinc-200">{event.description ?? event.event_type}</span>
    </div>
  )
}

export function MatchAnimator({
  round,
  onComplete,
}: {
  round: RoundResult
  onComplete: () => void
}) {
  const [phase, setPhase] = useState<"intro" | "playing" | "penalties" | "done">("intro")
  const [visibleCount, setVisibleCount] = useState(0)
  const [liveGF, setLiveGF] = useState(0)
  const [liveGA, setLiveGA] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setPhase("playing"), 2000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase !== "playing") return
    if (visibleCount >= round.events.length) {
      // All events shown — check penalties
      if (round.wentToPenalties) {
        const t = setTimeout(() => setPhase("penalties"), 1500)
        return () => clearTimeout(t)
      } else {
        const t = setTimeout(() => setPhase("done"), 1500)
        return () => clearTimeout(t)
      }
      return
    }

    const event = round.events[visibleCount]
    const delay = event.event_type === "goal_for" || event.event_type === "goal_against" ? 800 : 600

    const t = setTimeout(() => {
      if (event.event_type === "goal_for") setLiveGF((g) => g + 1)
      if (event.event_type === "goal_against") setLiveGA((g) => g + 1)
      setVisibleCount((c) => c + 1)
    }, delay)
    return () => clearTimeout(t)
  }, [phase, visibleCount, round.events, round.wentToPenalties])

  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(onComplete, 2500)
      return () => clearTimeout(t)
    }
  }, [phase, onComplete])

  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-full border-4 border-zinc-600 border-t-zinc-300 animate-spin" />
        <p className="text-zinc-400 text-sm animate-pulse">Iniciando partido...</p>
        <p className="text-lg font-bold text-zinc-200">{round.roundName}</p>
        <p className="text-zinc-500 text-sm">vs {round.rivalTeamName} ({round.rivalYear})</p>
      </div>
    )
  }

  const won =
    round.goalsFor > round.goalsAgainst ||
    (round.goalsFor === round.goalsAgainst && round.penaltyResult === "won")

  return (
    <div className="space-y-3">
      {/* Scoreboard */}
      <div
        className={`border rounded-xl p-4 transition-colors duration-700 ${
          phase === "done" || phase === "penalties"
            ? won
              ? "border-emerald-700 bg-emerald-950/30"
              : "border-red-700 bg-red-950/30"
            : "border-zinc-700 bg-zinc-900/50"
        }`}
      >
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
          {round.roundName}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-sm font-bold text-zinc-200">Tu equipo</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-4xl font-black transition-all duration-500 ${
                liveGF > 0 ? "text-emerald-400 scale-110" : "text-zinc-100"
              }`}
            >
              {liveGF}
            </span>
            <span className="text-zinc-600 font-bold text-2xl">-</span>
            <span
              className={`text-4xl font-black transition-all duration-500 ${
                liveGA > 0 ? "text-red-400 scale-110" : "text-zinc-100"
              }`}
            >
              {liveGA}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-zinc-200">
              {round.rivalTeamName}
            </p>
            <p className="text-xs text-zinc-500">{round.rivalYear}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-500 rounded-full transition-all duration-500 ease-linear"
            style={{
              width: `${round.events.length > 0 ? (visibleCount / round.events.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Events timeline */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {round.events.map((ev, i) => (
          <EventItem key={i} event={ev} visible={i < visibleCount} delay={0} />
        ))}
      </div>

      {/* Penalty shootout */}
      {phase === "penalties" && (
        <PenaltyShootoutView
          result={{ penaltyResult: round.penaltyResult }}
          onComplete={() => setPhase("done")}
        />
      )}

      {/* Done state */}
      {phase === "done" && (
        <div className="text-center py-4 animate-in fade-in duration-500">
          <p className="text-lg font-black text-zinc-200">
            {won ? "¡Victoria!" : "Derrota"}
          </p>
          {round.wentToPenalties && (
            <p className="text-sm text-zinc-400">
              {round.penaltyResult === "won"
                ? "Ganaste por penales"
                : "Perdiste por penales"}
            </p>
          )}
          <p className="text-sm text-zinc-500 mt-1">
            {round.goalsFor} - {round.goalsAgainst}
          </p>
        </div>
      )}
    </div>
  )
}
