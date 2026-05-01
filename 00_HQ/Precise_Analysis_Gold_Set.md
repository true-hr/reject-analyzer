# Precise Analysis Gold Set

## 문서 목적

이 문서는 preciseAnalysis MVP의 테스트 gold set을 상세하게 기록한다.  
각 케이스의 입력 요약 / 기대 출력 / 왜 필요한지 / 기존 케이스와 차이를 포함한다.

수동 검증은 `window.__JD_RESUME_FIT__`, `window.__PARSED_RESUME__`, `window.__PRECISE_ANALYSIS_DEBUG__`로 수행한다.

---

## A. Extraction Accuracy Gold Set

### A1. JD 추출

---

#### PA-EXT-JD-ACC-001 — mustHave 안정적 추출 (clean)

**입력 요약**
```
JD:
[필수] 5년 이상 백엔드 개발 경험
[필수] Java 또는 Kotlin 숙련
[필수] 대용량 트래픽 처리 경험
[우대] MSA 경험
```

**기대 출력**
```js
fit.jdModel.mustHave = ["5년 이상 백엔드 개발 경험", "Java 또는 Kotlin 숙련", "대용량 트래픽 처리 경험"]
fit.jdModel.preferred = ["MSA 경험"]
```

**왜 필요한가**: jdModel mustHave 추출의 기본 기준선.  
**기존 케이스와 차이**: 없음 (smoke/base case).

---

#### PA-EXT-JD-ACC-002 — domainKeywords 추출 안정성 (clean)

**입력 요약**
```
JD: Java, Spring Boot, MySQL, Redis, Kubernetes, AWS, REST API, 마이크로서비스
```

**기대 출력**
```js
fit.jdModel.domainKeywords = ["java", "spring boot", "mysql", "redis", "kubernetes", "aws", "rest api", "마이크로서비스"]
// (대소문자 무관, 최소 5개 이상)
```

**왜 필요한가**: `__extractJdDomainKeywords` regex 추출 안정성 기준.  
**기존 케이스와 차이**: ACC-001은 mustHave 대상, 이 케이스는 domainKeywords 대상.

---

#### PA-EXT-JD-ACC-003 — experienceYears 추출 (clean)

**입력 요약**
```
JD: "5년 이상의 개발 경험이 있는 분"
```

**기대 출력**
```js
fit.jdModel.experienceYears = { min: 5, max: null, confidence: 0.8+ }
```

**왜 필요한가**: 연차 추출 기준선.  
**기존 케이스와 차이**: ACC-001/002는 mustHave/keyword, 이 케이스는 yearsRequired.

---

#### PA-EXT-JD-REC-001 — 우회 표현 속 must requirement (noisy)

**입력 요약**
```
JD 본문 안에 "A, B, C 역량을 갖추신 분을 모십니다"처럼
[필수] 태그 없이 필수 요건이 서술형으로 들어간 케이스
```

**기대 출력**
```js
fit.jdModel.sections.requiredLines // 관련 문장 포함 여부 확인
// mustHave가 비어 있더라도 requiredLines에 해당 줄이 잡히면 PASS
```

**왜 필요한가**: 필수요건 미충족 엔진이 requiredLines 경로로 판정 가능한지 확인.  
**기존 케이스와 차이**: ACC-001은 [필수] 태그 있는 정형 JD, 이 케이스는 태그 없는 서술형.

---

#### PA-EXT-JD-PRE-001 — SQL/MySQL precision trap (noisy)

**입력 요약**
```
JD: "MySQL 경험 필수"
Resume: "MySQL, PostgreSQL 경험"
domainKeywords: ["mysql"]
coverageText에 "mysql" 포함
```

**기대 출력**
```
"mysql" → matched: true (substring 허용 정책 하 EXPECTED)
"sql" 단독 → matched: true (substring이므로 KNOWN TRAP)
```

**왜 필요한가**: substring 매칭 오탐 범위를 명시적으로 고정.  
MVP에서는 허용하지만 accuracy 라운드에서 token-boundary로 전환 여부 검토 기준.  
**기존 케이스와 차이**: 이 케이스는 의도적 오탐 허용 케이스 — PA-REG-KW-BUG-001과 연결됨.

---

### A2. Resume 추출

---

#### PA-EXT-RES-ACC-001 — employmentPeriods 기본 추출 (clean)

**입력 요약**
```
Resume:
2020.03 ~ 2022.08 / ABC Inc. / 백엔드 개발
2022.09 ~ 현재 / XYZ Corp. / 서버 엔지니어
```

**기대 출력**
```js
fit.resume.structured.employmentPeriods = [
  { from: "2020-03", to: "2022-08", isCurrent: false },
  { from: "2022-09", to: "present", isCurrent: true }
]
```

**왜 필요한가**: gap 엔진, level 엔진의 모든 입력 기준선.  
**기존 케이스와 차이**: 기본 YYYY.MM ~ YYYY.MM 형식 기준.

---

#### PA-EXT-RES-ACC-002 — achievements 정량 표현 추출 (clean)

**입력 요약**
```
Resume:
- 서버 응답시간 30% 개선
- 연 매출 1억 이상 기여
- 팀 리드로 3개 프로젝트 성공 납품
```

**기대 출력**
```js
parsedResume.achievements = ["서버 응답시간 30% 개선", "연 매출 1억 이상 기여", ...]
// bullets 중 정량 표현 포함 항목
```

