# Precise Analysis 테스트 카탈로그

## 문서 목적

이 문서는 preciseAnalysis MVP 테스트 케이스의 인덱스다.  
각 케이스의 ID / 레이어 / 엔진 / 목적 / 기대결과 / 한 줄 설명을 관리한다.  
상세 입력/출력은 `Precise_Analysis_Gold_Set.md`를 참조한다.

---

## 섹션 A. Extraction 케이스

### A1. JD 추출

| ID | layer | engine | purpose | quality | 기대결과 | 한 줄 설명 |
|---|---|---|---|---|---|---|
| PA-EXT-JD-ACC-001 | EXT | JD | ACC | clean | mustHave[] 3+개 추출 | 정형 JD에서 mustHave 안정적 추출 |
| PA-EXT-JD-ACC-002 | EXT | JD | ACC | clean | domainKeywords[] 5+개 추출 | 도메인 키워드 regex 추출 안정성 |
| PA-EXT-JD-ACC-003 | EXT | JD | ACC | clean | experienceYears.min/max 추출 | "5년 이상" → min:5, max:null |
| PA-EXT-JD-REC-001 | EXT | JD | REC | noisy | must requirement 우회 표현 추출 | "required:" 없이 구문 속에 숨은 must |
| PA-EXT-JD-REC-002 | EXT | JD | REC | noisy | 영문 섞인 JD에서 domainKeywords 추출 | 한영 혼합 JD 키워드 recall |
| PA-EXT-JD-PRE-001 | EXT | JD | PRE | noisy | SQL 단독 요구 vs MySQL 포함 시 구분 | SQL이 MySQL에만 있을 때 오탐 여부 |
| PA-EXT-JD-BOUND-001 | EXT | JD | BOUND | clean | experienceYears confidence 낮음 | "경력 무관" → min:null 확인 |

### A2. Resume 추출

| ID | layer | engine | purpose | quality | 기대결과 | 한 줄 설명 |
|---|---|---|---|---|---|---|
| PA-EXT-RES-ACC-001 | EXT | RES | ACC | clean | employmentPeriods[] 정확 추출 | YYYY.MM ~ YYYY.MM 형식 기본 추출 |
| PA-EXT-RES-ACC-002 | EXT | RES | ACC | clean | achievements[] 정량 표현 추출 | "30% 개선", "1억 매출" 포함 이력 |
| PA-EXT-RES-ACC-003 | EXT | RES | ACC | clean | gaps[] 추출 | 명시적 gap 서술 케이스 |
| PA-EXT-RES-REC-001 | EXT | RES | REC | noisy | 서술형 employment period 추출 | "2020년 3월부터 2년간" 형식 recall |
| PA-EXT-RES-REC-002 | EXT | RES | REC | noisy | 숫자 없이 성과 표현 추출 | "비용 절감", "리드", "전환" 표현만 있는 achievement |
| PA-EXT-RES-REC-003 | EXT | RES | REC | noisy | transitionNarrative 추출 | 이직 이유가 서술형으로 들어간 케이스 |
| PA-EXT-RES-PRE-001 | EXT | RES | PRE | noisy | "5년 경력" → achievement 오탐 방지 | 경력 기간이 성과로 잡히지 않아야 함 |
| PA-EXT-RES-PRE-002 | EXT | RES | PRE | noisy | 팀 규모 숫자 → achievement 오탐 방지 | "3개 팀 협업"이 정량 성과로 잡히지 않아야 함 |
| PA-EXT-RES-BOUND-001 | EXT | RES | BOUND | missing | employmentPeriods 없을 때 빈 배열 | 날짜 정보 전혀 없는 이력서 |

---

## 섹션 B. Engine 케이스

### B1. 필수요건 미충족 (MUST)

| ID | layer | engine | purpose | quality | 기대 severity | 한 줄 설명 |
|---|---|---|---|---|---|---|
| PA-ENG-MUST-SMOKE-001 | ENG | MUST | SMOKE | clean | none | must 전체 충족 기본 케이스 |
| PA-ENG-MUST-BOUND-001 | ENG | MUST | BOUND | clean | high | must 일부 누락 (3개 중 1개 miss) |
| PA-ENG-MUST-BOUND-002 | ENG | MUST | BOUND | clean | critical | must 다수 누락 (3개 중 2개 miss) |
| PA-ENG-MUST-POLICY-001 | ENG | MUST | POLICY | clean | none | preferred만 누락, must 전체 충족 |
| PA-ENG-MUST-POLICY-002 | ENG | MUST | POLICY | missing | insufficient-data | mustHave[] 비어 있는 JD |

