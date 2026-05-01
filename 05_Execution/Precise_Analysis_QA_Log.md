# Precise Analysis QA 검수 로그

## 문서 목적

이 문서는 preciseAnalysis MVP의 **공유/복원 동작 검수 기록**을 저장하는 전용 QA 로그다.  
엔진 정확도 테스트(Extraction / Engine / Composite / Regression)와 별도 트랙으로 관리한다.

이번 라운드는 코드 수정이 아니라 검수 기록 분리와 재검수 조건 명시가 목적이다.

---

## QA 트랙 분리 원칙

| 트랙 | 대상 | 관리 위치 |
|---|---|---|
| Extraction / Engine / Composite / Regression | 제품 로직 정확도 테스트 | `Precise_Analysis_Test_Catalog.md` |
| Share / Restore / E2E / Round-trip | 배포/복원/공유 동작 검수 | `Precise_Analysis_QA_Log.md` (이 문서) |

공유/복원 E2E 검수는 gold set 본체에 포함하지 않는다.  
소스 계약 검수와 브라우저 E2E 검수는 별도 판정으로 기록한다.

---

## 공유/복원 검수 라운드 (2026-04-12) — SAFE QA CHECK / PRECISE SHARE RESTORE VERIFICATION / NO PATCH

### 이번 라운드 분류

```
SAFE QA CHECK / PRECISE SHARE RESTORE VERIFICATION / NO PATCH
```

### 검수 범위

- 정밀 분석 결과 리포트 공유 링크 복원 동작
- 기존 `transition-lite` 공유 링크 회귀 여부
- 공유 복원 후 정밀 분석 화면의 CTA 3종 / `공유하기` 버튼 포함 여부
- 공유 패널의 정밀 분석 전용 copy source 연결 여부

---

### 시나리오 A — 정밀 분석 공유 복원

**ID: QA-SHARE-PRECISE-RESTORE-001**

| 항목 | 내용 |
|---|---|
| 목적 | 정밀 분석 결과 화면 공유 링크를 새 브라우저 컨텍스트에서 복원 |
| 단계 | 1. JOB 탭에서 정밀 분석 진입 → 2. `[이 JD에서 내 이력서가 왜 걸리는지 확인하기]` 플로우로 결과 화면 도달 → 3. `공유하기` 클릭 → 4. 링크 복사 → 5. 새 브라우저 컨텍스트에서 링크 열기 → 6. 정밀 분석 결과 화면 복원 여부 확인 |
| 소스 기준 결과 | PASS |
| 브라우저 E2E 결과 | **FAIL** |
| 실패 사유 | Edge headless remote debugging 포트(`http://127.0.0.1:9222/json/version`)가 열리지 않아 새 브라우저 컨텍스트 열기까지 재현하지 못했음 |
| 재검수 필요 여부 | 예 |

---

### 시나리오 B — 기존 transition-lite 공유 회귀 확인

**ID: QA-SHARE-TL-REGRESSION-001**

| 항목 | 내용 |
|---|---|
| 목적 | 기존 `transition-lite` 공유 링크의 새 브라우저 컨텍스트 복원이 회귀 없이 유지되는지 확인 |
| 단계 | 1. 기존 `transition-lite` 결과 화면 열기 → 2. `공유하기` 클릭 → 3. 링크 복사 → 4. 새 브라우저 컨텍스트에서 열기 → 5. 기존 결과 화면 그대로 복원되는지 확인 |
| 소스 기준 결과 | PASS (src/App.jsx:8699 기존 분기 확인) |
| 브라우저 E2E 결과 | **FAIL** |
| 실패 사유 | 시나리오 A와 동일하게 실제 브라우저 기반 E2E를 끝까지 재현하지 못했음 |
| 재검수 필요 여부 | 예 |

---

### 시나리오 C — 공유 패널 기능 확인

**ID: QA-SHARE-PANEL-PRECISE-001**

| 항목 | 내용 |
|---|---|
| 목적 | 정밀 분석 결과 화면에서 공유 패널 열기 / 카카오 공유 / 링크 복사 / 네이티브 공유 노출 / 정밀 분석 전용 copy 문구 사용 여부 확인 |
| 소스 기준 결과 | **PASS** |
| 브라우저 E2E 결과 | **FAIL** |
| 실패 사유 | 실제 UI 노출은 브라우저 자동화 미완료로 확인 불가 |
| 재검수 필요 여부 | 브라우저 노출 확인 한정 |

