# PASSMAP Scheduler v2 Dry-run Edge Function Implementation Plan

## 1. Background

PR #691에서 scheduler v2 처리 흐름을 문서화했다. PR #695에서 DB migration 승격 조건을 문서화했다. PR #697에서 Kakao/SMS provider PoC 준비 조건을 문서화했다.

아직 DB v2 테이블은 draft SQL 상태이며 remote DB apply되지 않았다. 따라서 dry-run Edge Function 구현 전에 mock data, draft schema, future production schema 간 경계를 명확히 해야 한다.

이 문서는 `send-experience-recall-reminders-v2` Edge Function을 실제 구현하기 전에 dry-run 구현 범위, 입력/출력, 검증 기준, mock 데이터 전략, 금지사항, 향후 live 전환 조건을 정리한다.

## 2. Dry-run purpose

Dry-run의 목적:

- 실제 발송 없이 due rule 계산을 검증
- channel priority 처리 검증
- contact/consent missing 처리 검증
- delivery claim 후보 검증
- fallbackWouldRun 판단 검증
- result_json 구조 검증
- 기존 weekly reminder와 중복 live 되지 않도록 cutover 전 사전 검증

## 3. Non-goals

이번 dry-run 계획에서 하지 않는 일:

- 실제 Kakao/SMS/Email/Web Push 발송 없음
- provider API 호출 없음
- provider SDK 설치 없음
- env/secret 추가 없음
- remote DB apply 없음
- backfill 없음
- cron 변경 없음
- 기존 weekly reminder off 없음
- 신규 scheduler cron on 없음
- production live 발송 없음

## 4. Function candidate

후보 함수명:

```text
supabase/functions/send-experience-recall-reminders-v2/index.ts
```

주의:

- 이번 작업에서는 파일을 만들지 않는다.
- 함수명은 future implementation candidate일 뿐이다.

## 5. Execution modes

### dry_run

- due rule 후보를 계산
- wouldSend / wouldSkip / fallbackWouldRun 기록
- provider 호출 없음
- 실제 발송 없음

### inspect_only

- 현재 기준으로 due 후보와 skip 사유만 반환
- delivery claim도 만들지 않음
- 운영 디버깅용 후보

### live

- 미래 단계
- 별도 명시 승인 전 금지
- provider 준비, DB apply, contact/consent, cron cutover 완료 후에만 검토

## 6. Input contract

Dry-run 함수 입력 후보:

```json
{
  "mode": "dry_run",
  "now": "2026-05-31T09:00:00.000Z",
  "timezone": "Asia/Seoul",
  "lookbackMinutes": 15,
  "limit": 100,
  "targetPersonId": null,
  "targetRuleId": null,
  "writeLedger": false
}
```

필드 설명:

- mode: `dry_run`, `inspect_only`, 미래 `live` 중 하나. `live`는 기본 reject 대상.
- now: 평가 기준 UTC 시각. 없으면 서버 현재 시각 후보.
- timezone: local slot 계산 기준 timezone.
- lookbackMinutes: due slot 탐색 범위. 상한 필요.
- limit: 한 번에 평가할 rule 수. 상한 필요.
- targetPersonId: 특정 person 디버깅용. 권한 검토 필요.
- targetRuleId: 특정 rule 디버깅용. 권한 검토 필요.
- writeLedger: dry-run ledger write 후보 flag.

주의:

- writeLedger 기본값은 false.
- remote DB apply 전에는 실제 v2 ledger 쓰기를 하지 않음.
- targetPersonId/targetRuleId는 디버깅용이며 권한 검토 필요.

## 7. Data source strategy

### Before DB apply

- 실제 v2 테이블이 없으므로 mock fixture 또는 local-only fixture 기준
- 기존 production 테이블에 쓰기 금지
- 기존 reminder_preferences를 v2로 가정하는 변환은 문서/테스트 fixture 수준에서만 가능
- remote DB write 금지

### After DB schema apply but before live

