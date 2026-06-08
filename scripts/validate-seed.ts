/**
 * Validation script for seed data.
 * Run with: npx tsx scripts/validate-seed.ts
 *
 * Checks:
 * - Each squad has 18+ players
 * - Each squad has 2+ GK
 * - Each squad has 4+ DEF players (CB, LB, RB, LWB, RWB)
 * - Each squad has 4+ MID players (CDM, CM, LM, RM, CAM)
 * - Each squad has 3+ ATK players (LW, RW, CF, ST)
 * - All ratings are between 60 and 99
 * - All position codes are valid
 */

import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

const DEF_POSITIONS = new Set(["CB", "LB", "RB", "LWB", "RWB"])
const MID_POSITIONS = new Set(["CDM", "CM", "LM", "RM", "CAM"])
const ATK_POSITIONS = new Set(["LW", "RW", "CF", "ST"])
const ALL_VALID_POSITIONS = new Set(["GK", ...DEF_POSITIONS, ...MID_POSITIONS, ...ATK_POSITIONS])

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
  console.log("⚠️  Supabase not configured. Running static validation of seed SQL file...\n")
  validateSeedFile()
  process.exit(0)
}

async function validateDatabase() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, year, team:teams(name)")

  if (!seasons) {
    console.error("No seasons found in database.")
    process.exit(1)
  }

  let errors = 0

  for (const season of seasons) {
    const teamName = (season.team as { name: string }).name
    const squadName = `${teamName} ${season.year}`

    const { data: squad } = await supabase
      .from("squad_players")
      .select("id, rating, positions")
      .eq("season_id", season.id)

    if (!squad) {
      console.log(`❌ ${squadName}: No squad data found`)
      errors++
      continue
    }

    const total = squad.length
    const gkCount = squad.filter((sp) => sp.positions.includes("GK")).length
    const defCount = squad.filter((sp) => sp.positions.some((p) => DEF_POSITIONS.has(p))).length
    const midCount = squad.filter((sp) => sp.positions.some((p) => MID_POSITIONS.has(p))).length
    const atkCount = squad.filter((sp) => sp.positions.some((p) => ATK_POSITIONS.has(p))).length

    const minRating = Math.min(...squad.map((sp) => sp.rating))
    const maxRating = Math.max(...squad.map((sp) => sp.rating))

    const invalidPositions = squad
      .flatMap((sp) => sp.positions)
      .filter((p) => !ALL_VALID_POSITIONS.has(p))

    const issues: string[] = []
    if (total < 18) issues.push(`menos de 18 jugadores (${total})`)
    if (gkCount < 2) issues.push(`menos de 2 GK (${gkCount})`)
    if (defCount < 4) issues.push(`menos de 4 defensas (${defCount})`)
    if (midCount < 4) issues.push(`menos de 4 mediocampistas (${midCount})`)
    if (atkCount < 3) issues.push(`menos de 3 atacantes (${atkCount})`)
    if (minRating < 60) issues.push(`rating mínimo ${minRating} < 60`)
    if (maxRating > 99) issues.push(`rating máximo ${maxRating} > 99`)
    if (invalidPositions.length > 0) issues.push(`posiciones inválidas: ${invalidPositions.join(", ")}`)

    if (issues.length > 0) {
      console.log(`❌ ${squadName}: ${issues.join("; ")}`)
      errors++
    } else {
      console.log(`✅ ${squadName}: ${total} jugadores, GK:${gkCount} DEF:${defCount} MID:${midCount} ATK:${atkCount} (${minRating}-${maxRating})`)
    }
  }

  if (errors > 0) {
    console.log(`\n⚠️  ${errors} squad(s) failed validation.`)
    process.exit(1)
  } else {
    console.log(`\n✅ All ${seasons.length} squads passed validation.`)
  }
}

function validateSeedFile() {
  const seedPath = path.join(process.cwd(), "supabase", "migrations", "002_seed.sql")
  const content = fs.readFileSync(seedPath, "utf-8")

  const playerMatches = content.matchAll(/rating\s+(\d+)/g)
  for (const match of playerMatches) {
    const rating = parseInt(match[1])
    if (rating < 60 || rating > 99) {
      console.log(`❌ Invalid rating ${rating} found in seed file.`)
      process.exit(1)
    }
  }

  const seasonBlocks = content.split("-- ======= ")
  let squadCount = 0

  for (const block of seasonBlocks) {
    if (!block.includes("INSERT INTO squad_players")) continue

    squadCount++
    const lines = block.split("\n")
    const squadName = block.split("\n")[0].trim().replace("= ", "").replace(" =======", "")

    const entries = lines.filter((l) => l.trim().startsWith("(") && l.includes("ARRAY["))
    const total = entries.length

    const gkCount = entries.filter((l) => l.includes("'GK'")).length
    const defCount = entries.filter((l) =>
      ["'CB'", "'LB'", "'RB'", "'LWB'", "'RWB'"].some((p) => l.includes(p))
    ).length
    const midCount = entries.filter((l) =>
      ["'CDM'", "'CM'", "'LM'", "'RM'", "'CAM'"].some((p) => l.includes(p))
    ).length
    const atkCount = entries.filter((l) =>
      ["'LW'", "'RW'", "'CF'", "'ST'"].some((p) => l.includes(p))
    ).length

    const issues: string[] = []
    if (total < 18) issues.push(`menos de 18 jugadores (${total})`)
    if (gkCount < 2) issues.push(`menos de 2 GK (${gkCount})`)
    if (defCount < 4) issues.push(`menos de 4 defensas (${defCount})`)
    if (midCount < 4) issues.push(`menos de 4 mediocampistas (${midCount})`)
    if (atkCount < 3) issues.push(`menos de 3 atacantes (${atkCount})`)

    if (issues.length > 0) {
      console.log(`❌ ${squadName}: ${issues.join("; ")}`)
    } else {
      console.log(`✅ ${squadName}: ${total} jugadores, GK:${gkCount} DEF:${defCount} MID:${midCount} ATK:${atkCount}`)
    }
  }

  console.log(`\n✅ Validated ${squadCount} squads in seed file.`)
}

if (require.main === module) {
  if (supabaseUrl && supabaseKey && !supabaseUrl.includes("placeholder")) {
    validateDatabase()
  } else {
    validateSeedFile()
  }
}
