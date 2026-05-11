-- push_subscriptions
-- Stores device/browser-level Web Push reachability per user.
-- Reminder intent (day, time, enabled) is stored separately in reminder_preferences.
-- One row per endpoint (unique browser/device subscription).

-- TABLE
create table if not exists public.push_subscriptions (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  endpoint         text        not null,
  p256dh           text        not null,
  auth             text        not null,
  expiration_time  timestamptz null,
  user_agent       text        null,
  last_seen_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint push_subscriptions_endpoint_unique unique (endpoint)
);

-- INDEX
create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

-- RLS
alter table public.push_subscriptions enable row level security;

create policy "owner_select_push_subscriptions"
  on public.push_subscriptions
  for select
  using (auth.uid() = user_id);

create policy "owner_insert_push_subscriptions"
  on public.push_subscriptions
  for insert
  with check (auth.uid() = user_id);

create policy "owner_update_push_subscriptions"
  on public.push_subscriptions
  for update
  using (auth.uid() = user_id);

create policy "owner_delete_push_subscriptions"
  on public.push_subscriptions
  for delete
  using (auth.uid() = user_id);

-- TRIGGER: updated_at
-- Reuses the existing set_updated_at() function.
create trigger set_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row
  execute function public.set_updated_at();
