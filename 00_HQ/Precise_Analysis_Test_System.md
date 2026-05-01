# Precise Analysis 테스트 체계

## 문서 목적

이 문서는 preciseAnalysis MVP 테스트 시스템의 설계 기준을 정의한다.  
목표는 테스트를 많이 쌓는 것이 아니라, **중복 없이 회귀까지 가능한 구조**를 먼저 고정하는 것이다.

**성공 기준**: 새 케이스를 추가할 때 "기존 케이스와 뭐가 다른가"를 항상 설명할 수 있어야 한다.

---

## 핵심 원칙

1. **추출 정확도가 엔진 정확도보다 앞단 기준선이다.**  
   추출이 흔들리면 엔진 판정도 무의미해진다. extraction gold set은 engine gold set보다 먼저 안정화한다.

2. **테스트 케이스는 상황 설명만으로 관리하지 않는다.**  
   반드시 축 기반 분류 + ID + 기대 출력 + 기존 케이스와의 차이가 있어야 한다.

3. **경계값 케이스와 실전형 복합 케이스를 구분한다.**  
   경계값은 정책 변경 감지용, 복합 케이스는 실사용 시나리오 기반이다.

4. **버그는 회귀 케이스로 승격한다.**  
   실제 발견된 이상 사례는 regression set에 등록하고 재발 방지 기준으로 삼는다.

5. **새 케이스는 반드시 기존 케이스와 다른 이유가 있어야 한다.**  
   비슷한 케이스의 중복 양산을 막는다.

---

## 테스트 레이어 정의

```
Layer 1: Extraction
├─ JD 필드 추출 (jdModel.*) 정확도
└─ Resume 필드 추출 (parsedResume.*, employmentPeriods[]) 정확도

Layer 2: Engine
├─ 엔진별 severity 판정 정책 경계
└─ insufficient-data / 모드 분기 정확도

Layer 3: Composite
├─ overallBand 판정 정확도
├─ top3 선정/정렬 규칙 준수
└─ supporting 그룹 분리 정확도
```

> `Regression`은 별도 레이어가 아니라 위 3개 레이어에 걸쳐 있는 **버그 재현 세트**다.

---

## 테스트 축 정의

### 1. layer 축
| 값 | 설명 |
|---|---|
| `EXT` | Extraction layer (입력 추출/정규화) |
| `ENG` | Engine layer (엔진 정책 판정) |
| `COMP` | Composite layer (종합 판정, top3) |
| `REG` | Regression (버그 재현/회귀 고정) |

### 2. engine 축
| 값 | 설명 |
|---|---|
| `JD` | JD 추출 (extraction 전용) |
| `RES` | Resume 추출 (extraction 전용) |
| `MUST` | 필수요건 미충족 엔진 |
| `LVL` | 연차/레벨 불일치 엔진 |
| `ACH` | 성과 검증 불가 엔진 |
| `KW` | JD 키워드 반영 부족 엔진 |
| `GAP` | 공백/이직 설명 부재 엔진 |
| `ALL` | composite 또는 전체 엔진 조합 |

### 3. purpose 축
| 값 | 설명 |
|---|---|
| `SMOKE` | 기본 동작 확인 |
| `BOUND` | 경계값 (정책 임계값 근방) |
| `POLICY` | 정책 판단 검증 (모드 분기, severity 규칙) |
| `COMBO` | 복합 케이스 (여러 엔진/필드 동시) |
| `ACC` | 추출 정확도 (clean extraction) |
| `REC` | 추출 재현율 (놓치기 쉬운 케이스) |
| `PRE` | 추출 정밀도 (잘못 잡히면 안 되는 케이스) |
| `BUG` | 버그 재현 |

### 4. expected outcome 축
| 값 | 적용 레이어 |
|---|---|
| `none / low / medium / high / critical` | Engine 레이어 |
| `insufficient-data` | Engine 레이어 |
| `pass / caution / warning / high_risk` | Composite 레이어 |
| `field-match` | Extraction 레이어 (필드 기대값 매칭) |

### 5. data quality 축
| 값 | 설명 |
|---|---|
| `clean` | 정형화된 입력 |
| `noisy` | 형식 혼재, 언어 혼합, 표기 불일치 |
| `ambiguous` | 경계가 불명확한 케이스 |
| `missing` | 핵심 입력 일부 없음 |

---

## 테스트 ID 규칙

### 포맷

```
PA-{LAYER}-{ENGINE}-{PURPOSE}-{NNN}
```

| 세그먼트 | 값 | 예시 |
|---|---|---|
| `PA` | 고정 prefix | |
| `LAYER` | EXT / ENG / COMP / REG | |
| `ENGINE` | JD / RES / MUST / LVL / ACH / KW / GAP / ALL | |
| `PURPOSE` | SMOKE / BOUND / POLICY / COMBO / ACC / REC / PRE / BUG | |
| `NNN` | 3자리 시퀀스 (001~) | |

### 예시

