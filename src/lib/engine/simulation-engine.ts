import {
  getSquadPlayers,
  getAvailableSeasons,
  createTournamentRound,
  createMatchResult,
  createMatchEvents,
} from "@/lib/data/repository"
import type {
  SelectedSlot, MatchEvent, SquadPlayerWithPlayer,
  CardData, CardPlayer,
} from "@/types/database"

export interface LineRatings {
  gk: number
  defense: number
  midfield: number
  attack: number
  overall: number
}

export interface SimulatedMatch {
  roundIndex: number
  roundName: string
  rivalSeasonId: string
  rivalTeamName: string
  rivalYear: number
  rivalOverall: number
  goalsFor: number
  goalsAgainst: number
  wentToPenalties: boolean
  penaltyResult: "won" | "lost" | null
  events: MatchEvent[]
  ratings: LineRatings
}

export interface TournamentResult {
  rounds: SimulatedMatch[]
  eliminatedIn: string
  isChampion: boolean
  cardData: CardData
}

function avg(nums: number[]): number {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat(min, max + 1))
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

const ROUND_NAMES = [
  "Octavos de final",
  "Cuartos de final",
  "Semifinal",
  "Final",
  "Gran Final",
]

export function calculateLineRatings(slots: SelectedSlot[]): LineRatings {
  const defPos = ["GK", "CB", "LB", "RB", "LWB", "RWB"]
  const midPos = ["CDM", "CM", "LM", "RM", "CAM"]
  const atkPos = ["LW", "RW", "CF", "ST"]

  let gk = 70
  const def: number[] = []
  const mid: number[] = []
  const atk: number[] = []

  for (const s of slots) {
    if (s.position_code === "GK") {
      gk = s.rating ?? 70
    } else if (defPos.includes(s.position_code)) {
      def.push(s.rating ?? 70)
    } else if (midPos.includes(s.position_code)) {
      mid.push(s.rating ?? 70)
    } else if (atkPos.includes(s.position_code)) {
      atk.push(s.rating ?? 70)
    }
  }

  const defAvg = avg(def)
  const midAvg = avg(mid)
  const atkAvg = avg(atk)

  return {
    gk,
    defense: defAvg,
    midfield: midAvg,
    attack: atkAvg,
    overall: Math.round(gk * 0.15 + defAvg * 0.25 + midAvg * 0.30 + atkAvg * 0.30),
  }
}

export function calculateRivalLineRatings(
  squad: SquadPlayerWithPlayer[],
  formationSlots: { position_code: string }[]
): LineRatings {
  const defPos = ["GK", "CB", "LB", "RB", "LWB", "RWB"]
  const midPos = ["CDM", "CM", "LM", "RM", "CAM"]
  const atkPos = ["LW", "RW", "CF", "ST"]

  const def: number[] = []
  const mid: number[] = []
  const atk: number[] = []
  let gk = 70

  for (const slot of formationSlots) {
    const best = squad
      .filter((sp) => sp.positions.includes(slot.position_code))
      .sort((a, b) => b.rating - a.rating)[0]
    if (!best) continue

    if (slot.position_code === "GK") {
      gk = best.rating
    } else if (defPos.includes(slot.position_code)) {
      def.push(best.rating)
    } else if (midPos.includes(slot.position_code)) {
      mid.push(best.rating)
    } else if (atkPos.includes(slot.position_code)) {
      atk.push(best.rating)
    }
  }

  const defAvg = avg(def)
  const midAvg = avg(mid)
  const atkAvg = avg(atk)

  return {
    gk,
    defense: defAvg,
    midfield: midAvg,
    attack: atkAvg,
    overall: Math.round(gk * 0.15 + defAvg * 0.25 + midAvg * 0.30 + atkAvg * 0.30),
  }
}

