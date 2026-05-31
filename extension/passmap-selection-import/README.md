# PASSMAP AI 작업 저장 (Chrome Extension)

ChatGPT 화면에서 오늘의 AI 작업 내용을 PASSMAP AI Inbox 후보로 직접 보내는 Chrome 확장입니다. Claude / Gemini는 현재 자동 캡처 품질 점검 중이므로 필요한 부분을 선택해 보내는 fallback을 권장합니다.

이번 MVP는 AI Inbox 직접 저장 진입점을 popup에 추가합니다. 아직 확장 연결 토큰 UX는 없으므로 토큰이 없을 때는 API를 호출하지 않고 PASSMAP 입력 화면으로 보내는 기존 bridge fallback을 계속 사용합니다.

## 주요 UX

### 확장 아이콘 클릭 -> 현재 대화 저장

1. ChatGPT / Claude / Gemini 일반 대화 화면을 엽니다.
2. Chrome 툴바의 PASSMAP 확장 아이콘을 클릭합니다.
3. popup에서 **현재 대화 저장**을 누릅니다.
4. 현재 탭의 제목, URL, 플랫폼, 캡처 시각, 화면에 보이는 본문 일부가 `chrome.storage.local.PASSMAP_EXTERNAL_INTAKE_BRIDGE`에 저장됩니다.
5. `https://passmap-app.vercel.app/#work-trace-intake`가 새 탭으로 열립니다.
6. PASSMAP content script가 bridge payload를 `sessionStorage.PASSMAP_EXTERNAL_INTAKE`로 옮깁니다.
7. PASSMAP AI 대화 탭에 내용이 자동 입력됩니다.

본문은 `document.body.innerText` 기준으로 읽고 50,000자로 제한합니다. 너무 짧은 텍스트는 저장하지 않고 popup에 상태 메시지를 표시합니다.

### 선택 텍스트 우클릭 또는 popup -> 선택한 부분 저장

기존 방식도 유지됩니다.

1. 웹페이지에서 PASSMAP으로 보낼 텍스트를 드래그합니다.
2. 우클릭 메뉴에서 **PASSMAP에 선택 텍스트 저장**을 선택하거나 popup에서 **선택한 부분만 저장**을 누릅니다.
3. 선택 텍스트가 같은 bridge를 거쳐 PASSMAP AI 대화 탭으로 전달됩니다.

### PASSMAP Inbox 열기

popup의 **PASSMAP Inbox 열기** 버튼은 PASSMAP intake URL을 바로 엽니다. payload가 없으면 PASSMAP 일반 흐름으로 진입합니다.

### PASSMAP AI Inbox에 후보로 저장

popup의 **PASSMAP AI Inbox에 후보로 저장** 버튼은 저장 토큰이 준비된 경우 `/api/save-analysis-run?action=browser_extension_save_experience`로 구조화 후보를 직접 보냅니다. 현재 배치에는 pairing/token UX가 없으므로 토큰이 없으면 요청을 보내지 않고 연결 필요 안내를 표시합니다.

직접 저장이 성공하면 popup에 **Inbox에서 확인하기** 버튼이 표시됩니다. 버튼은 API 응답의 `inboxUrl`을 우선 열고, 없으면 PASSMAP AI Inbox URL로 이동합니다.

현재 직접 AI Inbox 저장은 ChatGPT 대화 화면에서만 지원합니다. Claude/Gemini는 자동 캡처 품질을 더 확인한 뒤 활성화할 예정이므로, 필요한 대화 부분을 드래그한 뒤 **선택한 부분만 저장**을 사용해 주세요.

직접 저장 payload는 `title`, `situation`, `task`, `actions`, `evidenceTexts`, `sourcePlatform`, `sourceUrl`, `sourceTitle`, `captureMode`, `captureQuality`, `messageCount` 같은 구조화 필드만 포함합니다. `rawText`, `messages`, `fullTranscript` 원문 필드는 보내지 않습니다.

## 동작 원리

기본 fallback 흐름은 외부 서버로 직접 데이터를 보내지 않고 PASSMAP 탭으로 bridge payload를 넘깁니다. 직접 저장 버튼은 저장 토큰이 있을 때만 PASSMAP API로 구조화 후보를 전송합니다.

1. popup 또는 context menu가 payload를 만듭니다.
2. payload를 `chrome.storage.local.PASSMAP_EXTERNAL_INTAKE_BRIDGE`에 저장합니다.
3. PASSMAP 운영 URL을 새 탭으로 엽니다.
4. PASSMAP 도메인에서만 실행되는 `content-passmap.js`가 bridge payload를 검증합니다.
5. 유효하면 `sessionStorage.PASSMAP_EXTERNAL_INTAKE`에 기록하고 bridge 값을 삭제합니다.
6. PASSMAP React 앱이 sessionStorage를 읽어 AI 대화 탭에 자동 입력합니다.

현재 대화 저장 payload 예시:

```json
{
  "version": 1,
  "sourceMode": "ai_conversation",
  "sourcePlatform": "chatgpt",
  "importMethod": "browser_extension_current_conversation",
  "privacyReviewRequired": true,
  "sourceUrl": "https://chatgpt.com/c/example",
  "sourceTitle": "ChatGPT",
  "capturedAt": 1779450000000,
  "captureMode": "current_conversation",
  "rawText": "화면에 보이는 대화 일부",
  "savedAt": 1779450000000
}
```

