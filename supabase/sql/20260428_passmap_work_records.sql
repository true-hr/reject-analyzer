-- ============================================================
-- PASSMAP Work Records Schema
-- Migration: 20260428_passmap_work_records.sql
-- ============================================================
-- NOTE: workspace/team sharing is out of scope for this round.
-- TODO: Add team_id / shared_with_team columns when multi-user
--       collaboration is introduced.
-- ============================================================

-- ============================================================
-- TABLE: profiles
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: owner select" on public.profiles;
create policy "profiles: owner select"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: owner insert" on public.profiles;
create policy "profiles: owner insert"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles: owner update" on public.profiles;
create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- TABLE: work_records
-- ============================================================
create table if not exists public.work_records (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  record_date      date        not null,
  title            text        not null,
  description      text,
  situation        text,
  task             text,
  action           text,
  result           text,
  job_category     text,
  industry_category text,
  project_name     text,
  strength_tags    text[]      not null default '{}',
  skill_tags       text[]      not null default '{}',
  work_type        text,
  visibility       text        not null default 'private',
  source           text        not null default 'manual',
  raw_payload      jsonb       not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists work_records_user_id_idx
  on public.work_records (user_id);

create index if not exists work_records_record_date_idx
  on public.work_records (record_date desc);

alter table public.work_records enable row level security;

drop policy if exists "work_records: owner select" on public.work_records;
create policy "work_records: owner select"
  on public.work_records for select
  using (auth.uid() = user_id);

drop policy if exists "work_records: owner insert" on public.work_records;
create policy "work_records: owner insert"
  on public.work_records for insert
  with check (auth.uid() = user_id);

drop policy if exists "work_records: owner update" on public.work_records;
create policy "work_records: owner update"
  on public.work_records for update
  using (auth.uid() = user_id);

drop policy if exists "work_records: owner delete" on public.work_records;
create policy "work_records: owner delete"
  on public.work_records for delete
  using (auth.uid() = user_id);

-- ============================================================
-- TABLE: resume_sentences
-- ============================================================
create table if not exists public.resume_sentences (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  work_record_id  uuid        references public.work_records(id) on delete set null,
  sentence        text        not null,
  sentence_type   text        not null default 'resume_bullet',
  target_job      text,
  tone            text,
  quality_score   numeric,
  is_selected     boolean     not null default false,
  version         integer     not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists resume_sentences_user_id_idx
  on public.resume_sentences (user_id);

alter table public.resume_sentences enable row level security;

drop policy if exists "resume_sentences: owner select" on public.resume_sentences;
create policy "resume_sentences: owner select"
  on public.resume_sentences for select
  using (auth.uid() = user_id);

drop policy if exists "resume_sentences: owner insert" on public.resume_sentences;
create policy "resume_sentences: owner insert"
  on public.resume_sentences for insert
  with check (auth.uid() = user_id);

drop policy if exists "resume_sentences: owner update" on public.resume_sentences;
create policy "resume_sentences: owner update"
  on public.resume_sentences for update
  using (auth.uid() = user_id);

drop policy if exists "resume_sentences: owner delete" on public.resume_sentences;
create policy "resume_sentences: owner delete"
  on public.resume_sentences for delete
  using (auth.uid() = user_id);

-- ============================================================
-- TABLE: resume_profiles
-- ============================================================
create table if not exists public.resume_profiles (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  profile_name        text        not null default '',
  target_job          text,
  target_industry     text,
  career_level        text,
  summary             text,
  current_company     text,
  current_position    text,
  years_of_experience numeric,
  raw_payload         jsonb       not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists resume_profiles_user_id_idx
  on public.resume_profiles (user_id);

alter table public.resume_profiles enable row level security;

drop policy if exists "resume_profiles: owner select" on public.resume_profiles;
create policy "resume_profiles: owner select"
  on public.resume_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "resume_profiles: owner insert" on public.resume_profiles;
create policy "resume_profiles: owner insert"
  on public.resume_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "resume_profiles: owner update" on public.resume_profiles;
create policy "resume_profiles: owner update"
  on public.resume_profiles for update
  using (auth.uid() = user_id);

drop policy if exists "resume_profiles: owner delete" on public.resume_profiles;
create policy "resume_profiles: owner delete"
  on public.resume_profiles for delete
  using (auth.uid() = user_id);
