# PASSMAP ChatGPT Actions OAuth Protected Plan

## 1. 목적

이 문서는 ChatGPT Actions 운영용 OAuth 연동을 위한 Protected 설계 문서다.

목표는 사용자가 ChatGPT에서 PASSMAP에 로그인하고, ChatGPT가 사용자별 Authorization token으로 `chatgpt_action_save_experience` Action을 호출하게 하는 것이다. 서버는 토큰으로 PASSMAP `user_id`를 도출하고, 구조화된 경험 후보를 PASSMAP AI Inbox에 `accepted` 상태로 저장한다.

이 문서는 구현, OAuth client 등록, env/secrets 설정, GPT editor 등록, 배포, production smoke를 수행하지 않는다. 모든 운영 연결 작업은 별도 Protected 작업으로 진행한다.

## 2. 현재 상태 요약

현재 완료된 상태:

- `POST /api/save-analysis-run?action=chatgpt_action_save_experience` endpoint wrapper가 있다.
- `actions/chatgpt-actions.openapi.yaml` OpenAPI schema가 있다.
- 현재 wrapper는 `verifySupabaseAccessToken` 기반 Supabase Bearer token guard를 사용한다.
- OpenAPI schema의 OAuth security scheme은 production 목표를 표시하는 placeholder다.
- `docs/chatgpt-actions-gpt-editor-prep-20260529.md` GPT editor prep 문서가 있다.
- `docs/chatgpt-actions-bearer-smoke-test-20260529.md` Bearer-token 내부 smoke guide가 있다.
- Bearer token 방식은 내부 smoke 또는 제한 MVP용이다.
- 외부 사용자용 운영 연동은 OAuth가 필요하다.

현재 구현하지 않은 것:

- OAuth authorization endpoint
- OAuth token endpoint
- OAuth client 등록
- OAuth callback/redirect 등록
- token 저장/갱신/폐기 정책 구현
- env/secrets 설정
- GPT editor 실제 등록
- production smoke

## 3. OAuth 목표 아키텍처

목표 흐름:

```text
ChatGPT Custom GPT
-> 사용자가 PASSMAP 저장 요청
-> GPT가 사용자 확인
-> 인증 필요 시 PASSMAP OAuth authorization URL로 이동
-> PASSMAP 로그인/동의
-> ChatGPT callback URL로 code 반환
-> ChatGPT가 token URL로 code 교환
-> ChatGPT가 Action 호출 시 Authorization header 전달
-> PASSMAP API가 token 검증
-> 서버가 user_id 도출
-> 경험 후보 저장
-> PASSMAP AI Inbox에 accepted 카드 생성
```

핵심 원칙:

- ChatGPT Action request body의 `user_id` 또는 `userId`는 신뢰하지 않는다.
- 사용자 식별은 OAuth token 검증 결과에서만 도출한다.
- save endpoint는 AI 분석을 수행하지 않고, 인증/검증/저장만 수행한다.
- 저장 전 사용자 확인과 `x-openai-isConsequential: true`는 계속 유지한다.

## 4. 필요한 endpoint

아래 endpoint는 설계 후보이며, 이 문서 작업에서는 구현하지 않는다.

### `GET /oauth/authorize`

역할:

- ChatGPT OAuth 시작 지점이다.
- PASSMAP 로그인과 사용자 동의를 거쳐 authorization code를 발급한다.

Input:

- `client_id`
- `redirect_uri`
- `response_type=code`
- `scope`
- `state`

Output:

- 성공 시 ChatGPT callback URL로 `code`와 `state`를 redirect
- 실패 시 OAuth error response 또는 사용자에게 표시 가능한 오류

인증/검증 포인트:

- `client_id` allowlist 확인
- `redirect_uri` 정확 일치 확인
- `scope` 허용 범위 확인
- `state` 필수 확인
- PASSMAP 로그인 세션 확인
- 사용자 동의 확인

Protected 여부:

- Protected. 실제 endpoint 구현, client 등록, redirect URI 등록, env/secrets 설정이 필요하다.

### `POST /oauth/token`

역할:

- ChatGPT가 authorization code를 access token으로 교환하는 endpoint다.

Input:

- `grant_type=authorization_code`
- `code`
- `redirect_uri`
- `client_id`
- `client_secret`

Output:

- `access_token`
- `token_type=Bearer`
- `expires_in`
- 선택: `refresh_token`
- `scope`

인증/검증 포인트:

- client 인증
- code 유효성, 만료, 재사용 여부 확인
- `redirect_uri` 원 요청과 일치 확인
- `state`가 authorize 단계에서 검증된 request와 연결되어 있는지 확인
- token 발급 기록 저장 또는 검증 가능한 서명 방식 적용

