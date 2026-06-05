# Scheduler v2 Disposable Project Ref Separation Retry Result

## Purpose

This document records the disposable Supabase project ref separation retry verification result for scheduler v2.

No project setting, database, migration, SQL, secret, environment variable, frontend file, Edge Function, provider/live path, or cron configuration was changed.

## Prior documents

- PR #798 result document: `docs/scheduler-v2-supabase-project-visibility-diagnosis-20260605.md`
- PR #798 merge commit: `5991f38ad1ffae4012920f1ce6e3be22dcbf0356`
- Earlier ref separation result document: `docs/scheduler-v2-disposable-project-ref-separation-result-20260605.md`

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
| Visible project count | 2 |
| Visible project names | `reject analyzer`, `passmap-scheduler-v2-disposable-20260605` |
| Visible project refs masked | `pq...sk`, `rk...hu` |
| Visible org/team masked | `nv...mk` |
| Disposable project name visible | Yes |
| Existing `reject analyzer` project visible | Yes |
| Existing `reject analyzer` and disposable project refs differ | Yes |
| Disposable project region | `Northeast Asia (Seoul)` / `ap-northeast-2` |

Visible Supabase organizations:

| Field | Observation |
| --- | --- |
| Visible organization count | 1 |
| Visible organization names | `reject analyzer` |
| Visible organization ids masked | `nv...mk` |

No full project ref, org id, secret, DB password, service role key, anon key, access token, or provider secret is recorded here.

## Separation check

`VERIFIED`

The disposable project `passmap-scheduler-v2-disposable-20260605` is visible in the current Supabase CLI project listing.

Read-only masked comparison confirms:

- Existing `reject analyzer` project masked ref: `pq...sk`.
- Disposable project masked ref: `rk...hu`.
- The two refs are different.
- The disposable project is in `Northeast Asia (Seoul)`, matching `ap-northeast-2`.
- The disposable project was not connected to app env, Vercel production env, provider/live secrets, real user data, or cron by this batch.
- Production/staging DB access was not performed. Separation from production/staging is documented only by masked ref comparison against the visible existing project context and by the absence of any app/Vercel/provider/live/cron connection changes in this batch.

## Verification result

`VERIFIED`: disposable project is visible and ref separation from the existing `reject analyzer` project is confirmed in the current Supabase CLI session.

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

## Next approval gate

The next schema apply verification must not proceed until the user gives a second explicit approval, even though this ref separation retry is `VERIFIED`.

To proceed with scheduler v2 notification schema migration apply verification later, the user must explicitly approve with this intent:

```txt
Disposable project ref가 production/staging과 다름을 확인했습니다.
이 disposable project에 scheduler v2 notification schema migration apply verification을 진행해도 됩니다.
```

Until that approval is given, scheduler v2 notification schema apply verification remains blocked by process, not by project visibility.
