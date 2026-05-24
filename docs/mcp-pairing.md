# PASSMAP MCP — Pairing Infrastructure (12-B1 / 12-B2)

운영 MCP의 첫 두 단계입니다. 사용자가 ChatGPT/Claude 같은 MCP 호스트에 PASSMAP을 안전하게 연결할 수 있도록,

- **12-B1**: 1회용 pairing code → 장기 MCP token 교환 인프라
- **12-B2**: MCP token으로 호출하는 운영 save / search endpoint

가 합쳐져 있습니다.

이 단계에는 prod wrapper(12-B4), PASSMAP 웹 UI 패널(12-B5), token revoke API(12-B5)는 아직 포함되지 않습니다.

---

## 1. 구성요소

| 파일 | 역할 |
|---|---|
| `supabase/sql/20260523_user_mcp_pairings.sql` | 신규 테이블 + RLS + index. **Protected 마이그레이션 — 12-B1 머지 후 수동 적용 완료.** |
| `api/_mcp_auth.js` | sha256 해싱, code/token 생성, Supabase 클라이언트, identity 검증 (Supabase access token / MCP token), Upstash rate limit |
| `api/save-analysis-run.js` | `?action=` 라우터. action 없이 호출하면 **기존 분석 저장 동작이 그대로 유지됩니다.** MCP action은 같은 파일에 통합. 현 시점 구현 상태: `mcp_health` / `mcp_pairing_create` / `mcp_pairing_exchange` / `mcp_save_experience` / `mcp_search_experiences` 동작. `mcp_pairing_revoke` 는 아직 `501 NOT_IMPLEMENTED` (12-B5) |

> Vercel Hobby 12-function 한도 때문에 MCP pairing action은 별도 `api/mcp.js`를 새로 만들지 않고, 기존 `api/save-analysis-run.js` 함수에 action router로 통합되어 있습니다. `?action=` 쿼리스트링이 없거나 빈 문자열이면 분석 저장 동작이 그대로 적용되어, 기존 호출자(`src/lib/persistence/saveAnalysisRun.js`)는 변경 없이 동작합니다.

## 2. 비밀 처리 정책

- **code 평문은 DB에 저장하지 않습니다.** `code_hash = sha256(code)`만 보관, 응답에서 1회 반환.
- **token 평문은 DB에 저장하지 않습니다.** `token_hash = sha256(token)`만 보관, `pairing_exchange` 응답에서 1회 반환.
- `code` TTL **10분**, 단일 사용 (`consumed_at` 기록 후 재사용 불가).
- `token` TTL **90일**, 사용자 web UI에서 revoke 가능(`revoked_at` 컬럼). revoke API는 12-B5에서 추가.
- `SUPABASE_SERVICE_ROLE_KEY`는 `process.env`에서만 읽고, 응답·로그·주석에 절대 인쇄하지 않습니다.

## 3. user_id 위조 방지

- `user_id`는 **모든 MCP action에서 요청 body에서 읽지 않습니다.** body의 `user_id` / `userId` 같은 필드는 검증 단계 이전에 무시됩니다.
- `pairing_create` → `Authorization: Bearer <Supabase access token>` → `supabase.auth.getUser(...)` → `user.id` 강제 적용.
- `pairing_exchange` → 일치하는 `code_hash` row의 `user_id` 사용. 클라이언트가 user_id를 전달할 통로 자체가 없음.
- `mcp_save_experience` / `mcp_search_experiences` → `Authorization: Bearer pmcp_…` (장기 MCP token). 서버가 `sha256(token) = token_hash` 매칭으로 row를 찾고, 거기서 `user_id`를 꺼내 모든 insert/select 에 강제 적용.

## 3-A. rawText 저장 금지 (12-B2)

`mcp_save_experience` 는 원문 대화 전체를 저장하지 않습니다.

- `raw_sources.raw_text` 는 항상 `null` 로 기록됩니다. 호출자가 body에 `rawText` / `raw_text` 를 넘기더라도 서버가 명시적으로 무시합니다.
- `raw_sources.metadata.rawTextStored = false` 가 함께 기록되어 사후 감사 시 데이터 수준에서 invariant를 확인할 수 있습니다.
- 사용자에게 보여줄 짧은 인용 근거만 `experience_evidence.evidence_text` 에 저장됩니다. `evidence_type` 은 `"quote"`, `metadata.importMethod = "mcp_save_experience"`.
- 따라서 PASSMAP에 영구 저장되는 것은 "사용자가 인용 근거로 명시한 짧은 발화 + 정규화된 STAR 후보 카드" 이며, 원문 대화는 보관되지 않습니다.

## 4. Rate limit

`api/_security.js`의 Upstash REST 패턴을 그대로 재현 (`mcp_rl:<key>:<UTC date>` 카운터, 24시간 TTL).

