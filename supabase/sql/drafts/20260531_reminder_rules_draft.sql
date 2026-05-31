-- ============================================================
-- Draft: 20260531_reminder_rules_draft.sql
-- ============================================================
-- DO NOT APPLY without explicit Protected DB approval.
-- This draft is for PASSMAP 5/8-B design review only.
--
-- Goal:
--   Add rule-based reminder scheduling so one user can keep multiple
--   experience-recall reminders, including daily, weekdays, weekly, and
--   custom day schedules at different local times.
--
-- Compatibility:
--   - Does not drop or alter reminder_preferences.
--   - Does not drop or alter reminder_deliveries.
--   - Existing weekly scheduler can continue using the old tables until
--     the new scheduler is implemented and switched on.
-- ============================================================


-- ============================================================
-- TABLE: public.reminder_rules
-- ============================================================
-- One row is one user-owned reminder rule.
--
-- Cadence semantics:
--   daily       -> days_of_week must be null; eligible every local day.
--   weekdays    -> days_of_week must be null; eligible Mon-Fri.
--   weekly      -> days_of_week must contain exactly one local day.
--   custom_days -> days_of_week must contain one or more local days.
--
-- days_of_week follows JS Date.getDay():
--   0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat.
-- Duplicate days are rejected at DB level so custom_days stays canonical.
-- ============================================================

create table if not exists public.reminder_rules (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  reminder_kind   text        not null,
  cadence         text        not null,
  days_of_week    smallint[]  null,
  time_local      time        not null,
  timezone        text        not null default 'Asia/Seoul',
  is_enabled      boolean     not null default true,
  label           text        null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz null,

  constraint reminder_rules_reminder_kind_check
    check (reminder_kind in ('experience_recall')),

  constraint reminder_rules_cadence_check
    check (cadence in ('daily', 'weekdays', 'weekly', 'custom_days')),

  constraint reminder_rules_days_of_week_values_check
    check (
      days_of_week is null
      or (
        array_position(days_of_week, null::smallint) is null
        and days_of_week <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
      )
    ),

  constraint reminder_rules_days_of_week_unique_check
    check (
      days_of_week is null
      or (
        coalesce(array_length(array_positions(days_of_week, 0::smallint), 1), 0) <= 1
        and coalesce(array_length(array_positions(days_of_week, 1::smallint), 1), 0) <= 1
        and coalesce(array_length(array_positions(days_of_week, 2::smallint), 1), 0) <= 1
        and coalesce(array_length(array_positions(days_of_week, 3::smallint), 1), 0) <= 1
        and coalesce(array_length(array_positions(days_of_week, 4::smallint), 1), 0) <= 1
        and coalesce(array_length(array_positions(days_of_week, 5::smallint), 1), 0) <= 1
        and coalesce(array_length(array_positions(days_of_week, 6::smallint), 1), 0) <= 1
      )
    ),

  constraint reminder_rules_cadence_days_check
    check (
      (
        cadence in ('daily', 'weekdays')
        and days_of_week is null
      )
      or (
        cadence = 'weekly'
        and days_of_week is not null
        and cardinality(days_of_week) = 1
      )
      or (
        cadence = 'custom_days'
        and days_of_week is not null
        and cardinality(days_of_week) between 1 and 7
      )
    ),

  constraint reminder_rules_timezone_not_blank_check
    check (length(btrim(timezone)) > 0)
);

comment on table public.reminder_rules is
  'User-owned reminder rules for experience recall scheduling. Draft schema; do not apply without Protected DB approval.';

comment on column public.reminder_rules.reminder_kind is
  'Reminder domain. Initially only experience_recall.';

comment on column public.reminder_rules.cadence is
  'Schedule cadence: daily, weekdays, weekly, or custom_days.';

comment on column public.reminder_rules.days_of_week is
  'Null for daily/weekdays. For weekly/custom_days, JS Date.getDay() values: 0=Sun ... 6=Sat.';

comment on column public.reminder_rules.time_local is
  'Local time of day for this rule, interpreted in timezone.';

