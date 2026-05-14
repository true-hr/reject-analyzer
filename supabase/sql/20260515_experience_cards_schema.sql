-- ============================================================
-- Migration: 20260515_experience_cards_schema.sql
-- ============================================================
-- Adds the formal experience-card data model:
--
--   raw_sources        — one row per original paste / file upload session
--   experience_cards   — one row per AI-extracted, user-accepted experience
--   experience_evidence — source-text snippets that justify each card
--
-- Design decisions:
--   - raw_sources: generic name (not work_trace_sources) because future
--     sources include Gmail, Drive, Notion, Slack, PDF, CSV, image.
--   - experience_evidence: separate table (not jsonb) so that evidence
--     can later be edited, deleted, anonymized, or linked to resume bullets.
--   - user_id is denormalized onto experience_evidence for simple owner-based
--     RLS without join complexity.
--   - work_record_id nullable FK on raw_sources and experience_cards
--     preserves backward compatibility with PR #339 MVP storage.
--   - No CHECK constraints on text enums (resume_potential, status, etc.):
--     app-layer validation is sufficient; DB enum would require migration
--     for every value extension.
--   - updated_at trigger reuses public.set_updated_at() introduced in
--     20260428_notion_import_foundation.sql (CREATE OR REPLACE, always safe).
--   - experience_evidence has no updated_at (append-only by design).
--
-- DO NOT APPLY this migration without explicit Protected DB approval.
-- Apply in Supabase SQL Editor or via protected migration workflow.
-- ============================================================


-- ============================================================
-- TABLE: raw_sources
-- ============================================================
-- One row per paste session or file upload.
-- Stores the original material before AI processing.
-- ============================================================

