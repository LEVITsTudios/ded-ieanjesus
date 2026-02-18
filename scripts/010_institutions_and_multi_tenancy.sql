-- ============================================================================
-- SCRIPT 010: MULTI-TENANCY Y TABLA DE INSTITUCIONES
-- ============================================================================
-- Objetivo: Permitir múltiples instituciones educativas en la misma BD
-- Fecha: Feb 12, 2026
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. TABLA DE INSTITUCIONES (Raíz del multi-tenancy)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- Ej: "LVT", "COLEGIO-ABC"
  country TEXT DEFAULT 'Ecuador',
  region TEXT, -- Provincia
  city TEXT,
  timezone TEXT DEFAULT 'America/Guayaquil',
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  
  -- Configuraciones específicas por institución
  settings JSONB DEFAULT jsonb_build_object(
    'academic_year', 2026,
    'currency', 'USD',
    'language', 'es',
    'attendance_threshold', 80,
    'grading_scale', 'numeric',
    'max_students_per_course', 40,
    'academic_periods', 4
  ),
  
  -- Control de estado
  is_active BOOLEAN DEFAULT true,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_expires_at TIMESTAMPTZ,
  
  -- Auditoría
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para instituciones
CREATE INDEX idx_institutions_code ON public.institutions(code);
CREATE INDEX idx_institutions_active ON public.institutions(is_active);
CREATE INDEX idx_institutions_subscription ON public.institutions(subscription_status);