---

### 시나리오 D — SID 저장소 round-trip 확인

**ID: QA-SHARE-SID-ROUNDTRIP-001**

| 항목 | 내용 |
|---|---|
| 목적 | 공유 링크 생성 후 실제 SID 저장소 왕복을 거쳐 복원되는지 실서버 round-trip 검수 |
| 결과 | **FAIL** |
| 실패 사유 | share API 대상 네트워크 호출이 `EACCES`로 차단되어 실제 round-trip 확인 불가 |
| 재검수 필요 여부 | 예 — 외부 네트워크 허용 환경 필요 |

---

### PASS 항목 (소스 기준)

정밀 분석 share payload / restore 분기 / CTA 3종 / 공유 버튼 마크업은 소스 기준으로 연결이 확인됐다.

| 위치 | 확인 내용 |
|---|---|
| `src/App.jsx:3344` | `buildSharePackV1(a)`가 share pack에 `preciseAnalysis` payload 포함 |
| `src/App.jsx:3447` 부근 | share payload 구성에 `preciseAnalysis` 포함 |
| `src/App.jsx:3537` | `getCurrentShareCopySet(shareUrl = "")`에 정밀 분석 전용 문구 분기 존재 |
| `src/App.jsx:3556` 부근 | 정밀 분석 share title `PASSMAP 서류 탈락 원인 분석 결과`로 연결 |
| `src/App.jsx:3559` 부근 | 정밀 분석 `nativeText` 연결 확인 |
| `src/App.jsx:3561` 부근 | 정밀 분석 `copyText` 분기 존재 |
| `src/App.jsx:3575` | `getCurrentShareSource()`가 현재 화면 기준 share source 선택 owner로 유지 |
| `src/App.jsx:8543` | `if (shareMode \|\| sharePayload)` 내부에 share restore 전용 분기 유지 |
| `src/App.jsx:8551` 부근 | `const __sharePreciseAnalysis = ...` 분기 존재 |
| `src/App.jsx:8686` | `__sharePreciseAnalysis` 있을 때 `<PreciseAnalysisFlow mode="result" ... />` 렌더 |
| `src/App.jsx:8699` | 기존 `<TransitionLiteResult ... />` 복원 분기 유지 |
| `src/components/input/PreciseAnalysisFlow.jsx:214` | 정밀 분석 결과 화면 owner로 유지 |
| `src/components/input/PreciseAnalysisFlow.jsx:431, :453, :476` | CTA 3종 카드 라벨 `QUICK CHECK`, `EMERGENCY`, `MASTER CLASS` 존재 |
| `src/components/input/PreciseAnalysisFlow.jsx:507` 부근 | `공유하기` 버튼 마크업 존재 |
| 빌드 | `cmd /c npm run -s build` 성공 |

---

### FAIL 항목 (브라우저 E2E 기준)

소스 기준 PASS와 브라우저 E2E FAIL을 분리 기록해야 다음 검수자가 같은 시도를 중복하지 않는다.

- FAIL: 정밀 분석 공유 링크를 실제로 새 브라우저 컨텍스트에서 열어 최종 화면까지 확인하는 E2E 검수
- FAIL: 기존 `transition-lite` 공유 링크의 실제 새 브라우저 컨텍스트 복원 E2E 검수
- FAIL: 정밀 분석 공유 패널에서 카카오 공유 / 링크 복사 / 네이티브 공유 버튼이 실제 UI에 노출되는지의 브라우저 실검수
- FAIL: 공유 링크 생성 후 실제 SID 저장소 왕복을 거쳐 복원되는지의 실서버 round-trip 검수

---

### 실패 증상 (정확한 기록)

- 브라우저 자동화 시도에서 Edge는 실행됐지만 remote debugging endpoint `http://127.0.0.1:9222/json/version`가 끝내 열리지 않았음
- `공유하기 클릭 → 링크 생성 → 새 컨텍스트 링크 열기 → 복원 화면 확인` 시나리오를 브라우저에서 끝까지 실행하지 못했음
- 로컬 정적 서버를 단일 검수 스크립트와 함께 붙여 실행하려 했지만, 이 환경에서는 장시간 유지되는 브라우저+서버 E2E 오케스트레이션이 안정적으로 성립하지 않았음
- Node 기반 직접 API 검증으로 우회하려 했지만, share API 대상 네트워크 호출이 `EACCES`로 차단되어 실제 SID round-trip도 확인하지 못했음

