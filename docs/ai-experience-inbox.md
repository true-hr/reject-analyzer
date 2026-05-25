# AI 작업기록 Inbox (12-C1 / 12-C2-A)

PASSMAP 웹 사용자가 외부 AI (Claude Code, ChatGPT, Gemini, Claude, Manual)에서
MCP `save_experience` action으로 보낸 경험 후보를 직접 확인할 수 있도록 추가된 read-only
패널입니다. 12-B5 패널이 "MCP 연결을 관리"하는 화면이라면, 12-C1 Inbox는 "그 연결로 들어온
데이터를 사용자에게 보여주는" 첫 화면입니다.

---

## 1. 범위

### 12-C1 (첫 패치, 이 문서가 다루는 범위)

- read-only 목록 조회
- 플랫폼 필터 (전체 / ChatGPT / Gemini / Claude / Manual / Unknown)
- 카드 표시 (title, sourcePlatform, sourceConversationTitle, createdAt, summary 미리보기, skills/jobTags/industryTags, evidence 인용 상위 2건)
- 비로그인 안내, 빈 상태 안내
- summary 오염 표시 가드
- evidenceText 개인정보 마스킹 및 길이 제한
- 데스크톱 (`src/App.jsx`) + 모바일 (`src/components/mobile/MobileSettingsTab.jsx`) 진입점
- 단순 페이지네이션 (PAGE_SIZE=30 + "더 보기")

### 명시적으로 제외 (12-C2 이후)

- status 변경 (archive / converted)
- 영구 삭제
- 인라인 편집
- 검색어 / 태그 필터
- 무한 스크롤
- 신규 Vercel API action
- SQL / migration
- 저장 로직 변경
- MCP wrapper 변경

---

## 2. 데이터 출처와 표시 대상

### 조회 대상 row

- `experience_cards.metadata->>importMethod = "mcp_save_experience"`
  - 이 키는 `api/save-analysis-run.js`의 `handleMcpSaveExperience`가 저장 시 기록합니다.
  - 동일 키가 `raw_sources.metadata.importMethod`에도 함께 저장되어 보조 식별이 가능합니다.
- `experience_cards.status = "accepted"`
  - 현재 MCP save 경로는 모든 row를 `"accepted"`로 저장합니다.
  - `archived` / `converted`로 바뀐 row는 12-C1 Inbox에서 노출하지 않습니다.

### 표시 필드

| 카드 영역 | 필드 | 출처 |
|---|---|---|
| 플랫폼 배지 | `metadata.sourcePlatform` | `experience_cards.metadata` (없으면 `raw_sources.metadata`) |
| 시각 | `created_at` | `experience_cards.created_at` |
| 제목 | `title` | `experience_cards.title` |
| 대화 라벨 | `sourceConversationTitle` 또는 `source_label` | `experience_cards.metadata.sourceConversationTitle`, fallback `raw_sources.source_label` |
| 요약 미리보기 | summary > situation > task 우선순위, 200자 truncate | `raw_sources.summary` → `experience_cards.situation` → `experience_cards.task` |
| 스킬/직무/산업 칩 | `skills`, `job_tags`, `industry_tags` (각 최대 6개) | `experience_cards.*` |
| 근거 인용 | `evidence_text` 상위 2건, 마스킹 + 120자 truncate | `experience_evidence.evidence_text` |

---

## 3. 조회 방식과 보안 invariant

### Supabase RLS 직접 조회를 선택한 이유

1. `raw_sources` / `experience_cards` / `experience_evidence` 모두 RLS가 활성화되어 있고, owner-only
   정책 `auth.uid() = user_id`가 SELECT/INSERT/UPDATE/DELETE 4개 모두 등록되어 있습니다
   (`supabase/sql/20260515_experience_cards_schema.sql` 라인 79-97, 162-182, 229-249).
2. 동일 패턴이 이미 `src/lib/workRecordRepository.js`의 `listExperienceCards()`에서 운영 중입니다.
3. 신규 API action을 만들지 않으므로 Vercel function 카운트가 변하지 않습니다.
4. GitHub Pages 빌드와 Vercel 빌드 모두에서 origin-specific 분기 없이 그대로 동작합니다.

### 반드시 지켜야 할 invariant

