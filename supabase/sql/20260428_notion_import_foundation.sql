-- ============================================================
-- Notion Import Foundation
-- Migration: 20260428_notion_import_foundation.sql
-- ============================================================
-- Adds two tables to support Notion → PASSMAP import MVP:
--   1. notion_connections      — per-user Notion workspace tokens
--   2. external_record_links   — Notion page ↔ work_record mapping
--
-- Out of scope for this migration:
--   - work_records column additions (not needed)
--   - notion_import_sources (deferred to Round 7-D+)
--   - Notion webhook / bidirectional sync
--   - Cloudflare Worker endpoints
-- ============================================================
-- NOTE: notion_connections stores encrypted access tokens.
-- No direct-client SELECT policy is created for that table.
-- All token access is intended via Cloudflare Worker + service_role.
-- service_role bypasses RLS by design in Supabase.
-- ============================================================


-- ============================================================
-- FUNCTION: public.set_updated_at()
-- ============================================================
-- No updated_at trigger function exists in prior migrations.
-- Prior tables manage updated_at at the application layer
-- (e.g. workRecordRepository.js: updated_at: new Date().toISOString()).
-- We introduce this trigger for the two new tables only.
-- CREATE OR REPLACE is idempotent; prior tables are unaffected.
-- ============================================================
create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- TABLE: notion_connections
-- ============================================================
-- Stores per-user Notion workspace connection info and the
-- encrypted access token required to call the Notion API.
--
-- Security: access_token_enc MUST NOT be exposed to the browser.
-- All reads/writes go through the Cloudflare Worker using
-- SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- No direct-client RLS policies are created on this table.
-- ============================================================
create table if not exists public.notion_connections (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  workspace_id     text        not null,
  workspace_name   text,
  bot_id           text,
  access_token_enc text        not null,
  status           text        not null default 'active',
  connected_at     timestamptz not null default now(),
  last_checked_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint notion_connections_status_check
    check (status in ('active', 'revoked', 'error')),

  constraint notion_connections_user_workspace_unique
    unique (user_id, workspace_id)
);

comment on table public.notion_connections is
  'Per-user Notion workspace connections. access_token_enc must not be exposed to the browser client.';
comment on column public.notion_connections.access_token_enc is
  'Encrypted Notion OAuth access token. Encryption/decryption is handled by the Cloudflare Worker only. Round 7-C will implement AES-GCM via Worker crypto.subtle.';
comment on column public.notion_connections.workspace_id is
  'Notion workspace identifier returned by the OAuth token exchange.';
comment on column public.notion_connections.bot_id is
  'Notion bot/integration ID associated with this connection.';
comment on column public.notion_connections.status is
  'Connection health: active | revoked | error';
comment on column public.notion_connections.last_checked_at is
  'Timestamp of the last Notion API reachability check for this connection.';

create index if not exists notion_connections_user_id_idx
  on public.notion_connections (user_id);

create index if not exists notion_connections_status_idx
  on public.notion_connections (status);

create index if not exists notion_connections_user_workspace_idx
  on public.notion_connections (user_id, workspace_id);

alter table public.notion_connections enable row level security;

-- ============================================================
-- RLS: notion_connections — NO direct-client policies
-- ============================================================
-- RATIONALE: access_token_enc is stored in this table.
-- Granting authenticated clients SELECT access would expose
-- the encrypted token to the browser, undermining its protection
-- against XSS and token theft.
--
-- Access pattern:
--   - Cloudflare Worker uses SUPABASE_SERVICE_ROLE_KEY
--     → bypasses RLS entirely (Supabase by design)
--   - Frontend never reads this table directly
--   - "Is Notion connected?" status is exposed via a Worker API
--     that returns only { connected: bool, workspace_name } — never the token
--
-- If a future admin/debug view is needed, create a separate
-- PostgreSQL view that excludes access_token_enc and grant SELECT
-- on that view only.
-- ============================================================

drop trigger if exists set_notion_connections_updated_at
  on public.notion_connections;

create trigger set_notion_connections_updated_at
  before update on public.notion_connections
  for each row execute function public.set_updated_at();