---

### 원인 추정

공유/복원 FAIL은 기능 실패 확정이 아니라, 현재 환경에서 E2E 완주가 불가능했던 결과다.

- 기능 자체의 실패가 확인된 것이 아니라, 현재 검수 환경에서 실제 브라우저 자동화와 외부 네트워크 검증이 모두 제한된 것이 직접 원인임
- 이번 라운드에서 확정 가능한 범위:
  - share pack에 정밀 분석 payload가 들어가는지 → **PASS**
  - restore 분기가 정밀 분석 결과 화면을 타도록 코드가 연결됐는지 → **PASS**
  - 기존 `transition-lite` 분기가 소스 상 유지되는지 → **PASS**
  - 결과 화면에 CTA 3종 / `공유하기` 버튼 마크업이 남아 있는지 → **PASS**

---

### 코드 패치 필요 여부

- **미확정**
- 소스 기준으로는 정밀 분석 share payload와 restore 분기가 연결되어 있고, 빌드도 통과했음
- 하지만 실제 브라우저/실서버 round-trip 검수는 완료되지 않았으므로, 최종 PASS 판정은 아직 불가함

---

### 다음 재검수 조건

이번 FAIL은 기능 실패 확정이 아니라 환경 제약으로 인한 미완료 검수다.  
브라우저 remote debugging 및 외부 네트워크가 가능한 환경에서 동일 시나리오를 다시 수행해야 최종 PASS/FAIL을 닫을 수 있다.

최종 PASS 판정은 실제 브라우저 새 컨텍스트 복원과 SID round-trip 검수가 가능한 환경에서 다시 닫아야 한다.

재검수 시 수행할 시나리오:

1. 정밀 분석 결과 화면에서 `공유하기` 클릭
2. 링크 복사
3. 완전히 새 브라우저 컨텍스트에서 링크 열기
4. `PreciseAnalysisFlow mode="result"` 기반 화면, CTA 3종, `공유하기` 버튼 노출 여부 확인
5. 기존 `transition-lite` 공유 링크도 동일 방식으로 회귀 확인

재검수 조건이 충족되지 않으면 동일 검수를 중복 실행한 것으로 간주하지 않는다.

---

## 문서 이력

| 날짜 | 내용 |
|---|---|
| 2026-04-12 | 공유/복원 검수 기록 분리 라운드 — 초안 생성, NO PATCH |

## ROUND2 QA — 2026-04-13

### QA 요약
- ROUND1 alias bridge 실제 코드 반영 확인 (keyword: TOOL_ALIASES + cert, must: cert only)
- ROUND2 변경 내용:
  1. keyword raw에 aliasMatchedKeywords 필드 추가
  2. must evidence에 cert alias 보정 문구 추가
  3. keyword evidence aliasMatched 분기 문구 강산.md 원문 적용
- 판정 본체(severity 계산, triggered 조건) 변경 없음
- false positive 방어 유지: TASK_ALIASES 미포함, must는 cert only
- UI 구조 변경 없음, composite 변경 없음
- raw 필드 추가는 consumer 필수 수정 없는 수준

### 회귀 항목
- exact match 유지: 추가 조건 없이 coverageNorm.includes(kw) 우선
- severity 정책 유지: ratio 기준, booster signal 조건 그대로
- insufficient-data 분기 유지: domainKeywordCount === 0 케이스 그대로
- composite/top3 정렬 정책 변경 없음

## ROUND3 QA — 2026-04-13: read-path explanation hardening

### 변경 내역
- buildJdKeywordCoverageGapRisk.js: aliasMatched > 0 / = 0 분기별 evidence 문구 강화
- buildMustRequirementsGapRisk.js: triggered 조건 하 certAliasResolvedItems 분기 evidence 문구 강화
- consumer(PreciseAnalysisFlow.jsx) 변경 없음

### 확인
- 엔진 판정 본체(severity, triggered, coverage ratio) 변경 없음
- evidence[] → evidenceItems 렌더링 경로 기존 그대로
- 문구는 강산.md 지시 원문 그대로 적용
- SSOT 원칙: builder 계층에서 조립, consumer는 read-only
- 일반 업무 표현 보수적 잠금 유지