| Endpoint | 한도 | Key |
|---|---|---|
| `pairing_create` | 사용자당 일 10회 | `pairing_create:user:<userId>` |
| `pairing_exchange` | IP당 일 30회 | `pairing_exchange:ip:<sha256(ip).slice(0,16)>` |

`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` 환경변수가 없으면 fail-open (개발 환경 편의). 운영 ENV는 11-A에서 이미 설정되어 있으므로 추가 변경 없음.

## 5. SQL 적용 절차 (Protected)

> **12-B2 PR은 추가 SQL을 만들지 않습니다.** 12-B1에서 만들어진 `supabase/sql/20260523_user_mcp_pairings.sql` 만으로 충분합니다. `raw_sources` / `experience_cards` / `experience_evidence` 는 `20260515_experience_cards_schema.sql` 로 이미 운영에 적용되어 있습니다.

1. 12-B1 머지 직후, Supabase Dashboard → SQL Editor에서 `supabase/sql/20260523_user_mcp_pairings.sql` 적용 완료.
2. `public.user_mcp_pairings` 테이블, RLS, 정책, 인덱스 운영 환경 확인 완료.
3. 12-B2 머지 이후 endpoint smoke는 token이 있는 상황에서 진행.

SQL 미적용 또는 token 미발급 상태에서의 동작:
- `GET /api/save-analysis-run?action=mcp_health` → 200 OK
- `POST /api/save-analysis-run?action=mcp_pairing_create` (테이블 없음) → `500 PAIRING_CREATE_FAILED`
- `POST /api/save-analysis-run?action=mcp_pairing_exchange` (테이블 없음) → `500 EXCHANGE_FAILED`
- `POST /api/save-analysis-run?action=mcp_save_experience` (token 없음/유효하지 않음) → `401 AUTH_REQUIRED`
- `POST /api/save-analysis-run?action=mcp_search_experiences` (token 없음/유효하지 않음) → `401 AUTH_REQUIRED`
- `POST /api/save-analysis-run` (action 없음) → 기존 분석 저장 동작 그대로. SQL 적용과 무관하게 정상 동작.

## 6. 흐름

```
[PASSMAP 웹]                       [PASSMAP 서버]                   [DB]
  로그인 사용자 ───── POST ─────►  pairing_create
                                       ▼
                                 6자리 code 생성
                                 sha256(code) → code_hash
                                       ▼  ────────────────────────► INSERT user_mcp_pairings
                                                                         (user_id, code_hash,
                                                                          code_expires_at,
                                                                          client_name)
                                       ▼
                                 200 OK { code, expiresAt }
  사용자가 code 복사

[MCP wrapper / Claude Desktop]   [PASSMAP 서버]                   [DB]
  사용자가 code 입력 ── POST ───►  pairing_exchange
                                       ▼
                                 sha256(code) → code_hash 조회 ◄────── SELECT user_mcp_pairings
                                       ▼                                  WHERE code_hash = ?
                                                                            AND consumed_at is null
                                                                            AND revoked_at is null
                                                                            AND code_expires_at > now
                                       ▼
                                 token 평문 생성
                                 sha256(token) → token_hash
                                       ▼  ────────────────────────► UPDATE row
                                                                         token_hash = ?,
                                                                         token_expires_at = now+90d,
                                                                         consumed_at = now,
                                                                         code_hash = NULL
                                       ▼
                                 200 OK { token, tokenExpiresAt }
  wrapper가 token 저장
```

## 7. save / search action 상세 (12-B2)

### `?action=mcp_save_experience`

- 인증: `Authorization: Bearer <pmcp_…>` (장기 MCP token). 미인증/만료/취소 시 `401 AUTH_REQUIRED`.
- 입력 정규화: title 최소 2자, situation/task/actions 중 최소 한 개, arrays는 trim + 빈 값 제거, `sourcePlatform ∈ {chatgpt, gemini, claude, manual, unknown}`. body의 `rawText` / `raw_text` / `user_id` / `userId` 는 무시.
- 저장 흐름:
  1. `raw_sources` insert — `source_type = 'ai_conversation'`, `raw_text = null`, `summary` 는 STAR 요약, `metadata.rawTextStored = false`.
  2. `experience_cards` insert — `status = 'accepted'`, `confidence_level` 은 evidenceTexts 유무에 따라 `medium` / `low`, `metadata.importMethod = 'mcp_save_experience'`.
  3. `experience_evidence` insert — evidenceTexts 길이만큼 row 생성, `evidence_type = 'quote'`.
- 응답: `{ ok, experienceId, sourceId, evidenceCount, message, saved }`. `saved.summary` 는 280자 이하로 트림.
- 오류 코드: `INVALID_INPUT`, `TITLE_TOO_SHORT`, `MISSING_CORE_FIELD`, `AUTH_REQUIRED`, `SUPABASE_NOT_CONFIGURED`, `SAVE_FAILED`.

### `?action=mcp_search_experiences`

