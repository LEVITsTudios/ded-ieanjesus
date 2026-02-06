-- 006_push_subscriptions.sql
-- Tabla para almacenar suscripciones push por usuario

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS policy example (habilitar según tu configuración)
-- ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "PushSubscriptions: owner access" ON push_subscriptions
--   USING (auth.uid() = user_id);
