# PASSMAP Backend / API / DB Map

> 역할: PASSMAP의 Supabase 테이블, Worker API 엔드포인트, env 의존성, 위험 지점을 정리한 문서.
> 주의: 실제 DB 접근 및 SQL 실행 금지. 코드에 근거한 확인/추정만 기록한다.
> 확실하지 않은 내용은 "확인 필요"로 남긴다.
> 작성일: 2026-04-29 (1차 뼈대)
> 참조 시점: Supabase, Worker, API, env, 인증 관련 작업 때 확인한다. 프론트 UI만 수정하는 작업에서는 읽지 않아도 된다. secret/env 실제 값은 이 문서에 기록하지 않는다.

---

## 1. Supabase 관련

### 1-1. Supabase 클라이언트 파일

| 항목 | 내용 |
|---|---|
| 파일 | `src/lib/supabaseClient.js` |
| 역할 | Supabase 클라이언트 싱글톤 생성 및 export |
| import 방식 | `import { supabase } from "./supabaseClient"` |
| env 의존성 | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| 미설정 시 동작 | console.warn 후 graceful degradation (demo 모드). supabase = null or 비활성화. |
| 세션 설정 | `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`, `flowType: "pkce"` |
| storageKey | `sb-truehr-reject-analyzer-auth` |
| 확인 상태 | 확인됨 |

### 1-2. 확인된 Supabase 테이블

| 테이블명 | 용도 | 확인 근거 | 접근 주체 |
|---|---|---|---|
| `work_records` | 업무 기록 저장 | `workRecordRepository.js` INSERT/SELECT/DELETE + Notion commit RPC | 프론트(anon key) + Worker(service role, RPC 경유) |
| `notion_connections` | Notion OAuth 연결 정보 저장 (access_token_enc, workspace_id 등) | `worker-ai/.../index.js` upsert/select | Worker(service role key) |
| `external_record_links` | Notion → work_records 연결 이력 (deduplication, content hash) | `worker-ai/.../index.js` `lookupExternalRecordLinks` 함수, RPC `import_notion_work_record` 경유 INSERT 추정 | Worker(service role key, RPC 경유) |

> **Supabase Stored Procedure (RPC):** `/rest/v1/rpc/import_notion_work_record` — Worker의 commit handler가 호출. `work_records`와 `external_record_links` 양쪽에 원자적 INSERT 수행. **SQL 로컬 확인됨** (`supabase/sql/20260429_notion_import_commit_rpc.sql`). SECURITY DEFINER, service_role 전용. 상세는 섹션 9 참조.

> **external_record_links 스키마 로컬 확인됨** (`supabase/sql/20260428_notion_import_foundation.sql`). 13컬럼, unique(user_id, provider, external_record_id), RLS owner SELECT 허용. 상세는 섹션 10 참조.

> **notion_connections 스키마 로컬 확인됨** (`supabase/sql/20260428_notion_import_foundation.sql`). 11컬럼 (id, user_id, workspace_id, workspace_name, bot_id, access_token_enc, status, connected_at, last_checked_at, created_at, updated_at). RLS 없음 (direct-client 정책 없음, Worker service_role 전용).

**확인 필요:**
- `work_records` 외 다른 테이블 (user profile, resume, analysis 저장 등) 존재 여부
- `work_records` RLS 정책 상세 (프론트 authenticated role 접근 범위)
- `raw_payload` jsonb top-level 키 구조 (RPC SQL은 Worker 빌드 기준 jsonb를 그대로 저장)

**확인됨 (DOC-INV-4):**
- `notion_connections` 컬럼: id, user_id, workspace_id, workspace_name, bot_id, access_token_enc, status, connected_at, last_checked_at, created_at, updated_at / unique(user_id, workspace_id)
- `external_record_links` 스키마: 섹션 10 참조
- `import_notion_work_record` RPC SQL: 섹션 9 참조
- RLS: `notion_connections` — direct-client 정책 없음(Worker service_role 전용). `external_record_links` — authenticated owner SELECT만 허용.

### 1-3. 확인된 Supabase 함수/파일

