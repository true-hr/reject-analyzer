# PASSMAP Calendar Sync Plan

> CAL-2 산출물. 현재 다운로드형 기능과 향후 자동연동형 기능의 UX/정책 분리 계약.
> 실제 Google OAuth/API 구현은 CAL-3 이후.

---

## 1. 현재 기능 — 캘린더 다운로드 (확정)

| 항목 | 내용 |
| --- | --- |
| 기능명 | 캘린더 파일(.ics) 다운로드 |
| 작동 방식 | PASSMAP 기록 → .ics 파일 생성 → 브라우저 다운로드 |
| 사용자 액션 | 버튼 클릭 → 파일 저장 → Google/Apple/Outlook Calendar에 직접 가져오기 |
| 필요 권한 | 없음 (로그인 불필요) |
| owner | `src/lib/calendarExport.js` |
| 호출 위치 | `src/components/home/HomeDashboard.jsx` — `handleCalendarExport` |
| 버튼 위치 | 업무관리 캘린더 섹션 우측 상단 |
| 현재 버튼 문구 | `캘린더 파일(.ics) 다운로드` |
| 다운로드 후 toast | "Google Calendar에서 가져오기로 추가할 수 있어요." |
| iCalendar 호환성 | CAL-0/1에서 RFC 5545 준수 안정화 완료 |

---

## 2. 향후 기능 — Google Calendar 자동 기록 (미구현)

| 항목 | 내용 |
| --- | --- |
| 기능명 | Google Calendar 자동 기록 |
| 작동 방식 | 기록 저장 시 PASSMAP이 Google Calendar API로 자동 일정 생성 |
| 필요 권한 | Google OAuth 2.0 (`calendar.events` scope) |
| 서버 요구사항 | access_token / refresh_token 서버 저장, 갱신 로직 |
| DB 요구사항 | `calendar_connections` 테이블, `work_records`에 sync 필드 |
| 구현 단계 | CAL-3 이후 별도 라운드 |
| 현재 노출 여부 | **미노출** — 백엔드/권한/DB 계약 확정 전까지 사용자 화면에 CTA 없음 |

---

## 3. 두 기능의 UX 분리

| 구분 | 캘린더 다운로드 | Google Calendar 자동 기록 |
| --- | --- | --- |
| 사용자 액션 | 버튼 클릭 → 파일 받기 → 직접 가져오기 | 기록 저장 → 자동 반영 (백그라운드) |
| Google 권한 | 불필요 | 필수 |
| 실패 시 | 다운로드 실패 (로컬, 즉각 피드백) | 기록 저장 성공 / 캘린더 반영 별도 실패 |
| 기록 수정 시 | .ics 재다운로드 필요 | 자동 업데이트 (이벤트 UID 기반) |
| 연동 해제 | 개념 없음 | 해제 가능, 기존 일정 유지 기본값 |
| 구현 복잡도 | 낮음 (완료) | 높음 (OAuth + Worker + DB) |

**핵심 원칙**: 두 기능은 별도 버튼/섹션으로 분리한다. 다운로드형 버튼에 자동연동 설명을 혼재하지 않는다.

---

## 4. 향후 자동연동 UX 문구 후보

**버튼 후보:**
- `Google Calendar에 자동 기록하기`
- `Google Calendar 연결`

**연결 설명 후보:**
> "기록을 저장하면 PASSMAP 전용 구글 캘린더에 자동으로 추가됩니다. 개인 일정과 섞이지 않으며, 언제든 연동을 해제할 수 있습니다."

**실패 메시지 후보:**
> "기록은 저장되었습니다. 다만 Google Calendar 반영에 실패했습니다. [다시 동기화]"

**재시도 버튼 후보:**
- `Google Calendar 다시 동기화`

---

## 5. Sync 상태값 후보 (향후 구현 시)

| 상태값 | 의미 |
| --- | --- |
| `not_connected` | Google 연동 안 됨 |
| `connecting` | OAuth 인증 중 |
| `connected` | 연동 완료, 동기화 대기 중 |
| `sync_pending` | 동기화 진행 중 |
| `synced` | 동기화 완료 |
| `sync_failed` | 동기화 실패 (기록 저장은 성공) |
| `disconnected` | 사용자가 연동 해제 |

---

## 6. Sync 정책 (확정)

1. **PASSMAP 기록은 SSOT.** Google Calendar 이벤트는 파생 사본이다.
2. **캘린더 동기화 실패는 기록 저장을 블록하지 않는다.** 두 실패는 독립적으로 처리한다.
3. **기본 캘린더에 직접 쓰지 않는다.** "PASSMAP 기록" 전용 캘린더를 생성/사용한다.
4. **연동 해제 시 기존 캘린더 일정은 기본적으로 유지한다.** 삭제는 별도 고급 옵션.
5. **이벤트 UID는 CAL-0/1에서 확정한 `passmap-daily-{date}@passmap.app` 패턴을 기반으로 한다.**

---

## 7. CAL-2에서 결정하지 않은 것

- Google OAuth 구현
- Google Calendar API 호출
- DB schema (`calendar_connections`, `work_records` sync 필드)
- access_token / refresh_token 저장 위치 (Worker vs Supabase Edge Function)
- 자동연동 버튼 사용자 화면 노출

---

## 8. 다음 라운드

**→ CAL-3 (완료 — 아래 섹션 참조)**

---

## CAL-3 DB/API Contract Draft

> CAL-3 산출물. 실제 구현 전 합의해야 할 계약 초안.
> "확정"은 이 문서에서 합의된 것, "보류"는 CAL-4/5에서 결정.

---

### 1. Owner Options

현재 PASSMAP에 Supabase Edge Function 폴더(`supabase/functions/`)가 없음.
Worker(`worker-ai/orange-shadow-95c1/src/index.js`)가 유일한 서버사이드 owner.

| 구분 | Worker (A안) | Supabase Edge Function (B안) |
| --- | --- | --- |
| 장점 | 기존 Notion OAuth 패턴 완전 재사용 가능 | Supabase user context와 자연스럽게 통합 |
| | AES-GCM 암호화 이미 구현됨 | DB 접근 경로 짧음 |
| | `supabaseRest` 헬퍼 이미 존재 | |
| 단점 | Worker에 Google API 로직 추가 | 별도 Edge Function 인프라 신규 구축 필요 |
| | Worker 파일이 계속 커짐 | 배포/환경 관리 복잡도 증가 |
| PASSMAP 현재 구조 적합도 | **높음** — 기존 패턴 그대로 확장 | 낮음 — 인프라 없음 |
| 보안/토큰 관리 | `TOKEN_ENCRYPTION_KEY`로 AES-GCM 암호화. 기존 검증된 구조 | 별도 secret 관리 필요 |
| 추천 여부 | **권장** | 비권장 (CAL-3 기준) |

### 2. Recommended Owner

**Worker (A안) 확정 권장.**
Notion OAuth 패턴(`handleNotionAuthUrl` → `handleNotionCallback` → `getActiveNotionConnection`)을 Google Calendar용으로 그대로 미러링한다.

---

### 3. calendar_connections Candidate Schema

> 실제 migration은 CAL-5에서. 이 단계는 필드 후보 합의만.

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users.id | |
| `provider` | text | 현재는 `'google'` 고정 |
| `provider_account_email` | text | OAuth 인증된 Google 계정 이메일 |
| `google_calendar_id` | text | 전용 캘린더 ID (PASSMAP이 생성한 것) |
| `google_calendar_name` | text | 기본값 `"PASSMAP 기록"` |
| `google_calendar_created_by_passmap` | boolean | PASSMAP이 직접 생성했는지 여부 |
| `scope` | text | 부여된 OAuth scope 기록 |
| `access_token_enc` | text | AES-GCM 암호화. 기존 `notion_connections.access_token_enc` 패턴 동일 |
| `refresh_token_enc` | text | AES-GCM 암호화. Google 토큰은 만료되므로 refresh_token 필수 |
| `token_expires_at` | timestamptz | access_token 만료 시각 |
| `status` | text | `connected` / `disconnected` / `token_error` |
| `connected_at` | timestamptz | |
| `disconnected_at` | timestamptz | nullable |
| `last_sync_at` | timestamptz | nullable |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

**보안 원칙 (확정):**
- `access_token` / `refresh_token`을 프론트 localStorage에 저장하는 설계는 **금지**한다.
- 토큰은 Worker → DB 경로로만 저장. 브라우저에 평문 노출 없음.
- 암호화 방식은 기존 `encryptSecret(plainText, env)` / `decryptSecret(cipherText, env)` 그대로 재사용.
- 토큰 저장 방식 최종 보안 검토는 **CAL-5에서 확정**.

---

### 4. work_records Sync Fields Candidate

> 실제 schema 변경은 CAL-7에서. 이 단계는 필드 후보 합의만.

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| `google_calendar_event_id` | text | null = 미동기화. event_id 있으면 update/patch 후보 |
| `google_calendar_sync_status` | text | 아래 상태값 참조 |
| `google_calendar_synced_at` | timestamptz | 마지막 성공 시각 |
| `google_calendar_sync_error` | text | 실패 요약 (사용자 노출 아님) |
| `google_calendar_last_attempt_at` | timestamptz | 마지막 시도 시각 |

**Sync 상태값:**

| 상태 | 의미 |
| --- | --- |
| `none` | 동기화 시도 없음 (기본값) |
| `pending` | 동기화 예약됨 |
| `synced` | 성공 |
| `failed` | 실패 (기록 저장은 성공) |
| `deleted` | Google Calendar에서 이벤트 삭제됨 |
| `skipped` | 연동 비활성화 상태에서 저장된 기록 |

**정책 (확정):**
- PASSMAP record가 SSOT. Google Calendar event는 파생 복사본.
- `event_id`가 있으면 insert가 아니라 `events.patch` 호출.
- `event_id`가 없으면 `events.insert` 호출.
- Calendar sync 실패가 work_record 저장을 블록하지 않음.

---

### 5. API Endpoint Contract Draft

> Worker에 실제 라우트를 추가하는 것은 CAL-5 이후. 이 단계는 계약만.

| Endpoint | 목적 | Input | Output | 실패 시 정책 | 구현 단계 |
| --- | --- | --- | --- | --- | --- |
| `POST /api/calendar/google/connect/start` | OAuth URL 생성 및 반환 | Supabase JWT | `{ ok, authUrl }` | secrets 미설정 시 400 | CAL-5 |
| `GET /api/calendar/google/oauth/callback` | code 교환 → token 암호화 저장 | `?code=&state=` | redirect → 프론트 성공 페이지 | state 위조 시 400 | CAL-5 |
| `POST /api/calendar/google/create-passmap-calendar` | "PASSMAP 기록" 전용 캘린더 생성 | Supabase JWT | `{ ok, calendarId, calendarName }` | 이미 존재 시 재사용 | CAL-6 |
| `POST /api/calendar/google/sync-record` | 기록 1건 Calendar event insert/patch | `{ recordId, date, summary, description }` | `{ ok, eventId, action }` | 실패 시 sync_status=failed 기록, 저장은 성공 | CAL-7 |
| `POST /api/calendar/google/resync-record` | 실패한 기록 재시도 | `{ recordId }` | `{ ok, eventId }` | 3회 초과 시 skipped | CAL-8 |
| `POST /api/calendar/google/disconnect` | 연동 해제 | Supabase JWT | `{ ok }` | 기존 캘린더 이벤트 유지 (삭제 안 함) | CAL-6 |

**OAuth state 보안:**
- Notion OAuth 패턴과 동일: AES-GCM 암호화 state에 `userId + nonce + expiresAt` 포함.
- callback 시 state 복호화 → userId 검증 → TTL 확인.
- `GOOGLE_REDIRECT_URI` env secret 필요.

---

### 6. Event Payload Contract Draft

Google Calendar `events.insert` / `events.patch` 공통 payload 후보:

