# PASSMAP 선택 텍스트 보내기 (Chrome Extension)

ChatGPT / Gemini / Claude / 일반 웹페이지에서 사용자가 직접 드래그해 선택한 텍스트를, PASSMAP의 "AI 대화에서 경험 찾기" 입력창으로 한 번에 보내주는 Chrome 확장입니다.

## MVP 안전 동작 기준

- 이 확장은 전체 대화를 자동 수집하지 않습니다. 사용자가 드래그로 선택한 텍스트만 PASSMAP으로 보냅니다.
- 선택 텍스트는 URL query/hash에 실리지 않습니다. 원문은 `chrome.storage.local`의 일회성 bridge를 거쳐 PASSMAP 탭의 `sessionStorage.PASSMAP_EXTERNAL_INTAKE`로만 전달됩니다.
- 개인정보, 회사 기밀, 고객정보, access token, API key, OAuth token, 원문 대화 전체는 선택하지 마세요.
- 전송 후에도 PASSMAP AI 대화 기록 입력 화면에서 내용을 다시 검토한 뒤 사용자가 직접 분석/저장을 눌러야 합니다.
- Chrome MV3 background service worker에서는 DOM 기반 `confirm()`을 직접 띄울 수 없습니다. 현재 MVP는 PASSMAP 입력 화면에 민감정보 확인 경고를 표시하는 방식으로 전송 후 저장 전 검토를 강제합니다.
- 현재 운영 URL은 `https://passmap-app.vercel.app/#work-trace-intake`로 고정되어 있습니다. options page나 로컬 URL 분기는 아직 없습니다.
- 로컬 테스트가 필요하면 `background.js`의 `PASSMAP_URL` 상수를 임시로 로컬 주소로 바꿔 테스트한 뒤, PR에는 운영 URL 상태로 되돌려야 합니다.
- 선택한 페이지 host는 저장 metadata에 `sourcePlatform`으로 남습니다: `chatgpt`, `claude`, `gemini`, 그 외 `browser_extension`.

전체 대화를 자동으로 긁어오지 않습니다. **사용자가 선택한 부분만** 전달합니다.

---

## 사용 흐름

1. ChatGPT / Gemini / Claude / 일반 웹페이지에서 PASSMAP에 보내고 싶은 대화 부분을 드래그해 선택합니다.
2. 마우스 우클릭 메뉴에서 **`패스맵에서 경험 찾기`** 를 선택합니다.
3. 새 탭으로 `https://passmap-app.vercel.app/#work-trace-intake` 가 열리며, 홈 화면에서 멈추지 않고 곧바로 **`경험 기록하기 1/2`** 화면으로 자동 이동합니다. (기존 `https://reject-analyzer.vercel.app/` 책갈피도 호환을 위해 그대로 동작합니다.)
4. AI 대화 탭이 자동으로 선택되고, 선택한 텍스트가 입력창에 자동으로 들어가 있습니다.
5. 내용을 검토한 뒤 **`AI로 경험 정리하기`** 버튼을 사용자가 직접 누르면 경험 후보가 추출됩니다.

자동 분석은 시작되지 않습니다. 보내기 전 마지막으로 한 번 더 사용자가 확인할 수 있도록 의도된 동작입니다.

URL의 `#work-trace-intake` 부분은 약한 의도 표시일 뿐입니다. 실제 자동 이동은 `sessionStorage.PASSMAP_EXTERNAL_INTAKE` 페이로드로 결정되므로 URL 자체에는 선택 텍스트가 들어가지 않습니다. 페이로드가 없으면 일반 홈으로 그대로 진입합니다.

---

## 설치 방법

### Chrome Web Store에서 설치 (향후 배포 후)

> 아직 Chrome Web Store 등록 전입니다. 등록 완료 후 본 절에 스토어 링크가 추가됩니다.

### 로컬 개발자 모드 설치 (현재)

1. Chrome 주소창에 `chrome://extensions` 를 입력해 확장 관리 페이지로 이동합니다.
2. 화면 오른쪽 위의 **`개발자 모드`** 토글을 켭니다.
3. 왼쪽 위의 **`압축해제된 확장 프로그램을 로드`** 버튼을 누릅니다.
4. 이 폴더(`extension/passmap-selection-import`) 를 선택합니다.
5. 확장이 목록에 추가되면 설치 완료입니다.

확장 코드를 수정한 뒤에는 `chrome://extensions` 의 새로고침 버튼(↻) 으로 갱신해야 변경이 적용됩니다.

---

## 테스트 방법

