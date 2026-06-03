# PASSMAP Scheduler v2 Dry-run Skeleton QA

## 1. Background

PR #703에서 mock/fixture 기반 scheduler v2 dry-run skeleton이 추가되었다.

대상 파일:

```text
supabase/functions/send-experience-recall-reminders-v2/index.ts
```

이 함수는 아직 Supabase에 deploy되지 않았다. provider, DB, cron, env/secret과 연결되지 않았으며, repository에 skeleton 파일만 추가된 상태다.

이번 QA 목표는 기능 발송 검증이 아니다. QA 목표는 “실수로 발송/쓰기/배포하지 않는지” 확인하는 것이다. 따라서 실제 `serve`, `deploy`, DB apply, cron 연결, provider 호출, 메시지 발송은 수행하지 않는다.

## 2. QA goals

- `live` mode가 reject되는지 확인한다.
- `providerCalls`, `messagesSent`, `ledgerWrites`가 항상 `0`인지 확인한다.
- `writeLedger=true`가 실제 write로 이어지지 않는지 확인한다.
- env/secret이 필요 없는지 확인한다.
- DB client 또는 `createClient`이 없는지 확인한다.
- provider API 호출이 없는지 확인한다.
- fixture 기반 `dry_run` / `inspect_only` response shape이 문서와 맞는지 확인한다.

## 3. Static safety checklist

정적 검색으로 확인해야 할 것:

- [ ] `Deno.env` 없음
- [ ] `createClient` 없음
- [ ] `fetch(` 없음
- [ ] `webpush` 없음
- [ ] `sendNotification` 없음
- [ ] `sendEmail` 없음
- [ ] `sendSms` 없음
- [ ] `supabase.from` 없음
- [ ] `insert(` 없음
- [ ] `update(` 없음
- [ ] `upsert(` 없음
- [ ] `delete(` 없음
- [ ] provider key/API key/secret 문자열 없음
- [ ] `providerCalls: 0` 존재
- [ ] `messagesSent: 0` 존재
- [ ] `ledgerWrites: 0` 존재
- [ ] `live` mode reject 존재
- [ ] `writeLedger=true` 강제 false 또는 warning 존재

검색 예시:

```bash
grep -R "Deno.env" supabase/functions/send-experience-recall-reminders-v2/index.ts
grep -R "createClient" supabase/functions/send-experience-recall-reminders-v2/index.ts
grep -R "fetch(" supabase/functions/send-experience-recall-reminders-v2/index.ts
grep -R "supabase.from" supabase/functions/send-experience-recall-reminders-v2/index.ts
grep -R "providerCalls: 0" supabase/functions/send-experience-recall-reminders-v2/index.ts
```

## 4. Manual review checklist

- [ ] 파일 상단 safety comment 확인
- [ ] `GET` health response 확인
- [ ] `POST` request normalize 확인
- [ ] invalid JSON 처리 확인
- [ ] invalid mode 처리 확인
- [ ] live mode 403 reject 확인
- [ ] invalid timezone 처리 확인
- [ ] limit/lookback clamp 확인
- [ ] fixture rule coverage 확인
- [ ] decision statuses coverage 확인
- [ ] fallback evaluation 확인
- [ ] `inspect_only` 처리 확인
- [ ] final summary response 확인
- [ ] provider `called: false` 확인
- [ ] `rawStored: false` 확인
- [ ] ledger `writeLedger: false` 확인

## 5. Expected request examples

주의:

- 이번 문서 작업에서 curl을 실행하지 않는다.
- 아래 예시는 미래 local serve 또는 deployed test 환경에서만 실행 후보이다.
- `supabase functions serve`는 local serve 후보일 뿐 deploy가 아니다.
- `supabase functions deploy`는 금지다.

예시 1: `dry_run`

```bash
curl -X POST 'http://localhost:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "now": "2026-06-03T09:00:00.000Z",
    "timezone": "Asia/Seoul",
    "lookbackMinutes": 15,
    "limit": 100,
    "writeLedger": false
  }'
```

예시 2: `inspect_only`

```bash
curl -X POST 'http://localhost:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "inspect_only",
    "now": "2026-06-03T09:00:00.000Z",
    "timezone": "Asia/Seoul"
  }'
```

예시 3: `live` reject

```bash
curl -X POST 'http://localhost:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "live"
  }'
```

예시 4: `writeLedger` forced false

```bash
curl -X POST 'http://localhost:54321/functions/v1/send-experience-recall-reminders-v2' \
  -H 'Content-Type: application/json' \
  -d '{
    "mode": "dry_run",
    "writeLedger": true
  }'
```

## 6. Expected response assertions

### `dry_run` expected