comment on column public.reminder_rules.deleted_at is
  'Soft-delete marker. Scheduler and UI should ignore rows where deleted_at is not null.';


-- ============================================================
-- INDEXES: public.reminder_rules
-- ============================================================

create index if not exists reminder_rules_user_id_idx
  on public.reminder_rules (user_id);

create index if not exists reminder_rules_user_active_idx
  on public.reminder_rules (user_id, is_enabled, created_at)
  where deleted_at is null;

create index if not exists reminder_rules_scheduler_active_idx
  on public.reminder_rules (reminder_kind, cadence, timezone, time_local)
  where deleted_at is null
    and is_enabled = true;

create index if not exists reminder_rules_deleted_at_idx
  on public.reminder_rules (deleted_at);


-- ============================================================
-- ROW LEVEL SECURITY: public.reminder_rules
-- ============================================================

alter table public.reminder_rules enable row level security;

drop policy if exists "reminder_rules: owner select" on public.reminder_rules;
create policy "reminder_rules: owner select"
  on public.reminder_rules
  for select
  using (auth.uid() = user_id);

drop policy if exists "reminder_rules: owner insert" on public.reminder_rules;
create policy "reminder_rules: owner insert"
  on public.reminder_rules
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "reminder_rules: owner update" on public.reminder_rules;
create policy "reminder_rules: owner update"
  on public.reminder_rules
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No owner hard-delete policy in v1.
-- User-facing deletion should soft-delete through owner update
-- by setting deleted_at. Physical cleanup can be handled later by
-- a Protected maintenance task or service-role operation.

drop trigger if exists set_reminder_rules_updated_at on public.reminder_rules;
create trigger set_reminder_rules_updated_at
  before update on public.reminder_rules
  for each row
  execute function public.set_updated_at();


-- ============================================================
-- TABLE: public.reminder_rule_deliveries
-- ============================================================
-- Rule-level delivery claim and ledger.
-- One row claims one rule/channel/local-date/local-time slot.
-- This supports multiple reminders per day because time_local is part of
-- the unique key.
-- ============================================================

create table if not exists public.reminder_rule_deliveries (
  id                         uuid        primary key default gen_random_uuid(),
  rule_id                    uuid        not null references public.reminder_rules(id) on delete cascade,
  user_id                    uuid        not null references auth.users(id) on delete cascade,
  reminder_kind              text        not null,
  delivery_channel           text        not null,
  scheduled_for_local_date   date        not null,
  scheduled_for_local_time   time        not null,
  timezone                   text        not null,
  status                     text        not null,
  attempted_count            integer     not null default 0,
  sent_count                 integer     not null default 0,
  failed_count               integer     not null default 0,
  sent_at                    timestamptz null,
  result_json                jsonb       not null default '{}'::jsonb,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),

  constraint reminder_rule_deliveries_reminder_kind_check
    check (reminder_kind in ('experience_recall')),

  constraint reminder_rule_deliveries_delivery_channel_check
    check (delivery_channel in ('web_push')),

  constraint reminder_rule_deliveries_status_check
    check (status in ('processing', 'sent', 'partial_failed', 'failed')),

  constraint reminder_rule_deliveries_counts_check
    check (
      attempted_count >= 0
      and sent_count >= 0
      and failed_count >= 0
      and attempted_count = sent_count + failed_count
    ),

  constraint reminder_rule_deliveries_timezone_not_blank_check
    check (length(btrim(timezone)) > 0),

  constraint reminder_rule_deliveries_unique_slot
    unique (
      rule_id,
      delivery_channel,
      scheduled_for_local_date,
      scheduled_for_local_time
    )
);

comment on table public.reminder_rule_deliveries is
  'Rule-based reminder delivery ledger. Unique by rule/channel/local-date/local-time to prevent duplicate sends.';

comment on column public.reminder_rule_deliveries.result_json is
  'Scheduler result summary. May include per-subscription results for first implementation.';


-- ============================================================
-- INDEXES: public.reminder_rule_deliveries
-- ============================================================

