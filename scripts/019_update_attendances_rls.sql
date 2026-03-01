-- Actualiza políticas RLS de asistencias para soportar visitas basadas en reuniones (meetings)
-- Permitirá a los profesores ver registros asociados a reuniones que organizan o en las que participan.

-- borramos políticas antiguas y reconstruimos

DROP POLICY IF EXISTS "attendances_select_own_or_teacher" ON public.attendances;
DROP POLICY IF EXISTS "attendances_insert_teacher" ON public.attendances;
DROP POLICY IF EXISTS "attendances_update_teacher" ON public.attendances;
DROP POLICY IF EXISTS "attendances_delete_admin" ON public.attendances;

CREATE POLICY "attendances_select" ON public.attendances FOR SELECT USING (
  student_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid()
  )
  OR (
    meeting_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_id
        AND (
          m.organizer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.meeting_participants mp
            WHERE mp.meeting_id = m.id AND mp.user_id = auth.uid()
          )
        )
    )
  )
);

-- Admin or teacher may insert, but if meeting_id provided ensure they belong to that meeting
CREATE POLICY "attendances_insert_teacher" ON public.attendances FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','teacher'))
  AND (
    meeting_id IS NULL -- back-compatibilidad: curso-based
    OR EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_id
        AND (
          m.organizer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.meeting_participants mp
            WHERE mp.meeting_id = m.id AND mp.user_id = auth.uid()
          )
        )
    )
  )
);

CREATE POLICY "attendances_update_teacher" ON public.attendances FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','teacher'))
);

CREATE POLICY "attendances_delete_admin" ON public.attendances FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
