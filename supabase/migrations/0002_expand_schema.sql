-- DV Outdoor Advertising — schema expansion for companies, rentals, leads,
-- maintenance, photos, alerts, and a database-wide audit trail.
-- Run this in the Supabase SQL Editor AFTER 0001_init.sql has been applied.

-- ============================================================================
-- New enums
-- ============================================================================
create type lighting_type as enum ('backlit', 'frontlit', 'none');
create type size_category as enum ('small', 'medium', 'large');
create type severity_level as enum ('red', 'orange', 'yellow');
create type rate_period as enum ('per_day', 'per_week', 'per_month', 'flat');
create type rental_status as enum ('active', 'completed', 'cancelled');
create type banner_printed_by as enum ('us', 'client');
create type request_status as enum ('new', 'contacted', 'converted', 'declined');
create type maintenance_request_status as enum ('open', 'in_progress', 'resolved');
create type feedback_rating as enum ('up', 'down');
create type photo_category as enum ('listing', 'maintenance_reported', 'maintenance_resolved');
create type alert_type as enum ('weather', 'opportunity');
create type alert_status as enum ('active', 'dismissed', 'expired');
create type alert_category as enum (
  'new_lead', 'maintenance_red', 'maintenance_orange', 'maintenance_yellow',
  'weather', 'opportunity', 'weekly_digest', 'lease_renewal', 'permit_renewal'
);

-- ============================================================================
-- boards: extend for the fuller listing detail, drop columns that assumed
-- field-agent accounts / a single photo (both superseded below)
-- ============================================================================
alter table boards
  add column region text,
  add column lighting_type lighting_type,
  add column size_category size_category,
  add column permit_authority text;

