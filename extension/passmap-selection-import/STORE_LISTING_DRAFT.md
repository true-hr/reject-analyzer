# Chrome Web Store Listing 초안

PASSMAP 선택 텍스트 보내기 확장의 Chrome Web Store 등록용 listing 초안입니다.
실제 등록 전 사용자 검토 단계입니다. 본 문서를 그대로 스토어에 붙여 넣지 말고, 최종 검토 후 반영하세요.

---

## 1. 확장 이름 후보

스토어 노출명은 최대 75자입니다. 한국어/영어 둘 다 후보를 둡니다.

### 한국어 후보
1. **`패스맵 - 선택 텍스트 보내기`** (현재 manifest 기준에 가장 가까움)
2. `PASSMAP 선택 보내기`
3. `패스맵 경험 기록 헬퍼`

### 영어 후보 (영어 listing 추가 시)
1. **`PASSMAP — Send Selected Text`**
2. `PASSMAP Selection Importer`
3. `PASSMAP Experience Capture Helper`

권장: **한국어 1번 + 영어 1번** 의 다국어 listing 구성.

---

## 2. 한 줄 설명 (Short description, 132자 제한)

ChatGPT, Gemini, Claude 같은 브랜드명을 listing에 그대로 쓸 때는 "공식 제휴가 아님" 이 자명해야 합니다. 아래 후보는 모두 그 점을 의식해 작성했습니다.

### 한국어 후보
1. **`드래그해서 선택한 텍스트만 패스맵으로 보냅니다. 전체 대화를 자동 수집하지 않습니다.`** (61자)
2. `AI 대화에서 마음에 드는 부분만 골라 패스맵 경험 기록 화면으로 한 번에 보내는 도구입니다.` (51자)
3. `선택한 텍스트만 안전하게 PASSMAP의 경험 후보 입력창으로 전달합니다.` (39자)

### 영어 후보
1. **`Send only the text you select to PASSMAP. No auto-scraping of chat history.`** (78자)
2. `One-click bring your selected AI conversation snippet into the PASSMAP experience capture flow.`

---

## 3. 상세 설명 (Detailed description) 초안

> 아래 본문은 한국어 listing 기준 초안입니다. 영어 listing은 별도로 번역 후 등록.

```
패스맵 선택 텍스트 보내기는 ChatGPT, Gemini, Claude, 또는 어떤 웹페이지에서든
사용자가 직접 드래그해 선택한 텍스트를 패스맵의 "AI 대화에서 경험 찾기"
입력창으로 한 번에 보내주는 작은 확장입니다.

[ 이 확장이 하는 일 ]
- 우클릭 메뉴 "패스맵에서 경험 찾기" 추가
- 드래그한 텍스트를 패스맵 새 탭으로 전달
- 30자 미만 선택은 무시 / 50,000자 초과는 잘라냄
- 패스맵 도메인의 sessionStorage 로만 전달, 외부 서버 송신 없음

[ 이 확장이 하지 않는 일 ]
- ChatGPT / Gemini / Claude 의 전체 대화를 자동 수집하지 않습니다.
- DOM 파싱, 키 입력 캡처, 화면 캡처를 하지 않습니다.
- 쿠키, 로그인 세션, 비밀번호에 접근하지 않습니다.
- 브라우징 기록, 방문 사이트, 즐겨찾기를 읽지 않습니다.
- 별도의 외부 서버로 데이터를 전송하지 않습니다.

[ 사용 흐름 ]
1) AI 대화 또는 임의 웹페이지에서 보내고 싶은 부분을 드래그
2) 우클릭 → "패스맵에서 경험 찾기"
3) 새 탭이 열리고 패스맵 경험 기록 화면으로 자동 진입
4) 입력창에 텍스트가 채워진 상태에서 사용자가 직접 [AI로 경험 정리하기] 클릭

[ 권한 사용 이유 ]
- contextMenus : 우클릭 메뉴 추가
- storage      : 새 탭으로 텍스트 넘기는 임시 저장소
- tabs         : 패스맵 도메인을 새 탭으로 열기
- host_permissions(reject-analyzer.vercel.app) : 패스맵 도메인에서만 동작

[ 안전한 사용을 위한 안내 ]
민감 정보(주민등록번호, 결제 정보, 비밀번호, 미공개 인사 정보 등) 가 포함된
부분은 드래그 전에 제외해 주세요. 패스맵으로 보낸 텍스트는 사용자가 직접
삭제하기 전까지 남아 있을 수 있습니다.

[ 공식 안내 ]
ChatGPT, Gemini, Claude 는 각 회사의 상표이며, 본 확장은 해당 회사와
공식 제휴 관계가 아닙니다. 본 확장은 사용자가 선택한 텍스트만을
전달하는 일반 도우미 도구입니다.

[ 개인정보처리방침 ]
https://reject-analyzer.vercel.app/  (해당 페이지 또는 별도 공개 URL 에서 확인)
```