설치 후 동작을 확인하려면:

1. ChatGPT, Gemini, Claude, 또는 임의 웹페이지를 엽니다.
2. 30자 이상의 텍스트를 드래그로 선택합니다. (30자 미만은 무시됩니다.)
3. 우클릭 → `패스맵에서 경험 찾기` 클릭.
4. 새 탭이 열리며 PASSMAP의 `경험 기록하기 1/2` 화면으로 진입하는지 확인합니다.
5. AI 대화 탭이 선택되고 선택한 텍스트가 입력창에 자동으로 채워지는지 확인합니다.

DevTools 콘솔에서 다음을 확인할 수 있습니다:

- 30자 미만: `[passmap-ext] selection ignored: needs at least 30 characters`
- 정상 동작 시 PASSMAP 도메인의 `sessionStorage` 에 `PASSMAP_EXTERNAL_INTAKE` 키가 한 번 기록되고, `chrome.storage.local` 의 `PASSMAP_EXTERNAL_INTAKE_BRIDGE` 키는 즉시 비워집니다.

---

## 동작 원리 요약

이 확장은 외부 서버로 데이터를 보내지 않습니다. 모든 전달은 사용자의 브라우저 안에서만 일어납니다.

1. 컨텍스트 메뉴 클릭 → `background.js` 가 `info.selectionText` 만 받습니다.
2. 30자 미만이면 무시, 50,000자 초과면 잘라냅니다.
3. payload를 `chrome.storage.local` 의 `PASSMAP_EXTERNAL_INTAKE_BRIDGE` 키에 저장합니다.
4. `https://passmap-app.vercel.app/` 를 새 탭으로 엽니다. (구 도메인 `https://reject-analyzer.vercel.app/` 도 호환을 위해 `manifest.json` 에 병행 등록되어 있습니다.)
5. PASSMAP 운영 도메인에서만 동작하는 `content-passmap.js` 가 `document_start` 시점에 storage 값을 읽어 검증합니다.
6. 유효하면 그 페이지의 `sessionStorage` 에 `PASSMAP_EXTERNAL_INTAKE` 키로 다시 씁니다. 그 다음 storage의 bridge 값을 즉시 삭제합니다.
7. PASSMAP React 앱이 초기 마운트하면서 이 sessionStorage를 읽고 AI 대화 탭에 텍스트를 자동 입력합니다.

전송되는 데이터 모양:

```json
{
  "version": 1,
  "sourceMode": "ai_conversation",
  "sourcePlatform": "chatgpt",
  "importMethod": "browser_extension_selection",
  "privacyReviewRequired": true,
  "rawText": "사용자가 선택한 텍스트",
  "savedAt": 1779450000000
}
```

---

## 수집하지 않는 데이터

이 확장이 **읽지도 보내지도 않는** 것들을 명시합니다.

- ChatGPT / Gemini / Claude 의 전체 대화 내용
- 사용자가 선택하지 않은 페이지 본문, 사이드바, 시스템 프롬프트, 첨부 파일
- 쿠키, 로그인 세션, 인증 토큰
- 비밀번호, 자동완성 데이터, 결제 정보
- 브라우징 기록, 방문 사이트 목록, 즐겨찾기
- 마우스 움직임, 키 입력, 화면 캡처
- IP 주소, 디바이스 식별자, 위치 정보

전송되는 것은 오직 **사용자가 직접 드래그해 선택한 텍스트** 뿐이며, 그 텍스트는 PASSMAP 도메인의 `sessionStorage` 로만 전달됩니다. 확장 자체는 외부 네트워크로 데이터를 송신하지 않습니다.

---

## 권한 및 권한별 사용 이유

`manifest.json` 에서 요청하는 권한과 그 이유입니다.

| 권한 | 이유 |
|---|---|
| `contextMenus` | 우클릭 메뉴 `패스맵에서 경험 찾기` 항목을 추가하기 위해서 |
| `storage` | 선택 텍스트를 PASSMAP 새 탭으로 안전하게 넘기는 중간 저장소(`chrome.storage.local`) 로 쓰기 위해서. 외부 서버 전송이 아닙니다 |
| `tabs` | PASSMAP 도메인을 새 탭으로 열기 위해서. 다른 탭의 URL이나 내용을 읽지 않습니다 |
| `host_permissions: https://passmap-app.vercel.app/*` (+ 구 도메인 `https://reject-analyzer.vercel.app/*` 호환 유지) | PASSMAP 운영 도메인에서만 content script가 동작하도록 제한하기 위해서. 두 도메인 모두 동일한 PASSMAP 빌드를 서빙합니다 |

