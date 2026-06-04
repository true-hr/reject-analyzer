-- Scheduler v2 notification schema draft.
-- This migration defines candidate tables for future DB-backed dry-run/live-read.
-- Do not apply to production before separate review of RLS, backfill, and rollout plan.
-- No provider calls, cron changes, Edge Function deploys, or production changes are included.

-- Enum types.
do $$
begin
  create type scheduler_person_status as enum ('active', 'disabled', 'merged');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type scheduler_identity_provider as enum ('google', 'kakao', 'naver', 'email');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type scheduler_identity_status as enum ('active', 'unlinked', 'conflict');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type scheduler_contact_type as enum ('phone', 'email', 'kakao_alimtalk');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type scheduler_contact_status as enum ('active', 'disabled', 'revoked');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type scheduler_verification_method as enum ('sms_otp', 'email_link', 'kakao_check');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type scheduler_verification_status as enum ('verified', 'failed', 'expired', 'revoked');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type scheduler_notification_channel as enum ('kakao_alimtalk', 'sms', 'email', 'web_push');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type scheduler_consent_status as enum ('granted', 'revoked');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type scheduler_reminder_kind as enum ('experience_recall');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type scheduler_reminder_cadence as enum ('daily', 'weekdays', 'weekly', 'custom_days');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type scheduler_skip_policy as enum ('always_send', 'skip_if_today_record_exists', 'skip_if_weekly_record_exists');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type scheduler_web_push_ownership_status as enum ('active', 'stale', 'conflict', 'revoked');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type scheduler_delivery_claim_status as enum ('claimed', 'sent', 'skipped', 'failed');
exception
  when duplicate_object then null;
end $$;