- reminder_rules_v2 read 가능
- notification_contacts/person_consents read 가능
- reminder_deliveries_v2 write는 별도 승인 전까지 제한
- dry-run ledger write는 별도 flag와 승인 필요

### After backfill

- person_id 기반 due rule 계산 검증
- 기존 weekly reminder와 중복 여부 비교
- row count/report 검증

## 8. Processing steps

1. request validate
2. mode guard
3. current time / local slot 계산
4. due rule 후보 조회 또는 fixture load
5. cadence/timezone/days_of_week/time_local 평가
6. channel priority 조회 또는 fixture load
7. contact 조회 또는 fixture load
8. consent 조회 또는 fixture load
9. wouldSkip / wouldSend 결정
10. fallbackWouldRun 판단
11. result_json 생성
12. optional ledger write는 기본 비활성
13. summary response 반환

## 9. Decision statuses

| Status | 의미 | 사용자 표시 여부 | 운영 로그 여부 | result_json 기록 방식 |
| --- | --- | --- | --- | --- |
| would_send | due rule이며 contact/consent/provider 조건이 충족되어 발송 후보 | 사용자 직접 표시 불필요 | 기록 | decision.status와 reason 기록 |
| would_skip_not_due | 현재 local slot 기준 due가 아님 | 표시 불필요 | 필요 시 sampled 기록 | skip reason 기록 |
| would_skip_disabled_rule | rule이 비활성 상태 | 설정 화면에서 상태 표시 가능 | 기록 | rule enabled=false 기록 |
| would_skip_deleted_rule | rule이 soft deleted 상태 | 표시 불필요 | 기록 | deleted_at 기준 skip 기록 |
| would_skip_contact_missing | 채널에 사용할 연락처 없음 | 설정 화면에서 조치 표시 가능 | 기록 | contact missing reason 기록 |
| would_skip_contact_unverified | 연락처가 인증되지 않음 | 설정 화면에서 인증 필요 표시 | 기록 | contact status 기록 |
| would_skip_consent_missing | 필요한 수신 동의 없음 | 설정 화면에서 동의 필요 표시 | 기록 | missing consentTypes 기록 |
| would_skip_consent_revoked | 수신 동의가 철회됨 | 설정 화면에서 철회 상태 표시 | 기록 | revoked consentTypes 기록 |
| would_skip_provider_not_ready | provider 또는 채널이 준비되지 않음 | 준비 중 표시 가능 | 기록 | provider readiness 기록 |
| would_skip_duplicate_claim | 같은 rule/channel/local slot claim 후보가 이미 있음 | 표시 불필요 | 반드시 기록 | duplicate claimKey 기록 |
| fallback_would_run | primary channel 실패 조건에서 fallback 후보 가능 | 표시 불필요 | 기록 | fallback.wouldRun=true 기록 |
| fallback_would_skip | fallback 조건 미충족 | 표시 불필요 | 기록 | fallback reason 기록 |
| inspect_only | inspect_only 모드에서 평가만 수행 | 운영 도구에서만 표시 | 기록 | mode=inspect_only 기록 |

## 10. Result JSON contract

Dry-run result_json 후보:

```json
{
  "mode": "dry_run",
  "runId": "dryrun_20260531_180000",
  "localSlotKey": "2026-05-31T18:00@Asia/Seoul",
  "rule": {
    "id": "rule_123",
    "personId": "person_123",
    "reminderKind": "experience_recall",
    "cadence": "daily",
    "timeLocal": "18:00",
    "timezone": "Asia/Seoul"
  },
  "channel": {
    "name": "kakao_alimtalk",
    "priority": 1,
    "contactId": "contact_123",
    "consentTypesChecked": [
      "service_notification",
      "experience_recall_reminder",
      "kakao_alimtalk"
    ]
  },
  "decision": {
    "status": "would_send",
    "reason": "due rule with verified contact and granted consent"
  },
  "provider": {
    "name": "solapi",
    "called": false,
    "messageId": null,
    "rawStored": false
  },
  "fallback": {
    "evaluated": true,
    "attempted": false,
    "wouldRun": false,
    "channel": "sms",
    "reason": null
  },
  "ledger": {
    "writeLedger": false,
    "claimKey": "rule_123:kakao_alimtalk:2026-05-31T18:00@Asia/Seoul",
    "duplicateFound": false
  }
}
```

