const fs = require("fs")
const sql = fs.readFileSync("supabase/migrations/002_seed.sql", "utf8")

// Fix player names with unescaped single quotes
const fixes: Record<string, string> = {
  "'Luis Alberto 'Cuto'' Guadalupe'": "'Luis Alberto ''Cuto'' Guadalupe'",
  "'José Luis 'Puma'' Carranza'": "'José Luis ''Puma'' Carranza'",
  "'Víctor 'Pitín' Salas'": "'Víctor ''Pitín'' Salas'",
}

let fixed = sql
for (const [old, nu] of Object.entries(fixes)) {
  fixed = fixed.replace(old, nu)
}

fs.writeFileSync("supabase/migrations/002_seed.sql", fixed)
console.log("Fixed quotes")
