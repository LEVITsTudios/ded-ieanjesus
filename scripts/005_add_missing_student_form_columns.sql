-- Add missing columns to student_profiles and student_surveys tables
-- This migration ensures all form fields have corresponding database columns

BEGIN;

-- =====================================================
-- ADD MISSING COLUMNS TO student_profiles
-- =====================================================

ALTER TABLE public.student_profiles
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_email TEXT,
ADD COLUMN IF NOT EXISTS secondary_contact_name TEXT,
ADD COLUMN IF NOT EXISTS secondary_contact_phone TEXT;

-- =====================================================
-- ADD MISSING COLUMNS TO student_surveys
-- =====================================================

ALTER TABLE public.student_surveys
ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS chronic_conditions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS disabilities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS artistic_talents TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS technical_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hobbies TEXT,
ADD COLUMN IF NOT EXISTS last_medical_checkup DATE,
ADD COLUMN IF NOT EXISTS vaccines_up_to_date BOOLEAN,
ADD COLUMN IF NOT EXISTS physical_activity_level TEXT CHECK (physical_activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
ADD COLUMN IF NOT EXISTS mental_health_conditions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS stress_level TEXT CHECK (stress_level IN ('very_low', 'low', 'moderate', 'high', 'very_high')),
ADD COLUMN IF NOT EXISTS sleep_quality TEXT CHECK (sleep_quality IN ('excellent', 'good', 'fair', 'poor')),
ADD COLUMN IF NOT EXISTS emotional_support TEXT CHECK (emotional_support IN ('always', 'usually', 'sometimes', 'rarely', 'never'));

COMMIT;
