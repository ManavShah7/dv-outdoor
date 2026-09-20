-- DV Outdoor — full database nuke. Drops EVERYTHING in public + all auth users.
-- Run in Supabase Dashboard → SQL Editor. Irreversible.

-- 1. Drop every table, type, function, trigger, policy in one shot.
drop schema public cascade;
create schema public;

-- 2. Restore the grants Supabase expects on a fresh public schema.
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

alter default privileges in schema public
  grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;

-- 3. Wipe all auth accounts (cascades to identities/sessions).
delete from auth.users;

-- 4. Confirm it's empty.
select count(*) as tables_left from information_schema.tables where table_schema = 'public';
select count(*) as users_left from auth.users;
