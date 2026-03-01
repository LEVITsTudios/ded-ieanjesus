-- Añade referencia a reuniones en las asistencias y ajusta restricciones
-- Esta migración prepara el sistema para que la asistencia se registre por sesión
-- de clase (meeting) en lugar de solo por curso.

ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE;

-- eliminar la restricción única antigua basada en curso+fecha
ALTER TABLE public.attendances
  DROP CONSTRAINT IF EXISTS attendances_student_id_course_id_date_key,
  DROP CONSTRAINT IF EXISTS attendances_student_id_course_id_date_unique;

-- índice único nuevo por reunión (permitiendo múltiples registros para cursos si no hay reunión)
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendances_student_meeting ON public.attendances(student_id, meeting_id);

-- índices para consultas por reunión y fecha
CREATE INDEX IF NOT EXISTS idx_attendances_meeting_date ON public.attendances(meeting_id, date);

-- Nota: los registros existentes continuarán teniendo course_id sin meeting_id; los nuevos
-- deberán incluir meeting_id obligatoriamente si la asistencia corresponde a una sesión.