## ROUND4 QA — 2026-04-13: precision trap hardening

### 변경 내역
- buildJdKeywordCoverageGapRisk.js 1파일 수정
- _PT_BOUNDARY, _PT_ALIAS_BLOCK 상수 추가
- _leftBoundaryMatch() helper 추가
- _tryAliasMatch() 내부 ptBlock 체크 추가
- match 루프 includes() → _leftBoundaryMatch() 교체

### 확인
- severity/triggered/ratio 계산 변경 없음 (match 판정만 정확해짐)
- alias bridge 기존 동작 유지 (sql 계열만 ptBlock 적용)
- composite/top3 변경 없음
- UI 구조 변경 없음
- ROUND3 evidence 문구 변경 없음
- 원칙: recall 저하보다 precision trap 축소가 우선 (sql 단독 표현은 정상 매칭 유지)

## ROUND5 QA — 2026-04-13: short-keyword precision pack (ga/bi/hr)

### 변경 내역
- buildJdKeywordCoverageGapRisk.js 1파일, 1줄 수정
- _PT_BOUNDARY = new Set(["sql", "ga", "bi", "hr"])
- _PT_ALIAS_BLOCK 변경 없음 (ga/bi/hr는 TOOL_ALIASES 미포함)

### 확인
- severity/triggered/ratio 계산 변경 없음
- alias bridge 기존 동작 유지
- composite/top3 변경 없음
- UI 구조 변경 없음
- broad matcher rewrite 없음
- 실제 위험이 확인된 3개만 추가, 일괄 strict 처리 아님

## ROUND6 QA — 2026-04-13: user-scenario QA pack

### 검수 결과
- SC-01~04: PASS (alias 보정, cert 보수 판정, precision trap 방어 모두 납득)
- SC-05: BORDERLINE (backlog — 한/영 업무 표현 브리지 미구현)
- SC-06: FAIL/backlog (서술형 기간, 한/영 표현 브리지 범위 밖)

### 즉시 수정
- 없음. 코드 변경 불필요.

### 총평
- keyword/must 엔진이 tool/cert 중심 JD에서 사용자 납득 수준 도달
- precision trap 방어(sql/ga/bi/hr) 실전 확인 완료
- 남은 한계는 engine 문제가 아니라 policy/backlog 문제
- 다음 라운드 후보: TOOL_ALIASES Tableau 등 확장 or 한/영 업무 표현 브리지 설계


## ROUND7 QA (2026-04-13): real-case packet usability review

### 라운드 성격
- ROUND7은 실제 업로드 사례를 resume-style packet으로 재구성한 QA 라운드였다.
- 메인 케이스는 김나래 / 에실로 Sales Representative / 연구직 -> GTA·CRA 전환 3건이다.
- weak pair는 qualitative 참고용으로만 분리했다.
- 이번 라운드는 엔진 확장이 아니라 사용자 노출 가능성 검수 라운드다.
- docs/끄적.md는 상위 금지 규칙에 따라 미접근.

### CASE-A 김나래 / KT 프로젝트 컨설팅 추정
- target role 추정: KT 프로젝트 컨설팅 계열. JD 원문 부재로 target role 추정 기반 QA.
- candidate evidence 요약: Python/SQL/AI/PM, 제조 데이터 분석, E2E 리딩, Streamlit/Azure/Docker, SQLD, 수치 성과.
- keyword 판정: 데이터/AI/SQL/PM은 hit가 자연스럽고, 컨설팅 deliverable/고객 과제 정의/제안 브릿지는 약하게 남는 것이 맞다.
- must 판정: SQLD·분석 역량 반영은 자연스럽지만 컨설팅 실무를 과대 인정하면 안 된다.
- 사용자 체감: 기술 강점과 consulting bridge 부족을 분리 설명하면 납득 가능.
- PASS/BORDERLINE/FAIL: BORDERLINE
- 문제 분류: explanation/read-path 문제 + pair 자체 한계
- 한 줄 총평: 기술·데이터·PM 역량은 강하지만 프로젝트 컨설팅 직접 브릿지는 약하다.

