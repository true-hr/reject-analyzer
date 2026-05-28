# PASSMAP ChatGPT Actions 정식 연동 설계

## 1. 목표

ChatGPT 안에서 사용자가 "이 대화 내용을 패스맵 업무기록으로 저장해줘", "오늘 한 일 패스맵에 기록해줘", "이 내용을 패스맵 경험 카드로 보내줘"라고 요청했을 때, Custom GPT의 Action이 PASSMAP API를 호출해 구조화된 경험 후보를 AI Inbox에 저장하는 설계를 정의한다.

이번 문서는 구현 지시가 아니라 설계 산출물이다. endpoint 추가, OAuth 구현, env/secrets 변경, DB migration, deploy/redeploy는 모두 별도 Protected 작업으로 분리한다.

핵심 원칙:

- ChatGPT Actions 저장은 "자동 저장"이 아니라 "사용자 확인 후 저장"이어야 한다.
- PASSMAP에는 원문 대화 전체를 저장하지 않는다.
- 저장 payload는 구조화된 경험 후보와 짧은 evidence snippet 중심이어야 한다.
- `sourcePlatform`은 `chatgpt`로 명확히 표시한다.
- `importMethod`는 `chatgpt_action_save_experience` 같은 별도 값을 사용한다.
- 저장 직후 이력서 재료로 확정하지 않고 AI Inbox의 `accepted` 상태에서 사용자 검토를 거친다.
- POST 저장 Action은 consequential action으로 취급한다.
- OAuth/env/production setting은 Protected 변경으로 분리한다.

## 2. 현재 PASSMAP 저장 흐름 요약

현재 PASSMAP의 AI 업무기록 회수 계열 저장 흐름은 세 갈래다.

1. MCP 저장 흐름
   - `api/save-analysis-run.js?action=mcp_save_experience`
   - `Authorization: Bearer pmcp_...`
   - `verifyMcpToken()`이 pairing row를 확인하고 `user_id`를 서버에서 결정한다.
   - body의 `user_id`, `userId`, `rawText`, `raw_text`는 무시한다.
   - `raw_sources.raw_text`는 항상 `null`로 저장한다.
   - `experience_evidence.evidence_text`에 사용자에게 보여줄 짧은 인용 근거만 저장한다.
   - `experience_cards.status = "accepted"`로 저장해 AI Inbox에 표시한다.
   - `metadata.importMethod = "mcp_save_experience"`와 `metadata.sourcePlatform`을 기록한다.

2. Web work-trace / browser extension intake
   - PASSMAP 웹의 AI 대화 탭 또는 Chrome extension selection intake에서 텍스트를 받아 후보를 추출한다.
   - 사용자가 후보를 검토/저장하면 `saveWorkTraceCandidates.js`가 `raw_sources`, `experience_cards`, `experience_evidence`에 저장한다.
   - Chrome extension 선택 텍스트는 `importMethod = "browser_extension_selection"`으로 기록된다.

3. AI Inbox / resume material flow
   - `src/lib/experience/aiInboxRepository.js`가 `experience_cards`를 Supabase RLS 기반으로 직접 조회한다.
   - `raw_sources.raw_text`는 select column list에 포함하지 않는다.
   - Inbox는 `accepted`, 이력서 재료함은 `converted`를 조회한다.
   - "이력서 재료로 확정"은 `accepted -> converted` 상태 변경이며, PR #583 이후 update 경로는 pre-select + JS origin guard + `id/status` update 구조를 사용한다.

## 3. 재사용 가능한 endpoint 후보

### 후보 1: `POST /api/save-analysis-run?action=chatgpt_action_save_experience`

기존 Vercel function의 action router에 새 action을 추가한다.

장점:

- Vercel function 수를 늘리지 않는다.
- `mcp_save_experience`의 저장 helper, validation 패턴, raw text 금지 정책을 재사용하기 쉽다.
- 기존 문서와 운영 URL 정책에서 `/api/save-analysis-run?action=*` 계열로 설명하기 쉽다.

단점:

- `api/save-analysis-run.js`가 이미 multi-action function이라 더 복잡해진다.
- OAuth bearer token과 MCP bearer token의 검증 분기가 같은 파일 안에 공존한다.
- Protected API 변경이므로 코드 리뷰와 smoke가 필요하다.

추천: P1 endpoint wrapper 후보로 권장한다. 단, MCP handler를 그대로 섞지 말고 `handleChatgptActionSaveExperience`로 분리한다.

### 후보 2: `POST /api/chatgpt-actions/save-experience`

별도 endpoint를 만든다.

장점:

- OpenAPI schema와 endpoint 이름이 명확하다.
- OAuth verifier, rate limit, request validation을 Actions 전용으로 격리할 수 있다.

단점:

- Vercel function 수와 운영 표면이 늘어난다.
- existing action router 정책과 다르게 보일 수 있다.
- CORS/auth/rate limit 설정을 별도로 검토해야 한다.

추천: Vercel function count나 운영 단순성이 더 중요하면 후순위다.

### 후보 3: 기존 `mcp_save_experience` 재사용

ChatGPT Action에서 `mcp_save_experience`를 직접 호출한다.

장점:

- 구현량이 가장 작다.
- 현재 저장 contract가 원문 저장 금지, evidence 중심 저장과 잘 맞는다.

단점:

- ChatGPT Actions의 인증 모델과 MCP pairing token 모델이 다르다.
- `importMethod = "mcp_save_experience"`로 저장되어 source attribution이 흐려진다.
- MCP token을 Custom GPT에 넣는 방식은 사용자별 보안/폐기 UX가 부자연스럽다.

추천: 정식 연동에는 비추천. 내부 프로토타입 smoke에만 제한적으로 고려한다.

## 4. MCP 저장 흐름과 ChatGPT Actions의 차이

MCP 저장 흐름:

- Claude Desktop 등 local MCP client가 PASSMAP pairing code를 token으로 교환한다.
- PASSMAP은 `pmcp_...` token hash를 DB에 저장하고, plaintext token은 응답에서 1회만 반환한다.
- 이후 REST wrapper가 `Authorization: Bearer pmcp_...`로 `mcp_save_experience`를 호출한다.
- token lifecycle은 PASSMAP의 MCP 연결 UI에서 조회/폐기한다.

ChatGPT Actions 흐름:

- Custom GPT가 OpenAPI schema를 기반으로 외부 REST API operation을 호출한다.
- OpenAI Actions는 schema를 바탕으로 자연어 요청을 request body로 변환한다.
- 인증 방식은 None, API Key, OAuth 중 선택한다.
- OAuth를 쓰면 ChatGPT가 Action 호출 시 bearer token을 `Authorization` header로 전달한다.
- POST 저장은 사용자 데이터에 영향을 주는 consequential action이므로 OpenAPI operation에 `x-openai-isConsequential: true`를 둔다.

따라서 ChatGPT Actions는 MCP token을 그대로 쓰기보다, ChatGPT 전용 인증/연결 UX와 import attribution을 분리하는 것이 맞다.

## 5. 권장 아키텍처

권장 구조:

```text
ChatGPT Custom GPT
  -> OpenAPI schema
  -> OAuth bearer token
  -> POST /api/save-analysis-run?action=chatgpt_action_save_experience
  -> verify ChatGPT Action identity
  -> normalize structured experience candidate
  -> insert raw_sources(raw_text = null)
  -> insert experience_cards(status = accepted)
  -> insert experience_evidence(evidence snippets only)
  -> return PASSMAP Inbox link and saved card IDs
```

서버 저장 정책:

- `raw_sources.source_type = "ai_conversation"`
- `raw_sources.raw_text = null`
- `raw_sources.metadata.importMethod = "chatgpt_action_save_experience"`
- `raw_sources.metadata.sourcePlatform = "chatgpt"`
- `raw_sources.metadata.rawTextStored = false`
- `experience_cards.status = "accepted"`
- `experience_cards.metadata.importMethod = "chatgpt_action_save_experience"`
- `experience_cards.metadata.sourcePlatform = "chatgpt"`
- `experience_evidence.evidence_type = "quote"` 또는 `"source_text"`

Inbox 표시 정책:

