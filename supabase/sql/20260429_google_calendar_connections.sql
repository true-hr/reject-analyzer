-- ============================================================
-- Google Calendar Connections
-- Migration: 20260429_google_calendar_connections.sql
-- Round: CAL-5B
-- ============================================================
-- Creates google_calendar_connections table to store per-user
-- Google Calendar OAuth tokens (AES-GCM encrypted).
--
-- Design mirrors notion_connections:
--   - access_token_enc and refresh_token_enc are never exposed to the browser.
--   - All reads/writes via Cloudflare Worker + SUPABASE_SERVICE_ROLE_KEY.
--   - No direct-client RLS SELECT policy is created (token protection).
--   - unique(user_id) — one active Google connection per PASSMAP user.
--
-- Out of scope for this migration:
--   - Dedicated PASSMAP calendar creation (CAL-6)
--   - work_records calendar sync fields (CAL-7+)
--   - Token refresh logic (CAL-7+)
--   - Disconnect/revoke endpoint (CAL-8+)
-- ============================================================


-- ============================================================
-- TABLE: google_calendar_connections
-- ============================================================
create table if not exists public.google_calendar_connections (
  id                          uuid        primary key default gen_random_uuid(),
  user_id                     uuid        not null references auth.users(id) on delete cascade,
  provider                    text        not null default 'google',

  -- Google account identity (null for CAL-5B: calendar scope does not yield email)
  -- Add openid+email scope in a future round to populate this column.
  provider_account_email      text,

  -- PASSMAP-dedicated Google Calendar (populated in CAL-6)
  google_calendar_id          text,
  google_calendar_name        text,
  google_calendar_created_by_passmap boolean not null default false,

  -- OAuth token fields (all encrypted)
  scope                       text,
  access_token_enc            text        not null,
  refresh_token_enc           text,
  token_expires_at            timestamptz,

  -- Connection status
  -- connected     = access + refresh tokens present, normal operation
  -- token_partial  = no refresh_token issued (should not occur with prompt=consent)
  -- token_expired  = access_token expired, refresh_token needs use (future CAL-7)
  -- revoked        = user disconnected or Google revoked access
  -- error          = last sync/check returned an error
  status                      text        not null default 'connected',

  connected_at                timestamptz not null default now(),
  disconnected_at             timestamptz,
  last_sync_at                timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint google_calendar_connections_status_check
    check (status in ('connected', 'token_partial', 'token_expired', 'revoked', 'error')),

  -- One active Google connection per PASSMAP user.
  -- Reconnecting overwrites the existing row via upsert (merge-duplicates).
  constraint google_calendar_connections_user_unique
    unique (user_id)
);

comment on table public.google_calendar_connections is
  'Per-user Google Calendar OAuth connections. access_token_enc and refresh_token_enc must not be exposed to the browser client. CAL-5B.';
comment on column public.google_calendar_connections.access_token_enc is
  'AES-GCM encrypted Google OAuth access token. Managed by Cloudflare Worker only.';
comment on column public.google_calendar_connections.refresh_token_enc is
  'AES-GCM encrypted Google OAuth refresh token. Null if not issued (token_partial status). Required for unattended refresh in CAL-7+.';
comment on column public.google_calendar_connections.token_expires_at is
  'Expiry timestamp derived from expires_in field in token exchange response. Google access tokens expire in ~3600s.';
comment on column public.google_calendar_connections.provider_account_email is
  'Google account email. Null in CAL-5B because calendar scope does not include email claims. Populate in a future round with openid+email scope.';
comment on column public.google_calendar_connections.google_calendar_id is
  'ID of the PASSMAP-dedicated Google Calendar created in CAL-6. Null until CAL-6 is implemented.';
comment on column public.google_calendar_connections.status is
  'connected | token_partial | token_expired | revoked | error';


create index if not exists google_calendar_connections_user_id_idx
  on public.google_calendar_connections (user_id);

create index if not exists google_calendar_connections_status_idx
  on public.google_calendar_connections (status);


-- ============================================================
-- RLS: google_calendar_connections — NO direct-client policies
-- ============================================================
-- Same rationale as notion_connections:
--   access_token_enc and refresh_token_enc must not be readable by the browser.
--   All access is via Cloudflare Worker with SUPABASE_SERVICE_ROLE_KEY.
--   service_role bypasses RLS by design in Supabase.
-- ============================================================

alter table public.google_calendar_connections enable row level security;


-- ============================================================
-- TRIGGER: updated_at
-- ============================================================
-- set_updated_at() is already defined in 20260428_notion_import_foundation.sql.
-- CREATE OR REPLACE in that migration makes it safe to reuse here.
-- ============================================================

drop trigger if exists set_google_calendar_connections_updated_at
  on public.google_calendar_connections;

create trigger set_google_calendar_connections_updated_at
  before update on public.google_calendar_connections
  for each row execute function public.set_updated_at();
