import type { SquadPlayerWithPlayer } from "@/types/database"
import { translatePositions, sortByPosition } from "@/types/positions"

interface SquadListProps {
  players: SquadPlayerWithPlayer[]
  selectedPlayer: SquadPlayerWithPlayer | null
  availablePositionCodes: string[]
  onSelectPlayer: (player: SquadPlayerWithPlayer) => void
}

export function SquadList({
  players,
  selectedPlayer,
  availablePositionCodes,
  onSelectPlayer,
}: SquadListProps) {
  const sorted = sortByPosition(players)
  const usefulPlayers = sorted.filter((p) =>
    p.positions.some((pos) => availablePositionCodes.includes(pos))
  )
  const disabledPlayers = sorted.filter(
    (p) => !p.positions.some((pos) => availablePositionCodes.includes(pos))
  )

  return (
    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          Plantilla ({players.length})
        </h2>
      </div>
      <div className="overflow-y-auto max-h-[500px] divide-y divide-zinc-800/50">
        {usefulPlayers.map((player) => (
          <button
            key={player.id}
            onClick={() => onSelectPlayer(player)}
            className={`w-full text-left px-3 py-2.5 transition-colors flex items-center gap-3
              ${
                selectedPlayer?.id === player.id
                  ? "bg-emerald-900/40 border-l-2 border-emerald-500"
                  : "hover:bg-zinc-800/50 border-l-2 border-transparent"
              }
            `}
          >
            <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
              {player.rating}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {player.player.name}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {translatePositions(player.positions)}
              </p>
            </div>
          </button>
        ))}

        {disabledPlayers.map((player) => (
          <div
            key={player.id}
            className="px-3 py-2.5 flex items-center gap-3 opacity-30 cursor-not-allowed"
          >
            <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
              {player.rating}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-zinc-600">
                {player.player.name}
              </p>
              <p className="text-xs text-zinc-700 truncate">
                {translatePositions(player.positions)}
              </p>
            </div>
          </div>
        ))}

        {players.length === 0 && (
          <div className="p-6 text-center text-zinc-600 text-sm">
            Presiona "Tirar" para sortear un equipo
          </div>
        )}
      </div>
    </div>
  )
}
