import { NextRequest, NextResponse } from "next/server"
import { getGameSession, getFormationWithSlots, getSelectedSlotsWithPlayers, getTournamentRounds, getMatchResult, getMatchEvents } from "@/lib/data/repository"
import { getSeasonById } from "@/lib/data/repository"
import { calculateLineRatings } from "@/lib/engine/simulation-engine"
import type { CardData, CardPlayer } from "@/types/database"

export async function GET(request: NextRequest) {
  try {
    const session_id = request.nextUrl.searchParams.get("session_id")

    if (!session_id) {
      return NextResponse.json(
        { error: "session_id es requerido" },
        { status: 400 }
      )
    }

    const session = await getGameSession(session_id)
    if (!session) {
      return NextResponse.json(
        { error: "Sesión no encontrada" },
        { status: 404 }
      )
    }

    const rounds = await getTournamentRounds(session.id.toString())

    if (rounds.length === 0) {
      return NextResponse.json(
        { error: "No hay resultados aún. Primero debes simular." },
        { status: 404 }
      )
    }

    const roundsWithResults = await Promise.all(
      rounds.map(async (round) => {
        const matchResult = await getMatchResult(round.id as number)
        const season = await getSeasonById(round.rival_season_id)
        const rivalTeamName = season?.team?.name ?? "Desconocido"
        const rivalYear = season?.year ?? 0
        const events = matchResult ? await getMatchEvents(matchResult.id as number) : []

        return {
          roundIndex: round.round_index,
          roundName: round.round_name,
          rivalSeasonId: round.rival_season_id,
          rivalTeamName,
          rivalYear,
          goalsFor: matchResult?.goals_for ?? 0,
          goalsAgainst: matchResult?.goals_against ?? 0,
          wentToPenalties: matchResult?.went_to_penalties ?? false,
          penaltyResult: matchResult?.penalty_result ?? null,
          events,
        }
      })
    )

    const slots = await getSelectedSlotsWithPlayers(session.id.toString())
    const userRatings = calculateLineRatings(slots)

    const totalGf = roundsWithResults.reduce((s, r) => s + r.goalsFor, 0)
    const totalGa = roundsWithResults.reduce((s, r) => s + r.goalsAgainst, 0)
    const wins = roundsWithResults.filter(
      (r) => r.goalsFor > r.goalsAgainst || (r.goalsFor === r.goalsAgainst && r.penaltyResult === "won")
    ).length

    const lastRound = roundsWithResults[roundsWithResults.length - 1]
    const isChampion = lastRound
      ? lastRound.goalsFor > lastRound.goalsAgainst ||
        (lastRound.goalsFor === lastRound.goalsAgainst && lastRound.penaltyResult === "won")
      : false

    const lastWon = isChampion
    const eliminatedIn = lastWon
      ? "Campeón"
      : (lastRound?.roundName ?? "Desconocida")

    const cardPlayers: CardPlayer[] = slots.map((s) => ({
      name: s.player_name ?? "",
      display_name: s.display_name ?? "",
      position_code: s.position_code,
      rating: s.rating ?? 70,
      team_origin: s.team_name,
      season_year: s.season_year,
    }))

    const cardData: CardData = {
      phase_reached: eliminatedIn,
      goals_for: totalGf,
      goals_against: totalGa,
      team_overall: userRatings.overall,
      wins,
      players: cardPlayers,
    }

    return NextResponse.json({
      rounds: roundsWithResults,
      eliminatedIn,
      isChampion: lastWon,
      cardData,
      status: session.status,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al obtener resultados"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
