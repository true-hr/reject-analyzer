# Scheduler v2 Supabase Project Visibility Diagnosis

## Purpose

This document records a read-only diagnosis of why the disposable Supabase project is not visible in the current Supabase CLI session.

No project setting, database, migration, secret, environment variable, frontend file, Edge Function, provider/live path, or cron configuration was changed.

## Prior document

- PR #796 result document: `docs/scheduler-v2-disposable-project-ref-separation-result-20260605.md`
- PR #796 merge commit: `a75ef7e0`

## Current observation

Read-only commands used:

| Command | Result |
| --- | --- |
| `supabase --version` | `2.105.0` |
| `supabase projects list` | Completed successfully |
| `supabase orgs list` | Completed successfully |

Visible Supabase projects:

| Field | Observation |
| --- | --- |
| Visible project count | 1 |
| Visible project names | `reject analyzer` |
| Visible project refs masked | `pq...sk` |
| Visible org/team masked | `nv...mk` |
| Disposable project name visible | No |
| Existing `reject analyzer` only visible | Yes |

Visible Supabase organizations:

| Field | Observation |
| --- | --- |
| Visible organization count | 1 |
| Visible organization names | `reject analyzer` |
| Visible organization ids masked | `nv...mk` |

No full project ref, org id, secret, DB password, service role key, anon key, access token, or provider secret is recorded here.

## Diagnosis result

`UNKNOWN`

The disposable project `passmap-scheduler-v2-disposable-20260605` is not visible in the current Supabase CLI project listing.

Dashboard confirmation is required before classifying the cause as `NOT_CREATED`, `WRONG_ORG`, or `NO_ACCESS`.

## Possible causes

| Candidate cause | Read-only assessment |
| --- | --- |
| Supabase Dashboard project creation may not have completed | Possible. The current CLI listing shows no disposable project. Dashboard confirmation is required. |
| Project may have been created in a different Supabase organization/team | Possible. The current CLI session shows only one visible organization, masked as `nv...mk`, and only the existing `reject analyzer` project. |
| Current CLI account may not have been invited to the disposable project | Possible. A project created in another account or organization would not appear in this CLI session. |
| CLI session may be using a different account/token | Possible. This batch did not inspect or print tokens. The visible organization/project set may not match the Dashboard session used by the user. |
| Project listing may be delayed immediately after creation | Possible but less supported by the current observation because PR #796 already recorded the same visible project count. Dashboard confirmation is still required. |

## User action required

The user should verify the following in the Supabase Dashboard:

- Project name is exactly `passmap-scheduler-v2-disposable-20260605`.
- Region is `Northeast Asia (Seoul)`.
- The organization/team where the project was created is the same organization/team where the existing `reject analyzer` project is visible.
- The current CLI account has access to that organization/project.
- Only masked project ref fragments are shared for comparison, if needed.
- Do not share the full project ref, DB password, anon key, service role key, access token, or provider secret.

## Not done in this batch

- migration apply 없음.
- SQL 실행 없음.
- Supabase SQL Editor 사용 없음.
- RLS SQL 작성 없음.
- migration 수정 없음.
- production/staging DB 접근 없음.
- env/secret 저장 없음.
- DB password 출력/저장/기록 없음.
- 기존 `reject analyzer` project 변경 없음.
- disposable project 설정 변경 없음.
- service role key 저장 없음.
- anon key 저장 없음.
- provider secret import 없음.
- real user data import 없음.
- Vercel production env 연결 없음.
- app env 연결 없음.
- Edge Function 수정 없음.
- frontend 수정 없음.
- provider/live 발송 없음.
- cron/production 설정 없음.

## Next step

A. If the disposable project becomes visible in the same organization:

- Retry disposable project ref separation verification.

B. If the disposable project was created in a different organization:

- Recreate it in the correct organization or grant the current CLI account access, then recheck visibility.

C. If the disposable project was not created:

- Create it directly in the Supabase Dashboard, then recheck visibility.

D. If the cause remains unknown:

- The user should verify the Dashboard project name, region, and organization directly, then provide only masked ref fragments if comparison is needed.

Scheduler v2 notification schema apply verification must not start until disposable project ref separation is `VERIFIED`.
