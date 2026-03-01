-- Añade la columna participants a la tabla meetings para registrar número estimado

ALTER TABLE public.meetings
  ADD COLUMN participants INTEGER;
