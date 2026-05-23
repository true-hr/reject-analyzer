-- ============================================================
-- Migration: 20260523_user_mcp_pairings.sql
-- ============================================================
-- Protected migration — do NOT apply without explicit approval.
-- Apply manually in the Supabase SQL editor (or via the project's protected
-- migration workflow) only after both the SQL and the companion API code
-- have been reviewed in a PR.
--
-- Purpose
--   Add a single table that backs the operational PASSMAP MCP connector:
--
--     user_mcp_pairings — one row per (user, MCP client) pairing.
--
--   Two distinct secrets per row, both stored as sha256 hex only:
--     - code_hash   : 6-char pairing code shown ONCE in the PASSMAP web UI.
--                     Consumed by /api/mcp?action=pairing_exchange.
--                     10-minute TTL, single-use.
--     - token_hash  : long-lived MCP bearer token returned to the wrapper.
--                     Default 90-day TTL, revocable from the web UI.
--
--   Plaintext code/token are NEVER persisted — the server hashes them on
--   create/exchange and only the wrapper or the user holds the plaintext.
--
-- Out of scope for this migration
--   - save_experience_candidate / search_experience_candidates endpoints
--   - resume_sentences MCP write paths
--   - delete/update tools
--   - pg_trgm / GIN search indexes
--
-- RLS notes
--   - Owner-only select/update/delete via auth.uid() = user_id.
--   - INSERT is intentionally NOT exposed to the anon/authenticated role.
--     Only the server endpoints (running as service_role) may insert rows,
--     after they have verified the caller's identity. Direct client writes
--     would let any logged-in user forge a pairing for someone else's
--     user_id, so this gap is deliberate.
-- ============================================================


create table if not exists public.user_mcp_pairings (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,

  -- one-time pairing code, sha256-hex; cleared on successful exchange
  code_hash         text,
  code_expires_at   timestamptz,
  consumed_at       timestamptz,

  -- long-lived MCP bearer token, sha256-hex; persists until revoke or expiry
  token_hash        text,
  token_expires_at  timestamptz,

  client_name       text,
  -- free text supplied by the wrapper, e.g. 'Claude Desktop', 'ChatGPT Desktop',
  -- 'mcp-inspector'. App-layer normalization only — no CHECK constraint so
  -- new clients can be added without a migration.

  last_used_at      timestamptz,
  revoked_at        timestamptz,

  created_at        timestamptz not null default now()
);


-- Owner lookup (revoke / list) -------------------------------------------------
create index if not exists user_mcp_pairings_user_id_idx
  on public.user_mcp_pairings (user_id);

-- Hot path: token verification on every save/search call.
-- Partial index keeps the active set tight.
create index if not exists user_mcp_pairings_token_hash_idx
  on public.user_mcp_pairings (token_hash)
  where revoked_at is null and token_hash is not null;

-- Hot path: pairing_exchange code lookup.
-- Partial index excludes already-consumed or revoked rows.
create index if not exists user_mcp_pairings_code_hash_idx
  on public.user_mcp_pairings (code_hash)
  where consumed_at is null and revoked_at is null and code_hash is not null;


alter table public.user_mcp_pairings enable row level security;


drop policy if exists "user_mcp_pairings: owner select" on public.user_mcp_pairings;
create policy "user_mcp_pairings: owner select"
  on public.user_mcp_pairings for select
  using (auth.uid() = user_id);

drop policy if exists "user_mcp_pairings: owner update" on public.user_mcp_pairings;
create policy "user_mcp_pairings: owner update"
  on public.user_mcp_pairings for update
  using (auth.uid() = user_id);

drop policy if exists "user_mcp_pairings: owner delete" on public.user_mcp_pairings;
create policy "user_mcp_pairings: owner delete"
  on public.user_mcp_pairings for delete
  using (auth.uid() = user_id);

-- NOTE: no INSERT policy is created. Only service_role (server endpoints)
-- may insert rows, after server-side identity verification.
