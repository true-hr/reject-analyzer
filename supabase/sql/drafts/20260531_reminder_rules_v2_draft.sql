-- ============================================================
-- Protected DB migration draft: 20260531_reminder_rules_v2_draft.sql
-- ============================================================
-- DO NOT APPLY without explicit user approval.
-- Do not run this file in Supabase SQL Editor, Supabase CLI, or any remote database.
--
-- This is a draft for person_id-based multi-channel reminder rules.
-- No remote DB apply, data backfill, Edge Function deploy, Kakao/SMS integration,
-- message sending, cron changes, or production changes are included in this task.
-- ============================================================

-- Source principles:
-- - reminder_rules_v2 is person_id-based.
-- - Reminder rules decide when and what to remind.
-- - Reminder rule channels decide channel priority and fallback preference.
-- - notification_contacts decide where messages can be sent.
-- - person_consents decide whether a message may be sent.
-- - Delivery ledger rows claim rule/channel/local slots to prevent duplicate sends.
-- - Kakao/SMS are schema candidates only; no integration or sending is included here.
-- - Existing user_id-based reminder_rules candidates remain blocked from production apply.
-- - Existing weekly cron and any future scheduler cron must not both be live without an approved cutover plan.

-- ============================================================
-- 1. public.reminder_rules_v2
-- ============================================================
-- Person-owned reminder rules.
--
-- This table is only responsible for "when" and "what":
-- - when: cadence, days_of_week, local time, timezone
-- - what: reminder_kind
--
-- Channel preference, destination lookup, and consent checks are intentionally
-- modeled outside this table.
--
-- Cadence semantics:
--   daily       -> days_of_week must be null; eligible every local day.
--   weekdays    -> days_of_week must be null; eligible Mon-Fri.
--   weekly      -> days_of_week must contain exactly one local day.
--   custom_days -> days_of_week must contain one to seven local days.
--
-- days_of_week follows JS Date.getDay():
--   0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat.
--
-- v1 default:
--   skip_policy = 'none'
--
-- Rationale:
--   If users configure multiple reminders, system-side automatic skipping can
--   become hard to predict. Record guards should be explicit future options.
-- ============================================================