Protected 여부:

- Protected. token 발급/저장/만료/revoke 정책과 secret 설정이 필요하다.

### 선택: `POST /oauth/revoke`

역할:

- 발급된 access token 또는 refresh token을 폐기한다.

Input:

- token 또는 token identifier
- client 인증 정보

Output:

- revoke 성공 또는 이미 폐기된 상태에 대한 idempotent success

인증/검증 포인트:

- client 인증
- token hash 조회
- 사용자와 client 연결 확인
- revoke 시각 저장

Protected 여부:

- Protected. 운영 rollout 전 revoke UX와 함께 검토해야 한다.

### 선택: `GET /oauth/userinfo` 또는 token introspection endpoint

역할:

- token이 나타내는 PASSMAP 사용자와 scope를 확인한다.
- save endpoint 내부 검증용 또는 운영 진단용으로 사용할 수 있다.

Input:

- `Authorization: Bearer <access_token>` 또는 introspection token payload

Output:

- subject/user identifier
- scope
- token active 여부
- 만료 시각

인증/검증 포인트:

- token active/revoked/expired 확인
- scope 확인
- 응답에 민감정보 최소화

Protected 여부:

- Protected. 필요성 조사 후 별도 구현 여부를 결정한다.

### 기존 save endpoint

Endpoint:

- `POST /api/save-analysis-run?action=chatgpt_action_save_experience`

역할:

- ChatGPT가 구조화한 사용자 확인 경험 후보를 PASSMAP AI Inbox에 저장한다.

Input:

- `Authorization: Bearer <OAuth access token>`
- request body: `sourcePlatform`, `importMethod`, `title`, `userConfirmed`, 그리고 `situation`/`task`/`actions`/`evidenceTexts` 중 하나 이상

Output:

- 성공: `{ ok, experienceCardId, status, inboxUrl, message }`
- 실패: `{ ok, code, message, retryable }`

인증/검증 포인트:

- OAuth token 검증
- token에서 `user_id` 도출
- `userConfirmed === true`
- raw transcript 계열 필드 reject
- payload 100,000자 제한
- `sourcePlatform`/`importMethod` mismatch reject

Protected 여부:

- OAuth 전환은 Protected. 기존 endpoint wrapper 자체는 이미 존재하며, OAuth 검증으로 전환하거나 병행하는 변경은 별도 PR에서 수행한다.

## 5. OAuth state 검증 설계

`state`는 반드시 검증한다.

목적:

- CSRF 방지
- authorize request와 callback/token 교환 흐름의 연결성 보장
- 잘못된 callback, 재사용, 공격성 요청 차단

설계 원칙:

- authorization request에서 받은 `state`를 callback/token 교환 과정까지 보존한다.
- `state` mismatch 시 즉시 거부한다.
- `state` 값 또는 로그에는 token, email, user id, 개인정보, secret을 넣지 않는다.
- `state`에는 만료 시간이 필요하다.
- `state`는 재사용할 수 없어야 한다.
- consume 이후 같은 `state`가 다시 들어오면 거부한다.
- 실패 로그에는 reason code와 request id 수준만 남긴다.

구현 후보:

- 서버 저장형: `state` hash, client id, redirect uri, scope, expiry, consumed_at 저장
- 서명형: HMAC/JWT 형태로 짧은 만료와 nonce를 포함하고, nonce 재사용 방지 저장소를 둔다

DB 또는 durable storage가 필요하면 별도 Protected PR로 분리한다.

## 6. token 발급/저장/갱신/폐기 정책

기본 정책:

- access token은 사용자별이어야 한다.
- 서버는 token으로 PASSMAP `user_id`를 도출한다.
- request body의 `user_id` 또는 `userId`는 신뢰하지 않는다.
- token은 로그, 문서, PR, error response, screenshot에 남기지 않는다.
- 최소 권한 scope만 발급한다.
- 만료 시간이 필요하다.
- revoke가 가능해야 한다.

저장 정책 후보:

- token 원문 저장 금지
- token hash 저장 권장
- token prefix 또는 token id로 lookup 후 hash 비교
- 저장 항목 후보:
  - token hash
  - user id
  - client id
  - scope
  - issued_at
  - expires_at
  - revoked_at
  - last_used_at
  - metadata/audit id

refresh token:

- refresh token을 쓸지 여부는 별도 결정한다.
- refresh token을 사용하면 access token보다 더 엄격히 보호한다.
- refresh token도 원문 저장 금지, hash 저장, rotate/revoke 정책이 필요하다.
- 초기 rollout에서는 짧은 access token과 재인증 UX가 더 단순할 수 있다.

폐기 정책:

- 사용자 연결 해제 시 revoke
- client secret 회전 또는 사고 대응 시 revoke
- 의심 요청, public write path, token 로그 노출 가능성 발견 시 즉시 revoke 경로 확보

## 7. scope 설계

초기 scope:

- `experience:write`

설명:

- ChatGPT Action은 저장만 한다.
- 읽기, 검색, 목록 조회 scope는 이번 범위가 아니다.
- 나중에 search/list action이 생기면 별도 scope를 고려한다.
- 예: `experience:read`, `experience:search`
- 기본 원칙은 최소 권한이다.

OpenAPI schema의 placeholder scope도 `experience:write`와 맞춰 유지한다. scope 이름 변경이 필요하면 schema 변경은 별도 PR에서 수행한다.

## 8. env/secret 필요 항목

아래는 후보/설계 항목이며 실제 값을 쓰지 않는다.

후보:

- `CHATGPT_ACTION_OAUTH_CLIENT_ID`
- `CHATGPT_ACTION_OAUTH_CLIENT_SECRET`
- `CHATGPT_ACTION_OAUTH_REDIRECT_URI`
- `CHATGPT_ACTION_OAUTH_TOKEN_SECRET`
- `CHATGPT_ACTION_OAUTH_STATE_SECRET`
- `CHATGPT_ACTION_ALLOWED_ORIGINS`
- `CHATGPT_ACTION_OAUTH_ISSUER`
- `CHATGPT_ACTION_OAUTH_ACCESS_TOKEN_TTL_SECONDS`
- `CHATGPT_ACTION_OAUTH_REFRESH_TOKEN_TTL_SECONDS`

Vercel env:

- OAuth endpoint 구현과 token signing/validation에 필요한 runtime secret은 Vercel env 설정이 필요할 수 있다.
- 실제 추가/수정은 Protected 작업이다.

Supabase secret 또는 table:

- token/state를 DB에 저장하면 Supabase schema 또는 table 변경이 필요할 수 있다.
- DB migration이 필요하면 별도 Protected PR로 분리한다.
- service role 접근 범위와 RLS 정책은 별도 검토가 필요하다.

주의:

- 이 문서에는 실제 secret, token, client secret, callback URL 값을 기록하지 않는다.

## 9. GPT editor 등록 시 필요한 값

GPT editor 등록 시 필요한 값:

- OpenAPI schema: `actions/chatgpt-actions.openapi.yaml`
- authorization URL
- token URL
- client ID
- client secret
- scope: `experience:write`
- callback URL: GPT editor가 제공하는 실제 callback URL 확인 필요
- auth type: OAuth
- consequential action: `x-openai-isConsequential: true` 유지

Protected 확인 사항:

- `servers.url`이 운영 endpoint를 정확히 가리키는지 확인
- OAuth URLs가 실제 구현 URL과 일치하는지 확인
- callback URL이 PASSMAP OAuth client allowlist와 정확히 일치하는지 확인
- GPT editor 등록은 env/secrets와 OAuth endpoint 준비 후 진행

## 10. 보안/개인정보 원칙

반드시 유지할 원칙:

- raw transcript 저장 금지
- raw message array 전송 금지
- request body의 `user_id` 신뢰 금지
- token 로그 금지
- access token은 짧은 수명 권장
- refresh token을 사용할 경우 더 엄격히 보호
- 개인정보/민감정보 최소화
- 저장 전 사용자 확인 유지
- `x-openai-isConsequential: true` 유지
- `raw_sources.raw_text = null` 유지
- `metadata.rawTextStored = false` 유지

금지 raw transcript 필드:

- `rawConversationText`
- `fullTranscript`
- `conversationRaw`
- `rawText`
- `raw_text`
- `fullConversation`
- `messages`

운영 중 위 원칙을 어기는 가능성이 발견되면 rollout을 중단한다.

## 11. 구현 작업 분해

아래 분해는 권장 Protected PR 단위다.

### A. OAuth 설계/테이블 필요성 조사

허용 파일 후보:

- docs OAuth 설계 문서
- schema 조사용 SQL 초안 문서

금지 파일:

- runtime code
- env/secrets
- production 설정

검증:

- token/state 저장 방식 결정
- DB migration 필요 여부 판단

중단 조건:

- user_id 매핑 방식이 불명확함
- DB migration이 필요한데 별도 PR로 분리되지 않음

### B. OAuth authorize/token endpoint 구현

허용 파일 후보:

- OAuth endpoint code
- endpoint tests
- docs update

금지 파일:

- env/secrets 직접 값
- deploy/redeploy
- GPT editor 등록

검증:

- authorize request validation
- token exchange validation
- state mismatch reject
- redirect_uri exact match

