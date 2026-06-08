import { createClient } from "@supabase/supabase-js"
import { resolve } from "path"
import { config } from "dotenv"
config({ path: resolve(".env.local") })

async function main() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Correct 4-3-3 layout (11 slots per formation)
  const CORRECT_SLOTS = [
    { slot_index: 0,  x_percent: 0.50, y_percent: 0.05 },  // POR
    { slot_index: 1,  x_percent: 0.35, y_percent: 0.22 },  // DFC
    { slot_index: 2,  x_percent: 0.65, y_percent: 0.22 },  // DFC
    { slot_index: 3,  x_percent: 0.12, y_percent: 0.22 },  // LI
    { slot_index: 4,  x_percent: 0.88, y_percent: 0.22 },  // LD
    { slot_index: 5,  x_percent: 0.25, y_percent: 0.48 },  // MC
    { slot_index: 6,  x_percent: 0.50, y_percent: 0.50 },  // MC
    { slot_index: 7,  x_percent: 0.75, y_percent: 0.48 },  // MC
    { slot_index: 8,  x_percent: 0.20, y_percent: 0.76 },  // EI
    { slot_index: 9,  x_percent: 0.80, y_percent: 0.76 },  // ED
    { slot_index: 10, x_percent: 0.50, y_percent: 0.78 },  // DC
  ]

  const { data: all } = await db.from("formation_slots").select("*").order("slot_index")
  if (!all) { console.log("No slots"); return }

  // Group by formation_id
  const formations = new Map<string, typeof all>()
  for (const s of all) {
    const list = formations.get(s.formation_id) ?? []
    list.push(s)
    formations.set(s.formation_id, list)
  }

  for (const [fid, slots] of formations) {
    console.log(`\nFormation ${fid}:`)
    for (const s of slots) {
      const fix = CORRECT_SLOTS.find((c) => c.slot_index === s.slot_index)
      if (!fix) continue
      const { error } = await db
        .from("formation_slots")
        .update({ x_percent: fix.x_percent, y_percent: fix.y_percent })
        .eq("id", s.id)
      if (error) {
        console.error(`  ✗ Slot ${s.slot_index}: ${error.message}`)
      } else {
        console.log(`  ✓ Slot ${s.slot_index} (${s.position_code}): (${s.x_percent}, ${s.y_percent}) → (${fix.x_percent}, ${fix.y_percent})`)
      }
    }
  }

  console.log("\nDone")
}

main().catch(console.error)