| 파일 | 함수 | 역할 | 확인 상태 |
|---|---|---|---|
| `src/lib/workRecordRepository.js` | `createWorkRecord(payload)` | work_records INSERT | 확인됨 |
| `src/lib/workRecordRepository.js` | `listWorkRecords(userId)` | work_records SELECT | 확인됨 |
| `src/lib/workRecordRepository.js` | `deleteWorkRecord(id)` | work_records DELETE | 확인됨 |
| `src/lib/workRecordRepository.js` | `updateWorkRecord(id, payload)` | work_records UPDATE | 확인됨 (UI 소비 위치 확인 필요) |
| `src/lib/auth.js` | `signInWithGoogle()` | Google OAuth 시작 | 확인됨 |
| `src/lib/supabaseClient.js` | `supabase.auth.*` | 세션 관리 | 확인됨 |

### 1-4. Supabase 인증 흐름

```
사용자 → signInWithGoogle() → supabase.auth.signInWithOAuth({ provider: "google" })
       → Google OAuth redirect → Supabase auth callback
       → App.jsx auth state 동기화 (authSyncReady, auth.loggedIn, auth.userId)
       → pendingAction 실행 (로그인 전 시도한 작업 자동 재실행)
```

---

## 2. Worker API (Cloudflare Worker)

### 2-1. Worker 파일 위치

- `worker-ai/orange-shadow-95c1/src/index.js`
- env: `VITE_AI_PROXY_URL` (프론트에서 Worker URL로 사용)
- **중요:** Notion 엔드포인트는 Worker 전용. Vercel/프론트 fallback 없음.

### 2-2. 확인된 엔드포인트 목록

| 엔드포인트 | 메서드 | 목적 | 인증 필요 여부 | 프론트 호출 위치 |
|---|---|---|---|---|
| `/api/enhance` | POST | 텍스트 AI 개선 (업무 기록 문장 생성 추정) | 확인 필요 | 확인 필요 (추정: PmMvpView.jsx 또는 HomeDashboard.jsx) |
| `/api/parse` | POST | 파일/텍스트 파싱 (JD/Resume 파싱 추정) | 확인 필요 | 확인 필요 (추정: UploadPanel.jsx 또는 parseWithAI.js) |
| `/api/notion/auth-url` | POST | Notion OAuth URL 생성 | 불필요 (OAuth 시작점) | `HomeDashboard.jsx` |
| `/api/notion/callback` | GET | Notion OAuth callback redirect 처리 | 불필요 (OAuth redirect) | Worker 자체 처리 (브라우저 redirect) |
| `/api/notion/status` | GET | Notion 연결 상태 확인 | 추정: 세션 기반 | `HomeDashboard.jsx` |
| `/api/notion/sources` | GET | 연결된 Notion DB 목록 조회 | 추정: 세션 기반 | `HomeDashboard.jsx` |
| `/api/notion/source-schema` | GET | Notion DB 스키마/속성 조회 | 추정: 세션 기반 | `HomeDashboard.jsx` |
| `/api/notion/preview` | POST | import 전 preview (정규화 결과 확인) | 추정: 세션 기반 | `HomeDashboard.jsx` |
| `/api/notion/commit` | POST | Notion → PASSMAP 기록 실제 import | 추정: 세션 기반 | `HomeDashboard.jsx` |

**확인 필요:**
- `/api/enhance`와 `/api/parse`의 프론트 실제 호출 위치
- Worker 환경변수 목록 (NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, AI model key 등)
- Notion OAuth 세션 저장 방식 (KV store, D1 등)
- `/api/notion/commit` 후 Supabase work_records에 저장되는지 여부

### 2-3. Worker 환경변수 (추정)

| 환경변수 | 용도 | 확인 상태 |
|---|---|---|
| NOTION_CLIENT_ID | Notion OAuth 앱 ID | 추정 (코드 내 직접 확인 필요) |
| NOTION_CLIENT_SECRET | Notion OAuth 앱 시크릿 | 추정 |
| (AI 모델 키) | /api/enhance, /api/parse용 AI 호출 | 추정 |

---

## 3. env 의존성 전체 목록

| 변수명 | 위치 | 용도 | 미설정 시 동작 |
|---|---|---|---|
| `VITE_SUPABASE_URL` | 프론트 (supabaseClient.js) | Supabase 프로젝트 URL | console.warn + demo 모드 |
| `VITE_SUPABASE_ANON_KEY` | 프론트 (supabaseClient.js) | Supabase 익명 키 | console.warn + demo 모드 |
| `VITE_AI_PROXY_URL` | 프론트 (HomeDashboard.jsx) | Worker URL | Notion 연동 시 명시적 오류 발생 |

