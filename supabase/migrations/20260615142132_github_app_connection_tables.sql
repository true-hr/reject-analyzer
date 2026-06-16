-- GitHub App connection DB foundation.
-- Migration-only: no OAuth/App callback, token exchange, UI, API route, env,
-- package, scheduler, Kakao, Push, OpenAI, or manual import behavior changes.
-- Do not store GitHub access tokens, raw PR payloads, full diffs, or patches.
-- GitHub connection rows are repository-access metadata only and must not be
-- used for account merge.

create table if not exists public.github_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  github_account_id bigint not null,
  github_login text not null,
  github_account_type text not null,
  installation_id bigint,
  connection_type text not null default 'github_app',
  granted_permissions jsonb not null default '{}'::jsonb,
  granted_events jsonb not null default '[]'::jsonb,
  status text not null default 'connected',
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint github_connections_connection_type_check
    check (connection_type in ('github_app', 'oauth_app')),
  constraint github_connections_status_check
    check (status in ('connected', 'disconnected', 'revoked', 'error')),
  constraint github_connections_github_login_check
    check (btrim(github_login) <> ''),
  constraint github_connections_github_account_type_check
    check (btrim(github_account_type) <> ''),
  constraint github_connections_granted_permissions_object_check
    check (jsonb_typeof(granted_permissions) = 'object'),
  constraint github_connections_granted_events_array_check
    check (jsonb_typeof(granted_events) = 'array'),
  constraint github_connections_id_user_id_key
    unique (id, user_id)
);

comment on table public.github_connections
is 'PASSMAP user-owned GitHub connection metadata. Stores no GitHub access tokens and must not be used for account merge.';

comment on column public.github_connections.user_id
is 'Supabase Auth user id. Future server writes must derive this from a verified Supabase session, never from client payload.';

comment on column public.github_connections.granted_permissions
is 'GitHub App/OAuth permission snapshot only. Do not store tokens, secrets, raw PR payloads, full diffs, or patches.';

comment on column public.github_connections.granted_events
is 'GitHub App event subscription snapshot only. Do not store webhook secrets or raw webhook payloads.';

create table if not exists public.github_repository_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null,
  github_repo_id bigint not null,
  owner text not null,
  name text not null,
  full_name text not null,
  private boolean not null default false,
  selected boolean not null default false,
  permission_snapshot jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  last_imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint github_repository_access_connection_user_fkey
    foreign key (connection_id, user_id)
    references public.github_connections(id, user_id)
    on delete cascade,
  constraint github_repository_access_connection_repo_key
    unique (connection_id, github_repo_id),
  constraint github_repository_access_owner_check
    check (btrim(owner) <> ''),
  constraint github_repository_access_name_check
    check (btrim(name) <> ''),
  constraint github_repository_access_full_name_check
    check (btrim(full_name) <> ''),
  constraint github_repository_access_permission_snapshot_object_check
    check (jsonb_typeof(permission_snapshot) = 'object')
);

comment on table public.github_repository_access
is 'User-owned GitHub repository access, selection, and verification snapshots for a GitHub connection.';

comment on column public.github_repository_access.user_id
is 'Supabase Auth user id. Future server writes must derive this from a verified Supabase session, never from client payload.';

comment on column public.github_repository_access.permission_snapshot
is 'Repository access snapshot captured after server-side verification. Do not store tokens, raw PR payloads, full diffs, or patches.';

alter table public.github_connections enable row level security;
alter table public.github_repository_access enable row level security;

create policy service_role_manage_github_connections
  on public.github_connections
  for all
  to service_role
  using (true)
  with check (true);

create policy service_role_manage_github_repository_access
  on public.github_repository_access
  for all
  to service_role
  using (true)
  with check (true);

create policy authenticated_select_own_github_connections
  on public.github_connections
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy authenticated_insert_own_github_connections
  on public.github_connections
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy authenticated_update_own_github_connections
  on public.github_connections
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy authenticated_delete_own_github_connections
  on public.github_connections
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy authenticated_select_own_github_repository_access
  on public.github_repository_access
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy authenticated_insert_own_github_repository_access
  on public.github_repository_access
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.github_connections gc
      where gc.id = connection_id
        and gc.user_id = (select auth.uid())
    )
  );

create policy authenticated_update_own_github_repository_access
  on public.github_repository_access
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.github_connections gc
      where gc.id = connection_id
        and gc.user_id = (select auth.uid())
    )
  );

create policy authenticated_delete_own_github_repository_access
  on public.github_repository_access
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.github_connections from public;
revoke all on table public.github_connections from anon;
revoke all on table public.github_repository_access from public;
revoke all on table public.github_repository_access from anon;

grant select, insert, update, delete on table public.github_connections to authenticated;
grant select, insert, update, delete on table public.github_repository_access to authenticated;
grant all on table public.github_connections to service_role;
grant all on table public.github_repository_access to service_role;

create unique index if not exists github_connections_active_user_account_install_key
  on public.github_connections (user_id, github_account_id, coalesce(installation_id, 0))
  where status = 'connected';

create index if not exists github_connections_user_id_idx
  on public.github_connections (user_id);

create index if not exists github_connections_github_account_id_idx
  on public.github_connections (github_account_id);

create index if not exists github_connections_installation_id_idx
  on public.github_connections (installation_id)
  where installation_id is not null;

create index if not exists github_connections_status_idx
  on public.github_connections (status);

create index if not exists github_repository_access_user_id_idx
  on public.github_repository_access (user_id);

create index if not exists github_repository_access_connection_id_idx
  on public.github_repository_access (connection_id);

create index if not exists github_repository_access_github_repo_id_idx
  on public.github_repository_access (github_repo_id);

create index if not exists github_repository_access_full_name_idx
  on public.github_repository_access (full_name);

create index if not exists github_repository_access_selected_idx
  on public.github_repository_access (selected)
  where selected = true;
