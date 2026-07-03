-- Bear Tracker Supabase Schema v1.0

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  handicap integer not null default 0,
  quota integer not null default 0,
  pin text not null default '1234',
  role text not null default 'player',
  active boolean not null default true,
  is_guest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists holes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  hole_number integer not null check (hole_number between 1 and 18),
  par integer not null,
  stroke_index integer not null check (stroke_index between 1 and 18),
  unique(course_id, hole_number)
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id),
  name text not null,
  round_date date not null,
  notes text,
  status text not null default 'setup',
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);

create table if not exists round_players (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id),
  handicap integer not null,
  quota integer not null,
  paid_place_amount integer not null default 0,
  skins_amount integer not null default 0,
  total_money integer not null default 0,
  quota_change integer not null default 0,
  unique(round_id, player_id)
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists group_players (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  player_id uuid not null references players(id),
  is_scorekeeper boolean not null default false,
  sort_order integer not null default 0,
  unique(group_id, player_id)
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id),
  hole_number integer not null check (hole_number between 1 and 18),
  gross integer not null check (gross between 1 and 20),
  entered_by uuid references players(id),
  updated_at timestamptz not null default now(),
  unique(round_id, player_id, hole_number)
);

create table if not exists correction_log (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid references players(id),
  hole_number integer,
  old_gross integer,
  new_gross integer,
  corrected_by uuid references players(id),
  reason text,
  created_at timestamptz not null default now()
);

alter publication supabase_realtime add table scores;
alter publication supabase_realtime add table rounds;
alter publication supabase_realtime add table groups;
alter publication supabase_realtime add table group_players;
