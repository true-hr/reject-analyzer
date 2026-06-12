-- Kakao summary shape and Alimtalk consent RPC draft.
-- Disposable verification only: do not apply to production/staging without a
-- separate promotion review. No Kakao API calls, OAuth implementation, live
-- sends, provider sends, or raw base table client policies are included.

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
      'identity', case
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
      end,
      'contact', case
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
      end,
      'consent', case
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
      end,
      'send_eligibility', 'not_ready'
    ) as kakao
  from public.persons p
  join public.current_person_ids() c(person_id) on c.person_id = p.id
  where p.status = 'active';
$$;

comment on function public.get_current_person_notification_summary()
is 'Authenticated masked scheduler v2 notification summary. Includes normalized Kakao Alimtalk state and excludes raw identifiers, destinations, hashes, and Web Push secrets.';

revoke all on function public.get_current_person_notification_summary() from public;
revoke all on function public.get_current_person_notification_summary() from anon;
grant execute on function public.get_current_person_notification_summary() to authenticated;

create or replace function public.upsert_current_person_kakao_alimtalk_consent(
  p_consent_status scheduler_consent_status default 'granted',
  p_copy_version text default 'kakao-alimtalk-consent-20260612',
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  contact_point_id uuid,
  consent_id uuid,
  person_id uuid,
  channel text,
  contact_type text,
  contact_status text,
  consent_type text,
  consent_status text,
  masked_destination text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_person_ids uuid[];
  v_person_id uuid;
  v_contact_point_id uuid;
  v_consent_id uuid;
  v_destination_ref text := 'kakao-alimtalk-placeholder';
  v_destination_hash text;
  v_masked_destination text := 'Kakao Alimtalk ready';
  v_metadata jsonb;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = '28000';
  end if;

  select coalesce(array_agg(c.person_id order by c.person_id), '{}') into v_person_ids
  from public.current_person_ids() c(person_id);

  if array_length(v_person_ids, 1) is null then
    raise exception 'PERSON_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if array_length(v_person_ids, 1) <> 1 then
    raise exception 'AMBIGUOUS_PERSON'
      using errcode = 'P0001';
  end if;

  v_person_id := v_person_ids[1];

  if not exists (
    select 1
    from public.account_identities ai
    where ai.person_id = v_person_id
      and ai.provider = 'kakao'
      and ai.status = 'active'
      and ai.unlinked_at is null
  ) then
    raise exception 'KAKAO_IDENTITY_REQUIRED'
      using errcode = 'P0001';
  end if;

  v_destination_hash := encode(extensions.digest(v_destination_ref, 'sha256'), 'hex');
  v_metadata := coalesce(p_metadata, '{}'::jsonb)
    || jsonb_build_object(
      'write_path', 'upsert_current_person_kakao_alimtalk_consent',
      'placeholder_contact', true,
      'raw_destination_stored', false,
      'provider_user_id_stored', false
    );

  select cp.id into v_contact_point_id
  from public.contact_points cp
  where cp.person_id = v_person_id
    and cp.type = 'kakao_alimtalk'
    and cp.destination_hash = v_destination_hash
  order by cp.updated_at desc, cp.created_at desc, cp.id
  limit 1;

  if v_contact_point_id is null then
    insert into public.contact_points (
      person_id,
      type,
      value_normalized,
      destination_hash,
      masked_destination,
      status,
      is_primary,
      metadata
    )
    values (
      v_person_id,
      'kakao_alimtalk',
      v_destination_hash,
      v_destination_hash,
      v_masked_destination,
      'active',
      true,
      v_metadata
    )
    returning id into v_contact_point_id;
  else
    update public.contact_points cp
    set value_normalized = v_destination_hash,
        destination_hash = v_destination_hash,
        masked_destination = v_masked_destination,
        status = 'active',
        is_primary = true,
        metadata = v_metadata,
        updated_at = now()
    where cp.id = v_contact_point_id;
  end if;

  update public.contact_points cp
  set is_primary = false,
      updated_at = now()
  where cp.person_id = v_person_id
    and cp.type = 'kakao_alimtalk'
    and cp.id <> v_contact_point_id;

  select nc.id into v_consent_id
  from public.notification_consents nc
  where nc.person_id = v_person_id
    and nc.channel = 'kakao_alimtalk'
    and nc.consent_type = 'reminder'
  order by nc.updated_at desc, nc.created_at desc, nc.id
  limit 1;

  if v_consent_id is null then
    insert into public.notification_consents (
      person_id,
      contact_point_id,
      consent_type,
      channel,
      status,
      copy_version,
      source,
      granted_at,
      revoked_at,
      metadata,
      updated_at
    )
    values (
      v_person_id,
      v_contact_point_id,
      'reminder',
      'kakao_alimtalk',
      p_consent_status,
      coalesce(nullif(btrim(p_copy_version), ''), 'kakao-alimtalk-consent-20260612'),
      'reminder_settings_panel',
      case when p_consent_status = 'granted' then now() else null end,
      case when p_consent_status = 'revoked' then now() else null end,
      v_metadata,
      now()
    )
    returning id into v_consent_id;
  else
    update public.notification_consents nc
    set contact_point_id = v_contact_point_id,
        status = p_consent_status,
        copy_version = coalesce(nullif(btrim(p_copy_version), ''), 'kakao-alimtalk-consent-20260612'),
        source = 'reminder_settings_panel',
        granted_at = case when p_consent_status = 'granted' then coalesce(nc.granted_at, now()) else nc.granted_at end,
        revoked_at = case when p_consent_status = 'revoked' then now() else null end,
        metadata = v_metadata,
        updated_at = now()
    where nc.id = v_consent_id;
  end if;

  return query
  select
    cp.id as contact_point_id,
    nc.id as consent_id,
    cp.person_id,
    nc.channel::text as channel,
    cp.type::text as contact_type,
    cp.status::text as contact_status,
    nc.consent_type,
    nc.status::text as consent_status,
    cp.masked_destination
  from public.contact_points cp
  join public.notification_consents nc on nc.id = v_consent_id
  where cp.id = v_contact_point_id;
end;
$$;

comment on function public.upsert_current_person_kakao_alimtalk_consent(
  scheduler_consent_status,
  text,
  jsonb
) is 'Authenticated Kakao Alimtalk consent preparation RPC. Requires active Kakao identity, stores placeholder contact/consent only, and does not call Kakao APIs or return raw provider identifiers.';

revoke all on function public.upsert_current_person_kakao_alimtalk_consent(
  scheduler_consent_status,
  text,
  jsonb
) from public;

revoke all on function public.upsert_current_person_kakao_alimtalk_consent(
  scheduler_consent_status,
  text,
  jsonb
) from anon;

grant execute on function public.upsert_current_person_kakao_alimtalk_consent(
  scheduler_consent_status,
  text,
  jsonb
) to authenticated;
