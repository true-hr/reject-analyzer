create extension if not exists pgcrypto;

create table if not exists public.resume_recommendation_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id text,
  email text not null,
  contact text,
  resume_text text not null,
  resume_source text not null default 'paste',
  cta_origin text not null default 'transition_lite_result',
  current_role text,
  current_industry text,
  target_role text,
  target_industry text,
  candidate_type text,
  top_risk_1 text,
  review_consent boolean not null default false,
  contact_consent boolean not null default false,
  detailed_share_consent boolean not null default false,
  meta_json jsonb not null default '{}'::jsonb
);

create index if not exists idx_resume_recommendation_requests_created_at
  on public.resume_recommendation_requests (created_at desc);

create index if not exists idx_resume_recommendation_requests_user_created_at
  on public.resume_recommendation_requests (user_id, created_at desc);

create index if not exists idx_resume_recommendation_requests_email_created_at
  on public.resume_recommendation_requests (email, created_at desc);

alter table public.resume_recommendation_requests
  add column if not exists contact text;

