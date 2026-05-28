# PASSMAP ChatGPT Actions Endpoint Wrapper Plan

## 1. 목적

This document defines the implementation scope for a future PASSMAP endpoint wrapper that will receive a ChatGPT Action request and save one user-confirmed structured experience candidate to AI Inbox.

This step does not implement the endpoint. It only records the intended patch boundary, validation rules, storage mapping, privacy constraints, and Protected follow-up work.

## 2. 이번 단계에서 만든 OpenAPI schema

Created draft schema:

- `actions/chatgpt-actions.openapi.yaml`

Key schema decisions:

- OpenAPI 3.1.0.
- Placeholder server URL: `https://passmap-app.vercel.app`.
- Path: `POST /api/save-analysis-run`.
- Query parameter: `action=chatgpt_action_save_experience`.
- Operation ID: `saveChatgptExperienceToPassmap`.
- Consequential marker: `x-openai-isConsequential: true`.
- OAuth placeholder security scheme: `components.securitySchemes.passmapOAuth`.
- Request/response payloads use raw structured JSON, not verbose natural language.
- No full raw conversation field is present.

## 3. 구현 대상 endpoint

Recommended endpoint:

```text
POST /api/save-analysis-run?action=chatgpt_action_save_experience
```

Reasoning:

- `api/save-analysis-run.js` already contains an action router.
- Existing MCP actions are integrated there to avoid adding Vercel function count.
- The ChatGPT Action save path can reuse the MCP save validation/storage pattern while keeping a separate handler.

Alternative:

```text
POST /api/chatgpt-actions/save-experience
```

This is clearer as a public endpoint, but it adds another Vercel function surface and would require separate routing/CORS/auth review. The first implementation should prefer the existing action router unless the file becomes too complex to maintain.

## 4. 기존 MCP save 흐름 재사용 가능 지점

Reusable points from `mcp_save_experience`:

- Request body parsing pattern.
- String normalization helper.
- Array normalization helper.
- Required candidate validation:
  - title length.
  - at least one core field.
  - trimmed arrays.
- `raw_sources` insert structure.
- `experience_cards` insert structure.
- `experience_evidence` insert structure.
- `raw_sources.raw_text = null` invariant.
- `metadata.rawTextStored = false`.
- Stable JSON error response style.

Do not reuse blindly:

- MCP bearer token verification.
- `pairingId` metadata.
- `importMethod = mcp_save_experience`.
- MCP-specific response naming if it conflicts with Actions schema.

The future patch should either extract common save helpers or add a separate `handleChatgptActionSaveExperience` that mirrors the MCP storage path with ChatGPT-specific auth and metadata.

## 5. 새 importMethod/sourcePlatform 규칙

For ChatGPT Actions rows:

- `sourcePlatform = "chatgpt"`
- `importMethod = "chatgpt_action_save_experience"`
- `raw_sources.source_type = "ai_conversation"`
- `experience_cards.status = "accepted"`

Metadata mapping:

- `raw_sources.metadata.importMethod = "chatgpt_action_save_experience"`
- `raw_sources.metadata.sourcePlatform = "chatgpt"`
- `raw_sources.metadata.sourceConversationTitle = request.sourceConversationTitle || null`
- `raw_sources.metadata.clientTraceId = request.clientTraceId || null`
- `raw_sources.metadata.rawTextStored = false`
- `raw_sources.metadata.privacyFlags = request.privacyFlags || []`
- `experience_cards.metadata.importMethod = "chatgpt_action_save_experience"`
- `experience_cards.metadata.sourcePlatform = "chatgpt"`
- `experience_cards.metadata.sourceConversationTitle = request.sourceConversationTitle || null`
- `experience_cards.metadata.clientTraceId = request.clientTraceId || null`

AI Inbox follow-up:

- `src/lib/experience/aiInboxRepository.js` will need its allowed origin list updated to include `chatgpt_action_save_experience`.
- The PR #583 update guard pattern must stay intact:
  - pre-select `id, status, metadata`
  - JS origin guard
  - update by `id + status=accepted`
  - no metadata JSON filter in the update path

## 6. request validation 규칙

The future endpoint wrapper should validate:

