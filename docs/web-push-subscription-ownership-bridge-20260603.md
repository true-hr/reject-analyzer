# PASSMAP Web Push Subscription Ownership Bridge Design

## 1. Purpose

This document defines the baseline design for safely handling PASSMAP Web Push subscription ownership during the `person_id` transition.

Web Push subscriptions are not person records. They are browser/device-level reachability assets represented by endpoint and subscription keys. During the transition from `auth.users.id`-based ownership to `person_id`-based notification decisions, PASSMAP must not blindly move existing subscriptions from one auth user to a person. A subscription can be stale, tied to a prior login context, shared device state, a changed linked-account relationship, or a browser permission state that no longer reflects the current PASSMAP person.

This design establishes a bridge between:

- `person_id`: PASSMAP real person owner.
- `auth_user_id`: Supabase Auth login account and session identity.
- `endpoint` or subscription row: browser/device Web Push reachability.

The goal is to keep Web Push available as an auxiliary channel after Kakao/SMS become primary operating candidates, while avoiding incorrect endpoint ownership transfer.

This document is a design baseline only. It is not a DB migration, SQL apply, service worker change, Edge Function change, frontend implementation, Web Push send change, or production change.

## 2. Current State

- Web Push test notification is implemented.
- A test notification can be sent to the current logged-in user and current endpoint candidate.
- Existing `push_subscriptions` storage is `user_id`-based and has a unique endpoint.
- Existing Web Push functions read `push_subscriptions` for test and reminder sends.
- Production `public/sw.js` includes `notificationclick` handling.
- User PC click UX has been unstable in manual use, so click behavior should not be treated as uniformly reliable.
- Web Push is not the long-term primary operating reminder channel.
- Kakao Alimtalk is the primary operating channel candidate.
- SMS is the fallback candidate after Kakao failure.
- `person_id`, notification contacts, consents, and `reminder_rules_v2` design baselines are prepared.
- Live provider, Kakao/SMS, DB, and cron transition work remains prohibited.

## 3. Non-goals

This document does not include:

- DB migration authoring;
- SQL apply;
- service worker modification;
- frontend Web Push UI modification;
- Edge Function modification;
- Web Push send behavior changes;
- existing subscription transfer;
- existing subscription backfill execution;
- production changes.

## 4. Core Design Principles

- A Web Push subscription is a browser/device/endpoint asset, not a person asset by itself.
- A subscription must not be directly overwritten or moved onto `person_id`.
- Existing `auth_user_id`-based subscriptions must not be automatically moved to another `person_id`.
- Endpoint ownership must be explicitly verified after the `person_id` transition.
- One `person_id` can have multiple linked `auth_user_id` values.
- One `person_id` can have multiple browser/device endpoints.
- One endpoint must not be active for multiple `person_id` values.
- If an endpoint appears to belong to multiple people, treat it as a conflict.
- Browser permission, endpoint validity, and `last_seen_at` are separate eligibility checks.
- Web Push should remain secondary or optional after Kakao/SMS primary/fallback operation is available.
- Existing subscriptions can be treated as candidates, not active person-owned contacts, until the user re-registers or the endpoint is otherwise explicitly verified.

## 5. Ownership Bridge Schema Draft

This is a schema draft, not SQL. It intentionally does not define migrations, indexes, RLS policies, triggers, constraints, or data backfill.

### web_push_subscriptions or existing push_subscriptions

Purpose: browser/device-level Web Push subscription storage.

Candidate fields:

- `id`
- `auth_user_id`
- `endpoint`
- `p256dh`
- `auth`
- `user_agent`
- `platform`
- `last_seen_at`
- `revoked_at`
- `created_at`
- `updated_at`

Notes:

- Existing storage uses `push_subscriptions.user_id`; future docs should normalize naming to `auth_user_id` where the row still represents Supabase Auth ownership.
- `endpoint`, `p256dh`, and `auth` are raw subscription secrets and must not be copied into person-level contact rows.
- `user_agent` and `platform` are useful for device display and support, but they carry fingerprinting risk.
- `last_seen_at` should update when the same browser/device re-registers or confirms its current subscription.
- `revoked_at` is a candidate for soft revocation instead of immediate hard deletion, subject to privacy retention review.

### web_push_subscription_owners

Purpose: bridge one verified subscription candidate to one PASSMAP person, while preserving auth-user context and conflict state.

Candidate fields:

- `id`
- `person_id`
- `auth_user_id`
- `subscription_id`
- `endpoint_hash`
- `ownership_status`
- `source`
- `verified_at`
- `last_seen_at`
- `created_at`
- `updated_at`

