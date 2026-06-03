# PASSMAP Scheduler v2 Fixture Implementation Planning

## 1. Purpose

This document plans a future implementation PR for scheduler v2 dry-run fixture coverage.

The goal is to define what to implement first, which files may be touched, which files must stay untouched, and what validation commands should be used. This planning document does not implement tests or change scheduler behavior.

## 2. Current Context

The following documentation baselines are now prepared:

- scheduler v2 dry-run response contract;
- scheduler v2 provider dry-run adapter;
- notification QA matrix design;
- scheduler v2 dry-run QA fixture design;
- notification settings UI v2 design;
- account-linking UX design;
- contact verification UX design;
- consent copy and versioning UX design;
- Web Push ownership bridge design.

The next implementation step should be small and test-focused, not a live scheduler rollout.

## 3. Non-goals

The future implementation PR must not include:

- live message delivery;
- provider SDKs;
- environment variable changes;
- Supabase deploy;
- cron changes;
- DB migrations;
- SQL apply;
- frontend UI changes;
- service worker changes;
- production configuration changes.

## 4. Recommended Implementation Scope

Recommended classification:

`Standard QA Batch / Protected-adjacent scheduler v2 dry-run fixture coverage`

Recommended future branch:

`test/scheduler-v2-fixtures-20260603`

Recommended implementation goal:

Add a small first batch of scheduler v2 dry-run fixture assertions using the existing contract test structure, while preserving all zero-side-effect guarantees.

## 5. Candidate Files to Read

Read-only candidate files:

- `supabase/functions/send-experience-recall-reminders-v2/contract.ts`
- `supabase/functions/send-experience-recall-reminders-v2/contract_test.ts`
- `docs/scheduler-v2-dry-run-response-contract-20260603.md`
- `docs/scheduler-v2-dry-run-qa-fixtures-20260603.md`
- `docs/notification-qa-matrix-design-20260603.md`
- `docs/scheduler-v2-provider-dry-run-adapter-20260603.md`

## 6. Candidate Files to Modify

Preferred minimal modification:

- `supabase/functions/send-experience-recall-reminders-v2/contract_test.ts`

Optional only if the existing test file becomes too large:

- `supabase/functions/send-experience-recall-reminders-v2/contract_fixtures_test.ts`

Avoid creating new helper modules unless absolutely needed.

## 7. Files to Avoid

The future implementation PR must not modify:

- `src/**`
- `public/sw.js`
- `supabase/sql/**`
- `supabase/sql/drafts/**`
- `.github/workflows/**`
- `package.json`
- `package-lock.json`
- `.env*`
- Vercel configuration
- Supabase project configuration

## 8. First Fixture Batch Recommendation

The first implementation should include only 5 to 8 cases.

Recommended first batch:

1. No resolved person -> blocked.
2. No due rules -> skipped.
3. Disabled rule -> skipped.
4. Missing service notification consent -> blocked.
5. Missing reminder consent -> blocked.
6. Verified contact but missing channel consent -> blocked.
7. Contact unverified despite channel consent -> blocked.
8. Live mode requested before approval -> rejected.

Defer the following to later PRs:

- fallback cases;
- Web Push ownership cases;
- record guard cases;
- provider readiness expansion;
- multi-channel priority ordering;
- large matrix coverage.

## 9. Assertion Checklist

Each implemented fixture should assert:

- decision status;
- reason code;
- no external channel execution marker;
- no message identifier;
- no delivery ledger write marker;
- live mode rejection where applicable;
- existing response contract fields remain backward-compatible.

Do not assert brittle UI copy in scheduler contract tests. UI copy should be covered separately by UI tests after frontend implementation begins.

## 10. Validation Commands

Future implementation PR should run:

```bash
deno check supabase/functions/send-experience-recall-reminders-v2/index.ts
```

If test execution is already supported for this function, also run the relevant Deno test command for the scheduler v2 contract tests.

At minimum, report:

```bash
git status --short --branch
git diff -- supabase/functions/send-experience-recall-reminders-v2/contract_test.ts
git diff --check
git diff --name-status origin/main...HEAD
```

If a new test file is added, include it in the diff command.

## 11. PR Size Rule

Keep the first implementation PR small.

Recommended PR limit:

- one test file modified, or one test file plus one new fixture test file;
- 5 to 8 fixture cases;
- no behavior changes beyond exposing existing contract states to tests;
- no production code changes unless a missing exported helper makes tests impossible.

If production code changes become necessary, stop and create a separate planning note before proceeding.

## 12. Stop Conditions

Stop immediately if the implementation requires:

- DB or SQL changes;
- Edge Function deployment;
- provider integration;
- new secrets;
- frontend changes;
- service worker changes;
- cron changes;
- production settings;
- live delivery behavior;
- account merge or backfill;
- Web Push ownership transfer.

## 13. Expected Future PR Body

Suggested future PR title:

`test: add scheduler v2 dry-run fixture coverage`

Suggested future PR summary:

- Add first scheduler v2 dry-run fixture coverage batch.
- Cover person/rule/consent/contact/live-mode rejection basics.
- Preserve zero-side-effect dry-run behavior.

Suggested guardrails:

- No DB/sql changes.
- No frontend changes.
- No provider integration.
- No live delivery changes.
- No cron changes.
- No production changes.

## 14. Next Steps

After the first fixture implementation PR, continue with separate small batches:

1. Provider readiness fixture batch.
2. Fallback fixture batch.
3. Web Push ownership fixture batch.
4. Record guard and skip policy fixture batch.
5. Multi-channel priority fixture batch.

Do not combine all fixture families into one oversized PR.

## 15. Guardrails

This document does not authorize:

- code changes;
- frontend changes;
- DB or SQL changes;
- Supabase deploy;
- provider integration;
- live delivery changes;
- cron changes;
- production changes.