## 11. Summary response contract

함수 응답 summary 후보:

```json
{
  "ok": true,
  "mode": "dry_run",
  "runId": "dryrun_20260531_180000",
  "evaluatedRules": 10,
  "wouldSend": 4,
  "wouldSkip": 5,
  "fallbackWouldRun": 1,
  "providerCalls": 0,
  "messagesSent": 0,
  "ledgerWrites": 0,
  "results": []
}
```

## 12. Safety gates

- mode가 live면 기본 reject
- provider call hard disabled
- env/secret 없어도 동작해야 함
- writeLedger=false 기본값
- remote DB write 금지 모드
- targetPersonId 사용 시 권한/서비스 role 검토 필요
- runId 생성
- limit 적용
- lookbackMinutes 상한 적용
- result_json에 전화번호/이메일 평문 저장 금지
- provider raw response 저장 금지

## 13. Test scenarios

1. 매일 18:00 due rule
2. 평일 rule이 주말에 skip
3. custom_days rule
4. disabled rule skip
5. deleted rule skip
6. contact missing skip
7. contact unverified skip
8. consent missing skip
9. consent revoked skip
10. Kakao wouldSend
11. Kakao provider_not_ready skip
12. Kakao failure would trigger SMS fallback 후보
13. SMS fallback consent missing skip
14. duplicate claim wouldSkip
15. inspect_only mode는 ledger write 없음
16. writeLedger=false면 ledger write 없음
17. providerCalls=0 보장
18. messagesSent=0 보장

## 14. Verification commands for future implementation

미래 구현 시 검증 명령 후보:

- npm run lint
- npm run build
- supabase functions serve send-experience-recall-reminders-v2
- curl dry-run request
- local fixture test
- grep provider call disabled
- git diff --check

주의:

- 이번 문서 작업에서는 위 명령을 실행하지 않아도 됨.
- 미래 구현 계획으로만 작성.

## 15. Cutover relation

원칙:

- dry-run scheduler v2는 기존 weekly cron을 끄지 않음
- dry-run scheduler v2는 실제 발송하지 않음
- 기존 weekly cron과 v2 live scheduler를 동시에 live로 두면 안 됨
- cutover는 별도 Protected 승인 필요
- dry-run 결과와 기존 weekly reminder 결과를 비교하는 report가 필요

## 16. Open questions

- DB apply 전 fixture 기반으로 먼저 구현할지 여부
- dry-run ledger write를 언제 허용할지
- result_json 최종 schema
- retry/claim 정책
- service role 사용 범위
- local/staging 환경 여부
- provider mock adapter 위치
- 기존 reminder_preferences를 fixture로 변환할지 여부

## 17. Guardrails

이번 작업에서 절대 금지:

- Edge Function 파일 생성 금지
- Edge Function 구현 금지
- Edge Function deploy 금지
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
- Supabase SQL 작성/수정 금지
- Supabase SQL Editor 실행 금지
- Supabase CLI db push/apply 금지
- remote DB apply 금지
- 기존 데이터 backfill 금지
- cron 변경 금지
- Vercel/Supabase deploy 금지
- production 설정 변경 금지
- React/UI 구현 금지
- src/App.jsx 수정 금지
- 현재 dirty 상태의 src/App.jsx 또는 임시/QA 산출물 정리/삭제/수정 금지

## 18. Next actions

19. PR 리뷰 후 문서 merge
20. person_id account-linking UX 상세 문서 보강 여부 확인
21. scheduler v2 dry-run Edge Function 구현 여부 별도 승인
22. DB schema apply 여부 별도 승인
23. 실제 provider/env/secret/발송은 별도 명시 승인 후 진행