```
PA-EXT-JD-ACC-001       JD에서 mustHave[] 안정적 추출
PA-EXT-JD-PRE-001       SQL이 MySQL에만 있어도 잡히는 오탐 케이스
PA-EXT-RES-REC-001      employment period 서술형 표기 recall 케이스
PA-EXT-RES-PRE-001      "5년 경력" achievement 오탐 케이스
PA-ENG-MUST-BOUND-001   must 일부 누락 → high 경계
PA-ENG-KW-BOUND-001     ratio 0.5 경계 케이스
PA-ENG-GAP-POLICY-001   12개월 gap + 설명 → medium 정책
PA-COMP-ALL-COMBO-001   fatal high + important medium → high_risk band
PA-REG-KW-BUG-001       SQL/MySQL substring precision trap 회귀
PA-REG-ACH-BUG-001      "5년 경력" achievement 오탐 회귀
```

### 시퀀스 규칙
- 각 `LAYER-ENGINE-PURPOSE` 조합 내에서 독립 시퀀스
- 001부터 시작, 삭제해도 번호 재사용 금지
- deprecated 케이스는 ID 유지하고 status=`deprecated` 표시

---

## 케이스 중복 방지 원칙

새 케이스를 추가하기 전에 아래를 확인한다.

1. **같은 경계값을 다른 텍스트로 반복하지 않는다.**  
   ratio 0.5 경계는 PA-ENG-KW-BOUND-001 하나만 존재해야 한다.

2. **input quality가 다르면 별도 케이스가 정당화된다.**  
   clean input과 noisy input에서 같은 경계는 각각 다른 케이스다.

3. **목적이 다르면 별도 케이스다.**  
   같은 입력이라도 ACC(추출 정확도)와 POLICY(엔진 판정)는 다른 케이스다.

4. **케이스 설명에 "기존 PA-XXX-NNN과 다른 이유"를 반드시 기술한다.**

---

## Gold Set 승격 원칙

아래 조건 중 하나 이상을 만족하면 gold set 후보로 본다.

1. 정책 경계값에 해당하는 케이스 (boundary)
2. 실사용 시나리오 대표 케이스 (combo)
3. 과거 QA에서 기대값이 흔들린 케이스 (policy)
4. 엔진 precision/recall을 대표하는 추출 케이스 (ACC/REC/PRE)
5. 실제 버그에서 발견된 케이스 (bugfix → regression 승격)

---

## Regression 승격 원칙

실제 운영 또는 QA 중 발견된 이상 사례는 아래 절차로 회귀 케이스로 등록한다.

1. 버그 발견 → `PA-REG-{ENGINE}-BUG-NNN` ID 발급
2. 원래 문제 / 수정 후 기대 동작 / 관련 엔진·레이어 기록
3. 코드 수정 후 케이스가 pass가 됐는지 확인
4. 이후 해당 케이스를 gold set에도 반영 (회귀 고정)

---

## 테스트 실행 방식 (현재 단계)

현재 단계는 **수동 검증**이다.  
- `window.__PRECISE_ANALYSIS_DEBUG__` 스냅샷으로 엔진 결과 확인
- `window.__PARSED_RESUME__`, `window.__JD_RESUME_FIT__` 로 추출 결과 확인
- 자동화 runner는 별도 라운드에서 설계

### 수동 검증 흐름

```
입력 텍스트 준비 → Analyze 클릭
→ window.__JD_RESUME_FIT__.jdModel 확인 (JD 추출)
→ window.__PARSED_RESUME__ 확인 (Resume 추출)
→ window.__PRECISE_ANALYSIS_DEBUG__ 확인 (엔진 + composite)
→ 기대 출력과 대조
→ pass/fail 기록 → 이상 시 regression 승격 검토
```

---

## 공유/복원 E2E 검수 트랙 분리 원칙

공유/복원 검수는 Extraction / Engine / Composite / Regression과 **별도 트랙**으로 관리한다.

이유:
- Extraction~Regression은 제품 로직 정확도를 검증한다
- Share / Restore / E2E / Round-trip은 배포·복원·공유 동작을 검수한다
- 두 트랙을 섞으면 환경 실패와 기능 실패를 구분할 수 없게 된다

규칙:
- 공유/복원 검수 기록은 `05_Execution/Precise_Analysis_QA_Log.md`에 저장한다
- 공유/복원 케이스 ID는 `QA-SHARE-*` 계열을 사용하며 `PA-*` ID와 섞지 않는다
- 환경 실패는 제품 실패와 구분해 기록한다
- 재검수 조건이 충족되지 않으면 동일 검수를 중복 실행한 것으로 간주하지 않는다

---

## 문서 이력

| 날짜 | 라운드 | 내용 |
|---|---|---|
| 2026-04-12 | 테스트 체계/골드셋 라운드 | 초안 생성 |
| 2026-04-12 | 공유/복원 검수 기록 분리 라운드 | 공유/복원 E2E 별도 트랙 원칙 추가 |
