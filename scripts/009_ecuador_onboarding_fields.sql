-- Migración para campos de onboarding adaptados a Ecuador
-- Agrega DNI, coordenadas GPS, ciudad, provincia para geolocalización

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dni TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS location_url TEXT;

-- Índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_profiles_dni ON public.profiles(dni);
CREATE INDEX IF NOT EXISTS idx_profiles_email_unique ON public.profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_phone_unique ON public.profiles(phone) WHERE phone IS NOT NULL;

-- Constraint para evitar duplicados de DNI (ya existe con UNIQUE)
-- pero lo hacemos explícito para estudiantes
CREATE INDEX IF NOT EXISTS idx_student_profiles_dni ON public.student_profiles(document_number) 
  WHERE document_type = 'dni';