**왜 필요한가**: achievement 엔진 정확도 기준선.

---

#### PA-EXT-RES-REC-001 — 서술형 employment period 추출 (noisy)

**입력 요약**
```
Resume:
2019년 3월부터 약 2년간 A사 근무
2021년부터 2023년 상반기까지 B사 재직
```

**기대 출력**
```js
fit.resume.structured.employmentPeriods // 최소 1개 이상 추출 여부 확인
// "약 2년간" 같은 서술형은 regex miss 가능 — recall gap 문서화 목적
```

**왜 필요한가**: 서술형 날짜 표기가 regex에서 miss되는 recall gap 문서화.  
**기존 케이스와 차이**: ACC-001은 정형 표기, 이 케이스는 서술형.

---

#### PA-EXT-RES-PRE-001 — "5년 경력" achievement 오탐 방지 (noisy)

**입력 요약**
```
Resume:
- 5년 이상의 백엔드 경험
- 3개 팀과 협업한 경험
```

**기대 출력**
```js
// "5년 이상의 백엔드 경험" → achievements에 포함되지 않아야 함
// OR: 포함되더라도 quantifiedBulletRatio에 과도한 영향 없어야 함
// 현재 MVP에서는 오탐 가능성이 있는 케이스로 문서화
```

**왜 필요한가**: PA-REG-ACH-BUG-001의 기준 케이스.  
**기존 케이스와 차이**: ACC-002는 실제 성과 표현, 이 케이스는 비성과 숫자.

---

## B. Engine Policy Gold Set

### B1. 필수요건 미충족 엔진

---

#### PA-ENG-MUST-SMOKE-001 — must 전체 충족 → none

**입력 요약**
```js
fit.jdModel.mustHave = ["Java 경험", "REST API 설계"]
fit.summary = { must_hit: 2, must_miss: 0 }
```

**기대 출력**: `severity: "none"`, `triggered: false`  
**왜 필요한가**: 엔진 기본 동작 확인.

---

#### PA-ENG-MUST-BOUND-001 — must 일부 누락 → high

**입력 요약**
```js
fit.jdModel.mustHave = ["Java", "MySQL", "Kubernetes"]
fit.summary = { must_hit: 2, must_miss: 1 }
```

**기대 출력**: `severity: "high"`, `triggered: true`  
**왜 필요한가**: must 1개 miss 경계값.

---

#### PA-ENG-MUST-BOUND-002 — must 다수 누락 → critical

**입력 요약**
```js
fit.jdModel.mustHave = ["Java", "MySQL", "Kubernetes"]
fit.summary = { must_hit: 1, must_miss: 2 }
```

**기대 출력**: `severity: "critical"`, `triggered: true`  
**왜 필요한가**: must 2개 이상 miss 경계값.  
**기존 케이스와 차이**: BOUND-001은 1개 miss, 이 케이스는 2개 이상.

---

#### PA-ENG-MUST-POLICY-001 — preferred만 누락 → none

**입력 요약**
```js
fit.jdModel.mustHave = ["Java"] // 충족
fit.jdModel.preferred = ["Kubernetes"] // 미충족
fit.summary = { must_hit: 1, must_miss: 0 }
```

**기대 출력**: `severity: "none"`, `triggered: false`  
**왜 필요한가**: preferred 누락이 엔진에 영향 없어야 함을 확인.

---

#### PA-ENG-MUST-POLICY-002 — insufficient-data

**입력 요약**
```js
fit.jdModel.mustHave = [] // JD에 must 없음
```

**기대 출력**: `raw.mustPolicyMode: "raw-fit"` (insufficient-data 없음 — must 엔진은 insufficient-data 모드 없음)  
**왜 필요한가**: must 엔진 예외 처리 확인.  
**참고**: 다른 4개 엔진과 달리 must 엔진에는 insufficient-data 모드가 없다.

---

### B2. 연차/레벨 불일치 엔진

---

#### PA-ENG-LVL-SMOKE-001 — 경력 정확 충족 → none

**입력 요약**
```js
fit.jdModel.experienceYears = { min: 5, max: null }
// employmentPeriods → totalCareerYears: 5.5
```

**기대 출력**: `severity: "none"`, `triggered: false`

---

#### PA-ENG-LVL-BOUND-001 — 경력 1년 미만 부족 → medium

**입력 요약**
```js
fit.jdModel.experienceYears = { min: 5, max: null }
// totalCareerYears: 4.2 (0.8년 부족)
```

**기대 출력**: `severity: "medium"`, `triggered: true`

---

#### PA-ENG-LVL-BOUND-002 — 경력 2년 이상 부족 → high

**입력 요약**
```js
fit.jdModel.experienceYears = { min: 5, max: null }
// totalCareerYears: 2.8 (2.2년 부족)
```

**기대 출력**: `severity: "high"`, `triggered: true`  
**기존 케이스와 차이**: BOUND-001은 1년 미만 부족, 이 케이스는 2년 이상.

---

#### PA-ENG-LVL-POLICY-001 — overqualified → medium (보수 정책)

**입력 요약**
```js
fit.jdModel.experienceYears = { min: 3, max: 5 }
// totalCareerYears: 10 (5년 초과)
```

**기대 출력**: `severity: "medium"`, `triggered: true`  
**왜 필요한가**: overqualified는 high가 아닌 medium 보수 정책 확인.