```json
{
  "summary": "PASSMAP | YYYY-MM-DD 업무 기록",
  "description": "[PASSMAP 업무 기록]\n• ...\n\n[이력서 문장]\n...\n\n[태그]\n#...",
  "start": { "date": "YYYY-MM-DD" },
  "end":   { "date": "YYYY-MM-DD+1" },
  "transparency": "transparent",
  "visibility": "private"
}
```

**정책 (확정):**
- `calendarId`는 `primary`가 아닌 PASSMAP 전용 캘린더 ID.
- all-day event(`date` 기반). `dateTime` 사용 안 함 → 한국 시간 날짜 밀림 방지.
- description 내용은 `calendarExport.js`의 `buildPassmapDailyCalendarEvents` 로직과 동일한 구조 사용.
- SSOT 일관성: .ics export와 Google Calendar event의 description 포맷을 동일하게 유지.

---

### 7. Failure Policy

| 실패 케이스 | 처리 방식 |
| --- | --- |
| OAuth 권한 없음 / scope 불충분 | `calendar_connections.status = 'token_error'`, 재연결 유도 |
| refresh_token 만료 또는 회수 | 동일. 사용자에게 재연결 필요 알림 |
| PASSMAP 전용 캘린더가 삭제됨 | `google_calendar_id` 초기화 → 재생성 시도 |
| Google API quota / rate limit | `sync_status = 'failed'`, 지수 백오프 후 재시도 (CAL-8 구현) |
| 네트워크 실패 | `sync_status = 'failed'` |
| event_id 있으나 Google 이벤트 삭제됨 | `event_id` 초기화 → insert로 전환 |
| 중복 sync | `event_id` 확인 후 patch. 없으면 insert. 멱등 보장 |
| **공통** | 기록 저장은 **항상 성공**. calendar 동기화 실패는 독립 처리 |

**사용자 노출 문구 후보:**
> "기록은 저장되었습니다. 다만 Google Calendar 반영에 실패했습니다."

---

### 8. Not in CAL-3

- Google Cloud OAuth 클라이언트 실제 등록
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` Worker secrets 실제 설정
- DB migration 파일 생성
- Worker 라우트 실제 추가
- 자동연동 UI 사용자 화면 노출

---

### 9. Next Rounds

| 라운드 | 내용 |
| --- | --- |
| **CAL-4** | 연동 UI 상태 shell 설계. dev-only 또는 hidden flag 기준으로 버튼 노출 여부 검토. 실제 OAuth 없음 |
| **CAL-5** | `connect/start` + `oauth/callback` Worker 구현. Google Cloud redirect URI 설정. token exchange |
| **CAL-6** | PASSMAP 전용 캘린더 생성(`create-passmap-calendar`). `disconnect` 구현 |
| **CAL-7** | 기록 저장 후 `sync-record` 호출. `work_records` sync 필드 migration |
| **CAL-8** | `resync-record` 구현. 재시도 정책 완성 |

---

## CAL-4A UI State Shell Design

> CAL-4A 산출물. 실제 Google OAuth/API 구현 전 UI 상태 shell 설계.
> 런타임 코드 수정 없음. CAL-4B에서 hidden flag 기반 최소 구현.

---

### 1. Current Manual Export UI (확인)

| 항목 | 내용 |
| --- | --- |
| 버튼 위치 | `HomeDashboard.jsx` — `업무관리 캘린더` 카드 `SectionHeader` action 영역 |
| 현재 버튼 2개 | `Notion에서 가져오기` / `캘린더 파일(.ics) 다운로드` |
| 핸들러 | `handleCalendarExport` → `downloadPassmapCalendarIcs(data.records)` |
| 정책 | .ics 다운로드 버튼은 변경 없이 유지 |

---

### 2. Automatic Sync UI Placement Candidates

| 후보 위치 | 장점 | 단점 | 추천 여부 |
| --- | --- | --- | --- |
| A. 캘린더 카드 SectionHeader 버튼 행 추가 | 기존 Notion 버튼과 동일 줄 | 버튼 3개로 좁아짐. 다운로드와 자동연동 혼동 가능 | 비추천 |
| B. 캘린더 카드 내부 별도 패널 (Notion 패널 패턴) | 기존 Notion 패널과 일관성. 닫혀 있으면 노출 최소화 | 패널 open/close 상태 추가 필요 | **1순위 권장** |
| C. 대시보드 하단 별도 "연동 설정" 카드 | 다운로드/자동연동 UI 완전 분리 | 새 Card 컴포넌트 추가 필요. 상위 레이아웃 영향 | 2순위 (CAL-4B 이후 재검토) |
| D. 설정 페이지(현재 없음) | 가장 깔끔한 분리 | 설정 페이지 신규 구현 필요. 범위 초과 | 장기 후보 |

**CAL-4B 기준 권장: B안 (캘린더 카드 내부 별도 패널).**
Notion 패널(`notionPanelOpen` → 패널 렌더) 패턴과 동일 구조. `googleCalendarPanelOpen` state 추가만으로 구현 가능.

---

### 3. Feature Flag / Dev-only Availability (조사 결과)

| 패턴 | 존재 여부 | 위치 | CAL-4A 사용 가능 여부 |
| --- | --- | --- | --- |
| `import.meta.env.DEV` | 존재 | `App.jsx:3045`, `App.jsx:9734` | 가능하나 HomeDashboard에 직접 없음 |
| `VITE_AI_PROXY_URL` 게이팅 | 존재 | `HomeDashboard.jsx:398` | 참고 패턴. Google Calendar 전용 env var 없음 |
| `VITE_GOOGLE_CALENDAR_ENABLED` | **없음** | — | CAL-4B에서 신규 추가 예정 |
| `sampleMode` / `shouldUseDemoRecords` | 존재 | `HomeDashboard.jsx:315` | UI 상태 게이팅 참고. Calendar sync와 무관 |

**판단: CAL-4A에서 runtime 코드 수정 안 함.**
`VITE_GOOGLE_CALENDAR_ENABLED`가 아직 없으므로 "안전한 hidden flag 미존재" 조건. CAL-4B에서 env var 추가 + hidden UI shell 추가.

---

### 4. UI State Contract

| 상태값 | 트리거 | 사용자 표시 | 버튼 |
| --- | --- | --- | --- |
| `not_connected` | 연동 없음 (기본) | "Google Calendar 자동 기록 연결 안 됨" | `Google Calendar에 자동 기록하기` |
| `connecting` | OAuth 시작 후 callback 대기 | "Google Calendar 연결 중..." | 비활성화 |
| `connected` | 연동 완료 | "Google Calendar 연동됨 — PASSMAP 기록 캘린더에 자동 추가" | `연동 해제` |
| `sync_pending` | 기록 저장 → event insert 중 | "Google Calendar 반영 중..." | — |
| `synced` | event insert 성공 | "Google Calendar 반영 완료" | — |
| `sync_failed` | event insert 실패 | "기록은 저장됨. Google Calendar 반영 실패" | `다시 동기화` |
| `token_error` | refresh_token 만료/회수 | "권한 만료 — 다시 연결 필요" | `다시 연결하기` |
| `disconnected` | 사용자 연동 해제 | — (not_connected와 동일 렌더) | `Google Calendar에 자동 기록하기` |

**정책:**
- `sync_failed` / `token_error`는 toast로도 노출.
- 기록 저장 성공 여부는 위 상태값과 독립.
- 자동연동 UI 영역과 .ics 다운로드 버튼은 동일 행에 두지 않는다.

---

### 5. Copy Candidates

**상태별 사용자 문구:**

```
[not_connected]
제목: Google Calendar 자동 기록
설명: 기록을 저장하면 PASSMAP 전용 구글 캘린더에 자동으로 추가됩니다.
      개인 일정과 섞이지 않으며, 언제든 연동을 해제할 수 있습니다.
버튼: Google Calendar에 자동 기록하기

[connected]
제목: Google Calendar 연동됨
설명: 새 기록은 PASSMAP 기록 캘린더에 자동으로 추가됩니다.
보조 버튼: 연동 해제

[sync_failed]
제목: Calendar 반영 실패
설명: 기록은 저장되었습니다. 다만 Google Calendar 반영에 실패했습니다.
버튼: 다시 동기화

