-- Kakao Alimtalk RPC split readiness foundation.
--
-- This migration only updates RPC definitions and the masked summary shape.
-- It does not seed capabilities, write data, clean up stale rows, call
-- providers, send messages, or add authenticated direct base-table policies.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

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
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = '28000';
  end if;

  raise exception 'KAKAO_ALIMTALK_CONSENT_RPC_DEPRECATED'
    using errcode = '0A000',
          hint = 'Use split contact-only and consent-only RPCs. This path no longer creates placeholder contact or bundled consent.';
end;
$$;

comment on function public.upsert_current_person_kakao_alimtalk_consent(
  scheduler_consent_status,
  text,
  jsonb
) is 'Deprecated safe-blocked Kakao Alimtalk bundled write RPC. It no longer creates placeholder contact or bundled consent.';

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

create or replace function public.upsert_current_person_contact_consent(
  p_channel scheduler_notification_channel,
  p_destination text,
  p_consent_type text default 'reminder',
  p_consent_status scheduler_consent_status default 'granted',
  p_is_primary boolean default true,
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
  masked_destination text,
  is_primary boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_person_ids uuid[];
  v_person_id uuid;
  v_contact_type scheduler_contact_type;
  v_destination text;
  v_destination_hash text;
  v_masked_destination text;
  v_contact_point_id uuid;
  v_consent_id uuid;
  v_metadata jsonb;
  v_copy_version text;
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

  if p_channel = 'sms' then
    v_contact_type := 'phone';
    v_destination := regexp_replace(btrim(coalesce(p_destination, '')), '[^0-9+]', '', 'g');
  elsif p_channel = 'email' then
    v_contact_type := 'email';
    v_destination := lower(btrim(coalesce(p_destination, '')));
  elsif p_channel = 'kakao_alimtalk' then
    raise exception 'KAKAO_ALIMTALK_CONTACT_CONSENT_WRITE_UNSUPPORTED'
      using errcode = '0A000',
            hint = 'Use split contact-only and consent-only RPCs. Kakao Alimtalk bundled contact/consent writes are blocked.';
  else
    raise exception 'UNSUPPORTED_CONTACT_CHANNEL'
      using errcode = '22023';
  end if;

  if v_destination = '' then
    raise exception 'DESTINATION_REQUIRED'
      using errcode = '22023';
  end if;

  if p_consent_type is null or btrim(p_consent_type) = '' then
    raise exception 'CONSENT_TYPE_REQUIRED'
      using errcode = '22023';
  end if;

  v_metadata := coalesce(p_metadata, '{}'::jsonb)
    || jsonb_build_object(
      'write_path', 'upsert_current_person_contact_consent',
      'raw_destination_stored', false
    );
  v_copy_version := coalesce(nullif(v_metadata->>'copy_version', ''), 'scheduler-v2-contact-consent-20260612');
  v_destination_hash := encode(extensions.digest(v_destination, 'sha256'), 'hex');

  if v_contact_type = 'phone' then
    v_masked_destination := case
      when length(v_destination) <= 4 then repeat('*', length(v_destination))
      else repeat('*', greatest(length(v_destination) - 4, 0)) || right(v_destination, 4)
    end;
  else
    v_masked_destination := regexp_replace(v_destination, '(^.).*(@.*$)', '\1***\2');
  end if;

  select cp.id into v_contact_point_id
  from public.contact_points cp
  where cp.person_id = v_person_id
    and cp.type = v_contact_type
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
      v_contact_type,
      v_destination_hash,
      v_destination_hash,
      v_masked_destination,
      'active',
      coalesce(p_is_primary, false),
      v_metadata
    )
    returning id into v_contact_point_id;
  else
    update public.contact_points cp
    set value_normalized = v_destination_hash,
        destination_hash = v_destination_hash,
        masked_destination = v_masked_destination,
        status = 'active',
        is_primary = coalesce(p_is_primary, cp.is_primary),
        metadata = v_metadata,
        updated_at = now()
    where cp.id = v_contact_point_id;
  end if;

  if coalesce(p_is_primary, false) then
    update public.contact_points cp
    set is_primary = false,
        updated_at = now()
    where cp.person_id = v_person_id
      and cp.type = v_contact_type
      and cp.id <> v_contact_point_id;
  end if;

  select nc.id into v_consent_id
  from public.notification_consents nc
  where nc.person_id = v_person_id
    and nc.channel = p_channel
    and nc.consent_type = btrim(p_consent_type)
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
      btrim(p_consent_type),
      p_channel,
      p_consent_status,
      v_copy_version,
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
        copy_version = v_copy_version,
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
    cp.masked_destination,
    cp.is_primary
  from public.contact_points cp
  join public.notification_consents nc on nc.id = v_consent_id
  where cp.id = v_contact_point_id;
