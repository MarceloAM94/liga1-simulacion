"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { TournamentProgression } from "@/components/simulate/tournament-progression"
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
  status: string
}

function SimulateContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")

  const [data, setData] = useState<TournamentData | null>(null)
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
        <div className="flex flex-col items-center gap-4 animate-scale-in">
          <div className="w-12 h-12 rounded-full border-4 border-zinc-600 border-t-zinc-300 animate-spin" />
          <p className="text-zinc-400 animate-pulse-soft">Cargando resultados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 animate-scale-in">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => router.push("/draft")}
          className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          Volver al draft
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center animate-scale-in">
        <p className="text-zinc-500">Sin datos</p>
      </div>
    )
  }

  if (data.status === "draft") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 animate-scale-in">
        <div className="bg-amber-900/50 border border-amber-700 text-amber-200 px-5 py-3 rounded-xl text-sm">
          Este torneo aún no se ha simulado.
        </div>
        <button
          onClick={() => router.push("/draft")}
          className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          Ir al draft
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-left">
      <TournamentProgression data={data} sessionId={sessionId!} />
    </div>
  )
}

export default function SimulatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4 animate-scale-in">
            <div className="w-12 h-12 rounded-full border-4 border-zinc-600 border-t-zinc-300 animate-spin" />
            <p className="text-zinc-400 animate-pulse-soft">Cargando...</p>
          </div>
        </div>
      }
    >
      <SimulateContent />
    </Suspense>
  )
}