[token_error]
제목: Google Calendar 재연결 필요
설명: 권한이 만료되었거나 해제되어 다시 연결이 필요합니다.
버튼: 다시 연결하기
```

---

### 6. Not in CAL-4A

- `VITE_GOOGLE_CALENDAR_ENABLED` env var 추가
- HomeDashboard.jsx 수정
- hidden UI shell 컴포넌트 추가
- Google OAuth 구현
- Worker 라우트 추가
- DB migration

---

### 7. CAL-4B Implementation Criteria

CAL-4B에서 구현할 최소 hidden UI shell 계약:

| 항목 | 내용 |
| --- | --- |
| **UI owner** | `src/components/home/HomeDashboard.jsx` |
| **hidden flag** | `import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED === 'true'` |
| **env var 추가 파일** | `.env.example` (주석으로 설명 포함) |
| **표시 조건** | `VITE_GOOGLE_CALENDAR_ENABLED=true` + 로그인 상태 (`isLoggedIn`) |
| **기본 상태** | `not_connected` (hardcoded — DB 연결 없음) |
| **버튼 동작** | `disabled` 또는 console 없는 noop (`() => {}`) |
| **OAuth 호출** | **없음** — CAL-5에서 구현 |
| **패널 패턴** | Notion 패널(`notionPanelOpen`) 과 동일 구조. `googleCalendarPanelOpen` state 추가 |
| **새 파일** | 없음 — HomeDashboard 내부에 최소 inline 처리 |
| **max 파일 수** | `.env.example` + `HomeDashboard.jsx` = 2파일 |

---

## CAL-4B Hidden UI Shell

> CAL-4B 산출물. 실제 구현 내용 기록.

### 수정 파일

| 파일 | 내용 |
| --- | --- |
| `.env.example` | `VITE_GOOGLE_CALENDAR_ENABLED=false` 추가 (주석 포함) |
| `src/components/home/HomeDashboard.jsx` | `showGoogleCalendarSync` 상수 + `googleCalendarPanelOpen` state + hidden panel UI 삽입 |

### Feature Flag 정책 (확정)

- **flag 이름**: `VITE_GOOGLE_CALENDAR_ENABLED`
- **기본값**: `false` (`.env.example` 기준, 배포 기본 미노출)
- **활성화 조건**: `.env.local`에 `VITE_GOOGLE_CALENDAR_ENABLED=true` 설정 시에만 표시
- **이 flag는 보안 장치가 아니다.** UI shell 표시 여부만 제어한다. OAuth/API/DB 보안은 별도 구현 필요.
- **OAuth/API/DB 구현(CAL-5 이후) 전까지 true로 배포하지 않는다.**

### 구현 내용

**`showGoogleCalendarSync` 위치**: `HomeDashboard.jsx:301`

```js
const showGoogleCalendarSync = import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED === "true";
```

**`googleCalendarPanelOpen` 위치**: `HomeDashboard.jsx:302`

```js
const [googleCalendarPanelOpen, setGoogleCalendarPanelOpen] = useState(false);
```

**hidden panel 위치**: `HomeDashboard.jsx:1153` — `notionPanelOpen` 블록 닫힌 직후, 캘린더 월간 뷰 시작 전

**panel 동작**:
- `showGoogleCalendarSync === false` 시 DOM 렌더 없음 (`{showGoogleCalendarSync && (...)}`)
- 버튼: `disabled` — onClick 없음, OAuth 호출 없음
- 상태값: 하드코딩 `not_connected` (DB/API 없음)
- 표시 색상: green — Notion 패널(indigo)과 시각적 구분

### 사용자 기본 화면 미노출 근거

`VITE_*` env var는 Vite 빌드 시 번들에 인라인된다.
`VITE_GOOGLE_CALENDAR_ENABLED`가 설정되지 않으면 `import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED`는 `undefined`이고, `undefined === "true"`는 `false`.
따라서 `{showGoogleCalendarSync && (...)}` 블록은 렌더되지 않는다.
`.env.example`의 `VITE_GOOGLE_CALENDAR_ENABLED=false`는 의도를 문서화하는 역할만 하며, 실제 `.env.local`에 복사하고 `true`로 설정해야만 UI가 표시된다.

### Next

**CAL-5**: Worker `POST /api/calendar/google/connect/start` + `GET /api/calendar/google/oauth/callback` 구현. `showGoogleCalendarSync && isLoggedIn` 조건으로 버튼 disabled 해제 및 실제 OAuth flow 연결.

---

## CAL-5A Google OAuth Preflight

> CAL-5A 산출물. 구현 전 Worker/Google Cloud/token 저장 사전 점검.
> 런타임 코드 수정 없음.

---

### 1. Current Worker OAuth Pattern

Worker owner: `worker-ai/orange-shadow-95c1/src/index.js`

| 구성 요소 | 위치 (line) | 역할 |
| --- | --- | --- |
| `ALLOWED_PATHS` 배열 | 12–22 | 허용 경로 allowlist |
| `corsHeaders()` | 257 | CORS preflight 응답 |
| `buildNotionOAuthState` | 588 | AES-GCM 암호화 state 생성 |
| `buildNotionAuthUrl` | 608 | OAuth 인가 URL 빌드 |
| `handleNotionAuthUrl` | 629 | POST /api/notion/auth-url 핸들러 |
| `validateNotionOAuthState` | 670 | state 복호화 + TTL/nonce 검증 |
| `exchangeNotionCodeForToken` | 704 | Authorization code → access_token |
| `upsertNotionConnection` | 733 | 암호화 token DB 저장 (upsert) |
| `handleNotionCallback` | 773 | GET /api/notion/callback 핸들러 |
| `encryptSecret` / `decryptSecret` | 510, 523 | AES-GCM 암호화/복호화 |
| `supabaseRest` | 463 | Supabase REST API 호출 (service role) |
| `requireSupabaseUser` | ~430 | Supabase JWT 검증 |
| `htmlResponse` | 659 | callback 후 브라우저 HTML 응답 |
| callback 후 redirect | 815–818 | "You may close this window" HTML 페이지 |

---

### 2. Reusable Notion OAuth Components

| Notion 패턴 | Google Calendar 재사용 가능 여부 | 주의점 |
| --- | --- | --- |
| `ALLOWED_PATHS` 배열 | ✅ 재사용 — 경로만 추가 | `/api/calendar/google/connect/start`, `/api/calendar/google/oauth/callback` 추가 |
| `corsHeaders()` | ✅ 완전 재사용 | 변경 없음 |
| `buildNotionOAuthState` → `buildGoogleOAuthState` | ✅ 거의 동일 — `provider: "google"`로 변경 | payload 구조 동일. TTL 10분 유지 |
| `validateNotionOAuthState` → `validateGoogleOAuthState` | ✅ 거의 동일 — `provider !== "google"` 검사로 변경 | nonce/TTL 검증 로직 동일 |
| `handleNotionAuthUrl` → `handleGoogleCalendarAuthUrl` | ✅ 구조 재사용 — secrets 이름만 변경 | `GOOGLE_CLIENT_ID`, `GOOGLE_CALENDAR_REDIRECT_URI` 사용 |
| `handleNotionCallback` → `handleGoogleCalendarCallback` | ✅ 구조 재사용 — token exchange 방식만 다름 | Google은 `code` + `error` 쿼리 파라미터 동일. state 검증도 동일 |
| `exchangeNotionCodeForToken` → `exchangeGoogleCodeForToken` | ⚠️ **재작성 필요** | Notion: Basic Auth + JSON body. Google: form-encoded body, 다른 URL, `client_id`+`client_secret` 파라미터로 전송 |
| `upsertNotionConnection` → `upsertGoogleCalendarConnection` | ⚠️ **필드 다름** | Google은 `refresh_token_enc` + `token_expires_at` 추가 필요. 테이블명 변경 |
| `encryptSecret` / `decryptSecret` | ✅ 완전 재사용 | AES-GCM 패턴 동일 |
| `supabaseRest` | ✅ 완전 재사용 | 경로명만 변경 |
| `requireSupabaseUser` | ✅ 완전 재사용 | 변경 없음 |
| `htmlResponse` | ✅ 완전 재사용 | title/message 문구만 변경 |

**핵심 차이**: Google token exchange는 `https://oauth2.googleapis.com/token`에 `application/x-www-form-urlencoded` POST. Basic Auth 아님. `refresh_token` 포함 응답.

---

### 3. Required Google Cloud Settings (사용자 직접 확인 필요)

**Google Cloud Console 설정 체크리스트:**

| 항목 | 확인 방법 | 비고 |
| --- | --- | --- |
| Google Calendar API enabled | APIs & Services → Library → "Google Calendar API" | 활성화 안 되면 403 |
| OAuth consent screen 구성 | APIs & Services → OAuth consent screen | 미완료 시 OAuth URL 생성 불가 |
| User type | External / Internal 선택 | External = 외부 사용자 가능하나 앱 게시 필요 |
| 테스트 상태일 때 test users 등록 | OAuth consent screen → Test users | 앱이 "testing" 상태면 test user만 로그인 가능 |
| OAuth Client 생성 | Credentials → + Create Credentials → OAuth 2.0 Client IDs | Application type: **Web application** |
| Authorized redirect URI 등록 | OAuth Client → Authorized redirect URIs | Worker callback URL과 **정확히** 일치해야 함 |
| scope 확인 | OAuth consent screen → Scopes | 원하는 scope 추가 |
| 앱 게시 여부 | OAuth consent screen → Publish App | 미게시 시 test users만 사용 가능 |

---

### 4. Redirect URI Candidates

Worker 이름: `orange-shadow-95c1` (Cloudflare Workers)

| 환경 | URI 후보 | 비고 |
| --- | --- | --- |
| Production | `https://orange-shadow-95c1.{계정명}.workers.dev/api/calendar/google/oauth/callback` | 실제 계정명은 사용자가 확인 필요 |
| Custom domain (있는 경우) | `https://{custom-domain}/api/calendar/google/oauth/callback` | — |
| Local dev (wrangler dev) | `http://localhost:8787/api/calendar/google/oauth/callback` | 별도 OAuth Client 또는 URI 추가 필요 |

**필수 원칙:**
- Google Cloud Console의 Authorized redirect URI와 코드의 `redirect_uri` 파라미터는 **문자 1개도 틀리면 안 됨** (trailing slash 포함).
- Worker 실제 배포 URL은 Cloudflare dashboard 또는 `wrangler deploy` 결과에서 확인.

---

### 5. Scope Candidates

| Scope | 가능한 작업 | 장점 | 단점 | 추천 여부 |
| --- | --- | --- | --- | --- |
| `calendar.app.created` | 앱이 생성한 캘린더만 접근 | 최소 권한 | 새 캘린더 **생성** 불가. 이미 존재하는 앱 캘린더에만 접근 | 비추천 (MVP) |
| `calendar.events` | 모든 캘린더에 이벤트 create/edit/delete | 이벤트 관리 가능 | 기본 캘린더에도 접근 가능 (정책상 쓰지 않지만 권한은 있음). 새 캘린더 생성 불가 | 조건부 (캘린더 미리 생성 시) |
| `calendar.events.owned` | 앱이 생성한 이벤트만 | 최소 권한 | 새 캘린더 생성 불가. 전용 캘린더 없으면 의미 없음 | 비추천 |
| `calendar` (full) | 캘린더 CRUD + 이벤트 CRUD | PASSMAP 전용 캘린더 **생성 가능** | 가장 넓은 권한. consent screen에서 "캘린더 전체 관리" 표시 | **MVP 권장** |

**결론**: PASSMAP 전용 캘린더를 생성해야 하므로 `https://www.googleapis.com/auth/calendar` 필요.
캘린더 생성 없이 이벤트만 삽입하는 방식(기본 캘린더 또는 기존 캘린더 재사용)이라면 `calendar.events`로 충분.

> **주의**: 최종 scope는 Google Cloud consent screen에서 사용자가 직접 확인 후 확정. 공식 문서: https://developers.google.com/calendar/api/auth

---

### 6. Token Storage Policy

| 항목 | 정책 |
| --- | --- |
| access_token 저장 | Supabase `calendar_connections.access_token_enc` — AES-GCM 암호화 |
| refresh_token 저장 | Supabase `calendar_connections.refresh_token_enc` — AES-GCM 암호화 |
| 암호화 방식 | 기존 `encryptSecret` 재사용 (`TOKEN_ENCRYPTION_KEY` 기반 AES-GCM) |
| 프론트 저장 | **금지** — localStorage / sessionStorage / cookies 저장 없음 |
| token 만료 처리 | `token_expires_at` 필드 기준. 만료 전 Worker에서 refresh 시도 |
| refresh_token 재발급 | Google은 첫 인가 시에만 발급. 분실 시 사용자 재연결 필요 |
| token_error 상태 | refresh 실패 또는 refresh_token 없으면 `calendar_connections.status = 'token_error'` |
| 재연결 필요 상태 | `status = 'token_error'` → 프론트에 재연결 유도 |

---

### 7. Open Decisions Before CAL-5

| 질문 | 현재 상태 | 결정 필요 시점 |
| --- | --- | --- |
| 테이블명: `calendar_connections` vs `google_calendar_connections`? | 미확정 | CAL-5 시작 전 |
| Encryption key: 기존 `TOKEN_ENCRYPTION_KEY` 재사용 vs `GOOGLE_CALENDAR_ENCRYPTION_KEY` 별도? | Notion과 동일 key 재사용 권장 (단일 key 관리) | CAL-5 시작 전 |
| OAuth state: 기존 `TOKEN_ENCRYPTION_KEY`로 state 암호화 충분한가? | 충분. Notion과 동일 패턴 | 확정 가능 |
| callback 후 redirect destination? | Notion은 "창 닫기" HTML. Google도 동일 방식 유력 | CAL-5 구현 시 결정 |
| DB 테이블 생성 vs OAuth 구현 순서? | 테이블 먼저 생성 후 OAuth 구현 권장 | CAL-5 구현 순서 확정 필요 |
| refresh_token 미발급 케이스? | `access_type=offline` + `prompt=consent` 파라미터로 강제 발급 유도 | CAL-5 구현 시 확정 |
| Google Cloud 앱 테스트 상태에서 외부 사용자? | 앱 게시 전까지 test users만 가능. MVP는 test users로 진행 | Google Console 설정 단계에서 결정 |
| Authorized redirect URI 실제 값? | Cloudflare dashboard에서 Worker 도메인 확인 필요 | CAL-5 구현 전 필수 |

---

### 8. CAL-5 Implementation Gate

CAL-5 구현을 시작하기 위해 아래 조건이 모두 충족되어야 합니다:

| 조건 | 상태 | 담당 |
| --- | --- | --- |
| Google Calendar API enabled | 확인 필요 | 사용자 (Google Cloud Console) |
| OAuth consent screen 구성 완료 | 확인 필요 | 사용자 |
| OAuth Client ID/Secret 발급 | 확인 필요 | 사용자 |
| Authorized redirect URI 확정 및 등록 | 확인 필요 | 사용자 (Worker 도메인 확인 후) |
| `GOOGLE_CLIENT_ID` Worker secret 설정 | 확인 필요 | 사용자 (Cloudflare dashboard) |
| `GOOGLE_CLIENT_SECRET` Worker secret 설정 | 확인 필요 | 사용자 — **절대 VITE_* 금지** |
| `GOOGLE_CALENDAR_REDIRECT_URI` Worker env 설정 | 확인 필요 | 사용자 |
| 테이블명 확정 (`calendar_connections`) | 미확정 | 사용자/Claude |
| Encryption key 정책 확정 | 재사용 권장 | 사용자/Claude |
| callback 후 redirect path 확정 | 미확정 | 사용자/Claude |

**Google Client Secret 보안 원칙 (확정):**
- `GOOGLE_CLIENT_SECRET`은 Cloudflare Worker secret으로만 관리.
- 절대 `VITE_*` 환경변수로 두지 않음.
- 절대 git 저장소에 커밋하지 않음.

