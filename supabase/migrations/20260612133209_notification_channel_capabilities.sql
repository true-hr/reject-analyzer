-- Draft notification channel capability table and Kakao summary readiness.
-- Disposable verification only. No provider secrets, Kakao API calls, live
-- sends, OAuth implementation, or raw base table client policies are included.

create table if not exists public.notification_channel_capabilities (
  id uuid primary key default gen_random_uuid(),
  channel scheduler_notification_channel not null,
  capability text not null,
  status text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint notification_channel_capabilities_capability_check
    check (capability in ('reminder_send')),
  constraint notification_channel_capabilities_status_check
    check (status in ('ready', 'not_ready', 'blocked')),
  constraint notification_channel_capabilities_metadata_object_check
    check (jsonb_typeof(metadata) = 'object'),
  constraint notification_channel_capabilities_channel_capability_key
    unique (channel, capability)
);

comment on table public.notification_channel_capabilities
is 'Coarse notification channel readiness for summary/RPC use. Stores no provider secrets or raw provider subjects.';

comment on column public.notification_channel_capabilities.metadata
is 'Non-secret capability metadata only. Do not store sender keys, profile keys, provider tokens, API keys, webhook secrets, provider subjects, or raw destinations.';

alter table public.notification_channel_capabilities enable row level security;

create policy service_role_manage_notification_channel_capabilities
  on public.notification_channel_capabilities
  for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.notification_channel_capabilities from public;
revoke all on table public.notification_channel_capabilities from anon;
revoke all on table public.notification_channel_capabilities from authenticated;

drop function if exists public.get_current_person_notification_summary();

create or replace function public.get_current_person_notification_summary()
returns table (
  person_id uuid,
  person_status text,
  providers jsonb,
  contact_channels jsonb,
  consents jsonb,
  reminder_rules jsonb,
  web_push jsonb,
  kakao jsonb
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
    ) as web_push,
    jsonb_build_object(
      'identity', kakao_state.identity,
      'contact', kakao_state.contact,
      'consent', kakao_state.consent,
      'send_eligibility', case
        when kakao_state.identity = 'blocked'
          or kakao_state.contact = 'blocked'
          or kakao_state.consent = 'revoked'
        then 'blocked'
        when kakao_state.capability_status = 'blocked' then 'blocked'
        when kakao_state.identity = 'active'
          and kakao_state.contact = 'active'
          and kakao_state.consent = 'granted'
          and kakao_state.capability_status = 'ready'
        then 'ready'
        when kakao_state.capability_status is null
          or kakao_state.capability_status = 'not_ready'
          or kakao_state.identity <> 'active'
          or kakao_state.contact <> 'active'
          or kakao_state.consent <> 'granted'
        then 'not_ready'
        else 'unknown'
      end
    ) as kakao
  from public.persons p
  join public.current_person_ids() c(person_id) on c.person_id = p.id
  cross join lateral (
    select
      case
        when exists (
          select 1
          from public.account_identities ai
          where ai.person_id = p.id
            and ai.provider = 'kakao'
            and (
              ai.status in ('unlinked', 'conflict')
              or ai.unlinked_at is not null
            )
        ) then 'blocked'
        when exists (
          select 1
          from public.account_identities ai
          where ai.person_id = p.id
            and ai.provider = 'kakao'
            and ai.status = 'active'
            and ai.unlinked_at is null
        ) then 'active'
        else 'missing'
      end as identity,
      case
        when exists (
          select 1
          from public.contact_points cp
          where cp.person_id = p.id
            and cp.type = 'kakao_alimtalk'
            and cp.status in ('disabled', 'revoked')
        ) then 'blocked'
        when exists (
          select 1
          from public.contact_points cp
          where cp.person_id = p.id
            and cp.type = 'kakao_alimtalk'
            and cp.status = 'active'
        ) then 'active'
        else 'missing'
      end as contact,
      case
        when exists (
          select 1
          from public.notification_consents nc
          where nc.person_id = p.id
            and nc.channel = 'kakao_alimtalk'
            and nc.consent_type = 'reminder'
            and nc.status = 'revoked'
        ) then 'revoked'
        when exists (
          select 1
          from public.notification_consents nc
          where nc.person_id = p.id
            and nc.channel = 'kakao_alimtalk'
            and nc.consent_type = 'reminder'
            and nc.status = 'granted'
        ) then 'granted'
        else 'missing'
      end as consent,
      (
        select ncc.status
        from public.notification_channel_capabilities ncc
        where ncc.channel = 'kakao_alimtalk'
          and ncc.capability = 'reminder_send'
        limit 1
      ) as capability_status
  ) kakao_state
  where p.status = 'active';
$$;

comment on function public.get_current_person_notification_summary()
is 'Authenticated masked scheduler v2 notification summary. Includes normalized Kakao Alimtalk state and coarse send eligibility while excluding raw identifiers, provider secrets, destinations, hashes, and Web Push secrets.';

revoke all on function public.get_current_person_notification_summary() from public;
revoke all on function public.get_current_person_notification_summary() from anon;
grant execute on function public.get_current_person_notification_summary() to authenticated;