- `aiInboxRepository.js`의 allowed origin set에 `chatgpt_action_save_experience`를 명시적으로 추가해야 한다.
- update 경로의 PR #583 guard 구조는 유지한다.
- update 쿼리에는 metadata JSON `.or()`나 `metadata->>` filter를 다시 넣지 않는다.

## 6. 인증 방식 후보 비교

| 후보 | 장점 | 단점 | 구현 난이도 | 보안 리스크 | 사용자 UX | 추천 |
|---|---|---|---|---|---|---|
| A. OAuth 정식 연결 | 사용자별 권한 위임이 표준적이다. ChatGPT가 bearer token을 전달하므로 서버가 user identity를 검증하기 좋다. revoke/consent UX를 만들기 쉽다. | OAuth client, callback, token storage/refresh, env 설정이 필요하다. Custom GPT 설정과 production auth surface가 Protected다. | 높음 | token/callback/redirect URI 설정 오류, scope 과다 요청 | 가장 자연스럽다. 사용자는 GPT에서 PASSMAP 계정을 연결한다. | 정식안 |
| B. PASSMAP 사용자별 Action token/API key | OAuth보다 단순하다. MCP pairing과 유사한 관리 UI를 재사용할 수 있다. | 사용자가 token을 직접 복사해야 할 수 있다. Custom GPT에 사용자별 secret 입력 UX가 제한적이다. token rotation/revoke가 중요하다. | 중간 | token 유출, 공유 GPT 설정에 secret 혼입 위험 | 개발자/초기 사용자에게는 가능, 일반 사용자에게는 불편 | MVP 대안 |
| C. 기존 MCP pairing/token 재사용 | 기존 DB와 handler를 일부 재사용할 수 있다. | ChatGPT Actions와 MCP client lifecycle이 다르다. import attribution이 흐려진다. token을 GPT 설정에 넣는 것은 부적절할 수 있다. | 낮음-중간 | MCP token 노출, 권한 경계 혼동 | 연결 UX가 어색하다. | 비추천 |
| D. Actions 미등록, 정리 포맷 + 확장/붙여넣기 우회 | 구현/보안 리스크가 낮다. 기존 Chrome extension과 AI 대화 탭을 사용한다. | ChatGPT 안에서 원클릭 저장은 안 된다. 자동화 수준이 낮다. | 낮음 | 낮음 | 사용자가 복사/확장 메뉴를 써야 한다. | P0 fallback |

## 7. 권장 인증안

정식 연동은 A안 OAuth를 권장한다.

이유:

- ChatGPT Actions의 사용자별 저장 액션은 사용자 identity가 명확해야 한다.
- OAuth bearer token을 서버에서 검증해 PASSMAP user_id를 결정하면 body의 user_id를 신뢰하지 않아도 된다.
- revoke, consent, token expiry, scope를 표준 auth 흐름으로 설명할 수 있다.
- POST 저장이 consequential action이므로 사용자 확인 + OAuth 권한 위임의 조합이 가장 안전하다.

MVP 단계에서는 B안 Action token을 임시로 검토할 수 있다. 단, token은 `pmcp_`와 구분되는 prefix를 사용하고, `chatgpt_action_tokens` 또는 기존 pairing table 확장 여부를 별도 설계해야 한다. token plaintext는 DB에 저장하지 않고 hash만 저장해야 한다.

C안 MCP token 재사용은 정식 설계에서 배제한다. D안은 production Actions 등록 전까지 사용 가능한 fallback UX로 유지한다.

## 8. 저장 request/response 데이터 모델

### Request body

```json
{
  "sourcePlatform": "chatgpt",
  "sourceConversationTitle": "optional short title",
  "confirmedByUser": true,
  "conversationSummary": "Short summary generated after user confirmation.",
  "experiences": [
    {
      "clientRequestId": "optional-idempotency-key",
      "title": "경험 후보 제목",
      "situation": "상황",
      "task": "맡은 역할 또는 과제",
      "actions": ["직접 수행한 행동 1", "직접 수행한 행동 2"],
      "resultCandidate": "결과 또는 변화",
      "skills": ["stakeholder communication"],
      "jobTags": ["PM"],
      "industryTags": ["SaaS"],
      "evidenceTexts": ["사용자가 확인한 짧은 근거 인용"],
      "riskNotes": ["원문에 없는 성과 수치가 있으면 확인 필요"]
    }
  ]
}
```

