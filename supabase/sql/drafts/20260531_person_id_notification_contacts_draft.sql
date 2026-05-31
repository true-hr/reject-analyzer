-- ============================================================
-- Protected DB migration draft: 20260531_person_id_notification_contacts_draft.sql
-- ============================================================
-- DO NOT APPLY without explicit user approval.
-- Do not run this file in Supabase SQL Editor, Supabase CLI, or any remote database.
--
-- This is a draft for person_id account linking and notification contact/consent models.
-- No remote DB apply, data backfill, auth provider changes, Kakao/SMS integration,
-- message sending, cron changes, or production changes are included in this task.
-- ============================================================

-- Source principles:
-- - PASSMAP person ownership is based on person_id.
-- - auth.users.id identifies a login account, not the canonical person.
-- - Google/Kakao/Naver accounts must only be linked by explicit user consent.
-- - Do not auto-merge people by email, name, or phone number.
-- - Do not reuse existing resume_* contact or consent fields for notifications.
-- - reminder_rules candidates remain blocked from production apply because they are user_id-based.
-- - reminder_rules_v2 should be designed separately after this draft.

-- ============================================================
-- 1. public.persons
-- ============================================================

create table if not exists public.persons (
  id uuid primary key default gen_random_uuid(),
  primary_user_id uuid null references auth.users(id) on delete set null,
  display_name text null,
  primary_email text null,
  primary_phone text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  constraint persons_display_name_not_blank check (
    display_name is null or btrim(display_name) <> ''
  )
);

comment on table public.persons is
  'Draft: PASSMAP person-level root. Do not apply without explicit approval.';
comment on column public.persons.primary_email is
  'Draft TODO: decide lower/btrim normalization and uniqueness policy before production apply.';
comment on column public.persons.primary_phone is
  'Draft TODO: decide phone normalization after provider and phone verification policies are approved.';

create index if not exists persons_primary_user_id_idx
  on public.persons (primary_user_id);

create index if not exists persons_deleted_at_idx
  on public.persons (deleted_at);

-- ============================================================
-- 2. public.linked_auth_users
-- ============================================================

