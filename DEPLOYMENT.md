Deployment checklist — Profiles uniqueness and OAuth required data

Goal: Safely enforce uniqueness for `profiles.dni` and `profiles.phone`, require OAuth users to complete missing personal data, and deploy related code changes.

Pre-deploy (local/staging)

1. Run full test suite and manual smoke tests:
   - `pnpm install` 
   - `pnpm run build`
   - Start app locally and test OAuth flow: ensure that after Google sign-in, users without `full_name`, `dni` or `phone` are redirected to `/auth/register` and must complete required fields.

2. Apply migration in staging DB (Supabase recommended staging project):
   - Using psql:
     ```bash
     psql "postgres://<db_user>:<db_pass>@<db_host>:5432/<db_name>" -f scripts/004_add_unique_profiles_constraints.sql
     ```
   - Or paste `scripts/004_add_unique_profiles_constraints.sql` into Supabase SQL editor and run.

3. Verify migration:
   - Ensure no existing duplicate `dni` or `phone` values exist. If duplicates exist, resolve them before applying migration.
   - Query:
     ```sql
     SELECT dni, count(*) FROM profiles WHERE dni IS NOT NULL GROUP BY dni HAVING count(*) > 1;
     SELECT phone, count(*) FROM profiles WHERE phone IS NOT NULL GROUP BY phone HAVING count(*) > 1;
     ```

4. Test write flows in staging:
   - Create new user via OAuth and confirm redirect to registration and saving profile succeeds.
   - Edit profile and confirm duplicate checks block conflicting updates with clear UI errors.

Production deploy

1. Schedule a maintenance window if user traffic is critical.
2. Backup production DB before running migration.
3. Run the same SQL migration (`scripts/004_add_unique_profiles_constraints.sql`) on production DB.
4. If any issues, use `scripts/004_drop_unique_profiles_constraints.sql` to rollback.

Additional notes

- The codebase now performs application-level uniqueness checks and returns user-friendly errors when DB constraints reject a write. However, the DB-level unique indexes are the final protection against race conditions.
- If you use Supabase RLS, ensure your migration is run by a DB role with permission to create indexes.
- Consider adding a short maintenance notice to users while applying DB migrations in production.
