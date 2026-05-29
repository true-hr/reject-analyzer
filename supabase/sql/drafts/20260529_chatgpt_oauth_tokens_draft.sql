-- ============================================================
-- DRAFT ONLY — DO NOT RUN DIRECTLY
-- This is not an applied migration.
-- Requires protected DB migration review before execution.
-- ============================================================
--
-- Purpose
--   Draft table design for PASSMAP ChatGPT Actions OAuth state,
--   authorization code, and access token storage.
--
-- Scope
--   - Design-only SQL draft.
--   - Not an executable production migration approval.
--   - No OAuth endpoint implementation.
--   - No env/secret changes.
--   - No Supabase project mutation is performed by committing this file.
--
-- Security decisions
--   - Store state/code/token hashes only.
--   - Never store plaintext state, authorization code, or access token.
--   - Initial MVP excludes refresh tokens.
--   - Tables are intended for server/service_role access.
--   - Direct browser-client policies are intentionally not drafted.
--   - If user-facing connection management is needed later, expose only
--     a safe API or view that excludes state_hash/code_hash/token_hash.
-- ============================================================


-- ============================================================
-- TABLE DRAFT: chatgpt_oauth_states
-- ============================================================
-- Stores hashed OAuth state values for CSRF protection and state reuse
-- prevention during the ChatGPT Actions OAuth authorization flow.
-- Plaintext state must never be persisted.
-- ============================================================

create table if not exists public.chatgpt_oauth_states (
  id           uuid        primary key default gen_random_uuid(),
  state_hash   text        not null unique,
  client_id    text        not null,
  redirect_uri text        not null,
  scope        text        not null,
  user_id      uuid        references auth.users(id) on delete cascade,
  expires_at   timestamptz not null,
  consumed_at  timestamptz,
  created_at   timestamptz not null default now(),
  metadata     jsonb       not null default '{}'::jsonb
);

create index if not exists chatgpt_oauth_states_expires_at_idx
  on public.chatgpt_oauth_states (expires_at);

create index if not exists chatgpt_oauth_states_consumed_at_idx
  on public.chatgpt_oauth_states (consumed_at);

create index if not exists chatgpt_oauth_states_user_id_idx
  on public.chatgpt_oauth_states (user_id);

alter table public.chatgpt_oauth_states enable row level security;

-- RLS policy direction:
--   No direct-client SELECT/INSERT/UPDATE/DELETE policies by default.
--   OAuth server endpoints should use service_role after request validation.


-- ============================================================
-- TABLE DRAFT: chatgpt_oauth_authorization_codes
-- ============================================================
-- Stores hashed authorization codes issued after PASSMAP login/consent.
-- The token endpoint must validate code_hash, client_id, redirect_uri,
-- scope, expires_at, and consumed_at before issuing an access token.
-- Plaintext code must never be persisted.
-- ============================================================

create table if not exists public.chatgpt_oauth_authorization_codes (
  id           uuid        primary key default gen_random_uuid(),
  code_hash    text        not null unique,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  client_id    text        not null,
  redirect_uri text        not null,
  scope        text        not null,
  expires_at   timestamptz not null,
  consumed_at  timestamptz,
  created_at   timestamptz not null default now(),
  metadata     jsonb       not null default '{}'::jsonb
);

create index if not exists chatgpt_oauth_authorization_codes_user_id_idx
  on public.chatgpt_oauth_authorization_codes (user_id);

create index if not exists chatgpt_oauth_authorization_codes_client_id_idx
  on public.chatgpt_oauth_authorization_codes (client_id);

create index if not exists chatgpt_oauth_authorization_codes_expires_at_idx
  on public.chatgpt_oauth_authorization_codes (expires_at);

create index if not exists chatgpt_oauth_authorization_codes_consumed_at_idx
  on public.chatgpt_oauth_authorization_codes (consumed_at);

alter table public.chatgpt_oauth_authorization_codes enable row level security;

-- RLS policy direction:
--   No direct-client SELECT/INSERT/UPDATE/DELETE policies by default.
--   OAuth server endpoints should use service_role after request validation.


-- ============================================================
-- TABLE DRAFT: chatgpt_oauth_access_tokens
-- ============================================================
-- Stores hashed first-party PASSMAP OAuth access tokens for ChatGPT
-- Actions. These are distinct from Supabase access tokens and from MCP
-- pmcp_ tokens.
-- Plaintext token must never be persisted.
-- Initial MVP excludes refresh tokens.
-- ============================================================

create table if not exists public.chatgpt_oauth_access_tokens (
  id           uuid        primary key default gen_random_uuid(),
  token_hash   text        not null unique,
  token_prefix text,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  client_id    text        not null,
  scope        text        not null,
  issued_at    timestamptz not null default now(),
  expires_at   timestamptz not null,
  revoked_at   timestamptz,
  last_used_at timestamptz,
  metadata     jsonb       not null default '{}'::jsonb
);

create index if not exists chatgpt_oauth_access_tokens_token_prefix_idx
  on public.chatgpt_oauth_access_tokens (token_prefix);

create index if not exists chatgpt_oauth_access_tokens_user_id_idx
  on public.chatgpt_oauth_access_tokens (user_id);

create index if not exists chatgpt_oauth_access_tokens_client_id_idx
  on public.chatgpt_oauth_access_tokens (client_id);

create index if not exists chatgpt_oauth_access_tokens_expires_at_idx
  on public.chatgpt_oauth_access_tokens (expires_at);

create index if not exists chatgpt_oauth_access_tokens_revoked_at_idx
  on public.chatgpt_oauth_access_tokens (revoked_at);

create index if not exists chatgpt_oauth_access_tokens_last_used_at_idx
  on public.chatgpt_oauth_access_tokens (last_used_at);

alter table public.chatgpt_oauth_access_tokens enable row level security;

-- RLS policy direction:
--   No direct-client SELECT/INSERT/UPDATE/DELETE policies by default.
--   OAuth server endpoints should use service_role after request validation.
--   If users need connection management later, build a safe endpoint or view
--   that returns id, client_id, scope, issued_at, expires_at, revoked_at,
--   last_used_at, and metadata only. Never expose token_hash.


-- ============================================================
-- Cleanup examples — comments only, not part of this draft execution.
-- ============================================================
--
-- Example expired state/code cleanup:
--   delete from public.chatgpt_oauth_states
--   where expires_at < now() - interval '1 day';
--
--   delete from public.chatgpt_oauth_authorization_codes
--   where expires_at < now() - interval '1 day';
--
-- Example expired/revoked access token cleanup after retention:
--   delete from public.chatgpt_oauth_access_tokens
--   where (
--     expires_at < now() - interval '30 days'
--     or revoked_at < now() - interval '30 days'
--   );
--
-- Cron registration, retention policy, and production cleanup automation are
-- separate Protected follow-up work.