**확인 필요:**
- `VITE_AI_PROXY_URL` 이외 Worker URL 관련 변수 존재 여부
- `/api/enhance`, `/api/parse` 호출 시에도 동일 `VITE_AI_PROXY_URL` 사용하는지

---

## 4. 임시 구현 / 위험 지점

| 항목 | 내용 | 위험도 |
|---|---|---|
| work_records adapter 분리 | PmMvpView.jsx와 HomeDashboard.jsx에 별도 adapter 존재. shape 변경 시 두 곳 동시 수정 필요 | medium |
| Notion commit → work_records 저장 경로 확인됨 | 2026-04-29 확인: RPC `import_notion_work_record` 경유 work_records INSERT + external_record_links INSERT 원자적 실행. committed > 0이면 `passmap:work-records-changed` 이벤트로 캘린더 refetch 트리거. **RPC SQL 로컬 확인됨** (`supabase/sql/20260429_notion_import_commit_rpc.sql`). 섹션 9 참조. | high (RPC 의존) |
| auth.js.bak 파일 존재 | Supabase OAuth 이전 버전 auth 코드 추정. 완전 제거 전 확인 필요 | low |
| /api/enhance __key 스코프 버그 | `__key`가 /api/parse 블록 내부에서 const로 선언되어 /api/enhance fallthrough 경로에서 ReferenceError 발생. /api/enhance 항상 실패 상태 | high |
| /api/enhance, /api/parse 프론트 호출 위치 | App.jsx(line 720, 810)와 extractTextFromFile.browser.js에서 호출 확인됨. /api/enhance는 스코프 버그로 현재 미작동 | medium |
| wrangler.toml 미커밋 | Worker 설정 파일이 repo에 없음. 새 개발 환경에서 Worker 실행 방법 불명확 | medium |
| .env.example에 VITE_AI_PROXY_URL 누락 | Worker URL 설정 가이드가 .env.example에 없음. 신규 개발자 환경 설정 누락 가능 | medium |
| NOTION_REDIRECT_URI 배포 URL 의존 | Worker 배포 URL이 바뀌면 NOTION_REDIRECT_URI도 변경 + Notion OAuth 앱 설정도 동시 변경 필요 | medium |
| updateWorkRecord UI 연결 위치 불명 | 수정 기능 존재하나 실제 호출 UI owner 미확인 | low |

---

## 5. Worker Env / Config Map

> 2026-04-29 조사 완료 (코드 기준). 실제 값은 확인하지 않음.
> wrangler.toml이 repo에 없으므로 Cloudflare Dashboard 또는 `wrangler secret put`으로 관리됨.