- HTTP method must be `POST`.
- Query `action` must equal `chatgpt_action_save_experience`.
- OAuth or MVP Action token must resolve a PASSMAP user ID server-side.
- Client-supplied `user_id` / `userId` must be ignored or rejected.
- `sourcePlatform` must be `chatgpt`.
- `importMethod` must be `chatgpt_action_save_experience`.
- `userConfirmed` must be `true`.
- No raw transcript fields are allowed:
  - `rawConversationText`
  - `rawText`
  - `raw_text`
  - `fullConversation`
  - `messages`
- Total request payload must be under 100,000 characters.
- The request should complete within the 45-second Actions timeout. Keep the handler to auth, validation, and simple inserts.
- `title`, `situation`, `task`, `actions`, and `evidenceTexts` are the minimum save candidate fields.
- `actions` must contain at least one non-empty string.
- `evidenceTexts` must contain short evidence snippets only.
- `skills`, `jobTags`, `industryTags`, `riskNotes`, and `privacyFlags` should be trimmed arrays.
- Unknown top-level properties should be rejected or ignored consistently.

The save endpoint must not run AI analysis. ChatGPT structures the candidate before the Action call; PASSMAP validates and inserts only.

## 7. raw text 저장 금지 정책

Policy:

- Never store the full ChatGPT conversation.
- Keep `raw_sources.raw_text = null`.
- Keep `metadata.rawTextStored = false`.
- Store short evidence snippets in `experience_evidence.evidence_text`.
- Do not add full raw text fields to request schema.
- If a raw transcript-like field is present, return `400 RAW_TEXT_NOT_ALLOWED`.

Rationale:

- Existing MCP design already avoids full conversation persistence.
- PASSMAP AI Inbox intentionally does not select `raw_sources.raw_text`.
- Evidence snippets are enough for user review and resume-material confidence checks.

## 8. DB 저장 매핑

Proposed `raw_sources` insert:

- `user_id`: verified user ID from OAuth/token.
- `source_type`: `ai_conversation`.
- `source_label`: `chatgpt:<sourceConversationTitle or Action>`.
- `detected_period`: derive from `occurredAt` only if useful, otherwise `null`.
- `raw_text`: `null`.
- `summary`: compact summary built from situation/task/actions/result, or `null`.
- `processing_status`: `completed`.
- `metadata`: import/source/privacy/client trace fields.

Proposed `experience_cards` insert:

- `user_id`: verified user ID.
- `source_id`: raw source ID.
- `work_record_id`: `null`.
- `title`: request title.
- `situation`: request situation.
- `task`: request task.
- `actions`: request actions.
- `result`: request result as array/object matching existing storage convention.
- `skills`: request skills.
- `job_tags`: request jobTags.
- `industry_tags`: request industryTags.
- `risk_notes`: request riskNotes plus privacy warning notes if needed.
- `status`: `accepted`.
- `metadata`: import/source/client trace fields.

Proposed `experience_evidence` insert:

- one row per `evidenceTexts[]`.
- `evidence_type`: `quote`.
- `source_offset_start`: `null`.
- `source_offset_end`: `null`.
- `metadata.importMethod`: `chatgpt_action_save_experience`.

## 9. 성공/실패 response 규칙

Return raw structured data so ChatGPT can create the user-facing response.

Success:

```json
{
  "ok": true,
  "experienceCardId": "uuid",
  "status": "accepted",
  "inboxUrl": "https://passmap-app.vercel.app/#ai-inbox",
  "message": "saved_to_ai_inbox"
}
```

Failure:

```json
{
  "ok": false,
  "code": "AUTH_REQUIRED",
  "message": "PASSMAP authentication is required.",
  "retryable": false
}
```

Recommended stable error codes:

- `METHOD_NOT_ALLOWED`
- `AUTH_REQUIRED`
- `INVALID_INPUT`
- `USER_CONFIRMATION_REQUIRED`
- `RAW_TEXT_NOT_ALLOWED`
- `PAYLOAD_TOO_LARGE`
- `TITLE_TOO_SHORT`
- `MISSING_CORE_FIELD`
- `SAVE_FAILED`
- `SUPABASE_NOT_CONFIGURED`

## 10. 인증 구현 후보

### A. OAuth

Recommended final design.