### CASE-B 에실로코리아 Sales Representative
- target role 추정: 에실로코리아 Sales Representative.
- candidate evidence 요약: 안경광학 전공, 안경사 면허, 칼자이스 인턴, 현장 영업 및 거래 재개, 고객응대, Excel/PPT.
- keyword 판정: 광학 업종 적합성/고객응대/현장 영업 relevance는 hit, account management/매출관리/채널 운영 공백은 miss가 보수적으로 맞다.
- must 판정: 전공·면허·업계 인턴은 강한 관련 증거지만 실전 sales 운영 전반으로 확장 인정하면 과대다.
- 사용자 체감: 도메인 적합성은 높지만 실전 sales 운영 증거는 얕다는 설명이면 설득력 있다.
- PASS/BORDERLINE/FAIL: BORDERLINE
- 문제 분류: explanation/read-path 문제
- 한 줄 총평: 업종 적합성과 고객 접점 경험은 좋지만 세일즈 운영 경험의 깊이는 제한적이다.

### CASE-C 연구직 -> GTA·CRA 전환 / Clinical Operations 추정
- target role 추정: Clinical Operations, GTA에서 CRA 성장 경로. JD 원문 부재로 target role 추정 기반 QA.
- candidate evidence 요약: 생명과학/약학 배경, SOP, 실험 표준화, 데이터 일관성, 보고서, 논문 5편, 특허 1건, 병원 연구 경험.
- keyword 판정: 문서화/SOP/정확성/정합성/규제 준수 감수성은 hit, site monitoring/IRB·EC/TMF·eTMF/query resolution은 miss가 자연스럽다.
- must 판정: clinical operations 직접 수행 keyword를 무리하게 인정하면 안 되며 전환형 strength 설명이 더 중요하다.
- 사용자 체감: FAIL보다 BORDERLINE이 더 설득력 있다.
- PASS/BORDERLINE/FAIL: BORDERLINE
- 문제 분류: explanation/read-path 문제 + pair 자체 한계
- 한 줄 총평: 연구 문서화 강점은 분명하지만 clinical operations 실무 직접 증거는 부족한 전환형 케이스다.

### 보조 케이스 quick note
- 현대비앤지스틸 현장 생산 / 기아 지원서 / 한화시스템 기계는 정식 pair QA로 쓰지 않았다.

### 즉시 수정 필요 여부
- 즉시 수정 필요 없음.
- 이번 3개 메인 케이스에서 severity/composite/top3/risk ordering 즉시 수정 신호는 보이지 않았다.
- 우선순위는 엔진 수정이 아니라 설명 레이어에서 강점과 직접 브릿지 부족을 분리 노출하는 것이다.

### 전체 총평
- preciseAnalysis는 실제 사례 기준으로 핵심 신호가 선명한 케이스와 전환형 transferable evidence가 분명한 케이스까지는 usable하다.
- 컨설팅/세일즈 운영/clinical operations처럼 직접 role bridge가 중요한 케이스에서는 explanation/read-path 품질이 체감 정확도를 좌우한다.
- 다음 1순위는 target role 추정 기반 QA와 전환형 BORDERLINE 케이스 설명 정리다.


## ROUND8 QA (2026-04-13): transferable-strength borderline explanation

### 라운드 성격
- ROUND8은 엔진 강화가 아니라 전환형 BORDERLINE explanation 정리 라운드였다.
- transferable strength와 direct role bridge 부족을 동시에 설명하도록 보강했다.
- mixed profile 조건에서만 문구를 추가했다.
- severity/composite/top3/risk ordering 변경은 없었다.

### read-path owner
- keyword evidence owner: src/lib/preciseAnalysis/buildJdKeywordCoverageGapRisk.js
- must evidence owner: src/lib/preciseAnalysis/buildMustRequirementsGapRisk.js
- consumer 확인: PreciseAnalysisFlow는 risk.evidence[]를 uniqueTexts 처리 후 그대로 렌더링한다.
- 결론: builder가 SSOT이며 consumer 수정은 불필요했다.

### 적용 결과
- keyword mixed profile 조건: matchedKeywordCount >= 1 && missingKeywordCount >= 1
- must mixed profile 조건: effectiveMustHit >= 1 && effectiveMustMiss >= 1
- 위 조건에서만 전환형 BORDERLINE 설명 문구를 evidence[]에 추가했다.
- strong match와 full miss에는 새 문구가 붙지 않도록 유지했다.

