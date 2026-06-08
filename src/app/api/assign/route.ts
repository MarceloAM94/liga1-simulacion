import { NextRequest, NextResponse } from "next/server"
import { assignPlayer } from "@/lib/engine/draft-engine"

export async function POST(request: NextRequest) {
  try {
    const { session_id, squad_player_id, slot_index } = await request.json()

    if (!session_id || !squad_player_id || slot_index === undefined) {
      return NextResponse.json(
        { error: "session_id, squad_player_id y slot_index son requeridos" },
        { status: 400 }
      )
    }

    const result = await assignPlayer(session_id, squad_player_id, slot_index)

    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al asignar"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
