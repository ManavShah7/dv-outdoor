-- ============================================================================
-- DV Outdoor — field-agent invites. Run AFTER 01_build.sql.
-- Idempotent: safe to re-run.
--
-- An admin creates an invite carrying the agent's real name, so who reported a
-- fault is established once by the person who knows them, not typed freehand
-- by the reporter every time. The token in the link is the authorization —
-- accepting it produces an already-approved field_agent account, because the
-- admin already vetted them by issuing it.
-- ============================================================================

do $$ begin
  create type invite_status as enum ('pending', 'accepted', 'revoked', 'expired');
exception when duplicate_object then null; end $$;

create table if not exists field_invites (
  id            uuid primary key default gen_random_uuid(),
  token         text not null unique,
  full_name     text not null,
  email         text,
  phone         text,
  status        invite_status not null default 'pending',
  invited_by    uuid references profiles (id) on delete set null,
  expires_at    timestamptz not null default (now() + interval '14 days'),
  accepted_at   timestamptz,
  accepted_by   uuid references profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint field_invites_has_contact check (email is not null or phone is not null)
);

create index if not exists field_invites_token_idx  on field_invites (token);
create index if not exists field_invites_status_idx on field_invites (status, created_at desc);

alter table field_invites enable row level security;

-- Admin-only, like every other table. The accept flow runs server-side under
-- the service role, so the invitee never needs a policy of their own — and an
-- anonymous visitor cannot enumerate or read invites.
drop policy if exists invites_admin on field_invites;
create policy invites_admin on field_invites
  for all using (is_admin()) with check (is_admin());

drop trigger if exists t_audit_invites on field_invites;
create trigger t_audit_invites
  after insert or update or delete on field_invites
  for each row execute function write_audit();

-- Lets an admin promote an existing profile, and is the only path to 'admin'.
create or replace function promote_to_admin(target uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'only an admin can promote';
  end if;
  update profiles set role = 'admin', status = 'approved' where id = target;
end $$;

-- Approve / reject / suspend a profile. Admin-gated, same reasoning.
create or replace function set_account_status(target uuid, new_status account_status)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'only an admin can change account status';
  end if;
  update profiles set status = new_status where id = target;
end $$;

select 'field_invites ready' as result;
