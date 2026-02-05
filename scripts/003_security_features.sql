-- =============================================
-- Script 003: Funciones de Seguridad Avanzada
-- PIN, Preguntas de Seguridad, Biometría
-- =============================================

-- Tabla para PIN de seguridad
CREATE TABLE IF NOT EXISTS public.user_security_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  pin_hash TEXT NOT NULL, -- PIN hasheado
  is_enabled BOOLEAN DEFAULT true,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para preguntas de seguridad
CREATE TABLE IF NOT EXISTS public.security_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_text_en TEXT, -- Versión en inglés
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para respuestas de seguridad del usuario
CREATE TABLE IF NOT EXISTS public.user_security_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.security_questions(id) ON DELETE CASCADE,
  answer_hash TEXT NOT NULL, -- Respuesta hasheada
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Tabla para credenciales biométricas (WebAuthn/Passkeys)
CREATE TABLE IF NOT EXISTS public.user_passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_name TEXT,
  device_type TEXT, -- 'platform' (biométrico) o 'cross-platform' (llave física)
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para sesiones de recuperación
CREATE TABLE IF NOT EXISTS public.recovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recovery_token TEXT NOT NULL UNIQUE,
  questions_answered INTEGER DEFAULT 0,
  is_valid BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para log de seguridad
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'login', 'pin_verify', 'passkey_register', 'recovery_attempt', etc.
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT false,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar preguntas de seguridad predefinidas
INSERT INTO public.security_questions (question_text, question_text_en) VALUES
  ('¿Cuál es el nombre de tu primera mascota?', 'What is the name of your first pet?'),
  ('¿En qué ciudad naciste?', 'In which city were you born?'),
  ('¿Cuál es el nombre de tu mejor amigo de la infancia?', 'What is the name of your childhood best friend?'),
  ('¿Cuál es el nombre de tu escuela primaria?', 'What is the name of your elementary school?'),
  ('¿Cuál es tu comida favorita?', 'What is your favorite food?'),
  ('¿Cuál es el segundo nombre de tu madre?', 'What is your mother''s middle name?'),
  ('¿En qué año te graduaste de secundaria?', 'What year did you graduate from high school?'),
  ('¿Cuál es el nombre de la calle donde creciste?', 'What is the name of the street you grew up on?'),
  ('¿Cuál fue tu primer trabajo?', 'What was your first job?'),
  ('¿Cuál es tu película favorita?', 'What is your favorite movie?')
ON CONFLICT DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.user_security_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para user_security_pins
CREATE POLICY "users_view_own_pin" ON public.user_security_pins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_pin" ON public.user_security_pins
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_pin" ON public.user_security_pins
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_pin" ON public.user_security_pins
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para security_questions (todos pueden ver)
CREATE POLICY "anyone_view_questions" ON public.security_questions
  FOR SELECT USING (is_active = true);

-- Políticas para user_security_answers
CREATE POLICY "users_view_own_answers" ON public.user_security_answers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_answers" ON public.user_security_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_answers" ON public.user_security_answers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_answers" ON public.user_security_answers
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_passkeys
CREATE POLICY "users_view_own_passkeys" ON public.user_passkeys
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_passkeys" ON public.user_passkeys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_passkeys" ON public.user_passkeys
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_passkeys" ON public.user_passkeys
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para recovery_sessions
CREATE POLICY "users_view_own_recovery" ON public.recovery_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_recovery" ON public.recovery_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para security_logs (solo admin puede ver todos)
CREATE POLICY "users_view_own_logs" ON public.security_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_logs" ON public.security_logs
  FOR INSERT WITH CHECK (true);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_security_pins_user ON public.user_security_pins(user_id);
CREATE INDEX IF NOT EXISTS idx_security_answers_user ON public.user_security_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_user ON public.user_passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_credential ON public.user_passkeys(credential_id);
CREATE INDEX IF NOT EXISTS idx_recovery_token ON public.recovery_sessions(recovery_token);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON public.security_logs(created_at DESC);
