-- Script: 004_security_pin_and_recovery.sql
-- Descripción: Tablas para PIN de seguridad y preguntas de recuperación

-- Tabla para almacenar PIN de seguridad
CREATE TABLE IF NOT EXISTS security_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla para preguntas de seguridad predefinidas
CREATE TABLE IF NOT EXISTS security_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_text)
);

-- Tabla para respuestas de seguridad del usuario
CREATE TABLE IF NOT EXISTS user_security_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES security_questions(id) ON DELETE CASCADE,
  answer_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Tabla para seguimiento de intentos fallidos de PIN
CREATE TABLE IF NOT EXISTS pin_attempt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT
);

-- Tabla para dispositivos biométricos registrados
CREATE TABLE IF NOT EXISTS biometric_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter INT DEFAULT 0,
  transports TEXT[], -- Array de transports soportados
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, credential_id)
);

-- Tabla para intentos de biometría
CREATE TABLE IF NOT EXISTS biometric_attempt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES biometric_devices(id) ON DELETE CASCADE,
  attempt_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_security_pins_user_id ON security_pins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_answers_user_id ON user_security_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_pin_attempt_logs_user_id ON pin_attempt_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pin_attempt_logs_time ON pin_attempt_logs(attempt_time);
CREATE INDEX IF NOT EXISTS idx_biometric_devices_user_id ON biometric_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_attempt_logs_user_id ON biometric_attempt_logs(user_id);

-- Políticas RLS (Row Level Security)
ALTER TABLE security_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_attempt_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_attempt_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para security_pins
CREATE POLICY "Users can view their own PIN" ON security_pins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own PIN" ON security_pins
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para user_security_answers
CREATE POLICY "Users can manage their security answers" ON user_security_answers
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para biometric_devices
CREATE POLICY "Users can manage their biometric devices" ON biometric_devices
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para intentos (solo lectura para auditoría)
CREATE POLICY "Users can view their own attempt logs" ON pin_attempt_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their biometric attempt logs" ON biometric_attempt_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Insertar preguntas de seguridad comunes (en español)
INSERT INTO security_questions (question_text) VALUES
  ('¿Cuál es el nombre de tu mascota?'),
  ('¿En qué ciudad naciste?'),
  ('¿Cuál es el nombre de tu mejor amigo/a de la infancia?'),
  ('¿Cuál es tu película favorita?'),
  ('¿En qué escuela primaria estudiaste?'),
  ('¿Cuál es el nombre de tu primer novio/a?'),
  ('¿Cuál es tu comida favorita?'),
  ('¿Cuál es el nombre de tu calle donde creciste?'),
  ('¿Cuál es tu deporte favorito?'),
  ('¿Cuál es el modelo de tu primer auto?')
ON CONFLICT DO NOTHING;
