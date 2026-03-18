create extension if not exists pgcrypto;

create table if not exists public.analysis_inputs (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  jd_text text,
  resume_text text,
  company_name text,
  target_role text,
  industry text,
  stage text,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  input_id uuid not null references public.analysis_inputs(id) on delete cascade,
  user_id text,
  engine_version text not null,
  status text not null default 'success',
  score numeric,
  candidate_type text,
  top_risks_json jsonb not null default '[]'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analysis_inputs_user_created_at
  on public.analysis_inputs (user_id, created_at desc);

create index if not exists idx_analysis_runs_user_created_at
  on public.analysis_runs (user_id, created_at desc);

create index if not exists idx_analysis_runs_input_created_at
  on public.analysis_runs (input_id, created_at desc);