-- Tables.
create table if not exists persons (
  id uuid primary key default gen_random_uuid(),
  status scheduler_person_status not null default 'active',
  merged_into_person_id uuid null references persons(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table persons is 'Scheduler v2 person root entity. Do not assume a 1:1 mapping with auth users or auto-merge by matching email, phone, or name.';

create table if not exists account_identities (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references persons(id) on delete cascade,
  provider scheduler_identity_provider not null,
  provider_user_id text not null,
  email text null,
  status scheduler_identity_status not null default 'active',
  linked_at timestamptz not null default now(),
  unlinked_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table account_identities is 'Login identity links only. A linked auth provider is not notification consent and must not auto-merge persons by email.';

create table if not exists contact_points (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references persons(id) on delete cascade,
  type scheduler_contact_type not null,
  value_normalized text not null,
  status scheduler_contact_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table contact_points is 'Notification contact candidates for phone, email, and Kakao alimtalk. Web Push endpoints do not belong here.';

create table if not exists contact_verifications (
  id uuid primary key default gen_random_uuid(),
  contact_point_id uuid not null references contact_points(id) on delete cascade,
  method scheduler_verification_method not null,
  status scheduler_verification_status not null,
  verified_at timestamptz null,
  expires_at timestamptz null,
  created_at timestamptz not null default now()
);

comment on table contact_verifications is 'Contact verification history. Verified contact state is separate from notification consent.';

create table if not exists notification_consents (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references persons(id) on delete cascade,
  contact_point_id uuid null references contact_points(id) on delete set null,
  consent_type text not null,
  channel scheduler_notification_channel not null,
  status scheduler_consent_status not null,
  copy_version text not null,
  source text null,
  granted_at timestamptz null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now()
);

comment on table notification_consents is 'Notification consent by person, optional contact, channel, and consent type. Keep service, marketing, consulting, and Kakao alimtalk consent separate.';

create table if not exists reminder_rules (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references persons(id) on delete cascade,
  reminder_kind scheduler_reminder_kind not null default 'experience_recall',
  cadence scheduler_reminder_cadence not null,
  days_of_week smallint[] not null default '{}',
  time_local time not null,
  timezone text not null default 'Asia/Seoul',
  is_enabled boolean not null default true,
  deleted_at timestamptz null,
  skip_policy scheduler_skip_policy not null default 'always_send',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table reminder_rules is 'Person-scoped scheduler v2 reminder rules. Timezone validation remains in the application/function layer.';

create table if not exists reminder_channels (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references reminder_rules(id) on delete cascade,
  channel scheduler_notification_channel not null,
  priority integer not null default 1,
  contact_point_id uuid null references contact_points(id) on delete set null,
  is_enabled boolean not null default true,
  fallback_to_channel scheduler_notification_channel null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table reminder_channels is 'Channel priority and fallback settings for reminder rules. Web Push can be resolved through subscription ownership instead of contact_point_id.';

create table if not exists web_push_subscription_owners (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references persons(id) on delete cascade,
  auth_user_id uuid null,
  subscription_id uuid null,
  endpoint_hash text not null,
  ownership_status scheduler_web_push_ownership_status not null default 'active',
  registered_at timestamptz not null default now(),
  last_confirmed_at timestamptz null,
  revoked_at timestamptz null,
  conflict_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table web_push_subscription_owners is 'Bridge from current browser/device Web Push subscription hash to person ownership. Only active ownership is eligible for live send.';

create table if not exists notification_delivery_claims (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references reminder_rules(id) on delete cascade,
  person_id uuid not null references persons(id) on delete cascade,
  channel scheduler_notification_channel not null,
  local_slot_key text not null,
  claim_key text not null,
  status scheduler_delivery_claim_status not null default 'claimed',
  claimed_at timestamptz not null default now(),
  completed_at timestamptz null,
  created_at timestamptz not null default now()
);

comment on table notification_delivery_claims is 'Delivery claim/idempotency records. Live provider calls must happen only after claim insert succeeds.';

create table if not exists notification_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid null references notification_delivery_claims(id) on delete set null,
  person_id uuid not null references persons(id) on delete cascade,
  rule_id uuid null references reminder_rules(id) on delete set null,
  channel scheduler_notification_channel not null,
  decision_status text not null,
  provider text null,
  provider_message_id text null,
  failure_code text null,
  failure_reason text null,
  fallback_from_channel scheduler_notification_channel null,
  fallback_to_channel scheduler_notification_channel null,
  raw_stored boolean not null default false,
  sent_at timestamptz null,
  created_at timestamptz not null default now()
);

comment on table notification_delivery_logs is 'Audit records for send, skip, and fallback outcomes. Store minimum necessary personal and provider information.';

-- Indexes.
create index if not exists account_identities_person_id_idx
  on account_identities (person_id);

create unique index if not exists account_identities_active_provider_user_id_key
  on account_identities (provider, provider_user_id)
  where status = 'active';

create index if not exists contact_points_person_id_idx
  on contact_points (person_id);

create index if not exists contact_points_type_value_normalized_idx
  on contact_points (type, value_normalized);

create index if not exists contact_verifications_contact_point_id_idx
  on contact_verifications (contact_point_id);

create index if not exists notification_consents_person_id_idx
  on notification_consents (person_id);

create index if not exists notification_consents_person_channel_type_idx
  on notification_consents (person_id, channel, consent_type);

create index if not exists notification_consents_granted_idx
  on notification_consents (person_id, channel, consent_type)
  where status = 'granted';

create index if not exists reminder_rules_person_id_idx
  on reminder_rules (person_id);

create index if not exists reminder_rules_enabled_slot_idx
  on reminder_rules (is_enabled, deleted_at, time_local);

create index if not exists reminder_channels_rule_id_idx
  on reminder_channels (rule_id);

create unique index if not exists reminder_channels_rule_channel_key
  on reminder_channels (rule_id, channel);

create index if not exists reminder_channels_rule_priority_idx
  on reminder_channels (rule_id, priority);

create index if not exists web_push_subscription_owners_person_id_idx
  on web_push_subscription_owners (person_id);

create index if not exists web_push_subscription_owners_endpoint_hash_idx
  on web_push_subscription_owners (endpoint_hash);

create unique index if not exists web_push_subscription_owners_active_endpoint_hash_key
  on web_push_subscription_owners (endpoint_hash)
  where ownership_status = 'active';

create unique index if not exists notification_delivery_claims_claim_key_key
  on notification_delivery_claims (claim_key);

create unique index if not exists notification_delivery_claims_rule_channel_slot_key
  on notification_delivery_claims (rule_id, channel, local_slot_key);

create index if not exists notification_delivery_claims_person_id_idx
  on notification_delivery_claims (person_id);

create index if not exists notification_delivery_claims_status_idx
  on notification_delivery_claims (status);

create index if not exists notification_delivery_logs_claim_id_idx
  on notification_delivery_logs (claim_id);

create index if not exists notification_delivery_logs_person_id_idx
  on notification_delivery_logs (person_id);

create index if not exists notification_delivery_logs_created_at_idx
  on notification_delivery_logs (created_at);

create index if not exists notification_delivery_logs_decision_status_created_at_idx
  on notification_delivery_logs (decision_status, created_at);

-- Notes.
-- This draft intentionally does not create RLS policies.
-- This draft intentionally does not create triggers or functions.
-- This draft intentionally does not backfill existing data.
-- This draft intentionally does not add a strong FK to push_subscriptions(id);
-- verify the existing table and id type before adding that relationship in a separate PR.
-- Store only endpoint_hash in web_push_subscription_owners. Do not store raw endpoint, p256dh, or auth here.
