import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"
import { randomUUID } from "crypto"
import { config } from "dotenv"

config({ path: resolve(".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase env vars")
  process.exit(1)
}

const db = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

const POSITION_MAP: Record<string, string> = {
  POR: "GK",
  DFC: "CB",
  LI: "LB",
  LD: "RB",
  MC: "CM",
  EI: "LW",
  ED: "RW",
  DC: "ST",
}

interface PlayerJson {
  id: string
  nombre: string
  numero: number
  rating: number
  posiciones: string[]
}

interface TeamJson {
  id: string
  nombre: string
  ciudad: string
  estadio: string
  rating_promedio_club: number
  jugadores: PlayerJson[]
}

interface SeedData {
  temporada: number
  liga: string
  equipos: TeamJson[]
}

function mapPositions(positions: string[]): string[] {
  return positions.map((p) => POSITION_MAP[p] ?? p)
}

async function deleteAll(table: string): Promise<boolean> {
  const uuidTables = ["teams", "seasons", "players", "squad_players", "game_sessions"]
  if (uuidTables.includes(table)) {
    const { error } = await db.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000")
    if (error) {
      console.error(`Error clearing ${table}:`, error.message)
      return false
    }
  } else {
    const { error } = await db.from(table).delete().gte("id", 1)
    if (error) {
      console.error(`Error clearing ${table}:`, error.message)
      return false
    }
  }
  console.log(`  ✓ Cleared ${table}`)
  return true
}

async function clearAll() {
  const tables = [
    "match_events",
    "match_results",
    "tournament_rounds",
    "selected_slots",
    "game_sessions",
    "squad_players",
    "players",
    "seasons",
    "teams",
  ]
  for (const table of tables) {
    const ok = await deleteAll(table)
    if (!ok) return false
  }
  return true
}

async function seed() {
  console.log("Reading seed data...")
  const raw = readFileSync(resolve("data/seed-2026.json"), "utf-8")
  const data: SeedData = JSON.parse(raw)

  console.log(`Seeding ${data.equipos.length} teams for ${data.temporada}...`)

  console.log("\nClearing existing data...")
  const cleared = await clearAll()
  if (!cleared) {
    process.exit(1)
  }

  for (const team of data.equipos) {
    console.log(`\n--- ${team.nombre} ---`)

    // Insert team
    const teamId = randomUUID()
    const { error: teamErr } = await db.from("teams").insert({
      id: teamId,
      name: team.nombre,
      short_name: team.nombre.split("(")[0].trim(),
      badge_url: "",
      primary_color: "#FFFFFF",
      secondary_color: "#000000",
      city: team.ciudad,
      founded_year: 2026,
      is_active: true,
    })
    if (teamErr) {
      console.error(`  ✗ Error inserting team:`, teamErr.message)
      continue
    }
    console.log(`  ✓ Team: ${team.nombre}`)

    // Insert season
    const seasonId = randomUUID()
    const { error: seasonErr } = await db.from("seasons").insert({
      id: seasonId,
      team_id: teamId,
      year: data.temporada,
      league: data.liga,
      title_won: false,
      is_available_for_draw: true,
    })
    if (seasonErr) {
      console.error(`  ✗ Error inserting season:`, seasonErr.message)
      continue
    }
    console.log(`  ✓ Season: ${data.temporada}`)

    const playerRows = team.jugadores.map((p) => {
      const playerId = randomUUID()
      return {
        player: {
          id: playerId,
          name: p.nombre,
          display_name: p.nombre,
          nationality: "PE",
        },
        squadPlayer: {
          season_id: seasonId,
          player_id: playerId,
          rating: p.rating,
          positions: mapPositions(p.posiciones),
          jersey_number: p.numero,
          is_key_player: p.rating >= 76,
        },
      }
    })

    const { error: pErr } = await db.from("players").insert(playerRows.map((r) => r.player))
    if (pErr) {
      console.error(`  ✗ Error inserting players for ${team.nombre}:`, pErr.message)
      continue
    }

    const { error: sErr } = await db.from("squad_players").insert(playerRows.map((r) => r.squadPlayer))
    if (sErr) {
      console.error(`  ✗ Error inserting squad_players for ${team.nombre}:`, sErr.message)
      continue
    }
    console.log(`  ✓ ${team.jugadores.length} players inserted`)
  }

  console.log("\n✓ Seed completed successfully!")
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