ChatGPT / Gemini / Claude 도메인에는 **별도의 `host_permissions` 를 요청하지 않습니다.** 이 확장은 그 사이트들의 DOM이나 대화 내용을 읽지 않습니다. 브라우저의 표준 컨텍스트 메뉴 API가 사용자가 "선택한 텍스트"만 전달해 주기 때문입니다.

---

## 개인정보 주의 사항

- 선택한 텍스트만 PASSMAP으로 전달됩니다. 전체 대화를 자동 수집하지 않습니다.
- **민감 정보(주민등록번호, 신용카드 번호, 회사 기밀, 비밀번호, 미공개 인사정보 등) 가 포함된 부분은 드래그 전에 제외**해 주세요. 일단 선택해서 보내면 PASSMAP에 임시 저장되며, 사용자가 직접 삭제하지 않는 한 남아 있을 수 있습니다.
- PASSMAP 도메인이 변경되면 `manifest.json` 의 `host_permissions` 와 `background.js` 의 `PASSMAP_URL`, `content_scripts.matches` 를 함께 수정해야 합니다.
- 자세한 처리 방침은 `../../docs/passmap-extension-privacy-policy-draft.md` 초안을 참고하세요.

---

## Chrome Web Store 제출 체크리스트

스토어 등록 전에 다음 항목을 점검합니다. 자세한 절차는 `STORE_LISTING_DRAFT.md` 와 `PACKAGE_FOR_STORE.md` 에 정리되어 있습니다.

### 코드 / 메타데이터
- [ ] `manifest.json` `version` 갱신 (현재 `0.1.0`, 첫 스토어 제출 시 `0.1.1` 로 올리는 것을 권장)
- [ ] `manifest.json` `name` / `description` 이 스토어 정책에 부합하는지 재확인 (현재 OK 추정)
- [ ] `permissions` 가 최소화되어 있는지 (`contextMenus`, `storage`, `tabs` 만)
- [ ] `host_permissions` 가 `https://passmap-app.vercel.app/*` + 구 도메인 `https://reject-analyzer.vercel.app/*` 두 항목 외로 늘지 않았는지
- [ ] DOM 자동 파싱 / 전체 대화 자동 수집 / 쿠키 접근 코드가 없는지

### 아이콘 (TODO — 미준비)
- [ ] 16x16 PNG
- [ ] 32x32 PNG
- [ ] 48x48 PNG
- [ ] 128x128 PNG (스토어 리스팅용 큰 아이콘과 별개로 manifest 등록용)
- [ ] 디자인 확정 후 `extension/passmap-selection-import/icons/` 폴더에 배치하고 `manifest.json` 에 `icons` 항목 추가

### 스토어 listing 자료
- [ ] 1280x800 또는 640x400 스크린샷 최소 1장 (권장 3~5장)
- [ ] 440x280 작은 프로모션 타일
- [ ] 한 줄 설명 (132자 이내)
- [ ] 상세 설명 (마크다운 / 일반 텍스트)
- [ ] 카테고리 선택
- [ ] 언어 (한국어 우선, 영어 보조 권장)

### 정책 / 법적
- [ ] 개인정보처리방침 페이지 공개 URL 준비
- [ ] 단일 목적(single purpose) 설명 작성
- [ ] 권한 사용 사유 설명 작성
- [ ] 데이터 사용 공시 양식 작성

### 배포 패키지
- [ ] `PACKAGE_FOR_STORE.md` 절차대로 zip 생성
- [ ] zip 루트에 `manifest.json` 위치 확인
- [ ] `node_modules`, `.env*`, 테스트 데이터, 개인 데이터, `.git` 미포함 확인

### 공개 범위
- [ ] 1차: **Unlisted** (링크 보유자만) 로 제한해 내부 검증
- [ ] 2차: 검증 후 **Public** 로 전환

---

## 관련 PR 및 코드 위치

- 패스맵 본체 수신부: PR #517 — `src/components/workTrace/WorkTraceInput.jsx`, `src/components/workTrace/WebWorkTraceRecordPage.jsx`, `src/lib/workTrace/saveWorkTraceCandidates.js`
- 확장 본체 (이 폴더): `extension/passmap-selection-import/`
- 스토어 listing 초안: `STORE_LISTING_DRAFT.md`
- 패키징 절차: `PACKAGE_FOR_STORE.md`
- 개인정보처리방침 초안: `docs/passmap-extension-privacy-policy-draft.md`