| env/config 이름 | 사용 위치 | 관련 endpoint/기능 | 목적 | 필수 여부 | 없을 때 동작 | 보안 주의 | 확인 상태 |
|---|---|---|---|---|---|---|---|
| `GEMINI_API_KEY` | index.js line 85 (`/api/parse` 블록 내) | `/api/parse` | Gemini AI API 호출 (v1) | 선택 (V2로 대체 가능) | V2 있으면 V2 사용. 둘 다 없으면 `NO_API_KEY` 오류 반환 | Worker secret. 절대 코드/로그에 노출 금지 | 확인됨 |
| `GEMINI_API_KEY_V2` | index.js line 85 (`/api/parse` 블록 내) | `/api/parse` | Gemini AI API 호출 (v2, 우선) | 선택 (V1으로 대체 가능) | V1 있으면 V1 사용. 둘 다 없으면 `NO_API_KEY` 오류 반환 | Worker secret. 절대 코드/로그에 노출 금지 | 확인됨 |
| `SUPABASE_URL` | index.js `requireSupabaseUser`, `supabaseRest` 헬퍼 | 모든 Notion endpoint (auth-url/callback/status/sources/source-schema/preview/commit) | Supabase 프로젝트 URL | 필수 (Notion 기능 전체) | 500 "Supabase config missing" 반환 | semi-public (프로젝트 URL) | 확인됨 |
| `SUPABASE_SERVICE_ROLE_KEY` | index.js `requireSupabaseUser`, `supabaseRest` 헬퍼 | 모든 Notion endpoint | Supabase admin 권한 (RLS 우회, service role) | 필수 (Notion 기능 전체) | 500 "Supabase config missing" 반환 | **CRITICAL — 절대 클라이언트 노출 금지. Worker에서만 사용. RLS 우회됨** | 확인됨 |
| `TOKEN_ENCRYPTION_KEY` | index.js `importAesKey` 헬퍼 | auth-url, callback, sources, source-schema, preview, commit | Notion access_token을 AES-256-GCM으로 암호화/복호화 | 필수 (Notion OAuth 전체) | 500 "TOKEN_ENCRYPTION_KEY not set" 반환. 32바이트 base64 형식 필수 | **CRITICAL — 변경 시 기존 암호화된 토큰 전부 복호화 불가** | 확인됨 |
| `NOTION_CLIENT_ID` | index.js `buildNotionAuthUrl`, `exchangeNotionCodeForToken` | auth-url, callback | Notion OAuth 앱 ID | 필수 (Notion OAuth) | 500 "Worker config missing" 반환 | semi-public (OAuth client_id는 URL에 노출됨) | 확인됨 |
| `NOTION_CLIENT_SECRET` | index.js `exchangeNotionCodeForToken` | callback only (코드↔토큰 교환) | Notion OAuth 앱 시크릿 | 필수 (callback) | 500 "Worker config missing" 반환 | **CRITICAL — Worker secret. 절대 클라이언트/로그 노출 금지** | 확인됨 |
| `NOTION_REDIRECT_URI` | index.js `buildNotionAuthUrl`, `exchangeNotionCodeForToken` | auth-url, callback | Notion OAuth redirect URI | 필수 (Notion OAuth) | 500 "Worker config missing" 반환 | 반드시 Notion OAuth 앱 설정의 redirect URI와 정확히 일치. Worker URL 변경 시 동시 변경 필수 | 확인됨 |

---

## 6. Worker Endpoint별 Env 의존성

| endpoint | handler 함수 | 필요한 env/config | 프론트 호출 위치 | 인증/보안 주의 | 현재 확인 상태 |
|---|---|---|---|---|---|
| `POST /api/parse` | (라우터 직접 처리) | `GEMINI_API_KEY` 또는 `GEMINI_API_KEY_V2` (둘 중 하나 필수) | `App.jsx` line 810 (`VITE_PARSE_API_BASE` 또는 `VITE_AI_PROXY_URL`), `extractTextFromFile.browser.js` line 170 | 인증 없음. 입력 길이 12000자 제한 | 확인됨 |
| `POST /api/enhance` | (라우터 직접 처리, /api/parse fallthrough) | `GEMINI_API_KEY` 또는 `GEMINI_API_KEY_V2` (둘 중 하나 필수) | `App.jsx` line 720 (`VITE_AI_PROXY_URL`) | **버그 주의: `__key`가 /api/parse 블록 스코프에 선언되어 /api/enhance 경로에서 ReferenceError. 현재 항상 실패.** | 스코프 버그 확인됨 |
| `POST /api/notion/auth-url` | `handleNotionAuthUrl` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NOTION_CLIENT_ID`, `NOTION_REDIRECT_URI`, `TOKEN_ENCRYPTION_KEY` (5종 전부 필수) | `HomeDashboard.jsx` (getWorkerBase 경유) | Supabase Bearer 토큰 인증 필수. 토큰 없으면 401 | 확인됨 |
| `GET /api/notion/callback` | `handleNotionCallback` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`, `NOTION_REDIRECT_URI`, `TOKEN_ENCRYPTION_KEY` (6종 전부 필수) | Notion OAuth redirect (브라우저 직접) | state 암호화 검증. NOTION_CLIENT_SECRET으로 토큰 교환. access_token을 AES-GCM 암호화 후 DB 저장 | 확인됨 |
| `GET /api/notion/status` | `handleNotionStatus` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `HomeDashboard.jsx` | Supabase Bearer 토큰 인증 필수 | 확인됨 |
| `GET /api/notion/sources` | `handleNotionSources` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TOKEN_ENCRYPTION_KEY` | `HomeDashboard.jsx` | Supabase 인증 + Notion access_token 복호화 필요 | 확인됨 |
| `GET /api/notion/source-schema` | `handleNotionSourceSchema` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TOKEN_ENCRYPTION_KEY` | `HomeDashboard.jsx` | Supabase 인증 + Notion access_token 복호화 필요 | 확인됨 |
| `POST /api/notion/preview` | `handleNotionPreview` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TOKEN_ENCRYPTION_KEY` (requireSupabaseUser + getActiveNotionConnection 경유) | `HomeDashboard.jsx` | Supabase 인증 + Notion access_token 복호화 필요 | 확인됨 |
| `POST /api/notion/commit` | `handleNotionCommit` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TOKEN_ENCRYPTION_KEY` (requireSupabaseUser + getActiveNotionConnection 경유) | `HomeDashboard.jsx` | Supabase 인증 + Notion access_token 복호화 + `work_records` INSERT | 확인됨 |

