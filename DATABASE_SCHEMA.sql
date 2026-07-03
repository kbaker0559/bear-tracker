-- Bear Tracker v1.7 starter Supabase schema
-- Run this in Supabase SQL Editor after creating your project.

create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  name text not null,
  handicap integer not null default 0,
  quota integer not null default 0,
  pin text,
  is_admin boolean default false,
  is_active boolean default true,
  is_guest boolean default false,
  created_at timestamptz default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists holes (
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
  created_at timestamptz default now(),
  finalized_at timestamptz
);

create table if not exists round_players (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  playing_handicap integer not null,
  starting_quota integer not null,
  group_number integer,
  is_scorekeeper boolean default false,
  unique(round_id, player_id)
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  hole_number integer not null,
  gross_score integer not null,
  entered_by uuid references players(id),
  updated_at timestamptz default now(),
  unique(round_id, player_id, hole_number)
);

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  payout_type text not null,
  amount integer not null default 0,
  notes text
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  actor_player_id uuid references players(id),
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);
