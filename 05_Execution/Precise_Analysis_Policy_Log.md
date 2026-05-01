# Precise Analysis 정책 정리 로그

## 문서 목적
이 문서는 preciseAnalysis MVP 엔진 중 정책 흔들림이 남아 있는 부분을 실행 관점에서 기록하고, 다음 라운드의 우선순위를 고정하기 위한 실행 로그다.

## 현재 기준선
공통 contract와 1차 MVP 핵심 엔진 5개는 구현 완료 상태다.  
따라서 다음 실행의 초점은 새 엔진 추가가 아니라, 현재 엔진의 정책 정리와 정합성 보강에 둔다.

## 엔진별 실행 메모

### 1. 필수요건 미충족
- 상태: 가장 많이 닫힌 엔진
- 현재 판단: 지금 당장 재작업 우선순위는 낮음
- 남은 이슈: 문자열 표기 흔들림, 표현 다양성 한계
- 메모: normalize 라운드와 QA 정합성 수정이 이미 반영되어 있으므로, 현 시점에서는 보류 가능

### 2. 연차/레벨 불일치
- 상태: MVP 기준 구현 완료
- 현재 판단: 총 경력 기반 엔진으로는 충분히 유효
- 남은 이슈: 관련 경력 부족까지는 설명하지 못함
- 메모: 향후 "직무 핵심 경험 부족" 계열 엔진과 함께 읽는 구조가 필요하지만, 현재 엔진 자체를 다시 뜯어고칠 단계는 아님

### 3. 성과 검증 불가
- 상태: 구현 완료, 보정 후보 존재
- 현재 흔들림:
  - 정량 표현 감지가 넓어 비성과 숫자까지 성과로 잡힐 가능성 있음
  - 예: "5년 경력", "3개 팀 협업"
- 다음 라운드 질문:
  1. 현재 오탐 범위를 MVP에서 허용할지
  2. 성과 동사/숫자/결과 표현을 더 좁힐지
  3. insufficient-data를 더 자주 쓰는 방향이 맞는지
- 현재 권장:
  - 즉시 구조 변경보다는 정책 판단 먼저
  - MVP에서는 유지 가능하되, accuracy 라운드 우선 후보로 등록

### 4. JD 키워드 반영 부족
- 상태: 구현 완료, 현재 최우선 정책 정리 대상
- 현재 흔들림:
  - substring 매칭으로 인한 오탐 가능성
  - spec과 구현의 medium 기준 차이
- 다음 라운드 질문:
  1. medium 조건을 spec 기준으로 맞출지 구현 기준으로 문서를 맞출지
  2. keyword matching을 토큰 경계 기준으로 더 엄격히 볼지
  3. 현재 coverage ratio와 missingKeywords 노출 정책을 그대로 갈지
- 현재 권장:
  - 이 엔진은 사용자 체감이 크므로 가장 먼저 정책을 닫아야 함
  - 다음 정책 라운드의 1순위 대상

### 5. 공백/이직 설명 부재
- 상태: 구현 완료, 정책 과완화 가능성 존재
- 현재 흔들림:
  - 설명 신호가 하나라도 있으면 none으로 많이 완화됨
  - 현실 채용 관점에서는 너무 낙관적일 수 있음
- 다음 라운드 질문:
  1. 설명 신호 하나만으로 none 완화가 맞는지
  2. gap length와 explanation signal을 함께 봐야 하는지
  3. explanation이 있어도 medium을 남겨야 하는 구간이 필요한지
- 현재 권장:
  - 다음 정책 라운드의 1순위급 보정 후보
  - JD 키워드 반영 부족과 함께 가장 먼저 닫아야 할 엔진

## composite/top3 설계 라운드 (2026-04-12)

### 조사 결과
- 엔진 5개 중 4개가 category=fatal, 1개(jd_keyword_coverage_gap)가 category=important
- 기존 PreciseAnalysisFlow.jsx는 stash에서 2개(must, experience)만 소비 — 나머지 3개 미연결
- composite aggregator 파일 없음 → 신규 생성
- must 엔진은 insufficient-data 모드 없음; 나머지 4개는 `raw.*PolicyMode === "insufficient-data"` 감지

### 설계 결론

**top3 포함 규칙**
- `triggered === true` AND `severity in [critical, high, medium]`
- low → `supporting.lowRisks`
- insufficient-data → `supporting.insufficientData`
- 후보 < 3 시 패딩 없이 있는 것만 반환

**정렬 규칙**
- severity 내림차순(critical=4, high=3, medium=2)
- category 내림차순(fatal=2, important=1)
- tie-break: 엔진 선언 순서(must>experience>achievement>gapExplanation>jdKeyword)

**overall band**
- `high_risk`: fatal 엔진에서 critical/high → "서류 통과 저해 리스크 있음"
- `warning`: medium 이상 triggered → "보완이 필요한 리스크 존재"
- `caution`: low only triggered → "경미한 리스크 주의"
- `pass`: triggered 없음 → "전반적으로 양호"

**숫자 점수 불채택** — 자의적 기준, 사용자 체감 불명확, band/label이 MVP에 적합

### 패치 여부: 완료
- `src/lib/preciseAnalysis/buildCompositeRisk.js` 신규 생성 (pure function, 기존 파일 미수정)

### 다음 액션
1. App.jsx stash 블록에 `buildCompositeRisk` 호출 추가 → `compositeRisk` key 추가
2. PreciseAnalysisFlow.jsx useMemo에서 5개 전체 소비 + composite 결과 렌더링
3. PreciseAnalysisFlow.jsx UI read path 연결은 별도 UI 라운드에서 진행

---

## UI read path 연결 라운드 (2026-04-12)

### 수정 파일
1. `src/App.jsx` — `buildCompositeRisk` import 추가 + stash 블록에 composite 호출/저장
2. `src/components/input/PreciseAnalysisFlow.jsx` — composite read path 연결 + 5 그룹 렌더링

### 연결 방식
- App.jsx stash 블록: `buildCompositeRisk([__mustGap, __expGap, __achGap, __kwGap, __gapGap])` 호출
- stash에 `riskResults`, `compositeRisk` 키 추가 (기존 5개 엔진 키 유지)
- PreciseAnalysisFlow.jsx: `compositeData = debugStore?.compositeRisk` useMemo로 읽기

### result shape read 방식
- `compositeData.summary` → overall summary 카드 (overallBand badge + label + reason + count)
- `compositeData.topRisks[]` → 핵심 리스크 섹션 (max 3, severity badge 포함)
- `compositeData.supporting.insufficientData[]` → 추가 정보 필요 섹션 (단순 정보 칩)
- `compositeData.supporting.lowRisks[]` → 함께 점검하면 좋은 항목 섹션
- `passedRisks`: 이번 라운드 렌더 제외 (리스크 없음 항목 목록은 UX 가치 낮음)

### BAND_UI / SEVERITY_BADGE
- 모듈 레벨 상수로 PreciseAnalysisFlow.jsx 내 정의
- overallBand 4단계 → wrapClass / badgeClass / label / badgeText 매핑
- severity 4단계 → badge cls / text 매핑 (ResultRiskCard 내 렌더)

### 남은 UI TODO
- passedRisks 렌더링 (필요 시 collapsed 영역으로 추가 가능)
- 전체 없을 때(compositeData === null) fallback 메시지 보강
- 문구/색상 fine-tuning 라운드
- CTA 섹션 A/B 실험 hook 연결 (별도 라운드)

---

## accuracy 후보 조사 라운드 (2026-04-13)

이번 라운드는 실패 케이스를 다시 돌리는 것이 아니라, 왜 흔들렸는지 owner 기준으로 분해하는 조사 라운드다.  
현재 흔들림 중 일부는 엔진 정책 실패가 아니라, extraction/input generation의 recall 한계에서 시작된다.  
특히 keyword boundary와 achievement precision 일부는 엔진 이전 단계가 먼저 안정화되어야 제대로 검증할 수 있다.  
즉시 패치보다, 어떤 이슈가 작은 수정으로 개선 가능한지 우선순위를 잠그는 것이 이번 라운드의 목적이다.

### 조사 범위