---

## 7. Frontend Env / Worker Base URL Map

| env 이름 | 사용 파일 | 사용 함수/컴포넌트 | 목적 | 없을 때 동작 | 확인 상태 |
|---|---|---|---|---|---|
| `VITE_AI_PROXY_URL` | `src/App.jsx` (line 720, 3378), `src/components/home/HomeDashboard.jsx` (line 402), `src/lib/extract/extractTextFromFile.browser.js` (line 170) | App.jsx `getWorkerBaseUrl`, HomeDashboard.jsx `getWorkerBase` | Worker base URL (기본값) | App.jsx: "VITE_AI_PROXY_URL is missing" 오류 반환. HomeDashboard.jsx: Notion 연동 전체 차단 | 확인됨 |
| `VITE_API_BASE` | `src/App.jsx` (line 720) | App.jsx `getWorkerBaseUrl` | `VITE_AI_PROXY_URL` 대체 fallback | `VITE_AI_PROXY_URL`이 없을 때만 사용 | 확인됨 |
| `VITE_PARSE_API_BASE` | `src/App.jsx` (line 810), `src/lib/extract/extractTextFromFile.browser.js` (line 170) | App.jsx parse 호출, extractTextFromFile parse 호출 | `/api/parse` endpoint 전용 base URL override | `VITE_AI_PROXY_URL`로 fallback | 확인됨 |
| `VITE_GOOGLE_CALENDAR_ENABLED` | `src/components/home/HomeDashboard.jsx` (CAL-4B 패치) | HomeDashboard.jsx `showGoogleCalendarSync` | Google Calendar 자동연동 UI shell 노출 여부 (개발/검수용) | false (UI 미노출) — 기본 안전 | 확인됨 (`.env.example`에 문서화) |

**누락 확인 필요:**
- `VITE_AI_PROXY_URL`이 `.env.example`에 없음 → 신규 개발자 환경 설정 가이드 부재

---

## 8. 운영/보안 확인 필요 사항

### Cloudflare Worker Secrets로 관리해야 할 값

`wrangler secret put <NAME>` 또는 Cloudflare Dashboard > Workers > Settings > Variables에서 Secret으로 등록 필요:

| secret 이름 | 위험도 | 이유 |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | 최고 | RLS 우회 admin 권한. 노출 시 DB 전체 접근 가능 |
| `TOKEN_ENCRYPTION_KEY` | 최고 | 변경 시 기존 모든 Notion 연결 토큰 복호화 불가. 노출 시 Notion 토큰 전부 탈취 가능 |
| `NOTION_CLIENT_SECRET` | 높음 | Notion OAuth 코드 교환용. 노출 시 다른 앱이 Notion 토큰 발급 가능 |
| `GEMINI_API_KEY` / `GEMINI_API_KEY_V2` | 높음 | AI API 비용 발생. 노출 시 무단 API 사용 |

### 프론트에 노출되면 안 되는 값

- `SUPABASE_SERVICE_ROLE_KEY` — Worker 전용. `VITE_` prefix 절대 사용 금지
- `TOKEN_ENCRYPTION_KEY` — Worker 전용. `VITE_` prefix 절대 사용 금지
- `NOTION_CLIENT_SECRET` — Worker 전용. `VITE_` prefix 절대 사용 금지
- `GEMINI_API_KEY` / `V2` — Worker 전용. `VITE_` prefix 절대 사용 금지

### redirect URI 설정 확인 필요

- `NOTION_REDIRECT_URI`는 Worker 배포 URL과 정확히 일치해야 합니다.
- Notion OAuth 앱 설정(Notion integrations 페이지)의 Redirect URI도 동일값이어야 합니다.
- Worker를 새 URL로 이동하거나 staging 환경을 추가할 경우 양쪽 모두 변경 필요.