Validation:

- `confirmedByUser`는 반드시 `true`여야 한다.
- `sourcePlatform`은 서버에서 `chatgpt`로 강제하거나 allowlist 검증한다.
- `experiences`는 1-5개로 제한한다.
- 각 `title`은 2자 이상이어야 한다.
- 각 후보는 `situation`, `task`, `actions` 중 최소 하나를 포함해야 한다.
- `evidenceTexts`는 짧은 snippet만 허용하고 개수/길이를 제한한다.
- `rawText`, `raw_text`, `fullConversation`, `messages` 같은 원문 필드는 허용하지 않거나 명시적으로 무시한다.
- 전체 request payload는 100,000자 미만을 목표로 제한한다.

### Response body

```json
{
  "ok": true,
  "savedCount": 1,
  "items": [
    {
      "experienceId": "uuid",
      "sourceId": "uuid",
      "title": "경험 후보 제목",
      "status": "accepted",
      "evidenceCount": 2
    }
  ],
  "inboxUrl": "https://passmap-app.vercel.app/#ai-inbox",
  "message": "PASSMAP AI Inbox에 저장했습니다. PASSMAP에서 검토 후 이력서 재료로 확정하세요."
}
```

Error response:

```json
{
  "ok": false,
  "errorCode": "AUTH_REQUIRED",
  "message": "PASSMAP 연결이 필요합니다."
}
```

## 9. OpenAPI schema 초안

```yaml
openapi: 3.1.0
info:
  title: PASSMAP ChatGPT Actions API
  version: 0.1.0
servers:
  - url: https://reject-analyzer.vercel.app
paths:
  /api/save-analysis-run:
    post:
      operationId: saveChatgptExperienceToPassmap
      summary: Save user-confirmed ChatGPT work experience candidates to PASSMAP AI Inbox.
      description: >
        Saves structured experience candidates after explicit user confirmation.
        The API must not receive or store the full raw conversation.
      x-openai-isConsequential: true
      parameters:
        - in: query
          name: action
          required: true
          schema:
            type: string
            enum: [chatgpt_action_save_experience]
      security:
        - passmapOAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              additionalProperties: false
              required:
                - sourcePlatform
                - confirmedByUser
                - experiences
              properties:
                sourcePlatform:
                  type: string
                  enum: [chatgpt]
                sourceConversationTitle:
                  type: string
                  maxLength: 120
                confirmedByUser:
                  type: boolean
                  const: true
                  description: Must be true only after the user confirms the save.
                conversationSummary:
                  type: string
                  maxLength: 1200
                experiences:
                  type: array
                  minItems: 1
                  maxItems: 5
                  items:
                    type: object
                    additionalProperties: false
                    required:
                      - title
                    properties:
                      clientRequestId:
                        type: string
                        maxLength: 120
                      title:
                        type: string
                        minLength: 2
                        maxLength: 160
                      situation:
                        type: string
                        maxLength: 1200
                      task:
                        type: string
                        maxLength: 1200
                      actions:
                        type: array
                        maxItems: 10
                        items:
                          type: string
                          maxLength: 500
                      resultCandidate:
                        type: string
                        maxLength: 1200
                      skills:
                        type: array
                        maxItems: 12
                        items:
                          type: string
                          maxLength: 80
                      jobTags:
                        type: array
                        maxItems: 12
                        items:
                          type: string
                          maxLength: 80
                      industryTags:
                        type: array
                        maxItems: 12
                        items:
                          type: string
                          maxLength: 80
                      evidenceTexts:
                        type: array
                        maxItems: 8
                        items:
                          type: string
                          maxLength: 600
                      riskNotes:
                        type: array
                        maxItems: 8
                        items:
                          type: string
                          maxLength: 300
      responses:
        "200":
          description: Saved to PASSMAP AI Inbox.
          content:
            application/json:
              schema:
                type: object
                required: [ok, savedCount, items, inboxUrl]
                properties:
                  ok:
                    type: boolean
                    const: true
                  savedCount:
                    type: integer
                  inboxUrl:
                    type: string
                  message:
                    type: string
                  items:
                    type: array
                    items:
                      type: object
                      properties:
                        experienceId:
                          type: string
                        sourceId:
                          type: string
                        title:
                          type: string
                        status:
                          type: string
                          enum: [accepted]
                        evidenceCount:
                          type: integer
        "400":
          description: Invalid request.
        "401":
          description: PASSMAP authentication required.
        "413":
          description: Payload too large.
        "500":
          description: Save failed.
components:
  securitySchemes:
    passmapOAuth:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://passmap-app.vercel.app/oauth/authorize
          tokenUrl: https://reject-analyzer.vercel.app/api/oauth/token
          scopes:
            passmap:experience.write: Save user-confirmed experience candidates to PASSMAP AI Inbox.
```