---

## 4. 카테고리 후보

Chrome Web Store 카테고리 중에서 적합한 후보:

| 카테고리 | 추천도 | 이유 |
|---|---|---|
| **Productivity** | ★★★ | 가장 적합. 사용자의 작업 흐름을 효율화하는 도구 성격 |
| Workflow & Planning Tools | ★★ | 신규 분류가 있다면 후보. 경험 기록/이력 관리 흐름과 잘 맞음 |
| Developer Tools | ★ | PASSMAP이 개발자 전용 도구가 아니므로 부적합 |
| Communication | ★ | 채팅 자동 수집이 아니므로 오히려 오해 소지 있음 |

권장: **Productivity** 단일 선택.

---

## 5. 권한 설명 (Permission justification)

스토어 심사 단계에서 권한별 사유를 요구합니다. 그대로 사용 가능한 영문 / 한글 초안:

### contextMenus
- 영문: `Required to add the right-click menu item "Send selection to PASSMAP".`
- 한글: `우클릭 컨텍스트 메뉴에 "패스맵에서 경험 찾기" 항목을 추가하기 위해 필요합니다.`

### storage
- 영문: `Used as a one-shot in-browser bridge (chrome.storage.local) to pass the selected text into the PASSMAP tab. No external network transmission.`
- 한글: `선택한 텍스트를 새로 여는 PASSMAP 탭으로 안전하게 넘기기 위한 브라우저 내부 일회용 저장소(chrome.storage.local)로 사용합니다. 외부 서버 전송 아닙니다.`

### tabs
- 영문: `Required to open the PASSMAP domain in a new tab after the user clicks the context menu. The extension does not read URLs or content of other tabs.`
- 한글: `사용자가 컨텍스트 메뉴를 클릭한 뒤 PASSMAP 도메인을 새 탭으로 열기 위해 필요합니다. 다른 탭의 URL이나 내용을 읽지 않습니다.`

### host_permissions (`https://reject-analyzer.vercel.app/*`)
- 영문: `Restricts the content script to the PASSMAP production domain only, where it writes the user-selected text into sessionStorage so the PASSMAP web app can consume it.`
- 한글: `PASSMAP 운영 도메인에서만 content script가 동작하도록 제한합니다. 그 도메인의 sessionStorage 에 사용자가 선택한 텍스트를 전달하는 용도입니다.`

### Remote code use
- 사용 안 함. 확장은 정적 파일(manifest.json, background.js, content-passmap.js) 만 포함합니다.
- 영문: `No remote code. All scripts are bundled in the package.`

---

## 6. 개인정보 처리 설명 (Single purpose & data usage)

### Single purpose
- 영문: `Forward the text that the user explicitly selected on any webpage into the PASSMAP experience-capture intake form.`
- 한글: `사용자가 웹페이지에서 직접 선택한 텍스트를 패스맵 경험 기록 입력창으로 전달하는 한 가지 목적입니다.`

### Data usage disclosures (Chrome Web Store data form 기준)
- Personally identifiable information: **No** (only the text the user actively selects)
- Health information: **No**
- Financial information: **No**
- Authentication information: **No**
- Personal communications: **No** (extension does not auto-collect chat content)
- Location: **No**
- Web history: **No**
- User activity: **No** (no clicks/keystrokes captured beyond the context-menu invocation)
- Website content: **Limited** — only the text segment the user explicitly highlights and chooses to send

### Use of data
- **Not** sold to third parties.
- **Not** used for advertising.
- **Not** used to determine creditworthiness or for lending purposes.

### Encryption / storage
- 데이터는 사용자 브라우저 안에서만 이동합니다. 외부 송신 없음.
- 사용자가 PASSMAP 웹앱에서 직접 저장 버튼을 눌렀을 때에야 패스맵 서버로 저장됩니다. (이는 확장의 동작이 아닌 패스맵 본체의 별도 동작이며 별도 약관을 따릅니다.)

---

## 7. 심사자 테스트 안내 (Reviewer notes)

심사자가 30초 안에 확장을 검증할 수 있도록 안내합니다.

```
1. 임의의 웹페이지(예: https://example.com 또는 ChatGPT 페이지)를 엽니다.
2. 본문에서 30자 이상의 텍스트를 드래그로 선택합니다.
3. 우클릭하여 "패스맵에서 경험 찾기" 메뉴를 클릭합니다.
4. 새 탭으로 https://reject-analyzer.vercel.app/ 가 열립니다.
5. 자동으로 "경험 기록하기 1/2" 화면으로 진입하고,
   AI 대화 탭에 선택한 텍스트가 채워진 것을 확인할 수 있습니다.

테스트용 텍스트 예시 (60자):
"오늘 회의에서 결제 결제율 개선 안건을 정리하고 다음 주 발표를 준비했다."

확인 포인트:
- 새 탭의 sessionStorage 에 PASSMAP_EXTERNAL_INTAKE 키가 한 번 기록됨
- chrome.storage.local 의 PASSMAP_EXTERNAL_INTAKE_BRIDGE 키는 즉시 삭제됨
- 외부 네트워크 호출 없음 (DevTools Network 탭에서 확인 가능)
```