### /api/enhance 스코프 버그 (BUGFIX-1에서 수정 완료)

- `/api/enhance` 핸들러에서 `__key`(GEMINI key)가 `/api/parse` if 블록 스코프 내에서 `const`로 선언되어 있었음.
- `/api/enhance` 경로로 진입하면 `__key is not defined` ReferenceError → try/catch에서 잡혀 `{ok: false, error: ...}` 반환.
- **BUGFIX-1 (2026-04-29)에서 수정 완료.** `__key` 선언을 `/api/parse` if 블록 외부(try 블록 최상단 line 68)로 이동. `/api/parse`와 `/api/enhance` 양쪽에서 공유됨.

### wrangler.toml 미커밋

- Worker 설정 파일(`wrangler.toml`)이 repo에 없습니다.
- 신규 개발 환경에서 Worker 배포 방법과 설정이 불명확합니다.
- Cloudflare Dashboard 또는 별도 문서에서 관리 중인 것으로 추정됩니다.

### local/prod env 분리 필요

| 구분 | 권장 설정 방법 |
|---|---|
| 로컬 개발 (프론트) | `.env.local` — `VITE_AI_PROXY_URL=<Worker URL>` |
| 로컬 개발 (Worker) | `.dev.vars` — 8개 Worker secret (현재 예시 파일 없음) |
| 프로덕션 (프론트) | Vercel 환경변수 — `VITE_AI_PROXY_URL` 등 |
| 프로덕션 (Worker) | Cloudflare Dashboard Secrets — 8개 secret |

### 백엔드 개발자에게 넘겨야 할 부분

- `TOKEN_ENCRYPTION_KEY` 생성 방법 (`openssl rand -base64 32`)
- Notion OAuth 앱 redirect URI 등록 절차
- `notion_connections` 테이블 RLS 정책 설계
- Worker secrets 초기 설정 절차 문서화
- `/api/enhance` 스코프 버그 수정

---

## 9. Supabase RPC: import_notion_work_record

> 파일: `supabase/sql/20260429_notion_import_commit_rpc.sql` — Round 7-G1-A
> 설계 문서: `docs/notion-import-commit-contract.md`

### 9-1. 함수 서명

```sql
CREATE OR REPLACE FUNCTION public.import_notion_work_record(
  p_user_id               uuid,
  p_external_record_id    text,
  p_content_hash          text,
  p_work_record_payload   jsonb,
  p_external_link_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
```

### 9-2. 실행 권한

| 역할 | EXECUTE 권한 |
|---|---|
| PUBLIC | REVOKE (기본값 제거) |
| anon | REVOKE |
| authenticated | REVOKE |
| service_role | GRANT (Worker 전용) |

### 9-3. 처리 흐름

1. **입력 검증** — p_user_id, p_external_record_id, p_work_record_payload, title, record_date 필수 체크. DML 전 early return.
2. **work_records INSERT** — source='notion' 하드코딩. p_work_record_payload에서 모든 필드 추출.
3. **external_record_links INSERT** — provider='notion' 하드코딩. `ON CONFLICT (user_id, provider, external_record_id) DO NOTHING`.
4. **중복 처리** — v_link_id IS NULL이면 Step 2 INSERT된 work_record를 DELETE 후 `skipped_duplicate` 반환 (orphan 방지).
5. **성공 반환** — `{ok: true, status: "committed", work_record_id, link_id}`.
6. **예외 처리** — EXCEPTION WHEN OTHERS: PL/pgSQL 자동 DML 롤백 + `{ok: false, status: "failed", error_code: "db_error", message: SQLERRM}`.

### 9-4. 반환 shape

| status | ok | work_record_id | link_id | 의미 |
|---|---|---|---|---|
| `committed` | true | uuid | uuid | 신규 import 성공 |
| `skipped_duplicate` | true | null | null | 동일 Notion 페이지 이미 import됨 |
| `failed` | false | — | — | 입력 검증 실패 또는 DB 오류 |

---

## 10. Table: external_record_links 스키마

> 파일: `supabase/sql/20260428_notion_import_foundation.sql`

### 10-1. 컬럼 목록

