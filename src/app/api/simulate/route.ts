import { NextRequest, NextResponse } from "next/server"
import { getGameSession, getFormationWithSlots, getSelectedSlotsWithPlayers, updateGameSession, deleteTournamentRounds } from "@/lib/data/repository"
import { simulateTournament } from "@/lib/engine/simulation-engine"

export async function POST(request: NextRequest) {
  try {
    const { session_id, force } = await request.json()

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

    if (force) {
      await deleteTournamentRounds(session.id.toString())
      await updateGameSession(session.id.toString(), { status: "draft" })
    } else if (session.status === "finished") {
      return NextResponse.json(
        { error: "Esta sesión ya fue simulada" },
        { status: 400 }
      )
    }

    const slots = await getSelectedSlotsWithPlayers(session.id.toString())
    if (slots.length < 11) {
      return NextResponse.json(
        { error: "Debes completar los 11 jugadores antes de simular" },
        { status: 400 }
      )
    }

    const formation = await getFormationWithSlots(session.formation_id)
    const formationSlots = formation?.slots ?? []

    const result = await simulateTournament(
      session.id.toString(),
      formationSlots,
      slots
    )

    await updateGameSession(session.id.toString(), { status: "finished" })

    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al simular"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