- 조사 파일: `src/lib/fit/jdResumeFit.js`, `src/lib/parse/parseWithAI.js`, `src/lib/preciseAnalysis/buildAchievementEvidenceGapRisk.js`, `src/lib/preciseAnalysis/buildJdKeywordCoverageGapRisk.js`
- 대상 케이스: PA-EXT-RES-REC-001, PA-EXT-RES-REC-002, PA-REG-ACH-BUG-001, PA-ENG-KW-BOUND-001

---

### PA-EXT-RES-REC-001 — 서술형 employment period 추출 실패

**직접 원인**

`jdResumeFit.js`의 `__extractResumeEmploymentPeriods()`는 4개 regex 패턴만 인식한다.

```
re1: YYYY.MM ~ YYYY.MM
re2: YYYY.MM ~ 현재/재직중/present
re3: YYYY년 M월 ~ YYYY년 M월
re4: YYYY년 M월 ~ 현재/재직중
```

"2021년 상반기부터 2023년 말까지", "약 2년 반", "퇴사 후 2024년 상반기"는 어느 패턴에도 해당하지 않아 `employmentPeriods=[]`로 반환된다.  
`parsedResume.timeline`은 AI가 회사/역할 단서를 추출하더라도 정확한 월(month)이 없으면 start/end가 null이 되며, `buildExperienceLevelGapRisk`는 `fit.resume.structured.employmentPeriods[]`만 읽고 parsedResume.timeline.start/end를 읽지 않는다.

현재는 regex 중심 기간 추출에 기대고 있어 서술형 기간 표현 recall이 약하다. 완전한 날짜 구조화가 안 되더라도 보조 기간 단서를 별도 레이어에 남길 필요가 있는지 검토가 필요하다.

**owner**: `jdResumeFit.js` — `__extractResumeEmploymentPeriods()`

**분류**: 미지원 입력형 (regex contract 밖의 표현 형식)

**패치 가치 판단**: NO (지금 당장)
- "상반기" → 몇 월인지 정확한 매핑 불가 (3월? 6월?), 추정값이 연차 엔진에 오류를 유발할 수 있음
- 완전한 서술형 날짜 처리는 NLP 범위로, MVP 우선순위보다 높지 않음
- 작은 수정(`YYYY년 상반기 → YYYY-03`)은 기술적으로 가능하나 오차를 허용해야 함

**다음 재테스트 제안**: 날짜를 `YYYY.MM` 형식으로 일부 포함한 입력 변형 사용. 완전 서술형 recall은 accuracy backlog로 분리.

---

### PA-EXT-RES-REC-002 — 숫자 없는 성과 표현 추출 실패

**직접 원인**

두 단계 게이트가 순차적으로 막힌다.

1. **parseWithAI 레이어**: resume에 날짜/회사가 없으면 timeline 항목을 생성하지 않는다. AI 가이드 "timeline은 '회사/역할 + 기간'이 보이면" 조건 미충족.
2. **buildAchievementEvidenceGapRisk 레이어**: `achievements=[]` AND `timeline[].bullets=[]` → insufficient-data 반환. 엔진이 정책 판정 자체를 건너뜀.

숫자 없는 성과 표현이 extraction recall 한계인지, 엔진 정책 문제가 아니라 입력 확보 문제인지 먼저 구분해야 한다.  
이 케이스는 1단계(parsedResume 비어있음)와 2단계(성과 동사 감지 정책) 문제가 구분되어야 한다.

`_QUANT_RE = /\d+|%|배(?!\s*경)|건|명|원|억|증가|감소|개선|향상|절감|달성|확대|축소|성장|상승|감축/`

"재정비", "단순화", "표준화"는 `_QUANT_RE`에 없음. 단, "개선", "향상"은 포함됨. 즉 bullets에 "프로세스 개선"이 남으면 quantified로 인식된다. 문제는 bullets 자체가 안 남는다는 것.

**owner**: `parseWithAI.js` (1차 gate) + `buildAchievementEvidenceGapRisk.js` (2차 정책)

**분류**: 미지원 입력형 (날짜 없는 resume는 현재 AI parse timeline 생성 계약 밖)

**패치 가치 판단**: PARTIAL (지금 당장은 NO, 단 작은 개선 가능)
- parseWithAI prompt에 "날짜 없어도 역할+회사 단서만 있으면 timeline 생성" 유도 문장 추가 → 작은 수정으로 timeline 생성률 개선 가능
- `_QUANT_RE`에 "정비", "표준화", "단순화" 등 일반 운영 동사 추가는 precision 손실 위험 있어 신중 검토 필요

**다음 재테스트 제안**: 날짜를 추가한 입력 변형(회사/기간 포함)으로 테스트. "숫자 없는 성과 동사"가 AI parse에서 bullets로 남는지 별도 확인.

---

### PA-REG-ACH-BUG-001 — parse 실패 선행으로 achievement precision trap 검증 불가

**직접 원인**

이 케이스는 현재 precision bug 자체보다, precision bug를 검증할 수 없는 extraction gate 문제가 먼저 드러난 경우다.

`buildAchievementEvidenceGapRisk`의 insufficient-data 분기:

```js
if (!parsedResume || (achievementsCount === 0 && timelineBulletCount === 0)) {
  // insufficient-data 반환 — 엔진 정책 판정 진입 안 함
}
```

PA-REG-ACH-BUG-001 입력(이수진)은 날짜 없음 + 경력 bullets 없음 → parsedResume.timeline=[], achievements=[] → insufficient-data.  
"총 5년 경력"/"3개 조직"은 parsedResume.summary 필드에 들어가더라도, buildAchievementEvidenceGapRisk는 summary를 읽지 않는다. achievements[]와 timeline[].bullets[]만 읽는다.

precision trap 자체의 실제 동작: `_QUANT_RE`에 `\d+`가 포함되어 있어, "5년"/"3개"처럼 숫자가 있는 문장이 timeline bullet에 들어가면 `isQuantified=true`로 잡힌다. 즉 precision bug는 실재한다. 다만 검증하려면 입력이 parser contract 안에 있어야 한다.

**owner**: `parseWithAI.js` (extraction gate 선행) + `buildAchievementEvidenceGapRisk.js` (summary 미소비 구조)

**분류**: 미지원 입력형 (테스트 입력이 현재 parser contract 밖) — precision bug 자체는 실재하나 현재 gate에서 먼저 걸림

**패치 가치 판단**: NO (지금 당장 precision trap 패치 불필요)
- precision trap을 검증하려면 테스트 입력 재설계가 먼저
- parser contract 안에 드는 입력(날짜 있음 + bullets에 "5년 경력" 포함)으로 재검증 필요
- precision 오탐이 실제 발생하면 `_QUANT_RE`에서 순수 숫자(`\d+`) 단독 조건을 제거하거나 날짜/경력 패턴 예외 처리 검토 가능

**다음 재테스트 제안**: "2020.01 ~ 2024.01" 날짜 포함 + bullets에 "5년 경력의 운영 총괄" 명시한 변형 입력 사용.

---

### PA-ENG-KW-BOUND-001 — keyword 추출 부족으로 ratio 0.5 boundary 검증 불가

**직접 원인 — 가장 중요한 발견**

`jdResumeFit.js`의 `__extractJdDomainKeywords()`는 **HR/People 도메인 전용** 추출기다.

```js
// V3, V2, fallback 세 버전 모두 동일한 bucket 사용:
HRBP / HR전략 / 조직진단 / 인력전략 / 조직구조 / 성과관리 / 보상 / 직원관계 / 조직이슈대응 / HR데이터
```

SQL, Python, Airflow, Tableau, AWS, Git, MySQL, Excel 등 IT/운영 domain 키워드는 어떤 JD를 입력해도 `domainKeywords=[]`로 반환된다.  
`buildJdKeywordCoverageGapRisk`는 `domainKeywords=[]`이면 즉시 `keywordPolicyMode=insufficient-data`를 반환하고 ratio 계산 자체를 하지 않는다.

이 케이스는 keyword 엔진 경계 실패라기보다, 경계를 검증하기 위한 입력 생성이 부족해 testability가 떨어진 경우다. 정확히는 `__extractJdDomainKeywords`의 도메인 스코프가 HR로 고정되어 있어 운영/IT JD에서는 도메인 키워드 자체가 생성되지 않는다.

**owner**: `jdResumeFit.js` — `__extractJdDomainKeywords()` (도메인 스코프 제한)

**분류**: 정확도 한계 (설계 범위 제한 — HR 전용 추출기가 일반 도메인을 커버하지 못함)

