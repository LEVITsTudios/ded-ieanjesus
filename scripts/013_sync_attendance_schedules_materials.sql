-- ============================================================================
-- SCRIPT DE SINCRONIZACIÓN CON SUPABASE
-- Ejecutar en: Supabase SQL Editor
-- Propósito: Sincronizar tablas attendances, schedules, materials con RLS
-- ============================================================================

-- ============================================================================
-- 1. SINCRONIZAR TABLA: attendances
-- ============================================================================

BEGIN;

-- Eliminar tabla si existe (sin perder datos - backup primero!)
-- DROP TABLE IF EXISTS public.attendances CASCADE;

-- Crear/Recrear con estructura correcta
CREATE TABLE IF NOT EXISTS public.attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id, date)
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_attendances_student_id ON public.attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_course_id ON public.attendances(course_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON public.attendances(date);
CREATE INDEX IF NOT EXISTS idx_attendances_recorded_by ON public.attendances(recorded_by);
CREATE INDEX IF NOT EXISTS idx_attendances_course_date ON public.attendances(course_id, date);

-- Habilitar RLS
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "attendances_select_own_or_teacher" ON public.attendances;
DROP POLICY IF EXISTS "attendances_insert_teacher" ON public.attendances;
DROP POLICY IF EXISTS "attendances_update_teacher" ON public.attendances;
DROP POLICY IF EXISTS "attendances_delete_admin" ON public.attendances;

-- Crear políticas RLS correctas
CREATE POLICY "attendances_select_own_or_teacher" ON public.attendances 
  FOR SELECT 
  USING (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "attendances_insert_teacher_admin" ON public.attendances 
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "attendances_update_teacher_admin" ON public.attendances 
  FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "attendances_delete_admin" ON public.attendances 
  FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 2. SINCRONIZAR TABLA: schedules
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  classroom TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_schedules_course_id ON public.schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day_of_week ON public.schedules(day_of_week);

-- Habilitar RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "schedules_select_all" ON public.schedules;
DROP POLICY IF EXISTS "schedules_insert_admin" ON public.schedules;
DROP POLICY IF EXISTS "schedules_update_admin" ON public.schedules;
DROP POLICY IF EXISTS "schedules_delete_admin" ON public.schedules;

-- Crear políticas RLS correctas
CREATE POLICY "schedules_select_all" ON public.schedules 
  FOR SELECT 
  USING (true);

CREATE POLICY "schedules_insert_teacher_admin" ON public.schedules 
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "schedules_update_teacher_admin" ON public.schedules 
  FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "schedules_delete_admin" ON public.schedules 
  FOR DELETE 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 3. SINCRONIZAR TABLA: materials
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_materials_course_id ON public.materials(course_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON public.materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_materials_is_visible ON public.materials(is_visible);

-- Habilitar RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "materials_select_enrolled" ON public.materials;
DROP POLICY IF EXISTS "materials_insert_teacher" ON public.materials;
DROP POLICY IF EXISTS "materials_update_teacher" ON public.materials;
DROP POLICY IF EXISTS "materials_delete_teacher" ON public.materials;

-- Crear políticas RLS correctas
CREATE POLICY "materials_select_enrolled" ON public.materials 
  FOR SELECT 
  USING (
    is_visible = true OR
    EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = materials.course_id AND student_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "materials_insert_teacher_admin" ON public.materials 
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "materials_update_owner_admin" ON public.materials 
  FOR UPDATE 
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "materials_delete_owner_admin" ON public.materials 
  FOR DELETE 
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 4. VERIFICAR TABLAS RELACIONADAS
-- ============================================================================

-- Asegurar que otras tablas también tengan RLS activado
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. VERIFICACIÓN FINAL
-- ============================================================================

-- Listar tablas y su estado RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('attendances', 'schedules', 'materials', 'profiles', 'courses', 'grades')
ORDER BY tablename;

-- Listar políticas RLS activas
SELECT tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('attendances', 'schedules', 'materials')
ORDER BY tablename, policyname;

COMMIT;

-- ============================================================================
-- FIN DEL SCRIPT DE SINCRONIZACIÓN
-- ============================================================================
-- Pasos después de ejecutar:
-- 1. Verificar que no haya errores en la ejecución
-- 2. Navegar a Supabase → Table Editor → Verificar attendances, schedules, materials
-- 3. Ir a Authentication → RLS Policies → Verificar que aparezcan todas las políticas
-- 4. Ejecutar tests en la aplicación Next.js para verificar CRUD
-- ============================================================================
