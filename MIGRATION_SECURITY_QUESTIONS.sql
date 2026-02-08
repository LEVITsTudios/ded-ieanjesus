-- ============================================================================
-- MIGRACIÓN: Crear tabla security_questions con preguntas de seguridad
-- ============================================================================

-- 1. Crear tabla de preguntas de seguridad
CREATE TABLE IF NOT EXISTS public.security_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_text_en TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de respuestas de seguridad del usuario
CREATE TABLE IF NOT EXISTS public.user_security_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.security_questions(id) ON DELETE CASCADE,
  answer_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- 3. Insertar preguntas de seguridad en español (Ecuador-friendly)
INSERT INTO public.security_questions (question_text, question_text_en, is_active) 
VALUES
  ('¿Cuál es el nombre de tu primera mascota?', 'What is the name of your first pet?', true),
  ('¿En qué ciudad naciste?', 'In which city were you born?', true),
  ('¿Cuál es el nombre de tu mejor amigo de la infancia?', 'What is the name of your childhood best friend?', true),
  ('¿Cuál es el nombre de tu escuela primaria?', 'What is the name of your elementary school?', true),
  ('¿Cuál es tu comida favorita?', 'What is your favorite food?', true),
  ('¿Cuál es el segundo nombre de tu madre?', 'What is your mother''s middle name?', true),
  ('¿En qué año te graduaste de secundaria?', 'What year did you graduate from high school?', true),
  ('¿Cuál es el nombre de la calle donde creciste?', 'What is the name of the street you grew up on?', true),
  ('¿Cuál fue tu primer trabajo?', 'What was your first job?', true),
  ('¿Cuál es tu película favorita?', 'What is your favorite movie?', true)
ON CONFLICT DO NOTHING;

-- 4. Habilitar RLS
ALTER TABLE public.security_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_answers ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para security_questions (todos pueden ver preguntas activas)
CREATE POLICY IF NOT EXISTS "anyone_view_active_questions" ON public.security_questions
  FOR SELECT USING (is_active = true);

-- 6. Políticas para user_security_answers
CREATE POLICY IF NOT EXISTS "users_view_own_answers" ON public.user_security_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_insert_own_answers" ON public.user_security_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_update_own_answers" ON public.user_security_answers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_delete_own_answers" ON public.user_security_answers
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Verificar que las preguntas existen
SELECT COUNT(*) as total_questions FROM public.security_questions WHERE is_active = true;