**패치 가치 판단**: YES — 우선순위는 높으나 수정 범위가 크다
- 현재 preciseAnalysis 대상 JD(운영/데이터/IT 직무)에서 keyword 엔진이 항상 insufficient-data로 빠지는 구조적 문제
- 수정 방향: `__extractJdDomainKeywordsStructuredV3`에 IT/운영 도메인 bucket 추가 또는 별도 general-purpose 추출 함수 신설
- 단, `__extractJdDomainKeywords`는 `jdResumeFit.js` 내 여러 경로에서 호출되므로 다른 흐름에 영향 없는지 확인 필요
- 작은 수정안: SQL/Python/Excel 등 빈도 높은 IT/운영 키워드 bucket을 V3 함수에 추가

**다음 재테스트 제안**: `domainKeywords`를 강제로 설정하거나, 수정 후 SQL/Python 등이 domainKeywords에 포함될 때 ratio=0.5 boundary가 의도대로 작동하는지 확인.

---

### 다음 패치 우선순위

| 순위 | 케이스 | 분류 | 패치 가치 | 수정 범위 |
|---|---|---|---|---|
| 1 | PA-ENG-KW-BOUND-001 | 정확도 한계 | YES | `__extractJdDomainKeywords` IT/운영 도메인 확장 |
| 2 | PA-EXT-RES-REC-002 | 미지원 입력형 | PARTIAL | `parseWithAI` prompt 조정 (날짜 없어도 timeline 생성) |
| 3 | PA-EXT-RES-REC-001 | 미지원 입력형 | NO | accuracy backlog — 서술형 날짜 regex 확장은 오차 포함 |
| 4 | PA-REG-ACH-BUG-001 | 미지원 입력형 (gate) | NO | 테스트 입력 재설계 먼저 — precision trap은 gate 해소 후 재검증 |

### 다음 1순위

`__extractJdDomainKeywords`에 운영/IT 도메인 bucket 추가 — 이것만 해결되면 keyword 엔진이 운영/데이터 JD에서 정상 작동하고, PA-ENG-KW-BOUND-001 boundary 검증도 가능해진다.

---

## PA-* 첫 테스트 실행 라운드 (2026-04-13)

### 왜 QA-SHARE-*를 이번 라운드에서 제외했는가

이번 라운드는 PA-* 본체 테스트(Extraction / Engine / Composite / Regression)만 대상으로 한다.  
QA-SHARE-* 케이스는 이미 별도 QA 트랙으로 분리됐으며, `05_Execution/Precise_Analysis_QA_Log.md`에서 관리한다.  
두 트랙을 섞으면 환경 실패와 기능 실패를 구분할 수 없게 되며, 공유/복원 검수가 PA-* 정확도 테스트로 잘못 기록될 수 있다.

이번 첫 실행 세션은 QA-SHARE-*와 겹치지 않도록 PA-* 본체 테스트만 대상으로 진행했다.

### 왜 extraction recall을 먼저 돌렸는가

extraction recall trap은 엔진 판정보다 앞단의 입력 신뢰도를 확인하는 기준선으로 먼저 실행했다.  
JD/Resume 입력 신뢰도가 무너지면 must/keyword/achievement/gap/composite 어느 엔진도 해석 기준선을 만들 수 없다.  
이번 세션에서도 동일하게 extraction recall 실패가 연쇄적으로 엔진 insufficient-data로 이어졌다.

precision trap은 즉시 패치 여부보다, MVP 허용인지 accuracy 라운드 후보인지 판단 근거를 남기는 데 초점을 맞췄다.  
composite는 많은 케이스보다 top3 우선순위와 insufficient-data 분리 규칙 확인을 우선했다.  
첫 테스트 세션의 목적은 완전한 PASS보다 "어디가 흔들리는지 usable하게 기록하는 것"이다.

### 실제로 흔들린 항목

| 케이스 | 판정 | 원인 |
|---|---|---|
| PA-EXT-RES-REC-001 | FAIL | "상반기/말까지" 서술형 기간 regex miss — 이전 세션 동일 패턴 |
| PA-EXT-RES-REC-002 | FAIL | 날짜 완전 부재 + 정성 동사형 bullets, parse 구조화 불가 |
| PA-EXT-JD-REC-001 | PARTIAL | sql 포착 가능, 고객 대응 요건 구조화 어려움. Excel 오염은 이번 입력에서 해소 |
| PA-REG-KW-BUG-001 | PARTIAL | domainKeywords=["sql"] 추출 가능성 높아져 precision trap 확인 기대 (실행 필요) |
| PA-REG-ACH-BUG-001 | FAIL | 날짜 없어 parse 실패 선행 — precision trap 검증 전에 insufficient-data |
| PA-REG-GAP-BUG-001 | PARTIAL | 공백 설명 별도 섹션 분리로 period 오인식 위험 낮아짐 — regression 해소 기대 |
| PA-ENG-KW-BOUND-001 | FAIL | domainKeywords가 sql 1개 이하 — ratio 0.5 boundary 확인 불가. 입력 재설계 필요 |
| PA-COMP-COMBO-001 | PARTIAL | composite 구조 유지, keyword medium 미생성으로 3-way 조합 불완전 |

### 유지 / accuracy 후보 / 즉시 수정 후보 분류

**유지**:
- composite top3 우선순위와 insufficient-data 분리 규칙
- must 엔진 우선 정렬(fatal 카테고리)
- 기록 우선, 패치 후행 원칙

**accuracy 후보**:
- PA-EXT-RES-REC-001, PA-EXT-RES-REC-002: 서술형 기간 / 정성 동사 extraction recall
- PA-REG-ACH-BUG-001: precision trap 전용 입력 재설계 필요
- PA-ENG-KW-BOUND-001: boundary 확인용 JD 입력 재설계(기술형 keyword 6개 명시)
- PA-REG-KW-BUG-001: 실제 브라우저에서 precision trap 확인 후 MVP 허용 여부 판정

**즉시 수정 후보**:
- 없음 (이전 세션 PA-REG-GAP-BUG-001 수정은 완료됨. 이번 입력으로 regression 해소 기대 — 실행 확인 필요)

### 다음 1순위
- 실제 브라우저 환경에서 PA-REG-GAP-BUG-001 재확인 → severity=medium이면 regression 고정
- PA-REG-KW-BUG-001 precision trap 실제 확인 → MVP 허용 여부 최종 판정
- PA-ENG-KW-BOUND-001 boundary 확인용 JD 재설계 (기술형 keyword 6개 명시한 입력 필요)

---

## 공유/복원 검수 기록 분리 라운드 (2026-04-12)

### 왜 이 검수를 gold set 본체와 분리했는가

이번 라운드는 코드 수정이 아니라 검수 기록 분리와 재검수 조건 명시가 목적이다.

공유/복원 검수는 Extraction / Engine / Composite / Regression과 목적이 다르다.  
- 기존 테스트 트랙: 제품 로직 정확도 (입력→출력 판정이 올바른가)  
- 공유/복원 검수 트랙: 배포·복원·공유 동작 (링크 생성→새 컨텍스트 복원이 작동하는가)

이 둘을 같은 버킷에 넣으면, 환경 제약으로 인한 FAIL이 제품 로직 실패처럼 기록된다.  
분리하지 않으면 다음 검수자가 기능 실패를 의심하며 같은 환경 시도를 반복하게 된다.

### 왜 FAIL이 곧 기능 실패를 의미하지 않는가

공유/복원 FAIL은 기능 실패 확정이 아니라, 현재 환경에서 E2E 완주가 불가능했던 결과다.

- Edge headless remote debugging 포트가 열리지 않아 새 브라우저 컨텍스트 전환을 재현하지 못했음
- share API 네트워크 호출이 `EACCES`로 차단되어 SID round-trip도 확인하지 못했음
- 이는 브라우저 자동화 및 외부 네트워크 제약이 직접 원인이며, 제품 코드의 동작을 확인한 결과가 아님

### 지금 확정 가능한 범위 vs 미확정 범위