---

## CAL-5B-0 Google Client / Worker Domain Preflight

**날짜**: 2026-04-29
**작업 분류**: SAFE INVESTIGATION + DOC ONLY — 런타임 코드 변경 없음

---

### 1. Current Situation

| 항목 | 현황 |
| --- | --- |
| Google Cloud 프로젝트 | PASSMAP-OCR (기존 프로젝트) |
| Google Calendar API | 해당 프로젝트에서 활성화 확인됨 |
| 기존 OAuth Client | "PASSMAP Web Client" — OCR/기존 웹 로그인용으로 생성됨 |
| Worker 디렉토리명 | `orange-shadow-95c1` (Cloudflare 초기 scaffold 시 할당된 이름, 배포명과 다름) |
| Worker 실제 배포명 | `reject-ai-proxy` (`wrangler.jsonc` `name` 필드 기준) |
| wrangler 설정 파일 | `worker-ai/orange-shadow-95c1/wrangler.jsonc` (`.toml` 아님 — 이전 조사 오류 정정) |
| Worker 배포 스크립트 | `wrangler deploy` (package.json 기준, wrangler.jsonc의 name으로 배포됨) |
| 프론트 Worker 호출 env var | `VITE_AI_PROXY_URL` |

---

### 2. Google Cloud Project / Client Strategy

| 안 | 설명 | 장점 | 단점 | 추천 여부 |
| --- | --- | --- | --- | --- |
| **A안** | 기존 "PASSMAP Web Client" 재사용 | 즉시 사용 가능, 별도 생성 불필요 | OCR/로그인 scope와 Calendar scope 혼용, 기존 Client 수정 시 기존 기능 영향 가능, 감사 추적 어려움 | ❌ 비추천 |
| **B안** | 기존 PASSMAP-OCR 프로젝트 안에 Calendar 전용 OAuth Client 신규 생성 | 기존 Client 무접촉, Calendar scope 명확히 분리, 같은 프로젝트 내 API 활성화 공유 가능, 오버헤드 최소 | Client 두 개 관리 필요 | ✅ **1순위 권장** |
| **C안** | Google Cloud 프로젝트 자체를 신규 생성 | 완전 격리 | Google Calendar API 재활성화 필요, OAuth consent screen 재구성, 신규 프로젝트 설정 오버헤드, 불필요한 복잡도 증가 | ❌ 비추천 |

**결론**: B안 채택 — 기존 "PASSMAP Web Client"는 건드리지 않고, 같은 PASSMAP-OCR 프로젝트 안에 Calendar 연동 전용 OAuth Client를 새로 생성한다.

**권장 OAuth Client 이름**: `PASSMAP Calendar Sync Client`

**정책**:
- 기존 "PASSMAP Web Client"에 Calendar scope를 추가하지 않는다.
- "PASSMAP Calendar Sync Client"에만 `https://www.googleapis.com/auth/calendar` scope를 부여한다.
- `GOOGLE_CLIENT_SECRET`은 Cloudflare Worker secret으로만 관리. 절대 VITE_* 금지.
- Client ID/Secret은 이 문서를 포함한 git 저장소 어디에도 평문 기록 금지.

---

### 3. Worker Domain Investigation

**[CAL-5B-0R 정정]** 이전 조사에서 `wrangler.toml 없음`으로 기록했으나, `wrangler.jsonc`가 존재함을 확인. 디렉토리명(`orange-shadow-95c1`)과 실제 배포 Worker명(`reject-ai-proxy`)이 다름.

| 항목 | 값 | 근거 파일 |
| --- | --- | --- |
| Worker 디렉토리명 | `orange-shadow-95c1` | 디렉토리 이름 (Cloudflare scaffold 시 할당) |
| Worker 실제 배포명 | **`reject-ai-proxy`** | `wrangler.jsonc:7` `"name": "reject-ai-proxy"` |
| wrangler.jsonc 위치 | `worker-ai/orange-shadow-95c1/wrangler.jsonc` | 직접 확인 |
| Cloudflare 계정 서브도메인 | `qorrkdts12` | 사용자 dashboard 직접 확인 (CAL-5B-0R) |
| 실제 활성 Worker URL | **`https://reject-ai-proxy.qorrkdts12.workers.dev`** | `.env.local` (Vercel CLI 생성) + dashboard 활동 기록 |
| 비활성 구 Worker URL | `https://orange-shadow-95c1.qorrkdts12.workers.dev` | `src/.env.production` (stale — 2개월 이상 요청 없음) |
| 배포 스크립트 | `wrangler deploy` | `package.json:6` (wrangler.jsonc `name`으로 배포됨) |
| custom domain | 없음 (wrangler.jsonc 미설정) | `wrangler.jsonc` 전체 확인 |
| 프론트 env var | `VITE_AI_PROXY_URL` | `App.jsx:720`, `HomeDashboard.jsx:402` |

**구 URL(`orange-shadow-95c1`)이 `src/.env.production`에 남아 있는 이유**:
- `src/.env.production`은 Worker 이름 변경 이전 상태를 반영한 stale 파일.
- Vercel 배포 시 Vercel dashboard env vars(`VITE_AI_PROXY_URL=reject-ai-proxy...`)가 빌드 환경에 주입되어 `.env.production` 파일 값을 override함.
- 실제 프로덕션 트래픽은 `reject-ai-proxy`로 흐름 (dashboard 36 requests 확인).
- `src/.env.production`의 `orange-shadow-95c1` URL은 Vercel dashboard에서 env var 값을 `reject-ai-proxy`로 업데이트해야 정합성이 맞음 (CAL-5 구현과 별개로 정리 권장).

**현재 Notion callback URL 패턴** (Worker ALLOWED_PATHS 기준):
```
GET https://reject-ai-proxy.qorrkdts12.workers.dev/api/notion/callback
```

---

### 4. Redirect URI Candidate

**Google Calendar OAuth redirect URI (확정)**:
```
https://reject-ai-proxy.qorrkdts12.workers.dev/api/calendar/google/oauth/callback
```

**trailing slash 정책**:
- trailing slash 없이 고정. Google OAuth은 redirect URI를 문자열 그대로 비교하므로 slash 한 개 차이도 mismatch 원인.
- Worker 코드의 `GOOGLE_CALENDAR_REDIRECT_URI`와 Google Cloud Console 등록값이 완전히 동일해야 함.

**CAL-5에서 Worker ALLOWED_PATHS에 추가해야 할 경로**:
```
/api/calendar/google/auth-url        ← POST (auth URL 생성)
/api/calendar/google/oauth/callback  ← GET (OAuth callback)
```

---

### 5. User Google Cloud Console Checklist

아래 체크리스트는 사용자가 Google Cloud Console에서 직접 수행할 작업입니다. Claude는 어떤 단계도 자동으로 실행하지 않습니다.

**Google Cloud Console 작업**:
- [ ] 기존 "PASSMAP Web Client"는 건드리지 않는다
- [ ] `API 및 서비스 > 사용자 인증 정보 > + 사용자 인증 정보 만들기 > OAuth 클라이언트 ID`
- [ ] 애플리케이션 유형: **웹 애플리케이션**
- [ ] 이름: **PASSMAP Calendar Sync Client**
- [ ] 승인된 리디렉션 URI 추가 (정확히 이 값, trailing slash 없음):
  ```
  https://reject-ai-proxy.qorrkdts12.workers.dev/api/calendar/google/oauth/callback
  ```
- [ ] 생성 후 **Client ID**와 **Client Secret** 안전한 곳에 보관
- [ ] Client Secret을 화면 캡처하거나 채팅/이메일로 공유 금지

**Cloudflare Worker secrets 등록** (`worker-ai/orange-shadow-95c1` 디렉토리에서 실행):
- [ ] `wrangler secret put GOOGLE_CLIENT_ID`
- [ ] `wrangler secret put GOOGLE_CLIENT_SECRET`
- [ ] `wrangler secret put GOOGLE_CALENDAR_REDIRECT_URI`
  - 값: `https://reject-ai-proxy.qorrkdts12.workers.dev/api/calendar/google/oauth/callback`

**OAuth consent screen 확인** (Google Cloud Console):
- [ ] `API 및 서비스 > OAuth 동의 화면` — 이미 구성된 경우 scope 추가 여부 확인
- [ ] scope에 `https://www.googleapis.com/auth/calendar` 추가
- [ ] test users 목록에 테스트 계정 추가 (외부 앱 출판 전까지 필요)

---

### 6. CAL-5 Implementation Gate Update

CAL-5A에서 정의한 게이트에 CAL-5B-0 조사 결과를 반영한 업데이트:

| 조건 | 이전 상태 | 업데이트 상태 | 담당 |
| --- | --- | --- | --- |
| Google Calendar API enabled | 확인 필요 | ✅ **활성화 확인됨** (PASSMAP-OCR 프로젝트) | — |
| OAuth Client 전략 결정 | 미확정 | ✅ **B안 확정** — 동일 프로젝트 내 신규 Client | — |
| OAuth Client 이름 | 미확정 | ✅ **PASSMAP Calendar Sync Client** | 사용자가 생성 |
| Worker 도메인 확인 | 미확정 | ✅ **`reject-ai-proxy.qorrkdts12.workers.dev` 확정** | — |
| Authorized redirect URI 등록 | 미확정 | ✅ **URI 확정, Google Cloud Console 등록만 남음** | 사용자 |
| `GOOGLE_CLIENT_ID` Worker secret | 미설정 | ⚠️ Client 생성 후 설정 가능 | 사용자 |
| `GOOGLE_CLIENT_SECRET` Worker secret | 미설정 | ⚠️ Client 생성 후 설정 가능 | 사용자 |
| `GOOGLE_CALENDAR_REDIRECT_URI` Worker env | 미설정 | ⚠️ 도메인 확정 후 설정 가능 | 사용자 |
| 테이블명 확정 (`calendar_connections`) | 미확정 | 미확정 — CAL-5 착수 전 결정 필요 | 사용자/Claude |
| Encryption key 정책 | 재사용 권장 | ✅ `TOKEN_ENCRYPTION_KEY` 재사용 권장 확정 | — |
| callback 후 redirect path | 미확정 | 미확정 — CAL-5 착수 전 결정 필요 | 사용자/Claude |

