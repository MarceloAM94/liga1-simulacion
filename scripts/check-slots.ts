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

  const { data } = await db.from("formation_slots").select("*").order("slot_index")
  console.log("Slot | Pos | x%  | y%")
  console.log("-".repeat(30))
  for (const s of data ?? []) {
    console.log(`${String(s.slot_index).padStart(4)} | ${(s.position_code as string).padEnd(3)} | ${String(s.x_percent).padStart(4)} | ${String(s.y_percent).padStart(4)}`)
  }
}

main()
