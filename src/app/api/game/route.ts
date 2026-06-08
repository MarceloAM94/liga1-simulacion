import { NextRequest, NextResponse } from "next/server"
import { getDraftState } from "@/lib/engine/draft-engine"

export async function GET(request: NextRequest) {
  try {
    const session_id = request.nextUrl.searchParams.get("session_id")

    if (!session_id) {
      return NextResponse.json(
        { error: "session_id es requerido" },
        { status: 400 }
      )
    }

    const state = await getDraftState(session_id)

    if (!state) {
      return NextResponse.json(
        { error: "Sesión no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(state)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al obtener estado"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