**CAL-5 착수 최소 조건** (사용자 작업 필요):
1. ✅ Worker 도메인 확정: `reject-ai-proxy.qorrkdts12.workers.dev`
2. Google Cloud Console에서 "PASSMAP Calendar Sync Client" 생성
3. redirect URI 등록: `https://reject-ai-proxy.qorrkdts12.workers.dev/api/calendar/google/oauth/callback`
4. Worker secrets 3개 (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI`) 설정

**CAL-5 착수 전 결정 사항** (빠른 결정 가능):
- `calendar_connections` 테이블명 확정 (이미 CAL-3에서 후보로 제안됨)
- callback 후 redirect path: 브라우저 창 close HTML vs 특정 페이지 이동

**별도 정리 권장** (CAL-5 구현과 무관하나 정합성 문제):
- `src/.env.production`의 `VITE_AI_PROXY_URL` 값이 stale (`orange-shadow-95c1`). Vercel dashboard env var에서 `reject-ai-proxy.qorrkdts12.workers.dev`로 이미 override되므로 실제 동작에는 영향 없음. 그러나 파일 정합성을 위해 추후 별도 패치 권장.

---

## CAL-5B Google Calendar OAuth Handler Implementation

**날짜**: 2026-04-29
**작업 분류**: SAFE OAUTH HANDLER PATCH

---

### 1. Implemented Endpoints

| Endpoint | Method | Handler | 설명 |
| --- | --- | --- | --- |
| `/api/calendar/google/connect/start` | POST | `handleGoogleCalendarConnectStart` | Supabase JWT 인증 후 Google OAuth URL 반환 |
| `/api/calendar/google/oauth/callback` | GET | `handleGoogleCalendarCallback` | Google redirect 수신, code 교환, 토큰 저장 |

### 2. Environment / Secrets Used

| 변수명 | 용도 | 위치 |
| --- | --- | --- |
| `SUPABASE_URL` | Supabase REST base URL | Worker secret (기존) |
| `SUPABASE_SERVICE_ROLE_KEY` | DB 직접 접근 | Worker secret (기존) |
| `TOKEN_ENCRYPTION_KEY` | AES-GCM 암호화 키 | Worker secret (기존, 재사용) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Worker secret (CAL-5B 신규) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Worker secret (CAL-5B 신규) |
| `GOOGLE_CALENDAR_REDIRECT_URI` | callback URL | Worker secret (CAL-5B 신규) |

### 3. OAuth Scope

| Scope | 이유 |
| --- | --- |
| `https://www.googleapis.com/auth/calendar` | PASSMAP 전용 캘린더 생성(CAL-6) 및 이벤트 추가(CAL-7)에 필요 |

**scope 축소 후보 (post-CAL-6)**: `calendar.events`만으로 충분할 경우 연결 재요청 없이 축소 불가 — 재연결 필요. 현재는 full `calendar` scope 유지.

### 4. Token Storage Policy

| 항목 | 정책 |
| --- | --- |
| `access_token_enc` | AES-GCM 암호화, `<iv_b64>:<ct_b64>` 포맷 |
| `refresh_token_enc` | AES-GCM 암호화, nullable (`prompt=consent`로 항상 발급되어야 함) |
| `token_expires_at` | `Date.now() + expires_in * 1000` (Google은 ~3600s) |
| `provider_account_email` | **null** — `calendar` scope는 email claim 미포함. `openid+email` 추가 시 구현 가능 |
| 평문 저장 | **금지** — 암호화 전 plaintext는 변수에도 최소 보존 |
| 프론트 노출 | **금지** — Worker → Supabase (service_role) 전용 |

**refresh_token 없을 경우**: `status = "token_partial"`, 사용자에게 재연결 안내. `prompt=consent`로 매번 발급되어야 하므로 정상 흐름에서는 발생하지 않음.

### 5. google_calendar_connections Table

파일: `supabase/sql/20260429_google_calendar_connections.sql`

주요 컬럼:
- `user_id` uuid → `auth.users.id` (cascade delete)
- `unique(user_id)` — 사용자당 하나의 Google 연결
- `access_token_enc`, `refresh_token_enc` — AES-GCM encrypted
- `token_expires_at` — 만료 추적 (CAL-7 refresh 로직용)
- `google_calendar_id`, `google_calendar_name` — CAL-6에서 채울 예정
- `status`: `connected | token_partial | token_expired | revoked | error`
- RLS 활성화, 직접 클라이언트 SELECT 정책 없음 (token 보호)

### 6. Callback Redirect Policy

Notion callback 패턴과 동일: **HTML close-window 응답**, frontend redirect 없음.

| 케이스 | 응답 |
| --- | --- |
| 성공 (refresh_token 있음) | `htmlResponse("Google Calendar Connected", "...You may close this window.")` 200 |
| 성공 (refresh_token 없음) | `htmlResponse("Google Calendar Connected (Partial)", "...reconnect...")` 200 |
| Google error param | `htmlResponse("Connection Cancelled", ...)` 400 |
| state 유효성 실패 | `htmlResponse("Connection Failed", ...)` 400 |
| code exchange 실패 | `htmlResponse("Connection Failed", ...)` 502 |
| DB upsert 실패 | `htmlResponse("Connection Failed", ...)` 500 |
| secrets 미설정 | `htmlResponse("Configuration Error", ...)` 500 |

### 7. Not Implemented in CAL-5B

아래 기능은 이번 라운드에서 구현하지 않음:

| 기능 | 예정 라운드 |
| --- | --- |
| PASSMAP 전용 Google Calendar 생성 | CAL-6 |
| 기록 저장 후 event insert | CAL-7 |
| Token 자동 refresh | CAL-7 |
| sync-record / resync-record | CAL-7+ |
| disconnect / revoke endpoint | CAL-8 |
| `/api/calendar/google/status` | CAL-8 |
| UI 활성화 (HomeDashboard 버튼) | HomeDashboard 패치별도 |
| `provider_account_email` 수집 | openid+email scope 추가 후 |
| scope 축소 (`calendar.events`로) | CAL-6 이후 검토 |

---

## CAL-5C Google OAuth Manual Test Guide

**날짜**: 2026-04-29
**작업 분류**: SAFE OAUTH MANUAL TEST — 런타임 코드 변경 없음

---

### Step 0: 사전 조건 확인

사용자가 아래 두 가지를 완료했는지 확인합니다. Claude는 이 단계를 대신 실행하지 않습니다.

| 조건 | 확인 방법 |
| --- | --- |
| SQL migration 적용 | Supabase SQL Editor에서 `SELECT to_regclass('public.google_calendar_connections');` 결과가 테이블 이름이면 적용됨 |
| Worker 배포 | Cloudflare dashboard → `reject-ai-proxy` → 최근 배포 시각 확인 |

---

### Step 1: Supabase access_token 얻기

PASSMAP이 열린 브라우저에서 DevTools(F12) → Console 탭에 아래 명령 실행.  
결과는 로컬 변수에만 저장하고, 채팅/화면 공유로 노출하지 마세요.

```javascript
// 브라우저 DevTools Console에서 실행 (PASSMAP 탭)
JSON.parse(localStorage.getItem('sb-pqnexzjvlzvrarxiazsk-auth-token')).access_token
```

결과: `eyJ...` 로 시작하는 JWT 문자열.  
**만료 확인**: [jwt.io](https://jwt.io) 에서 `exp` 클레임이 현재 시각 이후인지 확인 (payload만 봐도 충분 — 서명은 확인할 필요 없음).

---

### Step 2: connect/start 호출

아래 중 하나를 사용하세요. `<PASTE_TOKEN_HERE>` 자리에 Step 1의 token을 붙여넣으세요.

**PowerShell:**
```powershell
$token = "<PASTE_TOKEN_HERE>"
$response = Invoke-RestMethod `
  -Method Post `
  -Uri "https://reject-ai-proxy.qorrkdts12.workers.dev/api/calendar/google/connect/start" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body "{}"
$response
```

**curl (bash / Git Bash / WSL):**
```bash
curl -X POST \
  https://reject-ai-proxy.qorrkdts12.workers.dev/api/calendar/google/connect/start \
  -H "Authorization: Bearer <PASTE_TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d "{}"
```

**예상 성공 응답:**
```json
{
  "ok": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&scope=...&access_type=offline&prompt=consent&state=...",
  "expiresInSeconds": 600
}
```

---

### Step 3: authUrl 파라미터 검증

응답의 `authUrl`에 아래 파라미터가 모두 포함되는지 확인합니다.

| 파라미터 | 기대값 |
| --- | --- |
| `client_id` | 비어 있지 않음 |
| `redirect_uri` | `https%3A%2F%2Freject-ai-proxy.qorrkdts12.workers.dev%2Fapi%2Fcalendar%2Fgoogle%2Foauth%2Fcallback` (URL-encoded) |
| `scope` | `https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar` |
| `access_type` | `offline` |
| `prompt` | `consent` |
| `state` | 긴 암호화 문자열 (빈 값이면 오류) |

---

### Step 4: Google 동의 화면 통과

1. `authUrl`을 브라우저에서 열기 (또는 새 탭에서 붙여넣기)
2. Google 동의 화면 확인:
   - 앱 이름: **PASSMAP Calendar Sync Client** 또는 등록한 이름
   - 요청 권한: Google Calendar (전체 액세스)
3. "허용" 클릭

---

### Step 5: callback 응답 확인

리디렉션 후 브라우저에 아래 내용이 표시되어야 합니다.

| 케이스 | 기대 화면 |
| --- | --- |
| 정상 연결 | "Google Calendar Connected — Your Google Calendar has been connected to PASSMAP. You may close this window." |
| refresh_token 없음 | "Google Calendar Connected (Partial) — ...reconnect after the access token expires..." |
| 오류 | "Connection Failed — ..." (원인 코드 포함) |

---

### Step 6: Supabase DB row 확인

Supabase SQL Editor에서 아래 쿼리를 실행하세요.  
**access_token_enc / refresh_token_enc 컬럼 값 전체를 SELECT하거나 복사하지 마세요.**

```sql
SELECT
  user_id,
  provider,
  status,
  token_expires_at,
  connected_at,
  length(access_token_enc) > 0 AS has_access_token,
  refresh_token_enc IS NOT NULL AS has_refresh_token,
  scope
FROM public.google_calendar_connections
ORDER BY connected_at DESC
LIMIT 5;
```

**기대 결과:**

| 컬럼 | 기대값 |
| --- | --- |
| `provider` | `google` |
| `status` | `connected` (또는 `token_partial`) |
| `has_access_token` | `true` |
| `has_refresh_token` | `true` (prompt=consent이면 항상 true여야 함) |
| `token_expires_at` | 현재 시각 + 약 3600초 (약 1시간 후) |
| `scope` | `https://www.googleapis.com/auth/calendar` |

**암호화 형식 확인** (선택):
```sql
-- access_token_enc 형식만 확인 (값 전체 복사 금지)
SELECT
  left(access_token_enc, 20) AS enc_prefix,
  position(':' IN access_token_enc) > 0 AS has_separator
FROM public.google_calendar_connections
ORDER BY connected_at DESC
LIMIT 1;
```
기대: `enc_prefix`는 base64 문자열, `has_separator` = `true` (AES-GCM iv:ciphertext 형식)

---

### Step 7: 실패 케이스 분류

| 오류 | 원인 | 조치 |
| --- | --- | --- |
| `"Authorization header required"` / 401 | Supabase JWT 누락 또는 만료 | Step 1 재실행, 토큰 갱신 |
| `"missing_google_oauth_env: GOOGLE_CLIENT_ID, ..."` | Worker secret 미설정 또는 구버전 Worker | `wrangler secret list` 확인 후 `wrangler deploy` 재실행 |
| `redirect_uri_mismatch` (Google 오류 화면) | Google Cloud Console redirect URI가 Worker URL과 불일치 | trailing slash 등 포함 정확히 재확인 |
| `invalid_client` (Google 오류 화면) | GOOGLE_CLIENT_ID 또는 GOOGLE_CLIENT_SECRET 오류 | secret 재등록 후 재배포 |
| `invalid_grant` (HTML "Connection Failed") | code 만료(>5min), 중복 사용, redirect_uri 불일치 | authUrl 재생성 후 재시도 |
| HTML "Invalid or expired authorization state" | state 10분 TTL 초과 | Step 2~5를 10분 내에 완료 |
| HTML "Configuration Error: Worker secrets not configured" | Worker 배포 시 secrets 미반영 | `wrangler deploy` 재실행 확인 |
| `status = token_partial` | refresh_token 미수신 | Google 계정에서 PASSMAP app 액세스 취소 후 재시도 |

---

## CAL-5C-HELPER Google Calendar OAuth Test UI (Hidden Flag Only)

**날짜**: 2026-04-29
**작업 분류**: SAFE HIDDEN OAUTH TEST UI PATCH

### 목적

CAL-5B에서 구현된 Worker OAuth 엔드포인트를 PowerShell/curl 없이 브라우저에서 테스트할 수 있도록,
`VITE_GOOGLE_CALENDAR_ENABLED=true` 조건의 hidden shell 내부에 실제 테스트 버튼을 추가합니다.

### 활성화 조건

```
import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED === "true"
```

이 조건이 false이면 Google Calendar 자동연동 UI 자체가 DOM에 존재하지 않습니다.
기본 사용자 화면에는 이 버튼이 절대 노출되지 않습니다.

### 테스트 버튼 동작 흐름

1. 버튼 클릭 → `handleGoogleCalendarConnectStart` 실행
2. `getSession()` → `session.access_token` 획득 (없으면 "로그인이 필요합니다." 표시)
3. `POST ${VITE_AI_PROXY_URL}/api/calendar/google/connect/start` 호출
   - Header: `Authorization: Bearer {access_token}`
4. 응답 `json.authUrl` → `window.open(authUrl, "_blank", "noopener,noreferrer")`
5. UI: "Google 동의 화면을 열었습니다." 표시

### UI 상태

| 상태 | 표시 문구 |
|------|-----------|
| 버튼 클릭 전 | "Google Calendar 연결 테스트" |
| 연결 시도 중 | "연결 준비 중..." (버튼 disabled) |
| Google 동의 화면 오픈 성공 | "Google 동의 화면을 열었습니다." |
| 로그인 세션 없음 | "로그인이 필요합니다." |
| Worker 오류 | "Google Calendar 연결 준비에 실패했습니다: {error_code}" |
| authUrl 없음 | "Google Calendar 연결 URL 생성에 실패했습니다." |

### 보안 기준

- access_token, authUrl 전체를 DOM/로그에 출력하지 않음
- error 표시는 `json.error` code만 (token/secret/code 미포함)
- refresh_token 접근 없음

### 미구현 범위 (이 라운드에서 의도적으로 제외)

- Google Calendar event insert
- PASSMAP 전용 캘린더 생성 (`google_calendar_id` 채우기)
- work_records 저장/수정/삭제 흐름
- DB schema 변경
- Worker 라우트 추가

### 테스트 후 확인 방법

Supabase SQL Editor에서 실행:

```sql
SELECT id, user_id, status, scope, token_expires_at, connected_at
FROM public.google_calendar_connections
ORDER BY connected_at DESC
LIMIT 5;
```

`status = 'connected'` 행이 생성되면 OAuth 흐름 성공.

---

## CAL-6 PASSMAP Dedicated Google Calendar Create

**날짜**: 2026-04-30
**작업 분류**: SAFE GOOGLE CALENDAR CREATE PATCH

### 전제 조건

- OAuth 연결 성공 (`google_calendar_connections.status = 'connected'`)
- `refresh_token_enc` 저장 완료 (CAL-5B 결과)
- `google_calendar_id` = NULL (아직 미생성)

### 추가된 Endpoint

```
POST /api/calendar/google/create-passmap-calendar
Authorization: Bearer {supabase_access_token}
```

응답:
```json
{ "ok": true, "calendarId": "...", "calendarName": "PASSMAP 기록", "created": true }
// 또는 이미 생성된 경우
{ "ok": true, "calendarId": "...", "calendarName": "PASSMAP 기록", "created": false }
```

### 인증 방식

`requireSupabaseUser` 재사용. Supabase JWT 검증 후 `user.id` 획득.

### Access Token Refresh 정책

| 조건 | 처리 |
|------|------|
| `token_expires_at` 기준 5분 이상 남음 | `access_token_enc` decrypt 후 사용 |
| 만료됐거나 5분 이내 만료 예정 | `refresh_token_enc` decrypt → `oauth2.googleapis.com/token` 호출 |
| 새 `access_token` 수신 | 암호화 후 DB 갱신 (`token_expires_at`, `status=connected`) |
| 새 `refresh_token` 수신 시 | 함께 암호화 저장 (Google 장기 세션 로테이션 대응) |
| refresh 실패 | `{ ok: false, error: "token_refresh_failed" }` |

### PASSMAP 전용 캘린더 생성 Payload

```
POST https://www.googleapis.com/calendar/v3/calendars
Authorization: Bearer {valid_access_token}
Content-Type: application/json

{
  "summary": "PASSMAP 기록",
  "description": "PASSMAP에서 저장한 업무 기록을 모아두는 전용 캘린더입니다.",
  "timeZone": "Asia/Seoul"
}
```

### google_calendar_id 저장 정책

생성 성공 시 `PATCH /rest/v1/google_calendar_connections?user_id=eq.{userId}`:
- `google_calendar_id` = 응답 `id`
- `google_calendar_name` = 응답 `summary`
- `google_calendar_created_by_passmap` = `true`
- `updated_at` = 현재 ISO timestamp

### Idempotency 정책

- `google_calendar_id`가 DB에 이미 있으면 Google API 호출 없이 즉시 반환
- 같은 사용자가 endpoint를 여러 번 호출해도 캘린더가 중복 생성되지 않음
- 단, Google 쪽에서 사용자가 해당 캘린더를 수동 삭제한 경우 감지/복구는 CAL-8 이후 후보로 문서화

### 추가된 Helper 함수

| 함수 | 역할 |
|------|------|
| `getValidGoogleAccessToken(conn, userId, env)` | access_token 유효성 판단, refresh 분기 |
| `refreshGoogleAccessToken(conn, userId, env)` | refresh_token으로 새 access_token 발급 + DB 갱신 |
| `handleGoogleCalendarCreatePassmapCalendar(request, env)` | endpoint 핸들러 |

### 미구현 (이번 라운드에서 의도적으로 제외)

- Google Calendar event insert (CAL-7)
- 기록 저장 시 자동 동기화 (CAL-7)
- sync-record / resync-record (CAL-7+)
- disconnect / revoke endpoint (CAL-8)
- Google 쪽 캘린더 삭제 감지/복구 (CAL-8 이후 후보)
- HomeDashboard UI 기본 노출 변경
- work_records 저장/수정/삭제 흐름

### 수동 테스트 방법 (CAL-6C)

Step 1. OAuth 연결 상태 확인:
```sql
SELECT user_id, status, google_calendar_id FROM public.google_calendar_connections LIMIT 3;
```

Step 2. PowerShell로 endpoint 호출:
```powershell
$jwt = "<SUPABASE_ACCESS_TOKEN>"
$response = Invoke-RestMethod `
  -Uri "https://reject-ai-proxy.qorrkdts12.workers.dev/api/calendar/google/create-passmap-calendar" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $jwt"; "Content-Type" = "application/json" }
$response | ConvertTo-Json
```

Step 3. 결과 확인:
```sql
SELECT user_id, google_calendar_id, google_calendar_name, google_calendar_created_by_passmap, updated_at
FROM public.google_calendar_connections
WHERE user_id = '<YOUR_USER_ID>';
```

`google_calendar_id` 값이 채워지면 성공.

---

## CAL-6C-HELPER PASSMAP 기록 캘린더 생성 테스트 UI (Hidden Flag Only)

**날짜**: 2026-04-30
**작업 분류**: SAFE HIDDEN CALENDAR CREATE TEST UI PATCH

### 목적

CAL-6에서 구현된 `POST /api/calendar/google/create-passmap-calendar` endpoint를 PowerShell 없이
브라우저에서 테스트할 수 있도록, 기존 hidden panel 안에 테스트 버튼을 추가합니다.

### 활성화 조건

```
import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED === "true"
```

이 조건이 false이면 Google Calendar 자동연동 UI 전체가 DOM에 없습니다.
기본 사용자 화면에는 절대 노출되지 않습니다.

### 테스트 버튼 동작 흐름

1. "PASSMAP 기록 캘린더 생성 테스트" 버튼 클릭
2. `getSession()` → `session.access_token` 획득 (없으면 "로그인이 필요합니다." 표시)
3. `POST ${VITE_AI_PROXY_URL}/api/calendar/google/create-passmap-calendar` 호출
   - Header: `Authorization: Bearer {access_token}`
4. 응답 처리:
   - `ok: true, created: true` → "PASSMAP 기록 캘린더가 생성되었습니다."
   - `ok: true, created: false` → "이미 생성된 PASSMAP 기록 캘린더를 재사용합니다."
   - `ok: false` → "PASSMAP 기록 캘린더 생성에 실패했습니다: {error_code}"

### UI 상태 목록

| 상태 | 표시 문구 |
|------|-----------|
| 버튼 클릭 전 | "PASSMAP 기록 캘린더 생성 테스트" |
| 호출 중 | "PASSMAP 기록 캘린더를 확인 중입니다..." (버튼 disabled) |
| 신규 생성 성공 | "PASSMAP 기록 캘린더가 생성되었습니다." |
| 기존 캘린더 재사용 | "이미 생성된 PASSMAP 기록 캘린더를 재사용합니다." |
| 로그인 없음 | "로그인이 필요합니다." |
| 오류 | "PASSMAP 기록 캘린더 생성에 실패했습니다: {error_code}" |

### 보안 기준

- access_token, calendarId 전체를 DOM/로그에 미출력
- error 표시는 `json.error` code만 (token/secret 미포함)
- console.log 추가 없음

### 미구현 범위 (의도적 제외)

- event insert (CAL-7)
- 기록 저장 시 자동 동기화 (CAL-7)
- sync-record / resync-record (CAL-7+)
- disconnect (CAL-8)
- work_records 흐름 연결

### 테스트 성공 후 확인 방법

Supabase SQL Editor에서 실행:

```sql
SELECT user_id, google_calendar_id, google_calendar_name, google_calendar_created_by_passmap, updated_at
FROM public.google_calendar_connections
ORDER BY updated_at DESC
LIMIT 3;
```

`google_calendar_id` 값이 채워지고 `google_calendar_created_by_passmap = true`이면 성공.

---

## CAL-7A Event Insert Owner Investigation

**날짜**: 2026-04-30
**작업 분류**: SAFE INVESTIGATION ONLY — DECISIVE PATCH PRECHECK

### work_records 저장 Owner 조사 결과

| 작업 | Owner 파일 | 함수 | 호출 경로 |
|------|-----------|------|-----------|
| 생성 | `src/components/mvp/PmMvpView.jsx` | `_persistWorkRecord()` → `createWorkRecord()` | 기록 저장 버튼 클릭 |
| 수정 (이력서 문장) | `src/components/mvp/PmMvpView.jsx` | `handleSaveResumeCandidate()` → `updateWorkRecordWithCandidate()` | 이력서 저장 버튼 클릭 |
| 삭제 | `src/components/mvp/PmMvpView.jsx` | `handleDeleteWorkRecord()` → `deleteWorkRecord()` | 삭제 버튼 클릭 |

`HomeDashboard.jsx`는 `listWorkRecords`만 호출 (read-only, owner 아님).
`workRecordRepository.js`는 순수 Supabase client 헬퍼 (side-effect 없음).

### 기록 저장 성공 후 흐름

```
PmMvpView._persistWorkRecord(input)
  └─ createWorkRecord({user_id, record_date, title, ...})  → returns savedRecord
  └─ fetchWorkRecords()                                     → UI 갱신
  └─ dispatchEvent(PASSMAP_WORK_RECORDS_CHANGED_EVENT)      → HomeDashboard 갱신
```

`createWorkRecord`는 `.select().single()` 반환 — `savedRecord.id`를 즉시 사용 가능.

### calendarExport.js와의 일관성 조사

`buildPassmapDailyCalendarEvents(records)` (calendarExport.js:58):
- 입력: 어댑터 변환 후 records (`date`, `title`, `reflectedSentence`, `strengthTags` 필드 사용)
- 같은 날 기록을 **하나의 이벤트로 그룹핑** (daily summary 모델)
- summary: `"PASSMAP | YYYY-MM-DD 업무 기록"`
- description: `[PASSMAP 업무 기록]\n• {title}\n\n[이력서 문장]\n{reflectedSentence}\n\n[태그]\n#tag1 #tag2`
- start/end: all-day `{ date: "YYYY-MM-DD" }` / `{ date: "YYYY-MM-DD+1" }`

**CAL-7 선택**: .ics 일치 여부보다 구현 단순성 우선. **per-record 모델** 채택 (기록 1개 = 이벤트 1개).
daily-summary 모델은 CAL-8에서 remodel 후보.

### Event Insert 붙일 위치 후보

**후보 A — `_persistWorkRecord()` 내부, `createWorkRecord()` 반환 직후 (권장)**

```
createWorkRecord({...})
  → savedRecord 획득 (id 포함)
  → _syncRecordToGoogleCalendar(savedRecord, session) — fire-and-forget, catch 묵음
```

장점: savedRecord.id 즉시 사용 가능, 기존 패턴과 일치 (catch(_){} 이미 사용 중)
단점: PmMvpView에 getSession() / Worker fetch 추가 필요

**후보 B — `PASSMAP_WORK_RECORDS_CHANGED_EVENT` listener (HomeDashboard)**

장점: PmMvpView 미수정
단점: 어느 record가 신규인지 판별 어려움, HomeDashboard는 sync owner로 부적합

**후보 C — `fetchWorkRecords()` 이후 useEffect 감지**

장점: 없음
단점: 기존 vs 신규 record 구분 불가, 중복 insert 위험

**추천: 후보 A**

### Worker vs 프론트 직접 호출

| 구분 | 결론 |
|------|------|
| Google access_token을 프론트에 노출 | **금지** — token은 Worker에서만 복호화 |
| 프론트 → Worker `/api/calendar/google/sync-record` | **채택** — Supabase JWT만 프론트에서 사용 |
| Worker → Supabase service_role로 record 조회 | **B안 채택** — Worker가 recordId로 직접 조회 |

### A안 vs B안: sync-record input 방식

| 안 | 설명 | 장점 | 단점 | 추천 |
|----|------|------|------|------|
| A안 | 프론트가 record payload 전달 | Worker가 Supabase 추가 조회 불필요 | 프론트 직렬화 부담, stale data 가능 | △ |
| B안 | Worker가 recordId로 Supabase 직접 조회 | 항상 최신 데이터, 프론트 부담 없음 | Worker가 work_records 조회 권한 필요 (service_role로 이미 가능) | **권장** |

**채택: B안** — `POST /api/calendar/google/sync-record` body: `{ "recordId": "uuid" }`

### 추천 DB 필드 (work_records 테이블 추가)

| 필드명 | 타입 | 기본값 | 설명 |
|--------|------|--------|------|
| `google_calendar_event_id` | text | null | 생성된 Google Calendar event ID |
| `google_calendar_sync_status` | text | `'none'` | none / synced / failed / pending |
| `google_calendar_synced_at` | timestamptz | null | 마지막 sync 성공 시각 |
| `google_calendar_sync_error` | text | null | 실패 시 error code (full message 미저장) |

`google_calendar_last_attempt_at`은 CAL-8에서 추가 후보.

### sync-record Endpoint 계약 (CAL-7B 구현 후보)

```
POST /api/calendar/google/sync-record
Authorization: Bearer {supabase_access_token}
Content-Type: application/json

{ "recordId": "uuid" }
```

Worker 처리 흐름:
1. JWT 검증 → userId 확보
2. `work_records` 조회 (recordId + user_id 일치 확인) — 권한 검증 포함
3. `google_calendar_connections` 조회 → google_calendar_id, access_token
4. `getValidGoogleAccessToken` (기존 함수 재사용)
5. `google_calendar_event_id` 이미 있으면 skip (CAL-7에서는 insert만)
6. Google Calendar API `POST /calendar/v3/calendars/{calendarId}/events`
7. 성공 시: `work_records` PATCH — `google_calendar_event_id`, `google_calendar_sync_status='synced'`, `google_calendar_synced_at`
8. 실패 시: `work_records` PATCH — `google_calendar_sync_status='failed'`, `google_calendar_sync_error=error_code`

응답:
```json
{ "ok": true, "eventId": "..." }
// 또는
{ "ok": false, "error": "google_calendar_not_connected" }
```

### Event Payload 계약

```json
{
  "summary": "PASSMAP | YYYY-MM-DD 업무 기록",
  "description": "[PASSMAP 업무 기록]\n• {title}\n\n[이력서 문장]\n{resumeSentence}\n\n[태그]\n#tag1 #tag2",
  "start": { "date": "YYYY-MM-DD" },
  "end": { "date": "YYYY-MM-DD+1" },
  "visibility": "private",
  "transparency": "transparent",
  "extendedProperties": {
    "private": {
      "passmapRecordId": "{record_id}",
      "passmapSyncType": "single_record"
    }
  }
}
```

- description은 `buildPassmapDailyCalendarEvents` 구조와 일관성 유지
- `resumeSentence` 소스: `raw_payload.resumeSentence` > `raw_payload.reflectedSentence` > `result`
- tags: `strength_tags` 컬럼 직접 사용

### 실패 정책

- PASSMAP 기록 저장 성공은 항상 보장 (SSOT)
- Google Calendar sync는 fire-and-forget (non-blocking)
- sync 실패 시: `google_calendar_sync_status='failed'`, `google_calendar_sync_error=error_code`
- retry: CAL-8에서 추가 후보
- event delete on record delete: CAL-8에서 추가 후보

### CAL-7B 구현 범위 제안

**수정 파일 3개**:

| 파일 | 변경 내용 |
|------|-----------|
| `supabase/sql/20260430_work_records_calendar_sync_fields.sql` (신규) | work_records에 sync 필드 4개 추가 |
| `worker-ai/orange-shadow-95c1/src/index.js` | `sync-record` endpoint + handler 추가 |
| `src/components/mvp/PmMvpView.jsx` | `_persistWorkRecord` 내부에 fire-and-forget sync 호출 추가 |

**미구현 (CAL-7B에서 제외)**:
- event update (기록 수정 시) → CAL-7C 후보
- event delete (기록 삭제 시) → CAL-8 후보
- HomeDashboard UI sync 상태 표시 → CAL-8 후보
- retry 로직 → CAL-8 후보

### CAL-7B 진입 가능 여부

**진입 가능** — 조사 결과가 충분히 명확하고, 3파일 범위 내에서 안전하게 구현 가능.

---

## CAL-7B: Google Calendar sync-record Endpoint (구현 완료)

Round: CAL-7B
날짜: 2026-04-30

### 구현 파일

| 파일 | 변경 내용 |
|------|-----------|
| `supabase/sql/20260430_work_records_calendar_sync_fields.sql` (신규) | work_records sync 필드 4개 추가 |
| `worker-ai/orange-shadow-95c1/src/index.js` | `sync-record` endpoint + 4개 함수 추가 |

`src/components/mvp/PmMvpView.jsx` 연결은 CAL-7D로 연기.

### SQL 마이그레이션

파일: `supabase/sql/20260430_work_records_calendar_sync_fields.sql`

추가 컬럼:
- `google_calendar_event_id TEXT` — 성공 시 저장되는 Calendar event id
- `google_calendar_sync_status TEXT NOT NULL DEFAULT 'none'` — 상태 머신
- `google_calendar_synced_at TIMESTAMPTZ` — 마지막 성공 sync 시각
- `google_calendar_sync_error TEXT` — 실패 시 short error code (full message 금지)

CHECK constraint: `('none', 'pending', 'synced', 'failed', 'skipped')`

적용 방법: Supabase SQL Editor에서 수동 실행. 자동 적용 없음.

### Worker endpoint 계약

**경로**: `POST /api/calendar/google/sync-record`

**요청 body**:
```json
{ "recordId": "<uuid>" }
```

**정상 응답**:
```json
{ "ok": true, "eventId": "<google_event_id>", "status": "synced" }
```

**중복 방지 응답** (이미 synced):
```json
{ "ok": true, "skipped": true, "reason": "already_synced" }
```

**에러 응답**: `jsonStatus(400|401|404|500, { ok: false, error: "..." })`

### Worker 함수 목록

1. `_calNextIsoDate(isoDate)` — `YYYY-MM-DD` 날짜 + 1일 반환
2. `buildGoogleCalendarEventDescription(record)` — DB row → Calendar description 문자열
3. `_patchWorkRecordSyncStatus(env, recordId, status, errorCode, eventId)` — DB patch, 실패 무시
4. `handleGoogleCalendarSyncRecord(request, env, body)` — 메인 핸들러

### dispatch 위치

`sync-record`는 JSON body가 필요하므로 `try { const body = await request.json() }` 블록 안에 배치.
`connect/start`, `create-passmap-calendar`와 달리 body parse 이후에 분기.

### event payload 계약

```json
{
  "summary": "PASSMAP | YYYY-MM-DD 업무 기록",
  "description": "[PASSMAP 업무 기록]\n• {content}\n\n[이력서 문장]\n{sentence}\n\n[태그]\n#t1 #t2",
  "start": { "date": "YYYY-MM-DD" },
  "end": { "date": "YYYY-MM-DD+1" },
  "visibility": "private",
  "transparency": "transparent",
  "extendedProperties": {
    "private": {
      "passmapRecordId": "<uuid>",
      "passmapSyncType": "single_record"
    }
  }
}
```

description 소스 우선순위:
- content: `record.description` → `raw_payload.text` → `raw_payload.projectActions` → `record.title`
- sentence: `raw_payload.resumeSentence` → `raw_payload.reflectedSentence` → `record.result`
- tags: `record.strength_tags` (배열)

### sync_status 상태 흐름

```
none
 └─ pending  (Worker가 insert 시작)
     ├─ synced   (event insert 성공, google_calendar_event_id 기록)
     └─ failed   (event insert 실패, google_calendar_sync_error 기록)

skipped  (google_calendar_event_id 이미 존재 — 중복 방지)
```

### 보안/소유권 정책

- `requireSupabaseUser` → `userId` 획득
- `work_records` 조회 시 `id=eq.recordId AND user_id=eq.userId` 조건 필수 (타인 기록 sync 차단)
- `google_calendar_connections` 조회 시 `user_id=eq.userId` 조건 필수
- service_role key 사용 (RLS bypass)

### 미구현 (CAL-7B 제외)

| 항목 | 예정 라운드 |
|------|------------|
| PmMvpView `_persistWorkRecord` 내 fire-and-forget 호출 | CAL-7D |
| ~~HomeDashboard hidden panel sync-record 테스트 버튼~~ | ~~CAL-7C~~ → 완료 |
| event update (기록 수정 시) | CAL-8 |
| event delete (기록 삭제 시) | CAL-8 |
| retry 로직 | CAL-8 |

---

## CAL-7C: Hidden sync-record Test UI (구현 완료)

Round: CAL-7C
날짜: 2026-04-30

### 구현 파일

`src/components/home/HomeDashboard.jsx` (append-only)

### 변경 내용

- state vars 3개 추가: `googleCalendarSyncing`, `googleCalendarSyncError`, `googleCalendarSyncMessage`
- handler `handleGoogleCalendarSyncRecord` 추가
- hidden panel(`showGoogleCalendarSync === true`) 내부에 세 번째 테스트 섹션 추가

### hidden flag 정책

`VITE_GOOGLE_CALENDAR_ENABLED !== "true"` 이면 `showGoogleCalendarSync === false` → 전체 panel이 DOM에 없음. 기본 사용자 화면 미노출.

### record 선택 정책

- `activeEntry = entriesByDate[selectedDate]` — 캘린더에서 선택된 날짜의 entry
- `activeEntry?.records?.[0]` 가 있으면: 해당 기록의 date · title을 버튼 위에 표시하고 버튼 활성
- `activeEntry?.records?.[0]` 가 없으면: "날짜를 선택하면 해당 날짜의 첫 번째 기록이 동기화됩니다." 표시 + 버튼 비활성
- 최신 기록 자동 선택 없음

### sync-record 호출 흐름

1. `activeEntry?.records?.[0]?.id` 없으면 → "먼저 기록을 선택해 주세요." 표시, 호출 중단
2. `getWorkerBase()` → `getSession()` → `access_token` 확인
3. `POST /api/calendar/google/sync-record` body `{ recordId }`
4. `ok:true && skipped:true` → "이미 동기화된 기록입니다."
5. `ok:true` (synced) → "Google Calendar에 기록을 추가했습니다." + `PASSMAP_WORK_RECORDS_CHANGED_EVENT` dispatch (records refresh)
6. `ok:false` → "Google Calendar 동기화에 실패했습니다: {error code}"

### 자동 sync 미구현

PmMvpView._persistWorkRecord() 연결은 CAL-7D. 이 버튼은 수동 개발 테스트 전용.

### 테스트 성공 후 확인 항목

- Supabase `work_records`: `google_calendar_event_id`, `google_calendar_sync_status = 'synced'` 확인
- Google Calendar 앱: "PASSMAP | YYYY-MM-DD 업무 기록" 종일 일정 생성 확인

---

## CAL-7D: Record Save Auto Google Calendar Sync (구현 완료)

Round: CAL-7D
날짜: 2026-04-30

### 구현 파일

`src/components/mvp/PmMvpView.jsx` (3 edits)

### 변경 내용

1. **import 추가**: `getSession` — `@/lib/auth.js`에서 추가
2. **module-level helper 추가** (`syncWorkRecordToGoogleCalendar`): 컴포넌트 정의 직전에 배치
3. **`_persistWorkRecord` 수정**:
   - `await createWorkRecord(...)` → `const savedRecord = await createWorkRecord(...)`
   - 저장 성공 직후 `void syncWorkRecordToGoogleCalendar(savedRecord?.id)` 추가
   - `fetchWorkRecords()` / `PASSMAP_WORK_RECORDS_CHANGED_EVENT` dispatch 순서 유지

### fire-and-forget 원칙

- `void syncWorkRecordToGoogleCalendar(...)`: 반환값 무시, 비동기 실행
- helper 내부 전체 try/catch — 실패해도 caller에 throw 없음
- 저장 성공 흐름 블로킹 없음
- sync 실패 시 Worker가 `google_calendar_sync_status='failed'` DB에 기록

### sync 호출 조건 (모두 충족 시에만)

- `VITE_GOOGLE_CALENDAR_ENABLED === "true"`
- `recordId` 존재 (`savedRecord?.id`)
- `VITE_AI_PROXY_URL` 존재
- `getSession().access_token` 존재

조건 불충족 시 silent skip — 저장은 그대로 성공.

### 프로덕션 기본 노출 보류

`VITE_GOOGLE_CALENDAR_ENABLED=true` 설정 시에만 자동 sync 활성. 미설정 환경에서는 완전 비활성.

### 미구현 (CAL-7D 제외)

| 항목 | 예정 라운드 |
|------|------------|
| 기존 기록 batch sync / backfill | CAL-8 |
| 기록 수정 시 event update | CAL-8 |
| 기록 삭제 시 event delete | CAL-8 |
| retry 로직 | CAL-8 |
| sync 상태 UI 표시 | CAL-8 |

---

## CAL-7D-FIX: Auto Sync Not Firing Investigation

Round: CAL-7D-FIX
날짜: 2026-04-30

### 증상

신규 저장 기록 `google_calendar_sync_status = 'none'` (pending/failed 아님) — Worker 미도달.

### 근본 원인 판정

**1순위 (가장 유력): 배포 타이밍 문제**

증거: 해당 기록의 `created_at: 2026-04-29 16:04 UTC` = KST 4월 30일 01:04 AM.
CAL-7D 코드가 구현된 시각은 4월 30일 낮. 즉, CAL-7D 코드가 로드되기 전에 저장된 기록.
이 기록에서 자동 sync가 실행되지 않은 것은 정상 동작. 코드 버그 아님.

**2순위 (배제 불가): 프론트 skip 조건**

`syncWorkRecordToGoogleCalendar` 내부 skip 조건 4개 중 하나 실패 가능성:
- `VITE_GOOGLE_CALENDAR_ENABLED !== "true"` — `.env.local`에 설정됨, 통과 예상
- `!recordId` — `createWorkRecord` 반환값 null 가능성 (RLS SELECT 제한 시)
- `!workerBase` — `.env.local`에 설정됨, 통과 예상
- `!accessToken` — `getSession()` null 반환 가능성

### 조치

`syncWorkRecordToGoogleCalendar`에 debug snapshot 추가:

```javascript
globalThis.__PASSMAP_GOOGLE_CALENDAR_SYNC_DEBUG__ = {
  enabled, hasRecordId, hasWorkerBase, hasSession,
  attemptedAt, result  // "skipped_disabled" | "skipped_no_record_id" | "skipped_no_worker_base" | "skipped_no_session" | "called" | "failed" | "success"
}
```

token/recordId/eventId 미포함. 진단 후 제거 필요.

### 사용자 확인 방법

1. 새 기록 저장 후 브라우저 콘솔에서: `globalThis.__PASSMAP_GOOGLE_CALENDAR_SYNC_DEBUG__`
2. `result === "called"` 이고 Supabase에 `google_calendar_sync_status = 'synced'` 이면 정상
3. `result === "skipped_*"` 이면 해당 조건 보고

### debug snapshot 제거 시점

`result === "success"` 확인 후 → 다음 라운드에서 snapshot 코드 제거 (CAL-7D-CLEANUP).

### CAL-7D-CLEANUP 결과 (2026-04-30)

- CAL-7D 자동 sync success 확인됨 (`enabled: true`, `hasRecordId: true`, `hasWorkerBase: true`, `hasSession: true`, `result: "success"`)
- Supabase `google_calendar_sync_status = 'synced'`, `google_calendar_event_id` 값 있음
- `globalThis.__PASSMAP_GOOGLE_CALENDAR_SYNC_DEBUG__` snapshot 코드 전체 제거 완료
- `syncWorkRecordToGoogleCalendar` 함수 및 자동 sync 흐름은 정상 유지

---

## CAL-8A: Backfill/Retry Design

Round: CAL-8A (설계 전용 — 런타임 코드 수정 없음)
날짜: 2026-04-30

### 조사 결과 요약

**`listWorkRecords`**: `.select("*")` → raw rows에 `google_calendar_sync_status`, `google_calendar_event_id` 포함.

**`adaptWorkRecordRowForHomeDashboard`**: sync 필드 미매핑 → `safeRecords`에는 `id`, `date`, `title` 등만 존재. sync status 없음.

**Worker idempotency 근거**: `handleGoogleCalendarSyncRecord`는 `google_calendar_event_id` 존재 여부로 중복 방지.
- `google_calendar_event_id` 있음 → `{ ok: true, skipped: true, reason: "already_synced" }` 즉시 반환
- 없음 → `google_calendar_sync_status` 무관하게 sync 진행 (none/failed 모두 재시도 가능)

**프론트 필터링 불가**: `safeRecords`에 sync status 없음 → 프론트에서 "none/failed만" 필터링 불가.
단, Worker idempotency가 이미 동일한 효과를 제공하므로 프론트 필터링 불필요.

**현재 hidden panel**: `safeRecords`에서 `id` 확보 가능. `getWorkerBase()` / `getSession()` 패턴 재사용 가능.

### 방안 비교

#### A안: 프론트 hidden UI — safeRecords 전체 순차 sync-record 호출

- `safeRecords` (최대 50건) 전체를 순차 반복, 각 record.id로 sync-record 호출
- Worker가 이미 synced인 것 skipped 처리 → 중복 생성 없음
- 개별 실패는 계속 진행, 실패 count만 기록
- 진행 상황: `{ done, total, synced, skipped, failed }` state로 표시

**장점**: Worker/DB/repository 변경 없음. 기존 패턴 완전 재사용. 구현 1파일.
**단점**: 이미 synced인 기록도 Worker를 거침 (단, Worker 내 idempotency check는 DB 1회 조회 후 즉시 반환으로 매우 저비용). 50건 제한.
**추천 여부**: ✅ MVP 단계에 적합. **추천**

#### B안: Worker batch-sync endpoint 신규 추가

- `POST /api/calendar/google/backfill-records` 추가
- Worker가 work_records에서 none/failed 조회 → 내부 반복 sync
- partial success 처리 필요

**장점**: 프론트 반복 호출 불필요. 건수 제한 없음.
**단점**: Worker 책임 확대. partial success 설계 복잡. 구현 비용 높음. 실패 복구 로직 추가 필요.
**추천 여부**: ❌ MVP 단계에서 과도함. CAL-9 이후 후보.

#### C안: 기존 CAL-7C 수동 날짜별 sync만 유지

- 사용자가 날짜를 선택하고 수동으로 첫 번째 기록을 sync
- 추가 구현 없음

**장점**: 구현 없음.
**단점**: 과거 기록 수가 많으면 번거로움. backfill 목적에 부합하지 않음.
**추천 여부**: ❌ backfill 요건 미충족.

### 추천: A안

### 대상 기록 정책

**backfill 대상** (Worker idempotency 위임):
- `safeRecords` 전체 (최대 50건, 현재 limit)
- `record.id` 있는 기록만
- Worker에서 `google_calendar_event_id` 기준으로 중복 방지

**자동 제외** (Worker가 처리):
- `google_calendar_event_id` 이미 있는 기록 → `skipped: true` 반환

**대상 외** (구현하지 않음):
- 50건 초과 기록 → CAL-9에서 pagination 후보
- 삭제된 기록

### 실패 정책

- 개별 기록 실패 → `failed` count 증가, 다음 기록으로 계속 진행
- 전체 실패 → 최종 메시지에 실패 건수 표시
- retry: 버튼 재클릭으로 가능 (Worker idempotency로 안전)
- 실패한 기록의 `google_calendar_sync_status = 'failed'`는 Worker가 기록

### UI 정책

- `VITE_GOOGLE_CALENDAR_ENABLED=true` hidden panel 내부에만 노출
- 기본 사용자 화면 미노출
- 버튼명: "미동기화 기록 Google Calendar 동기화"
- 진행 표시: "N/M 처리 중 (X건 동기화됨, Y건 건너뜀)"
- 완료 메시지: "완료: X건 동기화, Y건 건너뜀, Z건 실패"

### CAL-8B 구현 범위 제안

**수정 파일 1개**: `src/components/home/HomeDashboard.jsx`

추가 내용:
- state vars 3개: `googleCalendarBackfilling`, `googleCalendarBackfillProgress`, `googleCalendarBackfillMessage`
- handler 1개: `handleGoogleCalendarBackfill` — `safeRecords` 순차 반복, sync-record 호출
- hidden panel UI 1 섹션: `<hr>` + 제목 + 설명 + 진행상황 + 버튼

**수정 금지**:
- `worker-ai/orange-shadow-95c1/src/index.js` (Worker 변경 없음)
- `src/lib/workRecordRepository.js` (repository 변경 없음)
- `adaptWorkRecordRowForHomeDashboard` (sync status 매핑 추가 불필요)
- Supabase SQL
- PmMvpView.jsx

---

## CAL-8B: Hidden Backfill Sync UI (구현 완료)

Round: CAL-8B
날짜: 2026-04-30

### 구현 파일

`src/components/home/HomeDashboard.jsx` (append-only, 3 edits)

### 변경 내용

- state 3개 추가: `googleCalendarBackfilling`, `googleCalendarBackfillProgress` (null | `{done, total, synced, skipped, failed}`), `googleCalendarBackfillMessage`
- handler `handleGoogleCalendarBackfill` 추가: `safeRecords`에서 `id` 있는 기록 최대 50건 순차 sync-record 호출
- hidden panel UI 섹션 추가: 기존 "선택 기록 동기화 테스트" 버튼 이후에 `<hr>` + 새 섹션

### hidden flag 정책

`VITE_GOOGLE_CALENDAR_ENABLED !== "true"` → `showGoogleCalendarSync === false` → 전체 panel DOM 없음. backfill 버튼도 미노출.

### backfill 대상

`safeRecords.filter(r => r?.id).slice(0, 50)` — 현재 화면에 로딩된 기록 최대 50건.
DB 전체 backfill 아님.

### Worker idempotency 의존

Worker가 `google_calendar_event_id` 기준으로 already_synced 처리 → 이미 synced 기록 자동 건너뜀.
프론트에서 sync status 필터링 불필요.

### 실패 정책

개별 기록 실패 → `failed++` → 다음 기록 계속 진행. 최종 메시지에 실패 건수 표시.

### 완료 후 refresh

`synced > 0` 이면 `PASSMAP_WORK_RECORDS_CHANGED_EVENT` dispatch → `fetchRecords()` 트리거.

### 미구현 (CAL-8B 제외)

| 항목 | 예정 |
|------|------|
| sync 상태 UI (synced/failed 뱃지) | CAL-8C |
| 50건 초과 pagination | CAL-9 |
| event update/delete | CAL-9 |
| retry UX (실패 기록만 재시도) | CAL-9 |