**소스 계약 검수 (확정 PASS):**
- share pack에 `preciseAnalysis` payload 포함 (`src/App.jsx:3344`)
- restore 분기가 정밀 분석 결과 화면을 렌더하도록 연결 (`src/App.jsx:8686`)
- 기존 `transition-lite` 복원 분기 소스 상 유지 (`src/App.jsx:8699`)
- CTA 3종 / 공유하기 버튼 마크업 존재 (`src/components/input/PreciseAnalysisFlow.jsx`)
- `cmd /c npm run -s build` 성공

**브라우저 E2E / 실서버 round-trip (미확정):**
- 새 브라우저 컨텍스트에서 공유 링크 열기 → 결과 화면 복원
- 공유 패널 UI 실 노출 확인
- SID 저장소 왕복 실서버 round-trip

소스 기준 PASS와 브라우저 E2E FAIL을 분리 기록해야 다음 검수자가 같은 시도를 중복하지 않는다.

### 다음 1순위

실제 브라우저 remote debugging 및 외부 네트워크가 가능한 환경에서 아래 시나리오를 재수행해야 한다:  
1. 정밀 분석 결과 화면에서 `공유하기` 클릭 → 링크 복사
2. 완전히 새 브라우저 컨텍스트에서 링크 열기
3. `PreciseAnalysisFlow mode="result"` 기반 화면 / CTA 3종 / 공유하기 버튼 노출 확인
4. 기존 `transition-lite` 공유 링크도 동일 방식으로 회귀 확인

---

## 지금 당장 해야 할 실행 순서
1. 엔진 5개 운영 정리표 문서화
2. 정책 흔들리는 3개 엔진의 MVP 유지/수정 여부 결정
3. composite / top3 설계 원칙 고정
4. 추출/정규화 SSOT 초안 정리

## 흔들리는 3개 엔진
현재 다음 3개는 "정책 후보가 남아 있는 엔진"으로 분류한다.

- 성과 검증 불가
- JD 키워드 반영 부족
- 공백/이직 설명 부재

## 실행 관점 결론
현재 preciseAnalysis MVP는 엔진 추가보다 정책 마감의 ROI가 더 높다.  
따라서 다음 라운드는 반드시 "엔진 확정 라운드"로 진행해야 하며, 특히 JD 키워드 반영 부족과 공백/이직 설명 부재는 우선 정리 대상으로 본다.

---

## 엔진 확정 라운드 (2026-04-12)

### 조사 범위
- `src/lib/preciseAnalysis/buildJdKeywordCoverageGapRisk.js`
- `src/lib/preciseAnalysis/buildGapExplanationMissingRisk.js`
- `00_HQ/Precise_Analysis_MVP_Status.md`
- `05_Execution/Precise_Analysis_Policy_Log.md`
- `docs/끄적.md`

---

### 엔진 4: JD 키워드 반영 부족

#### 조사 결과
- **입력**: `fit.jd.domainKeywords[]`, `parsedResume.skills[]`, `parsedResume.summary`, `parsedResume.timeline[].bullets[]`, `resumeRawText(__resumeMerged)`
- **매칭 방식**: `_norm(coverageText).includes(_norm(kw))` — substring 기반
- **severity 분기 (keyword-check 모드)**:
  - `keywords === 0` → `insufficient-data`
  - `ratio < 0.3 OR (missing >= 3 AND mustMiss >= 2)` → `high`
  - `ratio <= 0.5` → `medium`
  - `ratio < 0.8` → `low`
  - 이상 → `none`
- **raw**: `domainKeywordCount, matchedKeywordCount, missingKeywordCount, missingKeywords[], keywordCoverageRatio, keywordPolicyMode`
- **spec 대비 차이**: spec 초안에 `medium: ratio < 0.5 OR missing >= 2` 조건이 있었으나, QA-F 케이스(5/3=0.6 → 기대값 low)와 충돌. `OR missing >= 2` 조건을 의도적으로 제거하고 `ratio <= 0.5`만 유지함.
- **substring 오탐**: `"SQL"` → `"MySQL"` 매칭 가능. MVP 범위에서는 허용 수준으로 판단.

#### 정책 결론: **B — 문서만 수정**
- 코드는 현행 유지 (`ratio <= 0.5` for medium, substring 허용)
- spec 초안의 `OR missing >= 2` 조건은 폐기 — 이 문서에서 정책 확정 기록으로 갈음

#### 패치 필요 여부: 없음
#### 다음 액션: accuracy 라운드에서 substring → token-boundary 매칭 검토 후보로 등록

---

### 엔진 5: 공백/이직 설명 부재

#### 조사 결과
- **입력**: `fit.resume.structured.employmentPeriods[]`, `parsedResume.gaps[]`, `parsedResume.transitionNarrative[]`
- **gap 계산**: `gapMonths = next.fromM - prev.toM - 1`, 임계값 `>= 2`개월
- **설명 신호**: `describedGapCount = parsedGaps.length > 0 ? parsedGaps.length : (transitionNarrative.length > 0 ? 1 : 0)`
- **패치 전 severity 분기 문제**: `describedGapCount > 0`이면 gap 크기와 무관하게 `none` 완화 — 12개월 이상 공백에도 none이 나와 현실 채용 관점 과완화 판정
- **패치 후 severity**:
  - `gapCount === 0` → `none`
  - `describedGapCount > 0 AND maxGapMonths >= 12` → `medium`
  - `describedGapCount > 0 AND maxGapMonths < 12` → `none`
  - `maxGapMonths >= 12` → `critical`
  - `maxGapMonths >= 6` → `high`
  - `maxGapMonths >= 3` → `medium`
  - 이하 → `none`

#### 정책 결론: **C — 코드 최소 수정 + 문서 동기화**
- `buildGapExplanationMissingRisk.js` severity 분기 1줄 패치 완료
  - 변경: `describedGapCount > 0 → none` 에서 `maxGapMonths >= 12 ? "medium" : "none"` 으로
- 이 문서에서 확정 정책 기록

#### 패치 필요 여부: 완료 (2026-04-12)
#### 다음 액션: `transitionNarrative` 보조 신호 품질이 낮을 경우 가중치 재검토 후보로 등록

---

## 추출/정규화 SSOT 초안 라운드 (2026-04-12)

### 조사 범위
- `src/lib/fit/jdResumeFit.js` — `__buildJdModelV1`, `__extractJdDomainKeywords`, `__extractResumeEmploymentPeriods` 등
- `src/lib/parse/parseWithAI.js` — JD/Resume 스키마, `emptyParsed` fallback
- `src/App.jsx` — jdModel bridge 코드, __resumeMerged 합성, preciseAnalysis stash 블록
- preciseAnalysis 엔진 5개 — 실제 입력 필드 확인
- `00_HQ/Precise_Analysis_Extraction_SSOT.md` — 신규 생성

### 핵심 조사 결과

1. **엔진의 실제 JD 입력 경로는 `fit.jdModel.*`이다.**  
   `window.__PARSED_JD__`나 `fit.jd.structured.*`를 엔진이 직접 읽지 않는다.  
   `buildJdResumeFit()` 내 `__buildJdModelV1()`이 JD 파싱 결과를 정규화해 `fit.jdModel`에 주입한다.

2. **엔진의 Resume 입력은 두 경로가 공존한다.**  
   - `parsedResume.*` (parseWithAI AI 추출 → window.__PARSED_RESUME__)  
   - `fit.resume.structured.employmentPeriods[]` (buildJdResumeFit regex 추출)  
   두 경로가 분리되어 있으며, 현재는 gap/성과 엔진이 각각 다른 경로를 소비한다.

3. **`parsedResume.projects[]`는 추출되지만 소비 엔진이 없다.**

4. **domainKeywords는 parseWithAI 결과를 직접 쓰지 않고, jdResumeFit 내부 regex 추출(`__extractJdDomainKeywords`)로 재생성한다.**  
   즉, AI 파싱 결과(parseWithAI.domainKeywords)와 fit.jdModel.domainKeywords는 다른 경로다.

### 현재 자산 vs 빈 구간

**이미 존재 + 엔진이 소비 중:**
- `fit.jdModel.mustHave[]`, `fit.jdModel.domainKeywords[]`, `fit.jdModel.experienceYears`, `fit.jdModel.sections.requiredLines[]`
- `fit.resume.structured.employmentPeriods[]`
- `parsedResume.summary`, `parsedResume.timeline[].bullets[]`, `parsedResume.skills[]`, `parsedResume.achievements[]`, `parsedResume.gaps[]`, `parsedResume.transitionNarrative[]`
- `__resumeMerged` (raw, keyword 커버리지 엔진 입력)