export function simulateMatch(
  userRatings: LineRatings,
  rivalRatings: LineRatings,
  keyPlayerBonus: boolean
): { goalsFor: number; goalsAgainst: number; wentToPenalties: boolean; penaltyResult: "won" | "lost" | null; events: MatchEvent[] } {
  const events: MatchEvent[] = []
  let gf = 0
  let ga = 0
  const matchId = 0

  const diffAtk = userRatings.attack - rivalRatings.defense
  const diffMid = userRatings.midfield - rivalRatings.midfield
  const diffDef = userRatings.defense - rivalRatings.attack

  for (let minute = 1; minute <= 90; minute += 6) {
    // Chance de gol a favor
    const baseChance = 0.04 + (diffAtk / 30) * 0.03 + (diffMid / 30) * 0.02
    const keyBonus = keyPlayerBonus ? 0.01 : 0
    const rollFor = Math.random()
    if (rollFor < baseChance + keyBonus) {
      gf++
      const scorer = rollFor < 0.05 ? "de cabeza" : "con remate de media distancia"
      const detail = rollFor < 0.2 ? "tras un tiro de esquina" : rollFor < 0.4 ? "asistido por un compañero" : "tras una jugada individual"
      events.push({
        match_result_id: matchId,
        minute: minute + randomInt(-4, 4),
        event_type: "goal_for",
        description: `GOL — ${detail} (${scorer})`,
      })
    }

    // Chance de gol en contra
    const rivalBaseChance = 0.04 - (diffDef / 30) * 0.03 + (diffMid / 30) * 0.01
    const rollAgainst = Math.random()
    if (rollAgainst < rivalBaseChance) {
      ga++
      events.push({
        match_result_id: matchId,
        minute: minute + randomInt(-4, 4),
        event_type: "goal_against",
        description: "GOL del rival",
      })
    }

    // Tarjetas amarillas
    if (Math.random() < 0.02) {
      events.push({
        match_result_id: matchId,
        minute: minute + randomInt(-4, 4),
        event_type: "yellow_card",
        description: "Tarjeta amarilla",
      })
    }

    // Tarjetas rojas (raras)
    if (Math.random() < 0.005) {
      events.push({
        match_result_id: matchId,
        minute: minute + randomInt(-4, 4),
        event_type: "red_card",
        description: "Tarjeta roja",
      })
    }

    // Atajadas
    if (Math.random() < 0.03 + (userRatings.gk - 70) * 0.002) {
      events.push({
        match_result_id: matchId,
        minute: minute + randomInt(-4, 4),
        event_type: "save",
        description: "Atajada del portero",
      })
    }
  }

  events.sort((a, b) => a.minute - b.minute)

  if (gf === ga) {
    // Penales
    const penWon = simulatePenalties(userRatings.gk, rivalRatings.gk)
    return {
      goalsFor: gf,
      goalsAgainst: ga,
      wentToPenalties: true,
      penaltyResult: penWon ? "won" : "lost",
      events,
    }
  }

  return {
    goalsFor: gf,
    goalsAgainst: ga,
    wentToPenalties: false,
    penaltyResult: null,
    events,
  }
}

function simulatePenalties(userGk: number, rivalGk: number): boolean {
  let userScore = 0
  let rivalScore = 0
  const userBase = 0.65 + (userGk - 70) * 0.005
  const rivalBase = 0.65 + (rivalGk - 70) * 0.005

  for (let ronda = 0; ronda < 5; ronda++) {
    if (Math.random() < 0.75) userScore++
    if (Math.random() < 0.75) rivalScore++
  }

  let ronda = 5
  while (userScore === rivalScore && ronda < 10) {
    if (Math.random() < 0.75) userScore++
    if (Math.random() < 0.75) rivalScore++
    ronda++
  }

  return userScore > rivalScore
}

