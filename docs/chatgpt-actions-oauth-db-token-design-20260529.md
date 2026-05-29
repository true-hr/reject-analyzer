# PASSMAP ChatGPT Actions OAuth DB/token Storage Design

## 1. 목적

이 문서는 PASSMAP ChatGPT Actions OAuth 구현 전에 필요한 DB/token 저장 구조를 고정하는 설계 문서다.

이번 단계는 설계 문서와 SQL draft 작성만 포함한다. 실제 DB migration 실행, Supabase 변경, OAuth endpoint 구현, env/secrets 변경, deploy/redeploy, GPT editor 등록, production smoke는 포함하지 않는다.

## 2. 직전 조사 결론

직전 READ-ONLY 조사 결론:

- OAuth 구현에 바로 들어가지 않는다.
- 먼저 DB migration 설계 PR이 필요하다.
- 최소 안전 구현안은 DB 저장형 state, hash 저장형 authorization code, hash 저장형 자체 OAuth access token 테이블이다.
- refresh token은 초기 MVP에서 제외하는 것이 안전하다.
- Supabase access token을 ChatGPT OAuth access token으로 그대로 재사용하는 것은 운영 정식안으로 부적절하다.
- OAuth endpoint는 현재 repo 구조상 Vercel `api/**` 쪽이 자연스럽다.
- token 검증 helper는 후속 구현에서 `api/_mcp_auth.js`에 `verifyChatgptOAuthToken()` 같은 형태로 추가하는 것이 변경 범위가 작다.

## 3. 왜 DB migration이 필요한가

OAuth 운영 연동에는 다음 서버 상태가 필요하다.

- authorize 요청에서 받은 `state`의 만료, 사용 여부, 재사용 방지
- authorization code의 만료, 사용 여부, redirect URI/client/scope 검증
- ChatGPT Action 호출용 자체 access token의 user_id, scope, client_id, 만료, revoke, last_used_at 관리

현재 repo와 Supabase schema에는 ChatGPT OAuth 전용 state/code/token 테이블이 없다. `user_mcp_pairings`는 MCP pairing token용이고, Notion/Google Calendar connection 테이블은 외부 provider token 저장용이다. OAuth provider 역할을 하는 PASSMAP ChatGPT Actions에는 별도 테이블이 필요하다.

## 4. 테이블 설계 요약

제안 테이블:

- `public.chatgpt_oauth_states`
- `public.chatgpt_oauth_authorization_codes`
- `public.chatgpt_oauth_access_tokens`

결정:

- DB 저장형 state를 사용한다.
- authorization code는 원문 저장 없이 hash 저장한다.
- access token도 원문 저장 없이 hash 저장한다.
- token prefix 또는 token id로 lookup 후 hash 비교하는 구조를 권장한다.
- access token은 자체 PASSMAP ChatGPT OAuth token으로 발급한다.
- Supabase access token을 ChatGPT OAuth access token으로 그대로 재사용하지 않는다.
- refresh token은 초기 MVP에서 제외한다.
- revoke를 위해 access token 테이블에 `revoked_at`을 둔다.
- `last_used_at`을 둬서 운영 진단과 감사가 가능하게 한다.
- user-facing 직접 조회는 하지 않는다.
- service_role 또는 서버 전용 접근을 기본으로 한다.
- 사용자 연결 관리 UI가 필요해지면 hash를 노출하지 않는 별도 endpoint 또는 safe view를 후속으로 만든다.

## 5. `chatgpt_oauth_states` 설계

목적:

- OAuth authorize 시작 시 state 저장
- CSRF 방지
- state 재사용 방지

컬럼 후보:

- `id uuid primary key default gen_random_uuid()`
- `state_hash text not null unique`
- `client_id text not null`
- `redirect_uri text not null`
- `scope text not null`
- `user_id uuid null references auth.users(id) on delete cascade`
- `expires_at timestamptz not null`
- `consumed_at timestamptz null`
- `created_at timestamptz not null default now()`
- `metadata jsonb not null default '{}'::jsonb`

인덱스 후보:

- `state_hash`
- `expires_at`
- `consumed_at`
- `user_id`

운영 규칙:

- state 원문은 저장하지 않는다.
- `state_hash`로 조회하고, 미만료/미사용 상태일 때만 유효하다.
- callback/token 교환 흐름에서 사용되면 `consumed_at`을 기록한다.
- `state_hash` 로그 출력 금지는 아니지만, 원문 state와 사용자 식별정보는 로그에 넣지 않는다.

