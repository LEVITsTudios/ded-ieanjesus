-- ============================================================================
-- SCRIPT 012: PERFILES ESPECÍFICOS POR ROL (Normalización)
-- ============================================================================
-- Objetivo: Extender la tabla profiles con campos específicos por rol
-- Fecha: Feb 12, 2026
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. TABLA: TEACHER_PROFILES (Extensión de profiles para maestros)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  
  -- Información profesional
  specialization TEXT, -- Ej: "Matemáticas", "Ciencias Naturales"
  certifications TEXT[], -- Array de certificaciones
  degree TEXT, -- Ej: "Licenciatura", "Maestría"
  license_number TEXT UNIQUE, -- Número de licencia profesional
  license_expiry DATE, -- Vencimiento de licencia
  
  -- Información laboral
  hire_date DATE,
  employment_status TEXT CHECK (employment_status IN ('active', 'on_leave', 'retired', 'terminated')) DEFAULT 'active',
  department TEXT, -- Ej: "Departamento de Matemáticas"
  office_location TEXT,
  office_phone TEXT,
  
  -- Configuración de horario
  office_hours JSONB DEFAULT '{
    "monday": {"start": "08:00", "end": "17:00"},
    "tuesday": {"start": "08:00", "end": "17:00"},
    "wednesday": {"start": "08:00", "end": "17:00"},
    "thursday": {"start": "08:00", "end": "17:00"},
    "friday": {"start": "08:00", "end": "17:00"}
  }'::JSONB,
  
  -- Información académica
  biography TEXT,
  research_interests TEXT,
  publications TEXT[],
  
  -- Estadísticas
  total_courses_taught INTEGER DEFAULT 0,
  total_students_taught INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  
  -- Configuración
  max_students_per_class INTEGER DEFAULT 30,
  allows_makeup_exams BOOLEAN DEFAULT true,
  allows_late_submissions BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teacher_profiles_user_id ON public.teacher_profiles(user_id);
CREATE INDEX idx_teacher_profiles_institution_id ON public.teacher_profiles(institution_id);
CREATE INDEX idx_teacher_profiles_license ON public.teacher_profiles(license_number);
CREATE INDEX idx_teacher_profiles_department ON public.teacher_profiles(department);

-- ============================================================================
-- 2. TABLA: PARENT_PROFILES (Extensión de profiles para padres/tutores)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  
  -- Información personal
  occupation TEXT,
  workplace TEXT,
  work_phone TEXT,
  
  -- Relaciones familiares (puede tener múltiples hijos)
  children_ids UUID[] DEFAULT '{}'::UUID[], -- array de student user_ids
  
  -- Preferencias de comunicación
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'whatsapp', 'sms')) DEFAULT 'email',
  preferred_language TEXT DEFAULT 'es',
  receive_communications BOOLEAN DEFAULT true,
  communication_frequency TEXT CHECK (communication_frequency IN ('daily', 'weekly', 'monthly', 'as_needed')) DEFAULT 'weekly',
  
  -- Información educativa
  education_level TEXT, -- Ej: "Primaria", "Secundaria", "Superior"
  is_involved_in_school_activities BOOLEAN DEFAULT false,
  
  -- Autorización
  authorized_for_pickups BOOLEAN DEFAULT false,
  emergency_contact_for_others BOOLEAN DEFAULT false,
  
  -- Configuración de privacidad
  share_student_records BOOLEAN DEFAULT true,
  allow_contact_by_teachers BOOLEAN DEFAULT true,
  allow_contact_by_school BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parent_profiles_user_id ON public.parent_profiles(user_id);
CREATE INDEX idx_parent_profiles_institution_id ON public.parent_profiles(institution_id);
CREATE INDEX idx_parent_profiles_children ON public.parent_profiles USING GIN(children_ids);