| Invariant | 보장 위치 |
|---|---|
| `body.user_id` / `body.userId` 절대 전송 금지 | 호출자가 user_id를 전달할 통로가 없으며, RLS가 access token의 `auth.uid()`를 강제 |
| `raw_sources.raw_text` 컬럼 SELECT 금지 | `aiInboxRepository.js`의 `SOURCE_COLUMNS` 상수에서 컬럼을 화이트리스트로 명시 |
| 서비스 롤 키를 브라우저로 가져오지 않음 | `src/lib/supabaseClient.js`는 `VITE_SUPABASE_ANON_KEY`만 사용 |
| MCP 발급 토큰을 화면에 표시하지 않음 | 12-C1 Inbox는 토큰을 받지도, 표시하지도 않음 |

### MCP-import row의 `raw_text` 정책

MCP save 흐름은 `api/save-analysis-run.js` 라인 619에서 `raw_text: null`을 명시적으로 저장하고
`metadata.rawTextStored = false`로 감사 표식을 남깁니다 (`docs/mcp-pairing.md` 3-A 참조). 즉
12-C1 Inbox가 조회하는 모든 MCP-origin row는 본질적으로 `raw_text`가 없습니다. 그럼에도
`SOURCE_COLUMNS` 화이트리스트는 일종의 안전망입니다 — 추후 다른 source 경로 (work_trace 등)에서
오작동으로 raw_text를 가진 row가 MCP 분류로 잘못 들어와도 브라우저로 노출되지 않습니다.

---

## 4. summary 오염 표시 가드

### 배경

PASSMAP MCP는 정상적으로 동작하지만, MCP 도구 호출 측 (외부 AI 또는 wrapper)에서 XML
파라미터 인코딩이 잘못되면 다음과 같은 잔재 텍스트가 `summary` / `situation` / `task` 컬럼에
섞여 들어갈 수 있습니다.

- `<parameter`
- `</situation>`
- `</task>`
- `</actions>`
- `</resultCandidate>`

이는 PASSMAP DB 데이터 자체의 정합성 문제는 아니지만 (RLS·소유권·MCP 인증 정책은 모두
정상), 사용자에게 그대로 노출하면 UX가 망가집니다.

### 처리 정책

1. **DB 수정 금지.** Inbox 컴포넌트는 어떤 경우에도 row를 update/delete하지 않습니다.
2. 카드 상단에 작은 회색 안내 배너:
   > "이 항목의 요약은 도구 호출 인코딩 오류로 일부 텍스트가 섞여 있습니다. 원본 인용은 아래
   > 근거에서 확인하세요."
3. summary 미리보기는 200자 truncate하여 그대로 표시. 사용자가 원본을 인용 영역에서 확인할 수
   있도록 evidenceText는 별도로 노출합니다.

### `skills` 빈 배열 가드

마찬가지로 호출 측 오류로 `skills`가 빈 배열로 저장된 row가 있을 수 있습니다. Inbox는
"스킬 태그 미저장" 안내 칩 1개로 사용자에게 알려주되, DB는 건드리지 않습니다.

---

## 5. PII 마스킹

`evidenceText`는 사용자가 외부 AI에 붙여넣은 원문 일부일 수 있어 이메일/전화번호 마스킹을
적용합니다. 마스킹 로직은 `src/components/workTrace/ExperienceEvidenceSection.jsx`의
`maskSensitiveText` / `truncateText`와 동일하며, 해당 함수가 export되어 있지 않아 12-C1에서는
컴포넌트 내부에 소규모 복사본을 유지합니다. 12-C2에서 별도 `src/lib/text/maskPii.js`로 추출해
양쪽이 공유하는 단일 소스로 정리하는 것을 권장합니다.

---

## 6. 진입점

| 플랫폼 | 파일 | 위치 |
|---|---|---|
| 데스크톱 | `src/App.jsx` | 설정 영역 → `McpConnectionPanel` 바로 아래 (동일한 `mt-3` 래퍼 패턴) |
| 모바일 | `src/components/mobile/MobileSettingsTab.jsx` | "MCP 연동 설정" 섹션과 "내 데이터 관리" 섹션 사이 신규 섹션 |

두 진입점 모두 동일 컴포넌트 `<AiExperienceInboxPanel isLoggedIn={...} />`를 렌더링합니다.

---

## 7. 다음 단계 (12-C2 이후)

- **검색어 / 태그 필터**: `metadata->>sourcePlatform` 외에 title/summary ilike 검색과 jobTags/industryTags overlap 필터 추가.
- **저장된 결과 영구 삭제**: Protected 단계로 분리 (별도 confirm + 서버 로그).
- **ChatGPT / Gemini 복붙 저장 화면**: MCP가 아닌 사용자 수동 복붙으로도 동일 데이터 모델에 저장할 수 있도록 web-side import UI 추가.
- **브라우저 확장 또는 공유 버튼**: ChatGPT/Gemini 응답을 한 번에 PASSMAP으로 보낼 수 있는 외부 채널.

