-- /wash worker interface — Phase 1 schema
-- Entities per Build Brief section 7. Cluster is the top-level entity;
-- Society, Route, Worker, Vehicle all hang off it. Nothing here assumes
-- "one society, one team" — a Worker/Route can span societies within a Cluster.
--
-- Fields marked PROVISIONAL were not specified at field-level in the brief
-- (only entity names were given) and were inferred to make the entity usable.
-- Treat them as overridable, not final.

create extension if not exists "uuid-ossp";

-- ============================================================
-- Cluster: top-level entity. A geographic/operational grouping
-- of societies served by one or more worker teams.
-- ============================================================
create table cluster (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text, -- PROVISIONAL
  created_at timestamptz not null default now()
);

-- ============================================================
-- Society: belongs to exactly one Cluster. A Cluster has many.
-- ============================================================
create table society (
  id uuid primary key default uuid_generate_v4(),
  cluster_id uuid not null references cluster(id) on delete cascade,
  name text not null,
  address text, -- PROVISIONAL
  tower_list text[] not null default '{}', -- PROVISIONAL: canonical tower names for this society, used to group Today's Route
  created_at timestamptz not null default now()
);
create index on society (cluster_id);

-- ============================================================
-- Resident: PROVISIONAL entity, minimal fields. No resident-facing
-- app or worker-to-resident channel exists in Phase 1 — this table
-- exists only so Vehicle/Complaint can reference an owner.
-- ============================================================
create table resident (
  id uuid primary key default uuid_generate_v4(),
  society_id uuid not null references society(id) on delete cascade,
  tower text not null,
  flat_number text not null,
  name text, -- PROVISIONAL
  phone text, -- PROVISIONAL, not used for any worker-facing communication
  created_at timestamptz not null default now()
);
create index on resident (society_id);

-- ============================================================
-- Vehicle
-- ============================================================
create table vehicle (
  id uuid primary key default uuid_generate_v4(),
  society_id uuid not null references society(id) on delete cascade,
  resident_id uuid references resident(id) on delete set null,
  tower text not null,
  flat_number text not null,
  registration_number text, -- PROVISIONAL, may be unknown/unplated
  vehicle_type text not null default 'car', -- PROVISIONAL: car | two_wheeler
  color text, -- PROVISIONAL
  active boolean not null default true, -- PROVISIONAL: false if resident opts out / moves out
  created_at timestamptz not null default now()
);
create index on vehicle (society_id, tower);

-- ============================================================
-- Worker: covers both worker and supervisor roles per Cluster.
-- ============================================================
create table worker (
  id uuid primary key default uuid_generate_v4(),
  cluster_id uuid not null references cluster(id) on delete cascade,
  name text not null,
  phone text not null unique,
  role text not null default 'worker' check (role in ('worker', 'supervisor')),
  language_pref text not null default 'hi' check (language_pref in ('hi', 'en')),
  active boolean not null default true,
  consent_accepted_at timestamptz, -- set on first login after accepting the device-data consent screen
  geolocation_consent boolean not null default false, -- opt-in toggle on the same consent screen, shift-start/end only
  created_at timestamptz not null default now()
);
create index on worker (cluster_id);

-- ============================================================
-- Route: a worker's assignment for a given day, scoped to a society.
-- RouteStop holds the ordered per-vehicle sequence within a tower.
-- ============================================================
create table route (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid not null references worker(id) on delete cascade,
  society_id uuid not null references society(id) on delete cascade,
  route_date date not null,
  shift_start_lat double precision, -- captured once at shift start only, per brief decision #4
  shift_start_lng double precision,
  shift_start_at timestamptz,
  shift_end_lat double precision, -- captured once at shift end only
  shift_end_lng double precision,
  shift_end_at timestamptz,
  created_by uuid references worker(id), -- supervisor who built/assigned the route
  created_at timestamptz not null default now(),
  unique (worker_id, society_id, route_date)
);
create index on route (worker_id, route_date);

create table route_stop (
  id uuid primary key default uuid_generate_v4(),
  route_id uuid not null references route(id) on delete cascade,
  vehicle_id uuid not null references vehicle(id) on delete cascade,
  tower text not null,
  sequence_no integer not null, -- supervisor-set order within the tower
  created_at timestamptz not null default now(),
  unique (route_id, vehicle_id)
);
create index on route_stop (route_id, tower, sequence_no);

