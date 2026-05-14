-- ============================================================
-- Migration: 20260514_analysis_tables_rls.sql
-- ============================================================
-- Enables Row Level Security on analysis_inputs and analysis_runs.
--
-- Background:
--   Both tables were created in 20260316_analysis_runs_mvp.sql
--   without RLS, leaving them exposed to any anon-key query.
--   All reads/writes go through server-side API routes that use
--   SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS — so enabling
--   RLS does not break any existing functionality.
--
-- Design decisions:
--   - Enable RLS: blocks direct anon/user PostgREST access.
--   - SELECT policy for row owner: forward-compatible for future
--     user-facing analysis history feature.
--   - No INSERT/UPDATE/DELETE policies: all writes are done via
--     service role in api/save-analysis-run.js; policies would
--     be unreachable for those code paths.
--   - Cast required: user_id is TEXT (not uuid), so auth.uid()
--     must be cast to text for the equality check.
--   - admin-analysis.js uses service role → unaffected by RLS.
-- ============================================================


-- ============================================================
-- analysis_inputs
-- ============================================================

alter table public.analysis_inputs enable row level security;

create policy analysis_inputs_select_own
  on public.analysis_inputs
  for select
  using (auth.uid()::text = user_id);


-- ============================================================
-- analysis_runs
-- ============================================================

alter table public.analysis_runs enable row level security;

create policy analysis_runs_select_own
  on public.analysis_runs
  for select
  using (auth.uid()::text = user_id);