---

### B3. 성과 검증 불가 엔진

---

#### PA-ENG-ACH-SMOKE-001 — achievements + bullets 충분 → none

**입력 요약**
```js
parsedResume.achievements = ["30% 개선", "1억 매출 기여"]
parsedResume.timeline = [{ bullets: ["응답속도 50% 향상", "비용 20% 절감"] }]
```

**기대 출력**: `severity: "none"`, `triggered: false`

---

#### PA-ENG-ACH-BOUND-001 — bullets 정량 표현 부족 → medium

**입력 요약**
```js
parsedResume.achievements = []
parsedResume.timeline = [{ bullets: ["기능 개발", "유지보수"] }] // 정량 없음
```

**기대 출력**: `severity: "medium"` 또는 `"high"`, `triggered: true`

---

#### PA-ENG-ACH-PRE-001 — "5년 경력" 숫자 오탐 케이스

**입력 요약**
```js
parsedResume.achievements = ["5년 이상 경험"]
parsedResume.timeline = [{ bullets: ["3개 팀 협업"] }]
```

**기대 출력**: `severity: "high"` 또는 `"medium"` (오탐으로 낮게 판정될 경우 회귀 확인)  
**왜 필요한가**: PA-REG-ACH-BUG-001의 정책 경계. 현재 MVP에서 허용 수준 판단.

---

### B4. JD 키워드 반영 부족 엔진

---

#### PA-ENG-KW-BOUND-001 — ratio 정확히 0.5 → medium

**입력 요약**
```js
fit.jdModel.domainKeywords = ["java", "spring", "mysql", "redis", "kubernetes", "aws"]
// coverageText에 "java", "spring", "mysql" 포함 → matched 3/6 = 0.5
```

**기대 출력**: `severity: "medium"`, `raw.keywordCoverageRatio: 0.5`  
**왜 필요한가**: ratio ≤ 0.5 → medium 정책 경계 고정.

---

#### PA-ENG-KW-BOUND-002 — ratio 0.3 미만 → high

**입력 요약**
```js
// matched 2/7 = 0.28
```

**기대 출력**: `severity: "high"` (ratio < 0.3 조건)

---

#### PA-ENG-KW-PRE-001 — SQL/MySQL precision trap

**입력 요약**
```js
fit.jdModel.domainKeywords = ["sql"]
// coverageText에 "mysql"만 포함 (sql 단독은 없음)
```

**기대 출력**: `severity: (sql이 mysql에 substring으로 matched=true가 되는 현재 동작 확인)`  
**왜 필요한가**: substring 정책 하 이 케이스는 KNOWN TRAP. accuracy 라운드 전까지 오탐 허용 범위 기록.

---

### B5. 공백/이직 설명 부재 엔진

---

#### PA-ENG-GAP-BOUND-003 — 12개월 gap, 설명 없음 → critical

**입력 요약**
```js
fit.resume.structured.employmentPeriods = [
  { from: "2019-03", to: "2020-02" },
  { from: "2021-03", to: "present" } // 13개월 gap
]
parsedResume.gaps = []
parsedResume.transitionNarrative = []
```

**기대 출력**: `severity: "critical"`, `raw.maxGapMonths: 13`

---

#### PA-ENG-GAP-POLICY-001 — 12개월 gap + 설명 한 줄 → medium

**입력 요약**
```js
fit.resume.structured.employmentPeriods = [/* 13개월 gap */]
parsedResume.gaps = ["육아휴직으로 인한 공백기"]
```

**기대 출력**: `severity: "medium"` (NOT none)  
**왜 필요한가**: PA-REG-GAP-BUG-001 수정 후 동작 확인 — 설명 있어도 12개월 이상이면 medium 유지.

---

## C. Composite / Top3 Gold Set

---

#### PA-COMP-ALL-COMBO-001 — fatal/high 복수 → high_risk, top3 정렬

**입력 요약**
```js
// 가상 엔진 결과
mustRequirementsGap: { triggered: true, severity: "high", category: "fatal" }
experienceLevelGap:  { triggered: true, severity: "medium", category: "fatal" }
jdKeywordCoverageGap: { triggered: true, severity: "medium", category: "important" }
achievementEvidenceGap: { triggered: false }
gapExplanationMissing: { triggered: false }
```

**기대 출력**
```js
compositeRisk.summary.overallBand = "high_risk"
compositeRisk.topRisks = [mustGap(high), levelGap(medium), kwGap(medium)]
// 정렬: severity 우선 → category 우선(fatal > important) → ENGINE_PRIORITY
```

**왜 필요한가**: top3 정렬 규칙 핵심 케이스.

---

#### PA-COMP-ALL-POLICY-001 — insufficient-data → supporting 분리

**입력 요약**
```js
achievementEvidenceGap: { triggered: false, raw.achievementPolicyMode: "insufficient-data" }
```

**기대 출력**
```js
compositeRisk.supporting.insufficientData // achievementEvidenceGap 포함
compositeRisk.topRisks // achievementEvidenceGap 미포함
```

**왜 필요한가**: insufficient-data 항목이 top3에 섞이지 않는 규칙 확인.

---

#### PA-COMP-ALL-COMBO-003 — gap medium + must high → must가 top3 앞에

**입력 요약**
```js
mustRequirementsGap: { triggered: true, severity: "high", category: "fatal" }
gapExplanationMissing: { triggered: true, severity: "medium", category: "fatal" }
```

