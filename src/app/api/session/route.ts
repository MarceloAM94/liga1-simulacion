import { NextRequest, NextResponse } from "next/server"
import { createGameSession } from "@/lib/data/repository"

export async function POST(request: NextRequest) {
  try {
    const { session_id, formation_id } = await request.json()

    if (!session_id || !formation_id) {
      return NextResponse.json(
        { error: "session_id y formation_id son requeridos" },
        { status: 400 }
      )
    }

    const session = await createGameSession(session_id, formation_id)

    return NextResponse.json({ session })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al crear sesión"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
