# PASSMAP Dev Reference

> 역할: PASSMAP 작업 범위가 크거나 불명확할 때 참고하는 개발 문서 진입점. 모든 작업에서 무조건 먼저 읽는 문서는 아니며, 작업 유형에 따라 필요한 문서만 선별적으로 확인한다. (단순 UI 패치·명확한 anchor 수정·소규모 copy patch는 생략 가능)
> 원칙: 모든 정보를 한 문서에 몰아넣지 않고, 목적별 문서로 나누어 관리한다.
> 작성일: 2026-04-29

---

## 1. 문서 목적

이 문서는 PASSMAP 코드베이스에서 작업하기 전에 참고해야 할 핵심 문서의 진입점이다.
작업 유형에 따라 어떤 문서를 먼저 읽어야 하는지를 안내하고, Claude/Codex의 작업 전 공통 규칙을 정리한다.

모든 세부 정보를 한 파일에 축적하지 않는다. 각 문서는 하나의 역할만 담당한다.

**이 문서(DEV_REFERENCE)를 읽는 시점:** 큰 구조 변경, 신규 기능 설계, 외부 개발자 인수인계, 작업 범위가 불명확할 때. 단순 UI 패치나 특정 파일 anchor 수정 시에는 생략 가능하다.

---

## 2. 문서 참조 원칙

- Claude/Codex는 **모든 PASSMAP 문서를 매번 읽지 않는다.**
- 작업 유형에 따라 필요한 문서만 선별적으로 읽는다. (상세 기준: 섹션 5)
- 사용자 정리 메모와 기존 문서는 참고용이며, 최신이 아닐 수 있으므로 **현재 코드/문서 기준으로 재확인한다.**
- 문서를 읽는 것이 코드 탐색보다 빠르거나 안전한 경우에만 먼저 읽는다.
- **단순 UI 문구 수정, 작은 copy patch, 특정 파일의 명확한 anchor 수정은 관련 문서 확인을 생략할 수 있다.**
- 큰 구조 변경, 신규 기능 설계, 데이터 흐름 변경, DB/API 변경, 위험 파일 수정은 관련 문서 확인이 필요하다.

---

## 3. 문서별 역할

| 문서 | 역할 | 언제 읽는지 | 업데이트 기준 |
|---|---|---|---|
| `docs/PASSMAP_DEV_REFERENCE.md` | 전체 진입점 인덱스 | 큰 구조 변경/신규 기능 설계/인수인계/작업 범위 불명확 시 (단순 패치 시 생략 가능) | 문서 구조 변경 시 |
| `docs/PASSMAP_SOURCE_MAP.md` | 기능별 owner 파일 지도 (12개 기능, primary/secondary/위험도) | 수정 대상 파일 찾을 때 | owner 파일 추가/변경 시 |
| `docs/PASSMAP_DATA_FLOW_MAP.md` | 기능별 입력 → 처리 → 저장 → 표시 흐름 | 데이터 흐름·상태 연결 구조 파악 시 | 흐름 owner 변경 시 |
| `docs/PASSMAP_BACKEND_API_DB_MAP.md` | Supabase 테이블, Worker API 엔드포인트, env 의존성 | DB/API/env 수정 또는 진단 시 | 엔드포인트·테이블·env 변경 시 |
| `docs/PASSMAP_HIGH_RISK_FILES.md` | 위험 파일 목록, 안전한/피해야 할 수정 방식, anchor | 고위험 파일 수정 전 | 위험도 판단 변경 시 |
| `docs/COMM_PATCH_NOTES.md` | 작업 이력 append-only 기록 | 최근 변경 파악, 작업 후 기록 | 작업 완료 시마다 |

---

## 4. Claude/Codex 작업 전 공통 규칙

- **사용자 메모는 참고용이다.** 최신 코드 기준으로 반드시 재확인하고 확정 전에 코드에서 anchor를 직접 검색한다.
- **런타임 코드 수정 전** SOURCE_MAP에서 owner 파일을 확인하고, DATA_FLOW_MAP에서 연결 구조를 파악한 뒤 최소 범위 패치를 수행한다.
- **App.jsx 대량 수정 금지.** 하위 owner 파일에서 처리할 수 있는 변경은 하위 파일에서 처리한다.
- **분석 점수/로직 수정은 국소 수정 원칙.** 축 전체를 건드리지 말고 해당 builder 파일의 해당 섹션만 수정한다.
- **Supabase SQL은 실행 전 반드시 사용자 확인.** 이 문서에서 직접 SQL 실행 금지.
- **Worker/API 라우팅 변경은 별도 라운드로 분리.** worker-ai 수정은 반드시 사용자 확인 후 단독 작업으로 진행한다.
- **Korean markdown 파일 인코딩 안전 규칙 준수.** shell redirection/Out-File/stdout capture 사용 금지. 저장 후 한글 샘플 postcheck 필수.
- **빌드 확인은 사용자가 직접 수행한다.** Claude/Codex는 빌드 실행이나 빌드 성공 여부를 판단하지 않는다.

---

## 5. 작업 유형별 최소 참고 문서

> 표에 없는 작업 유형은 가장 유사한 유형을 참고하거나 DEV_REFERENCE 섹션 3을 기준으로 판단한다.

