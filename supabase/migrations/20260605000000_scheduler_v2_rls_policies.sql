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

-- Helper candidates are intentionally deferred.
-- TODO before client access: confirm the authoritative auth-user-to-person link.
-- Do not create executable auth membership helper functions in this draft.
-- The account_identities.provider_user_id = auth.uid()::text predicate is not
-- confirmed and could grant client read access to the wrong person_id.
-- Security definer helpers require separate review before any apply.

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

-- Authenticated client read policies are intentionally deferred.
-- Do not create executable authenticated direct table read policies in this
-- draft. They depend on a person membership helper, and the membership
-- contract is not confirmed.
-- Client direct table read remains closed until helper/view design is reviewed.

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
