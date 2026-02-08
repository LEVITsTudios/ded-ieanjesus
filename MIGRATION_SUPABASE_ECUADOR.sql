-- ============================================================================
-- MIGRACIÓN: Agregar campos de Ecuador (DNI, GPS, provincia)
-- ============================================================================

-- 1. Agregar columnas si no existen
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dni TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS location_url TEXT;

-- 2. Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_profiles_dni ON public.profiles(dni);
CREATE INDEX IF NOT EXISTS idx_profiles_email_unique ON public.profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_phone_unique ON public.profiles(phone) WHERE phone IS NOT NULL;

-- 3. Verificar que las columnas existen
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND column_name IN ('dni', 'latitude', 'longitude', 'city', 'province', 'postal_code', 'location_url')
ORDER BY ordinal_position;
