-- Simplifica la política de meeting_participants para romper dependencia circular
-- con la tabla meetings.

DROP POLICY IF EXISTS "meeting_participants_select_own" ON public.meeting_participants;

CREATE POLICY "meeting_participants_select_own" ON public.meeting_participants FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- nota: el organizador ya puede ver sus propios participantes si insertas
-- un registro con user_id igual a su uid, o podemos usar un VIEW/función si
-- queremos algo más sofisticado, pero lo básico evita la recursión.
