import { NextRequest, NextResponse } from "next/server"
import { drawSquad } from "@/lib/engine/draft-engine"

export async function POST(request: NextRequest) {
  try {
    const { session_id, formation_id } = await request.json()

    if (!session_id || !formation_id) {
      return NextResponse.json(
        { error: "session_id y formation_id son requeridos" },
        { status: 400 }
      )
    }

    const result = await drawSquad(session_id, formation_id)

    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al sortear"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
