create extension if not exists pgcrypto;

create table if not exists players (
  id text primary key,
  name text not null,
  handicap integer not null default 0,
  quota integer not null default 0,
  pin text not null default '1234',
  active boolean not null default true,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists courses (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists holes (
  id uuid primary key default gen_random_uuid(),
  course_id text references courses(id) on delete cascade,
  hole_number integer not null,
  par integer not null,
  stroke_index integer not null,
  unique(course_id, hole_number)
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  round_date date not null,
  name text not null,
  course_id text references courses(id),
  status text not null default 'setup',
  notes text,
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  player_id text references players(id),
  hole_number integer not null,
  gross integer not null,
  updated_by text references players(id),
  updated_at timestamptz not null default now(),
  unique(round_id, player_id, hole_number)
);

alter table players enable row level security;
alter table courses enable row level security;
alter table holes enable row level security;
alter table rounds enable row level security;
alter table scores enable row level security;

-- Early testing policies. Tighten these before broader public use.
create policy if not exists "public read players" on players for select using (true);
create policy if not exists "public write players" on players for insert with check (true);
create policy if not exists "public update players" on players for update using (true);
create policy if not exists "public read courses" on courses for select using (true);
create policy if not exists "public read holes" on holes for select using (true);
create policy if not exists "public all rounds" on rounds for all using (true) with check (true);
create policy if not exists "public all scores" on scores for all using (true) with check (true);
