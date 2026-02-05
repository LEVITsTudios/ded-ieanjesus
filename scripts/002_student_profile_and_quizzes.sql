-- =====================================================
-- FICHA ESTUDIANTIL COMPLETA
-- =====================================================

-- Tabla de ficha estudiantil con datos personales validados
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Datos personales
  document_type TEXT CHECK (document_type IN ('cedula', 'pasaporte', 'partida_nacimiento', 'dni', 'otro')),
  document_number TEXT,
  nationality TEXT,
  place_of_birth TEXT,
  gender TEXT CHECK (gender IN ('masculino', 'femenino', 'otro', 'prefiero_no_decir')),
  blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'desconocido')),
  
  -- Contacto de emergencia
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  -- Datos del representante/padre
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_relationship TEXT CHECK (parent_relationship IN ('padre', 'madre', 'tutor', 'abuelo', 'abuela', 'otro')),
  
  -- Estado de verificacion
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  
  -- Documentos adjuntos (URLs)
  document_photo_url TEXT,
  birth_certificate_url TEXT,
  medical_certificate_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- =====================================================
-- ENCUESTA DE HABILIDADES Y SALUD
-- =====================================================

CREATE TABLE IF NOT EXISTS public.student_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  
  -- Estado de salud fisica
  has_chronic_illness BOOLEAN DEFAULT false,
  chronic_illness_details TEXT,
  has_allergies BOOLEAN DEFAULT false,
  allergies_details TEXT,
  has_disabilities BOOLEAN DEFAULT false,
  disability_type TEXT CHECK (disability_type IN ('visual', 'auditiva', 'motora', 'cognitiva', 'multiple', 'ninguna', 'otra')),
  disability_details TEXT,
  requires_special_attention BOOLEAN DEFAULT false,
  special_attention_details TEXT,
  current_medications TEXT,
  
  -- Estado de salud mental
  has_anxiety BOOLEAN DEFAULT false,
  has_depression BOOLEAN DEFAULT false,
  has_adhd BOOLEAN DEFAULT false,
  has_learning_difficulties BOOLEAN DEFAULT false,
  mental_health_details TEXT,
  receives_psychological_support BOOLEAN DEFAULT false,
  psychological_support_details TEXT,
  
  -- Habilidades y talentos
  primary_learning_style TEXT CHECK (primary_learning_style IN ('visual', 'auditivo', 'kinestesico', 'lectura_escritura', 'mixto')),
  academic_strengths TEXT[], -- Array de areas fuertes
  academic_weaknesses TEXT[], -- Array de areas a mejorar
  extracurricular_interests TEXT[], -- Deportes, arte, musica, etc.
  special_talents TEXT,
  languages_spoken TEXT[],
  
  -- Situacion familiar
  family_structure TEXT CHECK (family_structure IN ('nuclear', 'monoparental', 'extendida', 'adoptiva', 'otro')),
  number_of_siblings INTEGER DEFAULT 0,
  socioeconomic_level TEXT CHECK (socioeconomic_level IN ('bajo', 'medio_bajo', 'medio', 'medio_alto', 'alto', 'prefiero_no_decir')),
  has_internet_access BOOLEAN DEFAULT true,
  has_computer_access BOOLEAN DEFAULT true,
  study_environment_quality TEXT CHECK (study_environment_quality IN ('excelente', 'bueno', 'regular', 'deficiente')),
  
  -- Historial academico
  previous_school TEXT,
  previous_grades_average DECIMAL(4,2),
  has_repeated_grade BOOLEAN DEFAULT false,
  repeated_grade_details TEXT,
  
  -- Metas y expectativas
  short_term_goals TEXT,
  long_term_goals TEXT,
  career_interests TEXT,
  
  survey_completed_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_profile_id)
);

-- =====================================================
-- CODIGOS DE INVITACION PARA ADMINISTRADORES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  used_by UUID REFERENCES public.profiles(id),
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SISTEMA DE QUIZZES Y RETROALIMENTACION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT CHECK (quiz_type IN ('practice', 'graded', 'survey', 'diagnostic')) DEFAULT 'practice',
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 1,
  passing_score DECIMAL(5,2) DEFAULT 60.00,
  is_randomized BOOLEAN DEFAULT false,
  show_correct_answers BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching')) NOT NULL,
  points DECIMAL(5,2) DEFAULT 1.00,
  explanation TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score DECIMAL(5,2),
  percentage DECIMAL(5,2),
  is_passed BOOLEAN,
  time_spent_seconds INTEGER,
  attempt_number INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id),
  selected_option_id UUID REFERENCES public.quiz_options(id),
  text_answer TEXT,
  is_correct BOOLEAN,
  points_earned DECIMAL(5,2) DEFAULT 0,
  feedback TEXT
);

