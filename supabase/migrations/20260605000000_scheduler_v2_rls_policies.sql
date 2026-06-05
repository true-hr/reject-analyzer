-- Scheduler v2 notification RLS policy draft.
-- Draft only: do not apply to disposable/staging/production before separate review and approval.
-- This migration intentionally does not depend on the disposable DB ensure_rls event trigger.
-- It makes RLS enablement explicit and drafts the initial service/client access boundary.

-- Explicit RLS enablement for scheduler v2 tables.
alter table public.persons enable row level security;
alter table public.account_identities enable row level security;
alter table public.contact_points enable row level security;
alter table public.contact_verifications enable row level security;
alter table public.notification_consents enable row level security;
alter table public.reminder_rules enable row level security;
alter table public.reminder_channels enable row level security;
alter table public.web_push_subscription_owners enable row level security;
alter table public.notification_delivery_claims enable row level security;
alter table public.notification_delivery_logs enable row level security;

-- Auth membership helpers.
-- Membership must use account_identities.auth_user_id = auth.uid().
-- Do not use account_identities.provider_user_id = auth.uid()::text,
-- provider email, phone, display name, contact destination, or Web Push data
-- as person membership keys.
create or replace function public.current_person_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select ai.person_id
  from public.account_identities ai
  join public.persons p on p.id = ai.person_id
  where auth.uid() is not null
    and ai.auth_user_id = auth.uid()
    and ai.status = 'active'
    and ai.unlinked_at is null
    and p.status = 'active';
$$;

create or replace function public.is_member_of_person(target_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select target_person_id is not null
    and exists (
      select 1
      from public.current_person_ids() p(person_id)
      where p.person_id = target_person_id
    );
$$;

revoke all on function public.current_person_ids() from public;
revoke all on function public.is_member_of_person(uuid) from public;

grant execute on function public.current_person_ids() to authenticated;
grant execute on function public.is_member_of_person(uuid) to authenticated;

-- Service role management policies.
-- Supabase service_role normally bypasses RLS. These policies still document
-- the intended server-side ownership boundary explicitly for non-forced RLS.
create policy service_role_manage_persons
  on public.persons
  for all
  to service_role
  using (true)
  with check (true);

create policy service_role_manage_account_identities
  on public.account_identities
  for all
  to service_role
  using (true)
  with check (true);

create policy service_role_manage_contact_points
  on public.contact_points
  for all
  to service_role
  using (true)
  with check (true);

create policy service_role_manage_contact_verifications
  on public.contact_verifications
  for all
  to service_role
  using (true)
  with check (true);

create policy service_role_manage_notification_consents
  on public.notification_consents
  for all
  to service_role
  using (true)
  with check (true);

create policy service_role_manage_reminder_rules
  on public.reminder_rules
  for all
  to service_role
  using (true)
  with check (true);

create policy service_role_manage_reminder_channels
  on public.reminder_channels
  for all
  to service_role
  using (true)
  with check (true);

create policy service_role_manage_web_push_subscription_owners
  on public.web_push_subscription_owners
  for all
  to service_role
  using (true)
  with check (true);

create policy service_role_manage_notification_delivery_claims
  on public.notification_delivery_claims
  for all
  to service_role
  using (true)
  with check (true);

create policy service_role_manage_notification_delivery_logs
  on public.notification_delivery_logs
  for all
  to service_role
  using (true)
  with check (true);

-- Authenticated client direct table read policies are intentionally deferred.
-- Client access starts through the masked summary function below. Raw base
-- tables remain closed to authenticated clients in this draft.

-- No authenticated direct policies are drafted for these base tables:
-- - account_identities: provider_user_id/email may be sensitive.
-- - contact_points: value_normalized may contain phone/email destinations.
-- - contact_verifications: service-role-only verification surface.
-- - web_push_subscription_owners: endpoint_hash/auth_user_id/subscription_id should be summarized.
-- - notification_delivery_claims: service-role-only idempotency surface.
-- - notification_delivery_logs: service-role-only audit surface.

-- Masked authenticated client summary.
-- This function exposes coarse notification settings only. It intentionally
-- excludes raw email, phone, provider_user_id, auth_user_id, endpoint,
-- p256dh, auth secret, full destination, delivery claims, and delivery logs.
create or replace function public.get_current_person_notification_summary()
returns table (
  person_id uuid,
  person_status text,
  providers jsonb,
  contact_channels jsonb,
  consents jsonb,
  reminder_rules jsonb,
  web_push jsonb
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p.id as person_id,
    p.status::text as person_status,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'provider', ai.provider::text,
            'status', ai.status::text
          )
          order by ai.provider::text
        )
        from public.account_identities ai
        where ai.person_id = p.id
          and ai.status = 'active'
          and ai.unlinked_at is null
      ),
      '[]'::jsonb
    ) as providers,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'channel', cp_summary.type::text,
            'status', cp_summary.status::text,
            'count', cp_summary.channel_count
          )
          order by cp_summary.type::text, cp_summary.status::text
        )
        from (
          select cp.type, cp.status, count(*)::integer as channel_count
          from public.contact_points cp
          where cp.person_id = p.id
          group by cp.type, cp.status
        ) cp_summary
      ),
      '[]'::jsonb
    ) as contact_channels,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'channel', nc_summary.channel::text,
            'consent_type', nc_summary.consent_type,
            'status', nc_summary.status::text,
            'count', nc_summary.consent_count
          )
          order by nc_summary.channel::text, nc_summary.consent_type, nc_summary.status::text
        )
        from (
          select nc.channel, nc.consent_type, nc.status, count(*)::integer as consent_count
          from public.notification_consents nc
          where nc.person_id = p.id
          group by nc.channel, nc.consent_type, nc.status
        ) nc_summary
      ),
      '[]'::jsonb
    ) as consents,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'rule_id', rr.id,
            'reminder_kind', rr.reminder_kind::text,
            'cadence', rr.cadence::text,
            'days_of_week', rr.days_of_week,
            'time_local', rr.time_local,
            'timezone', rr.timezone,
            'is_enabled', rr.is_enabled,
            'skip_policy', rr.skip_policy::text,
            'channels', coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object(
                    'channel', rc.channel::text,
                    'priority', rc.priority,
                    'is_enabled', rc.is_enabled,
                    'fallback_to_channel', rc.fallback_to_channel::text
                  )
                  order by rc.priority, rc.channel::text
                )
                from public.reminder_channels rc
                where rc.rule_id = rr.id
              ),
              '[]'::jsonb
            )
          )
          order by rr.created_at, rr.id
        )
        from public.reminder_rules rr
        where rr.person_id = p.id
          and rr.deleted_at is null
      ),
      '[]'::jsonb
    ) as reminder_rules,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'ownership_status', wpo_summary.ownership_status::text,
            'count', wpo_summary.owner_count
          )
          order by wpo_summary.ownership_status::text
        )
        from (
          select wpo.ownership_status, count(*)::integer as owner_count
          from public.web_push_subscription_owners wpo
          where wpo.person_id = p.id
          group by wpo.ownership_status
        ) wpo_summary
      ),
      '[]'::jsonb
    ) as web_push
  from public.persons p
  join public.current_person_ids() c(person_id) on c.person_id = p.id
  where p.status = 'active';
$$;

revoke all on function public.get_current_person_notification_summary() from public;
grant execute on function public.get_current_person_notification_summary() to authenticated;