### 중복 리스크 점검
- keyword 카드: alias 보정 문구 뒤에 mixed profile 문구 2줄만 추가
- must 카드: 보수 판정/alias 보정 문구 뒤에 mixed profile 문구 2줄만 추가
- 같은 카드 안에서 동일 문구를 중복 복붙하지 않았다.

### 검증 요약
- mixed profile: 문구 노출 조건이 코드상 명시적으로 확인됨
- strong/full miss: 조건문상 비노출
- regression: vite build 통과, severity/composite/top3/risk ordering 로직 미수정


## ROUND9 QA (2026-04-13): experience duration normalization + aggregation

### 라운드 성격
- ROUND9는 experience duration normalization + aggregation 라운드였다.
- 개별 경력 기간을 개월 단위로 정규화했다.
- raw sum과 unique timeline sum을 분리했다.
- unique total months를 experience/level 관련 최종 판단에 반영했다.
- docs/끄적.md는 이번 라운드 규칙에 따라 건드리지 않았다.

### owner 조사 결과
- 경력 정규화 owner: src/lib/fit/jdResumeFit.js
  - exact anchor: function __buildResumeExperienceDurationPack(rawText)
  - fit.resume.structured.experienceDurationPack에 producer 결과를 부착
- experience/level owner: src/lib/preciseAnalysis/buildExperienceLevelGapRisk.js
  - exact anchor: const durationPack = fit?.resume?.structured?.experienceDurationPack ?? null;
  - uniqueTotalMonths를 우선 사용해 severity 입력값으로 반영

### contract limitation 해소
- 기존 limitation은 YYYY-MM 기반 employmentPeriods만 읽고, explicit duration / full-date / ongoing / overlap 정보가 최종 experience 판단에 충분히 반영되지 않는 점이었다.
- 이번 라운드에서 duration pack이 rows, rawTotalMonths, uniqueTotalMonths, longestSingleRoleMonths, parseWarnings를 제공하면서 그 공백을 메웠다.

### 적용 요약
- parsing layer: month-only / full-date / explicit duration / ongoing current 지원
- aggregation layer: rawTotalMonths와 uniqueTotalMonths 분리
- decision layer: experience_level_gap가 uniqueTotalMonths를 실제 판단 기준으로 사용
- severity/composite/top3/risk ordering은 변경하지 않았다.

## 2026-04-13 ROUND10 - function mix + recency weighting

### 라운드 목적
- ROUND10은 function mix + recency weighting 라운드였다.
- 총 경력 개월 수뿐 아니라 기능별 누적 경력과 최근 기능 우세를 계산했다.
- primaryFunction / dominantRecentFunction을 최종 해석에 반영했다.
- 2년 마케팅 + 3년 영업 같은 케이스를 단순 총경력 5년이 아니라 영업 우세로 읽도록 보강했다.
- docs/끄적.md touched: NO

### owner 조사 결과
- duration owner: src/lib/fit/jdResumeFit.js
  - exact anchor: function __buildResumeExperienceDurationPack(rawText)
  - duration pack producer와 function pack producer를 같은 SSOT에 유지했다.
- function owner: src/lib/fit/jdResumeFit.js
  - exact anchor: const functionExperiencePack = {
  - row별 parsedMonths와 function signal을 결합해 functionMonthTotals / functionWeightedTotals를 생성한다.
- role/experience 해석 owner: src/lib/preciseAnalysis/buildExperienceLevelGapRisk.js
  - exact anchor: const functionPack = durationPack?.functionExperiencePack ?? null;
  - primaryFunction / dominantRecentFunction / targetFunctionHint를 experience_level_gap evidence와 raw에 반영한다.

### 적용 요약
- function bucket은 sales, marketing, operations, consulting, project_management, data_analytics, software_ai, research_rnd, engineering, customer_success, product_planning, hr, finance, general_business, unknown으로 고정했다.
- 최근 종료 또는 재직 중 row에는 recencyWeight 1.25, 이전 row에는 1.0을 적용했다.
- confidence weight는 high 1.0 / medium 0.8 / low 0.5로 고정했다.
- secondary function은 weighted score를 최대 0.5까지만 배분했다.
- 총 경력은 충분하지만 주력 기능이 타깃과 다른 경우, transferable strength와 role bridge 부족 문구를 evidence에 직접 추가했다.