### B2. 연차/레벨 불일치 (LVL)

| ID | layer | engine | purpose | quality | 기대 severity | 한 줄 설명 |
|---|---|---|---|---|---|---|
| PA-ENG-LVL-SMOKE-001 | ENG | LVL | SMOKE | clean | none | 경력 JD 요구 정확 충족 |
| PA-ENG-LVL-BOUND-001 | ENG | LVL | BOUND | clean | medium | 경력 1년 미만 부족 |
| PA-ENG-LVL-BOUND-002 | ENG | LVL | BOUND | clean | high | 경력 2년 이상 부족 |
| PA-ENG-LVL-POLICY-001 | ENG | LVL | POLICY | clean | medium | overqualified (요구보다 5년 이상 초과) |
| PA-ENG-LVL-POLICY-002 | ENG | LVL | POLICY | missing | insufficient-data | employmentPeriods[] 비어 있음 |

### B3. 성과 검증 불가 (ACH)

| ID | layer | engine | purpose | quality | 기대 severity | 한 줄 설명 |
|---|---|---|---|---|---|---|
| PA-ENG-ACH-SMOKE-001 | ENG | ACH | SMOKE | clean | none | achievements + 정량 bullets 충분 |
| PA-ENG-ACH-BOUND-001 | ENG | ACH | BOUND | clean | medium | bullets 있지만 정량 표현 부족 |
| PA-ENG-ACH-BOUND-002 | ENG | ACH | BOUND | noisy | high | achievements 거의 없음 |
| PA-ENG-ACH-PRE-001 | ENG | ACH | PRE | noisy | medium or high | "5년 경력" 숫자가 achievement로 잡힐 때 판정 |
| PA-ENG-ACH-POLICY-001 | ENG | ACH | POLICY | missing | insufficient-data | parsedResume 없음 |

### B4. JD 키워드 반영 부족 (KW)

| ID | layer | engine | purpose | quality | 기대 severity | 한 줄 설명 |
|---|---|---|---|---|---|---|
| PA-ENG-KW-SMOKE-001 | ENG | KW | SMOKE | clean | none | coverage 0.8 이상 |
| PA-ENG-KW-BOUND-001 | ENG | KW | BOUND | clean | medium | ratio 정확히 0.5 |
| PA-ENG-KW-BOUND-002 | ENG | KW | BOUND | clean | high | ratio 0.3 미만 |
| PA-ENG-KW-BOUND-003 | ENG | KW | BOUND | clean | low | ratio 0.6~0.79 구간 |
| PA-ENG-KW-PRE-001 | ENG | KW | PRE | noisy | (precision trap) | SQL이 MySQL에만 있어도 matched로 잡히는지 |
| PA-ENG-KW-POLICY-001 | ENG | KW | POLICY | missing | insufficient-data | domainKeywords[] 비어 있는 JD |

### B5. 공백/이직 설명 부재 (GAP)

| ID | layer | engine | purpose | quality | 기대 severity | 한 줄 설명 |
|---|---|---|---|---|---|---|
| PA-ENG-GAP-SMOKE-001 | ENG | GAP | SMOKE | clean | none | gap 없음 |
| PA-ENG-GAP-BOUND-001 | ENG | GAP | BOUND | clean | medium | 3개월 gap |
| PA-ENG-GAP-BOUND-002 | ENG | GAP | BOUND | clean | high | 6개월 gap |
| PA-ENG-GAP-BOUND-003 | ENG | GAP | BOUND | clean | critical | 12개월 gap, 설명 없음 |
| PA-ENG-GAP-POLICY-001 | ENG | GAP | POLICY | clean | medium | 12개월 gap + 설명 한 줄 |
| PA-ENG-GAP-POLICY-002 | ENG | GAP | POLICY | clean | none | 6개월 미만 gap + 설명 있음 |
| PA-ENG-GAP-POLICY-003 | ENG | GAP | POLICY | missing | insufficient-data | employmentPeriods[] 비어 있음 |

---

## 섹션 C. Composite 케이스

