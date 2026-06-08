type Phase = "welcome" | "drawn" | "selecting" | "assigning" | "complete"

interface DrawButtonProps {
  phase: Phase
  loading: boolean
  onDraw: () => void
}

export function DrawButton({ phase, loading, onDraw }: DrawButtonProps) {
  if (phase === "complete") {
    return (
      <button
        disabled
        className="px-6 py-2 bg-emerald-800 text-emerald-300 font-semibold rounded-xl cursor-not-allowed"
      >
        Simular
      </button>
    )
  }

  return (
    <button
      onClick={onDraw}
      disabled={loading || phase === "selecting"}
      className={`px-6 py-2 font-semibold rounded-xl transition-all
        ${
          loading
            ? "bg-zinc-700 text-zinc-400 cursor-wait"
            : "bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95"
        }
        ${phase === "selecting" ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {loading ? "Sorteando..." : "Tirar"}
    </button>
  )
}
