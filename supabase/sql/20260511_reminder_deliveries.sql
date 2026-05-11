-- reminder_deliveries
-- User-level delivery claim and ledger for reminder push sends.
-- A row is inserted as 'processing' before sending to claim the slot atomically.
-- This prevents duplicate delivery across concurrent invocations (at-most-once per week).
-- Subscription rows are stored separately in push_subscriptions.
-- One row per user per reminder_type per delivery_channel per week_start_local.

-- TABLE
create table if not exists public.reminder_deliveries (
  id               uuid    primary key default gen_random_uuid(),
  user_id          uuid    not null references auth.users(id) on delete cascade,
  reminder_type    text    not null,
  delivery_channel text    not null,
  week_start_local date    not null,
  status           text    not null,
  attempted_count  integer not null default 0,
  sent_count       integer not null default 0,
  failed_count     integer not null default 0,
  sent_at          timestamptz null,
  result_json      jsonb   not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint reminder_deliveries_reminder_type_check
    check (reminder_type in ('weekly_experience_recall')),
  constraint reminder_deliveries_delivery_channel_check
    check (delivery_channel in ('web_push')),
  constraint reminder_deliveries_status_check
    check (status in ('processing', 'sent', 'failed')),
  constraint reminder_deliveries_unique_per_week
    unique (user_id, reminder_type, delivery_channel, week_start_local)
);

-- INDEX
create index if not exists reminder_deliveries_user_week_idx
  on public.reminder_deliveries (user_id, week_start_local);

-- RLS
alter table public.reminder_deliveries enable row level security;

create policy "owner_select_reminder_deliveries"
  on public.reminder_deliveries
  for select
  using (auth.uid() = user_id);

-- TRIGGER: updated_at
-- Reuses the existing set_updated_at() function.
create trigger set_reminder_deliveries_updated_at
  before update on public.reminder_deliveries
  for each row
  execute function public.set_updated_at();
