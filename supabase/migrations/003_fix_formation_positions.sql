-- ============================================================
-- Migration 003: Ajustar posiciones de formación 4-3-3
-- ============================================================

UPDATE formation_slots SET x_percent = 0.50, y_percent = 0.05 WHERE id IN (
  SELECT id FROM formation_slots
  WHERE formation_id = 'f1000000-0000-0000-0000-000000000001' AND slot_index = 0
);

UPDATE formation_slots SET x_percent = 0.38, y_percent = 0.22 WHERE id IN (
  SELECT id FROM formation_slots
  WHERE formation_id = 'f1000000-0000-0000-0000-000000000001' AND slot_index = 1
);

UPDATE formation_slots SET x_percent = 0.62, y_percent = 0.22 WHERE id IN (
  SELECT id FROM formation_slots
  WHERE formation_id = 'f1000000-0000-0000-0000-000000000001' AND slot_index = 2
);

UPDATE formation_slots SET x_percent = 0.10, y_percent = 0.18 WHERE id IN (
  SELECT id FROM formation_slots
  WHERE formation_id = 'f1000000-0000-0000-0000-000000000001' AND slot_index = 3
);

UPDATE formation_slots SET x_percent = 0.90, y_percent = 0.18 WHERE id IN (
  SELECT id FROM formation_slots
  WHERE formation_id = 'f1000000-0000-0000-0000-000000000001' AND slot_index = 4
);

UPDATE formation_slots SET x_percent = 0.25, y_percent = 0.48 WHERE id IN (
  SELECT id FROM formation_slots
  WHERE formation_id = 'f1000000-0000-0000-0000-000000000001' AND slot_index = 5
);

UPDATE formation_slots SET x_percent = 0.50, y_percent = 0.48 WHERE id IN (
  SELECT id FROM formation_slots
  WHERE formation_id = 'f1000000-0000-0000-0000-000000000001' AND slot_index = 6
);

UPDATE formation_slots SET x_percent = 0.75, y_percent = 0.48 WHERE id IN (
  SELECT id FROM formation_slots
  WHERE formation_id = 'f1000000-0000-0000-0000-000000000001' AND slot_index = 7
);

UPDATE formation_slots SET x_percent = 0.15, y_percent = 0.72 WHERE id IN (
  SELECT id FROM formation_slots
  WHERE formation_id = 'f1000000-0000-0000-0000-000000000001' AND slot_index = 8
);

UPDATE formation_slots SET x_percent = 0.50, y_percent = 0.78 WHERE id IN (
  SELECT id FROM formation_slots
  WHERE formation_id = 'f1000000-0000-0000-0000-000000000001' AND slot_index = 9
);

UPDATE formation_slots SET x_percent = 0.85, y_percent = 0.72 WHERE id IN (
  SELECT id FROM formation_slots
  WHERE formation_id = 'f1000000-0000-0000-0000-000000000001' AND slot_index = 10
);