-- ============================================================================
-- 3. TABLA: ADMIN_PROFILES (Extensión de profiles para administradores)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  
  -- Nivel de acceso
  access_level TEXT NOT NULL CHECK (access_level IN ('super_admin', 'admin', 'manager', 'coordinator')) DEFAULT 'manager',
  
  -- Departamento
  department TEXT, -- Ej: "Administración", "Académico", "Financiero"
  title TEXT, -- Ej: "Rector", "Director Académico"
  
  -- Permisos específicos (JSONB para flexibilidad)
  permissions JSONB DEFAULT '{
    "manage_users": false,
    "manage_courses": false,
    "manage_grades": false,
    "manage_finances": false,
    "manage_settings": false,
    "view_reports": true,
    "export_data": false,
    "manage_security": false
  }'::JSONB,
  
  -- Auditoría de admin
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  can_approve_budget BOOLEAN DEFAULT false,
  approval_limit DECIMAL(10,2), -- Límite de presupuesto a aprobar
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX idx_admin_profiles_user_id ON public.admin_profiles(user_id);
CREATE INDEX idx_admin_profiles_institution_id ON public.admin_profiles(institution_id);
CREATE INDEX idx_admin_profiles_access_level ON public.admin_profiles(access_level);
CREATE INDEX idx_admin_profiles_department ON public.admin_profiles(department);
CREATE INDEX idx_admin_profiles_is_active ON public.admin_profiles(is_active);

-- ============================================================================
-- 4. TABLA: ROLE_PERMISSIONS (Control de permisos por rol)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
  permission TEXT NOT NULL,
  description TEXT,
  is_granted BOOLEAN DEFAULT true,
  
  UNIQUE(institution_id, role, permission)
);

CREATE INDEX idx_role_permissions_institution ON public.role_permissions(institution_id);
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);

-- Insertar permisos por defecto
INSERT INTO public.role_permissions (role, permission, description)
VALUES
  -- Admin
  ('admin', 'manage_users', 'Crear, editar, eliminar usuarios'),
  ('admin', 'manage_courses', 'Crear, editar, eliminar cursos'),
  ('admin', 'manage_grades', 'Moderar calificaciones'),
  ('admin', 'view_all_reports', 'Ver reportes de toda la institución'),
  ('admin', 'export_data', 'Exportar datos del sistema'),
  ('admin', 'manage_security', 'Gestionar seguridad del sistema'),
  
  -- Teacher
  ('teacher', 'manage_own_courses', 'Crear y editar sus cursos'),
  ('teacher', 'grade_students', 'Calificar estudiantes'),
  ('teacher', 'view_own_reports', 'Ver reportes de sus cursos'),
  ('teacher', 'manage_assignments', 'Crear tareas y quizzes'),
  ('teacher', 'communicate_students', 'Enviar mensajes a estudiantes'),
  
  -- Student
  ('student', 'view_grades', 'Ver sus calificaciones'),
  ('student', 'submit_assignments', 'Entregar tareas'),
  ('student', 'view_schedule', 'Ver horarios'),
  ('student', 'view_materials', 'Ver materiales de clase'),
  ('student', 'message_teachers', 'Enviar mensajes a maestros'),
  
  -- Parent
  ('parent', 'view_child_grades', 'Ver calificaciones de hijos'),
  ('parent', 'view_child_schedule', 'Ver horarios de hijos'),
  ('parent', 'communicate_school', 'Comunicarse con la escuela'),
  ('parent', 'view_reports', 'Ver reportes de hijos')
ON CONFLICT (role, permission) DO NOTHING;

-- ============================================================================
-- 5. TABLA: RELATIONSHIP_TYPES (Tipos de relaciones entre estudiantes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  related_student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  relationship_type TEXT CHECK (relationship_type IN ('sibling', 'cousin', 'friend', 'classmate', 'other')),
  
  UNIQUE(student_id, related_student_id),
  CHECK (student_id != related_student_id)
);

CREATE INDEX idx_student_relationships_student ON public.student_relationships(student_id);

-- ============================================================================
-- 6. TABLA: TEACHER_COURSE_ASSIGNMENTS (Asignación de maestros a cursos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.teacher_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  
  -- Información de la asignación
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id),
  role TEXT DEFAULT 'instructor' CHECK (role IN ('instructor', 'co_instructor', 'substitute')),
  
  -- Rango de fechas
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(teacher_id, course_id)
);

CREATE INDEX idx_teacher_course_assignments_teacher ON public.teacher_course_assignments(teacher_id);
CREATE INDEX idx_teacher_course_assignments_course ON public.teacher_course_assignments(course_id);

