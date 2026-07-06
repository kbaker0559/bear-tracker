-- Bear Tracker Sprint 7 Supabase schema
-- Run this in Supabase SQL Editor.

create table if not exists players (
  id text primary key,
  name text not null,
  handicap integer not null default 0,
  quota integer not null default 0,
  pin text not null default '0000',
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
  course_id text references courses(id) on delete cascade,
  number integer not null check (number between 1 and 18),
  par integer not null,
  stroke_index integer not null check (stroke_index between 1 and 18),
  primary key (course_id, number)
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  course_id text references courses(id),
  name text not null,
  round_date date not null,
  status text not null default 'draft' check (status in ('draft','live','finalized')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists group_players (
  group_id uuid references groups(id) on delete cascade,
  player_id text references players(id),
  is_scorekeeper boolean not null default false,
  primary key (group_id, player_id)
);

create table if not exists scores (
  round_id uuid references rounds(id) on delete cascade,
  player_id text references players(id),
  hole integer not null check (hole between 1 and 18),
  gross integer not null check (gross between 1 and 15),
  updated_at timestamptz not null default now(),
  primary key (round_id, player_id, hole)
);

alter table players enable row level security;
alter table courses enable row level security;
alter table holes enable row level security;
alter table rounds enable row level security;
alter table groups enable row level security;
alter table group_players enable row level security;
alter table scores enable row level security;

-- Early-development policies. Tighten before sharing outside the Saturday group.
create policy "public read players" on players for select using (true);
create policy "public write players" on players for all using (true) with check (true);
create policy "public read courses" on courses for select using (true);
create policy "public write courses" on courses for all using (true) with check (true);
create policy "public read holes" on holes for select using (true);
create policy "public write holes" on holes for all using (true) with check (true);
create policy "public read rounds" on rounds for select using (true);
create policy "public write rounds" on rounds for all using (true) with check (true);
create policy "public read groups" on groups for select using (true);
create policy "public write groups" on groups for all using (true) with check (true);
create policy "public read group_players" on group_players for select using (true);
create policy "public write group_players" on group_players for all using (true) with check (true);
create policy "public read scores" on scores for select using (true);
create policy "public write scores" on scores for all using (true) with check (true);