end;
$$;

comment on function public.upsert_current_person_contact_consent(
  scheduler_notification_channel,
  text,
  text,
  scheduler_consent_status,
  boolean,
  jsonb
) is 'Authenticated scheduler v2 SMS/email contact/consent write RPC. Kakao Alimtalk bundled writes are blocked and must use split RPCs.';

revoke all on function public.upsert_current_person_contact_consent(
  scheduler_notification_channel,
  text,
  text,
  scheduler_consent_status,
  boolean,
  jsonb
) from public;

revoke all on function public.upsert_current_person_contact_consent(
  scheduler_notification_channel,
  text,
  text,
  scheduler_consent_status,
  boolean,
  jsonb
) from anon;

grant execute on function public.upsert_current_person_contact_consent(
  scheduler_notification_channel,
  text,
  text,
  scheduler_consent_status,
  boolean,
  jsonb
) to authenticated;

create or replace function public.upsert_current_person_notification_consent(
  p_channel scheduler_notification_channel,
  p_consent_type text default 'reminder',
  p_consent_status scheduler_consent_status default 'granted',
  p_copy_version text default 'notification-consent-20260616',
  p_source text default 'reminder_settings_panel',
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  consent_id uuid,
  person_id uuid,
  channel text,
  consent_type text,
  consent_status text,
  copy_version text,
  source text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_person_ids uuid[];
  v_person_id uuid;
  v_consent_id uuid;
  v_consent_type text;
  v_copy_version text;
  v_source text;
  v_metadata jsonb;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = '28000';
  end if;

  if p_channel is null then
    raise exception 'CHANNEL_REQUIRED'
      using errcode = '22023';
  end if;

  v_consent_type := btrim(coalesce(p_consent_type, ''));
  if v_consent_type = '' then
    raise exception 'CONSENT_TYPE_REQUIRED'
      using errcode = '22023';
  end if;

  v_copy_version := coalesce(nullif(btrim(p_copy_version), ''), 'notification-consent-20260616');
  v_source := coalesce(nullif(btrim(p_source), ''), 'reminder_settings_panel');
  v_metadata := coalesce(p_metadata, '{}'::jsonb)
    || jsonb_build_object(
      'write_path', 'upsert_current_person_notification_consent',
      'contact_created', false,
      'raw_destination_stored', false
    );

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

  select nc.id into v_consent_id
  from public.notification_consents nc
  where nc.person_id = v_person_id
    and nc.channel = p_channel
    and nc.consent_type = v_consent_type
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
      null,
      v_consent_type,
      p_channel,
      p_consent_status,
      v_copy_version,
      v_source,
      case when p_consent_status = 'granted' then now() else null end,
      case when p_consent_status = 'revoked' then now() else null end,
      v_metadata,
      now()
    )
    returning id into v_consent_id;
  else
    update public.notification_consents nc
    set status = p_consent_status,
        copy_version = v_copy_version,
        source = v_source,
        granted_at = case when p_consent_status = 'granted' then coalesce(nc.granted_at, now()) else nc.granted_at end,
        revoked_at = case when p_consent_status = 'revoked' then now() else null end,
        metadata = v_metadata,
        updated_at = now()
    where nc.id = v_consent_id;
  end if;

  return query
  select
    nc.id as consent_id,
    nc.person_id,
    nc.channel::text as channel,
    nc.consent_type,
    nc.status::text as consent_status,
    nc.copy_version,
    nc.source
  from public.notification_consents nc
  where nc.id = v_consent_id;
end;
$$;

comment on function public.upsert_current_person_notification_consent(
  scheduler_notification_channel,
  text,
  scheduler_consent_status,
  text,
  text,
  jsonb
) is 'Authenticated consent-only notification RPC. It does not create or verify contact points.';

revoke all on function public.upsert_current_person_notification_consent(
  scheduler_notification_channel,
  text,
  scheduler_consent_status,
  text,
  text,
  jsonb
) from public;

revoke all on function public.upsert_current_person_notification_consent(
  scheduler_notification_channel,
  text,
  scheduler_consent_status,
  text,
  text,
  jsonb
) from anon;

grant execute on function public.upsert_current_person_notification_consent(
  scheduler_notification_channel,
  text,
  scheduler_consent_status,
  text,
  text,
  jsonb
) to authenticated;