| 작업 유형 | 먼저 확인할 문서 | 생략 가능한 문서 | 비고 |
|---|---|---|---|
| UI 문구/라벨 마이크로 패치 | (없음 — 해당 파일 직접 anchor 검색) | 전부 생략 가능 | owner 파일이 명확하면 문서 없이 진행 |
| 특정 컴포넌트 UI 수정 | SOURCE_MAP (owner 불명 시만) | DATA_FLOW_MAP, BACKEND_API_DB_MAP | 해당 파일의 anchor만 확인 |
| 직무·산업 분석 로직 수정 | SOURCE_MAP → DATA_FLOW_MAP → HIGH_RISK_FILES | BACKEND_API_DB_MAP | buildNewgradAxisPack.js, buildTransitionLiteResult.js 집중 확인 |
| 서류탈락 원인 분석 수정 | SOURCE_MAP → HIGH_RISK_FILES | DATA_FLOW_MAP, BACKEND_API_DB_MAP | analyzer.js, decision/index.js, PreciseAnalysisFlow.jsx 집중 확인 |
| 업무 기록/캘린더 수정 | SOURCE_MAP → DATA_FLOW_MAP → BACKEND_API_DB_MAP | HIGH_RISK_FILES (위험 파일 미포함 시) | adapter shape 두 군데(PmMvpView, HomeDashboard) 동시 점검 |
| 이력서 업데이트 후보 수정 | SOURCE_MAP → DATA_FLOW_MAP | BACKEND_API_DB_MAP, HIGH_RISK_FILES | recordToResumeCandidate.js UI consumer 현재 미연결 상태 |
| Notion 연동 수정 | BACKEND_API_DB_MAP → HIGH_RISK_FILES | DATA_FLOW_MAP (섹션 6 이미 정리됨) | Worker URL env 필수 확인. Vercel fallback 없음 주의 |
| Calendar 연동 수정 | BACKEND_API_DB_MAP → SOURCE_MAP | DATA_FLOW_MAP | Google Calendar OAuth/sync 설계는 `docs/PASSMAP_CALENDAR_SYNC_PLAN.md` 참조 (섹션 8) |
| Supabase/Auth 수정 | BACKEND_API_DB_MAP → HIGH_RISK_FILES | SOURCE_MAP (owner 명확 시) | SQL 실행 전 사용자 확인 필수 |
| Worker/API/env 수정 | BACKEND_API_DB_MAP → HIGH_RISK_FILES | SOURCE_MAP | 별도 라운드로 분리. 사용자 확인 후 진행 |
| App.jsx 수정 | HIGH_RISK_FILES → SOURCE_MAP | DATA_FLOW_MAP (흐름 변경 없는 경우) | 전역 상태 집중. 하위 owner 파일로 먼저 처리할 것 |
| 신규 기능 설계 | DEV_REFERENCE → SOURCE_MAP → DATA_FLOW_MAP → BACKEND_API_DB_MAP | — | 전체 구조 파악 후 설계. 빌드 실행 금지 |
| 외부 개발자 인수인계 | DEV_REFERENCE → SOURCE_MAP → HIGH_RISK_FILES | — | 이 문서가 가장 유용한 진입점 |
| 문서 정리 작업 | 해당 문서 상단 확인 (전체 정독 불필요) | 코드 파일 전부 | 코드 파일 깊게 읽지 않음 |
| PDF/print export 수정 | SOURCE_MAP → DATA_FLOW_MAP | BACKEND_API_DB_MAP | pdf/ 하위 파일 분리됨. window.print()는 두 파일에 분산 |

---

## 6. Claude/Codex 프롬프트 공통 문구

아래 문구를 프롬프트 앞부분에 포함하면 불필요한 문서 전체 읽기를 줄일 수 있다.

```
모든 PASSMAP 문서를 매번 읽지 마세요.
이번 작업과 직접 관련 있는 문서만 선별적으로 확인하세요.
사용자 정리 메모와 기존 문서는 참고용이며 최신이 아닐 수 있으므로,
현재 코드/문서 기준으로 재확인하세요.
단순 UI 문구 수정이나 특정 파일 anchor 수정은 문서 확인을 생략할 수 있습니다.
작업 유형별 최소 참고 문서 기준: docs/PASSMAP_DEV_REFERENCE.md 섹션 5 참조.
```

---

## 7. 현재 가장 주의할 영역 (요약)

상세 설명은 `docs/PASSMAP_HIGH_RISK_FILES.md` 참조.

- **App.jsx** — 전역 상태(auth/routing/result/PM bridge) 집중. 10,000줄 이상. 대량 수정 금지.
- **buildNewgradAxisPack.js** — 신입 5축 점수·설명·비교 block을 동시에 생산. 한 축 수정 시 세 군데 연동.
- **buildTransitionLiteResult.js / buildNewgradTransitionLiteResult.js** — 경력자/신입 분석 VM 생성 핵심. 계약 파일.
- **TransitionLiteResult.jsx** — 경력자/신입 공용 렌더러. 분기와 하위 섹션 다수.
- **PreciseAnalysisFlow.jsx** — 서류탈락 입력/결과 consumer. riskResults 두 경로 모두 소비.
- **HomeDashboard.jsx** — Notion 연동 상태, auth, mock, 이벤트 구독, 캘린더 요약이 혼재.
- **recordToResumeCandidate.js** — UI consumer 미연결. 계약 파일만 존재. 연결 전 shape 먼저 확인 필요.
- **worker-ai/orange-shadow-95c1/src/index.js** — 모든 Notion API + enhance/parse 라우팅. 변경 시 별도 라운드.

---

## 8. 전문/위성 문서

핵심 6문서 체계 외에, 특정 기능 전담 작업 때만 참고하는 전문 문서 목록.
일반 UI 수정이나 데이터 흐름 패치에서는 읽지 않아도 된다.

| 문서 | 역할 | 읽는 시점 |
|---|---|---|
| `docs/PASSMAP_CALENDAR_SYNC_PLAN.md` | Google Calendar 자동 동기화/OAuth 설계, CAL 라운드별 계약 | Calendar 자동동기화 구현·설계 때만. 업무 기록 캘린더 표시(ICS 다운로드) 수정 시에는 불필요 |