- 인증: 동일하게 MCP token 필수.
- 입력: 모두 optional. `limit` 기본 5, 상한 10.
- 검색 정책: 안전한 단순 구현. 해당 user_id의 최근 카드 최대 50개를 가져온 뒤 JS에서 case-insensitive 부분 일치(query) + 태그 AND 필터(skills/jobTags/industryTags)를 적용해 `limit` 만큼 반환합니다. pg_trgm·전문 검색·SQL migration 은 사용하지 않습니다.
- `raw_sources.raw_text` 는 select 쿼리에서 아예 읽지 않습니다.
- 응답: `{ ok, count, items[] }` — 각 item 은 `id`, `title`, `summary`, `skills`, `jobTags`, `industryTags`, `suggestedUse`, `evidenceTexts`, `createdAt`.
- 오류 코드: `INVALID_INPUT`, `AUTH_REQUIRED`, `SUPABASE_NOT_CONFIGURED`, `SEARCH_FAILED`.

## 7-A. pairing 관리 action (12-B5-A)

웹 사용자가 자신이 발급한 MCP 연동 항목을 조회·폐기할 수 있도록 두 action을 추가했습니다. 둘 다 PASSMAP 웹 로그인 사용자의 **Supabase access token**으로 인증합니다 — MCP token으로는 호출할 수 없습니다 (token을 잃어버린 사용자도 웹 로그인으로 revoke할 수 있어야 하기 때문).

### `?action=mcp_pairing_list`

- 인증: `Authorization: Bearer <Supabase access token>`
- 동작: 호출 사용자의 `user_mcp_pairings` row 목록을 `created_at desc`로 반환.
- `code_hash` / `token_hash`는 **select 쿼리 자체에 포함되지 않습니다.** 응답에도 등장하지 않습니다.
- 각 item에 lifecycle status를 derived field로 같이 내려보냅니다 (`revoked` / `expired` / `active` / `pending` / `inactive`). 향후 웹 패널이 동일 로직을 중복 구현하지 않도록 서버에서 한 번만 계산.
- 응답: `{ ok, items[] }` — 각 item: `id`, `clientName`, `status`, `createdAt`, `connectedAt`(= consumed_at), `lastUsedAt`, `tokenExpiresAt`, `revokedAt`, `codeExpiresAt`.
- 오류 코드: `AUTH_REQUIRED`, `SUPABASE_NOT_CONFIGURED`, `LIST_FAILED`.

### `?action=mcp_pairing_revoke`

- 인증: `Authorization: Bearer <Supabase access token>`
- 요청 body: `{ "pairingId": "<UUID>" }`. `user_id` / `userId`는 body에서 읽지 않습니다.
- 사전 ownership 조회(`id = pairingId AND user_id = verifiedUserId`)로 IDOR 차단 → soft-revoke (`revoked_at = now()`) + `code_hash` / `code_expires_at` / `token_hash` / `token_expires_at` 모두 `null`로 클리어.
- `token_hash`가 null이 되므로 `verifyMcpToken`이 곧바로 401을 반환하게 됩니다 — revoke 직후 동일 MCP token으로 `mcp_save_experience` / `mcp_search_experiences` 호출 시 `401 AUTH_REQUIRED`.
- 이미 revoked인 row를 다시 폐기해도 `revoked_at`을 덮어쓰지 않고 `{ ok: true, revoked: true, alreadyRevoked: true }`로 idempotent 응답.
- 오류 코드: `INVALID_PAIRING_ID` (400), `PAIRING_NOT_FOUND` (404), `AUTH_REQUIRED` (401), `SUPABASE_NOT_CONFIGURED` (503), `REVOKE_FAILED` (500).

## 8. 다음 단계

- **12-B4**: `tools/passmap-mcp-prod-wrapper/` — Claude Desktop이 spawn할 stdio MCP wrapper (12-A 구조 fork + REST 클라이언트). base URL은 **Vercel API host**(`https://reject-analyzer.vercel.app`)의 `/api/save-analysis-run`, 각 호출에 `?action=mcp_*` 부착. GitHub Pages(`true-hr.github.io/reject-analyzer/`)는 정적 프론트 전용이므로 wrapper base로 사용할 수 없습니다. URL 정책 전반은 CLAUDE.md "Operating URL Policy" 섹션 참조.
- **12-B5-A** (이번 PR): `?action=mcp_pairing_list` / `?action=mcp_pairing_revoke` 운영 API 추가 완료. 위 7-A 섹션 참조.
- **12-B5-B**: PASSMAP 웹 "MCP 연동" 패널 UI — 위 두 action을 호출해 사용자에게 목록·폐기를 노출. (아직 미구현.)

각 단계는 별도 Protected 또는 Standard PR. 새 action은 모두 `api/save-analysis-run.js`의 switch에 case 추가만으로 처리되므로 Vercel 함수 카운트는 변하지 않습니다.
