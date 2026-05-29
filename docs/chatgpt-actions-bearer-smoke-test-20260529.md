# PASSMAP ChatGPT Action Bearer Smoke Test Guide

## 1. 목적

이 문서는 사람이 직접 preview 또는 production endpoint에서 `chatgpt_action_save_experience` 내부 smoke test를 수행할 때 따르는 체크리스트다.

범위는 내부 Bearer-token smoke test로 제한한다. 이 테스트는 ChatGPT Actions 외부 사용자용 운영 인증 검증이 아니며, 운영 정식 인증은 OAuth Protected 작업 이후에만 가능하다.

이번 문서는 절차 문서이며 다음 작업은 포함하지 않는다.

- 실제 API 호출
- 실제 Bearer token 발급, 복사, 저장
- env/secrets 변경
- Vercel 또는 Supabase 설정 변경
- deploy 또는 redeploy
- DB migration
- GPT editor 등록

## 2. 전제 조건

- 대상 endpoint wrapper가 배포된 preview 또는 production endpoint를 사람이 직접 알고 있어야 한다.
- 테스트 수행자는 PASSMAP 로그인 가능한 내부 계정을 사용한다.
- 유효 Bearer token이 필요한 케이스는 별도 보안 절차로 확보한다. 이 문서에는 실제 token을 적지 않는다.
- 테스트 전후로 저장 row 생성 여부를 확인할 수 있는 DB 조회 권한 또는 AI Inbox 화면 접근 권한이 있어야 한다.
- 모든 요청은 `POST /api/save-analysis-run?action=chatgpt_action_save_experience`를 대상으로 한다.

## 3. 절대 하지 말 것

- 실제 Bearer token을 문서, PR, 이슈, 채팅, 로그, 스크린샷에 남기지 않는다.
- token이 포함된 터미널 출력이나 브라우저 화면을 캡처하지 않는다.
- raw ChatGPT 전체 대화, 전체 transcript, message array를 보내지 않는다.
- `evidenceTexts`에는 짧은 근거 snippet만 넣는다.
- 외부 사용자용 운영 인증으로 Bearer-token smoke 결과를 해석하지 않는다.
- OAuth, env/secrets, GPT editor 등록, production smoke를 이 문서 작업과 섞지 않는다.
- 실패 케이스에서 저장 row가 생성되면 성공으로 처리하지 않는다.

## 4. 테스트 대상 endpoint

```text
POST https://<PASSMAP_API_HOST>/api/save-analysis-run?action=chatgpt_action_save_experience
```

필수 header:

```text
Content-Type: application/json
Authorization: Bearer <PASSMAP_SUPABASE_ACCESS_TOKEN>
```

`Authorization` header는 유효 token이 필요한 테스트에서만 사용한다. 토큰 없음 케이스에서는 header 자체를 넣지 않는다.

## 5. 테스트 케이스

### A. 토큰 없음

절차:

- `Authorization` header 없이 요청한다.
- 저장 가능한 정상 payload 형태를 사용하되 token만 제거한다.

기대 결과:

- HTTP `401` 또는 응답 body의 `AUTH_REQUIRED`.
- 저장 row가 생성되지 않아야 한다.

실패 판정:

- `raw_sources`, `experience_cards`, `experience_evidence` 중 저장 row가 생성되면 실패.

### B. 잘못된 토큰

절차:

- 다음 header로 요청한다.

```text
Authorization: Bearer invalid-token
```

기대 결과:

- HTTP `401` 또는 응답 body의 `AUTH_REQUIRED`.
- 저장 row가 생성되지 않아야 한다.

실패 판정:

- 잘못된 token 요청으로 저장 row가 생성되면 실패.

### C. raw transcript 금지 필드 포함

전제:

- 유효 Bearer token을 사용한다.

절차:

- payload에 아래 필드 중 하나 이상을 포함한다.

```text
rawText
rawConversationText
fullTranscript
messages
```

기대 결과:

- 응답 body에 `RAW_TEXT_NOT_ALLOWED`.
- 저장 row가 생성되지 않아야 한다.

실패 판정:

- raw transcript 계열 필드가 포함된 요청이 저장되면 실패.
- `raw_sources.raw_text`에 전체 대화 또는 긴 원문이 저장되면 실패.

### D. userConfirmed false

절차:

- 유효 Bearer token을 사용한다.
- payload에 `userConfirmed: false`를 넣는다.

기대 결과:

- 응답 body에 `USER_CONFIRMATION_REQUIRED`.
- 저장 row가 생성되지 않아야 한다.