**존재하나 소비 엔진 없음 (문서화 공백):**
- `parsedResume.projects[]`
- `fit.jdModel.tools[]`, `fit.jdModel.languages[]`, `fit.jdModel.responsibilities[]`
- `fit.jd.structured.*` (jdModel 승격 이전 경로 — 엔진 미소비)

**아직 없음 (후속 후보):**
- `relatedExperienceYears` — 관련 직무 경력만 계산
- `interviewAttackPoints[]` — 면접 공격 포인트 파생
- `atsBlockerKeywords[]` — ATS 저해 키워드 구분
- `mustRequirementsGapList[]` — 필수요건 누락 목록 구조화

### 다음 1순위
- **JD/Resume field contract를 기준으로 다음 기능 추가 시 `00_HQ/Precise_Analysis_Extraction_SSOT.md`를 먼저 업데이트할 것**
- accuracy 라운드: substring → token-boundary 매칭 검토 (jd keyword 엔진)
- `parsedResume.projects[]` 소비 방안 검토 — 성과 검증 불가 엔진 보완 후보

---

## 테스트 체계 / 골드셋 라운드 (2026-04-12)

### 왜 지금 테스트 체계를 먼저 고정하는가

엔진 5개 + composite 구현이 완료된 지금, 다음 단계는 "정확도를 어떻게 검증할 것인가"다.  
추출이 흔들리면 엔진 판정도 무의미해진다 — extraction gold set을 engine gold set보다 앞단 기준선으로 먼저 잡는다.  
테스트 체계 없이 새 케이스를 계속 추가하면 중복과 기준 흔들림이 누적되므로, ID/축/분류 체계를 먼저 고정한다.

### extraction test와 engine/composite test를 분리한 이유

- extraction test: "올바른 입력이 올바르게 뽑히는가" → 기대값이 필드 추출 결과
- engine test: "올바른 입력이 올바른 severity를 내는가" → 기대값이 severity/band
- 두 레이어를 같은 케이스에서 동시에 검증하면 실패 원인 추적이 어려워진다

### 생성 문서

| 문서 | 경로 | 역할 |
|---|---|---|
| Precise_Analysis_Test_System.md | 00_HQ/ | 테스트 레이어 / 축 / ID 규칙 / 중복방지 / 승격 원칙 |
| Precise_Analysis_Test_Catalog.md | 00_HQ/ | 케이스 인덱스 (ID / 기대결과 / 한 줄 설명) |
| Precise_Analysis_Gold_Set.md | 00_HQ/ | 케이스 상세 (입력 요약 / 기대 출력 / 차이 설명) |
| Precise_Analysis_Test_Log.md | 05_Execution/ | 수동 실행 결과 기록 템플릿 |

### 테스트 ID 포맷 확정

```
PA-{LAYER}-{ENGINE}-{PURPOSE}-{NNN}
예: PA-ENG-KW-BOUND-001, PA-EXT-RES-REC-001, PA-REG-GAP-BUG-001
```

### 다음 1순위
- gold set 케이스 수동 검증 실행 (Test_Log.md에 기록)
- extraction recall trap 케이스 우선 확인 (서술형 employment period, 숫자 없는 성과 표현)
- PA-REG-KW-BUG-001 / PA-REG-ACH-BUG-001 정책 판단 — MVP 허용 vs accuracy 라운드 수정
## 2026-04-12 First Test Execution Round

### 실행 원칙
- 첫 테스트 세션은 extraction recall trap을 앞세워, 엔진 판정보다 입력 신뢰도를 먼저 점검하는 방식으로 진행했다.
- precision trap은 정책 수정 여부보다 MVP 허용 vs accuracy 라운드 후보를 가르는 기준선으로 기록했다.
- composite 테스트는 많은 케이스보다, 사용자가 실제로 납득할 우선순위와 insufficient-data 분리 규칙 확인을 우선했다.
- 테스트 실패는 곧바로 코드 수정으로 이어지지 않고, 먼저 로그와 후속 조치 분류로 남긴다.

### 왜 extraction recall을 먼저 돌렸는가
- 이번 세션 8개 중 3개를 extraction recall trap으로 먼저 배치한 이유는, JD/Resume 입력 신뢰도가 무너지면 must/keyword/achievement/gap/composite 어느 엔진도 해석 기준선을 만들 수 없기 때문이다.
- 실제 실행에서도 이 우선순위는 타당했다. 서술형 기간, 숫자 없는 성과, 설명문장형 must requirement 셋 모두에서 parse 또는 fit 정규화 레이어가 먼저 비면서 후단 엔진이 `insufficient-data` 또는 왜곡된 must 결과로 이동했다.

### 핵심 성공 포인트
- `PA-REG-GAP-BUG-001`을 통해 공백 설명 줄이 employment period로 잘못 흡수되는 현상을 실제 입력에서 재현했다. 정책 회귀 실패가 단순 severity 문제가 아니라 extraction 오인식과 연결된다는 점이 드러났다.
- `PA-COMP-COMBO-001`에서 must risk가 top1로 올라오고, insufficient-data 항목이 `supporting.insufficientData`로만 분리되는 composite 구조 자체는 유지됐다.
- 첫 세션 로그를 케이스 ID, 기대값, 실제값, pass/fail, 후속 조치까지 포함한 usable한 기준선 형태로 남겼다.

### 핵심 실패 포인트
- extraction recall 실패가 연쇄적으로 컸다. `PA-EXT-RES-REC-001`, `PA-EXT-RES-REC-002`, `PA-EXT-JD-REC-001` 모두 기대한 단서가 충분히 남지 않았다.
- JD keyword coverage 계열은 `fit.jdModel.domainKeywords[]`가 비는 케이스가 많아 `keywordPolicyMode=insufficient-data`로 빠졌다. 그래서 SQL/MySQL precision trap과 ratio 0.5 경계는 이번 세션에서 엔진 경계값 자체를 검증하지 못했다.
- achievement precision trap도 오탐 검증보다 parse 부재가 먼저 발생해, `PA-REG-ACH-BUG-001`은 엔진이 성과를 잘못 낮게 본다기보다 아예 `insufficient-data`로 돌아가는 기준선이 찍혔다.

### 분류
- 즉시 수정 후보
  - `PA-REG-GAP-BUG-001`
  - 이유: 이미 수정된 gap 정책 회귀를 확인하려던 케이스에서 공백 설명 줄이 재직 기간으로 오인식돼 `gapCount=0`, `severity=none`이 나왔다. regression 성격이므로 재오픈 우선순위가 높다.
- accuracy 후보
  - `PA-EXT-RES-REC-001`
  - `PA-EXT-RES-REC-002`
  - `PA-EXT-JD-REC-001`
  - `PA-REG-KW-BUG-001`
  - `PA-REG-ACH-BUG-001`
  - `PA-ENG-KW-BOUND-001`
  - `PA-COMP-COMBO-001`
  - 이유: 이번 라운드 실패의 대부분은 엔진 규칙보다는 extraction recall 또는 JD keyword seed 부족에서 시작됐다.
- 유지 항목
  - composite의 must 우선순위와 insufficient-data 분리 규칙 자체는 유지
  - 첫 세션 운영 원칙인 `기록 우선, 패치 후행`도 유지

### 다음 1순위
- 1순위는 `employmentPeriods`와 gap explanation line이 서로 충돌하는 입력을 정리하는 accuracy/regression 혼합 라운드다.
- 구체적으로는 `2022.07 ~ 2023.08 경력 공백: ...` 같은 설명 줄이 재직 구간으로 파싱되지 않도록 막고, 그 다음 서술형 기간 표현과 설명문장형 must requirement recall을 다시 측정해야 한다.

---

## keyword input generation 확장 패치 라운드 (2026-04-13)

### 패치 목적
PA-ENG-KW-BOUND-001 실패의 직접 원인인 `__extractJdDomainKeywords` coverage 부족을 최소 패치로 개선.  
"운영/데이터/IT 성격 JD에서 domainKeywords가 0~1개로 무너져 keyword 엔진 경계 테스트 자체가 불가능한 상태"를 복구하는 것이 목표.

