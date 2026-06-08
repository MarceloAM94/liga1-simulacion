-- Validación de seed data (correr después de ejecutar migrations)
-- Verifica que cada plantel cumpla los requisitos mínimos

WITH position_groups AS (
  SELECT
    s.id AS season_id,
    s.year,
    t.name AS team_name,
    COUNT(DISTINCT sp.id) AS total_players,
    COUNT(DISTINCT sp.id) FILTER (WHERE 'GK' = ANY(sp.positions)) AS gk_count,
    COUNT(DISTINCT sp.id) FILTER (WHERE sp.positions && ARRAY['CB','LB','RB','LWB','RWB']) AS def_count,
    COUNT(DISTINCT sp.id) FILTER (WHERE sp.positions && ARRAY['CDM','CM','LM','RM','CAM']) AS mid_count,
    COUNT(DISTINCT sp.id) FILTER (WHERE sp.positions && ARRAY['LW','RW','CF','ST']) AS atk_count,
    MIN(sp.rating) AS min_rating,
    MAX(sp.rating) AS max_rating
  FROM seasons s
  JOIN teams t ON t.id = s.team_id
  LEFT JOIN squad_players sp ON sp.season_id = s.id
  GROUP BY s.id, s.year, t.name
)
SELECT
  team_name || ' ' || year AS squad,
  total_players,
  gk_count,
  def_count,
  mid_count,
  atk_count,
  min_rating,
  max_rating,
  CASE
    WHEN total_players < 18 THEN 'FALLA: menos de 18 jugadores'
    WHEN gk_count < 2 THEN 'FALLA: menos de 2 GK'
    WHEN def_count < 4 THEN 'FALLA: menos de 4 defensas'
    WHEN mid_count < 4 THEN 'FALLA: menos de 4 mediocampistas'
    WHEN atk_count < 3 THEN 'FALLA: menos de 3 atacantes'
    WHEN min_rating < 60 THEN 'FALLA: rating menor a 60'
    WHEN max_rating > 99 THEN 'FALLA: rating mayor a 99'
    ELSE 'OK'
  END AS validation
FROM position_groups
ORDER BY team_name, year;
