-- Bear Tracker v1.1 starter schema
-- Run in Supabase SQL Editor.

create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists holes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  hole_number int not null check (hole_number between 1 and 18),
  par int not null check (par between 3 and 6),
  stroke_index int not null check (stroke_index between 1 and 18),
  unique(course_id, hole_number)
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  name text not null,
  handicap int not null default 0,
  quota int not null default 0,
  pin text,
  is_admin boolean not null default false,
  is_active boolean not null default true,
  is_guest boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  course_id uuid references courses(id),
  round_date date not null,
  name text not null,
  status text not null default 'setup' check (status in ('setup','live','finalized')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists round_players (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  player_id uuid references players(id),
  playing_handicap int not null,
  starting_quota int not null,
  is_in_money boolean not null default false,
  place_payout numeric(10,2) not null default 0,
  skins_payout numeric(10,2) not null default 0,
  unique(round_id, player_id)
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  group_number int not null,
  scorekeeper_player_id uuid references players(id),
  unique(round_id, group_number)
);

create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  player_id uuid references players(id),
  sort_order int not null default 0,
  unique(group_id, player_id)
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  player_id uuid references players(id),
  hole_number int not null check (hole_number between 1 and 18),
  gross_score int check (gross_score between 1 and 12),
  updated_by uuid references players(id),
  updated_at timestamptz not null default now(),
  unique(round_id, player_id, hole_number)
);

create table if not exists quota_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  round_id uuid references rounds(id) on delete cascade,
  old_quota int not null,
  points int not null,
  quota_result int not null,
  quota_change int not null,
  new_quota int not null,
  created_at timestamptz not null default now()
);