실패 판정:

- 사용자 확인 없는 요청이 저장되면 실패.

### E. 정상 저장

절차:

- 유효 Bearer token을 사용한다.
- `userConfirmed: true`를 넣는다.
- `sourcePlatform: "chatgpt"`를 넣는다.
- `importMethod: "chatgpt_action_save_experience"`를 넣는다.
- `title`, `situation`, `task`, `actions`, `evidenceTexts`를 포함한다.

기대 결과:

- `ok: true`
- `experienceCardId` 반환
- `status: "accepted"`
- `message: "PASSMAP AI Inbox에 저장되었습니다."`

실패 판정:

- 인증된 사용자와 다른 사용자에게 저장되면 실패.
- `status`가 `accepted`가 아니면 실패.
- `raw_sources.raw_text`가 `null`이 아니면 실패.

### F. AI Inbox 확인

절차:

- PASSMAP에 로그인한다.
- AI Inbox로 이동한다.
- 테스트에서 저장한 카드를 확인한다.

확인 기준:

- 저장 카드가 보인다.
- `sourcePlatform`이 `chatgpt`로 식별된다.
- evidence snippet이 노출된다.
- raw full transcript가 노출되지 않는다.

실패 판정:

- 카드가 보이지 않으면 실패 또는 화면/권한 확인 필요.
- evidence snippet 대신 전체 대화 원문이 노출되면 실패.

### G. 이력서 재료로 확정

절차:

- AI Inbox 카드에서 "이력서 재료로 확정"을 실행한다.

기대 결과:

- 카드 상태가 `converted`로 변경된다.
- 이력서 재료함에서 확인 가능하다.
- `metadata.importMethod = "chatgpt_action_save_experience"` guard 때문에 막히지 않아야 한다.

실패 판정:

- 상태 변경이 guard에 의해 거부되면 실패.
- 상태가 바뀌었는데 이력서 재료함에서 확인되지 않으면 실패 또는 후속 화면 동기화 확인 필요.

## 6. 요청 payload 예시

실제 token은 반드시 placeholder로 둔다.

```bash
curl -X POST "https://<PASSMAP_API_HOST>/api/save-analysis-run?action=chatgpt_action_save_experience" \
  -H "Authorization: Bearer <PASSMAP_SUPABASE_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  --data '{
    "sourcePlatform": "chatgpt",
    "importMethod": "chatgpt_action_save_experience",
    "sourceConversationTitle": "AI 업무기록 자동 회수 시스템 테스트",
    "title": "ChatGPT Actions 저장 wrapper smoke test",
    "situation": "PASSMAP에서 ChatGPT Actions로 구조화된 업무 경험 후보를 저장하는 내부 테스트를 준비했다.",
    "task": "무인증 저장을 막고, raw transcript 없이 짧은 근거만 저장되는지 확인해야 했다.",
    "actions": [
      "Bearer token guard를 통과한 요청만 저장되는지 확인했다.",
      "raw transcript 계열 필드가 거부되는지 확인했다.",
      "저장된 카드가 AI Inbox에 accepted 상태로 표시되는지 확인했다."
    ],
    "result": "내부 smoke test 기준과 운영 OAuth 전환 전 검증 범위를 분리했다.",
    "skills": ["서비스기획", "API 검증", "보안 설계"],
    "jobTags": ["서비스기획", "프로덕트"],
    "industryTags": ["HR테크", "AI"],
    "evidenceTexts": [
      "무인증 public write는 만들지 않는다.",
      "raw_sources.raw_text는 null로 유지한다."
    ],
    "riskNotes": [
      "Bearer token 방식은 내부 smoke 전용이며 외부 운영은 OAuth가 필요하다."
    ],
    "privacyFlags": ["raw_text_not_stored"],
    "userConfirmed": true,
    "clientTraceId": "manual-smoke-20260529-001"
  }'
```

raw transcript 거부 확인 예시:

```json
{
  "sourcePlatform": "chatgpt",
  "importMethod": "chatgpt_action_save_experience",
  "title": "raw transcript rejection smoke",
  "situation": "raw transcript field rejection을 확인한다.",
  "task": "금지 필드가 저장 전에 거부되는지 확인한다.",
  "actions": ["금지 필드를 포함해 요청한다."],
  "evidenceTexts": ["짧은 snippet만 허용한다."],
  "userConfirmed": true,
  "rawText": "DO_NOT_SEND_REAL_TRANSCRIPT"
}
```

## 7. 기대 응답

인증 실패:

```json
{
  "ok": false,
  "code": "AUTH_REQUIRED",
  "message": "Authorization Bearer token required",
  "retryable": false
}
```

raw transcript 거부:

```json
{
  "ok": false,
  "code": "RAW_TEXT_NOT_ALLOWED",
  "message": "Full raw conversation text must not be sent to PASSMAP.",
  "retryable": false
}
```

사용자 확인 누락:

```json
{
  "ok": false,
  "code": "USER_CONFIRMATION_REQUIRED",
  "message": "userConfirmed must be true before saving.",
  "retryable": false
}
```

정상 저장:

```json
{
  "ok": true,
  "experienceCardId": "<created-card-id>",
  "status": "accepted",
  "inboxUrl": "https://passmap-app.vercel.app/#ai-inbox",
  "message": "PASSMAP AI Inbox에 저장되었습니다."
}
```

HTTP status와 response body가 모두 확인 대상이다. 문서의 message 문구와 실제 응답 문구가 다르면, 실제 구현값을 기준으로 기록하되 같은 보안 의미인지 확인한다.

## 8. DB/화면 확인 기준

DB 조회는 예시로만 둔다. 이 문서 작업에서는 실제 DB를 실행하지 않는다.

조회 예시:

```sql
select
  rs.id as raw_source_id,
  rs.raw_text,
  rs.metadata->>'importMethod' as raw_import_method,
  rs.metadata->>'sourcePlatform' as raw_source_platform,
  ec.id as experience_card_id,
  ec.status,
  ec.metadata->>'importMethod' as card_import_method
from raw_sources rs
join experience_cards ec on ec.source_id = rs.id
where ec.id = '<experienceCardId>';
```

evidence 조회 예시:

```sql
select
  evidence_type,
  evidence_text
from experience_evidence
where experience_card_id = '<experienceCardId>';
```

확인할 항목:

- `raw_sources.raw_text IS NULL`
- `raw_sources.metadata.importMethod = "chatgpt_action_save_experience"`
- `raw_sources.metadata.sourcePlatform = "chatgpt"`
- `experience_cards.status = "accepted"`
- `experience_cards.metadata.importMethod = "chatgpt_action_save_experience"`
- `experience_evidence.evidence_type = "chatgpt_action_snippet"` 또는 실제 구현값
- `experience_evidence.evidence_text`에는 짧은 snippet만 존재
- AI Inbox에서 저장 카드가 보인다.
- AI Inbox에서 raw full transcript가 보이지 않는다.
- "이력서 재료로 확정" 후 상태가 `converted`로 바뀌고 이력서 재료함에서 확인된다.

## 9. 실패 시 판정 기준

즉시 실패:

- token 없음 또는 잘못된 token 요청이 저장된다.
- raw transcript 금지 필드 포함 요청이 저장된다.
- `userConfirmed: false` 요청이 저장된다.
- `raw_sources.raw_text`에 전체 대화 또는 긴 원문이 저장된다.
- token 또는 개인정보가 로그/스크린샷/문서에 노출된다.
- 정상 저장 카드가 인증된 사용자와 다른 사용자에게 귀속된다.
- AI Inbox 상태 변경 guard가 `chatgpt_action_save_experience`를 막는다.

부분 실패 또는 추가 확인:

- API 응답은 성공이나 AI Inbox 화면 반영이 지연된다.
- DB row는 정상이나 화면 표시 필드명이 예상과 다르다.
- `experience_evidence.evidence_type`이 `chatgpt_action_snippet`이 아닌 실제 구현값으로 저장된다.
- HTTP status는 다르지만 body `code`가 기대 의미와 일치한다.

실패 기록 시 남길 정보:

- endpoint 종류: preview 또는 production
- 요청 케이스: A부터 G 중 하나
- `clientTraceId`
- HTTP status
- token이 제거된 응답 body
- token이 제거된 화면 또는 DB 확인 결과

## 10. 다음 단계

- 내부 smoke에서 A부터 G까지 통과하면 Bearer-token wrapper의 제한 MVP 검증을 완료로 본다.
- 외부 사용자용 운영 전환은 별도 OAuth Protected 작업으로 진행한다.
- OAuth 전환 전에는 GPT Store 또는 외부 사용자용 공유 GPT에 연결하지 않는다.
- GPT editor Action 등록, OAuth client 등록, env/secrets 변경, production E2E는 별도 승인된 Protected 작업으로 분리한다.
- smoke 결과는 token과 raw transcript가 제거된 형태로만 기록한다.