create or replace function public.upsert_current_person_phone_contact(
  p_phone text,
  p_is_primary boolean default true,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  contact_point_id uuid,
  person_id uuid,
  contact_type text,
  contact_status text,
  masked_destination text,
  is_primary boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_person_ids uuid[];
  v_person_id uuid;
  v_destination text;
  v_destination_hash text;
  v_masked_destination text;
  v_contact_point_id uuid;
  v_metadata jsonb;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = '28000';
  end if;

  v_destination := regexp_replace(btrim(coalesce(p_phone, '')), '[^0-9+]', '', 'g');
  if length(v_destination) < 8 then
    raise exception 'PHONE_REQUIRED'
      using errcode = '22023';
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
  v_destination_hash := encode(extensions.digest(v_destination, 'sha256'), 'hex');
  v_masked_destination := case
    when length(v_destination) <= 4 then repeat('*', length(v_destination))
    else repeat('*', greatest(length(v_destination) - 4, 0)) || right(v_destination, 4)
  end;
  v_metadata := coalesce(p_metadata, '{}'::jsonb)
    || jsonb_build_object(
      'write_path', 'upsert_current_person_phone_contact',
      'verification_created', false,
      'consent_created', false,
      'raw_destination_stored', false
    );

  select cp.id into v_contact_point_id
  from public.contact_points cp
  where cp.person_id = v_person_id
    and cp.type = 'phone'
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
      'phone',
      v_destination_hash,
      v_destination_hash,
      v_masked_destination,
      'active',
      coalesce(p_is_primary, false),
      v_metadata
    )
    returning id into v_contact_point_id;
  else
    update public.contact_points cp
    set value_normalized = v_destination_hash,
        destination_hash = v_destination_hash,
        masked_destination = v_masked_destination,
        status = 'active',
        is_primary = coalesce(p_is_primary, cp.is_primary),
        metadata = v_metadata,
        updated_at = now()
    where cp.id = v_contact_point_id;
  end if;

  if coalesce(p_is_primary, false) then
    update public.contact_points cp
    set is_primary = false,
        updated_at = now()
    where cp.person_id = v_person_id
      and cp.type = 'phone'
      and cp.id <> v_contact_point_id;
  end if;

  return query
  select
    cp.id as contact_point_id,
    cp.person_id,
    cp.type::text as contact_type,
    cp.status::text as contact_status,
    cp.masked_destination,
    cp.is_primary
  from public.contact_points cp
  where cp.id = v_contact_point_id;
end;
$$;

comment on function public.upsert_current_person_phone_contact(
  text,
  boolean,
  jsonb
) is 'Authenticated phone contact-only RPC. It stores masked/hash contact data and does not create consent or verification rows.';

revoke all on function public.upsert_current_person_phone_contact(
  text,
  boolean,
  jsonb
) from public;

revoke all on function public.upsert_current_person_phone_contact(
  text,
  boolean,
  jsonb
) from anon;

