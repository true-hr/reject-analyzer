-- Draft RPC for syncing the signed-in Supabase Auth user's linked identities
-- into scheduler v2 account identity rows. This migration is not applied to
-- production/staging by this PR.

drop index if exists public.account_identities_active_auth_user_id_key;

create unique index if not exists account_identities_active_auth_user_provider_key
  on public.account_identities (auth_user_id, provider)
  where status = 'active' and unlinked_at is null;

create or replace function public.current_person_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select distinct ai.person_id
  from public.account_identities ai
  join public.persons p on p.id = ai.person_id
  where auth.uid() is not null
    and ai.auth_user_id = auth.uid()
    and ai.status = 'active'
    and ai.unlinked_at is null
    and p.status = 'active';
$$;

revoke all on function public.current_person_ids() from public;
revoke all on function public.current_person_ids() from anon;
grant execute on function public.current_person_ids() to authenticated;

create or replace function public.sync_current_person_auth_identities()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_person_ids uuid[];
  v_person_id uuid;
  v_result jsonb;
begin
  if v_auth_user_id is null then
    raise exception 'AUTH_REQUIRED'
      using errcode = 'P0001';
  end if;

  select coalesce(array_agg(distinct c.person_id order by c.person_id), array[]::uuid[])
    into v_person_ids
  from public.current_person_ids() c(person_id);

  if array_length(v_person_ids, 1) is null then
    raise exception 'CURRENT_PERSON_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if array_length(v_person_ids, 1) <> 1 then
    raise exception 'CURRENT_PERSON_AMBIGUOUS'
      using errcode = 'P0001';
  end if;

  v_person_id := v_person_ids[1];

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
      and ai.person_id <> v_person_id
      and ai.status = 'active'
      and ai.unlinked_at is null
  ) then
    raise exception 'IDENTITY_ALREADY_LINKED_TO_DIFFERENT_PERSON'
      using errcode = 'P0001';
  end if;

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
    select provider, provider_subject, provider_email
    from linked_auth_identities
    where provider is not null
      and provider_subject is not null
  ),
  upserted as (
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
    on conflict (provider, provider_user_id)
      where status = 'active' and unlinked_at is null
    do update set
      person_id = excluded.person_id,
      auth_user_id = excluded.auth_user_id,
      email = excluded.email,
      status = 'active'::public.scheduler_identity_status,
      unlinked_at = null,
      updated_at = now()
    where public.account_identities.person_id = excluded.person_id
       or public.account_identities.auth_user_id = excluded.auth_user_id
    returning provider, status
  )
  select jsonb_build_object(
    'providers',
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'provider', upserted.provider::text,
          'status', upserted.status::text
        )
        order by upserted.provider::text
      ),
      '[]'::jsonb
    )
  )
    into v_result
  from upserted;

  return coalesce(v_result, jsonb_build_object('providers', '[]'::jsonb));
end;
$$;

revoke all on function public.sync_current_person_auth_identities() from public;
revoke all on function public.sync_current_person_auth_identities() from anon;
grant execute on function public.sync_current_person_auth_identities() to authenticated;

comment on function public.sync_current_person_auth_identities() is
  'Syncs linked Supabase Auth identities for the current member person. Returns provider-level status only.';