-- RLS para instituciones
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_institution_policy" ON public.institutions
  FOR SELECT USING (
    is_active = true OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================================
-- 2. AGREGAR institution_id A TABLAS EXISTENTES (Sin borrar datos)
-- ============================================================================

-- profiles (ya existe institution_id en algunos, pero nos aseguramos)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- enrollments
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- schedules
ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- attendances
ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- materials
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- assignments
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.assignments(id) ON DELETE CASCADE;

-- submissions
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- grades
ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- meetings
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- announcements
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- permissions
ALTER TABLE public.permissions
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- student_profiles
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- student_surveys
ALTER TABLE public.student_surveys
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- quizzes
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- admin_invite_codes
ALTER TABLE public.admin_invite_codes
  ADD COLUMN IF NOT EXISTS institution_id UUID DEFAULT NULL REFERENCES public.institutions(id) ON DELETE CASCADE;

-- ============================================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_institution ON public.profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_courses_institution ON public.courses(institution_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_institution ON public.enrollments(institution_id);
CREATE INDEX IF NOT EXISTS idx_schedules_institution ON public.schedules(institution_id);
CREATE INDEX IF NOT EXISTS idx_attendances_institution ON public.attendances(institution_id);
CREATE INDEX IF NOT EXISTS idx_materials_institution ON public.materials(institution_id);
CREATE INDEX IF NOT EXISTS idx_assignments_institution ON public.assignments(institution_id);
CREATE INDEX IF NOT EXISTS idx_submissions_institution ON public.submissions(institution_id);
CREATE INDEX IF NOT EXISTS idx_grades_institution ON public.grades(institution_id);
CREATE INDEX IF NOT EXISTS idx_meetings_institution ON public.meetings(institution_id);
CREATE INDEX IF NOT EXISTS idx_announcements_institution ON public.announcements(institution_id);
CREATE INDEX IF NOT EXISTS idx_permissions_institution ON public.permissions(institution_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_institution ON public.student_profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_student_surveys_institution ON public.student_surveys(institution_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_institution ON public.quizzes(institution_id);

-- ============================================================================
-- 4. VISTA: Usuarios Activos por Institución
-- ============================================================================

CREATE OR REPLACE VIEW institution_users AS
SELECT
  i.id as institution_id,
  i.name as institution_name,
  p.id as user_id,
  p.email,
  p.full_name,
  p.role,
  COUNT(*) OVER (PARTITION BY i.id) as total_users,
  COUNT(*) FILTER (WHERE p.role = 'student') OVER (PARTITION BY i.id) as total_students,
  COUNT(*) FILTER (WHERE p.role = 'teacher') OVER (PARTITION BY i.id) as total_teachers,
  COUNT(*) FILTER (WHERE p.role = 'admin') OVER (PARTITION BY i.id) as total_admins
FROM public.institutions i
JOIN public.profiles p ON p.institution_id = i.id
WHERE i.is_active = true AND p.id IS NOT NULL;

-- ============================================================================
-- 5. VISTA: Resumen por Institución
-- ============================================================================

CREATE OR REPLACE VIEW institution_stats AS
SELECT
  i.id,
  i.name,
  i.code,
  COALESCE(COUNT(DISTINCT p.id), 0) as total_users,
  COALESCE(COUNT(DISTINCT CASE WHEN p.role = 'student' THEN p.id END), 0) as total_students,
  COALESCE(COUNT(DISTINCT CASE WHEN p.role = 'teacher' THEN p.id END), 0) as total_teachers,
  COALESCE(COUNT(DISTINCT c.id), 0) as total_courses,
  COALESCE(COUNT(DISTINCT e.id), 0) as total_enrollments,
  i.subscription_status,
  i.is_active,
  i.created_at
FROM public.institutions i
LEFT JOIN public.profiles p ON p.institution_id = i.id
LEFT JOIN public.courses c ON c.institution_id = i.id
LEFT JOIN public.enrollments e ON e.institution_id = i.id
GROUP BY i.id, i.name, i.code, i.subscription_status, i.is_active, i.created_at;

-- ============================================================================
-- 6. CREAR INSTITUCIÓN POR DEFECTO (para datos existentes)
-- ============================================================================

INSERT INTO public.institutions (id, name, code, country, city, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Instituto Principal',
  'PRINCIPAL',
  'Ecuador',
  'Guayaquil',
  true
)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 7. ACTUALIZAR DATOS EXISTENTES CON institution_id POR DEFECTO
-- ============================================================================

-- Esto solo actualiza registros que no tienen institución asignada
UPDATE public.profiles
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.courses
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.enrollments
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.schedules
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.attendances
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.materials
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.assignments
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.submissions
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.grades
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.meetings
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.announcements
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.permissions
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.student_profiles
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.student_surveys
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

UPDATE public.quizzes
SET institution_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
WHERE institution_id IS NULL;

-- ============================================================================
-- 8. ACTUALIZAR RLS PARA RESPETAR MULTI-TENANCY
-- ============================================================================

-- Política mejorada para profiles (respeta institución)
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    -- Usuarios pueden ver su propio perfil
    auth.uid() = id OR
    -- Admins de la institución pueden ver todos en su institución
    (EXISTS (
      SELECT 1 FROM public.profiles admin
      WHERE admin.id = auth.uid()
      AND admin.role = 'admin'
      AND admin.institution_id = profiles.institution_id
    )) OR
    -- Teachers pueden ver estudiantes en su institución
    (EXISTS (
      SELECT 1 FROM public.profiles teacher
      WHERE teacher.id = auth.uid()
      AND teacher.role = 'teacher'
      AND teacher.institution_id = profiles.institution_id
    ))
  );

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (
    -- Solo admins o el mismo usuario
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles admin
      WHERE admin.id = auth.uid()
      AND admin.role = 'admin'
    )
  );

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    -- Usuarios pueden actualizar su propio perfil
    auth.uid() = id OR
    -- Admins de la institución
    EXISTS (
      SELECT 1 FROM public.profiles admin
      WHERE admin.id = auth.uid()
      AND admin.role = 'admin'
      AND admin.institution_id = profiles.institution_id
    )
  );

CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE USING (
    -- Solo super admins
    EXISTS (
      SELECT 1 FROM public.profiles admin
      WHERE admin.id = auth.uid()
      AND admin.role = 'admin'
    )
  );

-- ============================================================================
-- 9. LOG DE CAMBIOS
-- ============================================================================

-- Comentario: Este script agrega soporte para múltiples instituciones
-- sin borrar datos existentes. Todos los datos se asignan a
-- la institución "PRINCIPAL" por defecto.

COMMIT;

-- ============================================================================
-- VERIFICACIÓN POST-EJECUCIÓN
-- ============================================================================

/*
SELECT
  'Instituciones creadas:' as check_point,
  COUNT(*) as count
FROM public.institutions;

SELECT
  'Perfiles con institution_id:' as check_point,
  COUNT(*) as count
FROM public.profiles
WHERE institution_id IS NOT NULL;

SELECT
  'Cursos con institution_id:' as check_point,
  COUNT(*) as count
FROM public.courses
WHERE institution_id IS NOT NULL;
*/