create table if not exists public.linked_auth_users (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.persons(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_email text null,
  provider_phone text null,
  is_primary boolean not null default false,
  linked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unlinked_at timestamptz null,
  constraint linked_auth_users_provider_check check (
    provider in ('google', 'kakao', 'naver', 'email', 'unknown')
  )
);

comment on table public.linked_auth_users is
  'Draft: links one or more provider auth users to one PASSMAP person by explicit user consent only.';
comment on column public.linked_auth_users.provider_email is
  'Draft note: provider email must not be used as an automatic merge key.';
comment on column public.linked_auth_users.provider_phone is
  'Draft note: provider phone must not be used as an automatic merge key.';

create unique index if not exists linked_auth_users_active_auth_user_id_uidx
  on public.linked_auth_users (auth_user_id)
  where unlinked_at is null;

-- Draft candidate only: same person/provider duplicate policy needs UX and unlink semantics approval.
create index if not exists linked_auth_users_person_provider_active_idx
  on public.linked_auth_users (person_id, provider)
  where unlinked_at is null;

create unique index if not exists linked_auth_users_one_primary_per_person_uidx
  on public.linked_auth_users (person_id)
  where is_primary = true and unlinked_at is null;

create index if not exists linked_auth_users_person_id_idx
  on public.linked_auth_users (person_id);

-- Important draft guardrails:
-- - Do not auto-merge people by email, name, or phone number.
-- - Provider linking requires explicit user consent.
-- - Existing data ownership transfer requires a separate protected backfill task.

-- ============================================================
-- 3. public.notification_contacts
-- ============================================================

create table if not exists public.notification_contacts (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.persons(id) on delete cascade,
  channel text not null,
  destination text not null,
  destination_ref jsonb not null default '{}'::jsonb,
  is_verified boolean not null default false,
  verified_at timestamptz null,
  is_primary boolean not null default false,
  consent_status text not null default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  disabled_at timestamptz null,
  constraint notification_contacts_channel_check check (
    channel in ('web_push', 'kakao_alimtalk', 'sms', 'email')
  ),
  constraint notification_contacts_consent_status_check check (
    consent_status in ('unknown', 'granted', 'revoked', 'expired')
  ),
  constraint notification_contacts_destination_not_blank check (
    btrim(destination) <> ''
  ),
  constraint notification_contacts_verified_at_check check (
    (is_verified = true and verified_at is not null)
    or (is_verified = false)
  )
);

comment on table public.notification_contacts is
  'Draft: person-level notification destinations. Do not reuse resume/contact fields.';
comment on column public.notification_contacts.destination is
  'Draft note: web_push should likely store a reference to push_subscriptions or a separate mapping, not a raw endpoint.';
comment on column public.notification_contacts.destination_ref is
  'Draft: provider-specific metadata or reference keys. Avoid secrets and raw push endpoint duplication.';

create index if not exists notification_contacts_person_id_idx
  on public.notification_contacts (person_id);

create index if not exists notification_contacts_person_channel_idx
  on public.notification_contacts (person_id, channel);

create index if not exists notification_contacts_active_idx
  on public.notification_contacts (person_id, channel, consent_status)
  where disabled_at is null;

create unique index if not exists notification_contacts_one_primary_per_channel_uidx
  on public.notification_contacts (person_id, channel)
  where is_primary = true and disabled_at is null;

-- Important draft guardrails:
-- - Web Push destination may need to reference existing push_subscriptions or a separate mapping.
-- - Phone numbers are not eligible delivery targets before verification and consent are complete.
-- - Existing resume/contact fields must not be reused as notification contact or consent state.

-- ============================================================
-- 4. public.person_consents
-- ============================================================

create table if not exists public.person_consents (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.persons(id) on delete cascade,
  consent_type text not null,
  status text not null,
  agreed_at timestamptz null,
  revoked_at timestamptz null,
  source text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint person_consents_status_check check (
    status in ('granted', 'revoked', 'expired')
  ),
  constraint person_consents_type_check check (
    consent_type in (
      'service_notification',
      'experience_recall_reminder',
      'kakao_alimtalk',
      'sms_notification',
      'sms_fallback',
      'email_notification',
      'web_push_device',
      'marketing_notification',
      'consulting_connection',
      'privacy_processing_delegation_notice'
    )
  ),
  constraint person_consents_granted_at_check check (
    status <> 'granted' or agreed_at is not null
  ),
  constraint person_consents_revoked_at_check check (
    status <> 'revoked' or revoked_at is not null
  )
);

comment on table public.person_consents is
  'Draft: person-level consent state for service, channel, fallback, marketing, and provider notice consent.';
comment on column public.person_consents.consent_type is
  'Draft note: marketing consent must remain separate from service notification consent.';
comment on column public.person_consents.metadata is
  'Draft: consent copy version, provider, channel, and related evidence metadata.';

create index if not exists person_consents_person_id_idx
  on public.person_consents (person_id);

create index if not exists person_consents_person_type_idx
  on public.person_consents (person_id, consent_type);

-- Draft candidate for latest consent lookups.
create index if not exists person_consents_latest_lookup_idx
  on public.person_consents (person_id, consent_type, created_at desc);

-- Draft candidate for currently granted consent lookups.
create index if not exists person_consents_granted_lookup_idx
  on public.person_consents (person_id, consent_type)
  where status = 'granted';

-- Important draft guardrails:
-- - Marketing consent and service notification consent must be separated.
-- - If sms_fallback is revoked, SMS must not be sent after Kakao delivery failure.
-- - Provider processing delegation notice requirements must be confirmed before real provider use.

-- ============================================================
-- 5. updated_at trigger draft
-- ============================================================

-- Read-only repository check found public.set_updated_at() defined in:
--   supabase/sql/20260428_notion_import_foundation.sql
-- Existing SQL files already reuse public.set_updated_at(), so this draft follows that pattern.

create trigger set_persons_updated_at
  before update on public.persons
  for each row execute function public.set_updated_at();

create trigger set_linked_auth_users_updated_at
  before update on public.linked_auth_users
  for each row execute function public.set_updated_at();

create trigger set_notification_contacts_updated_at
  before update on public.notification_contacts
  for each row execute function public.set_updated_at();

create trigger set_person_consents_updated_at
  before update on public.person_consents
  for each row execute function public.set_updated_at();

-- ============================================================
-- 6. RLS draft
-- ============================================================

alter table public.persons enable row level security;
alter table public.linked_auth_users enable row level security;
alter table public.notification_contacts enable row level security;
alter table public.person_consents enable row level security;

-- Draft RLS principle:
-- A person owner is an authenticated user whose auth.uid() appears in
-- public.linked_auth_users for the target person with unlinked_at is null.
--
-- Conservative TODO:
-- - Finalize non-recursive policies for public.linked_auth_users before apply.
-- - Decide whether clients may insert account links directly or must use an RPC.
-- - Keep service-role scheduler/backfill policies in a separate Protected DB task.
-- - Confirm whether soft-deleted persons should be hidden at the policy layer or app query layer.
--
-- Example owner predicate candidate for persons/contacts/consents:
-- exists (
--   select 1
--   from public.linked_auth_users lau
--   where lau.person_id = <target_table>.person_id
--     and lau.auth_user_id = auth.uid()
--     and lau.unlinked_at is null
-- )
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
-- 4. backfill strategy from auth.users/user_id tables is approved.
-- 5. reminder_rules_v2 ownership model is approved.
-- ============================================================
