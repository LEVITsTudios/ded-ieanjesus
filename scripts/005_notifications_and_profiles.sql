-- 005_notifications_and_profiles.sql
-- Crea la tabla de notificaciones y añade columnas necesarias en profiles

-- Tabla notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Asegurar que la tabla profiles tenga campos dni y full_name
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dni text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name text;

-- Index para consultas comunes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- RLS policy example (habilitar según tu configuración)
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Notifications: owner access" ON notifications
--   USING (auth.uid() = user_id);
