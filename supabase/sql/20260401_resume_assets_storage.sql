create extension if not exists pgcrypto;

-- resume_assets: SSOT for resume files (uploads and paste text)
create table if not exists public.resume_assets (
  id uuid primary key default gen_random_uuid(),
  user_id text null,
  visitor_id text null,
  email text null,
  contact text null,
  source_type text not null,
  storage_bucket text null,
  storage_path text null,
  original_file_name text null,
  mime_type text null,
  file_size_bytes bigint null,
  resume_text text null,
  extract_status text not null default 'pending',
  created_at timestamptz not null default now(),

  constraint resume_assets_source_type_check
    check (source_type in ('upload', 'paste')),
  constraint resume_assets_extract_status_check
    check (extract_status in ('pending', 'success', 'failed'))
);

create index if not exists resume_assets_user_id_idx
  on public.resume_assets (user_id);

create index if not exists resume_assets_visitor_id_idx
  on public.resume_assets (visitor_id);

create index if not exists resume_assets_created_at_idx
  on public.resume_assets (created_at desc);

-- add resume_asset_id to recommendation requests (backward compatible)
alter table public.resume_recommendation_requests
  add column if not exists resume_asset_id uuid;

do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'rr_resume_asset_id_fk'
      and table_name = 'resume_recommendation_requests'
  ) then
    alter table public.resume_recommendation_requests
      add constraint rr_resume_asset_id_fk
        foreign key (resume_asset_id)
        references public.resume_assets(id)
        on delete set null;
  end if;
end $$;

create index if not exists rr_resume_asset_id_idx
  on public.resume_recommendation_requests (resume_asset_id);

-- storage bucket (idempotent)
-- NOTE: RLS policy must be configured separately in Supabase dashboard
insert into storage.buckets (id, name, public)
values ('resume-files', 'resume-files', false)
on conflict (id) do nothing;
