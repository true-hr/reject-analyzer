-- Scheduler v2 current person bootstrap RPC.
-- Creates the first scheduler v2 person/account_identity rows for the
-- currently authenticated Supabase Auth user when no current person exists.
-- No provider calls, notification consent writes, account merges, or
-- email/name based matching are performed.

create or replace function public.ensure_current_person_auth_identity()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_person_ids uuid[];
  v_person_id uuid;
  v_sync_result jsonb;
  v_result jsonb;
begin
  if v_auth_user_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001';
  end if;

  select coalesce(array_agg(distinct c.person_id order by c.person_id), array[]::uuid[])
    into v_person_ids
  from public.current_person_ids() c(person_id);

  if array_length(v_person_ids, 1) > 1 then
    raise exception 'CURRENT_PERSON_AMBIGUOUS'
      using errcode = 'P0001';
  end if;

  if array_length(v_person_ids, 1) = 1 then
    v_sync_result := public.sync_current_person_auth_identities();
    return jsonb_build_object(
      'bootstrap_status', 'existing_person',
      'providers', coalesce(v_sync_result->'providers', '[]'::jsonb)
    );
  end if;

  if not exists (
    select 1
    from auth.identities i
    where i.user_id = v_auth_user_id
      and i.provider in ('google', 'kakao', 'naver', 'custom:naver', 'email')
      and nullif(i.provider_id, '') is not null
  ) then
    raise exception 'AUTH_IDENTITY_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if exists (
    with linked_auth_identities as (
      select
        case
          when i.provider = 'google' then 'google'::public.scheduler_identity_provider
          when i.provider = 'kakao' then 'kakao'::public.scheduler_identity_provider
          when i.provider in ('naver', 'custom:naver') then 'naver'::public.scheduler_identity_provider
          when i.provider = 'email' then 'email'::public.scheduler_identity_provider
          else null::public.scheduler_identity_provider
        end as provider,
        nullif(i.provider_id, '') as provider_subject
      from auth.identities i
      where i.user_id = v_auth_user_id
    )
    select 1
    from linked_auth_identities lai
    join public.account_identities ai
      on ai.provider = lai.provider
     and ai.provider_user_id = lai.provider_subject
    where lai.provider is not null
      and lai.provider_subject is not null
      and ai.status = 'active'
      and ai.unlinked_at is null
  ) then
    raise exception 'IDENTITY_ALREADY_LINKED_TO_DIFFERENT_PERSON'
      using errcode = 'P0001';
  end if;

  insert into public.persons (status)
  values ('active'::public.scheduler_person_status)
  returning id into v_person_id;

  with linked_auth_identities as (
    select
      case
        when i.provider = 'google' then 'google'::public.scheduler_identity_provider
        when i.provider = 'kakao' then 'kakao'::public.scheduler_identity_provider
        when i.provider in ('naver', 'custom:naver') then 'naver'::public.scheduler_identity_provider
        when i.provider = 'email' then 'email'::public.scheduler_identity_provider
        else null::public.scheduler_identity_provider
      end as provider,
      nullif(i.provider_id, '') as provider_subject,
      nullif(i.identity_data->>'email', '') as provider_email
    from auth.identities i
    where i.user_id = v_auth_user_id
  ),
  valid_auth_identities as (
    select distinct on (provider)
      provider,
      provider_subject,
      provider_email
    from linked_auth_identities
    where provider is not null
      and provider_subject is not null
    order by provider, provider_subject
  ),
  inserted as (
    insert into public.account_identities (
      person_id,
      auth_user_id,
      provider,
      provider_user_id,
      email,
      status,
      linked_at,
      unlinked_at,
      updated_at
    )
    select
      v_person_id,
      v_auth_user_id,
      vai.provider,
      vai.provider_subject,
      vai.provider_email,
      'active'::public.scheduler_identity_status,
      now(),
      null,
      now()
    from valid_auth_identities vai
    returning provider, status
  )
  select jsonb_build_object(
    'bootstrap_status', 'created_person',
    'providers',
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'provider', inserted.provider::text,
          'status', inserted.status::text
        )
        order by inserted.provider::text
      ),
      '[]'::jsonb
    )
  )
    into v_result
  from inserted;

  return coalesce(
    v_result,
    jsonb_build_object('bootstrap_status', 'created_person', 'providers', '[]'::jsonb)
  );
end;
$$;

revoke all on function public.ensure_current_person_auth_identity() from public;
revoke all on function public.ensure_current_person_auth_identity() from anon;
grant execute on function public.ensure_current_person_auth_identity() to authenticated;

comment on function public.ensure_current_person_auth_identity() is
  'Bootstraps scheduler v2 person/account_identity rows for the current authenticated user using Supabase Auth identities only. Returns provider-level status only and does not merge by email/name or grant notification consent.';
