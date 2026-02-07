-- Add unique constraints to ensure DNI and phone are unique across profiles
-- Run this migration in your database (be careful on production; test in staging first)

BEGIN;

-- Create unique index for dni (allows multiple NULLs in Postgres)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'profiles_unique_dni'
    ) THEN
        CREATE UNIQUE INDEX profiles_unique_dni ON profiles (dni);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'profiles_unique_phone'
    ) THEN
        CREATE UNIQUE INDEX profiles_unique_phone ON profiles (phone);
    END IF;
END$$;

COMMIT;
