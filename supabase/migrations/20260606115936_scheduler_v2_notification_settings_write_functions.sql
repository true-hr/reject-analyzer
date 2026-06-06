-- Scheduler v2 notification settings write function draft.
-- Draft only: do not apply to production/staging before separate review.
-- This keeps scheduler v2 client writes behind an authenticated RPC and does
-- not add raw base table client read/write policies.

create or replace function public.upsert_current_person_reminder_rule(
  p_reminder_kind scheduler_reminder_kind default 'experience_recall',
  p_cadence scheduler_reminder_cadence default 'weekly',
  p_days_of_week integer[] default '{}',
  p_time_local time default '18:00',
  p_timezone text default 'Asia/Seoul',
  p_is_enabled boolean default true,
  p_channels jsonb default '[{"channel":"web_push","priority":1,"is_enabled":true}]'::jsonb
)
returns table (
  rule_id uuid,
  person_id uuid,
  reminder_kind text,
  cadence text,
  days_of_week smallint[],
  time_local time,
  timezone text,
  is_enabled boolean,
  channels jsonb
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_person_ids uuid[];
  v_person_id uuid;
  v_rule_id uuid;
  v_existing_count integer;
  v_days smallint[];
  v_channel_item jsonb;
  v_channel scheduler_notification_channel;
  v_priority integer;
  v_channel_enabled boolean;
  v_fallback scheduler_notification_channel;
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

  if p_timezone is null or btrim(p_timezone) = '' then
    raise exception 'TIMEZONE_REQUIRED'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_days_of_week, '{}')) d(day_value)
    where d.day_value < 0 or d.day_value > 6
  ) then
    raise exception 'INVALID_DAY_OF_WEEK'
      using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct d.day_value::smallint order by d.day_value::smallint), '{}')
    into v_days
  from unnest(coalesce(p_days_of_week, '{}')) d(day_value);

  select count(*) into v_existing_count
  from public.reminder_rules rr
  where rr.person_id = v_person_id
    and rr.reminder_kind = p_reminder_kind
    and rr.deleted_at is null;

  if v_existing_count > 1 then
    raise exception 'AMBIGUOUS_REMINDER_RULE'
      using errcode = 'P0001';
  end if;

  if v_existing_count = 1 then
    select rr.id into v_rule_id
    from public.reminder_rules rr
    where rr.person_id = v_person_id
      and rr.reminder_kind = p_reminder_kind
      and rr.deleted_at is null
    order by rr.updated_at desc, rr.created_at desc, rr.id
    limit 1;

    update public.reminder_rules rr
    set cadence = p_cadence,
        days_of_week = v_days,
        time_local = p_time_local,
        timezone = btrim(p_timezone),
        is_enabled = p_is_enabled,
        updated_at = now()
    where rr.id = v_rule_id;
  else
    insert into public.reminder_rules (
      person_id,
      reminder_kind,
      cadence,
      days_of_week,
      time_local,
      timezone,
      is_enabled
    )
    values (
      v_person_id,
      p_reminder_kind,
      p_cadence,
      v_days,
      p_time_local,
      btrim(p_timezone),
      p_is_enabled
    )
    returning id into v_rule_id;
  end if;

  if p_channels is not null and jsonb_typeof(p_channels) <> 'array' then
    raise exception 'CHANNELS_MUST_BE_ARRAY'
      using errcode = '22023';
  end if;

  for v_channel_item in
    select value
    from jsonb_array_elements(coalesce(p_channels, '[]'::jsonb))
  loop
    if coalesce(v_channel_item->>'channel', '') = '' then
      raise exception 'CHANNEL_REQUIRED'
        using errcode = '22023';
    end if;

    v_channel := (v_channel_item->>'channel')::scheduler_notification_channel;
    v_priority := greatest(coalesce(nullif(v_channel_item->>'priority', '')::integer, 1), 1);
    v_channel_enabled := coalesce((v_channel_item->>'is_enabled')::boolean, true);
    v_fallback := nullif(v_channel_item->>'fallback_to_channel', '')::scheduler_notification_channel;

    insert into public.reminder_channels (
      rule_id,
      channel,
      priority,
      is_enabled,
      fallback_to_channel
    )
    values (
      v_rule_id,
      v_channel,
      v_priority,
      v_channel_enabled,
      v_fallback
    )
    on conflict (rule_id, channel)
    do update set
      priority = excluded.priority,
      is_enabled = excluded.is_enabled,
      fallback_to_channel = excluded.fallback_to_channel,
      updated_at = now();
  end loop;

  return query
  select
    rr.id as rule_id,
    rr.person_id,
    rr.reminder_kind::text,
    rr.cadence::text,
    rr.days_of_week,
    rr.time_local,
    rr.timezone,
    rr.is_enabled,
    coalesce(
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
    ) as channels
  from public.reminder_rules rr
  where rr.id = v_rule_id;
end;
$$;

comment on function public.upsert_current_person_reminder_rule(
  scheduler_reminder_kind,
  scheduler_reminder_cadence,
  integer[],
  time,
  text,
  boolean,
  jsonb
) is 'Authenticated scheduler v2 reminder rule write RPC. Uses current_person_ids() and does not expose raw base table client writes.';

revoke all on function public.upsert_current_person_reminder_rule(
  scheduler_reminder_kind,
  scheduler_reminder_cadence,
  integer[],
  time,
  text,
  boolean,
  jsonb
) from public;

revoke all on function public.upsert_current_person_reminder_rule(
  scheduler_reminder_kind,
  scheduler_reminder_cadence,
  integer[],
  time,
  text,
  boolean,
  jsonb
) from anon;

grant execute on function public.upsert_current_person_reminder_rule(
  scheduler_reminder_kind,
  scheduler_reminder_cadence,
  integer[],
  time,
  text,
  boolean,
  jsonb
) to authenticated;
