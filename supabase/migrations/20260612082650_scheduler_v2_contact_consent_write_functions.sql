-- Scheduler v2 contact/consent write function draft.
-- Draft only: do not apply to production/staging before separate review.
-- This keeps Kakao/SMS contact and consent writes behind an authenticated RPC
-- and does not add raw base table client read/write policies.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

alter table public.contact_points
  add column if not exists destination_hash text,
  add column if not exists masked_destination text,
  add column if not exists is_primary boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.notification_consents
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists contact_points_person_type_hash_idx
  on public.contact_points (person_id, type, destination_hash);

create index if not exists notification_consents_person_channel_type_updated_idx
  on public.notification_consents (person_id, channel, consent_type, updated_at desc);

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
    v_contact_type := 'kakao_alimtalk';
    v_destination := lower(btrim(coalesce(p_destination, '')));
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
  elsif v_contact_type = 'email' then
    v_masked_destination := regexp_replace(v_destination, '(^.).*(@.*$)', '\1***\2');
  else
    v_masked_destination := '카카오 알림톡 준비됨';
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
) is 'Authenticated scheduler v2 contact/consent write RPC. Uses current_person_ids(), stores hashed destination values, and does not expose raw base table client writes.';

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
