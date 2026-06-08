import { createAdminClient } from "@/lib/supabase/admin"
import type {
  Team, Season, Player, SquadPlayer, Formation, FormationSlot,
  GameSession, SelectedSlot, TournamentRound, MatchResult, MatchEvent,
} from "@/types/database"

function db() {
  return createAdminClient()
}

// ---- Teams ----
export async function getAllTeams(): Promise<Team[]> {
  const { data } = await db().from("teams").select("*").order("name")
  return data ?? []
}

export async function getTeamById(id: string): Promise<Team | null> {
  const { data } = await db().from("teams").select("*").eq("id", id).single()
  return data
}

// ---- Seasons ----
export async function getSeasonsByTeam(teamId: string): Promise<Season[]> {
  const { data } = await db()
    .from("seasons").select("*").eq("team_id", teamId).order("year", { ascending: false })
  return data ?? []
}

export async function getSeasonById(id: string): Promise<(Season & { team: Team }) | null> {
  const { data } = await db()
    .from("seasons").select("*, team:teams(*)").eq("id", id).single()
  return data as unknown as (Season & { team: Team }) | null
}

export async function getAvailableSeasons(): Promise<(Season & { team: Team })[]> {
  const { data } = await db()
    .from("seasons")
    .select("*, team:teams(*)")
    .eq("is_available_for_draw", true)
  return (data ?? []) as unknown as (Season & { team: Team })[]
}

// ---- Players / Squad ----
export async function getSquadPlayers(seasonId: string): Promise<(SquadPlayer & { player: Player })[]> {
  const { data } = await db()
    .from("squad_players")
    .select("*, player:players(*)")
    .eq("season_id", seasonId)
    .order("rating", { ascending: false })
  return (data ?? []) as unknown as (SquadPlayer & { player: Player })[]
}

export async function getSquadPlayerById(id: string): Promise<(SquadPlayer & { player: Player }) | null> {
  const { data } = await db()
    .from("squad_players")
    .select("*, player:players(*)")
    .eq("id", id)
    .single()
  return data as unknown as (SquadPlayer & { player: Player }) | null
}

// ---- Formations ----
export async function getAllFormations(): Promise<Formation[]> {
  const { data } = await db().from("formations").select("*").order("name")
  return data ?? []
}

export async function getFormationSlots(formationId: string): Promise<FormationSlot[]> {
  const { data } = await db()
    .from("formation_slots").select("*")
    .eq("formation_id", formationId)
    .order("slot_index")
  return data ?? []
}

export async function getFormationWithSlots(formationId: string): Promise<Formation | null> {
  const { data: formation } = await db()
    .from("formations").select("*").eq("id", formationId).single()
  if (!formation) return null

  const slots = await getFormationSlots(formationId)
  return { ...formation, slots }
}

// ---- Game Sessions ----
export async function getGameSession(sessionId: string): Promise<GameSession | null> {
  const { data } = await db()
    .from("game_sessions").select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

export async function createGameSession(sessionId: string, formationId: string): Promise<GameSession> {
  const { data } = await db()
    .from("game_sessions")
    .insert({ session_id: sessionId, formation_id: formationId })
    .select()
    .single()
  if (!data) throw new Error("Failed to create game session")
  return data
}

export async function updateGameSession(
  id: string,
  updates: Partial<Pick<GameSession, "status" | "drawn_season_ids">>
): Promise<void> {
  await db()
    .from("game_sessions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
}

// ---- Selected Slots ----
export async function getSelectedSlots(gameSessionId: string): Promise<SelectedSlot[]> {
  const { data } = await db()
    .from("selected_slots").select("*")
    .eq("game_session_id", gameSessionId)
    .order("slot_index")
  return data ?? []
}

export async function getSelectedSlotsWithPlayers(gameSessionId: string): Promise<SelectedSlot[]> {
  const { data: slots } = await db()
    .from("selected_slots").select("*")
    .eq("game_session_id", gameSessionId).order("slot_index")
  if (!slots || slots.length === 0) return []

  const ids = [...new Set(slots.map((s) => s.squad_player_id))]
  const { data: squadPlayers } = await db()
    .from("squad_players").select("id, jersey_number, rating, player:players(name, display_name)")
    .in("id", ids)
  const spMap = new Map(
    (squadPlayers ?? []).map((sp) => {
      const p = Array.isArray(sp.player) ? sp.player[0] : sp.player
      return [
        sp.id,
        {
          player_name: (p as { name?: string })?.name ?? "",
          display_name: (p as { display_name?: string })?.display_name ?? "",
          jersey_number: (sp as { jersey_number?: number })?.jersey_number ?? 0,
          rating: (sp as { rating?: number })?.rating ?? 70,
        },
      ]
    })
  )
  return slots.map((row) => {
    const info = spMap.get(row.squad_player_id) ?? { player_name: "", display_name: "", jersey_number: 0, rating: 70 }
    return {
      ...row,
      player_name: info.player_name,
      display_name: info.display_name,
      jersey_number: info.jersey_number,
      rating: info.rating,
    } as unknown as SelectedSlot
  })
}

export async function addSelectedSlot(slot: Omit<SelectedSlot, "id">): Promise<SelectedSlot> {
  const { data } = await db()
    .from("selected_slots").insert(slot).select().single()
  if (!data) throw new Error("Failed to add selected slot")
  return data
}

// ---- Tournament ----
export async function createTournamentRound(
  round: Omit<TournamentRound, "id">
): Promise<TournamentRound> {
  const { data } = await db()
    .from("tournament_rounds").insert(round).select().single()
  if (!data) throw new Error("Failed to create tournament round")
  return data
}

export async function getTournamentRounds(gameSessionId: string): Promise<TournamentRound[]> {
  const { data } = await db()
    .from("tournament_rounds").select("*")
    .eq("game_session_id", gameSessionId)
    .order("round_index")
  return data ?? []
}

export async function deleteTournamentRounds(gameSessionId: string): Promise<void> {
  await db()
    .from("tournament_rounds")
    .delete()
    .eq("game_session_id", gameSessionId)
}

// ---- Match Results ----
export async function createMatchResult(
  result: Omit<MatchResult, "id">
): Promise<MatchResult> {
  const { data } = await db()
    .from("match_results").insert(result).select().single()
  if (!data) throw new Error("Failed to create match result")
  return data
}

export async function getMatchResult(tournamentRoundId: number): Promise<MatchResult | null> {
  const { data } = await db()
    .from("match_results").select("*")
    .eq("tournament_round_id", tournamentRoundId)
    .maybeSingle()
  return data
}

// ---- Match Events ----
export async function createMatchEvents(
  events: Omit<MatchEvent, "id">[]
): Promise<void> {
  if (events.length === 0) return
  await db().from("match_events").insert(events)
}

export async function getMatchEvents(matchResultId: number): Promise<MatchEvent[]> {
  const { data } = await db()
    .from("match_events").select("*")
    .eq("match_result_id", matchResultId)
    .order("minute")
  return data ?? []
}