**기대 출력**
```js
compositeRisk.topRisks[0] = mustRequirementsGap // severity high 우선
compositeRisk.topRisks[1] = gapExplanationMissing
```

**왜 필요한가**: 같은 category(fatal) 내에서 severity 우선 규칙 확인.

---

## D. Regression / Bugfix Set

---

#### PA-REG-KW-BUG-001 — SQL/MySQL substring precision trap

**원래 문제**: "SQL"이 "MySQL"에 substring으로 매칭되어 SQL 단독 요구가 충족된 것처럼 판정됨.  
**현재 기대 동작**: MVP 범위에서 substring 허용. 이 케이스는 KNOWN TRAP으로 기록.  
**관련 엔진**: buildJdKeywordCoverageGapRisk  
**관련 레이어**: Normalized (jdModel.domainKeywords), Raw (__resumeMerged)  
**회귀 고정 여부**: 아직 미수정 (accuracy 라운드 후보로 등록)  
**연결 케이스**: PA-EXT-JD-PRE-001, PA-ENG-KW-PRE-001

---

#### PA-REG-ACH-BUG-001 — "5년 경력" achievement 오탐

**원래 문제**: "5년 이상 경험" 같은 경력 기술 문장이 정량 성과(quantified bullet)로 인식됨.  
**현재 기대 동작**: MVP 범위에서 허용 수준. 이 케이스는 오탐 가능 구간으로 기록.  
**관련 엔진**: buildAchievementEvidenceGapRisk  
**관련 레이어**: Parsed (parsedResume.achievements, timeline.bullets)  
**회귀 고정 여부**: 아직 미수정 (accuracy 라운드 후보)  
**연결 케이스**: PA-EXT-RES-PRE-001, PA-ENG-ACH-PRE-001

---

#### PA-REG-GAP-BUG-001 — 12개월 gap + 설명 한 줄로 none 처리 (수정 완료)

**원래 문제**: 설명 신호(transitionNarrative 또는 gaps)가 1개만 있어도 gap 크기와 무관하게 severity: "none"으로 완화됨.  
**수정 후 기대 동작**: `describedGapCount > 0 AND maxGapMonths >= 12` → severity: "medium" (none 아님)  
**관련 엔진**: buildGapExplanationMissingRisk  
**관련 레이어**: Normalized (employmentPeriods), Parsed (gaps, transitionNarrative)  
**회귀 고정 여부**: 코드 수정 완료 (2026-04-12). 이 케이스는 회귀 기준으로 고정.  
**연결 케이스**: PA-ENG-GAP-POLICY-001

---

#### PA-REG-RES-BUG-001 — parsedResume.projects[] 소비 엔진 없음

**원래 문제**: parseWithAI가 projects[]를 추출하지만, 현재 어떤 엔진도 이 필드를 소비하지 않음.  
**현재 기대 동작**: 구조적 공백으로 문서화. 향후 achievement 엔진 보완 시 활용 후보.  
**관련 엔진**: buildAchievementEvidenceGapRisk (잠재적 입력 후보)  
**관련 레이어**: Parsed (parsedResume.projects)  
**회귀 고정 여부**: 수정 대상 아님 (설계 공백 기록)

---

## 문서 이력

| 날짜 | 내용 |
|---|---|
| 2026-04-12 | 초안 생성 — A/B/C/D 세트 전체 |
| 2026-04-13 | Second Manual Session Input Set 추가 (강산.md 입력셋) |

## 2026-04-12 First Manual Session Input Set

### PA-EXT-RES-REC-001 | 서술형 employment period 추출
- 왜 필요한가: 서술형 기간 표현에서 `employmentPeriods`가 비어도 다른 레이어에 경력 단서가 남는지 확인해야 한다.
- 중복 차이: 날짜가 `YYYY.MM ~ YYYY.MM`로 고정된 ACC 케이스와 달리, 상반기/말/약 2년 같은 서술형 기간 표현을 섞었다.
- 기대 출력: `fit.resume.structured.employmentPeriods[]` 또는 `parsedResume.timeline[]`에 기간 단서가 남고, 완전 구조화 실패 시에도 경험 연차 엔진이 `insufficient-data` 근거를 설명 가능해야 한다.
- JD sample:
```text
채용 포지션: Product Operations Manager
주요 업무
- 운영 프로세스 개선과 고객 이슈 대응 체계 정비
자격 요건
- 3년 이상 운영/PM 경력
- 고객 커뮤니케이션 경험
우대 사항
- SaaS 환경 경험
```
- Resume sample:
```text
김민수
B2B SaaS 운영/프로덕트 오퍼레이션
2021년 상반기부터 2023년 말까지 알파클라우드에서 Product Operations 담당
입사 후 1년 6개월 동안 VOC 분류 체계를 재정비했고, 약 2년간 CS와 개발팀 사이 이슈 triage를 운영했습니다.
이후 2024년 초부터 베타웍스에서 운영기획자로 근무 중
- 운영 매뉴얼 개편
- 고객 이슈 우선순위 운영
```

