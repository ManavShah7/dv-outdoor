-- ---------------------------------------------------------------------------
-- board_visibility — what we can evidence about a board, not what we claim
--
-- One row per board, written by scripts/board-visibility.mjs from four open
-- datasets, each with a licence attached:
--
--   road_*            OpenStreetMap (ODbL) — nearest motorway/trunk/primary/
--                     secondary way, its name, class, distance and lanes
--   people_1km        Kontur (CC BY) — 400m population cells summed in 1 km
--   landmark_*        OpenStreetMap (ODbL) — rows from `hotspots`, counted
--                     only where the board falls inside the landmark's reach
--   night_percentile  NASA VIIRS Black Marble, ranked within our inventory
--
-- `score` is a weighted sum of the four, each normalised against the spread
-- across our own 650 boards rather than an absolute scale: "this board
-- versus the others" is the question a client is actually asking.
--
-- Derived data. Everything here can be rebuilt by re-running the script, so
-- it is safe to truncate and never needs a backup.
-- ---------------------------------------------------------------------------

create table if not exists public.board_visibility (
  board_id          uuid primary key references public.boards(id) on delete cascade,
  score             smallint not null check (score between 0 and 100),

  road_name         text,
  road_class        text check (road_class in ('motorway','trunk','primary','secondary')),
  road_distance_m   integer,
  road_lanes        smallint,

  people_1km        integer  not null default 0,

  landmark_count    smallint not null default 0,
  -- [{ name, kind, m }] — the three strongest, for the panel to name them
  landmark_top      jsonb    not null default '[]'::jsonb,

  night_percentile  smallint not null default 0 check (night_percentile between 0 and 100),

  -- which run produced this row, so a stale score is obvious
  computed_at       timestamptz not null default now()
);

-- The public map sorts and filters on the score, and the panel looks a board
-- up by id on every open.
create index if not exists board_visibility_score_idx on public.board_visibility (score desc);

alter table public.board_visibility enable row level security;

-- Admins through the browser; the public site reads it with the service role,
-- which bypasses RLS, and the scoring script writes with the same key.
drop policy if exists board_visibility_admin on public.board_visibility;
create policy board_visibility_admin on public.board_visibility
  for all using (is_admin()) with check (is_admin());

-- keep `computed_at` honest without the script having to set it
drop trigger if exists board_visibility_touch on public.board_visibility;
create trigger board_visibility_touch
  before update on public.board_visibility
  for each row execute function touch_updated_at();
