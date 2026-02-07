-- Rollback: remove unique indexes created by 004_add_unique_profiles_constraints.sql
-- Use only if you are sure you want to remove the uniqueness constraints.

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'profiles_unique_dni'
    ) THEN
        DROP INDEX IF EXISTS profiles_unique_dni;
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'profiles_unique_phone'
    ) THEN
        DROP INDEX IF EXISTS profiles_unique_phone;
    END IF;
END$$;

COMMIT;
