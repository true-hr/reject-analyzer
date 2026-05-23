# PASSMAP MCP — Pairing Infrastructure (12-B1)

운영 MCP의 첫 번째 단계입니다. 사용자가 ChatGPT/Claude 같은 MCP 호스트에 PASSMAP을 안전하게 연결할 수 있도록, **1회용 pairing code → 장기 MCP token 교환** 인프라만 도입합니다.

이 단계에는 `save_experience_candidate` / `search_experience_candidates` 운영 endpoint, prod wrapper, PASSMAP 웹 UI 패널은 포함되지 않습니다. 후속 12-B2~B5에서 진행합니다.

---

## 1. 구성요소

| 파일 | 역할 |
|---|---|
| `supabase/sql/20260523_user_mcp_pairings.sql` | 신규 테이블 + RLS + index. **Protected 마이그레이션 — 수동 적용 전까지는 endpoint가 실제 insert에 실패합니다.** |
| `api/_mcp_auth.js` | sha256 해싱, code/token 생성, Supabase 클라이언트, identity 검증 (Supabase access token / MCP token), Upstash rate limit |
| `api/save-analysis-run.js` | `?action=` 라우터. action 없이 호출하면 **기존 분석 저장 동작이 그대로 유지됩니다.** MCP pairing action(`mcp_health`, `mcp_pairing_create`, `mcp_pairing_exchange`)은 같은 파일에 통합되어 있으며, `mcp_save_experience` / `mcp_search_experiences` / `mcp_pairing_revoke` 는 `501 NOT_IMPLEMENTED` 반환 |

> Vercel Hobby 12-function 한도 때문에 MCP pairing action은 별도 `api/mcp.js`를 새로 만들지 않고, 기존 `api/save-analysis-run.js` 함수에 action router로 통합되어 있습니다. `?action=` 쿼리스트링이 없거나 빈 문자열이면 분석 저장 동작이 그대로 적용되어, 기존 호출자(`src/lib/persistence/saveAnalysisRun.js`)는 변경 없이 동작합니다.

## 2. 비밀 처리 정책

- **code 평문은 DB에 저장하지 않습니다.** `code_hash = sha256(code)`만 보관, 응답에서 1회 반환.
- **token 평문은 DB에 저장하지 않습니다.** `token_hash = sha256(token)`만 보관, `pairing_exchange` 응답에서 1회 반환.
- `code` TTL **10분**, 단일 사용 (`consumed_at` 기록 후 재사용 불가).
- `token` TTL **90일**, 사용자 web UI에서 revoke 가능(`revoked_at` 컬럼). revoke API는 12-B5에서 추가.
- `SUPABASE_SERVICE_ROLE_KEY`는 `process.env`에서만 읽고, 응답·로그·주석에 절대 인쇄하지 않습니다.

## 3. user_id 위조 방지

- `user_id`는 **요청 body에서 읽지 않습니다.**
- `pairing_create` → `Authorization: Bearer <Supabase access token>` → `supabase.auth.getUser(...)` → `user.id` 강제 적용.
- `pairing_exchange` → 일치하는 `code_hash` row의 `user_id` 사용. 클라이언트가 user_id를 전달할 통로 자체가 없음.

## 4. Rate limit

`api/_security.js`의 Upstash REST 패턴을 그대로 재현 (`mcp_rl:<key>:<UTC date>` 카운터, 24시간 TTL).

| Endpoint | 한도 | Key |
|---|---|---|
| `pairing_create` | 사용자당 일 10회 | `pairing_create:user:<userId>` |
| `pairing_exchange` | IP당 일 30회 | `pairing_exchange:ip:<sha256(ip).slice(0,16)>` |

`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` 환경변수가 없으면 fail-open (개발 환경 편의). 운영 ENV는 11-A에서 이미 설정되어 있으므로 추가 변경 없음.

## 5. SQL 적용 절차 (Protected)

> **이 PR은 SQL 파일을 추가만 합니다. 직접 적용하지 마세요.**

1. PR 리뷰 + 머지 후, Supabase Dashboard → SQL Editor에서 `supabase/sql/20260523_user_mcp_pairings.sql`을 그대로 실행.
2. 또는 프로젝트 표준 protected migration 워크플로(있다면)로 적용.
3. 마이그레이션 적용 후 12-B2 PR에서 endpoint 실제 동작 검증.

SQL 미적용 상태에서의 동작:
- `GET /api/save-analysis-run?action=mcp_health` → 200 OK
- `POST /api/save-analysis-run?action=mcp_pairing_create` → `500 PAIRING_CREATE_FAILED` (Supabase 테이블 없음). 사용자에게 노출되는 오류 코드만 보이고 service_role/스키마 디테일은 노출되지 않음.
- `POST /api/save-analysis-run?action=mcp_pairing_exchange` → 동일하게 `500 EXCHANGE_FAILED`.
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

## 7. 다음 단계

- **12-B2**: `?action=mcp_save_experience` — 실제 `experience_cards` / `raw_sources` / `experience_evidence` 저장. `verifyMcpToken`로 userId 강제.
- **12-B3**: `?action=mcp_search_experiences` — 검색 endpoint.
- **12-B4**: `tools/passmap-mcp-prod-wrapper/` — Claude Desktop이 spawn할 stdio MCP wrapper (12-A 구조 fork + REST 클라이언트). base URL은 `/api/save-analysis-run`, 각 호출에 `?action=mcp_*` 부착.
- **12-B5**: PASSMAP 웹 "MCP 연동" 패널 — code 발급/목록/revoke. `?action=mcp_pairing_revoke` + `?action=mcp_pairing_list` 추가.

각 단계는 별도 Protected 또는 Standard PR. 새 action은 모두 `api/save-analysis-run.js`의 switch에 case 추가만으로 처리되므로 Vercel 함수 카운트는 변하지 않습니다.
