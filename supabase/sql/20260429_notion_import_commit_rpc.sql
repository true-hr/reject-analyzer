-- ============================================================
-- Migration: 20260429_notion_import_commit_rpc.sql
-- Round: 7-G1-A
-- ============================================================
-- Adds a SECURITY DEFINER RPC function used exclusively by the
-- Cloudflare Worker to atomically commit a single Notion page
-- import as a work_records row + external_record_links row.
--
-- Design document: docs/notion-import-commit-contract.md
--
-- Transaction guarantee:
--   work_records INSERT and external_record_links INSERT happen
--   inside a single PL/pgSQL block. If external_record_links
--   INSERT hits the unique(user_id, provider, external_record_id)
--   constraint, the already-inserted work_record is deleted before
--   returning skipped_duplicate — no orphan row is left.
--   An EXCEPTION block rolls back all DML on unexpected errors.
--
-- Caller:
--   POST /rest/v1/rpc/import_notion_work_record
--   Called by the Cloudflare Worker using SUPABASE_SERVICE_ROLE_KEY.
--   No direct browser / anon / authenticated access allowed.
-- ============================================================


-- ============================================================
-- FUNCTION: public.import_notion_work_record
-- ============================================================

CREATE OR REPLACE FUNCTION public.import_notion_work_record(
  p_user_id               uuid,
  p_external_record_id    text,
  p_content_hash          text,
  p_work_record_payload   jsonb,
  p_external_link_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_work_record_id  uuid;
  v_link_id         uuid;
BEGIN

  -- ── Input validation (no DML yet; exits before savepoint matters) ──

  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok',         false,
      'status',     'failed',
      'error_code', 'missing_user_id',
      'message',    'p_user_id is required'
    );
  END IF;

  IF p_external_record_id IS NULL OR trim(p_external_record_id) = '' THEN
    RETURN jsonb_build_object(
      'ok',         false,
      'status',     'failed',
      'error_code', 'missing_external_record_id',
      'message',    'p_external_record_id is required'
    );
  END IF;

  IF p_work_record_payload IS NULL THEN
    RETURN jsonb_build_object(
      'ok',         false,
      'status',     'failed',
      'error_code', 'missing_work_record_payload',
      'message',    'p_work_record_payload is required'
    );
  END IF;

  IF (p_work_record_payload->>'title') IS NULL
     OR trim(p_work_record_payload->>'title') = '' THEN
    RETURN jsonb_build_object(
      'ok',         false,
      'status',     'failed',
      'error_code', 'missing_title',
      'message',    'work_record title is required'
    );
  END IF;

  IF (p_work_record_payload->>'record_date') IS NULL THEN
    RETURN jsonb_build_object(
      'ok',         false,
      'status',     'failed',
      'error_code', 'missing_record_date',
      'message',    'work_record record_date is required'
    );
  END IF;

  -- ── Step 1: INSERT work_record ─────────────────────────────────────
  --
  -- source is hardcoded 'notion'; caller cannot override it.
  -- raw_payload must be pre-built by the Worker and passed via
  -- p_work_record_payload->'raw_payload'.
  -- raw_payload top-level keys startDate/endDate/recordType/workType
  -- must be present for HomeDashboard calendar range rendering.

  INSERT INTO public.work_records (
    user_id,
    record_date,
    title,
    description,
    task,
    result,
    project_name,
    strength_tags,
    skill_tags,
    work_type,
    visibility,
    source,
    raw_payload
  )
  VALUES (
    p_user_id,
    (p_work_record_payload->>'record_date')::date,
    p_work_record_payload->>'title',
    p_work_record_payload->>'description',
    p_work_record_payload->>'task',
    p_work_record_payload->>'result',
    p_work_record_payload->>'project_name',
    ARRAY(
      SELECT jsonb_array_elements_text(
        COALESCE(p_work_record_payload->'strength_tags', '[]'::jsonb)
      )
    ),
    ARRAY(
      SELECT jsonb_array_elements_text(
        COALESCE(p_work_record_payload->'skill_tags', '[]'::jsonb)
      )
    ),
    COALESCE(p_work_record_payload->>'work_type', 'weekly'),
    COALESCE(p_work_record_payload->>'visibility', 'private'),
    'notion',
    COALESCE(p_work_record_payload->'raw_payload', '{}'::jsonb)
  )
  RETURNING id INTO v_work_record_id;

  -- ── Step 2: INSERT external_record_link ───────────────────────────
  --
  -- ON CONFLICT DO NOTHING handles the race-condition case where
  -- the same Notion page was imported concurrently.
  -- provider is hardcoded 'notion'.

  INSERT INTO public.external_record_links (
    user_id,
    provider,
    external_source_id,
    external_record_id,
    work_record_id,
    external_updated_at,
    content_hash,
    last_imported_at,
    sync_status,
    raw_meta
  )
  VALUES (
    p_user_id,
    'notion',
    p_external_link_payload->>'external_source_id',
    p_external_record_id,
    v_work_record_id,
    (NULLIF(p_external_link_payload->>'external_updated_at', ''))::timestamptz,
    p_content_hash,
    now(),
    'imported',
    COALESCE(p_external_link_payload->'raw_meta', '{}'::jsonb)
  )
  ON CONFLICT (user_id, provider, external_record_id) DO NOTHING
  RETURNING id INTO v_link_id;

  -- ── Step 3: Duplicate conflict branch ─────────────────────────────
  --
  -- v_link_id IS NULL means ON CONFLICT DO NOTHING fired.
  -- The work_record inserted in Step 1 must be deleted to prevent
  -- an orphan row. If this DELETE raises an exception, the outer
  -- EXCEPTION block rolls back the entire block (including Step 1).

  IF v_link_id IS NULL THEN
    DELETE FROM public.work_records
    WHERE id        = v_work_record_id
      AND user_id   = p_user_id;

    RETURN jsonb_build_object(
      'ok',             true,
      'status',         'skipped_duplicate',
      'work_record_id', null::uuid,
      'link_id',        null::uuid,
      'message',        'already imported'
    );
  END IF;

  -- ── Step 4: Success ────────────────────────────────────────────────

  RETURN jsonb_build_object(
    'ok',             true,
    'status',         'committed',
    'work_record_id', v_work_record_id,
    'link_id',        v_link_id
  );