-- ============================================================
-- WashRecord: the outcome of one car's stop on a route.
-- status covers the done path and the one-tap exceptions from
-- section 4.4: not_in_slot | declined | blocked | already_clean.
-- ============================================================
create table wash_record (
  id uuid primary key default uuid_generate_v4(),
  route_stop_id uuid not null references route_stop(id) on delete cascade,
  vehicle_id uuid not null references vehicle(id) on delete cascade,
  worker_id uuid not null references worker(id) on delete cascade,
  status text not null check (status in ('done', 'not_in_slot', 'declined', 'blocked', 'already_clean')),
  photo_before_key text, -- storage object key, not a public URL
  photo_after_key text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  supervisor_signed_off boolean not null default false, -- workers never self sign-off
  supervisor_id uuid references worker(id),
  supervisor_signed_off_at timestamptz,
  requires_rewash boolean not null default false, -- set by supervisor spot-check, drives the re-wash queue
  created_at timestamptz not null default now()
);
create index on wash_record (worker_id, created_at);
create index on wash_record (route_stop_id);
create index on wash_record (supervisor_signed_off, requires_rewash);

-- ============================================================
-- DamageReport: pre-wash damage flag (two-tap, section 4.4).
-- Captures enough for a future claims policy without building
-- claims UI now, per decision #3.
-- ============================================================
create table damage_report (
  id uuid primary key default uuid_generate_v4(),
  wash_record_id uuid not null references wash_record(id) on delete cascade,
  vehicle_id uuid not null references vehicle(id) on delete cascade,
  worker_id uuid not null references worker(id) on delete cascade,
  photo_keys text[] not null default '{}', -- timestamped photos, EXIF stripped except timestamp
  pre_existing boolean not null, -- worker's two-tap flag: was the damage there before this wash
  reported_at timestamptz not null default now(),
  resolved boolean not null default false -- PROVISIONAL: for future policy/dispute workflow, no UI yet
);
create index on damage_report (vehicle_id);
create index on damage_report (worker_id);

-- ============================================================
-- Complaint: PROVISIONAL entity. No resident-facing submission
-- flow or worker-facing view exists in Phase 1 (no worker-to-resident
-- channel is allowed). Exists so supervisors/ops can log complaints
-- against a wash record from an external channel (phone/WhatsApp to office).
-- ============================================================
create table complaint (
  id uuid primary key default uuid_generate_v4(),
  society_id uuid not null references society(id) on delete cascade,
  vehicle_id uuid references vehicle(id) on delete set null,
  wash_record_id uuid references wash_record(id) on delete set null,
  resident_id uuid references resident(id) on delete set null,
  category text, -- PROVISIONAL, no enum specified in brief
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  logged_by uuid references worker(id), -- supervisor/ops staff who logged it, never the worker being complained about
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index on complaint (society_id, status);

-- ============================================================
-- Row Level Security — PROVISIONAL. Phase 1 uses a mocked OTP
-- provider (no Supabase Auth user rows), so there is no real JWT
-- to key policies off yet. RLS is enabled with a permissive
-- authenticated-role policy as a placeholder; tighten this when
-- the real OTP/session provider is wired in (see src/lib/auth.ts).
-- ============================================================
alter table cluster enable row level security;
alter table society enable row level security;
alter table resident enable row level security;
alter table vehicle enable row level security;
alter table worker enable row level security;
alter table route enable row level security;
alter table route_stop enable row level security;
alter table wash_record enable row level security;
alter table damage_report enable row level security;
alter table complaint enable row level security;

create policy "provisional_allow_all_cluster" on cluster for all using (true) with check (true);
create policy "provisional_allow_all_society" on society for all using (true) with check (true);
create policy "provisional_allow_all_resident" on resident for all using (true) with check (true);
create policy "provisional_allow_all_vehicle" on vehicle for all using (true) with check (true);
create policy "provisional_allow_all_worker" on worker for all using (true) with check (true);
create policy "provisional_allow_all_route" on route for all using (true) with check (true);
create policy "provisional_allow_all_route_stop" on route_stop for all using (true) with check (true);
create policy "provisional_allow_all_wash_record" on wash_record for all using (true) with check (true);
create policy "provisional_allow_all_damage_report" on damage_report for all using (true) with check (true);
create policy "provisional_allow_all_complaint" on complaint for all using (true) with check (true);
