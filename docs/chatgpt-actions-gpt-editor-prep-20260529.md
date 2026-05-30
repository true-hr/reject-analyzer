# PASSMAP ChatGPT Actions GPT Editor Prep

## 1. 목적

이 문서는 PASSMAP ChatGPT Actions 등록을 위한 준비 패키지다.

목표는 사용자가 ChatGPT에서 "이 대화 내용을 패스맵 업무기록으로 저장해줘"라고 요청했을 때, ChatGPT가 전체 대화 원문을 보내지 않고 구조화된 경험 후보를 만든 뒤 PASSMAP API를 호출해 PASSMAP AI Inbox에 저장하도록 준비하는 것이다.

이 문서는 실제 GPT editor 등록을 수행하지 않는다. 실제 등록은 OAuth, env, 운영 endpoint 준비가 끝난 뒤 별도 Protected 작업으로 진행한다.

## 2. 현재 구현 상태

완료:

- `POST /api/save-analysis-run?action=chatgpt_action_save_experience` endpoint wrapper 구현 완료
- `actions/chatgpt-actions.openapi.yaml` OpenAPI schema 존재
- OpenAPI schema와 실제 wrapper request/response/error/security 정합성 보정 완료
- `docs/chatgpt-actions-auth-strategy-20260529.md` auth strategy 문서 존재
- `docs/chatgpt-actions-bearer-smoke-test-20260529.md` bearer-token 내부 smoke guide 존재
- raw transcript 저장 금지 정책 반영
- AI Inbox guard에 `chatgpt_action_save_experience` 반영

미완료:

- OAuth 구현
- OAuth client 등록
- authorization URL/token URL 실제 구현
- GPT editor 실제 등록
- production smoke
- external user rollout

## 3. GPT editor에 넣을 Action 개요

Action name 후보:

- Save PASSMAP Experience
- Save work experience to PASSMAP

Action contract:

- operationId: `saveChatgptExperienceToPassmap`
- endpoint: `POST /api/save-analysis-run?action=chatgpt_action_save_experience`
- consequential action: `x-openai-isConsequential: true`
- 저장 대상: PASSMAP AI Inbox
- 저장 상태: `accepted`

저장된 카드는 최종 이력서 재료가 아니다. 사용자가 PASSMAP AI Inbox에서 다시 검토하고 이력서 재료로 확정해야 한다.

## 4. OpenAPI schema 위치

OpenAPI schema 파일:

- `actions/chatgpt-actions.openapi.yaml`

현재 schema는 실제 endpoint wrapper와 정합화되어 있다. 실제 GPT editor 등록 시 `servers.url`, OAuth authorization URL, OAuth token URL, ChatGPT callback URL은 Protected 단계에서 확정해야 한다.

schema에는 raw transcript 필드를 넣지 않는다.

## 5. GPT Instructions 초안

아래 초안은 GPT editor의 Instructions에 넣기 위한 시작점이다. 실제 운영 문구는 OAuth, privacy, product UX 검토 후 확정해야 한다.

```text
You help the user turn ChatGPT work conversations into PASSMAP career experience candidates.

When the user asks to save work to PASSMAP:
1. Do not send the full conversation or message history.
2. Extract only a structured, user-confirmed experience candidate.
3. Ask for confirmation before saving.
4. Use short evidence snippets only.
5. Avoid sensitive personal information, national IDs, account numbers, passwords, secrets, and full message logs.
6. Do not exaggerate outcomes or invent achievements.
7. Organize the candidate with situation, task, actions, result, skills, jobTags, industryTags, evidenceTexts, and riskNotes.
8. Call the PASSMAP action only after the user explicitly confirms the save.
9. Set userConfirmed to true only after explicit user confirmation.
10. Send sourcePlatform as chatgpt and importMethod as chatgpt_action_save_experience.
```

운영 원칙:

- 사용자의 전체 대화를 그대로 PASSMAP에 보내지 않는다.
- PASSMAP에는 구조화된 경험 후보만 보낸다.
- `evidenceTexts`에는 짧은 근거 snippet만 넣는다.
- 저장 전 반드시 사용자에게 확인한다.
- 사용자가 명시적으로 저장 요청을 했거나 저장 확인을 했을 때만 Action을 호출한다.
- 개인 민감정보, 주민번호, 계좌번호, 비밀번호, 전체 메시지 로그 등은 보내지 않는다.
- 불확실한 성과를 과장하지 않는다.

