# PASSMAP 선택 텍스트 보내기 (Chrome Extension MVP)

ChatGPT / Gemini / Claude / 일반 웹페이지에서 사용자가 직접 드래그해 선택한 텍스트를, PASSMAP의 "AI 대화에서 경험 찾기" 입력창으로 한 번에 보내주는 Chrome 확장입니다.

전체 대화를 자동으로 긁어오지 않습니다. 사용자가 선택한 부분만 전달합니다.

---

## 사용 흐름

1. ChatGPT / Gemini / Claude / 일반 웹페이지에서 PASSMAP에 보내고 싶은 대화 부분을 드래그해 선택합니다.
2. 마우스 우클릭 메뉴에서 **`패스맵에서 경험 찾기`** 를 선택합니다.
3. 새 탭으로 `https://reject-analyzer.vercel.app/#work-trace-intake` 가 열리며, 홈 화면에서 멈추지 않고 곧바로 **`경험 기록하기 1/2`** 화면으로 자동 이동합니다.
4. AI 대화 탭이 자동으로 선택되고, 선택한 텍스트가 입력창에 자동으로 들어가 있습니다.
5. 내용을 검토한 뒤 **`AI로 경험 정리하기`** 버튼을 사용자가 직접 누르면 경험 후보가 추출됩니다.

자동 분석은 시작되지 않습니다. 보내기 전 마지막으로 한 번 더 사용자가 확인할 수 있도록 의도된 동작입니다.

URL의 `#work-trace-intake` 부분은 약한 의도 표시일 뿐입니다. 실제 자동 이동은 `sessionStorage.PASSMAP_EXTERNAL_INTAKE` 페이로드로 결정되므로 URL 자체에는 선택 텍스트가 들어가지 않습니다. 페이로드가 없으면 일반 홈으로 그대로 진입합니다.

---

## 로컬 설치 방법 (개발자 모드)

현재는 Chrome Web Store 배포 전 MVP입니다. 개발자 모드로 직접 로드해야 합니다.

1. Chrome 주소창에 `chrome://extensions` 를 입력해 확장 관리 페이지로 이동합니다.
2. 화면 오른쪽 위의 **`개발자 모드`** 토글을 켭니다.
3. 왼쪽 위의 **`압축해제된 확장 프로그램을 로드`** 버튼을 누릅니다.
4. 이 폴더(`extension/passmap-selection-import`) 를 선택합니다.
5. 확장이 목록에 추가되면 설치 완료입니다.

확장 코드를 수정한 뒤에는 `chrome://extensions` 의 새로고침 버튼(↻) 으로 갱신해야 변경이 적용됩니다.

---

## 동작 원리 요약

이 확장은 외부 서버로 데이터를 보내지 않습니다. 모든 전달은 사용자의 브라우저 안에서만 일어납니다.

1. 컨텍스트 메뉴 클릭 → `background.js` 가 `info.selectionText` 만 받습니다.
2. 30자 미만이면 무시, 50,000자 초과면 잘라냅니다.
3. payload를 `chrome.storage.local` 의 `PASSMAP_EXTERNAL_INTAKE_BRIDGE` 키에 저장합니다.
4. `https://reject-analyzer.vercel.app/` 를 새 탭으로 엽니다.
5. PASSMAP 도메인에서만 동작하는 `content-passmap.js` 가 `document_start` 시점에 storage 값을 읽어 검증합니다.
6. 유효하면 그 페이지의 `sessionStorage` 에 `PASSMAP_EXTERNAL_INTAKE` 키로 다시 씁니다. 그 다음 storage의 bridge 값을 즉시 삭제합니다.
7. PASSMAP React 앱이 초기 마운트하면서 이 sessionStorage를 읽고 AI 대화 탭에 텍스트를 자동 입력합니다.

전송되는 데이터 모양:

```json
{
  "version": 1,
  "sourceMode": "ai_conversation",
  "importMethod": "browser_extension_selection",
  "rawText": "사용자가 선택한 텍스트",
  "savedAt": 1779450000000
}
```

---

## 권한

`manifest.json` 에서 요청하는 권한과 그 이유입니다.

| 권한 | 이유 |
|---|---|
| `contextMenus` | 우클릭 메뉴를 만들기 위해서 |
| `storage` | 선택 텍스트를 PASSMAP 새 탭으로 안전하게 넘기는 중간 저장소(`chrome.storage.local`) 로 쓰기 위해서 |
| `tabs` | PASSMAP 도메인을 새 탭으로 열기 위해서 |
| `host_permissions: https://reject-analyzer.vercel.app/*` | PASSMAP 도메인에서만 content script가 동작하도록 제한하기 위해서 |

ChatGPT / Gemini / Claude 도메인에는 별도의 `host_permissions` 를 요청하지 않습니다. 이 확장은 그 사이트들의 DOM이나 대화 내용을 읽지 않습니다. 브라우저의 표준 컨텍스트 메뉴 API가 사용자가 "선택한 텍스트"만 전달해 주기 때문입니다.

---

## 주의 사항

- 선택한 텍스트만 PASSMAP으로 전달됩니다. 전체 대화를 자동 수집하지 않습니다.
- 민감 정보(개인정보, 회사 기밀, 비밀번호 등)가 포함된 부분은 선택 전에 제외해 주세요.
- 패스맵 도메인이 변경되면 `manifest.json` 의 `host_permissions` 와 `background.js` 의 `PASSMAP_URL`, `content_scripts.matches` 를 함께 수정해야 합니다.
- 현재는 로컬 개발자 모드용 MVP 입니다. Chrome Web Store에는 아직 등록하지 않았습니다.

---

## 관련 PR 및 코드 위치

- 패스맵 본체 수신부: PR #517 — `src/components/workTrace/WorkTraceInput.jsx`, `src/components/workTrace/WebWorkTraceRecordPage.jsx`, `src/lib/workTrace/saveWorkTraceCandidates.js`
- 확장 본체 (이 폴더): `extension/passmap-selection-import/`
