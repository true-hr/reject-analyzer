-- ============================================================
-- Migration: 20260519_user_career_settings.sql
-- ============================================================
-- Adds the user_career_settings table for storing per-user
-- career baseline preferences (audience type, current/target
-- job and industry).
--
-- Design decisions:
--   - One row per user (unique user_id constraint).
--   - Settings stored as JSONB for schema-free extensibility;
--     the application normalizes known fields before writing.
--   - RLS: owner-only SELECT, INSERT, UPDATE, DELETE.
--   - updated_at managed by the existing set_updated_at()
--     trigger function (introduced in notion_import_foundation).
-- ============================================================


-- ============================================================
-- TABLE: public.user_career_settings
-- ============================================================

create table if not exists public.user_career_settings (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  settings    jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint user_career_settings_unique_user
    unique (user_id)
);

comment on table public.user_career_settings is
  'Per-user career baseline settings. One row per user. '
  'Known fields in settings: audienceType, currentJobMajor, currentJobSub, '
  'currentIndustryMajor, currentIndustrySub, targetJobMajor, targetJobSub, '
  'targetIndustryMajor, targetIndustrySub.';

comment on column public.user_career_settings.settings is
  'JSONB blob of career baseline fields. Application normalizes known fields '
  'before writing; unknown fields are dropped.';


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists user_career_settings_user_id_idx
  on public.user_career_settings (user_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.user_career_settings enable row level security;

create policy user_career_settings_select_own
  on public.user_career_settings
  for select
  using (auth.uid() = user_id);

create policy user_career_settings_insert_own
  on public.user_career_settings
  for insert
  with check (auth.uid() = user_id);

create policy user_career_settings_update_own
  on public.user_career_settings
  for update
  using (auth.uid() = user_id);

create policy user_career_settings_delete_own
  on public.user_career_settings
  for delete
  using (auth.uid() = user_id);


-- ============================================================
-- TRIGGER: updated_at
-- Reuses the existing set_updated_at() function
-- (introduced in 20260428_notion_import_foundation.sql).
-- ============================================================

create trigger set_user_career_settings_updated_at
  before update on public.user_career_settings
  for each row
  execute function public.set_updated_at();
