-- DV Outdoor Advertising — core schema
create extension if not exists pgcrypto;

create type user_role as enum ('admin', 'field_agent');
create type board_type as enum ('unipole', 'hoarding', 'gantry', 'led_screen', 'wall_wrap', 'bus_shelter', 'other');
create type board_status as enum ('available', 'booked', 'under_maintenance', 'damaged', 'pending_installation');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'field_agent',
  created_at timestamptz not null default now()
);

create table boards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  city text not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  board_type board_type not null default 'hoarding',
  size_label text,
  status board_status not null default 'available',
  permit_expiry_date date,
  current_photo_url text,
  assigned_agent_id uuid references profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index boards_city_idx on boards (city);
create index boards_status_idx on boards (status);
create index boards_assigned_agent_idx on boards (assigned_agent_id);
create index boards_permit_expiry_idx on boards (permit_expiry_date);

create table board_status_history (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards (id) on delete cascade,
  changed_by uuid references profiles (id) on delete set null,
  old_status board_status,
  new_status board_status not null,
  photo_url text,
  note text,
  created_at timestamptz not null default now()
);

create index board_status_history_board_idx on board_status_history (board_id, created_at desc);

-- Keep boards.updated_at current on every write
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger boards_set_updated_at
  before update on boards
  for each row
  execute function set_updated_at();

-- Provision a profile row automatically when a new auth user signs up
create function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'field_agent');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table boards enable row level security;
alter table board_status_history enable row level security;

create function current_app_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- profiles: everyone signed in can read profiles (needed for agent assignment UI),
-- users can update only their own row, admins can update any
create policy "profiles_select_authenticated" on profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on profiles
  for update to authenticated using (id = auth.uid() or current_app_role() = 'admin');

-- boards: any signed-in user can read; only admins can insert/delete/update
-- directly. Field agents never get a raw UPDATE grant — a row policy can't
-- limit *which columns* a statement touches, so their only write path is the
-- record_board_status_update() function below, which is security definer and
-- only ever touches status/current_photo_url/notes.
create policy "boards_select_authenticated" on boards
  for select to authenticated using (true);

create policy "boards_insert_admin" on boards
  for insert to authenticated with check (current_app_role() = 'admin');

create policy "boards_delete_admin" on boards
  for delete to authenticated using (current_app_role() = 'admin');

create policy "boards_update_admin" on boards
  for update to authenticated using (current_app_role() = 'admin');

-- board_status_history is written exclusively by record_board_status_update();
-- no direct insert policy for authenticated users.
alter table board_status_history force row level security;

create policy "board_status_history_select_authenticated" on board_status_history
  for select to authenticated using (true);

-- The single write path for field agents (and the one admins should use too,
-- so every status change is consistently logged to board_status_history).
create function record_board_status_update(
  p_board_id uuid,
  p_new_status board_status,
  p_photo_url text default null,
  p_note text default null
) returns void as $$
declare
  v_role user_role := current_app_role();
  v_assigned_agent uuid;
  v_old_status board_status;
begin
  select assigned_agent_id, status into v_assigned_agent, v_old_status
  from boards where id = p_board_id
  for update;

  if v_role <> 'admin' and v_assigned_agent is distinct from auth.uid() then
    raise exception 'not permitted to update this board';
  end if;

  update boards
  set status = p_new_status,
      current_photo_url = coalesce(p_photo_url, current_photo_url),
      notes = coalesce(p_note, notes)
  where id = p_board_id;

  insert into board_status_history (board_id, changed_by, old_status, new_status, photo_url, note)
  values (p_board_id, auth.uid(), v_old_status, p_new_status, p_photo_url, p_note);
end;
$$ language plpgsql security definer set search_path = public;