export async function generateFixture(
  sessionGameId: string,
  drawnSeasonIds: string[]
): Promise<{ season_id: string; team_name: string; year: number }[]> {
  const candidates = await getAvailableSeasons()
  const pool = candidates.filter((s) => !drawnSeasonIds.includes(s.id))

  const rivals: { season_id: string; team_name: string; year: number }[] = []
  const used = new Set<string>()

  for (let i = 0; i < 4 && pool.length > 0; i++) {
    const available = pool.filter((s) => !used.has(s.id))
    if (available.length === 0) break
    const pick = pickRandom(available)
    used.add(pick.id)
    rivals.push({
      season_id: pick.id,
      team_name: pick.team.name,
      year: pick.year,
    })
  }

  return rivals
}

export async function simulateTournament(
  sessionGameId: string,
  formationSlots: { position_code: string }[],
  slots: SelectedSlot[]
): Promise<TournamentResult> {
  const userRatings = calculateLineRatings(slots)
  const hasKeyPlayer = slots.some((s) => (s.rating ?? 70) >= 85)

  const rivals = await generateFixture(sessionGameId, [])
  if (rivals.length === 0) throw new Error("No hay rivales disponibles")

  const rounds: SimulatedMatch[] = []
  let eliminatedIn = ""
  let isChampion = false
  let totalGf = 0
  let totalGa = 0
  let wins = 0

  for (let i = 0; i < rivals.length; i++) {
    const rival = rivals[i]
    const squad = await getSquadPlayers(rival.season_id)

    const rivalRatings = formationSlots.length > 0
      ? calculateRivalLineRatings(squad, formationSlots)
      : { gk: 75, defense: 75, midfield: 75, attack: 75, overall: 75 }

    const result = simulateMatch(userRatings, rivalRatings, hasKeyPlayer)

    const round = await createTournamentRound({
      game_session_id: sessionGameId,
      round_index: i,
      round_name: ROUND_NAMES[i] ?? `Ronda ${i + 1}`,
      rival_season_id: rival.season_id,
    })

    const matchResult = await createMatchResult({
      tournament_round_id: round.id as number,
      goals_for: result.goalsFor,
      goals_against: result.goalsAgainst,
      went_to_penalties: result.wentToPenalties,
      penalty_result: result.penaltyResult,
    })

    const events = result.events.map((e) => ({
      ...e,
      match_result_id: matchResult.id as number,
    }))
    await createMatchEvents(events)

    const won =
      result.goalsFor > result.goalsAgainst ||
      (result.goalsFor === result.goalsAgainst && result.penaltyResult === "won")

    isChampion = won && i === rivals.length - 1
    totalGf += result.goalsFor
    totalGa += result.goalsAgainst
    if (won) wins++

    rounds.push({
      roundIndex: i,
      roundName: ROUND_NAMES[i] ?? `Ronda ${i + 1}`,
      rivalSeasonId: rival.season_id,
      rivalTeamName: rival.team_name,
      rivalYear: rival.year,
      rivalOverall: rivalRatings.overall,
      goalsFor: result.goalsFor,
      goalsAgainst: result.goalsAgainst,
      wentToPenalties: result.wentToPenalties,
      penaltyResult: result.penaltyResult,
      events,
      ratings: userRatings,
    })

    if (!won) {
      eliminatedIn = ROUND_NAMES[i] ?? `Ronda ${i + 1}`
      break
    }
  }

  if (isChampion) eliminatedIn = "Campeón"

  const cardPlayers: CardPlayer[] = slots.map((s) => ({
    name: s.player_name ?? "",
    display_name: s.display_name ?? "",
    position_code: s.position_code,
    rating: s.rating ?? 70,
    team_origin: s.team_name,
    season_year: s.season_year,
  }))

  const cardData: CardData = {
    phase_reached: eliminatedIn || (ROUND_NAMES[rounds.length - 1] ?? "Desconocida"),
    goals_for: totalGf,
    goals_against: totalGa,
    team_overall: userRatings.overall,
    wins,
    players: cardPlayers,
  }

  return {
    rounds,
    eliminatedIn,
    isChampion,
    cardData,
  }
}