-- No data loss: any existing current_photo_url moves into board_photos before
-- the column is dropped (a no-op today since seed data has none set).
create table board_photos (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards (id) on delete cascade,
  maintenance_request_id uuid,
  category photo_category not null default 'listing',
  photo_url text not null,
  caption text,
  uploaded_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

insert into board_photos (board_id, photo_url, category)
select id, current_photo_url, 'listing' from boards where current_photo_url is not null;

alter table boards
  drop column current_photo_url,
  drop column assigned_agent_id;

create index board_photos_board_idx on board_photos (board_id);

-- ============================================================================
-- companies — recurring renters, tracked as a real entity (not free text)
-- ============================================================================
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index companies_name_idx on companies (name);

create trigger companies_set_updated_at
  before update on companies
  for each row
  execute function set_updated_at();

-- ============================================================================
-- rentals — the permanent historical ledger. A board's current status is a
-- fast filter flag; this table is the source of truth for "who rented what,
-- when, for how much" and is never overwritten, only appended to.
-- ============================================================================
create table rentals (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards (id) on delete cascade,
  company_id uuid not null references companies (id) on delete restrict,
  rate numeric not null,
  rate_period rate_period not null default 'per_month',
  start_date date not null,
  end_date date,
  status rental_status not null default 'active',
  banner_printed_by banner_printed_by not null default 'us',
  notes text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one active rental per board at a time.
create unique index rentals_one_active_per_board on rentals (board_id) where status = 'active';
create index rentals_board_idx on rentals (board_id);
create index rentals_company_idx on rentals (company_id);
create index rentals_dates_idx on rentals (start_date, end_date);

create trigger rentals_set_updated_at
  before update on rentals
  for each row
  execute function set_updated_at();

-- ============================================================================
-- client_requests — public "check availability" leads. Never mutates board
-- or rental data directly; admin reviews and manually converts.
-- ============================================================================
create table client_requests (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards (id) on delete cascade,
  company_name text not null,
  contact_person text not null,
  phone text not null,
  email text,
  message text,
  requested_start_date date,
  requested_duration_days integer,
  status request_status not null default 'new',
  resulting_rental_id uuid references rentals (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index client_requests_board_idx on client_requests (board_id);
create index client_requests_status_idx on client_requests (status);

create trigger client_requests_set_updated_at
  before update on client_requests
  for each row
  execute function set_updated_at();

-- ============================================================================
-- maintenance_requests — field-reported, AI-triaged, admin-resolved.
-- reported_by_name / resolved_by_name are free text since field workers have
-- no accounts (QR scan is the only "auth"); this is deliberate, not an
-- oversight — see the admin_feedback column for the AI-learning loop.
-- ============================================================================
create table maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards (id) on delete cascade,
  reported_by_name text not null,
  description text,
  reporter_severity severity_level not null,
  ai_severity severity_level,
  ai_reasoning text,
  admin_feedback feedback_rating,
  status maintenance_request_status not null default 'open',
  resolved_by_name text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table board_photos
  add constraint board_photos_maintenance_request_fkey
  foreign key (maintenance_request_id) references maintenance_requests (id) on delete set null;

create index maintenance_requests_board_idx on maintenance_requests (board_id);
create index maintenance_requests_status_idx on maintenance_requests (status);
create index maintenance_requests_ai_severity_idx on maintenance_requests (ai_severity);

create trigger maintenance_requests_set_updated_at
  before update on maintenance_requests
  for each row
  execute function set_updated_at();

-- ============================================================================
-- alerts — weather/opportunity monitoring. tracking_key correlates today's
-- finding with a previously-seen event (e.g. the same forming cyclone) so
-- severity can escalate day over day instead of creating duplicate rows.
-- ============================================================================
create table alerts (
  id uuid primary key default gen_random_uuid(),
  type alert_type not null,
  city text not null,
  title text not null,
  description text,
  severity severity_level not null,
  source_url text,
  event_date date,
  tracking_key text not null,
  status alert_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index alerts_tracking_key_idx on alerts (tracking_key);
create index alerts_status_idx on alerts (status);

create trigger alerts_set_updated_at
  before update on alerts
  for each row
  execute function set_updated_at();

-- ============================================================================
-- alert_recipients — WhatsApp routing list, managed from an admin Settings
-- page. No code changes needed to add/remove a number or change what someone
-- is subscribed to.
-- ============================================================================
create table alert_recipients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  subscribed_categories alert_category[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- audit_log — database-wide, trigger-enforced. Every insert/update/delete on
-- the tables below is captured regardless of which application code path
-- performed it, because it happens at the database level, not the app level.
-- ============================================================================
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id uuid not null,
  action text not null,
  changed_by uuid references profiles (id) on delete set null,
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz not null default now()
);

create index audit_log_table_row_idx on audit_log (table_name, row_id, changed_at desc);

create function log_audit() returns trigger as $$
begin
  insert into audit_log (table_name, row_id, action, changed_by, old_data, new_data)
  values (
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    lower(TG_OP),
    auth.uid(),
    case when TG_OP in ('DELETE', 'UPDATE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  if TG_OP = 'DELETE' then return old; else return new; end if;
end;
$$ language plpgsql security definer set search_path = public;

create trigger boards_audit after insert or update or delete on boards for each row execute function log_audit();
create trigger companies_audit after insert or update or delete on companies for each row execute function log_audit();
create trigger rentals_audit after insert or update or delete on rentals for each row execute function log_audit();
create trigger client_requests_audit after insert or update or delete on client_requests for each row execute function log_audit();
create trigger maintenance_requests_audit after insert or update or delete on maintenance_requests for each row execute function log_audit();
create trigger board_photos_audit after insert or update or delete on board_photos for each row execute function log_audit();
create trigger alerts_audit after insert or update or delete on alerts for each row execute function log_audit();

-- ============================================================================
-- record_board_status_update — simplified now that field agents have no
-- accounts and photos live in board_photos rather than a boards column.
-- `create or replace` cannot change a function's parameter list (Postgres
-- treats a different signature as a different function), so the old
-- 4-parameter version — which references boards.current_photo_url, a column
-- this migration drops — must be dropped explicitly or it's left behind
-- broken and still callable by existing application code.
-- ============================================================================
drop function if exists record_board_status_update(uuid, board_status, text, text);

create function record_board_status_update(
  p_board_id uuid,
  p_new_status board_status,
  p_note text default null
) returns void as $$
declare
  v_old_status board_status;
begin
  if current_app_role() <> 'admin' then
    raise exception 'only admins can update board status';
  end if;

  select status into v_old_status from boards where id = p_board_id for update;

  update boards set status = p_new_status where id = p_board_id;

  insert into board_status_history (board_id, changed_by, old_status, new_status, note)
  values (p_board_id, auth.uid(), v_old_status, p_new_status, p_note);
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================================
-- create_rental / end_rental — the only way a rental is opened or closed, so
-- the board's fast-filter status always stays in sync with the ledger.
-- ============================================================================
create function create_rental(
  p_board_id uuid,
  p_company_id uuid,
  p_rate numeric,
  p_rate_period rate_period,
  p_start_date date,
  p_end_date date,
  p_banner_printed_by banner_printed_by,
  p_notes text default null
) returns uuid as $$
declare
  v_rental_id uuid;
begin
  if current_app_role() <> 'admin' then
    raise exception 'only admins can create rentals';
  end if;

  insert into rentals (board_id, company_id, rate, rate_period, start_date, end_date, banner_printed_by, notes, created_by)
  values (p_board_id, p_company_id, p_rate, p_rate_period, p_start_date, p_end_date, p_banner_printed_by, p_notes, auth.uid())
  returning id into v_rental_id;

  update boards set status = 'booked' where id = p_board_id;

  return v_rental_id;
end;
$$ language plpgsql security definer set search_path = public;

create function end_rental(p_rental_id uuid) returns void as $$
declare
  v_board_id uuid;
begin
  if current_app_role() <> 'admin' then
    raise exception 'only admins can end rentals';
  end if;

  update rentals set status = 'completed', end_date = coalesce(end_date, current_date)
  where id = p_rental_id and status = 'active'
  returning board_id into v_board_id;

  if v_board_id is not null then
    update boards set status = 'available' where id = v_board_id;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================================
-- Row Level Security — admin-only, full stop. No anonymous/public policy
-- exists on any table in this file. Public browsing and field-worker actions
-- are mediated entirely by trusted server code (service role key, never
-- exposed to a browser) — see the app's API routes, not database policies,
-- for that access. This means a leaked anon key grants access to nothing new.
-- ============================================================================
alter table companies enable row level security;
alter table rentals enable row level security;
alter table client_requests enable row level security;
alter table maintenance_requests enable row level security;
alter table board_photos enable row level security;
alter table alerts enable row level security;
alter table alert_recipients enable row level security;
alter table audit_log enable row level security;
alter table audit_log force row level security;

create policy "companies_admin_all" on companies for all to authenticated
  using (current_app_role() = 'admin') with check (current_app_role() = 'admin');

create policy "rentals_admin_all" on rentals for all to authenticated
  using (current_app_role() = 'admin') with check (current_app_role() = 'admin');

create policy "client_requests_admin_all" on client_requests for all to authenticated
  using (current_app_role() = 'admin') with check (current_app_role() = 'admin');

create policy "maintenance_requests_admin_all" on maintenance_requests for all to authenticated
  using (current_app_role() = 'admin') with check (current_app_role() = 'admin');

create policy "board_photos_admin_all" on board_photos for all to authenticated
  using (current_app_role() = 'admin') with check (current_app_role() = 'admin');

create policy "alerts_admin_all" on alerts for all to authenticated
  using (current_app_role() = 'admin') with check (current_app_role() = 'admin');

create policy "alert_recipients_admin_all" on alert_recipients for all to authenticated
  using (current_app_role() = 'admin') with check (current_app_role() = 'admin');

-- audit_log: admins may read it to investigate history, but no one — not even
-- an admin's own session — can insert/update/delete rows directly. Only the
-- log_audit() trigger (security definer) writes to this table.
create policy "audit_log_admin_select" on audit_log for select to authenticated
  using (current_app_role() = 'admin');
