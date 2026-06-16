-- GitHub connection state foundation.
-- Server-managed one-time state storage for future GitHub App install/callback
-- flows. Stores only a state hash; never stores GitHub tokens, private keys,
-- callback payloads, raw PR payloads, diffs, or patches.

create table if not exists public.github_connection_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state_hash text not null,
  purpose text not null default 'github_app_install',
  status text not null default 'pending',
  return_to text,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint github_connection_states_purpose_check
    check (purpose in ('github_app_install')),
  constraint github_connection_states_status_check
    check (status in ('pending', 'consumed', 'expired', 'cancelled')),
  constraint github_connection_states_expires_after_created_check
    check (expires_at > created_at),
  constraint github_connection_states_consumed_after_created_check
    check (consumed_at is null or consumed_at >= created_at)
);

comment on table public.github_connection_states
is 'Server-managed GitHub App connection state. Stores state_hash only; raw state is returned once by the prepare action and is never persisted.';

comment on column public.github_connection_states.user_id
is 'Supabase Auth user id from a verified server-side session. Never accept this from client payload.';

comment on column public.github_connection_states.state_hash
is 'SHA-256 hash of the one-time GitHub connection state. Raw state must never be stored.';

alter table public.github_connection_states enable row level security;

create policy service_role_manage_github_connection_states
  on public.github_connection_states
  for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.github_connection_states from public;
revoke all on table public.github_connection_states from anon;
revoke all on table public.github_connection_states from authenticated;
grant all on table public.github_connection_states to service_role;

create index if not exists github_connection_states_user_status_expires_idx
  on public.github_connection_states (user_id, status, expires_at);

create unique index if not exists github_connection_states_hash_idx
  on public.github_connection_states (state_hash);
