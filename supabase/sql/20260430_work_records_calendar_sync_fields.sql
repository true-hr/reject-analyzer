-- ============================================================
-- work_records: Google Calendar sync fields
-- Migration: 20260430_work_records_calendar_sync_fields.sql
-- Round: CAL-7B
-- ============================================================
-- Adds 4 Google Calendar sync columns to public.work_records.
-- All additions are idempotent (add column if not exists).
-- Existing data is not modified.
--
-- Apply in Supabase SQL Editor.
-- Do NOT run automatically — user applies manually.
--
-- Fields added:
--   google_calendar_event_id    — Google Calendar event id after insert
--   google_calendar_sync_status — sync state machine value
--   google_calendar_synced_at   — timestamp of last successful sync
--   google_calendar_sync_error  — error code on failure (never full message)
--
-- Sync status values:
--   none    — not yet attempted (default)
--   pending — Worker has started the insert call
--   synced  — event insert succeeded
--   failed  — event insert failed
--   skipped — skipped (e.g. google_calendar_event_id already present)
-- ============================================================


alter table public.work_records
  add column if not exists google_calendar_event_id    text,
  add column if not exists google_calendar_sync_status text not null default 'none',
  add column if not exists google_calendar_synced_at   timestamptz,
  add column if not exists google_calendar_sync_error  text;


-- Check constraint: allow only known status values.
-- Drop first to make the migration re-runnable.
alter table public.work_records
  drop constraint if exists work_records_google_calendar_sync_status_check;

alter table public.work_records
  add constraint work_records_google_calendar_sync_status_check
    check (google_calendar_sync_status in ('none', 'pending', 'synced', 'failed', 'skipped'));


comment on column public.work_records.google_calendar_event_id is
  'Google Calendar event id created by CAL-7B sync-record endpoint. Null until first successful sync.';
comment on column public.work_records.google_calendar_sync_status is
  'none | pending | synced | failed | skipped';
comment on column public.work_records.google_calendar_synced_at is
  'Timestamp of last successful Google Calendar event insert. Null until synced.';
comment on column public.work_records.google_calendar_sync_error is
  'Short error code on sync failure. Never contains token, secret, or full API error body.';