create index if not exists reminder_rule_deliveries_user_date_idx
  on public.reminder_rule_deliveries (user_id, scheduled_for_local_date);

create index if not exists reminder_rule_deliveries_rule_date_time_idx
  on public.reminder_rule_deliveries (
    rule_id,
    scheduled_for_local_date,
    scheduled_for_local_time
  );

create index if not exists reminder_rule_deliveries_status_idx
  on public.reminder_rule_deliveries (status, created_at);


-- ============================================================
-- ROW LEVEL SECURITY: public.reminder_rule_deliveries
-- ============================================================
-- Users can read their own delivery ledger.
-- Scheduler writes should use the Supabase service role, which bypasses RLS.
-- No user insert/update/delete policy is created for delivery rows.
-- ============================================================

alter table public.reminder_rule_deliveries enable row level security;

drop policy if exists "reminder_rule_deliveries: owner select" on public.reminder_rule_deliveries;
create policy "reminder_rule_deliveries: owner select"
  on public.reminder_rule_deliveries
  for select
  using (auth.uid() = user_id);

drop trigger if exists set_reminder_rule_deliveries_updated_at on public.reminder_rule_deliveries;
create trigger set_reminder_rule_deliveries_updated_at
  before update on public.reminder_rule_deliveries
  for each row
  execute function public.set_updated_at();


-- ============================================================
-- PHASE 2 OPTION: public.reminder_rule_delivery_attempts
-- ============================================================
-- Excluded from v1 active DDL.
--
-- Rationale:
--   - v1 scheduler can record per-subscription results inside
--     reminder_rule_deliveries.result_json.
--   - Adding an unused attempts table increases migration/RLS surface before
--     the Edge Function needs queryable per-subscription history.
--   - If/when added, prefer a non-null subscription identity captured at send
--     time. A nullable subscription_id with unique(delivery_id, subscription_id)
--     is not enough because PostgreSQL unique constraints allow multiple nulls.
-- ============================================================


-- ============================================================
-- BACKFILL: reminder_preferences -> reminder_rules
-- ============================================================
-- Converts existing weekly_experience_recall preferences into weekly rules.
-- This is idempotent by NOT EXISTS because reminder_rules intentionally
-- allows duplicate-looking rules after the UI supports them. For migration
-- backfill, one legacy-derived rule per user is enough.
-- ============================================================

insert into public.reminder_rules (
  user_id,
  reminder_kind,
  cadence,
  days_of_week,
  time_local,
  timezone,
  is_enabled,
  label,
  created_at,
  updated_at
)
select
  rp.user_id,
  'experience_recall',
  'weekly',
  array[rp.preferred_day_of_week]::smallint[],
  rp.preferred_time_local,
  rp.timezone,
  rp.is_enabled,
  '주간 경험 회수',
  now(),
  now()
from public.reminder_preferences rp
where rp.reminder_type = 'weekly_experience_recall'
  and not exists (
    select 1
    from public.reminder_rules rr
    where rr.user_id = rp.user_id
      and rr.reminder_kind = 'experience_recall'
      and rr.cadence = 'weekly'
      and rr.days_of_week = array[rp.preferred_day_of_week]::smallint[]
      and rr.time_local = rp.preferred_time_local
      and rr.timezone = rp.timezone
      and rr.deleted_at is null
  );


-- ============================================================
-- PRE-APPLY CHECKLIST
-- ============================================================
-- 1. Confirm public.set_updated_at() exists in the target DB.
-- 2. Confirm reminder_preferences, push_subscriptions, and auth.users exist.
-- 3. Confirm Edge Function scheduler will use service role for delivery writes.
-- 4. Confirm UI read order during transition:
--      reminder_rules first; fallback to reminder_preferences if no rules exist.
-- 5. Confirm existing send-weekly-experience-recall-push remains enabled until
--    the new scheduler is deployed and cron is explicitly switched.
-- 6. Confirm rollback plan before applying:
--      drop reminder_rule_deliveries;
--      drop reminder_rules;
--    Existing reminder_preferences/reminder_deliveries remain untouched.
-- ============================================================