-- ============================================================================
-- 7. FUNCIÓN: Crear perfiles específicos al crear usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_role_profile_on_user_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  IF NEW.role = 'teacher' AND NEW.institution_id IS NOT NULL THEN
    INSERT INTO public.teacher_profiles (user_id, institution_id)
    VALUES (NEW.id, NEW.institution_id)
    ON CONFLICT DO NOTHING;
    
  ELSIF NEW.role = 'parent' AND NEW.institution_id IS NOT NULL THEN
    INSERT INTO public.parent_profiles (user_id, institution_id)
    VALUES (NEW.id, NEW.institution_id)
    ON CONFLICT DO NOTHING;
    
  ELSIF NEW.role = 'admin' AND NEW.institution_id IS NOT NULL THEN
    INSERT INTO public.admin_profiles (user_id, institution_id)
    VALUES (NEW.id, NEW.institution_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear perfiles automáticamente
DROP TRIGGER IF EXISTS create_role_profile_trigger ON public.profiles;
CREATE TRIGGER create_role_profile_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_role_profile_on_user_insert();

-- ============================================================================
-- 8. RLS (Row Level Security)
-- ============================================================================

ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_course_assignments ENABLE ROW LEVEL SECURITY;

-- Teacher profiles
CREATE POLICY "teacher_view_own_profile" ON public.teacher_profiles
  FOR SELECT USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Parent profiles
CREATE POLICY "parent_view_own_profile" ON public.parent_profiles
  FOR SELECT USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Admin profiles
CREATE POLICY "admin_view_own_profile" ON public.admin_profiles
  FOR SELECT USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.admin_profiles ap WHERE ap.user_id = auth.uid() AND ap.access_level IN ('super_admin', 'admin')));

-- ============================================================================
-- 9. VISTAS ÚTILES
-- ============================================================================

-- Vista: Maestros por institución
CREATE OR REPLACE VIEW teachers_by_institution AS
SELECT
  i.id as institution_id,
  i.name as institution_name,
  tp.id as teacher_profile_id,
  p.id as user_id,
  p.email,
  p.full_name,
  tp.specialization,
  tp.department,
  tp.employment_status,
  COUNT(c.id) as courses_assigned,
  tp.total_students_taught
FROM public.institutions i
JOIN public.teacher_profiles tp ON tp.institution_id = i.id
JOIN public.profiles p ON p.id = tp.user_id
LEFT JOIN public.courses c ON c.teacher_id = p.id AND c.institution_id = i.id
GROUP BY i.id, i.name, tp.id, p.id, p.email, p.full_name, tp.specialization, tp.department, tp.employment_status, tp.total_students_taught;

-- Vista: Padres y sus hijos
CREATE OR REPLACE VIEW parents_and_children AS
SELECT
  pp.id as parent_profile_id,
  p.email as parent_email,
  p.full_name as parent_name,
  sp.user_id as child_id,
  sp2.email as child_email,
  sp2.full_name as child_name,
  COUNT(*) OVER (PARTITION BY pp.user_id) as total_children
FROM public.parent_profiles pp
JOIN public.profiles p ON p.id = pp.user_id
CROSS JOIN LATERAL UNNEST(pp.children_ids) AS sp(user_id)
JOIN public.profiles sp2 ON sp2.id = sp.user_id;

-- Vista: Permisos por institución y rol
CREATE OR REPLACE VIEW permissions_matrix AS
SELECT
  i.name as institution,
  rp.role,
  string_agg(rp.permission, ', ' ORDER BY rp.permission) as permissions
FROM public.role_permissions rp
JOIN public.institutions i ON i.id = rp.institution_id
WHERE rp.is_granted = true
GROUP BY i.name, rp.role;

-- ============================================================================
-- 10. COMENTARIO FINAL
-- ============================================================================

-- Normalización completada. Ahora:
-- - teacher_profiles: Información específica de maestros
-- - parent_profiles: Información específica de padres
-- - admin_profiles: Información específica de administradores
-- Los campos genéricos permanecen en profiles

COMMIT;

-- ============================================================================
-- VERIFICACIÓN POST-EJECUCIÓN
-- ============================================================================

/*
SELECT 'Tabla teacher_profiles creada' as status, COUNT(*) FROM public.teacher_profiles;
SELECT 'Tabla parent_profiles creada' as status, COUNT(*) FROM public.parent_profiles;
SELECT 'Tabla admin_profiles creada' as status, COUNT(*) FROM public.admin_profiles;
SELECT 'Tabla role_permissions creada' as status, COUNT(*) FROM public.role_permissions;
*/
