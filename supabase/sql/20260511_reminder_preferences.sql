-- ============================================================
-- Migration: 20260511_reminder_preferences.sql
-- ============================================================
-- Adds the reminder_preferences table for storing per-user,
-- per-type reminder settings.
--
-- Design decisions:
--   - (user_id, reminder_type) uniqueness allows future types
--     to be added without schema changes.
--   - Delivery and log fields are NOT included — delivery
--     infrastructure is out of scope for this round.
--   - RLS: owner-only SELECT, INSERT, UPDATE.
--     No DELETE policy (soft management via is_enabled=false).
--   - updated_at managed by the existing set_updated_at()
--     trigger function (introduced in notion_import_foundation).
-- ============================================================


-- ============================================================
-- TABLE: public.reminder_preferences
-- ============================================================

create table if not exists public.reminder_preferences (
  id                      uuid        primary key default gen_random_uuid(),
  user_id                 uuid        not null references auth.users(id) on delete cascade,
  reminder_type           text        not null,
  is_enabled              boolean     not null default false,
  preferred_day_of_week   smallint    not null default 5,
  preferred_time_local    time        not null default '18:00',
  timezone                text        not null default 'Asia/Seoul',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint reminder_preferences_unique_user_type
    unique (user_id, reminder_type),

  constraint reminder_preferences_reminder_type_check
    check (reminder_type in ('weekly_experience_recall')),

  constraint reminder_preferences_preferred_day_of_week_check
    check (preferred_day_of_week between 0 and 6)
);

comment on table public.reminder_preferences is
  'Per-user, per-type reminder preference settings. '
  'One row per (user_id, reminder_type). '
  'Delivery infrastructure not yet connected — is_enabled stores intent only.';

comment on column public.reminder_preferences.reminder_type is
  'Identifier for the reminder type. Currently: weekly_experience_recall.';

comment on column public.reminder_preferences.is_enabled is
  'User intent to receive this reminder. Does not trigger delivery until infrastructure is wired.';

comment on column public.reminder_preferences.preferred_day_of_week is
  'JS Date.getDay() convention: 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat. Default 5 (Friday).';

comment on column public.reminder_preferences.preferred_time_local is
  'Local time of day for delivery, expressed in the user''s timezone. Default 18:00.';

comment on column public.reminder_preferences.timezone is
  'IANA timezone string (e.g. Asia/Seoul). Used by delivery infrastructure.';


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists reminder_preferences_user_id_idx
  on public.reminder_preferences (user_id);

create index if not exists reminder_preferences_user_type_idx
  on public.reminder_preferences (user_id, reminder_type);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.reminder_preferences enable row level security;

create policy reminder_preferences_select_own
  on public.reminder_preferences
  for select
  using (auth.uid() = user_id);

create policy reminder_preferences_insert_own
  on public.reminder_preferences
  for insert
  with check (auth.uid() = user_id);

create policy reminder_preferences_update_own
  on public.reminder_preferences
  for update
  using (auth.uid() = user_id);


-- ============================================================
-- TRIGGER: updated_at
-- Reuses the existing set_updated_at() function.
-- ============================================================

create trigger set_reminder_preferences_updated_at
  before update on public.reminder_preferences
  for each row
  execute function public.set_updated_at();