-- ============================================================
-- TABLE: external_record_links
-- ============================================================
-- Maps external provider records (Notion pages) to PASSMAP
-- work_records for deduplication and sync tracking.
--
-- Key invariant: when a work_record is hard-deleted, work_record_id
-- becomes NULL (on delete set null). The link row is preserved so
-- re-import of the same Notion page can detect "already imported,
-- since deleted" and handle it explicitly rather than silently
-- re-creating a duplicate.
--
-- Duplicate prevention:
--   unique(user_id, provider, external_record_id) ensures that the
--   same Notion page_id cannot be imported twice for the same user.
-- ============================================================
create table if not exists public.external_record_links (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  provider            text        not null default 'notion',
  external_source_id  text,
  external_record_id  text        not null,
  work_record_id      uuid        references public.work_records(id) on delete set null,
  external_updated_at timestamptz,
  content_hash        text,
  last_imported_at    timestamptz,
  sync_status         text        not null default 'imported',
  raw_meta            jsonb       not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint external_record_links_provider_check
    check (provider in ('notion')),

  constraint external_record_links_sync_status_check
    check (sync_status in ('imported', 'skipped', 'pending_update', 'conflict', 'deleted', 'error')),

  constraint external_record_links_unique
    unique (user_id, provider, external_record_id)
);

comment on table public.external_record_links is
  'Maps external provider records (Notion pages) to work_records. Tracks import dedup, sync status, and content changes.';
comment on column public.external_record_links.provider is
  'External provider name. Currently only notion. Check constraint enforces allowed values.';
comment on column public.external_record_links.external_source_id is
  'Provider-native source/database container. For Notion: data_source_id (preferred) or database_id.';
comment on column public.external_record_links.external_record_id is
  'Provider-native record ID. For Notion: page_id. Part of the unique dedup key.';
comment on column public.external_record_links.work_record_id is
  'NULL when the linked work_record has been hard-deleted. Preserves import history for dedup tracking.';
comment on column public.external_record_links.content_hash is
  'Hash of imported Notion page content at last_imported_at. Used to detect pending_update candidates on subsequent imports.';
comment on column public.external_record_links.sync_status is
  'imported | skipped | pending_update | conflict | deleted | error';
comment on column public.external_record_links.raw_meta is
  'Lightweight Notion metadata snapshot (e.g. page title, last_edited_time, url). Not the full work_records payload.';

create index if not exists external_record_links_user_id_idx
  on public.external_record_links (user_id);

create index if not exists external_record_links_provider_idx
  on public.external_record_links (provider);

create index if not exists external_record_links_user_provider_idx
  on public.external_record_links (user_id, provider);

create index if not exists external_record_links_user_provider_source_idx
  on public.external_record_links (user_id, provider, external_source_id);

create index if not exists external_record_links_work_record_id_idx
  on public.external_record_links (work_record_id);

create index if not exists external_record_links_sync_status_idx
  on public.external_record_links (sync_status);

create index if not exists external_record_links_external_updated_at_idx
  on public.external_record_links (external_updated_at);

alter table public.external_record_links enable row level security;

-- ============================================================
-- RLS: external_record_links
-- ============================================================
-- Owner SELECT is safe: no sensitive tokens in this table.
-- Allows the frontend to query its own import history
-- (e.g. render "already imported" status in the UI).
--
-- INSERT / UPDATE / DELETE are NOT exposed to the JS client.
-- The Cloudflare Worker uses SUPABASE_SERVICE_ROLE_KEY to
-- perform import operations, which bypasses RLS.
-- Do NOT add INSERT/UPDATE/DELETE policies for authenticated role.
-- ============================================================
drop policy if exists "external_record_links: owner select"
  on public.external_record_links;

create policy "external_record_links: owner select"
  on public.external_record_links for select
  using (auth.uid() = user_id);

drop trigger if exists set_external_record_links_updated_at
  on public.external_record_links;

create trigger set_external_record_links_updated_at
  before update on public.external_record_links
  for each row execute function public.set_updated_at();