### PA-EXT-RES-REC-002 | 숫자 없는 성과 표현 추출
- 왜 필요한가: 숫자 없이도 성과 동사와 개선 표현이 extraction recall에 남는지 봐야 성과 엔진 해석의 기준선을 세울 수 있다.
- 중복 차이: ACC-002는 수치형 성과 문장이고, 이 케이스는 `개선/안정화/정비/표준화`만 남기는 정성형 성과다.
- 기대 출력: `parsedResume.achievements[]` 또는 `parsedResume.timeline[].bullets[]`에 성과성 문장이 남고, 숫자가 없다는 이유만으로 곧바로 `critical` 또는 `insufficient-data`로 무너지지 않아야 한다.
- JD sample:
```text
포지션: CX Operations Specialist
주요 업무
- 운영 안정화와 프로세스 개선
- VOC 기반 이슈 대응 체계 관리
자격 요건
- 고객 운영 또는 CS Ops 경험
우대 사항
- 협업툴 문서화 경험
```
- Resume sample:
```text
박서연
Customer Operations Specialist
2022.03 ~ 2024.02 / 라임서비스 / CX Operations
- 전환율 개선을 위해 onboarding FAQ 구조를 재설계
- 운영 안정화 주도 및 장애 대응 체계 정비
- VOC 분류 정책을 표준화해 팀 간 처리 기준을 맞춤
Skills: Zendesk, Notion, Google Sheets
```

### PA-EXT-JD-REC-001 | 설명문장형 must requirement 추출
- 왜 필요한가: 별도 `필수` 헤더가 없는 설명 문장형 JD에서 must requirement가 비어 버리면 이후 must/keyword 엔진 검증이 흔들린다.
- 중복 차이: ACC-001은 헤더형 `필수 요건`이고, 이 케이스는 역할 설명 문장 속에 `필요합니다/가능해야 합니다`를 숨겨 둔다.
- 기대 출력: `fit.jdModel.mustHave[]` 또는 `fit.jdModel.sections.requiredLines[]` 중 한 레이어에는 SQL 검증 경험과 고객 대응 가능 요건이 남아야 한다.
- JD sample:
```text
Company: Data Service Team
About the role
이 역할에서는 SQL 기반 데이터 검증 경험이 필요합니다.
채용 후 바로 고객 대응이 가능해야 합니다.
운영 지표를 읽고 문제 원인을 설명할 수 있어야 합니다.
우대 사항
- B2B SaaS support 경험
- Excel 또는 Google Sheets 활용
```
- Resume sample:
```text
이준호
Data QA Analyst
2021.01 ~ 2024.01 / 모노데이터
- SQL을 활용해 배치 결과를 검증
- 고객 문의 대응 및 데이터 이슈 트러블슈팅
```

### PA-REG-KW-BUG-001 | SQL / MySQL precision trap
- 왜 필요한가: MVP에서 허용 가능한 precision 손실인지, 아니면 다음 accuracy 라운드에서 반드시 고쳐야 할 substring trap인지 경계값을 남긴다.
- 중복 차이: JD는 `SQL`, 이력서는 `MySQL`만 명시해 token boundary 없이 매칭될 여지를 만들었다.
- 기대 출력: `keywordCoverageRatio`, `matchedKeywordCount`, `missingKeywords[]`가 SQL과 MySQL을 구분해야 하며, 실패해도 `MVP 허용 여부` 판단 메모를 남겨야 한다.
- JD sample:
```text
채용 포지션: Data Operations Analyst
자격 요건
- SQL로 데이터 추출 및 검증 가능
- 고객 요청 기반 리포트 작성
우대 사항
- Tableau 경험
```
- Resume sample:
```text
정하늘
Data Support Specialist
2022.05 ~ 2025.02 / 센트릭
- MySQL 쿼리로 운영 데이터 조회
- 고객 요청 보고서 작성
Skills: MySQL, Excel, Tableau
```

### PA-REG-ACH-BUG-001 | 5년 경력 achievement 오탐
- 왜 필요한가: 숫자와 기간 표현이 곧바로 성과로 오탐되는지 확인해야 achievement 엔진의 precision 한계를 기록할 수 있다.
- 중복 차이: 성과 지표 없이 `5년 경력`, `3개 법인`, `12명 팀`처럼 숫자만 남겨 quantified ratio를 왜곡시키는 샘플이다.
- 기대 출력: `parsedResume.achievements[]`에 잘못 들어가면 fail이며, 들어가지 않더라도 `timeline[].bullets[]`와 `achievement severity`를 함께 기록해야 한다.
- JD sample:
```text
포지션: Operations Manager
자격 요건
- 운영 조직 리드 경험
- 성과 중심의 이력서 작성
우대 사항
- BPO 관리 경험
```
- Resume sample:
```text
최도윤
Operations Manager
2019.01 ~ 2024.01 / 브릿지파트너스
- 5년 경력의 운영 총괄
- 3개 법인 운영 프로세스 관리
- 12명 팀 매니지먼트
Skills: Excel, ERP, Notion
```