Notes:

- OAuth URLs are placeholders and require Protected implementation.
- If OAuth is deferred, replace `passmapOAuth` with an API key bearer scheme only for private MVP testing.
- The OpenAPI operation should stay narrow: one consequential save operation, no destructive delete/update operation.

## 10. consequential action 설정

The save operation changes user data by inserting rows into PASSMAP. It must be marked:

```yaml
x-openai-isConsequential: true
```

The Custom GPT instruction should also require:

1. Summarize the candidate cards first.
2. Ask for explicit confirmation.
3. Only call the Action after the user confirms.
4. Never send the full conversation transcript.
5. Return the PASSMAP Inbox link after success.

## 11. 개인정보/원문 저장 금지 정책

Policy:

- Do not store the full ChatGPT conversation in PASSMAP.
- Do not accept `messages`, `fullConversation`, `rawText`, or `raw_text` for this Action.
- Store `raw_sources.raw_text = null`.
- Store `metadata.rawTextStored = false`.
- Store only short evidence snippets that the user can inspect.
- Evidence snippets should be limited by count and length.
- The model should remove or avoid sensitive personal data, secrets, payment information, customer confidential data, unpublished company strategy, and private HR information.
- The Action should save `riskNotes` when the model is uncertain or when a claim may require user verification.
- The Action should not create `converted` rows. The user must decide in PASSMAP whether an accepted card becomes resume material.

Server-side guards:

- Ignore client-supplied `user_id` / `userId`.
- Determine `user_id` from OAuth token or action token lookup.
- Reject or ignore raw transcript fields.
- Enforce payload size below the practical 100,000-character limit.
- Keep execution within the 45-second Actions timeout target; avoid long AI processing in the save endpoint.

## 12. 사용자 UX

Recommended ChatGPT UX:

1. User says: "이 대화 내용을 패스맵 업무기록으로 저장해줘."
2. GPT extracts 1-5 structured experience candidates from the visible conversation.
3. GPT shows the candidates to the user:
   - title
   - situation/task/actions/result
   - evidence snippets
   - risk notes
4. GPT asks: "이 내용으로 PASSMAP AI Inbox에 저장할까요?"
5. User confirms.
6. GPT calls `saveChatgptExperienceToPassmap`.
7. PASSMAP saves rows as `accepted`.
8. GPT replies with saved count and PASSMAP Inbox link.
9. User opens PASSMAP, reviews AI Inbox, and clicks "이력서 재료로 확정" only for relevant cards.

Failure UX:

- If auth is missing: instruct the user to connect PASSMAP to the GPT.
- If payload is too large: ask the user to narrow the conversation or send summarized candidates.
- If evidence contains sensitive information: ask the user to revise/remove the snippet before saving.

## 13. 구현 단계

P1-A: 설계 문서

- This document.

P1-B: OpenAPI schema 초안

- Extract section 9 into a separate schema file or GPT editor input.
- Validate operationId, auth scheme, consequential marker, and schema strictness.

P1-C: endpoint wrapper 설계

- Add `chatgpt_action_save_experience` action handler as a wrapper around MCP-like save logic.
- Keep handler separate from `mcp_save_experience`.
- Add request size checks and raw transcript rejection.