### 수정 owner
- 파일: `src/lib/fit/jdResumeFit.js`
- 신규 함수: `__extractJdDomainKeywordsOpsIT(rawText)` (line 592 이후 삽입)
- 수정 함수: `__extractJdDomainKeywords(rawText)` — append-only merge 구조 적용

### before 문제
- `__extractJdDomainKeywords`는 HR/People 도메인 전용이었음
- V3/Structured/Korean/English 경로 모두 HRBP, HR전략, 조직진단, 인력전략, 조직구조, 성과관리, 보상, 직원관계, 조직이슈대응, HR데이터 10개 버킷만 보유
- SQL, Python, AWS, 고객대응, 운영기획, 유관부서협업 등 어떤 운영/데이터 JD 입력에도 domainKeywords=[] 반환
- `buildJdKeywordCoverageGapRisk`가 insufficient-data로 빠져 엔진 자체 테스트 불가

### after 기대 효과
- 운영/데이터/IT JD에서 domainKeywords[] 2개 이상 생성
- `buildJdKeywordCoverageGapRisk` 정상 기동 (insufficient-data 방지)
- PA-ENG-KW-BOUND-001 retest 가능 상태 복구
- PA-REG-KW-BUG-001 precision trap 검증 가능 상태 복구
- PA-COMP-COMBO-001 keyword medium 조합 검증 가능성 향상

### HR 전용 → 운영/데이터/IT bucket 확장 내용
`__extractJdDomainKeywordsOpsIT` 신규 함수에 4개 계열 23개 버킷 추가:

**데이터/분석 계열**: SQL, Excel/spreadsheet/스프레드시트, 데이터 분석, 지표/KPI/OKR, 리포트/보고서작성/reporting, Dashboard/대시보드, Tableau, Power BI, Google Analytics/GA4

**운영/프로세스 계열**: 운영관리/운영기획/서비스운영, 고객대응/CX/VOC, CS/고객서비스, 이슈대응/장애대응

**협업/관리 계열**: 유관부서/cross-functional, 협업/stakeholder/collaboration, 프로젝트관리/project management

**도구/시스템 계열**: Python, AWS, CRM, ERP, Jira, Google Sheets/구글스프레드시트

### 정책 변경 없음
- keyword engine policy 변경 없음 (severity 임계값, ratio 계산 방식 등 동일)
- 기존 HR 전용 bucket 삭제 없음 — append-only merge
- composite/top3 수정 없음
- parseWithAI 수정 없음

### 다음 재테스트 대상
- PA-ENG-KW-BOUND-001: domain keyword 입력 증가 → boundary 테스트 재시도 필요
- PA-REG-KW-BUG-001: SQL bucket OpsIT 경로 추가 → precision trap 검증 재시도 필요
- PA-COMP-COMBO-001: keyword medium 생성 가능성 향상 → composite completeness 재시도 필요

---

## keyword patch 후 재테스트 라운드 (2026-04-13)

### 재테스트 목적
keyword input generation 확장 패치(`__extractJdDomainKeywordsOpsIT` 신규 함수) 이후, 실제 testability와 결과 품질이 얼마나 회복됐는지 코드 분석 기반으로 확인.

### 대상 케이스
1. PA-ENG-KW-BOUND-001 — keyword boundary 검증 가능성
2. PA-REG-KW-BUG-001 — SQL/MySQL precision trap 관찰 가능성
3. PA-COMP-COMBO-001 — composite completeness 회복 여부

### input generation 패치 효과
- PA-ENG-KW-BOUND-001: domainKeywords 0개 → 5개. insufficient-data 탈출 성공. engine active.
- PA-REG-KW-BUG-001: domainKeywords 0개 → 2개. precision trap 관찰 가능 상태로 전환.
- PA-COMP-COMBO-001: keyword insufficient-data → keyword high risk 생성. composite 4-way triggered로 개선.

### boundary / precision / composite 개선 여부

**boundary (PA-ENG-KW-BOUND-001)**
- 개선: engine testable 회복 (domainKeywords 0→5개)
- 미완: ratio=0.4, booster(missing=3, mustMiss≥2) → severity=high. boundary=0.5/medium 미도달.
- 원인: OpsIT 확장으로 분모(총 keyword 수)가 5개로 커지고, resume coverage는 2개에 그침. boundary 0.5 직접 확인을 위한 입력은 기술 keyword 6개 전용 JD가 필요.

**precision (PA-REG-KW-BUG-001)**
- 개선: domainKeywords 생성 → precision trap 직접 관찰 가능
- 확인된 사실: SQL(JD) → MySQL(resume) substring match → ratio=0.5, severity=medium (false positive)
- 판단: MVP 허용 범위의 정확도 한계. 즉시 수정보다 accuracy 백로그로 유지. substring → exact match 정책 변경은 별도 라운드.

**composite (PA-COMP-COMBO-001)**
- 개선: keyword insufficient-data → keyword high risk 생성. topRisks에 must+experience+keyword 3개 모두 포함.
- 미완: keyword medium 조합 미달성 (ratio=0/2=0 → high). must 우선 정렬 유지 ✓. insufficient-data → supporting 분리 유지 ✓.
- 판단: composite 구조 정합성 확인됨. keyword medium 조합은 입력 재설계 필요.

### 유지 / accuracy 후보 / 즉시 수정 후보 분류
- **유지**: composite 정책(must 우선 정렬, insufficient-data 분리), keyword severity 임계값
- **accuracy 후보**: SQL/MySQL precision trap (MVP 허용 유지 — 수정은 별도 라운드)
- **accuracy 후보**: boundary=0.5 직접 확인을 위한 JD 입력 재설계
- **accuracy 후보**: keyword medium 조합 테스트용 입력 재설계
- **즉시 수정 후보**: 없음

### 다음 1순위
- ratio=0.5 경계를 직접 확인할 수 있는 기술 keyword 6개 전용 JD 입력 설계 (PA-ENG-KW-BOUND-001 재재테스트)
- 또는 precision trap 수정 라운드 (substring → token boundary 정확 매칭 정책 변경)

---

## 결과 화면 근거/도움말 보강 + 연차/레벨 조사 라운드 (2026-04-13)

### 수정/조사 범위
- 파일: `src/components/input/PreciseAnalysisFlow.jsx` (단일 파일 패치)
- 조사: `buildExperienceLevelGapRisk.js`, `buildMustRequirementsGapRisk.js`, `buildCompositeRisk.js`

### 추가 정보 도움말 설계
- 방식: risk key 기반 `INSUF_HELP` 맵 (모듈 상단 상수). `?` 버튼 클릭 시 `helpOpenKeys` state로 토글.
- 커버 key: `experience_level_gap`, `achievement_evidence_gap`, `gap_explanation_missing`
- 각 항목: 제목 / 본문 / 예시 리스트(YYYY.MM 형식 예시 포함) / 보조 문구 — 강산.md 실제 문구 그대로 반영
- `?` 버튼 없는 항목: 기존 정적 안내 문구 유지

### 필수요건 근거 노출 방식
- `topItems` / `lowItems` map에 `raw: r.raw ?? null` append-only 추가
- `ResultRiskCard` expanded 블록에 `key === "must_requirements_gap"` 전용 칩 섹션 삽입
  - `raw.hitItems` → 초록 칩 (실제로 확인된 표현)
  - `raw.effectiveMissItems` → 빨간 칩 (직접 확인되지 않은 요구)
  - hitItems 없으면: "현재 이력서 문구만으로는 JD 필수요건과 직접 연결되는 표현을 충분히 찾지 못했습니다." fallback
- 기존 evidence 리스트는 유지 (요약 카운트 + 원문 기준 안내)

### 연차/레벨 미노출 원인 분해
- 원인 분석:
  - `buildExperienceLevelGapRisk`: `yearsRequiredMin === null || countedPeriods.length === 0` → insufficient-data
  - `countedPeriods`는 `fit.resume.structured.employmentPeriods`에서 YYYY-MM 형식만 인식
  - `yearsRequiredMin`은 JD에 "N년 이상 경력" 계열 문장이 없으면 null
- 원인 분류: **D. contract limitation** — 내러티브 날짜("총 경력 5년", "2021년 상반기부터") 는 `__extractResumeEmploymentPeriods` 4개 regex 패턴 밖. YYYY.MM 없이는 `countedPeriods=[]` → insufficient-data gate 진입
- 패치 여부: 이번 라운드 패치 없음. 도움말 문구(experience_level_gap help)로 사용자 안내 대응.

