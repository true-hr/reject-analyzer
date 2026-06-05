# Scheduler v2 Disposable Schema Apply Verification Result

## Purpose

This document records the disposable Supabase project migration apply verification result for the scheduler v2 notification schema draft.

The target was the disposable project `passmap-scheduler-v2-disposable-20260605` only. Production, staging, the existing `reject analyzer` database, Vercel, env/secrets, providers, Edge Functions, and frontend files were not changed.

## Prior document

- PR #800 result document: `docs/scheduler-v2-disposable-project-ref-separation-retry-result-20260605.md`
- PR #800 merge commit on `origin/main`: `f3b9d493`
- PR #800 verification status: `VERIFIED`
- User second approval was provided before this batch:

```txt
Disposable project ref가 production/staging과 다름을 확인했습니다.
이 disposable project에 scheduler v2 notification schema migration apply verification을 진행해도 됩니다.
```

## Preconditions

Read-only prerequisite checks passed:

| Check | Result |
| --- | --- |
| `git fetch origin main` | Completed |
| PR #800 result document on `origin/main` | Present |
| `VERIFIED` anchor on `origin/main` | Present |
| `schema apply verification remains blocked` anchor on `origin/main` | Present |
| Supabase CLI version | `2.105.0` |

## Target confirmation

Read-only project visibility was confirmed before apply:

| Field | Observation |
| --- | --- |
| Visible project count | 2 |
| Existing project name | `reject analyzer` |
| Disposable project name | `passmap-scheduler-v2-disposable-20260605` |
| Existing project masked ref | `pq...sk` |
| Disposable project masked ref | `rk...hu` |
| Refs differ | Yes |
| Disposable region | `Northeast Asia (Seoul)` / `ap-northeast-2` |
| Linked project before target switch | Existing `reject analyzer` project, masked `pq...sk` |
| Linked project after target switch | Disposable project, masked `rk...hu` |

No full project ref, org id, DB password, anon key, service role key, access token, or provider secret is recorded here.

## Migration target

Only this migration draft was present and targeted:

```txt
supabase/migrations/20260604000000_scheduler_v2_notification_schema.sql
```

The migration file was not modified. No new migration file was created.

Before apply, `supabase migration list --linked` showed:

| Local | Remote | Meaning |
| --- | --- | --- |
| `20260604000000` | empty | The scheduler v2 notification schema migration was pending on the disposable project. |

`supabase db push --linked --dry-run` showed exactly one migration would be pushed:

```txt
20260604000000_scheduler_v2_notification_schema.sql
```

## Apply result

`APPLIED_VERIFIED`

`supabase db push --linked` was run only after confirming the linked project was the disposable project masked as `rk...hu`.

The command completed with exit code 0 and applied:

```txt
20260604000000_scheduler_v2_notification_schema.sql
```

Post-apply verification via `supabase migration list --linked` showed:

| Local | Remote | Meaning |
| --- | --- | --- |
| `20260604000000` | `20260604000000` | The scheduler v2 notification schema migration is recorded as applied on the disposable project. |

A second post-apply `supabase db push --linked --dry-run` check was attempted as an additional confirmation, but it failed with a Supabase CLI login role password authentication error and requested `SUPABASE_DB_PASSWORD`. No DB password was entered, stored, printed, or recorded. This did not change the migration history result above.

## Object-level verification

`NOT_PERFORMED`

Object-level verification for enums, tables, indexes, and constraints was not performed in this batch.

Reason:

- The migration history check succeeded after `supabase db push --linked`.
- `supabase migration list --linked` showed Local and Remote both at `20260604000000`.
- A follow-up CLI check requested `SUPABASE_DB_PASSWORD`.
- This batch prohibited DB password input, storage, output, or recording.
- No DB password was entered, stored, printed, or recorded.

Therefore, this PR verifies migration application through Supabase migration history only. Enum/table/index/constraint existence should be verified in a separate disposable DB object verification batch with an approved non-recorded password handling path or another safe read-only method.

## Not done in this batch

- production/staging DB 접근 없음.
- 기존 `reject analyzer` project apply 없음.
- Supabase SQL Editor 사용 없음.
- RLS SQL 작성 없음.
- migration 파일 작성/수정 없음.
- 새 migration 작성 없음.
- rollback SQL 작성 없음.
- env/secret 변경 없음.
- DB password 출력/저장/기록 없음.
- service role key 저장 없음.
- anon key 저장 없음.
- access token 기록 없음.
- provider secret import 없음.
- real user data import 없음.
- Vercel production env 연결 없음.
- app env 연결 없음.
- Edge Function 수정 없음.
- frontend 수정 없음.
- provider/live 발송 없음.
- cron/production 설정 없음.

## Verification result

The disposable Supabase project migration apply verification is `APPLIED_VERIFIED` based on:

- disposable project visibility in `supabase projects list`;
- masked ref separation from the existing `reject analyzer` project;
- disposable project selected as the linked project before apply;
- dry-run showing exactly one pending migration before apply;
- `supabase db push --linked` exit code 0;
- post-apply `supabase migration list --linked` showing Local and Remote both at `20260604000000`.

The object-level verification status is `NOT_PERFORMED`. The only incomplete secondary check is the second post-apply dry-run due to CLI password authentication. No password or secret was handled.

## Next steps

1. PR #801 merge.
2. Disposable DB object-level verification plan.
3. Disposable DB object-level verification.
4. RLS SQL migration draft.
5. Disposable RLS apply verification.
6. staging plan.