## 6. 사용자 확인 UX 문구

Action 호출 직전 ChatGPT가 사용자에게 보여줄 확인 문구 초안:

```text
패스맵에 아래 경험 후보를 저장할까요?

저장되는 내용:
- 업무명
- 상황/과제
- 내가 한 행동
- 결과
- 사용 역량
- 짧은 근거 snippet

저장하지 않는 내용:
- 전체 ChatGPT 대화 원문
- 전체 메시지 기록
- 민감정보

저장 후 PASSMAP AI Inbox에서 다시 검토하고 이력서 재료로 확정할 수 있습니다.
```

사용자 확인 조건:

- `userConfirmed: true`가 되기 전에는 Action을 호출하지 않는다.
- 사용자가 "저장해줘", "응 저장", "패스맵에 보내줘"처럼 명확히 승인한 경우에만 호출한다.
- 확인 문구에는 저장되는 내용과 저장하지 않는 내용을 모두 보여준다.

## 7. Privacy / raw transcript 금지 문구

PASSMAP ChatGPT Action은 전체 대화나 전체 메시지 배열을 받지 않는다. 다음 필드는 request body 어디에도 포함하면 안 된다.

- `rawConversationText`
- `fullTranscript`
- `conversationRaw`
- `rawText`
- `raw_text`
- `fullConversation`
- `messages`

금지 원칙:

- 전체 대화 전송 금지
- 전체 메시지 배열 전송 금지
- 긴 원문 전송 금지
- PASSMAP에는 짧은 `evidenceTexts` snippet과 구조화 필드만 저장
- 민감정보, 계정정보, 비밀번호, secret, 결제정보, 주민번호, private HR 정보는 제거 또는 회피

서버 wrapper는 raw transcript 계열 필드를 발견하면 `RAW_TEXT_NOT_ALLOWED`로 거절한다.

## 8. 인증 설정 상태

현재 상태:

- schema는 production OAuth를 목표로 하는 placeholder security scheme을 유지한다.
- 현재 wrapper는 Supabase Bearer token guard를 사용한다.
- Bearer 방식은 내부 smoke 또는 제한 MVP용이다.
- 외부 사용자용 운영은 OAuth 구현 이후에만 가능하다.
- API Key 방식은 운영 정식안이 아니다.

운영 원칙:

- No Auth는 사용하지 않는다.
- 사용자 identity는 request body가 아니라 인증 토큰에서 서버가 결정해야 한다.
- OAuth 구현, client 등록, env/secrets 설정, GPT editor 등록은 모두 Protected 작업이다.

## 9. OAuth Protected 체크리스트

아래 항목은 모두 Protected 작업이다.

- [ ] OAuth client 등록
- [ ] ChatGPT callback URL 확인
- [ ] authorization URL 구현
- [ ] token URL 구현
- [ ] `state` parameter 검증
- [ ] token 저장/갱신/폐기 정책
- [ ] scope 결정: `experience:write`
- [ ] Vercel env 설정
- [ ] Supabase secret 설정
- [ ] Privacy policy/domain 설정
- [ ] GPT editor 등록
- [ ] production endpoint smoke

## 10. 테스트 전 체크리스트

실제 GPT editor 등록 전에 확인할 것:

- [ ] OpenAPI YAML이 최신 `main`에 있음
- [ ] endpoint wrapper가 최신 `main`에 있음
- [ ] raw transcript reject 동작 확인
- [ ] `userConfirmed: false` reject 확인
- [ ] success response shape 확인
- [ ] AI Inbox 표시 확인
- [ ] 이력서 재료로 확정 flow 확인
- [ ] OAuth 또는 내부 Bearer 테스트 방식 결정

## 11. 등록 후 smoke test 시나리오

실제 등록 후 테스트할 기본 시나리오:

1. ChatGPT에서 업무 대화 후 "패스맵에 저장해줘"라고 요청한다.
2. GPT가 구조화된 경험 후보를 보여주고 확인을 요청한다.
3. 사용자가 저장을 승인한다.
4. GPT가 `saveChatgptExperienceToPassmap` Action을 호출한다.
5. PASSMAP AI Inbox에 `accepted` 카드가 생성된다.
6. PASSMAP에서 해당 카드를 이력서 재료로 확정한다.
7. 이력서 재료함에서 확정된 항목을 확인한다.

실패 시 확인:

- 인증 실패
- raw transcript reject
- `userConfirmed` 누락
- Inbox 미표시
- `status`가 `converted`로 변경되지 않는 문제

## 12. 아직 하지 말 것

아직 하지 말 것:

- GPT editor 실제 등록
- OAuth client 실제 생성
- env/secrets 변경
- production deploy/redeploy
- public GPT 배포
- 사용자 대상 오픈
- raw transcript 저장 허용
- API Key 방식으로 외부 사용자 운영

## 13. 다음 단계

권장 순서:

1. GPT editor prep 문서 merge
2. OAuth Protected 설계 프롬프트 작성
3. OAuth 구현/환경 설정 Protected 작업
4. GPT editor 실제 등록 Protected 작업
5. ChatGPT Actions production smoke
6. PASSMAP Inbox/E2E 확인

이 문서 merge 이후에도 OAuth, env/secrets, GPT editor 등록, production smoke는 별도 승인과 Protected 절차가 필요하다.

## 14. 2026-05-31 registration readiness addendum

This addendum records the current registration-readiness policy without
performing OAuth setup, GPT editor registration, deployment, database writes, or
production smoke tests.

### Canonical host

- Canonical ChatGPT Actions registration host: `https://passmap-app.vercel.app`
- Legacy compatibility host: `https://reject-analyzer.vercel.app`
- New OpenAPI registration should use the canonical host unless a later
  Protected registration review explicitly selects another host.
- Privacy URL for registration review:
  `https://passmap-app.vercel.app/chatgpt-action-privacy.html`

### OpenAPI registration contract

- Schema file: `actions/chatgpt-actions.openapi.yaml`
- Operation ID: `saveChatgptExperienceToPassmap`
- Endpoint: `POST /api/save-analysis-run?action=chatgpt_action_save_experience`
- Auth scheme: OAuth authorization code flow using PASSMAP-issued OAuth tokens.
- Consequential flag: `x-openai-isConsequential: true`
- Required confirmation: `userConfirmed: true`
- Required source markers:
  - `sourcePlatform: "chatgpt"`
  - `importMethod: "chatgpt_action_save_experience"`
- Raw conversation policy:
  - Do not send full ChatGPT conversations, message arrays, raw transcripts, or secrets.
  - Server rejects nested raw fields such as `rawText`, `raw_text`,
    `fullConversation`, `fullTranscript`, and `messages`.
  - ChatGPT Action saves keep `raw_sources.raw_text = null`.
- Saved row state:
  - Action creates `accepted` AI Inbox candidates only.
  - The user must convert the candidate inside PASSMAP before it becomes resume material.

### OAuth and bearer fallback policy

- Production ChatGPT Action registration must use PASSMAP OAuth.
- The API derives `user_id` from the verified token; request-body `user_id` must
  not be trusted.
- ChatGPT OAuth access tokens are stored by hash in the OAuth token table; the
  plaintext token is not persisted.
- The existing Supabase bearer fallback in `chatgpt_action_save_experience` is
  internal-smoke-only compatibility. Do not register an external-user GPT Action
  that relies on Supabase bearer fallback.
- Before public or external-user use, run a Protected auth review for:
  - OAuth client ID/secret environment variables.
  - Allowed redirect URIs.
  - GPT callback URL.
  - OAuth state validation.
  - Fail-closed behavior when OAuth config or token verification is missing.

### Protected follow-up checklist

- [ ] Confirm production OAuth env values without exposing secrets.
- [ ] Confirm allowed redirect URI for the actual GPT Action callback.
- [ ] Register the GPT Action using the canonical OpenAPI host.
- [ ] Complete ChatGPT OAuth sign-in with a test PASSMAP user.
- [ ] Run one controlled save Action E2E.
- [ ] Confirm the saved row appears in AI Inbox as `accepted`.
- [ ] Confirm the user can convert it to resume material inside PASSMAP.