### 패치 여부
- `PreciseAnalysisFlow.jsx`: 패치 완료 (INSUF_HELP, helpOpenKeys, raw prop, 칩 섹션)
- `buildMustRequirementsGapRisk.js`: 패치 없음 (raw.hitItems/effectiveMissItems 이미 존재)
- `buildExperienceLevelGapRisk.js`: 패치 없음 (contract limitation — 설계 결정 필요)
- `jdResumeFit.js`: 패치 없음

### 다음 1순위
- 브라우저에서 실제 `?` 버튼 동작 및 칩 노출 확인
- 연차/레벨 insufficient-data 해소를 위한 "총 경력 N년" 내러티브 bridge 설계 검토 (D→B 전환 가능 여부)

---

## insufficient-data 도움말 가시성 개선 라운드 (2026-04-13)

### 왜 기존 `?` UX가 약했는지
- 각 insufficient-data 카드에서 도움말 진입점이 제목 오른쪽의 작은 `?` 하나뿐이라 시선이 잘 가지 않았다.
- 닫힌 상태에서는 모든 카드가 거의 같은 공통 문구만 보여서, 어떤 정보를 어떻게 적어야 하는지 카드별 차이가 드러나지 않았다.
- 결과적으로 도움말 기능은 존재했지만, 사용자가 "여기서 뭘 더 써야 하는지"를 즉시 발견하기 어려운 구조였다.

### 무엇을 어떻게 바꿨는지
- owner는 그대로 `src/components/input/PreciseAnalysisFlow.jsx`에 유지하고, 엔진/정책 로직은 건드리지 않았다.
- 각 insufficient-data 카드의 제목 아래에 카드별 기본 힌트 1줄을 항상 노출하도록 바꿨다.
- 주 트리거를 작은 `?` 아이콘에서 텍스트 버튼 `입력 예시 보기`로 전환했다.
- 기존 도움말 문구와 예시는 유지하면서, 펼침 패널 안에서 제목, 본문, 예시, 보조 문구가 바로 읽히도록 구조만 정리했다.
- `?`는 삭제하지 않고 보조 표식으로만 남겨, 도움말 존재를 시각적으로 보완하도록 낮은 비중으로 유지했다.

### 왜 기본 힌트 1줄 + `입력 예시 보기` 구조로 바꿨는지
- 펼치기 전에도 "추가로 적어야 할 정보가 있다"는 사실이 카드마다 즉시 보여야 발견 가능성이 올라간다.
- 항상 보이는 힌트 1줄은 입력 방향을 즉시 이해시키고, `입력 예시 보기`는 다음 행동을 명확히 안내한다.
- 이 구조는 기존 copy를 거의 유지하면서도, 사용자가 작은 아이콘을 찾아야만 도움말을 발견하는 문제를 가장 보수적으로 해결한다.

### 엔진 로직 변경 여부
- 엔진 로직 변경 없음.
- composite/top3 규칙 변경 없음.
- 결과 화면의 insufficient-data 노출 방식만 UX 관점에서 국소 수정했다.

### 다음 1순위
- 실제 결과 화면에서 insufficient-data 카드 3종의 펼침 전 인지율이 올라갔는지 확인하고, 필요하면 `입력 예시 보기` 버튼의 대비/간격만 추가 미세조정한다.
## PASSMAP 기존 자산 재활용 조사 라운드 (2026-04-13)

### 왜 이 조사가 필요한지

- preciseAnalysis를 새 제품처럼 계속 덧대면 설명 구조, CTA, 테스트 운영, 구조화 사전이 PASSMAP 본체와 따로 놀 가능성이 커진다.
- 이미 PASSMAP 안에는 입력 추출 SSOT, 설명 registry, 결과 카드 shell, share 인프라, QA 규칙이 있으므로 새로 만들기 전에 대체 가능성을 먼저 확인해야 한다.

### 핵심 발견

- 입력/추출 계층은 이미 `UploadPanel` + `extractTextFromFile` + `parseWithAI` + `buildJdResumeFit`으로 SSOT가 형성돼 있어, preciseAnalysis 전용 입력 파이프라인을 새로 만들 필요가 거의 없다.
- 결과 화면도 `App.jsx`의 share 인프라와 `TransitionLiteResult.jsx`의 설명 패널/CTA shell을 상당 부분 재활용할 수 있다.
- 가장 재사용 가치가 높은 것은 transition-lite의 점수 체계가 아니라 `summary / positives / gaps / reasons` 설명 구조와 `userReason / interviewerView / actionHint` copy 자산이다.
- ontology/capability/role-family 자산은 판정 본체로 바로 넣기보다 must/keyword/related experience의 보조 사전으로 붙이는 방향이 더 안전하다.
- 테스트 운영은 이미 preciseAnalysis SSOT 문서와 ENGINE 규칙이 충분히 정리돼 있어 별도 체계를 만들 이유가 없다.

### 즉시 재활용 후보

- `src/components/upload/UploadPanel.jsx`, `src/lib/extract/extractTextFromFile.js`
  preciseAnalysis 입력 업로드 SSOT. 새 업로드 UX 불필요.
- `src/lib/parse/parseWithAI.js`, `src/lib/fit/jdResumeFit.js`
  JD/Resume parsed/normalized shape SSOT. 새 normalize 레이어 불필요.
- `src/App.jsx`
  `precise-analysis` share copy/panel/restore 인프라 재활용 가능.
- `src/data/transitionLite/axisExplanationRegistry.js`
  axis 점수는 제외하고 설명 payload 계약은 즉시 재활용 가능.
- `00_HQ/Precise_Analysis_Test_System.md`, `docs/ENGINE_TEST_RULES.md`, `05_Execution/Precise_Analysis_QA_Log.md`
  테스트 ID, layer, share/restore 분리 규칙 즉시 이식 가능.

### 어댑트 후보

- `src/lib/explanation/buildExplanationPack.js`
  preciseAnalysis risk key와 legacy risk id를 잇는 bridge를 만들면 카드 설명 copy를 빠르게 보강할 수 있다.
- `src/components/report/TransitionLiteResult.jsx`
  comparison table 의존을 떼어내면 상세보기/accordion shell 재활용 가능하다.
- `src/components/parse/ParsedFieldsPanel.jsx`
  internal QA/debug용 parsed-field 수정 shell로 전환 가능하다.
- `src/lib/adapters/buildJobContext.js`, `src/lib/analysis/buildCandidateAxisPack.js`
  current/target role/industry selection을 side-channel로 넘기면 related experience와 role-family proximity 보조 신호로 활용 가능하다.
- `src/data/transitionLite/capabilityRegistry.js`, `src/data/transitionLite/rowCapabilityMap.js`
  preciseAnalysis risk family를 capability 라벨로 묶는 얇은 map이 있으면 설명 구조가 더 안정된다.

### 장기 후보

- transition-lite의 축 점수 체계 전체
  preciseAnalysis의 JD-Resume screening 문제 정의와 달라 그대로 이식하는 것은 부적절하다.
- ontology/industry registry의 직접 판정 참여
  텍스트에 없는 확신을 과하게 부여할 위험이 있어 지금은 보조 사전 수준이 적절하다.
- interpretation pack 전체 조립층
  현재 preciseAnalysis의 5-risk MVP 범위를 넘는 의존이라 장기 후보로 두는 편이 안전하다.

### 다음 1순위

- `buildExplanationPack`과 preciseAnalysis risk key 사이의 대응표를 먼저 만들 수 있는지 검토해, 새 설명 copy를 쓰기 전에 기존 PASSMAP 설명 자산으로 얼마나 대체 가능한지 실증하는 것이 다음 1순위다.
## 기존 자산 재활용 기반 리포트 섹션 연결 라운드 (2026-04-13)

### 조사한 기존 자산

- `src/components/input/PreciseAnalysisFlow.jsx`
  기존 결과 카드 톤, `SectionIntro`, 상세보기 버튼 shell, insufficient-data 도움말 패턴
- `src/components/report/TransitionLiteResult.jsx`
  `summary / positives / gaps / reasons` 계열 설명 슬롯과 상세보기 shell 패턴
- `src/data/transitionLite/axisExplanationRegistry.js`
  점수 체계는 제외하고 설명 payload 구조만 참고
