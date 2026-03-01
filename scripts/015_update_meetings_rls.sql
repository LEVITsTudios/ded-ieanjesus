-- Actualiza la política de selección de reuniones para que los estudiantes de un curso
-- también puedan ver las clases asociadas. Se omitió la comprobación sobre
-- meeting_participants para evitar recursión con la política de participantes.

-- Ajustaremos también la política de meeting_participants en un script aparte si es necesario.

DROP POLICY IF EXISTS "meetings_select_participant" ON public.meetings;

CREATE POLICY "meetings_select_participant" ON public.meetings FOR SELECT USING (
  organizer_id = auth.uid()
  OR (
    meeting_type = 'class' AND
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = course_id
        AND e.student_id = auth.uid()
        AND e.status = 'active'
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