| 컬럼명 | 타입 | 기본값 | NOT NULL | 설명 |
|---|---|---|---|---|
| id | uuid | gen_random_uuid() | ✅ | PK |
| user_id | uuid | — | ✅ | FK → auth.users(id) ON DELETE CASCADE |
| provider | text | 'notion' | ✅ | check in ('notion') |
| external_source_id | text | — | — | Notion: data_source_id 또는 database_id |
| external_record_id | text | — | ✅ | Notion: page_id. unique dedup 키 일부 |
| work_record_id | uuid | — | — | FK → work_records(id) ON DELETE SET NULL. 삭제 시 NULL 보존 |
| external_updated_at | timestamptz | — | — | Notion 페이지 최종 수정 시각 |
| content_hash | text | — | — | import 시점 SHA-256 hash. 재import 변경 감지용 |
| last_imported_at | timestamptz | — | — | 최종 import 시각 |
| sync_status | text | 'imported' | ✅ | check in ('imported','skipped','pending_update','conflict','deleted','error') |
| raw_meta | jsonb | '{}' | ✅ | Notion 메타 스냅샷 (page title, last_edited_time, url 등) |
| created_at | timestamptz | now() | ✅ | — |
| updated_at | timestamptz | now() | ✅ | set_updated_at 트리거로 자동 갱신 |

### 10-2. 제약

- **Unique:** `(user_id, provider, external_record_id)` — 동일 Notion 페이지 중복 import 방지
- **FK:** `user_id` → `auth.users(id)` ON DELETE CASCADE
- **FK:** `work_record_id` → `work_records(id)` ON DELETE SET NULL

### 10-3. 인덱스

`user_id`, `provider`, `(user_id, provider)`, `(user_id, provider, external_source_id)`, `work_record_id`, `sync_status`, `external_updated_at`

### 10-4. RLS 정책

| 역할 | 조작 | 허용 조건 |
|---|---|---|
| authenticated | SELECT | `auth.uid() = user_id` (owner only) |
| authenticated | INSERT / UPDATE / DELETE | 정책 없음 (Worker service_role 전용) |

---

## 11. Worker RPC 호출 계약

> Worker `handleNotionCommit` ↔ SQL `import_notion_work_record` 인자 정합성 확인 (2026-04-29)

### 11-1. 인자 매핑

| SQL 파라미터 | JS 빌드 방법 | 타입 |
|---|---|---|
| `p_user_id` | `requireSupabaseUser` → userId | uuid |
| `p_external_record_id` | Notion page.id | text |
| `p_content_hash` | SHA-256(JSON.stringify(mappedFields)) | text |
| `p_work_record_payload` | `{record_date, title, description, task, result, project_name, skill_tags, strength_tags, work_type, visibility: "private", raw_payload}` | jsonb |
| `p_external_link_payload` | `{external_source_id, external_updated_at, raw_meta}` | jsonb |

### 11-2. RPC 호출 방식

- endpoint: `POST /rest/v1/rpc/import_notion_work_record`
- headers: `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`, `Prefer: return=representation`
- helper: Worker `supabaseRest(env, path, options)`

### 11-3. 인자 정합성

**일치** — Worker RPC body와 SQL 함수 서명이 5개 파라미터 모두 정확히 일치. source, provider는 SQL에서 하드코딩되므로 Worker에서 전달하지 않아도 됨.

### 11-4. 위험 지점

| 위험 | 설명 |
|---|---|
| RPC 서명 변경 | SQL에서 파라미터 추가/제거 시 Worker 호출 코드도 동시 변경 필요 |
| p_work_record_payload 필드 누락 | title, record_date 미전달 시 RPC 내부 검증에서 failed 반환 |
| service_role 키 만료/교체 | Worker의 모든 Notion endpoint + RPC 호출 전부 인증 실패 |
| content_hash 알고리즘 변경 | Worker와 DB side 중복 감지 로직 불일치 시 duplicate 미감지 |

---

## 12. 참고 문서

- `docs/PASSMAP_SOURCE_MAP.md` — 기능별 owner 파일 지도
- `docs/PASSMAP_HIGH_RISK_FILES.md` — 위험 파일 수정 지침
- `docs/record-to-resume-contract.md` — ResumeUpdateCandidate 계약
- `docs/notion-import-normalization-contract.md` — Notion import 정규화 계약
- `docs/notion-import-preview-contract.md` — Notion preview 계약
- `docs/notion-import-commit-contract.md` — Notion commit 계약
