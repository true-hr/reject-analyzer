# PASSMAP Scheduler v2 Local Serve Dry-run QA Result

## Execution Time

- 2026-06-03 22:20:27 +09:00

## Branch / HEAD

- Branch: `qa/scheduler-v2-local-serve-dry-run-20260603`
- Base: `origin/main`
- HEAD: `c6ee6a4b`

## Precondition Check

Local serve QA was not executed because required preconditions were not satisfied.

- PR #718 `docs: add scheduler v2 local serve QA runbook`: open, not merged into `main`
- `docs/scheduler-v2-local-serve-dry-run-qa-20260603.md`: missing from `origin/main`
- `supabase/functions/send-experience-recall-reminders-v2/index.ts`: present
- `supabase/functions/send-experience-recall-reminders-v2/contract.ts`: missing from `origin/main`
- `supabase/functions/send-experience-recall-reminders-v2/contract_test.ts`: missing from `origin/main`

Because the runbook and contract files are missing from `main`, the scheduler v2 local serve QA runbook cannot be executed safely from the requested baseline.

## Environment Check

No installation commands were executed.

| Tool | Result | Notes |
| --- | --- | --- |
| Node | `v25.6.1` | Available |
| npm | `11.9.0` | Available |
| Deno | missing | `deno` command not found |
| Supabase CLI | missing | `supabase` command not found |
| Docker | missing | `docker` command not found |
| Docker daemon | not checked successfully | `docker info` could not run because Docker command is missing |

## Guardrail Scan

Command attempted against the requested scope:

```bash
rg -n "SERVICE_ROLE|SUPABASE_SERVICE_ROLE|SUPABASE_DB|API_KEY|SECRET|KAKAO|SMS|ALIMTALK|CRON|Deno\.env|createClient|supabase\.from|insert\(|update\(|upsert\(|delete\(|fetch\(" supabase/functions/send-experience-recall-reminders-v2 docs/scheduler-v2-local-serve-dry-run-qa-20260603.md
```

Result:

- The command could not complete for the full requested scope because `docs/scheduler-v2-local-serve-dry-run-qa-20260603.md` is missing from `main`.
- A follow-up scan against the existing function directory returned no matches:

```bash
rg -n "SERVICE_ROLE|SUPABASE_SERVICE_ROLE|SUPABASE_DB|API_KEY|SECRET|KAKAO|SMS|ALIMTALK|CRON|Deno\.env|createClient|supabase\.from|insert\(|update\(|upsert\(|delete\(|fetch\(" supabase/functions/send-experience-recall-reminders-v2
```

## Deno Check / Test Result

Not executed.

Reasons:

- `deno` command is not installed.
- `contract.ts` is missing from `origin/main`.
- `contract_test.ts` is missing from `origin/main`.

## Local Serve Execution

Local serve was not executed.

Reasons:

- PR #718 is not merged into `main`.
- Required runbook file is missing from `main`.
- Required contract files are missing from `main`.
- Deno is not installed.
- Supabase CLI is not installed.
- Docker is not installed.

Endpoint was therefore not used:

```text
http://127.0.0.1:54321/functions/v1/send-experience-recall-reminders-v2
```

## QA Result Table

| Scenario | Expected status | Actual status | Expected counters | Actual counters | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GET health | 200 | Not run | providerCalls/messagesSent/ledgerWrites = 0 | Not observed | BLOCKED | local serve not started |
| OPTIONS preflight | 204 | Not run | no side effect | Not observed | BLOCKED | local serve not started |
| default POST dry_run | 200 | Not run | providerCalls/messagesSent/ledgerWrites = 0 | Not observed | BLOCKED | local serve not started |
| explicit 18:00 KST dry_run | 200 | Not run | providerCalls/messagesSent/ledgerWrites = 0 | Not observed | BLOCKED | local serve not started |
| inspect_only | 200 | Not run | providerCalls/messagesSent/ledgerWrites = 0 | Not observed | BLOCKED | local serve not started |
| live rejected | 403 | Not run | providerCalls/messagesSent/ledgerWrites = 0 | Not observed | BLOCKED | local serve not started |
| invalid mode | 400 | Not run | providerCalls/messagesSent/ledgerWrites = 0 | Not observed | BLOCKED | local serve not started |
| invalid now | 400 | Not run | providerCalls/messagesSent/ledgerWrites = 0 | Not observed | BLOCKED | local serve not started |
| invalid timezone | 400 | Not run | providerCalls/messagesSent/ledgerWrites = 0 | Not observed | BLOCKED | local serve not started |
| writeLedger forced false | 200 | Not run | ledgerWrites = 0 | Not observed | BLOCKED | local serve not started |
| targetRuleId fallback | 200 | Not run | providerCalls/messagesSent/ledgerWrites = 0 | Not observed | BLOCKED | local serve not started |
| targetRuleId duplicate claim | 200 | Not run | providerCalls/messagesSent/ledgerWrites = 0 | Not observed | BLOCKED | local serve not started |
| targetPersonId fallback | 200 | Not run | providerCalls/messagesSent/ledgerWrites = 0 | Not observed | BLOCKED | local serve not started |

## Failure / Stop Status

QA stopped before local serve.

Stop conditions / unmet prerequisites:

- PR #718 is open and not merged into `main`.
- Required runbook file is missing from `main`.
- Required contract files are missing from `main`.
- Deno is not installed.
- Supabase CLI is not installed.
- Docker is not installed.

## Guardrails Confirmation

- No `supabase functions serve` execution.
- No `supabase functions deploy`.
- No `supabase db push`.
- No `supabase migration up`.
- No remote DB apply.
- No Supabase SQL Editor execution.
- No provider API call.
- No Kakao/SMS/Email/Web Push sending.
- No env/secret add or edit.
- No service role key usage.
- No real project ref usage.
- No production Supabase project connection.
- No cron create or edit.
- No Vercel/Supabase production setting changes.
- No direct push to `main`.
- No force push.
- No existing dirty worktree cleanup, deletion, or modification.

## Next Action

Before rerunning this QA batch:

1. Merge PR #718 into `main`.
2. Confirm `contract.ts` and `contract_test.ts` exist on latest `origin/main`.
3. Prepare Deno, Supabase CLI, and Docker outside this task.
4. Rerun the local serve QA batch from a fresh `origin/main` worktree.
