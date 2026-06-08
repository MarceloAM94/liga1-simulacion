import { createClient } from "@supabase/supabase-js"
import { resolve } from "path"
import { config } from "dotenv"
config({ path: resolve(".env.local") })

const NEW_COORDS = [
  { slot_index: 0,  x_percent: 0.50, y_percent: 0.08 },  // POR - más centrado en el área
  { slot_index: 1,  x_percent: 0.35, y_percent: 0.22 },  // DFC
  { slot_index: 2,  x_percent: 0.65, y_percent: 0.22 },  // DFC
  { slot_index: 3,  x_percent: 0.12, y_percent: 0.27 },  // LI - un paso adelante de DFC
  { slot_index: 4,  x_percent: 0.88, y_percent: 0.27 },  // LD - un paso adelante de DFC
  { slot_index: 5,  x_percent: 0.25, y_percent: 0.50 },  // MC izquierdo - mitad de campo
  { slot_index: 6,  x_percent: 0.50, y_percent: 0.50 },  // MC central - mitad de campo
  { slot_index: 7,  x_percent: 0.75, y_percent: 0.50 },  // MC derecho - mitad de campo
  { slot_index: 8,  x_percent: 0.20, y_percent: 0.78 },  // EI - más adelantado
  { slot_index: 9,  x_percent: 0.80, y_percent: 0.78 },  // ED - más adelantado
  { slot_index: 10, x_percent: 0.50, y_percent: 0.82 },  // DC - más adelantado
]

async function main() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: all } = await db.from("formation_slots").select("*").order("slot_index")
  if (!all) { console.log("No slots"); return }

  for (const s of all) {
    const fix = NEW_COORDS.find((c) => c.slot_index === s.slot_index)
    if (!fix) continue
    const { error } = await db
      .from("formation_slots")
      .update({ x_percent: fix.x_percent, y_percent: fix.y_percent })
      .eq("id", s.id)
    if (error) {
      console.error(`  ✗ Slot ${s.slot_index} (${s.position_code}): ${error.message}`)
    } else {
      console.log(`  ✓ Slot ${s.slot_index} (${s.position_code}): (${s.x_percent}, ${s.y_percent}) → (${fix.x_percent}, ${fix.y_percent})`)
    }
  }
  console.log("\nDone")
}

main().catch(console.error)
