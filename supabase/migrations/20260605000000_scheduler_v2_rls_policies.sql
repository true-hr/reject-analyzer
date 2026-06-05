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

-- Helper candidates.
-- TODO before apply: confirm the authoritative auth-user-to-person link.
-- The account_identities.provider_user_id = auth.uid()::text predicate is a draft
-- assumption until the scheduler v2 identity linking contract is finalized.
create or replace function public.current_person_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select ai.person_id
  from public.account_identities ai
  where ai.status = 'active'::public.scheduler_identity_status
    and ai.provider_user_id = auth.uid()::text

  union

  select wpso.person_id
  from public.web_push_subscription_owners wpso
  where wpso.ownership_status = 'active'::public.scheduler_web_push_ownership_status
    and wpso.auth_user_id = auth.uid()
$$;

comment on function public.current_person_ids() is
  'Draft scheduler v2 helper. Returns person ids linked to the current auth user. Confirm identity-link predicate before apply.';

revoke all on function public.current_person_ids() from public;
grant execute on function public.current_person_ids() to authenticated;
grant execute on function public.current_person_ids() to service_role;

create or replace function public.is_member_of_person(target_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.current_person_ids() person_ids(person_id)
    where person_ids.person_id = target_person_id
  )
$$;

comment on function public.is_member_of_person(uuid) is
  'Draft scheduler v2 helper. Checks whether the current auth user is linked to the target person id.';

revoke all on function public.is_member_of_person(uuid) from public;
grant execute on function public.is_member_of_person(uuid) to authenticated;
grant execute on function public.is_member_of_person(uuid) to service_role;

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

-- Minimal authenticated read policies.
-- Base-table client reads are intentionally narrow. Raw identity/contact/delivery
-- surfaces remain service-role only until masked summary views/functions are reviewed.
create policy persons_authenticated_read_own
  on public.persons
  for select
  to authenticated
  using (public.is_member_of_person(id));

create policy notification_consents_authenticated_read_own
  on public.notification_consents
  for select
  to authenticated
  using (public.is_member_of_person(person_id));

create policy reminder_rules_authenticated_read_own
  on public.reminder_rules
  for select
  to authenticated
  using (public.is_member_of_person(person_id));

create policy reminder_channels_authenticated_read_own
  on public.reminder_channels
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.reminder_rules rules
      where rules.id = reminder_channels.rule_id
        and public.is_member_of_person(rules.person_id)
    )
  );

-- No authenticated direct policies are drafted for these base tables:
-- - account_identities: provider_user_id/email may be sensitive.
-- - contact_points: value_normalized may contain phone/email destinations.
-- - contact_verifications: service-role-only verification surface.
-- - web_push_subscription_owners: endpoint_hash/auth_user_id/subscription_id should be summarized.
-- - notification_delivery_claims: service-role-only idempotency surface.
-- - notification_delivery_logs: service-role-only audit surface.

-- Masked summary view/function candidates intentionally remain TODOs in this draft:
-- - account_identity_summary
-- - contact_point_summary
-- - notification_settings_summary
-- - notification_history_summary
-- Create these only after the masking contract and direct-table grants are reviewed.