## 6. `chatgpt_oauth_authorization_codes` 설계

목적:

- authorization code 발급/교환 추적
- code 재사용 방지
- redirect_uri/client/scope 검증

컬럼 후보:

- `id uuid primary key default gen_random_uuid()`
- `code_hash text not null unique`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `client_id text not null`
- `redirect_uri text not null`
- `scope text not null`
- `expires_at timestamptz not null`
- `consumed_at timestamptz null`
- `created_at timestamptz not null default now()`
- `metadata jsonb not null default '{}'::jsonb`

인덱스 후보:

- `code_hash`
- `user_id`
- `client_id`
- `expires_at`
- `consumed_at`

TTL:

- 5~10분
- MCP pairing code TTL 10분 패턴을 참고할 수 있다.
- 정확한 TTL은 후속 implementation PR에서 확정한다.

운영 규칙:

- code 원문은 저장하지 않는다.
- token endpoint는 code 원문을 hash 처리해 `code_hash`로 조회한다.
- `client_id`, `redirect_uri`, `scope`, `expires_at`, `consumed_at`을 모두 검증한다.
- 성공적으로 교환되면 `consumed_at`을 기록해 재사용을 막는다.

## 7. `chatgpt_oauth_access_tokens` 설계

목적:

- ChatGPT Action 호출용 자체 OAuth access token 관리
- `user_id`/`scope`/`client_id` 도출
- revoke/expiry/`last_used_at` 관리

컬럼 후보:

- `id uuid primary key default gen_random_uuid()`
- `token_hash text not null unique`
- `token_prefix text null`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `client_id text not null`
- `scope text not null`
- `issued_at timestamptz not null default now()`
- `expires_at timestamptz not null`
- `revoked_at timestamptz null`
- `last_used_at timestamptz null`
- `metadata jsonb not null default '{}'::jsonb`

인덱스 후보:

- `token_hash`
- `token_prefix`
- `user_id`
- `client_id`
- `expires_at`
- `revoked_at`
- `last_used_at`

TTL:

- access token은 짧은 수명을 권장한다.
- 정확한 시간은 후속 구현 PR에서 결정한다.
- 초기 후보는 1~24시간 범위 중 선택 필요로 표시한다.

검증 흐름:

1. Action request의 `Authorization: Bearer <token>`을 읽는다.
2. token prefix 또는 token id가 있으면 후보 row를 좁힌다.
3. token 원문을 hash 처리해 `token_hash`와 비교한다.
4. `revoked_at is null`인지 확인한다.
5. `expires_at > now()`인지 확인한다.
6. `scope`에 `experience:write`가 포함되어 있는지 확인한다.
7. row의 `user_id`를 신뢰 소스로 사용한다.
8. 필요 시 `last_used_at`을 갱신한다.

## 8. refresh token 제외 판단

초기 MVP에서는 refresh token을 제외한다.

이유:

- 구현/검증/회수 표면이 커진다.
- refresh token rotation, reuse detection, long-lived secret 보호 정책이 추가로 필요하다.
- ChatGPT Actions 첫 운영 검증에는 짧은 access token + 재인증으로도 충분할 가능성이 높다.
- token 유출 시 blast radius를 줄일 수 있다.

후속으로 refresh token을 추가하려면 필요한 항목:

- `refresh_token_hash`
- token family 또는 rotation id
- `refresh_expires_at`
- `refresh_revoked_at`
- reuse detection metadata
- client binding
- stronger audit log
- revoke UX

## 9. RLS / 접근 정책

정책:

- 세 테이블 모두 RLS enabled를 권장한다.
- direct client `select`/`insert`/`update`/`delete` policy는 기본적으로 만들지 않는다.
- service_role 서버 코드에서만 접근하는 것을 기본 전제로 둔다.
- 사용자가 연결 목록을 봐야 할 경우, `token_hash`, `code_hash`, `state_hash`를 노출하지 않는 별도 safe view 또는 API endpoint를 후속 설계한다.

근거:

- `notion_connections`, `google_calendar_connections`는 token 컬럼을 browser client에 직접 노출하지 않는 패턴을 따른다.
- `user_mcp_pairings`는 owner list/revoke가 필요해 owner select/update/delete policy가 있지만, hash 컬럼은 API 응답에서 선택하지 않는 방식으로 보호한다.
- ChatGPT OAuth state/code/token 테이블은 OAuth 서버 내부 상태에 가깝기 때문에 direct client 접근을 기본적으로 열지 않는 편이 더 안전하다.