`ownership_status` candidates:

- `active`
- `revoked`
- `stale`
- `conflict`

`source` candidates:

- `current_login_registration`
- `account_linking_review`
- `backfill_candidate`

Recommended baseline:

- Do not copy raw endpoint into `notification_contacts.destination`.
- Link `person_id` to a subscription through a bridge table or reference.
- Use `subscription_id` when the subscription table is authoritative.
- Use `endpoint_hash` only as a lookup/conflict helper after hash policy review.
- Treat existing subscriptions as `backfill_candidate`, not automatically `active`.
- Promote to `active` only after current-login re-registration or equivalent explicit verification.

## 6. Relationship to notification_contacts

Web Push should connect to `notification_contacts` by reference, not raw endpoint.

Recommended contact shape:

- `notification_contacts.channel` = `web_push`
- `notification_contacts.destination_type` = `web_push_subscription_ref`
- `notification_contacts.destination` = subscription id/ref, not raw endpoint
- raw `endpoint`, `p256dh`, and `auth` remain in the subscription table
- active ownership is checked in `web_push_subscription_owners`

Implications:

- `notification_contacts` says the person has a Web Push contact candidate.
- `web_push_subscription_owners` says whether that person currently owns the referenced subscription.
- The subscription table stores the actual provider payload needed to send.
- Masking, hashing, and retention policy still require privacy review.
- Logs and result JSON must not include raw endpoint, `p256dh`, or `auth`.

## 7. Ownership Verification Policy

A Web Push subscription can be connected to a `person_id` as `active` only when all of the following are true:

- the current logged-in `auth_user_id` is linked to the `person_id` through `linked_auth_users`;
- browser notification permission is `granted`;
- endpoint, `p256dh`, and `auth` are present and complete;
- the current browser re-registers the subscription or refreshes `last_seen_at`;
- the same endpoint is not active for another `person_id`;
- the user is told that this device/browser will receive notifications for the current PASSMAP account;
- the required Web Push consent is granted.

Unverified and backfill policy:

- Existing rows must not become active person-owned subscriptions automatically.
- If an existing `auth_user_id` maps to a `person_id`, that relation can create only a `backfill_candidate` until explicit verification.
- The active transition should happen when the user logs in and registers or confirms notifications on the current browser/device.
- If verification cannot confirm the current browser/device context, the subscription remains non-live.

Dry-run status candidates:

- missing subscription reference: `would_skip_contact_missing`
- incomplete subscription keys: `would_skip_contact_unverified`
- backfill-only ownership: `would_skip_contact_unverified`
- conflict ownership: `would_skip_conflict` candidate, or `would_skip_contact_unverified` until the scheduler contract includes a conflict-specific status

## 8. Conflict Policy

Conflict examples:

- The same endpoint is linked to different `person_id` candidates.
- The same endpoint remains attached to an old `auth_user_id` while a new `person_id` mapping is ambiguous.
- Account linking changes the expected person owner, but the browser/device has not re-registered.
- Browser permission still appears granted while `linked_auth_users` changed or was revoked.
- A shared browser profile was used by more than one PASSMAP account.

Policy:

- `conflict` ownership is excluded from live-send candidates.
- Scheduler dry-run may report `would_skip_conflict` after the contract supports it.
- Until then, dry-run can map conflict to `would_skip_contact_unverified`.
- The user should be asked to re-register this browser/device.
- Automatic merge, automatic transfer, or silent reassignment is prohibited.
- Support/admin tooling must not manually force active ownership without a separate audit and privacy policy.

## 9. Stale and Revoked Policy

Stale candidates:

- push service returns 404 or 410;
- `last_seen_at` is older than the approved freshness window;
- browser/device has not re-registered after account-linking changes;
- endpoint keys are incomplete or no longer match the current browser subscription.

Revoked candidates:

- user disables notifications in PASSMAP;
- browser permission is `denied`;
- user unsubscribes from the browser/device;
- account unlinking invalidates the ownership relationship;
- provider send result indicates the subscription is permanently gone.

Policy:

- `revoked_at` should be recorded when the user or browser disables the subscription.
- Browser permission `denied` excludes the endpoint from active candidates.
- `stale` endpoints should be excluded from live send candidates unless a separate low-priority retry policy is approved.
- Raw endpoint deletion, retention, and anonymization require privacy review.
- A stale/revoked subscription must not be used as a shortcut to infer ownership for a new person.

## 10. Scheduler v2 Connection

Scheduler v2 should evaluate Web Push in this order:

