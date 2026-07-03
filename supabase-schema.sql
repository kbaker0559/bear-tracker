-- Bear Tracker starter Supabase schema v1.2
-- Run in Supabase SQL Editor.

create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  name text not null,
  handicap integer not null default 0,
  quota integer not null default 0,
  pin text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists course_holes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  hole_number integer not null,
  par integer not null,
  stroke_index integer not null,
  unique(course_id, hole_number)
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  course_id uuid references courses(id),
  round_date date not null,
  name text not null,
  status text not null default 'setup',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists round_players (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  player_id uuid references players(id),
  starting_handicap integer not null,
  starting_quota integer not null,
  group_number integer,
  is_scorekeeper boolean not null default false,
  is_guest boolean not null default false,
  unique(round_id, player_id)
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  player_id uuid references players(id),
  hole_number integer not null,
  gross integer not null,
  entered_by uuid references players(id),
  updated_at timestamptz not null default now(),
  unique(round_id, player_id, hole_number)
);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  player_id uuid references players(id),
  category text not null,
  amount integer not null default 0,
  notes text
);

create table if not exists quota_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  round_id uuid references rounds(id) on delete set null,
  old_quota integer not null,
  new_quota integer not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table leagues enable row level security;
alter table players enable row level security;
alter table courses enable row level security;
alter table course_holes enable row level security;
alter table rounds enable row level security;
alter table round_players enable row level security;
alter table scores enable row level security;
alter table payouts enable row level security;
alter table quota_history enable row level security;

-- Temporary development policies for early testing.
-- Replace before wider release.
do $$ begin
  create policy "dev read leagues" on leagues for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "dev all players" on players for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "dev all courses" on courses for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "dev all course_holes" on course_holes for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "dev all rounds" on rounds for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "dev all round_players" on round_players for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "dev all scores" on scores for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "dev all payouts" on payouts for all using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "dev all quota_history" on quota_history for all using (true) with check (true);
exception when duplicate_object then null; end $$;
