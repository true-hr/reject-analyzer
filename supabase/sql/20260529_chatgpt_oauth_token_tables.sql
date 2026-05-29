-- ============================================================
-- PASSMAP ChatGPT Actions OAuth token storage tables.
-- Migration: 20260529_chatgpt_oauth_token_tables.sql
-- ============================================================
-- This migration creates server-only OAuth state/code/access-token storage.
-- Plaintext state, authorization code, and access tokens must never be stored.
-- Initial MVP excludes refresh tokens.
-- No direct client RLS policies are created in this migration.
--
-- Access model
--   - OAuth server endpoints must access these tables with service_role after
--     request validation.
--   - Browser clients must not read or write these tables directly.
--   - If user-facing connection management is needed, expose a safe API/view
--     without state_hash, code_hash, or token_hash in a follow-up PR.
--
-- Cleanup
--   - Expired state/code rows and expired or revoked token rows should be
--     cleaned by a separate Protected cleanup/cron task.
--   - This migration intentionally does not include cleanup statements.
-- ============================================================


-- ============================================================
-- TABLE: chatgpt_oauth_states
-- ============================================================
-- Stores hashed OAuth state values for CSRF protection and single-use
-- validation during the ChatGPT Actions OAuth authorization flow.
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

-- No direct client policies are created intentionally.
-- Server endpoints must access this table with service_role after validation.


-- ============================================================
-- TABLE: chatgpt_oauth_authorization_codes
-- ============================================================
-- Stores hashed authorization codes issued after PASSMAP login/consent.
-- The token endpoint must validate code_hash, client_id, redirect_uri, scope,
-- expires_at, and consumed_at before issuing an access token.
-- Plaintext authorization code must never be persisted.
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

-- No direct client policies are created intentionally.
-- Server endpoints must access this table with service_role after validation.


-- ============================================================
-- TABLE: chatgpt_oauth_access_tokens
-- ============================================================
-- Stores hashed first-party PASSMAP OAuth access tokens for ChatGPT Actions.
-- These tokens are distinct from Supabase access tokens and MCP tokens.
-- Plaintext access token must never be persisted.
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

-- No direct client policies are created intentionally.
-- Server endpoints must access this table with service_role after validation.
-- If user-facing connection management is needed, expose a safe API/view
-- without hash columns in a follow-up PR.
