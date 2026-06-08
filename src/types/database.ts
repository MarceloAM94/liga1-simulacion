export interface Team {
  id: string
  name: string
  short_name: string
  badge_url: string
  primary_color: string
  secondary_color: string
  city: string
  founded_year: number
  is_active: boolean
}

export interface Season {
  id: string
  team_id: string
  year: number
  league: string
  title_won: boolean
  is_available_for_draw: boolean
}

export interface Player {
  id: string
  name: string
  display_name: string
  nationality: string
  birth_year: number
  photo_url: string | null
}

export interface SquadPlayer {
  id: string
  season_id: string
  player_id: string
  rating: number
  positions: string[]
  jersey_number: number | null
  is_key_player: boolean
}

export interface Formation {
  id: string
  name: string
  slots: FormationSlot[]
}

export interface FormationSlot {
  id: string
  formation_id: string
  slot_index: number
  position_code: string
  x_percent: number
  y_percent: number
}

export interface GameSession {
  id: string
  session_id: string
  status: "draft" | "simulating" | "finished"
  formation_id: string
  drawn_season_ids: string[]
  created_at: string
  updated_at: string
}

export interface SelectedSlot {
  id?: number
  game_session_id: string
  slot_index: number
  squad_player_id: string
  position_code: string
  team_name: string
  season_year: number
  player_name?: string
}

export interface TournamentRound {
  id?: number
  game_session_id: string
  round_index: number
  round_name: string
  rival_season_id: string
}

export interface MatchResult {
  id?: number
  tournament_round_id: number
  goals_for: number
  goals_against: number
  went_to_penalties: boolean
  penalty_result: "won" | "lost" | null
}

export interface MatchEvent {
  id?: number
  match_result_id: number
  minute: number
  event_type: "goal_for" | "goal_against" | "yellow_card" | "red_card" | "save"
  description: string | null
}

export type PositionCode =
  | "GK" | "CB" | "LB" | "RB" | "LWB" | "RWB"
  | "CDM" | "CM" | "LM" | "RM" | "CAM"
  | "LW" | "RW" | "CF" | "ST"

export const ALL_POSITION_CODES: PositionCode[] = [
  "GK", "CB", "LB", "RB", "LWB", "RWB",
  "CDM", "CM", "LM", "RM", "CAM",
  "LW", "RW", "CF", "ST"
]

export interface DrawResult {
  season: Season
  team: Team
  squad_players: SquadPlayerWithPlayer[]
}

export interface SquadPlayerWithPlayer extends SquadPlayer {
  player: Player
}

export interface CardData {
  phase_reached: string
  goals_for: number
  goals_against: number
  team_overall: number
  wins: number
  players: CardPlayer[]
}

export interface CardPlayer {
  name: string
  display_name: string
  position_code: string
  rating: number
  team_origin: string
  season_year: number
}
