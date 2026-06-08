import { createClient } from "@supabase/supabase-js"
import { resolve } from "path"
import { config } from "dotenv"

config({ path: resolve(".env.local") })

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Current 4-3-3 formation slots: update position_codes to Spanish
const SPANISH_SLOTS: { slot_index: number; position_code: string }[] = [
  { slot_index: 0, position_code: "POR" },
  { slot_index: 1, position_code: "DFC" },
  { slot_index: 2, position_code: "DFC" },
  { slot_index: 3, position_code: "LI" },
  { slot_index: 4, position_code: "LD" },
  { slot_index: 5, position_code: "MC" },
  { slot_index: 6, position_code: "MC" },
  { slot_index: 7, position_code: "MC" },
  { slot_index: 8, position_code: "EI" },
  { slot_index: 9, position_code: "ED" },
  { slot_index: 10, position_code: "DC" },
]

async function main() {
  const { data: slots } = await db.from("formation_slots").select("*")
  if (!slots) {
    console.log("No formation slots found")
    return
  }
  console.log(`Found ${slots.length} formation slots`)

  for (const s of SPANISH_SLOTS) {
    const { error } = await db
      .from("formation_slots")
      .update({ position_code: s.position_code })
      .eq("slot_index", s.slot_index)
    if (error) {
      console.error(`Error updating slot ${s.slot_index}:`, error.message)
    } else {
      console.log(`  ✓ Slot ${s.slot_index} → ${s.position_code}`)
    }
  }

  console.log("Done")
}

main().catch(console.error)