선택 텍스트 payload는 기존 `browser_extension_selection` importMethod를 유지하며, 가능한 경우 `sourceUrl`, `sourceTitle`, `capturedAt`, `captureMode` metadata도 함께 전달합니다.

## 권한

| 권한 | 이유 |
|---|---|
| `activeTab` | 사용자가 popup에서 현재 대화 저장을 누른 현재 탭만 읽기 위해 사용합니다. |
| `scripting` | 현재 탭에서 `document.body.innerText`, `document.title`, `location.href`를 캡처하는 짧은 함수를 실행하기 위해 사용합니다. |
| `contextMenus` | 선택 텍스트 우클릭 저장 메뉴를 제공하기 위해 사용합니다. |
| `storage` | PASSMAP 탭으로 payload를 넘기는 브라우저 내부 일회성 bridge로 사용합니다. |
| `tabs` | PASSMAP intake URL을 새 탭으로 열기 위해 사용합니다. |
| `host_permissions` | PASSMAP 운영 도메인과 구 호환 도메인에서만 content script를 실행하기 위해 사용합니다. |

ChatGPT / Claude / Gemini 도메인은 `host_permissions`에 추가하지 않습니다. 현재 탭 읽기는 사용자가 확장 popup을 클릭한 탭에 대해 `activeTab` 기반으로만 처리합니다.

## 수집하지 않는 것

- 쿠키, 로그인 세션, PASSMAP 웹앱 인증 토큰
- 비밀번호, 자동완성 데이터, 결제 정보
- 브라우징 기록, 방문 사이트 목록, 즐겨찾기
- 마우스 움직임, 키 입력, 화면 캡처
- 원문 전체를 포함한 API 직접 저장 요청
- 사용자 확인 없는 AI Inbox 후보 직접 생성

현재 대화 저장은 화면에 보이는 본문 텍스트를 넓게 읽는 MVP입니다. PASSMAP에서 저장 전 다시 검토하는 절차가 반드시 필요합니다.

## 로컬 설치

1. Chrome 주소창에서 `chrome://extensions`를 엽니다.
2. 오른쪽 위 **개발자 모드**를 켭니다.
3. **압축해제된 확장 프로그램을 로드**를 누릅니다.
4. `extension/passmap-selection-import` 폴더를 선택합니다.
5. 코드 수정 후에는 확장 카드의 새로고침 버튼으로 다시 로드합니다.

로컬 확장을 최신으로 테스트하려면:

1. `git pull origin main`
2. `chrome://extensions` 접속
3. PASSMAP AI 작업 저장 카드의 새로고침 클릭
4. popup 하단에서 `v0.1.5 · pairing-token-ux-20260531` 표시 확인

## 수동 QA

### 현재 대화 저장

1. ChatGPT / Claude / Gemini 대화 화면을 엽니다.
2. PASSMAP 확장 아이콘을 클릭합니다.
3. popup에서 **현재 대화 저장**을 누릅니다.
4. PASSMAP intake 탭이 열리는지 확인합니다.
5. AI 대화 탭에 현재 화면의 대화 일부가 자동 입력되는지 확인합니다.
6. PASSMAP 탭 DevTools에서 `sessionStorage.PASSMAP_EXTERNAL_INTAKE`가 기록되었는지 확인합니다.
7. 확장 storage의 `PASSMAP_EXTERNAL_INTAKE_BRIDGE`가 content script 실행 후 삭제되는지 확인합니다.

### 선택한 부분 저장

1. 웹페이지에서 30자 이상의 텍스트를 드래그합니다.
2. 우클릭 -> **PASSMAP에 선택 텍스트 저장**을 누르거나 popup -> **선택한 부분만 저장**을 누릅니다.
3. PASSMAP intake 탭이 열리고 선택 텍스트가 자동 입력되는지 확인합니다.

## Custom GPT Action 위치

Custom GPT Action은 시연 또는 고급 사용자용 흐름입니다. 매일 쓰는 기본 UX는 브라우저 확장을 통해 현재 대화 또는 선택한 부분을 PASSMAP AI 대화 탭으로 전달하는 방식입니다.

## PASSMAP 연결 코드로 확장 연결

1. PASSMAP에서 연결 코드를 발급받습니다. 현재는 기존 MCP pairing code 발급 흐름을 사용하며, 더 쉬운 PASSMAP 연결 코드 발급 UX는 다음 배치에서 보강합니다.
2. 확장 popup의 연결 코드 입력란에 코드를 붙여넣고 **연결**을 누릅니다.
3. 연결에 성공하면 확장 전용 `chrome.storage.local.PASSMAP_DIRECT_SAVE_BEARER`에 token이 저장되고 "PASSMAP 연결됨" 상태가 표시됩니다.
4. 이후 **PASSMAP AI Inbox에 후보로 저장** 버튼이 저장 token으로 직접 저장 API를 호출합니다.
5. **연결 해제**는 현재 로컬 token과 metadata만 삭제합니다. 서버 revoke UI 연동은 후속 단계입니다.
