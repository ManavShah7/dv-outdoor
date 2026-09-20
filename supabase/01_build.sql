-- ============================================================================
-- DV Outdoor — schema. Run AFTER 00_nuke.sql.
-- Design rules this file follows:
--   1. Nothing is ever destroyed. Status changes, price changes and booking
--      lifecycle all append to history tables; rows are never overwritten.
--   2. Every booking carries a frozen snapshot of what was sold, so analytics
--      stay truthful even after a board is renamed, resized or moved.
--   3. One source of truth per fact. No portal keeps its own copy.
-- ============================================================================

-- ---------------------------------------------------------------- extensions
create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------- enums
create type user_role                 as enum ('admin', 'field_agent');
create type account_status            as enum ('pending', 'approved', 'rejected');

create type board_type                as enum ('unipole','hoarding','gantry','led_screen','wall_wrap','bus_shelter','other');
create type board_status              as enum ('available','booked','under_maintenance','damaged','pending_installation','retired');
create type lighting_type             as enum ('backlit','frontlit','none');
create type size_category             as enum ('small','medium','large');

create type rate_period               as enum ('per_day','per_week','per_month','flat');
create type rental_status             as enum ('draft','active','completed','cancelled');
create type banner_printed_by         as enum ('us','client');
create type rental_event_type         as enum ('created','activated','extended','rate_changed','dates_changed','cancelled','completed','note_added');

create type request_status            as enum ('new','contacted','negotiating','converted','declined','lost');
create type severity_level            as enum ('red','orange','yellow');
create type maintenance_status        as enum ('open','acknowledged','in_progress','resolved','rejected');
create type feedback_rating           as enum ('up','down');
create type photo_category            as enum ('listing','installation','maintenance_reported','maintenance_resolved');

create type alert_type                as enum ('weather','opportunity','permit','vacancy');
create type alert_status              as enum ('active','dismissed','expired');
create type audit_action              as enum ('insert','update','delete');

-- ------------------------------------------------------------------ profiles
create table profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  full_name     text,
  phone         text,
  role          user_role      not null default 'field_agent',
  status        account_status not null default 'pending',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------- companies