## 10. 인덱스 / TTL / cleanup 정책

인덱스:

- state/code/token lookup hot path에는 hash unique index가 필요하다.
- cleanup과 운영 진단을 위해 `expires_at`, `consumed_at`, `revoked_at`, `last_used_at` 인덱스를 둔다.
- 사용자 연결 관리가 필요해질 경우 `user_id`, `client_id` 인덱스가 필요하다.

TTL:

- state: 짧게 유지. authorization flow 완료 또는 timeout 후 cleanup.
- authorization code: 5~10분.
- access token: 1~24시간 후보 중 후속 구현 PR에서 결정.

cleanup:

- expired state/code/token row cleanup이 필요하다.
- 초기에는 운영 쿼리 또는 cron/maintenance 작업으로 분리할 수 있다.
- cleanup SQL은 draft 파일에 주석 예시로만 둔다.
- cron 등록은 별도 Protected 작업이다.

## 11. MCP pairing 구조와 재사용/비재사용 포인트

재사용 가능한 포인트:

- `hashSecret(value)` sha256 hash 패턴
- token 원문을 DB에 저장하지 않는 원칙
- code/token을 생성 응답에서 한 번만 반환하는 원칙
- `revoked_at`, `expires_at`, `last_used_at` lifecycle 컬럼
- `user_id`를 request body가 아니라 서버 검증 결과에서 도출하는 원칙
- service_role 서버 endpoint가 insert/update를 담당하는 구조

재사용하면 안 되는 포인트:

- `user_mcp_pairings` 테이블 자체를 ChatGPT OAuth token 저장소로 재사용하지 않는다.
- MCP token prefix `pmcp_`를 ChatGPT OAuth token에 사용하지 않는다.
- MCP pairing code 교환 UX를 OAuth authorization code 흐름과 혼합하지 않는다.
- MCP token은 local wrapper 장기 token이고, ChatGPT OAuth token은 OAuth client/user/scope/redirect_uri/state를 가진 별도 개념이다.

## 12. 구현 단계 연결

후속 구현 연결:

1. 이 설계 문서와 SQL draft merge
2. Protected DB migration PR에서 실제 migration 파일 작성
3. OAuth authorize/token endpoint 구현
4. `api/_mcp_auth.js`에 `verifyChatgptOAuthToken()` helper 추가
5. `api/save-analysis-run.js`의 `chatgpt_action_save_experience` branch에 OAuth token 검증 연결
6. revoke 또는 connection management endpoint 추가
7. OpenAPI OAuth URL 확정
8. GPT editor 등록
9. production smoke

## 13. 후속 Protected DB migration PR 기준

후속 migration PR 기준:

- 이 draft SQL을 그대로 실행하지 않는다.
- 실제 migration 파일명은 protected migration workflow 기준으로 새로 만든다.
- RLS enabled를 포함한다.
- direct client policy를 만들지 않는 이유를 migration 주석에 남긴다.
- destructive statement를 포함하지 않는다.
- hash 원문 저장 금지를 주석에 명시한다.
- cleanup 전략은 migration 실행과 분리한다.
- Supabase schema metadata 확인으로 테이블/인덱스/RLS 상태를 검증한다.

검증 후보:

- 테이블 생성 확인
- primary key/unique/index 확인
- RLS enabled 확인
- no direct client policy 확인
- sample token/state/code 원문 저장 없음 확인

## 14. 중단 조건

아래 조건이 있으면 구현 또는 migration PR을 중단한다.

- Supabase access token을 ChatGPT OAuth access token으로 그대로 재사용해야 한다는 요구가 생김
- state 재사용 방지 저장소가 없음
- authorization code 원문 저장이 필요해짐
- access token 원문 저장이 필요해짐
- token revoke 경로가 없음
- direct client가 hash 테이블을 직접 조회해야 하는 구조가 됨
- DB migration이 실제 운영 적용 PR과 섞임
- refresh token을 초기 MVP에 포함해야 해서 scope가 커짐
- env/secrets 또는 deploy 작업이 같은 PR에 섞임

## 15. 다음 단계

권장 순서:

1. DB/token 저장 설계 문서와 SQL draft merge
2. Protected DB migration PR 작성
3. migration review에서 테이블명, 컬럼, index, RLS policy 확정
4. DB migration 적용
5. OAuth authorize/token endpoint 구현 PR
6. save endpoint OAuth token verifier 연결 PR
7. revoke/connection management 후속 PR
8. OpenAPI URL 확정
9. GPT editor 등록 및 production smoke