-- =====================================================
-- RECURSOS DE CLASE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.class_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT CHECK (resource_type IN ('document', 'video', 'audio', 'image', 'link', 'presentation', 'other')) NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  external_url TEXT,
  is_downloadable BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  folder_path TEXT DEFAULT '/',
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SISTEMA DE RECORDATORIOS Y NOTIFICACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  reminder_type TEXT CHECK (reminder_type IN ('class', 'assignment', 'meeting', 'grade', 'quiz', 'custom')) NOT NULL,
  related_id UUID, -- ID del curso, tarea, reunion, etc.
  scheduled_for TIMESTAMPTZ NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  send_via TEXT[] DEFAULT ARRAY['app'], -- app, email, sms
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para preferencias de notificaciones del usuario
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  notify_grades BOOLEAN DEFAULT true,
  notify_assignments BOOLEAN DEFAULT true,
  notify_classes BOOLEAN DEFAULT true,
  notify_meetings BOOLEAN DEFAULT true,
  notify_announcements BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITICAS RLS
-- =====================================================

-- Student Profiles
CREATE POLICY "student_profiles_select" ON public.student_profiles FOR SELECT USING (
  auth.uid() = user_id OR 
  auth.uid() = parent_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

CREATE POLICY "student_profiles_insert" ON public.student_profiles FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "student_profiles_update" ON public.student_profiles FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Student Surveys
CREATE POLICY "student_surveys_select" ON public.student_surveys FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = student_profile_id AND (sp.user_id = auth.uid() OR sp.parent_id = auth.uid())) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

CREATE POLICY "student_surveys_insert" ON public.student_surveys FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = student_profile_id AND sp.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "student_surveys_update" ON public.student_surveys FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = student_profile_id AND sp.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admin Invite Codes (solo admins pueden ver y crear)
CREATE POLICY "admin_codes_select" ON public.admin_invite_codes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin_codes_insert" ON public.admin_invite_codes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Quizzes
CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT USING (
  is_published = true OR 
  teacher_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "quizzes_insert" ON public.quizzes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

CREATE POLICY "quizzes_update" ON public.quizzes FOR UPDATE USING (
  teacher_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "quizzes_delete" ON public.quizzes FOR DELETE USING (
  teacher_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Quiz Questions
CREATE POLICY "quiz_questions_select" ON public.quiz_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.is_published = true OR q.teacher_id = auth.uid()))
);

CREATE POLICY "quiz_questions_insert" ON public.quiz_questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.teacher_id = auth.uid())
);

-- Quiz Options
CREATE POLICY "quiz_options_select" ON public.quiz_options FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quiz_questions qq JOIN public.quizzes q ON q.id = qq.quiz_id WHERE qq.id = question_id AND (q.is_published = true OR q.teacher_id = auth.uid()))
);

CREATE POLICY "quiz_options_insert" ON public.quiz_options FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.quiz_questions qq JOIN public.quizzes q ON q.id = qq.quiz_id WHERE qq.id = question_id AND q.teacher_id = auth.uid())
);

-- Quiz Attempts
CREATE POLICY "quiz_attempts_select" ON public.quiz_attempts FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.teacher_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "quiz_attempts_insert" ON public.quiz_attempts FOR INSERT WITH CHECK (
  student_id = auth.uid()
);

CREATE POLICY "quiz_attempts_update" ON public.quiz_attempts FOR UPDATE USING (
  student_id = auth.uid()
);

-- Quiz Answers
CREATE POLICY "quiz_answers_select" ON public.quiz_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = attempt_id AND qa.student_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.quiz_attempts qa JOIN public.quizzes q ON q.id = qa.quiz_id WHERE qa.id = attempt_id AND q.teacher_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "quiz_answers_insert" ON public.quiz_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = attempt_id AND qa.student_id = auth.uid())
);

-- Class Resources
CREATE POLICY "class_resources_select" ON public.class_resources FOR SELECT USING (
  is_visible = true OR
  uploaded_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "class_resources_insert" ON public.class_resources FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

CREATE POLICY "class_resources_update" ON public.class_resources FOR UPDATE USING (
  uploaded_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "class_resources_delete" ON public.class_resources FOR DELETE USING (
  uploaded_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reminders
CREATE POLICY "reminders_select" ON public.reminders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "reminders_insert" ON public.reminders FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);
CREATE POLICY "reminders_update" ON public.reminders FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "reminders_delete" ON public.reminders FOR DELETE USING (user_id = auth.uid());

-- Notification Preferences
CREATE POLICY "notification_prefs_select" ON public.notification_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notification_prefs_insert" ON public.notification_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notification_prefs_update" ON public.notification_preferences FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- INDICES PARA OPTIMIZACION
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON public.student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_parent ON public.student_profiles(parent_id);
CREATE INDEX IF NOT EXISTS idx_student_surveys_profile ON public.student_surveys(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON public.quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher ON public.quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON public.quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_class_resources_course ON public.class_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON public.reminders(scheduled_for);

-- =====================================================
-- INSERTAR CODIGO DE ADMIN INICIAL (para primer administrador)
-- =====================================================

INSERT INTO public.admin_invite_codes (code, expires_at) 
VALUES ('ADMIN-INICIAL-2024', NOW() + INTERVAL '30 days')
ON CONFLICT DO NOTHING;
