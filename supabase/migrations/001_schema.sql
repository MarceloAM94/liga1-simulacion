-- ============================================================
-- Migration 001: Schema inicial — Liga 1 Perú Simulador
-- ============================================================

-- 1. TEAMS
CREATE TABLE teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL,
  badge_url   TEXT NOT NULL DEFAULT '',
  primary_color   TEXT NOT NULL DEFAULT '#FFFFFF',
  secondary_color TEXT NOT NULL DEFAULT '#000000',
  city        TEXT NOT NULL DEFAULT '',
  founded_year INTEGER NOT NULL DEFAULT 1900,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

-- 2. SEASONS
CREATE TABLE seasons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  year        INTEGER NOT NULL,
  league      TEXT NOT NULL DEFAULT 'Liga 1',
  title_won   BOOLEAN NOT NULL DEFAULT false,
  is_available_for_draw BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(team_id, year)
);

-- 3. PLAYERS
CREATE TABLE players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  nationality TEXT NOT NULL DEFAULT 'PE',
  birth_year  INTEGER,
  photo_url   TEXT
);

-- 4. SQUAD_PLAYERS
CREATE TABLE squad_players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id       UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rating          INTEGER NOT NULL CHECK (rating >= 60 AND rating <= 99),
  positions       TEXT[] NOT NULL DEFAULT '{}',
  jersey_number   INTEGER,
  is_key_player   BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(season_id, player_id)
);

-- 5. FORMATIONS
CREATE TABLE formations (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

-- 6. FORMATION_SLOTS
CREATE TABLE formation_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id    UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  slot_index      INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 10),
  position_code   TEXT NOT NULL,
  x_percent       FLOAT NOT NULL CHECK (x_percent >= 0.0 AND x_percent <= 1.0),
  y_percent       FLOAT NOT NULL CHECK (y_percent >= 0.0 AND y_percent <= 1.0),
  UNIQUE(formation_id, slot_index)
);

-- 7. GAME_SESSIONS
CREATE TABLE game_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'simulating', 'finished')),
  formation_id      UUID NOT NULL REFERENCES formations(id),
  drawn_season_ids  UUID[] NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_sessions_session_id ON game_sessions(session_id);

-- 8. SELECTED_SLOTS
CREATE TABLE selected_slots (
  id                BIGSERIAL PRIMARY KEY,
  game_session_id   UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  slot_index        INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 10),
  squad_player_id   UUID NOT NULL REFERENCES squad_players(id),
  position_code     TEXT NOT NULL,
  team_name         TEXT NOT NULL DEFAULT '',
  season_year       INTEGER NOT NULL DEFAULT 0,
  UNIQUE(game_session_id, slot_index)
);

-- 9. TOURNAMENT_ROUNDS
CREATE TABLE tournament_rounds (
  id                BIGSERIAL PRIMARY KEY,
  game_session_id   UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  round_index       INTEGER NOT NULL,
  round_name        TEXT NOT NULL,
  rival_season_id   UUID NOT NULL REFERENCES seasons(id)
);

-- 10. MATCH_RESULTS
CREATE TABLE match_results (
  id                  BIGSERIAL PRIMARY KEY,
  tournament_round_id BIGINT NOT NULL REFERENCES tournament_rounds(id) ON DELETE CASCADE,
  goals_for           INTEGER NOT NULL DEFAULT 0,
  goals_against       INTEGER NOT NULL DEFAULT 0,
  went_to_penalties   BOOLEAN NOT NULL DEFAULT false,
  penalty_result      TEXT CHECK (penalty_result IN ('won', 'lost', NULL))
);

-- 11. MATCH_EVENTS
CREATE TABLE match_events (
  id                BIGSERIAL PRIMARY KEY,
  match_result_id   BIGINT NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
  minute            INTEGER NOT NULL CHECK (minute >= 1 AND minute <= 120),
  event_type        TEXT NOT NULL CHECK (event_type IN ('goal_for', 'goal_against', 'yellow_card', 'red_card', 'save')),
  description       TEXT
);