| ID | layer | engine | purpose | quality | 기대 overallBand | 한 줄 설명 |
|---|---|---|---|---|---|---|
| PA-COMP-ALL-SMOKE-001 | COMP | ALL | SMOKE | clean | pass | 모든 엔진 none/low → pass |
| PA-COMP-ALL-BOUND-001 | COMP | ALL | BOUND | clean | caution | low만 복수 → caution |
| PA-COMP-ALL-COMBO-001 | COMP | ALL | COMBO | clean | high_risk | fatal/high 복수 충돌 → high_risk, top3 정렬 확인 |
| PA-COMP-ALL-COMBO-002 | COMP | ALL | COMBO | clean | warning | medium만 1개, low 1개 → warning |
| PA-COMP-ALL-POLICY-001 | COMP | ALL | POLICY | missing | (band) | insufficient-data가 top3가 아닌 supporting에 분리되는지 |
| PA-COMP-ALL-COMBO-003 | COMP | ALL | COMBO | clean | high_risk | gap medium + must high → must가 top3 앞에 오는지 (fatal 우선) |
| PA-COMP-ALL-COMBO-004 | COMP | ALL | COMBO | mixed | high_risk | high 1개 + low 2개 + insufficient-data 1개 혼합 |

---

## 섹션 D. Regression 케이스

| ID | layer | engine | purpose | quality | 기대결과 | 한 줄 설명 |
|---|---|---|---|---|---|---|
| PA-REG-KW-BUG-001 | REG | KW | BUG | noisy | matched=false | SQL이 MySQL에만 있어도 matched로 잡히던 오탐 |
| PA-REG-ACH-BUG-001 | REG | ACH | BUG | noisy | achievement 미인정 | "5년 경력" 문구가 정량 성과로 오탐되던 케이스 |
| PA-REG-GAP-BUG-001 | REG | GAP | BUG | clean | medium (12개월 gap + 설명) | 설명 한 줄로 none 완화되던 과완화 버그 |
| PA-REG-RES-BUG-001 | REG | RES | BUG | clean | projects 미소비 | parsedResume.projects[] 추출되나 소비 엔진 없는 구조 공백 |

---

---

## 섹션 E. Share / Restore QA Verification

이 섹션은 공유/복원 동작 검수 전용 트랙이다.  
Extraction / Engine / Composite / Regression 케이스와 섞지 않는다.  
상세 기록은 `05_Execution/Precise_Analysis_QA_Log.md`를 참조한다.

| ID | 목적 | 현재 상태 | 재검수 필요 여부 |
|---|---|---|---|
| QA-SHARE-PRECISE-RESTORE-001 | 정밀 분석 결과 공유 링크를 새 브라우저 컨텍스트에서 복원 확인 | 소스 PASS / 브라우저 E2E FAIL (환경 제약) | 예 — 브라우저 remote debugging 가능 환경 필요 |
| QA-SHARE-TL-REGRESSION-001 | 기존 `transition-lite` 공유 링크 복원 회귀 여부 확인 | 소스 PASS / 브라우저 E2E FAIL (환경 제약) | 예 — 동일 환경 조건 |
| QA-SHARE-PANEL-PRECISE-001 | 정밀 분석 공유 패널 내 카카오/링크 복사/네이티브 공유 버튼 노출 및 전용 copy 문구 확인 | 소스 PASS / 브라우저 UI 노출 FAIL (환경 제약) | 예 — 실제 브라우저 UI 검수 필요 |
| QA-SHARE-SID-ROUNDTRIP-001 | 공유 링크 생성 후 SID 저장소 왕복(실서버 round-trip) 검수 | FAIL (EACCES 네트워크 차단) | 예 — 외부 네트워크 허용 환경 필요 |

---

## 케이스 상태

| 상태 | 의미 |
|---|---|
| `draft` | 설계됨, 아직 수동 검증 미완료 |
| `verified` | 수동 검증 1회 이상 통과 |
| `gold` | gold set 승격, 회귀 기준으로 사용 |
| `deprecated` | 폐기됨, ID 유지 |
| `regression` | 버그 재현 케이스, 코드 수정 후 pass 확인됨 |

현재 모든 케이스는 `draft` 상태다.

---

## 문서 이력

| 날짜 | 내용 |
|---|---|
| 2026-04-12 | 초안 생성 |