### PA-REG-GAP-BUG-001 | 12개월 이상 공백 + 설명 한 줄 과완화 회귀
- 왜 필요한가: 이미 수정된 gap 정책이 실제 입력에서 유지되는지 regression 기준선을 남겨야 한다.
- 중복 차이: 날짜 두 구간 사이 공백 설명을 한 줄로 넣고, 설명 문장을 employment period로 잘못 읽을 가능성을 일부러 만든다.
- 기대 출력: `maxGapMonths >= 12`와 `describedGapCount > 0`가 동시에 남아 `severity=medium` 이상이 유지돼야 한다.
- JD sample:
```text
포지션: Business Operations Manager
자격 요건
- 4년 이상 운영 경력
- 조직 간 협업 경험
우대 사항
- 스타트업 경험
```
- Resume sample:
```text
강유진
Business Operations
2020.01 ~ 2022.06 / 에이스벤처스 / Operations Associate
- 운영 SOP 관리
2022.07 ~ 2023.08 경력 공백: 가족 돌봄으로 휴직 및 재정비 기간
2023.09 ~ 현재 / 넥스트웨이브 / Business Operations Manager
- 운영 정책 수립
- 협업 이슈 조율
```

### PA-ENG-KW-BOUND-001 | JD keyword coverage ratio 0.5 경계
- 왜 필요한가: `ratio <= 0.5 -> medium`으로 확정한 정책이 실제 입력에서 그대로 작동하는지 검증해야 한다.
- 중복 차이: must와 keyword가 동시에 섞여 있고, keyword 6개 중 3개만 resume에 직접 남기도록 설계했다.
- 기대 출력: `keywordCoverageRatio=0.5`, `severity=medium`, `missingKeywords[]`와 `matchedKeywordCount`가 함께 기록돼야 한다.
- JD sample:
```text
포지션: Data Platform Operator
자격 요건
- SQL, Python, Airflow, Tableau, AWS, Git 활용
- 데이터 검증 및 리포트 운영
우대 사항
- 고객 대응 경험
```
- Resume sample:
```text
오세훈
Data Operations Analyst
2021.04 ~ 2025.01 / 스택랩
- SQL과 Python으로 데이터 검증 자동화
- Tableau 대시보드 운영
Skills: SQL, Python, Tableau, Excel
```

### PA-COMP-COMBO-001 | must high + keyword medium + insufficient-data 1개 조합
- 왜 필요한가: composite가 많은 케이스보다 사용자가 납득할 우선순위와 insufficient-data 분리 규칙을 제대로 보여주는지 확인해야 한다.
- 중복 차이: must, keyword, experience, achievement가 동시에 엮이도록 입력을 짧게 압축했다.
- 기대 출력: `topRisks[0]`는 must high 또는 critical, insufficient-data는 `supporting.insufficientData`로만 빠지고, `overallBand`는 `high_risk`가 되어야 한다.
- JD sample:
```text
포지션: Customer Data QA Lead
자격 요건
- SQL 데이터 검증 경험
- 바로 고객 대응 가능한 커뮤니케이션 역량
- 5년 이상 운영 또는 데이터 QA 경력
우대 사항
- Tableau 경험
- AWS 환경 경험
```
- Resume sample:
```text
한지민
Customer Support / Data Ops
2021.02 ~ 2023.12 / 클리어뷰
- MySQL 기반 운영 데이터 조회
- 이메일 고객 응대 및 이슈 triage
2024.01 ~ 현재 / 프리랜서
- 데이터 정리와 문서 작업 지원
Skills: MySQL, Excel, Notion
```

## 2026-04-13 Second Manual Session Input Set

이번 세션은 QA-SHARE-* 트랙을 제외하고 PA-* 본체 테스트만 대상으로 진행한다.  
이전(2026-04-12) 세션과 다른 입력셋을 사용해 동일 케이스의 재현성과 입력 민감도를 확인한다.

---

### PA-EXT-RES-REC-001 | 서술형 employment period 추출 (2차 입력)
- 왜 필요한가: 이전 세션 실패 패턴 재현 — 서술형 기간 표현이 여전히 regex miss인지, 아니면 AI parse에서 단서가 남는지 확인.
- 중복 차이: 이전 입력보다 더 전형적인 "상반기/말까지" 패턴 + 짧은 gap 언급 포함.
- 기대 출력: fit.resume.structured.employmentPeriods[] 비거나 최소화, parsedResume.timeline에 일부 단서 잔존 여부 확인.
- 실행 상태: 코드 분석 기반 예측 기록 (브라우저 실행 미완료)
- JD sample:
```text
[포지션]
운영 매니저

[소개]
이 역할은 고객 이슈를 빠르게 파악하고 내부 유관부서와 협업해 해결하는 역할입니다.

[주요 기대 역할]
- 운영 현황을 점검하고 문제를 정리합니다.
- 고객 문의와 이슈를 우선순위에 따라 관리합니다.
- 데이터 기반으로 운영 이상 징후를 확인합니다.

[지원자에게 기대하는 점]
이 역할에서는 SQL 기반 데이터 검증 경험이 필요합니다.
채용 후 바로 고객 대응이 가능해야 합니다.
여러 부서와 협업하며 운영 이슈를 끝까지 정리한 경험이 있으면 좋습니다.

[우대]
SaaS 또는 플랫폼 운영 경험
```
- Resume sample:
```text
홍길동
B2B SaaS 운영/기획

요약
- 운영 프로세스 개선과 이슈 대응 체계 정비를 중심으로 일했습니다.
- 고객 대응부터 내부 운영 안정화까지 폭넓게 경험했습니다.

경력
- A사 운영기획팀, 2021년 상반기부터 2023년 말까지 근무
- 입사 후 약 2년 반 동안 운영 정책 정비, VOC 대응 프로세스 개선, 내부 협업 체계 문서화 수행
- 퇴사 후 2024년 상반기에는 개인 프로젝트와 이직 준비 병행

핵심 경험
- VOC 분류 체계 재정리
- 운영 정책 문서 개편
- 이슈 대응 흐름 표준화
```