P1-D: 인증 방식 결정

- Choose OAuth for production.
- If MVP token is used, define token prefix, hash storage, revoke UI, expiry, and scope.

P1-E: 개인정보/원문 저장 금지 정책 문서화

- Document in product/privacy docs and GPT instructions.
- Add server-side tests that raw text fields are ignored/rejected.

P1-F: local/API smoke

- Unauthenticated request returns 401.
- Invalid payload returns 400.
- Valid authenticated request inserts `raw_text = null`, `accepted` card, evidence snippets.

P1-G: GPT editor 등록

- Register schema in Custom GPT Actions.
- Configure auth.
- Add GPT instructions for user confirmation and no raw transcript storage.

P1-H: Actions E2E

- In ChatGPT, ask to save a conversation.
- Confirm before Action call.
- Verify PASSMAP AI Inbox card appears.
- Verify "이력서 재료로 확정" works.

Protected:

- OAuth/env/production settings
- Supabase schema changes, if any
- production deploy/redeploy
- privacy/security policy changes

## 14. Protected로 분리해야 할 작업

- OAuth authorization server/callback/token endpoint implementation
- OAuth client registration and redirect URI configuration
- Vercel environment variables or project settings
- Supabase env/secrets changes
- DB migration or new token table
- RLS/auth policy changes
- production deploy/redeploy
- CORS allowlist changes
- privacy policy changes that alter user data handling commitments
- Chrome extension host permission changes
- any direct push to `main`

## 15. 리스크와 미해결 질문

Risks:

- ChatGPT may over-summarize or infer unverified achievements. Mitigation: evidence snippets + riskNotes + PASSMAP Inbox review.
- User may ask for one-step save without understanding data transfer. Mitigation: consequential action + explicit confirmation.
- OAuth implementation increases auth/security surface. Mitigation: separate Protected PR and narrow scopes.
- Raw transcript may accidentally appear in a free-text field. Mitigation: schema excludes raw transcript fields; server rejects suspicious fields and enforces length limits.
- Current Inbox allowed-origin filter does not yet include `chatgpt_action_save_experience`. Implementation must update list and guard together.
- 45-second timeout makes save endpoint unsuitable for heavy AI extraction. Extraction should happen inside ChatGPT before Action call; PASSMAP endpoint should only validate and persist.

Open questions:

- Should ChatGPT Action save exactly one card per call or allow batch save up to 5 cards?
- Should `conversationSummary` be stored in `raw_sources.summary` or only in metadata?
- Should `sourceConversationTitle` be user-editable before save?
- What OAuth scope names should PASSMAP expose?
- Should MVP token reuse `user_mcp_pairings` or use a separate action-token table?
- What public PASSMAP Inbox URL/hash should be returned?

## 16. 다음 Codex 패치 프롬프트 초안

```text
[PASSMAP - ChatGPT Actions OpenAPI schema draft]

Target repo:
D:\패스맵\reject-analyzer

Goal:
Create a documentation-only OpenAPI schema draft for the proposed ChatGPT Actions integration.

Base:
origin/main in a new worktree.

Allowed files:
- docs/chatgpt-actions-openapi-draft-YYYYMMDD.yaml
- docs/chatgpt-actions-openapi-notes-YYYYMMDD.md

Do not implement endpoints, OAuth, env, DB, or deploy changes.

Requirements:
- Define POST /api/save-analysis-run?action=chatgpt_action_save_experience
- Include operationId saveChatgptExperienceToPassmap
- Include x-openai-isConsequential: true
- Include OAuth placeholder security scheme
- Exclude rawText/raw_text/fullConversation/messages fields
- Limit experiences to 1-5
- Include 200/400/401/413/500 response schemas
- Document that endpoint implementation is a future Protected PR

Verification:
- git diff --check
- No build; docs/schema only

Commit:
docs: draft ChatGPT Actions OpenAPI schema
```

References:

- OpenAI Actions in GPTs documentation: https://platform.openai.com/docs/actions
- OpenAI Actions authentication documentation: https://platform.openai.com/docs/actions/authentication
- OpenAI Actions production guidance: https://platform.openai.com/docs/actions/production