---

## 8. 스크린샷 구성안

Chrome Web Store는 1280x800 또는 640x400 PNG/JPG 최소 1장을 요구합니다. 권장은 3~5장.

### 구성 제안

1. **Screenshot 1 — 우클릭 메뉴 캡처**
   - ChatGPT/Claude 페이지에서 텍스트를 선택하고 우클릭한 상태
   - 컨텍스트 메뉴에서 `패스맵에서 경험 찾기` 항목이 강조된 모습
   - 캡션: "선택한 텍스트만 보냅니다"

2. **Screenshot 2 — 자동 입력된 패스맵 화면**
   - 새 탭으로 열린 PASSMAP "경험 기록하기 1/2" 화면
   - AI 대화 탭이 활성화되어 있고 입력창에 텍스트가 채워진 상태
   - 캡션: "한 번에 경험 기록 화면으로"

3. **Screenshot 3 — 사용자 확인 단계**
   - `AI로 경험 정리하기` 버튼이 보이는 상태 (자동 실행 아님을 강조)
   - 캡션: "분석은 사용자가 직접 시작합니다"

4. **Screenshot 4 — 권한 최소화 안내 (정보용)**
   - manifest에서 요청하는 권한 목록을 가독성 좋게 정리한 인포그래픽 스타일
   - 캡션: "필요한 최소 권한만"

5. **Screenshot 5 — 수집하지 않는 데이터 (정보용)**
   - "전체 대화 자동 수집 안 함", "쿠키/비밀번호 접근 없음" 등 비수집 항목 리스트
   - 캡션: "수집하지 않는 것들"

권장: 1, 2, 3번은 실제 화면 캡처. 4, 5번은 디자인 인포그래픽이 준비되면 추가.

---

## 9. 프로모션 타일

| 항목 | 크기 | 필수 / 선택 |
|---|---|---|
| Small promotional tile | 440x280 | 필수 (스토어 검색 결과 노출) |
| Marquee promotional tile | 1400x560 | 선택 (피처드 후보가 될 때만) |

타일에는 확장 로고 + 한 줄 캐치프레이즈를 배치. 캐치프레이즈 후보:
- `선택한 만큼만 보냅니다`
- `Drag. Right-click. Done.`

---

## 10. 공개 범위 (Visibility) 추천

1. **1차: Unlisted (링크 보유자 전용)**
   - 내부 검증 / 베타 사용자에게만 링크 공유
   - 검색 결과 노출 안 됨
   - 권한 표현, 자동 채움 동작, sessionStorage 동작에 실제 사용자 피드백 수렴 목적

2. **2차: Public (전체 공개)**
   - 1차에서 문제 없음을 확인한 뒤 전환
   - 카테고리 검색 / 외부 검색 노출 시작
   - 동시에 다국어 listing(영어) 추가 검토

3. **별도 정책**
   - `Group publish` 형태로 다국어 listing을 분리 등록할지, 단일 listing 안에 번역만 추가할지는 등록 직전에 다시 결정.

---

## 11. 미준비 항목 (사람이 처리해야 할 일)

| 항목 | 상태 | 비고 |
|---|---|---|
| 아이콘 16/32/48/128 PNG | 미준비 | 디자인 확정 후 `icons/` 폴더에 배치, `manifest.json` 에 `icons` 항목 추가 |
| 스크린샷 1280x800 (3~5장) | 미준비 | 실제 화면 캡처 + 인포그래픽 |
| 440x280 프로모션 타일 | 미준비 | 디자인 필요 |
| 개인정보처리방침 공개 URL | 미준비 | 본 저장소의 `docs/passmap-extension-privacy-policy-draft.md` 를 패스맵 사이트의 정적 페이지로 배포 또는 별도 호스팅 필요 |
| Chrome 개발자 계정 등록비 (USD 5) | 미준비 | 실제 등록 시 결제 |
| 다국어 listing(영어) | 선택 | 1차 한국어 단일로도 가능 |

---

## 12. 본 문서 사용 흐름 (운영 메모)

1. 사용자(운영자)가 본 문서를 검토하고 최종 문구 확정.
2. 아이콘 / 스크린샷 / 프로모션 타일 디자인 작업.
3. `PACKAGE_FOR_STORE.md` 절차로 zip 생성.
4. Chrome 개발자 대시보드에 신규 항목 등록 + 본 listing 적용.
5. Unlisted 로 1차 등록 → 내부 검증 → Public 전환.

> 본 문서는 초안입니다. 등록 직전 시점의 manifest 버전, 권한 구성, 정책 변경을 반영해 다시 한 번 검토하세요.