- `src/lib/explanation/buildExplanationPack.js`
  must/keyword/seniority/gap 계열 설명 문구 방향 참고
- `src/lib/preciseAnalysis/buildExperienceLevelGapRisk.js`
  `yearsRequiredMin`, `countedPeriods`, `skippedPeriods`, `totalCareerYears`
- `src/lib/preciseAnalysis/buildGapExplanationMissingRisk.js`
  `maxGapMonths`, `describedGapCount`, `timelinePeriodCount`
- `src/lib/preciseAnalysis/buildJdKeywordCoverageGapRisk.js`
  `matchedKeywordCount`, `missingKeywords`, `keywordCoverageRatio`
- `src/lib/preciseAnalysis/buildMustRequirementsGapRisk.js`
  `hitItems`, `effectiveMissItems`

### 실제 재활용한 자산

- `PreciseAnalysisFlow.jsx`의 기존 카드/상세보기 shell을 그대로 유지하고, 그 안에 `summary / reasons / positives / gaps` 슬롯만 얇게 추가했다.
- `TransitionLiteResult.jsx`에서 이미 쓰고 있던 설명 구조를 직접 import하지 않고, 결과 owner 내부에서 동일한 정보 구조로만 재활용했다.
- 기존 insufficient-data 도움말 패턴을 연차/레벨, 공백/이직 섹션 하단 `입력 예시 보기`로 다시 연결했다.
- 기존 CTA / share / top risk 구조는 건드리지 않고, 그 위에 `서류 탈락 원인 분석` 블록만 추가했다.

### 새로 만들지 않고 해결한 범위

- 새 공용 컴포넌트 추출 없음
- 새 엔진 정책 없음
- severity 정책 변경 없음
- composite/top3 규칙 변경 없음
- ontology/capability 직접 판정 참여 없음
- preciseAnalysis 결과 owner는 `src/components/input/PreciseAnalysisFlow.jsx` 유지

### 4개 섹션 연결 방식

- `연차/레벨`
  `experience_level_gap`의 `yearsRequiredMin`, `countedPeriods`, `skippedPeriods`, `totalCareerYears`를 연결해 판단 근거를 보여줬다.
- `공백/이직`
  `gap_explanation_missing`의 `maxGapMonths`, `describedGapCount`, `timelinePeriodCount`와 함께, 이번 라운드에서 raw에 추가한 `gapDescriptions`, `transitionNarratives`를 표시했다.
- `JD 키워드 반영 부족`
  `jd_keyword_coverage_gap`의 `matchedKeywordCount`, `missingKeywords`, `keywordCoverageRatio`와 함께, 이번 라운드에서 raw에 추가한 `matchedKeywords`, `domainKeywords`를 연결했다.
- `필수요건 미충족`
  `must_requirements_gap`의 `hitItems`, `effectiveMissItems`를 그대로 UI에 연결했다.

### 연차/레벨 contract limitation

- 연차/레벨은 self-report 계약을 추가하지 않았다.
- 기간이 명확한 경력만 합산하는 기존 contract limitation을 유지했고, 요약 문구도 “부족 확정”이 아니라 “현재 이력서 기준으로 확인이 어렵다”는 보수적 표현으로 고정했다.

### 다음 1순위

- `buildExplanationPack`의 기존 must/keyword/seniority copy를 preciseAnalysis risk key bridge로 연결해, 현재 UI에 붙인 4개 섹션의 “왜 이렇게 봤는지 / 어떻게 보완하면 되는지” 문구를 더 촘촘하게 재활용하는 것이 다음 1순위다.

## 구조화 자산 재활용 조사 라운드 (2026-04-13)

### 왜 이번엔 UI shell이 아니라 구조화 자산을 보려는지

- preciseAnalysis는 화면 설명보다 `같은 뜻인데 다른 표현`을 얼마나 줄이느냐에서 정확도 차이가 더 크게 난다.
- 이번 라운드는 UI shell 재활용이 아니라, PASSMAP 내부의 자격증/도구/담당업무/직무 family/taxonomy/alias 자산이 `must/keyword` 해석 보조 사전으로 얼마나 바로 들어갈 수 있는지를 확인하는 조사다.

### 핵심 발견

- 가장 즉시성이 높은 자산은 `toolTaxonomy`, `evidenceAliases`, `taskOntology`, `cert catalog + jdSignalMapping`이다.
- 이 자산들은 새로운 엔진 공식을 만들지 않고도 `JD 키워드 반영 부족`과 `필수요건 미충족`의 exact string 누락을 줄이는 데 바로 쓸 수 있다.
- 반대로 `job ontology`, `industry registry`, `buildJobContext`, `buildCandidateAxisPack`은 가치가 크지만 현재 preciseAnalysis text-first 계약에 바로 넣기엔 과신 위험이 있다.
- 즉, 구조화 자산은 판정 본체보다 `keyword/must matching 보조 사전`으로 먼저 붙이는 것이 안전하다.

### 즉시 활용 후보

- `src/lib/semantic/taxonomy/toolTaxonomy.js`
  - tool alias, `disambiguationDomain`, `boostWeight`
  - `JD 키워드 반영 부족`, `필수요건 미충족`의 tool phrase normalize에 바로 사용 가능
- `src/lib/decision/evidence/evidenceAliases.js`
  - `TOOL_ALIASES`, `TASK_ALIASES`, `TOOL_SIMILARITY`
  - exact string 누락을 줄이는 가장 얇은 보조 사전
- `src/lib/ontology/taskOntology.js`, `src/lib/ontology/taskMatcher.js`
  - 고객 대응, 운영 리포트, 유관부서 협업, 이슈 대응, 프로세스 개선 같은 업무 표현의 동의어 정규화에 바로 사용 가능
- `src/lib/ontology/certs/cert_catalog.v0.json`, `src/lib/ontology/certs/cert_rules.v0.json`
  - 자격증 alias와 `jdSignalMapping`이 있어 JD must requirement 자격증 문구 정규화에 바로 사용 가능
- `src/lib/semantic/taxonomy/domainTaxonomy.js`, `src/lib/semantic/taxonomy/hrTaxonomy.js`
  - domain별 strong phrase / concept bundle이 있어 procurement/scm, HR 영역의 `domainKeywords` 보강에 즉시 사용 가능

### 얇은 어댑터 후보

- `src/lib/ontology/certs/role_cert_matrix.v0.json`
  - role family side-channel이 열리면 certification relevance 보조로 활용 가능
- `src/data/transitionLite/capabilityRegistry.js`, `src/data/transitionLite/rowCapabilityMap.js`
  - must/keyword phrase를 capability bucket으로 묶는 얇은 bridge가 있으면 설명 구조 보강 가능
- `src/data/job/jobOntology.index.js`, `src/data/industry/industryRegistry.index.js`
  - role/industry selection을 preciseAnalysis에 넘길 수 있어야 안전하게 재활용 가능
- `src/lib/adapters/buildJobContext.js`
  - `familyId`, `adjacentFamilyIds`, `targetResponsibilityHints`, `targetLevelHints`는 future related experience 보조 신호로 좋다
- `src/lib/roleDistance.js`
  - canonical role alias normalize와 인접성 보조 신호로 쓸 수 있으나 current text-only 계약엔 직접 연결이 어렵다

### 장기 후보

- `src/lib/analysis/buildCandidateAxisPack.js`
  - transition-lite 해석 pack이라 preciseAnalysis 판정 본체에 바로 넣으면 설명과 판정이 섞인다
- `src/data/transitionLite/subVerticalCapabilityMap.js`
  - target subvertical 전제가 있어 current input 계약과 맞지 않는다
- `job ontology`, `industry registry`의 direct scoring 참여
  - 텍스트에 없는 유사성을 과신할 위험이 크다
- `cert_rules.v0.json`의 substitution rule direct 참여
  - 자격증 미보유를 다른 evidence로 부분 대체하는 로직은 screening risk 완화에 과한 추정을 넣을 수 있다

### 다음 1순위

- `toolTaxonomy + evidenceAliases + cert_catalog + cert_rules.jdSignalMapping + taskOntology`를 한 번에 묶어, `buildJdKeywordCoverageGapRisk.js`와 `buildMustRequirementsGapRisk.js` 앞단에 붙일 alias normalization 설계 메모를 만드는 것이 다음 1순위다.