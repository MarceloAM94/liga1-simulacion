type Phase = "welcome" | "drawn" | "selecting" | "assigning" | "complete"

interface DrawButtonProps {
  phase: Phase
  loading: boolean
  onDraw: () => void
  onSimulate?: () => void
}

export function DrawButton({ phase, loading, onDraw, onSimulate }: DrawButtonProps) {
  if (phase === "complete") {
    return (
      <button
        onClick={onSimulate}
        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        Simular
      </button>
    )
  }

  return (
    <button
      onClick={onDraw}
      disabled={loading || phase === "selecting"}
      className={`px-6 py-2.5 font-semibold rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
        ${
          loading
            ? "bg-zinc-700 text-zinc-400 cursor-wait"
            : "bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.02] active:scale-[0.98]"
        }
        ${phase === "selecting" ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {loading ? "Sorteando..." : "Tirar"}
    </button>
  )
}
