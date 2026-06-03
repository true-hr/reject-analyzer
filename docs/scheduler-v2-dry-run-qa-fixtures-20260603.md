# PASSMAP Scheduler v2 Dry-run QA Fixture Design

## 1. Purpose

This document defines the baseline QA fixture design for PASSMAP scheduler v2 dry-run behavior.

The goal is to convert the notification QA matrix into stable fixture scenarios before implementation. Future tests should verify that scheduler v2 can explain why a reminder is eligible, blocked, skipped, or rejected without changing live notification behavior.

This document is a design baseline only. It is not test implementation, frontend implementation, database change, Edge Function change, provider integration, cron change, or production change.

## 2. Current State

Prepared design baselines include:

- scheduler v2 dry-run response contract;
- scheduler v2 provider dry-run adapter;
- notification QA matrix design;
- notification settings UI v2 design;
- account-linking UX design;
- contact verification UX design;
- consent copy and versioning UX design;
- Web Push ownership bridge design.

Scheduler v2 should remain in dry-run/mock mode until a separate Protected live approval exists.

## 3. Non-goals

This document does not include:

- automated test code;
- frontend changes;
- database or SQL changes;
- Edge Function changes;
- service worker changes;
- external channel setup;
- cron changes;
- production changes.

## 4. Fixture Principles

Future fixtures should be:

- deterministic;
- small enough to isolate one reason;
- explicit about person, rule, contact, consent, channel, readiness, Web Push ownership, and record guard state;
- clear about expected decision status and reason code;
- safe in dry-run mode with no live side effects.

Dry-run fixture expectations should always confirm:

- no live channel execution;
- no delivery ledger write;
- no external message identifier;
- no raw external response stored;
- no automatic Web Push ownership transfer;
- no account merge or backfill.

## 5. Fixture Shape Candidate

A future fixture should contain:

- fixture id;
- title;
- given state;
- expected decision status;
- expected reason code;
- expected channel state;
- expected fallback state;
- expected zero-side-effect assertions.

The exact code structure can be decided later during implementation, but these concepts should remain stable.

## 6. Decision Status Baseline

Expected decision statuses:

- `eligible`
- `blocked`
- `skipped`
- `rejected`

Expected reason codes:

- `person_unresolved`
- `not_due`
- `rule_disabled`
- `service_consent_missing`
- `reminder_consent_missing`
- `channel_consent_missing`
- `contact_missing`
- `contact_unverified`
- `provider_not_ready`
- `web_push_permission_missing`
- `web_push_registration_incomplete`
- `web_push_stale`
- `web_push_ownership_conflict`
- `skip_policy_matched`
- `record_guard_unknown`
- `fallback_candidate`
- `fallback_blocked`
- `live_not_authorized`

## 7. Core Fixture Families

Future fixture implementation should cover these fixture families:

1. Person resolution fixtures.
2. Reminder rule due/disabled fixtures.
3. Service and reminder consent fixtures.
4. Channel-specific consent fixtures.
5. Contact missing and contact unverified fixtures.
6. Channel readiness fixtures.
7. Fallback candidate and fallback blocked fixtures.
8. Web Push current-device ownership fixtures.
9. Record guard and skip policy fixtures.
10. Live-mode rejection fixtures.

## 8. Minimum Fixture Cases

The first implementation pass should include at least:

- no resolved person;
- resolved person but no due rules;
- due rule disabled;
- due rule with missing service notification consent;
- due rule with missing reminder consent;
- verified contact but missing channel consent;
- channel consent granted but contact unverified;
- contact and consent ready but channel not ready;
- eligible dry-run candidate;
- fallback consent missing;
- fallback contact missing;
- fallback eligible in dry-run;
- Web Push active current-device candidate;
- Web Push browser permission missing;
- Web Push registration incomplete;
- Web Push stale ownership;
- Web Push ownership conflict;
- skip policy matched;
- record guard unknown;
- live mode requested before approval.

## 9. Minimum Assertion Checklist

Every future automated fixture test should assert:

- decision status;
- reason code;
- selected or blocked channel;
- fallback candidate or fallback blocked state;
- no live channel execution;
- no external message identifier;
- no delivery ledger write;
- no automatic Web Push ownership transfer;
- live mode rejection where applicable.

## 10. UI Alignment Expectations

Fixture results should map to user-facing states:

- `service_consent_missing`: service notification consent needed;
- `reminder_consent_missing`: reminder consent needed;
- `channel_consent_missing`: channel-specific consent needed;
- `contact_unverified`: contact verification needed;
- `provider_not_ready`: channel/provider preparation pending;
- `web_push_permission_missing`: browser permission needed;
- `web_push_ownership_conflict`: current-device notification review or re-registration needed;
- `skip_policy_matched`: this reminder is skipped by policy;
- `live_not_authorized`: live delivery is not approved.

## 11. Risks

- Tests that only check top-level counters can miss wrong channel selection.
- A fixture can accidentally imply live delivery if dry-run metadata is not clearly labeled.
- Fallback cases can accidentally bypass consent or contact requirements.
- Web Push cases can accidentally hide ownership conflict.
- Record guard cases can silently suppress reminders without user-visible explanation.
- Live mode rejection can be weakened accidentally when dry-run logic is extended.

## 12. Live Application Preconditions

Before fixtures can support live sending decisions, all of the following must be complete:

- fixture implementation PR completed;
- scheduler v2 dry-run QA passing;
- notification QA matrix reconciled with implementation;
- contacts/consents schema finalized;
- Web Push ownership bridge finalized;
- channel readiness policy finalized;
- fallback policy finalized;
- record guard/skip policy finalized;
- Protected DB approval;
- live channel approval;
- cron cutover approval;
- production cutover approval.

## 13. Next Steps

Possible follow-up PRs:

- scheduler v2 dry-run fixture implementation planning;
- scheduler v2 dry-run contract test expansion;
- notification settings UI implementation planning;
- consent/contact schema RLS Protected review;
- PC/Android/iPhone notification QA runbook.

## 14. Guardrails

This document does not authorize:

- frontend changes;
- DB or SQL changes;
- Supabase SQL Editor execution;
- Supabase CLI db push/apply;
- Supabase Auth provider changes;
- Edge Function changes;
- service worker changes;
- env or secret usage;
- external channel calls;
- live message delivery changes;
- consent ledger writes;
- reminder delivery ledger writes;
- account merge or backfill;
- Web Push subscription transfer;
- cron changes;
- production changes.