1. Query due `reminder_rules_v2` by `person_id`.
2. Read `reminder_rule_channels` and identify `web_push` as optional or secondary.
3. Query `notification_contacts` for `person_id` and `channel = web_push`.
4. Resolve `destination_type = web_push_subscription_ref`.
5. Check `web_push_subscription_owners` for active ownership by `person_id`.
6. Confirm the bridge `auth_user_id` is still linked to the `person_id`.
7. Load the subscription row and confirm endpoint, `p256dh`, and `auth` are complete.
8. Check browser/device validity signals, including permission and freshness where available.
9. Check required consents, including `service_notification` and `web_push_device`.
10. In dry-run, return would-send or would-skip decisions without side effects.

Dry-run safety:

- `providerCalls` remains `0`.
- `messagesSent` remains `0`.
- `ledgerWrites` remains `0`.
- Web Push provider/send calls remain disabled.
- Ledger writes remain disabled.
- Raw subscription payloads are not stored in result JSON.

Live safety:

- Web Push live send remains prohibited in this task.
- Web Push live operation requires separate DB/RLS/schema, UX, QA, and production approvals.
- Existing weekly Web Push behavior must not be changed by this documentation task.

## 11. PC, Android, and iPhone Compatibility

PC Chrome/Edge:

- General Web Push support is available in modern desktop Chrome and Edge.
- Notification display and click handling can still vary by browser settings, OS notification settings, and installed app/browser state.

Android Chrome:

- Web Push support is generally more likely to work than on iPhone Safari.
- Device notification settings, battery restrictions, and browser state can still affect delivery and clicks.

iPhone Safari/PWA:

- iOS Web Push can require PWA installation and explicit permission conditions depending on OS/browser behavior.
- Safari/iOS constraints make the path less predictable than desktop Chrome/Edge.
- Click behavior and foregrounding may differ from desktop behavior.

Operating position:

- Web Push is a secondary or optional channel.
- Web Push should not be the sole critical reminder channel.
- Kakao Alimtalk and SMS are the primary/fallback operating candidates.
- Web Push can remain useful for currently active browsers/devices, test alerts, and auxiliary reminders.

## 12. Privacy and Security Risks

Risk areas:

- `endpoint`, `p256dh`, and `auth` are sensitive subscription secrets.
- Endpoint can behave like a stable browser/device identifier.
- `user_agent` and `platform` can increase fingerprinting risk.
- Raw endpoint must not appear in logs, docs, screenshots, support tickets, or `notification_contacts`.
- Account linking can attach an endpoint to the wrong person if ownership is inferred too aggressively.
- A stale browser subscription can deliver to a device no longer controlled by the intended user.
- Shared browser profiles can create ambiguous ownership.
- Provider raw responses can expose endpoint or delivery metadata.
- Deletion, retention, rotation, and anonymization policies are required before live migration.

Required reviews:

- subscription secret storage policy;
- endpoint hash policy;
- user-agent/platform retention policy;
- log redaction policy;
- account-linking ownership transition policy;
- stale/revoked cleanup policy;
- support/admin access policy.

## 13. Live Application Preconditions

Before live application, all of the following must be complete:

- subscription ownership bridge schema review;
- subscription ownership bridge RLS review;
- `notification_contacts` Web Push reference policy finalization;
- existing subscription backfill policy finalization;
- conflict, stale, and revoked policy finalization;
- browser re-registration UX finalization;
- Web Push click UX re-verification;
- PC Chrome/Edge manual QA;
- Android Chrome manual QA;
- iPhone Safari/PWA manual QA;
- Protected DB approval;
- Supabase production change approval;
- live scheduler approval;
- Web Push live-send approval.

Without these approvals, Web Push remains existing behavior only and scheduler v2 remains dry-run/mock.

## 14. Next Steps

Possible follow-up PRs:

- Web Push ownership bridge SQL draft PR.
- Web Push re-registration UX design.
- Notification settings UI v2 design.
- Scheduler v2 DB-query dry-run implementation.
- PC/Android/iPhone manual QA runbook.
- Kakao/SMS provider candidate comparison document.

## 15. Guardrails

This document does not authorize:

- DB or SQL changes;
- Supabase SQL Editor execution;
- Supabase CLI db push/apply;
- DB migration or data backfill;
- service worker changes;
- frontend changes;
- Edge Function changes;
- env or secret usage;
- Web Push send behavior changes;
- actual Web Push sending changes;
- Supabase deploy;
- cron changes;
- production changes;
- existing subscription transfer.
