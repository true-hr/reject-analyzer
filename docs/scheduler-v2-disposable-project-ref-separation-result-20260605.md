# Scheduler v2 Disposable Project Ref Separation Result

## Purpose

This document records the disposable Supabase project ref separation verification result after the user reported Dashboard-based project setup for scheduler v2 notification schema migration verification.

## Prior document

- PR #794 result document: `docs/scheduler-v2-disposable-project-create-approved-result-20260605.md`
- Merge commit: `0171c5571be55acc3361aa09f722c4ccb6583db1`

## Creation method

- The user reported that the disposable Supabase project was created through the Supabase Dashboard.
- This session could not independently verify the project because it was not visible in `supabase projects list`.
- Claude/Codex did not generate, enter, store, output, or record the DB password.
- Claude/Codex did not create the project through the Supabase CLI.

## Verification result

`NEEDS_USER_ACTION`

The disposable project was not visible in the read-only Supabase CLI project listing available to this session.

User action is required to confirm the correct Supabase organization/team is selected or that this session has access to the disposable project.

No safety issue was found in the repository because no Supabase project setting, database, migration, env, or secret was changed.

## Project information

Requested disposable project target:

| Field | Result |
| --- | --- |
| Project name | `passmap-scheduler-v2-disposable-20260605` |
| Region | `Northeast Asia (Seoul)` |
| Project ref masked | Not available because the disposable project was not visible in `supabase projects list` |
| Org/team masked | Not available for the disposable project because it was not visible in `supabase projects list` |
| Created at | Not available because the disposable project was not visible in `supabase projects list` |
| Existing `reject analyzer` comparison | Not verified; disposable project ref was not visible |
| production/staging comparison | Not verified; disposable project ref was not visible |

Read-only project listing observation:

| Field | Result |
| --- | --- |
| Supabase CLI version | `2.105.0` |
| Visible project count | 1 |
| Visible project count change | No increase from the prior PR #794 result document, which also recorded 1 visible project |
| Existing visible project name | `reject analyzer` |
| Existing visible project region | `Northeast Asia (Seoul)` |
| Existing visible project ref masked | `pq...sk` |
| Existing visible org id masked | `nv...mk` |

No full project ref, org id, secret, DB password, service role key, anon key, access token, or provider secret is recorded here.

## Separation check

Current status:

- Existing `reject analyzer` project ref: visible only as masked `pq...sk`.
- Disposable project ref: not visible to this session.
- Existing `reject analyzer` project and disposable project ref separation: `NEEDS_USER_ACTION`.
- production/staging ref separation: `NEEDS_USER_ACTION`.
- Vercel/app connection: not verified from the available CLI listing; no connection was created or changed by this batch.
- provider/live secret connection: not verified from the available CLI listing; no secret was created, imported, stored, or changed by this batch.
- real data import: not performed by this batch.
- live cron: not created or changed by this batch.
- production callback/webhook: not created or changed by this batch.

The disposable project must become visible to this session, or the user must provide a dashboard-side confirmation that excludes full refs and secrets, before this document can be updated to `VERIFIED`.

## Not done in this batch

- migration apply 없음.
- SQL 실행 없음.
- Supabase SQL Editor 사용 없음.
- RLS SQL 작성 없음.
- migration 수정 없음.
- production/staging DB 접근 없음.
- env/secret 저장 없음.
- 기존 `reject analyzer` project 변경 없음.
- DB password 출력/저장/기록 없음.
- service role key 저장 없음.
- anon key 저장 없음.
- provider secret import 없음.
- real user data import 없음.
- production data import 없음.
- Vercel production env 연결 없음.
- app env 연결 없음.
- Edge Function 수정 없음.
- frontend 수정 없음.
- provider/live 발송 없음.
- cron/production 설정 없음.

## Next approval gate

The next schema apply verification must not proceed until the disposable project ref separation is verified.

To proceed with scheduler v2 notification schema migration apply verification later, the user must explicitly approve with this intent:

```txt
Disposable project ref가 production/staging과 다름을 확인했습니다.
이 disposable project에 scheduler v2 notification schema migration apply verification을 진행해도 됩니다.
```

## Out of scope

- Migration apply.
- SQL execution.
- Supabase SQL Editor.
- RLS SQL writing.
- Migration file creation or modification.
- production/staging DB access.
- Existing `reject analyzer` project changes.
- Supabase env or secret changes.
- Service role key or anon key storage.
- DB password output, storage, or recording.
- Provider/live sending.
- Live cron setup.
- Production callback/webhook setup.
- Vercel production env connection.
- App env connection.
- Edge Function changes.
- Frontend changes.
