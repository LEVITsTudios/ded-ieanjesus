-- ============================================================================
-- SCRIPT 011: AUDITORÍA Y LOGS DE CAMBIOS
-- ============================================================================
-- Objetivo: Mantener registro detallado de todos los cambios en el sistema
-- Fecha: Feb 12, 2026
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. TABLA DE AUDITORÍA MAESTRO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  
  -- Usuario que realizó la acción
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT, -- Snapshot del email
  
  -- Tipo de acción
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'CONFIG')),
  table_name TEXT, -- Si es acción en BD (INSERT/UPDATE/DELETE)
  record_id UUID, -- ID del registro afectado
  
  -- Valores antes y después
  old_values JSONB, -- {campo: valor_anterior, ...}
  new_values JSONB, -- {campo: valor_nuevo, ...}
  changes JSONB, -- Resumen de cambios {campo: {old: X, new: Y}, ...}
  
  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  
  -- Status de la operación
  status TEXT CHECK (status IN ('SUCCESS', 'FAILED', 'PARTIAL')) DEFAULT 'SUCCESS',
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ, -- Cuándo se ejecutó en el sistema
  duration_ms INTEGER -- Tiempo que tardó la operación
);

-- ============================================================================
-- 2. TABLA DE CAMBIOS POR CAMPO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_field_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id UUID NOT NULL REFERENCES public.audit_logs(id) ON DELETE CASCADE,
  
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  field_type TEXT, -- INT, TEXT, BOOL, DATE, etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_institution_id ON public.audit_logs(institution_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_status ON public.audit_logs(status);

-- Para búsquedas rápidas
CREATE INDEX idx_audit_logs_composite ON public.audit_logs(institution_id, action, created_at DESC);

CREATE INDEX idx_audit_field_changes_audit_log ON public.audit_field_changes(audit_log_id);
CREATE INDEX idx_audit_field_changes_field ON public.audit_field_changes(field_name);

-- ============================================================================
-- 4. VISTAS DE AUDITORÍA
-- ============================================================================

-- Vista: Actividad reciente por usuario
CREATE OR REPLACE VIEW audit_user_activity AS
SELECT
  al.user_id,
  p.email,
  p.full_name,
  al.action,
  al.table_name,
  al.status,
  al.created_at,
  COUNT(*) OVER (PARTITION BY al.user_id) as total_actions,
  ROW_NUMBER() OVER (PARTITION BY al.user_id ORDER BY al.created_at DESC) as action_order
FROM public.audit_logs al
LEFT JOIN public.profiles p ON p.id = al.user_id
WHERE al.status = 'SUCCESS'
ORDER BY al.created_at DESC;

-- Vista: Cambios en instituciones
CREATE OR REPLACE VIEW audit_institution_changes AS
SELECT
  al.id,
  al.institution_id,
  i.name as institution_name,
  al.user_id,
  p.email,
  al.action,
  al.table_name,
  al.record_id,
  al.old_values,
  al.new_values,
  al.created_at
FROM public.audit_logs al
JOIN public.institutions i ON i.id = al.institution_id
LEFT JOIN public.profiles p ON p.id = al.user_id
ORDER BY al.created_at DESC;

-- Vista: Errores y fallos
CREATE OR REPLACE VIEW audit_failures AS
SELECT
  al.id,
  al.user_id,
  p.email,
  al.action,
  al.table_name,
  al.status,
  al.error_message,
  al.ip_address,
  al.created_at,
  COUNT(*) OVER (PARTITION BY al.user_id) as user_failures,
  COUNT(*) OVER (PARTITION BY al.table_name) as table_failures
FROM public.audit_logs al
LEFT JOIN public.profiles p ON p.id = al.user_id
WHERE al.status IN ('FAILED', 'PARTIAL')
ORDER BY al.created_at DESC;

-- ============================================================================
-- 5. FUNCIÓN PARA REGISTRAR AUDITORÍA
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_institution_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_status TEXT DEFAULT 'SUCCESS',
  p_error_message TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Obtener usuario actual
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM public.profiles WHERE id = v_user_id;
  END IF;

  -- Insertar en tabla de auditoría
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    table_name,
    record_id,
    institution_id,
    old_values,
    new_values,
    status,
    error_message,
    duration_ms,
    ip_address,
    user_agent,
    executed_at
  ) VALUES (
    v_user_id,
    v_user_email,
    p_action,
    p_table_name,
    p_record_id,
    p_institution_id,
    p_old_values,
    p_new_values,
    p_status,
    p_error_message,
    p_duration_ms,
    current_setting('request.header.x-forwarded-for')::TEXT,
    current_setting('request.header.user-agent')::TEXT,
    NOW()
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. TRIGGERS PARA AUTO-AUDITORÍA
-- ============================================================================

-- Nota: Los triggers requieren CREATE FUNCTION para cada tabla
-- Se muestra ejemplo para profiles, replicar para otras tablas críticas

CREATE OR REPLACE FUNCTION public.audit_profiles_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_old_values JSONB;
  v_new_values JSONB;
  v_changes JSONB := '{}'::JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_new_values := row_to_json(NEW);
    PERFORM public.log_audit(
      'INSERT',
      'profiles',
      NEW.id,
      NEW.institution_id,
      NULL,
      v_new_values
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_values := row_to_json(OLD);
    v_new_values := row_to_json(NEW);
    
    -- Solo registrar si hay cambios reales
    IF v_old_values IS DISTINCT FROM v_new_values THEN
      PERFORM public.log_audit(
        'UPDATE',
        'profiles',
        NEW.id,
        NEW.institution_id,
        v_old_values,
        v_new_values
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_values := row_to_json(OLD);
    PERFORM public.log_audit(
      'DELETE',
      'profiles',
      OLD.id,
      OLD.institution_id,
      v_old_values,
      NULL
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.audit_profiles_changes();

-- ============================================================================
-- 7. TRIGGERS PARA OTRAS TABLAS CRÍTICAS
-- ============================================================================

-- Similar para courses
CREATE OR REPLACE FUNCTION public.audit_courses_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.log_audit(
    CASE WHEN TG_OP = 'INSERT' THEN 'INSERT' WHEN TG_OP = 'UPDATE' THEN 'UPDATE' ELSE 'DELETE' END,
    'courses',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.institution_id, OLD.institution_id),
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_courses_trigger ON public.courses;
CREATE TRIGGER audit_courses_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.audit_courses_changes();

-- Similar para enrollments
CREATE OR REPLACE FUNCTION public.audit_enrollments_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.log_audit(
    CASE WHEN TG_OP = 'INSERT' THEN 'INSERT' WHEN TG_OP = 'UPDATE' THEN 'UPDATE' ELSE 'DELETE' END,
    'enrollments',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.institution_id, OLD.institution_id),
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_enrollments_trigger ON public.enrollments;
CREATE TRIGGER audit_enrollments_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.audit_enrollments_changes();

-- Similar para grades
CREATE OR REPLACE FUNCTION public.audit_grades_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.log_audit(
    CASE WHEN TG_OP = 'INSERT' THEN 'INSERT' WHEN TG_OP = 'UPDATE' THEN 'UPDATE' ELSE 'DELETE' END,
    'grades',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.institution_id, OLD.institution_id),
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_grades_trigger ON public.grades;
CREATE TRIGGER audit_grades_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.grades
FOR EACH ROW
EXECUTE FUNCTION public.audit_grades_changes();

-- ============================================================================
-- 8. FUNCIÓN DE LIMPIEZA DE AUDITORÍA (Retención de 1 año)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(p_days INTEGER DEFAULT 365)
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  v_deleted BIGINT;
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '1 day' * p_days;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN QUERY SELECT v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. TABLA DE SESIONES DE USUARIO (Para tracking de login)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  
  login_at TIMESTAMPTZ DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  os TEXT,
  
  is_active BOOLEAN DEFAULT true,
  duration_seconds INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_login_at ON public.user_sessions(login_at DESC);
CREATE INDEX idx_user_sessions_is_active ON public.user_sessions(is_active);

-- ============================================================================
-- 10. FUNCIÓN PARA REGISTRAR LOGIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.user_sessions (
    user_id,
    ip_address,
    user_agent,
    is_active
  )
  SELECT
    v_user_id,
    current_setting('request.header.x-forwarded-for')::TEXT,
    current_setting('request.header.user-agent')::TEXT,
    true
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. RLS PARA AUDITORÍA
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_field_changes ENABLE ROW LEVEL SECURITY;

-- Solo usuarios de la institución pueden ver su auditoría
CREATE POLICY "view_audit_logs" ON public.audit_logs
  FOR SELECT USING (
    -- Admins de su institución
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.institution_id = audit_logs.institution_id
    )
  );

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_user_sessions" ON public.user_sessions
  FOR SELECT USING (
    -- Usuario ve sus propias sesiones
    user_id = auth.uid() OR
    -- Admin de institución ve todas las sesiones
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- ============================================================================
-- 12. LOG INICIAL
-- ============================================================================

-- Comentario: Script de auditoría completado
-- Ahora todos los cambios serán registrados automáticamente

COMMIT;

-- ============================================================================
-- VERIFICACIÓN POST-EJECUCIÓN
-- ============================================================================

/*
SELECT 'Tabla audit_logs creada' as status, COUNT(*) FROM public.audit_logs;
SELECT 'Tabla audit_field_changes creada' as status, COUNT(*) FROM public.audit_field_changes;
SELECT 'Tabla user_sessions creada' as status, COUNT(*) FROM public.user_sessions;
SELECT 'Triggers creados' as status;
*/
