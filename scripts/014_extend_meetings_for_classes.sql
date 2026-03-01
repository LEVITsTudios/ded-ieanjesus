-- Agrega columnas a la tabla "meetings" para soportar sesión de clase

ALTER TABLE public.meetings
  ADD COLUMN topic TEXT,
  ADD COLUMN materials_url TEXT,
  ADD COLUMN teacher_attended BOOLEAN DEFAULT TRUE,
  ADD COLUMN feedback TEXT;

-- opcional: si se desea relacionar directamente materiales con una reunión, también se
-- puede crear un join table o agregar meeting_id a "materials".

/*
-- alternativa: vincular materiales existentes
ALTER TABLE public.materials
  ADD COLUMN meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE;
*/