EXCEPTION WHEN OTHERS THEN
  -- PL/pgSQL automatically rolls back all DML in this block to the
  -- implicit savepoint set at block entry. No manual cleanup needed.
  RETURN jsonb_build_object(
    'ok',         false,
    'status',     'failed',
    'error_code', 'db_error',
    'message',    SQLERRM
  );

END;
$$;

COMMENT ON FUNCTION public.import_notion_work_record(uuid, text, text, jsonb, jsonb) IS
  'Atomic Notion import commit: inserts work_records + external_record_links in one transaction. '
  'Deduplicates via unique(user_id, provider, external_record_id). '
  'Called exclusively by the Cloudflare Worker via service_role. '
  'Round 7-G1-A. Design: docs/notion-import-commit-contract.md.';


-- ============================================================
-- SECURITY: restrict execution to service_role only
-- ============================================================
--
-- By default PostgreSQL grants EXECUTE to PUBLIC when a function
-- is created. We revoke that and grant only to service_role so
-- that anon / authenticated browser clients cannot call this
-- function directly.
--
-- The Cloudflare Worker calls this via SUPABASE_SERVICE_ROLE_KEY,
-- which maps to the service_role in Supabase PostgREST.

REVOKE ALL ON FUNCTION public.import_notion_work_record(uuid, text, text, jsonb, jsonb)
  FROM PUBLIC;

REVOKE ALL ON FUNCTION public.import_notion_work_record(uuid, text, text, jsonb, jsonb)
  FROM anon;

REVOKE ALL ON FUNCTION public.import_notion_work_record(uuid, text, text, jsonb, jsonb)
  FROM authenticated;

GRANT EXECUTE ON FUNCTION public.import_notion_work_record(uuid, text, text, jsonb, jsonb)
  TO service_role;