- `ok: true`
- `mode: dry_run`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`
- `safety.fixtureOnly: true`
- `safety.providerCallsDisabled: true`
- `safety.messageSendingDisabled: true`
- `safety.ledgerWritesDisabled: true`
- `safety.secretsRequired: false`
- `safety.liveModeRejected: true`
- `results` 배열 존재

### `inspect_only` expected

- `ok: true`
- `mode: inspect_only`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`
- decision status가 `inspect_only`
- `inspectedStatus`가 원래 평가 상태를 보존

### `live` expected

- HTTP 403
- `ok: false`
- `error: LIVE_MODE_REJECTED`
- `providerCalls: 0`
- `messagesSent: 0`
- `ledgerWrites: 0`

### `writeLedger=true` expected

- HTTP 200
- `ledgerWrites: 0`
- warning 포함
- `result.ledger.writeLedger=false`

## 7. Fixture scenario coverage

fixture가 포함해야 하는 시나리오:

- daily due rule
- weekdays rule
- custom_days rule
- not due rule
- disabled rule
- deleted rule
- contact missing
- contact unverified
- consent missing
- consent revoked
- provider not ready
- Kakao `would_send`
- Kakao simulated primary failure
- SMS fallback `would_run`
- SMS fallback `would_skip`
- duplicate claim
- `inspect_only`

## 8. Future local validation commands

이번 작업에서는 실행하지 않아도 되는 미래 실행 후보:

```bash
git status --short --branch
git diff --check
grep -R "Deno.env" supabase/functions/send-experience-recall-reminders-v2/index.ts
grep -R "createClient" supabase/functions/send-experience-recall-reminders-v2/index.ts
grep -R "fetch(" supabase/functions/send-experience-recall-reminders-v2/index.ts
grep -R "insert(" supabase/functions/send-experience-recall-reminders-v2/index.ts
grep -R "providerCalls: 0" supabase/functions/send-experience-recall-reminders-v2/index.ts
```

Deno/Supabase가 준비된 미래 환경 후보:

```bash
deno check supabase/functions/send-experience-recall-reminders-v2/index.ts
supabase functions serve send-experience-recall-reminders-v2
```

주의:

- `supabase functions serve`는 local serve 후보일 뿐 deploy가 아니다.
- `supabase functions deploy`는 금지다.

## 9. Merge readiness checklist

- [ ] 변경 파일이 QA 문서 1개뿐인가
- [ ] 기존 Edge Function skeleton 코드를 수정하지 않았는가
- [ ] `src/App.jsx`를 건드리지 않았는가
- [ ] `supabase/sql`을 건드리지 않았는가
- [ ] env/secret을 건드리지 않았는가
- [ ] deploy/cron/provider 관련 변경이 없는가
- [ ] 문서에 금지사항이 명확히 들어갔는가

## 10. Guardrails

이번 작업에서 절대 금지:

- Edge Function 코드 수정 금지
- Edge Function deploy 금지
- Supabase functions deploy 금지
- Supabase SQL Editor 실행 금지
- Supabase CLI db push/apply/reset 금지
- remote DB apply 금지
- 기존 데이터 backfill 금지
- provider API 호출 금지
- provider SDK 설치 금지
- env/secret 추가 금지
- API key 발급/복사/저장 금지
- Kakao/SMS adapter 구현 금지
- 인증번호 발송 구현 금지
- 인증번호 실제 발송 금지
- 문자/SMS 발송 금지
- 카카오톡/알림톡 발송 금지
- 이메일 발송 구현 금지
- 이메일 실제 발송 금지
- Web Push 실제 발송 금지
- cron 변경 금지
- Vercel/Supabase deploy 금지
- production 설정 변경 금지
- React/UI 구현 금지
- `src/App.jsx` 수정 금지
- 현재 dirty 상태의 `src/App.jsx` 또는 임시/QA 산출물 정리/삭제/수정 금지

허용 파일:

- `docs/scheduler-v2-dry-run-qa-20260603.md`

읽기 허용:

- `supabase/functions/send-experience-recall-reminders-v2/index.ts`
- `docs/scheduler-v2-dry-run-plan-20260531.md`

금지 파일:

- `supabase/functions/send-experience-recall-reminders-v2/index.ts`
- `src/App.jsx`
- `src/**`
- `supabase/sql/**`
- `supabase/sql/drafts/**`
- 기존 Edge Function 파일
- `package.json`
- `package-lock.json`
- `.env*`
- `.github/**`
- Vercel 설정 파일
- 현재 dirty/untracked 파일 전체

## 11. Next actions

12. PR 리뷰 후 문서 merge
13. Deno 사용 가능 환경에서 type check 여부 검토
14. local serve 기반 `dry_run` 수동 QA 여부 별도 승인
15. skeleton 코드 보강 필요 여부 검토
16. Supabase deploy / DB apply / cron / provider 연동은 별도 명시 승인 후 진행