중단 조건:

- callback mismatch
- state 재사용 가능성
- public write path 가능성

### C. token 저장/검증/revoke 구현

허용 파일 후보:

- token storage/verification code
- revoke endpoint code
- tests
- DB migration PR, 필요한 경우 별도

금지 파일:

- production secret 값
- GPT editor 등록

검증:

- expired token reject
- revoked token reject
- token hash 저장 확인
- token 로그 미노출 확인

중단 조건:

- token 원문 저장 필요성이 생김
- token 로그 노출 위험
- revoke 불가능

### D. OpenAPI schema OAuth URL 확정

허용 파일 후보:

- `actions/chatgpt-actions.openapi.yaml`
- 관련 docs

금지 파일:

- endpoint code
- env/secrets
- deploy/redeploy

검증:

- authorization URL/token URL이 실제 구현과 일치
- scope `experience:write` 유지
- consequential marker 유지

중단 조건:

- 운영 host 또는 callback URL이 확정되지 않음

### E. GPT editor 실제 등록

허용 작업 후보:

- GPT editor Action 등록
- OAuth 설정 입력
- GPT Instructions 입력

금지 파일:

- repo code changes, unless 별도 PR로 요청됨

검증:

- schema import 성공
- OAuth auth type 설정
- callback URL 확인

중단 조건:

- OAuth callback URL 불일치
- client secret 미확정
- GPT editor에서 schema validation 실패

### F. production smoke

허용 작업 후보:

- 실제 ChatGPT Action end-to-end smoke
- 결과 기록 문서

금지 파일:

- secret 노출
- raw transcript 저장
- 임의 production data mutation beyond test scope

검증:

- 정상 Action save 성공
- AI Inbox `accepted` 카드 확인
- raw transcript reject
- `userConfirmed: false` reject

중단 조건:

- production smoke 실패
- token/개인정보 노출 위험
- raw transcript 저장 가능성

### G. 운영 rollout

허용 작업 후보:

- limited rollout plan
- monitoring/rollback plan
- support docs

금지 파일:

- 무계획 public rollout
- API Key 방식 외부 운영

검증:

- error rate와 auth failure 모니터링
- revoke 경로 확인
- user support path 확인

중단 조건:

- public write path 발생
- user identity contamination 가능성
- rollback 불가능

## 12. 검증 시나리오

OAuth 검증:

- OAuth 로그인 성공
- state mismatch 실패
- state 재사용 실패
- token 교환 실패
- 만료 token 실패
- token revoke 후 실패

Action 검증:

- 정상 Action save 성공
- PASSMAP AI Inbox `accepted` 카드 확인
- 이력서 재료로 확정
- raw transcript reject
- `userConfirmed: false` reject
- `sourcePlatform` mismatch reject
- `importMethod` mismatch reject

보안 검증:

- token이 로그에 남지 않음
- request body의 user_id가 사용되지 않음
- raw full transcript가 저장되지 않음
- `raw_sources.raw_text`가 `null`로 유지됨

## 13. 롤백/중단 조건

아래 조건이 발생하면 구현 또는 rollout을 중단한다.

- OAuth callback mismatch
- token이 로그에 노출될 위험
- `user_id` 매핑 불확실
- public write path 발생
- raw transcript 저장 가능성 발견
- env/secret 누락
- production smoke 실패
- DB migration 필요성이 발생했는데 별도 PR로 분리되지 않음
- revoke 경로가 없음
- state mismatch 또는 state 재사용을 막지 못함

롤백 원칙:

- GPT editor Action 비활성화 또는 등록 중단
- OAuth client secret rotate 또는 revoke
- 발급 token revoke
- production endpoint smoke 중단
- 관련 변경은 PR 단위로 revert 가능해야 함

## 14. 아직 하지 말 것

아직 하지 말 것:

- 실제 endpoint 구현
- 실제 OAuth client 등록
- 실제 secret 추가
- OAuth redirect/callback 실제 등록
- GPT editor 등록
- production smoke
- public rollout
- API Key 방식으로 외부 운영
- env/secrets 변경
- deploy/redeploy
- DB migration

## 15. 다음 단계

권장 순서:

1. OAuth Protected plan 문서 merge
2. OAuth 구현 전 DB/token 저장 방식 조사 프롬프트 작성
3. authorize/token endpoint 구현 Protected PR
4. env/secrets Protected 설정
5. schema URL 확정 PR
6. GPT editor 등록 Protected 작업
7. production smoke

이 문서가 merge되어도 OAuth 구현, env/secrets, GPT editor 등록, production smoke는 자동으로 승인된 것이 아니다. 각 단계는 별도 Protected 작업으로 진행한다.
