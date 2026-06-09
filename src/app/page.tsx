"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function makeId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

const DEFAULT_FORMATION_ID = "f1000000-0000-0000-0000-000000000001"

export default function Welcome() {
  const router = useRouter()
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    const existing = localStorage.getItem("liga1_session_id")
    if (!existing) {
      localStorage.setItem("liga1_session_id", makeId())
    }
  }, [])

  const handleStart = async () => {
    setStarting(true)
    let sessionId = localStorage.getItem("liga1_session_id")
    if (!sessionId) {
      sessionId = makeId()
      localStorage.setItem("liga1_session_id", sessionId)
    }

    try {
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          formation_id: DEFAULT_FORMATION_ID,
        }),
      })
    } catch {
      // session may already exist, that's ok
    }

    router.push("/draft")
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 animate-slide-up">
      <div className="flex flex-col items-center gap-8 text-center max-w-lg">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">
            Liga 1 Perú
          </h1>
          <p className="text-xl text-zinc-400 font-medium">
            Simulador
          </p>
        </div>

        <p className="text-zinc-500 leading-relaxed">
          Arma tu once histórico con jugadores de distintas épocas.
          Sortea equipos, coloca a tus figuras, y lucha por el título.
        </p>

        <button
          onClick={handleStart}
          disabled={starting}
          className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700
                     text-white font-semibold rounded-xl text-lg transition-all
                     hover:scale-[1.02] active:scale-[0.98]
                     focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          {starting ? "Preparando..." : "Comenzar"}
        </button>

        <p className="text-xs text-zinc-600 mt-4">
          Inspirado en 7a0 —
          <span className="text-zinc-500"> El clásico juego de fútbol peruano</span>
        </p>
      </div>
    </div>
  )
}
