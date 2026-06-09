"use client"

import { useRef, useState, useEffect } from "react"
import { toPng } from "html-to-image"
import type { CardData } from "@/types/database"

const POSITION_LABELS: Record<string, string> = {
  POR: "POR",
  DFC: "DFC",
  LI: "LI",
  LD: "LD",
  MC: "MC",
  MCD: "MCD",
  MI: "MI",
  MD: "MD",
  CAM: "CAM",
  EI: "EI",
  ED: "ED",
  DC: "DC",
  SD: "SD",
  CAI: "CAI",
  CAD: "CAD",
}

interface CardGeneratorProps {
  cardData: CardData
  isChampion: boolean
}

export function CardGenerator({ cardData, isChampion }: CardGeneratorProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDownload = async () => {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 })
      const link = document.createElement("a")
      link.download = "card.png"
      link.href = dataUrl
      link.click()
    } catch {
      alert("Error al generar la imagen")
    }
  }

  const handleCopy = async () => {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 })
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert("Error al copiar la imagen")
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={cardRef}
        className="w-[640px] rounded-2xl overflow-hidden"
        style={{
          background: isChampion
            ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)"
            : "linear-gradient(135deg, #111 0%, #1a1a1a 50%, #111 100%)",
          border: isChampion ? "2px solid #eab308" : "1px solid #3f3f46",
        }}
      >
        {/* Header accent */}
        <div
          className="h-2"
          style={{
            background: isChampion
              ? "linear-gradient(90deg, #eab308, #f59e0b, #eab308)"
              : "linear-gradient(90deg, #52525b, #71717a, #52525b)",
          }}
        />

        <div className="p-8">
          {/* Title */}
          <div className="text-center mb-6">
            <h1
              className={`text-3xl font-black tracking-wider uppercase ${
                isChampion ? "text-yellow-400" : "text-zinc-300"
              }`}
            >
              {isChampion ? "¡Campeón!" : "Torneo finalizado"}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Llegaste hasta:{" "}
              <span className="font-semibold text-zinc-300">{cardData.phase_reached}</span>
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-zinc-900/80 rounded-xl p-4 text-center border border-zinc-800">
              <p className="text-2xl font-black text-emerald-400">{cardData.goals_for}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">Goles a favor</p>
            </div>
            <div className="bg-zinc-900/80 rounded-xl p-4 text-center border border-zinc-800">
              <p className="text-2xl font-black text-red-400">{cardData.goals_against}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">Goles en contra</p>
            </div>
            <div className="bg-zinc-900/80 rounded-xl p-4 text-center border border-zinc-800">
              <p className="text-2xl font-black text-zinc-100">{cardData.wins}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">Victorias</p>
            </div>
            <div className="bg-zinc-900/80 rounded-xl p-4 text-center border border-zinc-800">
              <p className="text-2xl font-black text-zinc-100">{cardData.team_overall}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">Overall</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-800 mb-4" />

          {/* Squad title */}
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Plantilla
          </h2>

          {/* Player list */}
          <div className="space-y-1.5">
            {cardData.players.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-zinc-900/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 text-xs font-mono text-zinc-600 shrink-0">
                    {POSITION_LABELS[p.position_code] ?? p.position_code}
                  </span>
                  <span className="text-sm text-zinc-200 truncate">{p.display_name}</span>
                </div>
                <span className="text-xs font-mono text-zinc-500 shrink-0 ml-3">
                  {p.rating}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[10px] text-zinc-700 tracking-widest uppercase">
              Liga1 Simulador
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          disabled={!mounted}
          className="px-5 py-3 bg-zinc-800 rounded-xl text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          Descargar card
        </button>
        <button
          onClick={handleCopy}
          disabled={!mounted}
          className="px-5 py-3 bg-zinc-800 rounded-xl text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {copied ? "¡Copiada!" : "Copiar imagen"}
        </button>
      </div>
    </div>
  )
}