create table if not exists public.raw_sources (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  work_record_id   uuid        references public.work_records(id) on delete set null,
  -- nullable: set null if the companion work_records row is deleted

  source_type      text        not null default 'unknown',
  -- kakao | slack | meeting_note | email | work_report | csv | image | unknown
  source_label     text,
  -- human-readable label, e.g. "카카오톡 대화 (2024-03)"
  detected_period  text,
  -- ISO 8601 range or free text returned by AI, e.g. "2024-01-01/2024-03-31"

  raw_text         text,
  -- nullable: file-only sources have no inline text
  file_url         text,
  -- Supabase Storage URL (future: image / PDF upload path)
  file_name        text,
  mime_type        text,

  summary          text,
  -- 2–3 sentence AI summary of the material

  processing_status text       not null default 'processed',
  -- processed | pending | failed

  metadata         jsonb       not null default '{}'::jsonb,
  -- free extension point (AI model, token count, version, etc.)

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists raw_sources_user_id_idx
  on public.raw_sources (user_id);

create index if not exists raw_sources_work_record_id_idx
  on public.raw_sources (work_record_id);

alter table public.raw_sources enable row level security;

drop policy if exists "raw_sources: owner select" on public.raw_sources;
create policy "raw_sources: owner select"
  on public.raw_sources for select
  using (auth.uid() = user_id);

drop policy if exists "raw_sources: owner insert" on public.raw_sources;
create policy "raw_sources: owner insert"
  on public.raw_sources for insert
  with check (auth.uid() = user_id);

drop policy if exists "raw_sources: owner update" on public.raw_sources;
create policy "raw_sources: owner update"
  on public.raw_sources for update
  using (auth.uid() = user_id);

drop policy if exists "raw_sources: owner delete" on public.raw_sources;
create policy "raw_sources: owner delete"
  on public.raw_sources for delete
  using (auth.uid() = user_id);

drop trigger if exists set_raw_sources_updated_at on public.raw_sources;
create trigger set_raw_sources_updated_at
  before update on public.raw_sources
  for each row execute function public.set_updated_at();


-- ============================================================
-- TABLE: experience_cards
-- ============================================================
-- One row per AI-extracted, user-accepted experience candidate.
-- Array-like fields are stored as jsonb arrays to stay consistent with the
-- normalizer output in extractExperienceCandidates.js.
-- ============================================================

create table if not exists public.experience_cards (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  source_id        uuid        references public.raw_sources(id) on delete set null,
  work_record_id   uuid        references public.work_records(id) on delete set null,

  title            text        not null,
  situation        text,
  task             text,

  actions          jsonb       not null default '[]'::jsonb,
  result           jsonb       not null default '[]'::jsonb,
  collaboration    jsonb       not null default '[]'::jsonb,
  skills           jsonb       not null default '[]'::jsonb,
  job_tags         jsonb       not null default '[]'::jsonb,
  industry_tags    jsonb       not null default '[]'::jsonb,

  resume_potential         text  not null default 'medium',
  -- high | medium | low
  confidence_level         text  not null default 'medium',
  -- high | medium | low
  suggested_resume_bullet  text,
  missing_info_questions   jsonb not null default '[]'::jsonb,
  -- canonical DB name; followUpQuestions is a front-end alias only
  risk_notes               jsonb not null default '[]'::jsonb,

  differ_reason    text,
  -- not_led | no_result | better_result | overstatement | manual_edit
  status           text        not null default 'accepted',
  -- accepted | archived | converted

  metadata         jsonb       not null default '{}'::jsonb,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists experience_cards_user_id_idx
  on public.experience_cards (user_id);

create index if not exists experience_cards_source_id_idx
  on public.experience_cards (source_id);

create index if not exists experience_cards_work_record_id_idx
  on public.experience_cards (work_record_id);

create index if not exists experience_cards_status_idx
  on public.experience_cards (user_id, status);

alter table public.experience_cards enable row level security;

drop policy if exists "experience_cards: owner select" on public.experience_cards;
create policy "experience_cards: owner select"
  on public.experience_cards for select
  using (auth.uid() = user_id);

drop policy if exists "experience_cards: owner insert" on public.experience_cards;
create policy "experience_cards: owner insert"
  on public.experience_cards for insert
  with check (auth.uid() = user_id);

drop policy if exists "experience_cards: owner update" on public.experience_cards;
create policy "experience_cards: owner update"
  on public.experience_cards for update
  using (auth.uid() = user_id);

drop policy if exists "experience_cards: owner delete" on public.experience_cards;
create policy "experience_cards: owner delete"
  on public.experience_cards for delete
  using (auth.uid() = user_id);

drop trigger if exists set_experience_cards_updated_at on public.experience_cards;
create trigger set_experience_cards_updated_at
  before update on public.experience_cards
  for each row execute function public.set_updated_at();


-- ============================================================
-- TABLE: experience_evidence
-- ============================================================
-- Source-text snippets that the AI used to justify each card.
-- Separate table (not jsonb) so evidence can be edited,
-- deleted, anonymized, or linked to resume bullets independently.
-- Append-only: no updated_at column by design.
-- ============================================================

create table if not exists public.experience_evidence (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  -- denormalized for owner-based RLS without join
  experience_card_id  uuid        not null references public.experience_cards(id) on delete cascade,
  source_id           uuid        references public.raw_sources(id) on delete set null,
  -- set null on source deletion / anonymization

  evidence_text       text        not null,
  evidence_type       text        not null default 'source_text',
  -- source_text | inferred | user_added

  source_offset_start integer,
  -- character offset in raw_sources.raw_text (null if file-only)
  source_offset_end   integer,

  metadata            jsonb       not null default '{}'::jsonb,

  created_at          timestamptz not null default now()
);

create index if not exists experience_evidence_user_id_idx
  on public.experience_evidence (user_id);

create index if not exists experience_evidence_card_id_idx
  on public.experience_evidence (experience_card_id);

create index if not exists experience_evidence_source_id_idx
  on public.experience_evidence (source_id);

alter table public.experience_evidence enable row level security;

drop policy if exists "experience_evidence: owner select" on public.experience_evidence;
create policy "experience_evidence: owner select"
  on public.experience_evidence for select
  using (auth.uid() = user_id);

drop policy if exists "experience_evidence: owner insert" on public.experience_evidence;
create policy "experience_evidence: owner insert"
  on public.experience_evidence for insert
  with check (auth.uid() = user_id);

drop policy if exists "experience_evidence: owner update" on public.experience_evidence;
create policy "experience_evidence: owner update"
  on public.experience_evidence for update
  using (auth.uid() = user_id);

drop policy if exists "experience_evidence: owner delete" on public.experience_evidence;
create policy "experience_evidence: owner delete"
  on public.experience_evidence for delete
  using (auth.uid() = user_id);