grant execute on function public.upsert_current_person_phone_contact(
  text,
  boolean,
  jsonb
) to authenticated;

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
      'contact_basis', kakao_state.contact_basis,
      'contact_verified', kakao_state.contact_verified,
      'consent', kakao_state.consent,
      'capability', coalesce(kakao_state.capability_status, 'missing'),
      'send_eligibility', case
        when kakao_state.identity = 'blocked'
          or kakao_state.contact = 'blocked'
          or kakao_state.consent = 'revoked'
          or kakao_state.capability_status = 'blocked'
        then 'blocked'
        when kakao_state.identity = 'active'
          and kakao_state.contact_basis in ('verified_phone', 'provider_recipient')
          and kakao_state.contact_verified
          and kakao_state.consent = 'granted'
          and kakao_state.capability_status = 'ready'
        then 'ready'
        when kakao_state.identity in ('missing', 'active')
          or kakao_state.contact in ('missing', 'active')
          or kakao_state.contact_basis in ('missing', 'placeholder', 'unknown')
          or not kakao_state.contact_verified
          or kakao_state.consent in ('missing', 'granted')
          or kakao_state.capability_status is null
          or kakao_state.capability_status = 'not_ready'
        then 'not_ready'
        else 'unknown'
      end
    ) as kakao
  from public.persons p
  join public.current_person_ids() c(person_id) on c.person_id = p.id
  cross join lateral (
    select
      exists (
        select 1
        from public.account_identities ai
        where ai.person_id = p.id
          and ai.provider = 'kakao'
          and (
            ai.status in ('unlinked', 'conflict')
            or ai.unlinked_at is not null
          )
      ) as identity_blocked,
      exists (
        select 1
        from public.account_identities ai
        where ai.person_id = p.id
          and ai.provider = 'kakao'
          and ai.status = 'active'
          and ai.unlinked_at is null
      ) as identity_active,
      exists (
        select 1
        from public.contact_points cp
        where cp.person_id = p.id
          and cp.type = 'kakao_alimtalk'
          and cp.status in ('disabled', 'revoked')
      ) as kakao_contact_blocked,
      exists (
        select 1
        from public.contact_points cp
        join public.contact_verifications cv on cv.contact_point_id = cp.id
        where cp.person_id = p.id
          and cp.type = 'phone'
          and cp.status = 'active'
          and cv.status = 'verified'
          and cv.verified_at is not null
      ) as verified_phone_contact,
      exists (
        select 1
        from public.contact_points cp
        where cp.person_id = p.id
          and cp.type = 'kakao_alimtalk'
          and cp.status = 'active'
          and coalesce(cp.metadata, '{}'::jsonb)->>'placeholder_contact' is distinct from 'true'
          and (
            coalesce(cp.metadata, '{}'::jsonb)->>'contact_basis' = 'provider_recipient'
            or coalesce(cp.metadata, '{}'::jsonb)->>'basis' = 'provider_recipient'
            or coalesce(cp.metadata, '{}'::jsonb) ? 'provider_recipient_provenance'
          )
      ) as provider_recipient_contact,
      exists (
        select 1
        from public.contact_points cp
        where cp.person_id = p.id
          and cp.type = 'kakao_alimtalk'
          and cp.status = 'active'
          and not (
            coalesce(cp.metadata, '{}'::jsonb)->>'placeholder_contact' is distinct from 'true'
            and (
              coalesce(cp.metadata, '{}'::jsonb)->>'contact_basis' = 'provider_recipient'
              or coalesce(cp.metadata, '{}'::jsonb)->>'basis' = 'provider_recipient'
              or coalesce(cp.metadata, '{}'::jsonb) ? 'provider_recipient_provenance'
            )
          )
      ) as placeholder_kakao_contact,
      exists (
        select 1
        from public.notification_consents nc
        where nc.person_id = p.id
          and nc.channel = 'kakao_alimtalk'
          and nc.consent_type = 'reminder'
          and nc.status = 'revoked'
      ) as consent_revoked,
      exists (
        select 1
        from public.notification_consents nc
        where nc.person_id = p.id
          and nc.channel = 'kakao_alimtalk'
          and nc.consent_type = 'reminder'
          and nc.status = 'granted'
      ) as consent_granted,
      case
        when exists (
          select 1
          from public.notification_channel_capabilities ncc
          where ncc.channel = 'kakao_alimtalk'
            and ncc.capability = 'reminder_send'
            and ncc.status = 'blocked'
        ) then 'blocked'
        when exists (
          select 1
          from public.notification_channel_capabilities ncc
          where ncc.channel = 'kakao_alimtalk'
            and ncc.capability = 'reminder_send'
            and ncc.status = 'ready'
        ) then 'ready'
        when exists (
          select 1
          from public.notification_channel_capabilities ncc
          where ncc.channel = 'kakao_alimtalk'
            and ncc.capability = 'reminder_send'
            and ncc.status = 'not_ready'
        ) then 'not_ready'
        else null
      end as capability_status
  ) kakao_signals
  cross join lateral (
    select
      case
        when kakao_signals.identity_blocked then 'blocked'
        when kakao_signals.identity_active then 'active'
        else 'missing'
      end as identity,
      case
        when kakao_signals.kakao_contact_blocked then 'blocked'
        when kakao_signals.provider_recipient_contact
          or kakao_signals.verified_phone_contact
          or kakao_signals.placeholder_kakao_contact
        then 'active'
        else 'missing'
      end as contact,
      case
        when kakao_signals.provider_recipient_contact then 'provider_recipient'
        when kakao_signals.verified_phone_contact then 'verified_phone'
        when kakao_signals.placeholder_kakao_contact then 'placeholder'
        when kakao_signals.kakao_contact_blocked then 'unknown'
        else 'missing'
      end as contact_basis,
      (kakao_signals.provider_recipient_contact or kakao_signals.verified_phone_contact) as contact_verified,
      case
        when kakao_signals.consent_revoked then 'revoked'
        when kakao_signals.consent_granted then 'granted'
        else 'missing'
      end as consent,
      kakao_signals.capability_status
  ) kakao_state
  where p.status = 'active';
$$;

comment on function public.get_current_person_notification_summary()
is 'Authenticated masked scheduler v2 notification summary. Includes normalized Kakao Alimtalk identity, contact basis, verification, consent, capability, and five-condition send eligibility while excluding raw identifiers, provider secrets, destinations, hashes, and Web Push secrets.';

revoke all on function public.get_current_person_notification_summary() from public;
revoke all on function public.get_current_person_notification_summary() from anon;
grant execute on function public.get_current_person_notification_summary() to authenticated;