-- Recurring renters as real entities. Every booking points here so the
-- lifetime ledger per company is never split across spelling variants.
create table companies (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  name_normalized text generated always as (lower(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g'))) stored,
  industry       text,
  contact_person text,
  phone          text,
  email          text,
  address        text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
-- Blocks "Audi" / "Audi " / "audi." from becoming three companies.
create unique index companies_name_normalized_key on companies (name_normalized);

-- -------------------------------------------------------------------- boards
create table boards (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  name                text not null,

  -- location
  lat                 double precision not null,
  lng                 double precision not null,
  address             text,
  area                text,
  city                text not null,
  district            text,
  pincode             text,
  region              text not null default 'Saurashtra',
  facing              text,
  landmark            text,

  -- physical spec
  board_type          board_type    not null default 'hoarding',
  lighting_type       lighting_type not null default 'none',
  size_category       size_category,
  width_ft            numeric,
  height_ft           numeric,
  size_label          text,
  total_sqft          numeric generated always as (width_ft * height_ft) stored,

  -- commercial: the asking price. Actual negotiated price lives on rentals.
  asking_rate         numeric,
  asking_rate_period  rate_period not null default 'per_month',

  -- operational
  status              board_status not null default 'available',
  is_published        boolean not null default true,   -- visible on public portal
  permit_authority    text,
  permit_expiry_date  date,
  notes               text,

  created_by          uuid references profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint boards_lat_valid check (lat between -90 and 90),
  constraint boards_lng_valid check (lng between -180 and 180)
);
create index boards_status_idx    on boards (status);
create index boards_city_idx      on boards (city);
create index boards_published_idx on boards (is_published) where is_published;
create index boards_geo_idx       on boards (lat, lng);

-- --------------------------------------------------------------- board photos
create table board_photos (
  id                     uuid primary key default gen_random_uuid(),
  board_id               uuid not null references boards (id) on delete cascade,
  maintenance_request_id uuid,                      -- FK added after that table exists
  category               photo_category not null default 'listing',
  photo_url              text not null,
  caption                text,
  is_primary             boolean not null default false,
  sort_order             integer not null default 0,
  uploaded_by            uuid references profiles (id) on delete set null,
  uploaded_by_name       text,                      -- field crew have no account
  created_at             timestamptz not null default now()
);
create index board_photos_board_idx on board_photos (board_id, category);
create unique index board_photos_one_primary on board_photos (board_id) where is_primary;

-- ------------------------------------------------------------ client requests
-- Public "check availability" leads. Never writes to inventory directly.
create table client_requests (
  id                     uuid primary key default gen_random_uuid(),
  board_id               uuid references boards (id) on delete set null,
  company_name           text not null,
  contact_person         text not null,
  phone                  text not null,
  email                  text,
  message                text,
  requested_start_date   date,
  requested_duration_days integer,
  status                 request_status not null default 'new',
  matched_company_id     uuid references companies (id) on delete set null,
  handled_by             uuid references profiles (id) on delete set null,
  contacted_at           timestamptz,
  closed_at              timestamptz,
  decline_reason         text,
  source                 text not null default 'client_portal',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index client_requests_status_idx on client_requests (status, created_at desc);

-- ------------------------------------------------------------------- rentals
-- THE PERMANENT LEDGER. One row per booking, ever. Rows are never deleted and
-- never repurposed — a change of terms creates a rental_event, a new booking
-- creates a new row. Snapshot columns freeze what was actually sold.
create table rentals (
  id                  uuid primary key default gen_random_uuid(),
  board_id            uuid not null references boards (id)    on delete restrict,
  company_id          uuid not null references companies (id) on delete restrict,

  -- commercial terms
  rate                numeric not null,
  rate_period         rate_period not null default 'per_month',
  start_date          date not null,
  end_date            date,
  status              rental_status not null default 'active',
  banner_printed_by   banner_printed_by not null default 'us',

  -- ---- analytics snapshot: frozen at booking time, never updated ----
  asking_rate_at_booking numeric,
  board_city_at_booking  text,
  board_area_at_booking  text,
  board_type_at_booking  board_type,
  board_size_at_booking  size_category,
  board_light_at_booking lighting_type,
  board_sqft_at_booking  numeric,

  -- ---- derived analytics, computed by Postgres ----
  duration_days       integer generated always as (
                        case when end_date is null then null
                             else (end_date - start_date) + 1 end
                      ) stored,
  discount_pct        numeric generated always as (
                        case when asking_rate_at_booking is null or asking_rate_at_booking = 0 then null
                             else round(((asking_rate_at_booking - rate) / asking_rate_at_booking) * 100, 2) end
                      ) stored,
  start_year          integer generated always as (extract(year  from start_date)::int) stored,
  start_month         integer generated always as (extract(month from start_date)::int) stored,

  -- ---- attribution ----
  source_request_id   uuid references client_requests (id) on delete set null,
  created_by          uuid references profiles (id) on delete set null,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint rentals_dates_sane check (end_date is null or end_date >= start_date),
  constraint rentals_rate_positive check (rate >= 0)
);
-- A board can only be actively rented to one company at a time.
create unique index rentals_one_active_per_board on rentals (board_id) where status = 'active';
create index rentals_company_idx on rentals (company_id, start_date desc);
create index rentals_board_idx   on rentals (board_id,   start_date desc);
create index rentals_period_idx  on rentals (start_year, start_month);

-- -------------------------------------------------------------- rental events
-- Append-only lifecycle log. Extensions, renegotiations and cancellations are
-- recorded here rather than silently mutating the booking.
create table rental_events (
  id          uuid primary key default gen_random_uuid(),
  rental_id   uuid not null references rentals (id) on delete cascade,
  event_type  rental_event_type not null,
  old_values  jsonb,
  new_values  jsonb,
  note        text,
  actor_id    uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index rental_events_rental_idx on rental_events (rental_id, created_at);

-- -------------------------------------------------------- board price history
-- Every asking-price change, so revenue trend and discount analysis stay honest.
create table board_price_history (
  id             uuid primary key default gen_random_uuid(),
  board_id       uuid not null references boards (id) on delete cascade,
  asking_rate    numeric,
  rate_period    rate_period not null default 'per_month',
  effective_from timestamptz not null default now(),
  changed_by     uuid references profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);
create index board_price_history_board_idx on board_price_history (board_id, effective_from desc);

-- ------------------------------------------------------- board status history
create table board_status_history (
  id           uuid primary key default gen_random_uuid(),
  board_id     uuid not null references boards (id) on delete cascade,
  from_status  board_status,
  to_status    board_status not null,
  reason       text,
  changed_by   uuid references profiles (id) on delete set null,
  changed_by_name text,
  created_at   timestamptz not null default now()
);
create index board_status_history_board_idx on board_status_history (board_id, created_at desc);

-- ------------------------------------------------------ maintenance requests
-- Raised by field crew via QR scan. No account: they type their name, and the
-- board + timestamp are known from the scan, which gives admin who/when/where.
create table maintenance_requests (
  id                 uuid primary key default gen_random_uuid(),
  board_id           uuid not null references boards (id) on delete cascade,

  reported_by_name   text not null,
  reported_by_phone  text,
  description        text,
  reporter_severity  severity_level not null,

  -- AI triage
  ai_severity        severity_level,
  ai_urgency_score   integer,          -- 0-100, drives ordering inside a bucket
  ai_reasoning       text,
  ai_model           text,
  ai_evaluated_at    timestamptz,
  -- revenue exposure frozen at report time: a damaged board under contract is
  -- materially more urgent than an identical vacant one.
  revenue_at_risk    numeric,
  was_rented_at_report boolean,

  -- admin triage + the feedback signal that tunes future AI calls
  admin_feedback     feedback_rating,
  admin_feedback_note text,
  final_severity     severity_level,   -- admin override, if any
  status             maintenance_status not null default 'open',
  assigned_to        uuid references profiles (id) on delete set null,
  acknowledged_at    timestamptz,
  resolved_by_name   text,
  resolved_at        timestamptz,
  resolution_note    text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index maintenance_open_idx  on maintenance_requests (status, ai_severity, ai_urgency_score desc);
create index maintenance_board_idx on maintenance_requests (board_id, created_at desc);

-- close the deferred FK from board_photos
alter table board_photos
  add constraint board_photos_maintenance_fk
  foreign key (maintenance_request_id) references maintenance_requests (id) on delete cascade;

-- -------------------------------------------------------------------- alerts
create table alerts (
  id            uuid primary key default gen_random_uuid(),
  alert_type    alert_type not null,
  title         text not null,
  body          text,
  severity      severity_level,
  board_id      uuid references boards (id) on delete cascade,
  tracking_key  text,                  -- correlates the same event day over day
  status        alert_status not null default 'active',
  payload       jsonb,
  dismissed_by  uuid references profiles (id) on delete set null,
  dismissed_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index alerts_active_idx   on alerts (status, created_at desc);
create index alerts_tracking_idx on alerts (tracking_key);

create table alert_recipients (
  id          uuid primary key default gen_random_uuid(),
  alert_type  alert_type not null,
  name        text not null,
  phone       text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------- audit log
-- Trigger-written only. No role, not even admin, can insert here directly.
create table audit_log (
  id          bigserial primary key,
  table_name  text not null,
  record_id   uuid,
  action      audit_action not null,
  old_data    jsonb,
  new_data    jsonb,
  changed_by  uuid,
  created_at  timestamptz not null default now()
);
create index audit_log_table_idx  on audit_log (table_name, record_id, created_at desc);
create index audit_log_time_idx   on audit_log (created_at desc);
-- ============================================================================
-- DV Outdoor — functions & triggers. Run AFTER 01_schema.sql.
-- Everything here is enforced in the database, so all three portals get the
-- same behaviour no matter which one performed the write.
-- ============================================================================

-- --------------------------------------------------------------- role helper
-- NB: named current_app_role, NOT current_role — that is a reserved word in
-- Postgres and cannot be used as a function name.
create or replace function current_app_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from profiles
   where id = auth.uid() and status = 'approved'
$$;

create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(current_app_role() = 'admin', false) $$;

-- ------------------------------------------------------------- updated_at
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- audit log
create or replace function write_audit()
returns trigger language plpgsql security definer set search_path = public
as $$
declare rec_id uuid;
begin
  rec_id := case when tg_op = 'DELETE' then (to_jsonb(old)->>'id')::uuid
                 else (to_jsonb(new)->>'id')::uuid end;
  insert into audit_log (table_name, record_id, action, old_data, new_data, changed_by)
  values (
    tg_table_name,
    rec_id,
    lower(tg_op)::audit_action,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end,
    auth.uid()
  );
  return coalesce(new, old);
end $$;

-- ------------------------------------------------- board status history
create or replace function log_board_status_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into board_status_history (board_id, from_status, to_status, reason, changed_by)
    values (new.id, null, new.status, 'board created', auth.uid());
  elsif new.status is distinct from old.status then
    insert into board_status_history (board_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;

-- --------------------------------------------------- board price history
create or replace function log_board_price_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.asking_rate is not null then
      insert into board_price_history (board_id, asking_rate, rate_period, changed_by)
      values (new.id, new.asking_rate, new.asking_rate_period, auth.uid());
    end if;
  elsif new.asking_rate is distinct from old.asking_rate
     or new.asking_rate_period is distinct from old.asking_rate_period then
    insert into board_price_history (board_id, asking_rate, rate_period, changed_by)
    values (new.id, new.asking_rate, new.asking_rate_period, auth.uid());
  end if;
  return new;
end $$;

-- ------------------------------------------ freeze the analytics snapshot
-- Runs BEFORE INSERT on rentals: copies the board's state at the moment of
-- sale onto the booking, so later edits to the board never rewrite history.
create or replace function snapshot_rental()
returns trigger language plpgsql security definer set search_path = public
as $$
declare b boards%rowtype;
begin
  select * into b from boards where id = new.board_id;
  new.asking_rate_at_booking := coalesce(new.asking_rate_at_booking, b.asking_rate);
  new.board_city_at_booking  := b.city;
  new.board_area_at_booking  := b.area;
  new.board_type_at_booking  := b.board_type;
  new.board_size_at_booking  := b.size_category;
  new.board_light_at_booking := b.lighting_type;
  new.board_sqft_at_booking  := b.total_sqft;
  return new;
end $$;

-- ------------------------------------- keep board.status in sync with rentals
-- This is the core of "one change updates everywhere": admin marks a board
-- rented, and the client portal's availability flips in the same transaction.
create or replace function sync_board_from_rental()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'active' then
    update boards set status = 'booked' where id = new.board_id and status <> 'booked';

  elsif tg_op = 'UPDATE' then
    if new.status = 'active' and old.status <> 'active' then
      update boards set status = 'booked' where id = new.board_id;
    elsif old.status = 'active' and new.status in ('completed','cancelled') then
      -- only free the board if nothing else is live on it
      update boards set status = 'available'
       where id = new.board_id
         and status = 'booked'
         and not exists (
           select 1 from rentals r
            where r.board_id = new.board_id and r.status = 'active' and r.id <> new.id
         );
    end if;
  end if;
  return new;
end $$;

-- ---------------------------------------------- append-only rental lifecycle
create or replace function log_rental_event()
returns trigger language plpgsql security definer set search_path = public
as $$
declare ev rental_event_type;
begin
  if tg_op = 'INSERT' then
    insert into rental_events (rental_id, event_type, new_values, actor_id)
    values (new.id, 'created', to_jsonb(new), auth.uid());
    return new;
  end if;

  if new.status is distinct from old.status then
    ev := case new.status
            when 'active'    then 'activated'::rental_event_type
            when 'completed' then 'completed'::rental_event_type
            when 'cancelled' then 'cancelled'::rental_event_type
            else 'note_added'::rental_event_type end;
  elsif new.rate is distinct from old.rate then
    ev := 'rate_changed';
  elsif new.end_date is distinct from old.end_date then
    ev := case when old.end_date is not null and new.end_date > old.end_date
               then 'extended'::rental_event_type
               else 'dates_changed'::rental_event_type end;
  elsif new.start_date is distinct from old.start_date then
    ev := 'dates_changed';
  else
    return new;   -- nothing analytics cares about
  end if;

  insert into rental_events (rental_id, event_type, old_values, new_values, actor_id)
  values (new.id, ev, to_jsonb(old), to_jsonb(new), auth.uid());
  return new;
end $$;

-- ------------------------------ maintenance request flips board status
create or replace function sync_board_from_maintenance()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status = 'resolved' and old.status <> 'resolved' then
    update boards set status = case
        when exists (select 1 from rentals r where r.board_id = new.board_id and r.status = 'active')
        then 'booked'::board_status else 'available'::board_status end
     where id = new.board_id and status = 'under_maintenance';
  elsif tg_op = 'UPDATE' and new.status = 'in_progress' and old.status <> 'in_progress' then
    update boards set status = 'under_maintenance' where id = new.board_id;
  end if;
  return new;
end $$;

-- ------------------------------------------------------------ new auth user
-- Role/status are hardcoded here and never read from signup metadata, so a
-- self-registration can never grant itself admin or pre-approve itself.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, email, full_name, role, status)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'field_agent', 'pending')
  on conflict (id) do nothing;
  return new;
end $$;

-- ============================================================================
-- TRIGGER WIRING
-- ============================================================================

create trigger t_profiles_touch        before update on profiles        for each row execute function touch_updated_at();
create trigger t_companies_touch       before update on companies       for each row execute function touch_updated_at();
create trigger t_boards_touch          before update on boards          for each row execute function touch_updated_at();
create trigger t_rentals_touch         before update on rentals         for each row execute function touch_updated_at();
create trigger t_requests_touch        before update on client_requests for each row execute function touch_updated_at();
create trigger t_maint_touch           before update on maintenance_requests for each row execute function touch_updated_at();

-- history + sync
create trigger t_board_status_history  after  insert or update on boards for each row execute function log_board_status_change();
create trigger t_board_price_history   after  insert or update on boards for each row execute function log_board_price_change();

create trigger t_rental_snapshot       before insert on rentals  for each row execute function snapshot_rental();
create trigger t_rental_sync_board     after  insert or update on rentals for each row execute function sync_board_from_rental();
create trigger t_rental_events         after  insert or update on rentals for each row execute function log_rental_event();

create trigger t_maint_sync_board      after  update on maintenance_requests for each row execute function sync_board_from_maintenance();

-- audit everything that matters
create trigger t_audit_boards   after insert or update or delete on boards               for each row execute function write_audit();
create trigger t_audit_rentals  after insert or update or delete on rentals              for each row execute function write_audit();
create trigger t_audit_comps    after insert or update or delete on companies            for each row execute function write_audit();
create trigger t_audit_reqs     after insert or update or delete on client_requests      for each row execute function write_audit();
create trigger t_audit_maint    after insert or update or delete on maintenance_requests for each row execute function write_audit();
create trigger t_audit_profiles after insert or update or delete on profiles             for each row execute function write_audit();

-- auth hook
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
-- ============================================================================
-- DV Outdoor — analytics views. Run AFTER 02_functions.sql.
-- Derived, never stored twice. Always current because they read the ledger.
-- ============================================================================

-- Normalises any rate period into a single contract value + a monthly rate,
-- so bookings priced per-day and per-month can be summed together honestly.
create or replace view rental_financials as
select
  r.*,
  case r.rate_period
    when 'per_day'   then r.rate * coalesce(r.duration_days, 0)
    when 'per_week'  then r.rate * (coalesce(r.duration_days, 0) / 7.0)
    when 'per_month' then r.rate * (coalesce(r.duration_days, 0) / 30.0)
    when 'flat'      then r.rate
  end as contract_value,
  case r.rate_period
    when 'per_day'   then r.rate * 30
    when 'per_week'  then r.rate * 4.345
    when 'per_month' then r.rate
    when 'flat'      then case when coalesce(r.duration_days,0) > 0
                               then r.rate / (r.duration_days / 30.0) else r.rate end
  end as normalized_monthly_rate
from rentals r
where r.status in ('active','completed');

-- ------------------------------------------------- per-company lifetime ledger
create or replace view company_analytics as
select
  c.id                                            as company_id,
  c.name                                          as company_name,
  count(f.id)                                     as total_bookings,
  count(distinct f.board_id)                      as distinct_boards_taken,
  count(*) filter (where f.status = 'active')     as active_bookings,
  coalesce(sum(f.contract_value), 0)              as lifetime_revenue,
  round(avg(f.normalized_monthly_rate), 2)        as avg_monthly_rate,
  round(avg(f.discount_pct), 2)                   as avg_discount_pct,
  round(avg(f.duration_days), 1)                  as avg_duration_days,
  min(f.start_date)                               as first_booking_date,
  max(f.start_date)                               as latest_booking_date,
  mode() within group (order by f.board_city_at_booking) as favourite_city,
  mode() within group (order by f.board_area_at_booking) as favourite_area,
  mode() within group (order by f.start_month)           as favourite_month
from companies c
left join rental_financials f on f.company_id = c.id
group by c.id, c.name;

-- ------------------------------------------ per-company seasonality (heatmap)
create or replace view company_seasonality as
select company_id, start_year, start_month,
       count(*) as bookings,
       sum(contract_value) as revenue
from rental_financials
group by company_id, start_year, start_month;

-- ---------------------------------------------------- per-board performance
create or replace view board_analytics as
select
  b.id                                        as board_id,
  b.code, b.name, b.city, b.area, b.status,
  count(f.id)                                 as times_rented,
  count(distinct f.company_id)                as distinct_companies,
  coalesce(sum(f.contract_value), 0)          as lifetime_revenue,
  round(avg(f.normalized_monthly_rate), 2)    as avg_monthly_rate,
  coalesce(sum(f.duration_days), 0)           as total_days_rented,
  max(f.end_date)                             as last_rented_until,
  (select count(*) from maintenance_requests m where m.board_id = b.id) as maintenance_events
from boards b
left join rental_financials f on f.board_id = b.id
group by b.id, b.code, b.name, b.city, b.area, b.status;

-- ------------------------------------------------------ revenue over time
create or replace view monthly_revenue as
select start_year, start_month,
       count(*)                     as bookings,
       count(distinct company_id)   as companies,
       sum(contract_value)          as revenue
from rental_financials
group by start_year, start_month
order by start_year, start_month;

-- ------------------------------------------------------- lead funnel health
create or replace view lead_funnel as
select
  date_trunc('month', created_at)::date            as month,
  count(*)                                         as leads,
  count(*) filter (where status = 'converted')     as converted,
  round(100.0 * count(*) filter (where status = 'converted') / nullif(count(*),0), 1) as conversion_pct,
  round(avg(extract(epoch from (closed_at - created_at)) / 86400) filter (where status = 'converted'), 1) as avg_days_to_close
from client_requests
group by 1 order by 1;
-- ============================================================================
-- DV Outdoor — RLS + realtime. Run AFTER 03_analytics.sql.
--
-- SECURITY MODEL: RLS is admin-only on every table. There are NO anonymous
-- policies anywhere. The public client portal and the QR field flow reach the
-- database exclusively through trusted server routes using the service role
-- key, which is never exposed to a browser. A leaked anon key grants nothing.
-- ============================================================================

alter table profiles             enable row level security;
alter table companies            enable row level security;
alter table boards               enable row level security;
alter table board_photos         enable row level security;
alter table board_status_history enable row level security;
alter table board_price_history  enable row level security;
alter table client_requests      enable row level security;
alter table rentals              enable row level security;
alter table rental_events        enable row level security;
alter table maintenance_requests enable row level security;
alter table alerts               enable row level security;
alter table alert_recipients     enable row level security;
alter table audit_log            enable row level security;

-- every user can read their own profile row (needed to resolve role/status)
create policy profiles_self_read on profiles for select using (id = auth.uid());
create policy profiles_admin_all on profiles for all
  using (is_admin()) with check (is_admin());

-- admin-only full access across the business tables
create policy companies_admin  on companies            for all using (is_admin()) with check (is_admin());
create policy boards_admin     on boards               for all using (is_admin()) with check (is_admin());
create policy photos_admin     on board_photos         for all using (is_admin()) with check (is_admin());
create policy requests_admin   on client_requests      for all using (is_admin()) with check (is_admin());
create policy rentals_admin    on rentals              for all using (is_admin()) with check (is_admin());
create policy maint_admin      on maintenance_requests for all using (is_admin()) with check (is_admin());
create policy alerts_admin     on alerts               for all using (is_admin()) with check (is_admin());
create policy alertrcp_admin   on alert_recipients     for all using (is_admin()) with check (is_admin());

-- history tables are readable by admins but written only by triggers
create policy statushist_admin_read on board_status_history for select using (is_admin());
create policy pricehist_admin_read  on board_price_history  for select using (is_admin());
create policy rentalev_admin_read   on rental_events        for select using (is_admin());

-- audit_log: readable by admins, writable by NOBODY. The trigger is SECURITY
-- DEFINER so it bypasses RLS; no client session can forge or erase an entry.
create policy audit_admin_read on audit_log for select using (is_admin());

-- ============================================================================
-- REALTIME — so an admin change appears in every open admin session instantly.
-- (The public portal is not an authenticated Supabase client, so it refreshes
-- through Next.js cache revalidation on write rather than through this.)
-- ============================================================================
alter publication supabase_realtime add table boards;
alter publication supabase_realtime add table rentals;
alter publication supabase_realtime add table maintenance_requests;
alter publication supabase_realtime add table client_requests;
alter publication supabase_realtime add table alerts;