- ChatGPT Action call passes the user token in the `Authorization` header.
- PASSMAP verifies the token and derives user ID server-side.
- OAuth implementation must use the `state` parameter.
- OAuth scope should be narrow, initially `experience:write`.
- Custom headers are not supported, so auth must use supported OAuth/API key mechanisms.

### B. User Action token / API key

MVP alternative.

- PASSMAP issues a user-specific token.
- ChatGPT Action uses API key or bearer token auth.
- Token plaintext is shown once and stored as a hash server-side.
- Revoke/list UX is required before production use.

### C. MCP pairing token reuse

Not recommended.

- It blurs MCP vs ChatGPT import attribution.
- It exposes a token lifecycle designed for local MCP wrappers to Custom GPT configuration.
- It complicates user revocation and support.

## 11. OAuth 구현 시 Protected 항목

OAuth follow-up is Protected. Separate PR required for:

- OAuth authorization endpoint.
- OAuth token endpoint.
- OAuth client registration.
- Redirect URI configuration.
- Token storage/refresh/revoke.
- Vercel env/secrets.
- Supabase schema or auth policy changes.
- Production deploy/redeploy.
- Privacy/security documentation changes.
- E2E with real ChatGPT GPT editor settings.

No OAuth/env/secrets work is included in this schema/doc patch.

## 12. Action token MVP 구현 시 범위

If OAuth is deferred, a token MVP still needs explicit scope control:

- Define a distinct token prefix, not `pmcp_`.
- Add or choose token table storage.
- Store only token hash.
- Show plaintext token once.
- Provide revoke/list UI.
- Add rate limiting.
- Add audit metadata.
- Add clear docs that this is an MVP bridge, not final OAuth.
- Custom headers are not supported by Actions, so the MVP must fit supported API key or OAuth-style auth configuration.

Protected parts remain:

- env/secrets.
- DB migration, if a new table is needed.
- production settings.
- deploy/redeploy.

## 13. 다음 패치 작업 범위

Recommended first implementation patch:

1. Add action branch in `api/save-analysis-run.js`:
   - `case "chatgpt_action_save_experience"`
   - handler: `handleChatgptActionSaveExperience`
2. Add validation helpers:
   - body object only
   - no raw text fields
   - `userConfirmed === true`
   - `sourcePlatform/importMethod` fixed values
   - payload length cap
3. Add auth placeholder only if a safe MVP auth decision exists.
4. Insert rows:
   - `raw_sources.raw_text = null`
   - `experience_cards.status = "accepted"`
   - `experience_evidence` from snippets
5. Update AI Inbox allowed origin:
   - include `chatgpt_action_save_experience`
   - preserve PR #583 update guard
6. Add targeted API smoke tests or manual request examples.

Do not include in first patch:

- OAuth implementation.
- env/secrets.
- DB migration.
- deploy/redeploy.
- destructive updates.
- conversion to resume material.
- AI extraction inside endpoint.

## 14. 다음 Codex 프롬프트 초안

```text
[PASSMAP - ChatGPT Action save endpoint wrapper P1]

Target repo:
D:\패스맵\reject-analyzer

Goal:
Implement the minimal endpoint wrapper for
POST /api/save-analysis-run?action=chatgpt_action_save_experience.

Use the existing MCP save structure as a reference, but keep ChatGPT Action
auth/import metadata separate.

Allowed files:
- api/save-analysis-run.js
- src/lib/experience/aiInboxRepository.js
- docs/chatgpt-actions-endpoint-wrapper-plan-20260529.md only if notes need update

Do not implement OAuth/env/secrets/deploy/DB migration.

Required behavior:
- POST only
- structured JSON only
- reject rawConversationText/rawText/raw_text/fullConversation/messages
- userConfirmed must be true
- sourcePlatform must be chatgpt
- importMethod must be chatgpt_action_save_experience
- raw_sources.raw_text must be null
- raw_sources.metadata.rawTextStored must be false
- experience_cards.status must be accepted
- evidenceTexts must be saved to experience_evidence
- response must be structured JSON
- no AI analysis inside endpoint
- preserve PR #583 AI Inbox status update guard

Verification:
- git diff --check
- targeted node/static checks
- unauthenticated request returns 401 or documented auth placeholder behavior
- invalid payload returns 400

Stop before OAuth/env/secrets/production deploy.
```