---

### PA-EXT-RES-REC-002 | 숫자 없는 성과 표현 추출 (2차 입력)
- 왜 필요한가: 날짜 정보 자체가 없을 때 achievements 레이어가 어떻게 동작하는지 확인. 이전 세션에서는 날짜가 있었으나 achievements가 비었음.
- 중복 차이: 이번 입력은 날짜도 없고 성과 동사만 남김 — 가장 극단적인 recall gap 케이스.
- 기대 출력: parsedResume.achievements[] 또는 timeline[].bullets[]에 성과성 동사 문장 잔존 여부.
- 실행 상태: 코드 분석 기반 예측 기록
- JD sample:
```text
김민수
사업운영 / CX

요약
- 고객 경험 개선과 운영 안정화를 중심으로 일했습니다.

경력
- B사 CX/운영 담당
- 고객 문의 응대 프로세스를 재정비하고, 협업 부서 간 전달 흐름을 단순화했습니다.
- 반복적으로 발생하던 이슈 대응 체계를 정리해 운영 안정화에 기여했습니다.
- 신규 담당자 온보딩 문서를 정리해 적응 시간을 줄였습니다.
- 여러 부서와의 협업 과정에서 요청 누락을 줄이는 방향으로 운영 체계를 손봤습니다.
```

---

### PA-EXT-JD-REC-001 | 설명문장형 must requirement 추출 (2차 입력)
- 왜 필요한가: 이전 세션에서 "excel"이 우대 항목에서 must로 오염됐음. 이번 입력은 우대에 Excel이 없어 오염 여부를 재확인 가능.
- 중복 차이: [지원자에게 기대하는 점] 헤더 아래 서술문형 must만 남기고, 우대 항목에 비기술 항목("SaaS 경험")만 포함.
- 기대 출력: mustHave[]에 "sql" 포착 + 고객 대응 미포착 or PARTIAL, excel 오염 없음.
- 실행 상태: 코드 분석 기반 예측 기록 — 이전 세션 대비 개선 가능성 있음
- 입력: 위 PA-EXT-RES-REC-001의 JD sample 동일 사용 (운영 매니저 JD)
- Resume sample:
```text
(PA-EXT-RES-REC-001의 홍길동 Resume 사용)
```

---

### PA-REG-KW-BUG-001 | SQL / MySQL precision trap (2차 입력)
- 왜 필요한가: 이전 세션에서 domainKeywords=[]로 엔진 미기동. 이번 입력은 JD가 더 단순해 sql 추출 가능성이 높아 precision trap 직접 확인 목표.
- 중복 차이: JD 필수 항목이 짧고 명확하며 SQL 단독으로 노출됨. Resume에 MySQL만 명시.
- 기대 출력: domainKeywords=["sql"], MySQL substring → matched=true (precision trap 확인).
- 실행 상태: 코드 분석 기반 예측 — 이전 세션 실패 원인 해소 가능성 높음
- **[keyword patch 후 재테스트 목적 (2026-04-13)]**: input generation 이후에도 precision trap이 남는지 확인하는 MVP 허용성 판단 케이스. 이번 케이스는 이제 input generation failure가 아니라 precision trap 자체를 더 직접적으로 보는 재검증이다.
- **[keyword patch 재테스트 결과 (2026-04-13)]**: domainKeywords=["SQL","지표 관리"] 2개 생성(✓). "sql" ⊂ "mysql" substring match → matched=true, precision trap 확인됨. ratio=0.5, severity=medium. 결론: precision trap은 현재 MVP 허용 범위 내 정확도 한계 — SQL 단독 JD에서 MySQL만으로 커버 판정은 실제 역량과 무관한 오탐. 즉시 수정 후보보다는 accuracy 백로그로 유지. 결론이 PASS/FAIL보다 MVP 허용 여부와 수정 우선순위 판단 근거가 더 중요하다.
- JD sample:
```text
[포지션]
데이터 운영 담당

[필수]
- SQL을 활용해 데이터 검증이 가능하신 분
- 운영 지표를 직접 확인하고 이상값을 찾을 수 있는 분
```
- Resume sample:
```text
박지훈
운영 데이터 어시스턴트

기술
- MySQL
- Google Sheets
- Excel

경험
- MySQL로 조회 쿼리를 일부 수정해 요청 대응
- 운영 데이터 확인 보조
```

---

### PA-REG-ACH-BUG-001 | "5년 경력" achievement 오탐 (2차 입력)
- 왜 필요한가: 날짜 정보를 더 단순하게 제거해 parse 실패를 줄이고 "5년 경력" 오탐 여부에 집중.
- 중복 차이: 이전 입력은 YYYY.MM 날짜가 있었음. 이번은 날짜 완전 제거, 숫자 표현만 남김.
- 기대 출력: achievements[]에 "5년 경력"/"3개 조직" 오탐 여부.
- 실행 상태: 코드 분석 기반 예측
- JD sample: (생략 — 운영 관련 일반 JD)
- Resume sample:
```text
이수진
서비스 운영

요약
- 총 5년 경력의 운영 담당자입니다.
- 3개 조직에서 근무했습니다.

경력
- 서비스 운영 및 고객 대응
- 내부 문서 관리
- 이슈 접수 및 전달
```

