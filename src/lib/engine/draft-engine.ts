import {
  getAvailableSeasons,
  getSquadPlayers,
  getSquadPlayerById,
  getFormationWithSlots,
  getGameSession,
  createGameSession,
  updateGameSession,
  getSelectedSlots,
  getSelectedSlotsWithPlayers,
  addSelectedSlot,
  getSeasonById,
  getTeamById,
} from "@/lib/data/repository"
import type {
  Season, Team, SquadPlayerWithPlayer, FormationSlot,
  SelectedSlot, GameSession, PositionCode, DrawResult,
} from "@/types/database"
import { getAvailablePositionCodes } from "@/types/positions"

function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export async function drawSquad(
  sessionId: string,
  formationId: string
): Promise<{ draw: DrawResult; availablePositions: PositionCode[] }> {
  let session = await getGameSession(sessionId)
  if (!session) {
    session = await createGameSession(sessionId, formationId)
  }

  const [formation, slots] = await Promise.all([
    getFormationWithSlots(formationId),
    getSelectedSlots(session.id),
  ])
  if (!formation) throw new Error("Formación no encontrada")

  const availablePositions = getAvailablePositionCodes(
    formation.slots,
    slots
  ) as PositionCode[]

  if (availablePositions.length === 0) {
    throw new Error("Todas las posiciones están ocupadas")
  }

  const drawnSeasonIds = session.drawn_season_ids

  const candidateSeasons = await getAvailableSeasons()
  const validSeasons = candidateSeasons.filter((s) => {
    if (drawnSeasonIds.includes(s.id)) return false
    return true
  })

  const seasonsWithPlayers: (typeof validSeasons) = []

  for (const s of validSeasons) {
    const squad = await getSquadPlayers(s.id)
    const hasUseful = squad.some((sp) =>
      sp.positions.some((pos) => availablePositions.includes(pos as PositionCode))
    )
    if (hasUseful) {
      seasonsWithPlayers.push(s)
    }
  }

  if (seasonsWithPlayers.length === 0) {
    throw new Error("No hay más equipos disponibles para sortear")
  }

  const drawn = randomPick(seasonsWithPlayers)

  const allSquad = await getSquadPlayers(drawn.id)
  const usefulPlayers = allSquad.filter((sp) =>
    sp.positions.some((pos) => availablePositions.includes(pos as PositionCode))
  )
  const disabledPlayers = allSquad.filter(
    (sp) => !usefulPlayers.includes(sp)
  )

  const sortedSquad = [...usefulPlayers, ...disabledPlayers]

  await updateGameSession(session.id, {
    drawn_season_ids: [...drawnSeasonIds, drawn.id],
  })

  return {
    draw: {
      season: drawn,
      team: drawn.team,
      squad_players: sortedSquad,
    },
    availablePositions,
  }
}

export async function assignPlayer(
  sessionId: string,
  squadPlayerId: string,
  slotIndex: number
): Promise<{
  selectedSlot: SelectedSlot & { player_name: string }
  isComplete: boolean
  occupiedPositions: PositionCode[]
}> {
  const session = await getGameSession(sessionId)
  if (!session) throw new Error("Sesión no encontrada")

  const slots = await getSelectedSlots(session.id)
  if (slots.some((s) => s.slot_index === slotIndex)) {
    throw new Error("Este slot ya está ocupado")
  }

  const formation = await getFormationWithSlots(session.formation_id)
  if (!formation) throw new Error("Formación no encontrada")

  const slot = formation.slots.find((s) => s.slot_index === slotIndex)
  if (!slot) throw new Error("Slot inválido")

  const player = await getSquadPlayerById(squadPlayerId)
  if (!player) throw new Error("Jugador no encontrado")

  if (!player.positions.includes(slot.position_code)) {
    throw new Error("Este jugador no puede jugar en esa posición")
  }

  const playerSeason = await getSeasonById(player.season_id)
  const teamName = playerSeason
    ? (await getTeamById(playerSeason.team_id))?.name ?? ""
    : ""
  const seasonYear = playerSeason?.year ?? 0

  const savedSlot = await addSelectedSlot({
    game_session_id: session.id,
    slot_index: slotIndex,
    squad_player_id: squadPlayerId,
    position_code: slot.position_code,
    team_name: teamName,
    season_year: seasonYear,
  })
  const selectedSlot = { ...savedSlot, player_name: player.player.name }

  const updatedSlots = await getSelectedSlots(session.id)
  const isComplete = updatedSlots.length === 11
  const occupiedPositions = updatedSlots.map(
    (s) => s.position_code as PositionCode
  )

  if (isComplete && session.status === "draft") {
    await updateGameSession(session.id, { status: "simulating" })
  }

  return { selectedSlot, isComplete, occupiedPositions }
}

export async function getDraftState(sessionId: string) {
  const session = await getGameSession(sessionId)
  if (!session) return null

  const formation = await getFormationWithSlots(session.formation_id)
  const slots = await getSelectedSlotsWithPlayers(session.id)

  return {
    session,
    formation,
    slots,
  }
}