create table if not exists public.reminder_rules_v2 (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.persons(id) on delete cascade,
  reminder_kind text not null,
  cadence text not null,
  days_of_week smallint[] null,
  time_local time not null,
  timezone text not null default 'Asia/Seoul',
  label text null,
  skip_policy text not null default 'none',
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,

  constraint reminder_rules_v2_reminder_kind_check check (
    reminder_kind in ('experience_recall')
  ),

  constraint reminder_rules_v2_cadence_check check (
    cadence in ('daily', 'weekdays', 'weekly', 'custom_days')
  ),

  constraint reminder_rules_v2_days_of_week_values_check check (
    days_of_week is null
    or (
      array_position(days_of_week, null::smallint) is null
      and days_of_week <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
    )
  ),

  constraint reminder_rules_v2_days_of_week_unique_check check (
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

  constraint reminder_rules_v2_cadence_days_check check (
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

  constraint reminder_rules_v2_skip_policy_check check (
    skip_policy in (
      'none',
      'skip_if_record_exists_today',
      'skip_if_weekly_record_exists'
    )
  ),

  constraint reminder_rules_v2_timezone_not_blank_check check (
    btrim(timezone) <> ''
  ),

  constraint reminder_rules_v2_label_not_blank_check check (
    label is null or btrim(label) <> ''
  )
);

comment on table public.reminder_rules_v2 is
  'Draft: person_id-based reminder rules. Defines when/what only; channel, contact, and consent are separate.';
comment on column public.reminder_rules_v2.person_id is
  'Draft: PASSMAP person owner. References public.persons from the person_id notification contacts draft.';
comment on column public.reminder_rules_v2.skip_policy is
  'Draft: default none. Record guard behavior requires separate UI and scheduler approval.';

create index if not exists reminder_rules_v2_person_id_idx
  on public.reminder_rules_v2 (person_id);

create index if not exists reminder_rules_v2_scheduler_active_idx
  on public.reminder_rules_v2 (reminder_kind, cadence, timezone, time_local)
  where deleted_at is null
    and is_enabled = true;

create index if not exists reminder_rules_v2_person_active_idx
  on public.reminder_rules_v2 (person_id, is_enabled, created_at)
  where deleted_at is null;

create index if not exists reminder_rules_v2_deleted_at_idx
  on public.reminder_rules_v2 (deleted_at);

-- ============================================================
-- 2. public.reminder_rule_channels_v2
-- ============================================================
-- Rule-specific channel preference and fallback configuration.
--
-- This table is only responsible for channel ordering and fallback intent.
-- It does not store delivery destinations and does not prove consent.
-- Actual destination lookup should use notification_contacts.
-- Actual consent checks should use person_consents.
-- Actual fallback execution belongs in an approved Edge Function v2.
--
-- Important:
-- - Kakao failure followed by SMS fallback must consider both kakao_alimtalk
--   consent and sms_fallback consent before any SMS send.
-- - This draft defines preference shape only; it does not integrate providers.
-- ============================================================

create table if not exists public.reminder_rule_channels_v2 (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.reminder_rules_v2(id) on delete cascade,
  channel text not null,
  priority integer not null default 100,
  is_enabled boolean not null default true,
  fallback_on_failure boolean not null default false,
  requires_consent_type text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  disabled_at timestamptz null,

  constraint reminder_rule_channels_v2_channel_check check (
    channel in ('web_push', 'kakao_alimtalk', 'sms', 'email')
  ),

  constraint reminder_rule_channels_v2_priority_check check (
    priority >= 0
  ),

  constraint reminder_rule_channels_v2_consent_type_check check (
    requires_consent_type is null
    or requires_consent_type in (
      'web_push_device',
      'kakao_alimtalk',
      'sms_notification',
      'sms_fallback',
      'email_notification',
      'experience_recall_reminder',
      'service_notification',
      'marketing_notification',
      'consulting_connection',
      'privacy_processing_delegation_notice'
    )
  )
);

comment on table public.reminder_rule_channels_v2 is
  'Draft: channel priority and fallback settings for reminder_rules_v2.';
comment on column public.reminder_rule_channels_v2.requires_consent_type is
  'Draft: consent_type candidate aligned with person_consents from PR #685/#687.';
comment on column public.reminder_rule_channels_v2.fallback_on_failure is
  'Draft: fallback intent only. Edge Function v2 must define failure classes and fallback execution.';

create index if not exists reminder_rule_channels_v2_rule_id_idx
  on public.reminder_rule_channels_v2 (rule_id);

create index if not exists reminder_rule_channels_v2_rule_priority_idx
  on public.reminder_rule_channels_v2 (rule_id, priority)
  where disabled_at is null
    and is_enabled = true;

create unique index if not exists reminder_rule_channels_v2_active_rule_channel_uidx
  on public.reminder_rule_channels_v2 (rule_id, channel)
  where disabled_at is null;

-- Draft TODO: decide whether duplicate priority values within a rule should be allowed.
-- If strict ordering is required, add a partial unique index on (rule_id, priority)
-- where disabled_at is null and is_enabled = true.

-- ============================================================
-- 3. public.reminder_deliveries_v2
-- ============================================================
-- Delivery claim and result ledger.
--
-- One row represents one rule/channel/local slot. The unique key prevents
-- duplicate sends for the same rule, channel, local date, local time, and timezone.
--
-- rule_id is already person-scoped through reminder_rules_v2. person_id is kept
-- denormalized for RLS, query ergonomics, and audit readability.
--
-- TODO: decide whether person_id should be included in the unique key anyway for
-- defensive integrity. Current draft treats rule_id as sufficient ownership scope.
-- ============================================================

create table if not exists public.reminder_deliveries_v2 (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.reminder_rules_v2(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  rule_channel_id uuid null references public.reminder_rule_channels_v2(id) on delete set null,
  reminder_kind text not null,
  delivery_channel text not null,
  scheduled_for_local_date date not null,
  scheduled_for_local_time time not null,
  timezone text not null,
  status text not null,
  attempted_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  skipped_count integer not null default 0,
  sent_at timestamptz null,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint reminder_deliveries_v2_reminder_kind_check check (
    reminder_kind in ('experience_recall')
  ),

  constraint reminder_deliveries_v2_delivery_channel_check check (
    delivery_channel in ('web_push', 'kakao_alimtalk', 'sms', 'email')
  ),

  constraint reminder_deliveries_v2_status_check check (
    status in ('processing', 'sent', 'partial_failed', 'failed', 'skipped')
  ),

  constraint reminder_deliveries_v2_counts_check check (
    attempted_count >= 0
    and sent_count >= 0
    and failed_count >= 0
    and skipped_count >= 0
    and attempted_count >= sent_count + failed_count
  ),

  constraint reminder_deliveries_v2_timezone_not_blank_check check (
    btrim(timezone) <> ''
  )
);

comment on table public.reminder_deliveries_v2 is
  'Draft: rule/channel/local slot delivery claim and result ledger for multi-channel reminders.';
comment on column public.reminder_deliveries_v2.result_json is
  'Draft TODO: Edge Function v2 must define result structure. Provider raw response storage needs privacy/log approval.';
comment on column public.reminder_deliveries_v2.rule_channel_id is
  'Draft: nullable so ledger survives if a rule channel is later deleted.';

create unique index if not exists reminder_deliveries_v2_slot_uidx
  on public.reminder_deliveries_v2 (
    rule_id,
    delivery_channel,
    scheduled_for_local_date,
    scheduled_for_local_time,
    timezone
  );

create index if not exists reminder_deliveries_v2_person_id_idx
  on public.reminder_deliveries_v2 (person_id);

create index if not exists reminder_deliveries_v2_rule_id_idx
  on public.reminder_deliveries_v2 (rule_id);

create index if not exists reminder_deliveries_v2_status_idx
  on public.reminder_deliveries_v2 (status, created_at);

create index if not exists reminder_deliveries_v2_scheduled_lookup_idx
  on public.reminder_deliveries_v2 (
    reminder_kind,
    delivery_channel,
    scheduled_for_local_date,
    scheduled_for_local_time,
    timezone
  );

-- Important draft guardrails:
-- - result_json shape belongs to the future Edge Function v2 design.
-- - Whether to store raw Kakao/SMS provider responses requires privacy and log-retention approval.
-- - Failure classification and retry policy require separate design.

-- ============================================================
-- 4. Existing user_id reminder structure relationship
-- ============================================================
-- Existing structures are not deleted, altered, disabled, or migrated here:
-- - public.reminder_preferences
-- - public.reminder_deliveries
-- - public.push_subscriptions
-- - supabase/functions/send-weekly-experience-recall-push
-- - supabase/sql/20260531_reminder_rules.sql user_id-based candidate
--
-- Current production Web Push should continue until a separate cutover is approved.
-- Existing weekly cron is not turned off in this draft.
-- A new scheduler cron must not be enabled live at the same time as the existing
-- weekly cron without an approved migration/off-switch plan.
--
-- Any user_id -> person_id backfill is a separate Protected DB task.
-- Any reminder_rules_v2 production apply is a separate Protected DB task.

-- ============================================================
-- 5. updated_at trigger draft
-- ============================================================
-- Read-only repository check found public.set_updated_at() defined in:
--   supabase/sql/20260428_notion_import_foundation.sql
-- Existing SQL files and PR #687 draft already reuse public.set_updated_at().
--
-- Draft TODO before production apply:
--   Confirm trigger re-run stability and decide whether migration should use
--   drop trigger if exists before create trigger.

create trigger set_reminder_rules_v2_updated_at
  before update on public.reminder_rules_v2
  for each row execute function public.set_updated_at();

create trigger set_reminder_rule_channels_v2_updated_at
  before update on public.reminder_rule_channels_v2
  for each row execute function public.set_updated_at();

create trigger set_reminder_deliveries_v2_updated_at
  before update on public.reminder_deliveries_v2
  for each row execute function public.set_updated_at();

-- ============================================================
-- 6. RLS draft
-- ============================================================

alter table public.reminder_rules_v2 enable row level security;
alter table public.reminder_rule_channels_v2 enable row level security;
alter table public.reminder_deliveries_v2 enable row level security;

-- Draft RLS principle:
-- A person owner is an authenticated user whose auth.uid() appears in
-- public.linked_auth_users for the target person with unlinked_at is null.
--
-- Candidate owner predicate for reminder_rules_v2/reminder_deliveries_v2:
-- exists (
--   select 1
--   from public.linked_auth_users lau
--   where lau.person_id = <target_table>.person_id
--     and lau.auth_user_id = auth.uid()
--     and lau.unlinked_at is null
-- )
--
-- Candidate owner predicate for reminder_rule_channels_v2:
-- exists (
--   select 1
--   from public.reminder_rules_v2 rr
--   join public.linked_auth_users lau
--     on lau.person_id = rr.person_id
--   where rr.id = reminder_rule_channels_v2.rule_id
--     and lau.auth_user_id = auth.uid()
--     and lau.unlinked_at is null
-- )
--
-- Conservative TODO:
-- - Finalize non-recursive RLS policies after linked_auth_users policies are approved.
-- - Decide whether clients can write channel preferences directly or must use RPCs.
-- - Scheduler/service-role access is a separate Protected task.
-- - Backfill/service maintenance policies are a separate Protected task.
--
-- Do not apply incomplete RLS policies from this draft without explicit approval.

-- ============================================================
-- Draft status
-- ============================================================
-- This file is intentionally a draft.
-- Do not apply this migration until:
-- 1. person_id account-linking UX is approved.
-- 2. notification contact verification policy is approved.
-- 3. consent copy and withdrawal UX are approved.
-- 4. reminder rule/channel UI is approved.
-- 5. multi-channel scheduler v2 behavior is approved.
-- 6. existing weekly cron migration/off switch plan is approved.
-- 7. backfill strategy from user_id reminder tables is approved.
-- ============================================================