각 단계는 별도 Standard 또는 Protected PR로 분리하며, 12-C1 read-only 패널의 표시 정책 (raw_text 미조회, user_id 미전송, 오염 가드)은 유지해야 합니다.

---

## 8. 12-C2-A — 상태 변경 액션 (보관 / 이력서 재료로 확정)

### 추가된 기능

각 Inbox 카드에 두 개의 액션 버튼이 추가되었습니다.

- **보관**: `experience_cards.status`를 `archived`로 변경
- **이력서 재료로 확정**: `experience_cards.status`를 `converted`로 변경

`listAiInboxExperiences()`는 `status = "accepted"`만 조회하므로 두 액션 모두 성공하면 해당 row는
Inbox 목록에서 즉시 사라집니다. 이는 의도된 동작이며, 사용자에게는 패널 하단 안내 문구로
명시됩니다:

> "보관하거나 이력서 재료로 확정한 항목은 이 Inbox 목록에서 사라집니다. 삭제 기능은 안전을
> 위해 별도 단계에서 다룹니다."

### 명시적으로 제외된 기능 (이번 범위 아님)

- 영구 삭제 (DELETE)
- 인라인 편집
- 검색어 / 태그 필터
- 새 Vercel API action
- 새 SQL / migration

### 신규 API / SQL 없이 RLS 직접 update를 선택한 이유

1. `experience_cards`에는 이미 owner-only UPDATE 정책이 등록되어 있습니다
   (`supabase/sql/20260515_experience_cards_schema.sql` 라인 162-182). 토큰 소유자가 자신의 row만
   `status`를 바꿀 수 있도록 Postgres가 강제합니다.
2. 12-C1 list 조회와 동일하게 anon key + access token으로 동작하므로 GitHub Pages 빌드와 Vercel
   빌드 양쪽에서 origin-specific 분기 없이 그대로 작동합니다.
3. 신규 Vercel function이 없으므로 함수 카운트와 cold-start 부담이 늘지 않습니다.
4. cross-table cleanup (raw_sources/experience_evidence)이 필요해지는 시점은 영구 삭제 단계이며,
   상태 변경은 단일 row update만으로 충분합니다.

### 보안 invariant (12-C1에서 그대로 유지)

| Invariant | 12-C2-A에서의 보장 위치 |
|---|---|
| `raw_sources.raw_text` 미조회 | update 호출은 `experience_cards`만 대상으로 하며 `.select("id, status")`로 컬럼을 제한 |
| `body.user_id` / `body.userId` 미전송 | `updateAiInboxExperienceStatus({ id, status })` 시그니처에 user_id 통로가 없음 |
| 권한은 RLS에 위임 | `auth.uid() = user_id` UPDATE 정책이 토큰 소유자 외 row를 거부 |
| MCP-origin row만 대상 | WHERE 절에 `eq("metadata->>importMethod", "mcp_save_experience")`를 추가 |
| 허용 status 화이트리스트 | 클라이언트에서 `archived` / `converted`만 허용, 그 외는 명시적 에러 |

### 운영 방침

`qa-smoke`, 테스트 케이스, 우연히 들어온 노이즈 row는 **삭제하지 말고 "보관"으로 숨깁니다**.
12-C2-A 시점에는 영구 삭제 경로가 아직 없으며, 보관 처리만으로도 사용자 Inbox 화면에서는
즉시 사라지므로 일반 운영에는 영향이 없습니다. 진짜 삭제가 필요한 경우는 별도 Protected PR로
다룹니다.

### UI 동작 요약

- 액션 처리 중에는 해당 카드의 두 버튼이 모두 disabled되고 라벨이 `"처리 중..."`으로 바뀝니다
- 성공 시 클라이언트 상태에서 해당 카드만 제거됩니다 (전체 목록 재조회 없음)
- 실패 시 해당 카드 하단에 inline error가 표시됩니다 ("상태를 변경하지 못했습니다. 잠시 후 다시
  시도해 주세요.")
- `"새로고침"` 버튼은 서버 기준 목록을 다시 조회하며 inline error도 초기화합니다
- native `alert()`와 빨간 destructive 삭제 버튼은 사용하지 않습니다