---

### PA-REG-GAP-BUG-001 | 12개월 이상 공백 + 설명 한 줄 과완화 회귀 (2차 입력)
- 왜 필요한가: 이전 세션 실패 원인("2022.07 ~ 2023.08 경력 공백:" 형식이 period로 흡수)이 재현되는지, 아니면 별도 섹션 분리 시 해소되는지 확인.
- 중복 차이: 공백 설명을 "YYYY.MM ~ YYYY.MM 경력 공백:" 형식이 아닌 별도 "공백 설명" 섹션으로 분리. period 오인식 위험 감소.
- 기대 출력: maxGapMonths≥12, describedGapCount=1, severity=medium.
- 실행 상태: 코드 분석 기반 예측 — 이전 실패 원인 해소 가능성 있음
- JD sample: (생략 — 4년 이상 운영 경력 요건)
- Resume sample:
```text
최현우
운영기획

경력
- C사 운영기획팀 2020.01 ~ 2021.12
- 이후 2023.02 ~ 2024.03 D사 운영지원

공백 설명
- 개인 사정으로 휴식기를 가진 뒤 재취업 준비를 했습니다.
```

---

### PA-ENG-KW-BOUND-001 | JD keyword coverage ratio 0.5 경계 (2차 입력)
- 왜 필요한가: 이전 세션에서 domainKeywords=[]로 boundary 확인 실패. 이번 입력으로 keyword seed가 달라질 경우 영향 확인.
- 중복 차이: JD 필수 항목을 기술형(SQL) + 업무형(고객 대응, 운영 리포트) 혼합으로 변경. Resume에는 업무형 2개만 있음.
- 기대 출력: keywordCoverageRatio=0.5(이상적), severity=medium. 단 domainKeywords가 SQL만 추출될 경우 ratio=0으로 달라질 수 있음.
- 실행 상태: 코드 분석 기반 예측 — 이전 실패 원인 부분 해소 여부 불확실
- **[keyword patch 후 재테스트 목적 (2026-04-13)]**: __extractJdDomainKeywordsOpsIT 패치 이후 domainKeywords 복수 생성 여부 확인. boundary 0.5 도달 가능 여부 검증. 이번 재테스트는 input generation failure가 아니라 실제 boundary 검증이 가능한 상태인지 확인하는 케이스로 전환됐다.
- **[keyword patch 재테스트 결과 (2026-04-13)]**: domainKeywords=["SQL","리포트","고객 대응","유관부서 협업","협업"] 5개 생성(✓). ratio=0.4, 보조 조건(missing=3, mustMiss≥2) → severity=high. PARTIAL — engine testable, boundary=0.5는 미도달. 이전 세션 domainKeywords=[] → 5개로 개선됨.
- JD sample:
```text
[포지션]
사업운영 담당

[필수]
- SQL
- 고객 대응
- 운영 리포트 작성
- 유관부서 협업
```
- Resume sample:
```text
정다은
사업운영

경험
- 고객 대응 경험 보유
- 운영 리포트 작성 경험 보유

기술
- Excel
```

---

### PA-COMP-COMBO-001 | must high + experience high + insufficient-data 조합 (2차 입력)
- 왜 필요한가: composite가 많은 케이스보다 insufficient-data 분리와 topRisks 우선순위를 납득 가능하게 보여주는지 확인. 이전 세션과 유사 패턴이지만 입력 단순화.
- 중복 차이: 경력 기간이 명확히 1년 2개월로 짧고, "세부 성과는 이력서에 별도로 정리하지 않음" 명시로 achievement insufficient-data 확인 용이.
- 기대 출력: must critical/high + experience high + achievement/keyword insufficient-data → supporting, overallBand=high_risk.
- **[keyword patch 후 재테스트 목적 (2026-04-13)]**: keyword input stabilization 이후 composite completeness 회복 여부 확인. keyword 리스크가 실제로 생성되면서 composite completeness가 얼마나 회복됐는지 보는 케이스. must 우선 정렬과 insufficient-data 분리 규칙 유지 여부 함께 확인.
- **[keyword patch 재테스트 결과 (2026-04-13)]**: domainKeywords=["SQL","이슈 대응"] 2개 생성(✓). ratio=0/2=0, severity=high → keyword 엔진 실제 risk 생성(이전 insufficient-data에서 개선). topRisks=[must(critical/high), experience(high), keyword(high)], supporting.insufficientData=[achievement]. overallBand=high_risk. PARTIAL — keyword medium이 아닌 high로 나와 원래 의도한 3-way 조합(must+keyword-medium+insufficient-data)은 미완. composite 이전보다 완전해짐. 이번 재테스트는 composite 정책 재검증이 아니라 keyword input stabilization 이후 조합 completeness를 확인하는 목적이다.
- 실행 상태: 코드 분석 기반 예측
- JD sample:
```text
[포지션]
운영 데이터 매니저

[필수]
- SQL 활용 데이터 검증 경험
- 5년 이상 운영 또는 데이터 관련 경력
- 고객 이슈 대응 경험
```
- Resume sample:
```text
윤재호
운영지원

경력
- 2023.01 ~ 2024.02 운영지원 담당
- 고객 문의 1차 응대
- 운영 리포트 보조 작성

기술
- Excel
- Google Sheets

추가 정보
- 세부 성과는 이력서에 별도로 정리하지 않음
```
