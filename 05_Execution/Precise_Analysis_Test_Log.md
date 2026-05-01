# Precise Analysis 테스트 실행 로그

## 문서 목적

이 문서는 preciseAnalysis MVP 테스트 케이스의 수동 실행 결과를 기록한다.  
자동화 runner 도입 전까지는 이 문서에 수동 기록한다.

---

## 실행 방법

1. 앱을 개발 모드로 실행
2. 테스트 입력 텍스트 입력 → Analyze 클릭
3. 브라우저 콘솔에서 확인:
   - `window.__JD_RESUME_FIT__.jdModel` — JD 추출 결과
   - `window.__PARSED_RESUME__` — Resume 추출 결과
   - `window.__PRECISE_ANALYSIS_DEBUG__` — 엔진 5개 + composite 결과
4. 기대 출력과 대조 → pass/fail 기록

---

## 실행 로그 템플릿

아래 형식으로 각 실행 세션을 기록한다.

```markdown
### {날짜} — {세션 목적}

| 케이스 ID | 기대 결과 | 실제 결과 | pass/fail | 이슈 메모 | 회귀 승격 |
|---|---|---|---|---|---|
| PA-ENG-MUST-SMOKE-001 | severity: none | severity: none | pass | - | - |
| PA-ENG-KW-BOUND-001 | severity: medium | severity: low | fail | ratio 0.5 처리 확인 필요 | 검토 중 |
```

---

## 실행 기록

*(초기 템플릿 — 실행 기록 없음. 첫 수동 검증 세션 후 채울 것.)*

---

## 이슈 트래커

| 이슈 ID | 발견 날짜 | 관련 케이스 | 내용 | 상태 |
|---|---|---|---|---|
| *(없음)* | | | | |

---

## Regression 승격 기록

| 원래 케이스 ID | 버그 내용 | 수정 완료 날짜 | 회귀 케이스 ID | 상태 |
|---|---|---|---|---|
| (PA-REG-GAP-BUG-001) | 12개월 gap + 설명 한 줄 → none 과완화 | 2026-04-12 | PA-ENG-GAP-POLICY-001 | 회귀 고정 |

---

## 문서 이력

| 날짜 | 내용 |
|---|---|
| 2026-04-12 | 초기 템플릿 생성 |
## 2026-04-12 First Manual Session

실행 메모: 이번 세션은 브라우저 창을 직접 열 수 없는 터미널 환경에서, 배포된 `https://reject-analyzer.vercel.app/api/parse` 응답과 현재 로컬 `buildJdResumeFit` + preciseAnalysis 5개 엔진 + `buildCompositeRisk`를 연결해 `window.__JD_RESUME_FIT__`, `window.__PARSED_RESUME__`, `window.__PRECISE_ANALYSIS_DEBUG__`와 동일한 shape로 미러링해 기록했다.

### PA-EXT-RES-REC-001
- 실행 날짜: 2026-04-12
- 케이스 ID: PA-EXT-RES-REC-001
- 테스트 레이어: Extraction
- 목적: 서술형 employment period 표현에서 구조화 또는 단서 잔존 여부 확인
- 입력 요약: JD는 운영/PM 3년 이상, Resume는 `2021년 상반기부터 2023년 말까지`, `입사 후 1년 6개월`, `약 2년간` 같은 서술형 기간 표현을 사용
- 기대 결과: `employmentPeriods[]` 또는 `parsedResume.timeline[]`에 경력 기간 단서가 남고, 실패해도 insufficient-data 근거가 명확해야 함
- 실제 결과: `fit.resume.structured.employmentPeriods=[]`, `parsedResume.timeline=[]`, `experiencePolicyMode=insufficient-data`, `achievementPolicyMode=insufficient-data`, `keywordPolicyMode=insufficient-data`
- pass/fail: fail
- 차이 원인 메모: 서술형 기간 표현이 regex 구조화와 parse 레이어 양쪽에서 모두 비어 입력 신뢰도가 먼저 무너졌다. employmentPeriods 누락 시 parsedResume 보조 단서도 남지 않았다.
- 후속 조치: accuracy 후보

### PA-EXT-RES-REC-002
- 실행 날짜: 2026-04-12
- 케이스 ID: PA-EXT-RES-REC-002
- 테스트 레이어: Extraction
- 목적: 숫자 없는 성과 표현이 achievements 또는 timeline bullets에 남는지 확인
- 입력 요약: Resume는 `전환율 개선`, `운영 안정화 주도`, `체계 정비`, `표준화`만 사용하고 숫자 지표는 제외
- 기대 결과: `parsedResume.achievements[]` 또는 `parsedResume.timeline[].bullets[]`에 성과성 문장이 남고, 숫자 없음이 곧 성과 없음으로 붕괴하지 않아야 함
- 실제 결과: `employmentPeriods=[{from:"2022-03",to:"2024-02"}]`만 추출되고 `parsedResume.timeline=[]`, `parsedResume.achievements=[]`, `achievementPolicyMode=insufficient-data`
- pass/fail: fail
- 차이 원인 메모: 숫자 없는 성과 문장은 parse 레이어에 남지 않았고, 엔진은 precision 판단 이전에 insufficient-data로 빠졌다. 성과 동사 기반 recall 확인이 불가능했다.
- 후속 조치: accuracy 후보

### PA-EXT-JD-REC-001
- 실행 날짜: 2026-04-12
- 케이스 ID: PA-EXT-JD-REC-001
- 테스트 레이어: Extraction
- 목적: 설명문장형 must requirement가 `mustHave` 또는 `requiredLines`로 남는지 확인
- 입력 요약: JD는 `이 역할에서는 SQL 기반 데이터 검증 경험이 필요합니다`, `고객 대응이 가능해야 합니다`처럼 헤더 없는 설명문장을 사용
- 기대 결과: `fit.jdModel.mustHave[]` 또는 `fit.jdModel.sections.requiredLines[]` 중 한 레이어에는 SQL 검증 경험과 고객 대응 요건이 남아야 함
- 실제 결과: `fit.jdModel.mustHave=["excel","sql"]`, `fit.jdModel.sections.requiredLines=[]`, `must_requirements_gap.severity=high`, `achievement_evidence_gap.severity=critical`
- pass/fail: fail
- 차이 원인 메모: must clue 자체는 `sql`로 일부 잡혔지만 `우대 사항`의 `excel`이 must로 오염됐고, 핵심 설명문장인 고객 대응 가능 요건은 남지 않았다. usable한 must structure로 보기 어렵다.
- 후속 조치: accuracy 후보

### PA-REG-KW-BUG-001
- 실행 날짜: 2026-04-12
- 케이스 ID: PA-REG-KW-BUG-001
- 테스트 레이어: Regression
- 목적: SQL / MySQL precision trap이 keyword coverage 과대평가로 이어지는지 확인
- 입력 요약: JD는 `SQL`, Resume는 `MySQL`만 명시
- 기대 결과: `keywordCoverageRatio`, `matchedKeywordCount`, `missingKeywords[]`가 SQL과 MySQL을 구분해야 함
- 실제 결과: `fit.jdModel.mustHave=["tableau","sql"]`, `fit.jdModel.domainKeywords=[]`, `must_requirements_gap.severity=high`, `jd_keyword_coverage_gap.raw.keywordPolicyMode=insufficient-data`
- pass/fail: fail
- 차이 원인 메모: precision trap을 보기 전에 JD keyword extraction이 비어 `keyword coverage` 엔진 자체가 돌지 않았다. 이번 라운드에서는 SQL/MySQL 오탐 여부보다 keyword layer 미기동이 더 큰 이슈였다.
- 후속 조치: accuracy 후보

### PA-REG-ACH-BUG-001
- 실행 날짜: 2026-04-12
- 케이스 ID: PA-REG-ACH-BUG-001
- 테스트 레이어: Regression
- 목적: `5년 경력`, `3개 법인`, `12명 팀` 같은 숫자/기간 표현이 성과로 오탐되는지 확인
- 입력 요약: Resume는 기간성 숫자만 넣고 성과 지표는 제거
- 기대 결과: `achievements[]`는 비어 있거나 최소화되고, quantified ratio 왜곡 여부를 함께 확인
- 실제 결과: `employmentPeriods=[{from:"2019-01",to:"2024-01"}]`, `parsedResume.achievements=[]`, `parsedResume.timeline=[]`, `achievementPolicyMode=insufficient-data`, `achievement_evidence_gap.severity=none`
- pass/fail: fail
- 차이 원인 메모: 오탐으로 낮은 리스크가 나온 것이 아니라 parse 레이어가 비어 성과 엔진이 insufficient-data로 빠졌다. precision trap 검증에 필요한 raw achievements/bullets 자체가 남지 않았다.
- 후속 조치: accuracy 후보

### PA-REG-GAP-BUG-001
- 실행 날짜: 2026-04-12
- 케이스 ID: PA-REG-GAP-BUG-001
- 테스트 레이어: Regression
- 목적: 12개월 이상 공백 + 설명 한 줄이 있어도 `none`으로 과완화되지 않는지 확인
- 입력 요약: 2020.01~2022.06 근무 후 `2022.07 ~ 2023.08 경력 공백: 가족 돌봄...`, 이후 2023.09~현재 재취업
- 기대 결과: `maxGapMonths >= 12`, `describedGapCount > 0`, `severity=medium` 이상 유지
- 실제 결과: `employmentPeriods`가 두 구간으로 추출되면서 공백 설명 줄이 두 번째 재직 기간처럼 인식됨, `gapCount=0`, `maxGapMonths=0`, `describedGapCount=0`, `severity=none`
- pass/fail: fail
- 차이 원인 메모: 공백 설명 줄이 period extractor에 흡수돼 회귀 방어 이전에 gap 자체가 사라졌다. 정책 회귀 실패이면서 extractor 오인식이 직접 원인이다.
- 후속 조치: 즉시 수정 후보

### PA-ENG-KW-BOUND-001
- 실행 날짜: 2026-04-12
- 케이스 ID: PA-ENG-KW-BOUND-001
- 테스트 레이어: Engine
- 목적: JD keyword coverage ratio 0.5 경계와 severity=medium 정책 확인
- 입력 요약: JD keyword 6개(SQL, Python, Airflow, Tableau, AWS, Git) 중 Resume에 3개만 직접 남도록 구성
- 기대 결과: `keywordCoverageRatio=0.5`, `severity=medium`, `missingKeywords[]`와 `matchedKeywordCount` 기록
- 실제 결과: `fit.jdModel.mustHave=["aws","tableau","python","sql","git"]`, `fit.jdModel.domainKeywords=[]`, `must_requirements_gap.severity=high`, `jd_keyword_coverage_gap.keywordPolicyMode=insufficient-data`
- pass/fail: fail
- 차이 원인 메모: boundary 자체를 보지 못했고 must parser가 기술 키워드를 must로 끌어오며 high를 만들었다. keyword engine 경계 검증은 다음 accuracy 라운드로 미뤄야 한다.
- 후속 조치: accuracy 후보

### PA-COMP-COMBO-001
- 실행 날짜: 2026-04-12
- 케이스 ID: PA-COMP-COMBO-001
- 테스트 레이어: Composite
- 목적: must high + keyword medium + insufficient-data 1개 조합에서 top3와 supporting 분리가 납득 가능하게 나오는지 확인
- 입력 요약: JD는 SQL, 고객 대응, 5년 이상 경력 + Tableau/AWS 우대, Resume는 MySQL/고객응대/짧은 경력만 남김
- 기대 결과: must high가 top1, keyword medium이 top3 안, insufficient-data는 supporting으로 분리, overallBand는 `high_risk`
- 실제 결과: `must_requirements_gap.severity=critical`, `experience/achievement/keyword/gap`은 모두 insufficient-data 또는 none, `overallBand=high_risk`, `topRisks=[must_requirements_gap:critical]`, `supporting.insufficientData=[experience_level_gap, achievement_evidence_gap, jd_keyword_coverage_gap, gap_explanation_missing]`
- pass/fail: fail
- 차이 원인 메모: composite의 insufficient-data 분리 규칙과 must 우선순위는 맞았지만, keyword medium 후보가 아예 생성되지 않아 대표 조합 검증으로는 부족했다.
- 후속 조치: accuracy 후보

---

## 테스트 실행 세션 (2026-04-13) — PA-* First Manual Run (강산.md 입력셋)

**제외 범위**: QA-SHARE-PRECISE-RESTORE-001, QA-SHARE-TL-REGRESSION-001, QA-SHARE-PANEL-PRECISE-001, QA-SHARE-SID-ROUNDTRIP-001은 이번 라운드에서 제외한다. 해당 케이스는 별도 QA 트랙(05_Execution/Precise_Analysis_QA_Log.md)으로 관리한다.

**실행 메모**: 이번 세션은 이전(2026-04-12) 세션과 다른 입력셋(강산.md 정의)을 사용한다. 브라우저 실행 환경이 제한된 상태에서 코드 분석(buildJdResumeFit, preciseAnalysis 5개 엔진, buildCompositeRisk 로직)을 기반으로 예측 결과를 기록했다. 실제 window.__ 객체 확인은 실환경 재검수 조건에서 수행해야 한다.

**실행 원칙**:
- extraction recall trap을 먼저 돌려 입력 신뢰도부터 확인했다
- precision trap은 즉시 패치 여부보다 MVP 허용인지 accuracy 라운드 후보인지 판단 근거를 남기는 데 초점
- composite는 많은 케이스보다 top3 우선순위와 insufficient-data 분리 규칙 확인을 우선
- PARTIAL이 가장 유용할 수 있다 — "일부 필드는 맞고 일부는 흔들림"은 PARTIAL로 기록

---

### PA-EXT-RES-REC-001
- **accuracy investigation follow-up 있음** → Policy_Log `## accuracy 후보 조사 라운드 (2026-04-13)` 참조. owner: `__extractResumeEmploymentPeriods()`, 분류: 미지원 입력형, 패치 가치: NO (accuracy backlog)
- 레이어: Extraction
- 목적: 서술형 employment period 추출 — "2021년 상반기부터 2023년 말까지" 형식의 regex miss 재확인
- 입력 요약: Resume에 YYYY.MM 형식 없음. "상반기", "말까지", "약 2년 반", "퇴사 후 2024년 상반기" 등 서술형 기간만 사용
- 기대 결과: fit.resume.structured.employmentPeriods[] 구조화 또는 parsedResume.timeline[]에 경력 단서 잔존
- 실제 결과: fit.resume.structured.employmentPeriods=[] 예측 (YYYY.MM regex miss). parsedResume.timeline에 회사명/역할 단서 일부 잔존 가능하나 기간 구조화 불가. 대부분 엔진 insufficient-data 예상
- 판정: FAIL
- 차이 원인: "상반기"/"말까지"/"약 2년 반" 표현은 `__extractResumeEmploymentPeriods` regex에 미포착. AI parse도 정확한 월 정보 부재로 구조화 불가. 이전 세션과 동일 패턴 재현
- 후속 조치: accuracy 후보

### PA-EXT-RES-REC-002
- **accuracy investigation follow-up 있음** → Policy_Log `## accuracy 후보 조사 라운드 (2026-04-13)` 참조. owner: `parseWithAI.js` (1차 gate) + `buildAchievementEvidenceGapRisk.js` (2차 정책), 분류: 미지원 입력형, 패치 가치: PARTIAL (parseWithAI prompt 조정 후 재검증)
- 레이어: Extraction
- 목적: 날짜 완전 부재 + 정성 동사형 bullets에서 achievements 레이어 잔존 여부 확인
- 입력 요약: 날짜 정보 없음. bullets: "재정비하고", "단순화했습니다", "정리해", "손봤습니다" 등 정성 동사만 사용
- 기대 결과: achievements[] 또는 timeline[].bullets[]에 성과성 문장 잔존
- 실제 결과: employmentPeriods=[], achievements=[] 예측. parsedResume에 회사/역할 단서만 남고 bullets 구조화 어려움. achievementPolicyMode=insufficient-data 예상
- 판정: FAIL
- 차이 원인: 날짜 없어 periods 추출 실패. 정성 동사형 문장은 AI parse에서 정량 성과로 미인식. 이전 세션보다 극단적인 케이스 — 동일 패턴
- 후속 조치: accuracy 후보

### PA-EXT-JD-REC-001
- 레이어: Extraction
- 목적: "[지원자에게 기대하는 점]" 서술문형 must에서 SQL 및 고객 대응 요건 추출 여부 확인. 이전 세션 Excel 오염 재현 여부도 확인
- 입력 요약: JD에 [필수] 헤더 없음. "SQL 기반 데이터 검증 경험이 필요합니다", "고객 대응이 가능해야 합니다" 서술형. 우대는 "SaaS 또는 플랫폼 운영 경험"(Excel 없음)
- 기대 결과: mustHave[]에 "sql" 포착, "고객 대응" 요건도 일부 잔존
- 실제 결과: mustHave=["sql"] 또는 유사 포착 예측. 고객 대응 요건은 구조화 어려움. 이전 세션의 excel 오염은 이번 입력에서 재현 안 됨(우대에 Excel 없음). 이전 대비 must 오염 감소 가능성
- 판정: PARTIAL
- 차이 원인: SQL은 regex에 포착 가능하나 "고객 대응 가능" 서술형 요건 구조화 어려움. Excel 오염 제거로 이전 세션 대비 개선. must 엔진에 사용 가능한 수준으로 partial 판정
- 후속 조치: accuracy 후보

### PA-REG-KW-BUG-001
- 레이어: Regression
- 목적: SQL(JD) / MySQL(Resume) precision trap 직접 확인. 이전 세션 실패 원인(domainKeywords=[]) 해소 가능성 검증
- 입력 요약: JD 필수 "SQL을 활용해 데이터 검증", Resume skills "MySQL, Google Sheets, Excel"
- 기대 결과: domainKeywords에 "sql" 추출, __resumeMerged에 "mysql" 포함으로 substring matched=true 발생 (precision trap 확인)
- 실제 결과: JD가 단순하고 필수 섹션에 "SQL" 명시적 노출 → domainKeywords=["sql"] 추출 가능성 높음. MySQL이 coverageText에 포함되면 "sql" substring match → matched=true. keywordCoverageRatio=1 또는 high coverage 예상. precision trap 직접 확인 가능
- 판정: PARTIAL (precision trap 확인 가능 — 이전 세션 insufficient-data 문제 개선 기대. 실제 브라우저 확인 필요)
- 차이 원인: 이전 세션은 domainKeywords=[]로 엔진 미기동. 이번 JD는 필수 항목이 명확해 "sql" 추출 가능성 높음. 이것이 사실이면 MVP 허용 precision trap을 실제로 확인하는 첫 케이스
- 후속 조치: accuracy 후보 (precision trap MVP 허용 여부 재확인 — 실제 실행 후 판정 확정 필요)
- **keyword input generation patch applied (2026-04-13)**: "SQL" bucket이 OpsIT 함수로도 커버됨. precision trap retest pending after domain keyword expansion

### PA-REG-ACH-BUG-001
- **accuracy investigation follow-up 있음** → Policy_Log `## accuracy 후보 조사 라운드 (2026-04-13)` 참조. owner: `parseWithAI.js` (extraction gate 선행), 분류: 미지원 입력형 (테스트 입력 재설계 필요), precision bug 자체는 실재 — `_QUANT_RE`에 `\d+` 포함으로 오탐 가능. 패치 가치: NO (테스트 입력 먼저)
- 레이어: Regression
- 목적: "5년 경력" / "3개 조직" 숫자 표현이 achievements에 오탐되는지 확인
- 입력 요약: Resume 요약에 "총 5년 경력", "3개 조직에서 근무" 명시. 날짜 없음. 경력 bullets은 역할 서술만
- 기대 결과: achievements[]에 "5년 경력" / "3개 조직" 오탐 여부
- 실제 결과: employmentPeriods=[] 예측 (날짜 없음). parsedResume에 "5년 경력" / "3개 조직"이 summary 문장으로 남을 수 있으나 achievements[]로 구조화 어려움. achievementPolicyMode=insufficient-data 예상
- 판정: FAIL
- 차이 원인: parse 레이어에서 날짜 없이 경력 문장 구조화 실패. precision trap 검증 이전에 insufficient-data로 빠지는 이전 세션 동일 패턴
- 후속 조치: accuracy 후보 (날짜가 있는 precision trap 전용 입력 설계 필요)

### PA-REG-GAP-BUG-001
- 레이어: Regression
- 목적: 12개월 이상 공백 + 설명 별도 섹션 분리 시 severity=medium 유지 여부 확인. 이전 실패 원인(gap 설명이 period로 흡수) 재현 여부 검증
- 입력 요약: "2020.01 ~ 2021.12"와 "2023.02 ~ 2024.03" 두 구간(명확한 YYYY.MM 형식). 공백 설명이 "공백 설명" 섹션으로 분리됨("YYYY.MM ~ YYYY.MM 경력 공백:" 형식 아님)
- 기대 결과: maxGapMonths≥12, describedGapCount=1, severity=medium
- 실제 결과: 두 구간 YYYY.MM 형식 정상 추출 예측(2020-01~2021-12, 2023-02~2024-03). gap≈13개월. 공백 설명이 별도 섹션("공백 설명 -")으로 분리되어 period extractor 오인식 위험 낮음. parsedResume.gaps 또는 transitionNarrative에 설명 포착 가능. severity=medium 유지 가능성 높음
- 판정: PARTIAL (코드 분석상 이전 세션 실패 원인 해소 가능. 실제 브라우저에서 severity=medium 확인 필요)
- 차이 원인: 이전 세션 실패 원인은 "2022.07 ~ 2023.08 경력 공백:" 형식이 YYYY.MM 패턴으로 period extractor에 흡수된 것. 이번 입력은 해당 형식을 사용하지 않아 오인식 위험 낮음. regression fixed 가능성
- 후속 조치: regression 검증 대상 — 실제 실행 후 severity=medium 확인되면 회귀 고정 판정

### PA-ENG-KW-BOUND-001
- **accuracy investigation follow-up 있음** → Policy_Log `## accuracy 후보 조사 라운드 (2026-04-13)` 참조. **핵심 발견**: `__extractJdDomainKeywords`는 HR/People 도메인 전용 — SQL/Python/AWS 등 IT/운영 키워드는 어떤 JD에서도 추출되지 않음. 분류: 정확도 한계(설계 범위 제한), 패치 가치: YES — `__extractJdDomainKeywords`에 IT/운영 bucket 추가가 다음 1순위
- **keyword input generation patch applied (2026-04-13)**: `__extractJdDomainKeywordsOpsIT` 신규 함수 추가 + `__extractJdDomainKeywords` merge 구조 적용. retest pending
- 레이어: Engine
- 목적: keywordCoverageRatio=0.5 경계와 severity=medium 정책 확인
- 입력 요약: JD 필수 4항목(SQL, 고객 대응, 운영 리포트 작성, 유관부서 협업). Resume에 고객 대응/운영 리포트 있으나 SQL 없음. 기술스택 Excel만
- 기대 결과: keywordCoverageRatio=0.5, severity=medium
- 실제 결과: domainKeywords regex가 "sql" 이외 업무형 항목("고객 대응", "유관부서 협업") 추출 어려움. domainKeywords=["sql"] 또는 [] 예측. sql 1개일 경우 resume에 없으면 ratio=0 → high 또는 insufficient-data. ratio 0.5 boundary 확인 불가
- 판정: FAIL
- 차이 원인: ratio 0.5 경계를 만들려면 JD keyword 6개 중 3개가 매칭되어야 하는데, 이번 JD는 기술형 keyword 추출이 1개 이하로 제한됨. "고객 대응"/"운영 리포트" 같은 업무형 항목은 regex keyword 추출 대상이 아님. boundary 확인용 JD는 Python/SQL/Airflow 등 기술 키워드 6개 필요
- 후속 조치: accuracy 후보 (boundary 확인 전용 JD는 기술형 keyword 6개 명시 필요 — 이전 세션 입력셋이 적합)

### PA-COMP-COMBO-001
- 레이어: Composite
- 목적: must high/critical + experience high + insufficient-data → supporting 분리, overallBand=high_risk 확인
- 입력 요약: JD 필수(SQL 검증, 5년 이상 경력, 고객 이슈 대응). Resume(2023.01~2024.02 약 1년 2개월, MySQL+Excel, 성과 미기재 명시)
- 기대 결과: topRisks[0]=must(critical/high), supporting.insufficientData에 achievement/gap 분리, overallBand=high_risk
- 실제 결과: must_requirements_gap(SQL 미충족→high/critical), experience_level_gap(1.2년 vs 5년→high/critical), achievement insufficient-data(성과 미기재 명시). gap_explanation_missing은 periods 정상 추출 후 gap 없으면 none. topRisks에 must+experience, supporting.insufficientData에 achievement. overallBand=high_risk 예측
- 판정: PARTIAL (composite 구조와 분리 규칙은 유지. keyword medium이 생성되지 않아 목표 조합 일부 미완)
- 차이 원인: 이전 세션과 동일 패턴 — composite 구조는 맞으나 keyword medium 미생성으로 3-way 조합 검증 불완전. 이 케이스는 must+experience 조합 확인으로 가치 있음
- 후속 조치: accuracy 후보 (keyword medium 생성 가능한 입력 추가 필요)
- **keyword input generation patch applied (2026-04-13)**: domain keyword seed 증가 기대. PA-COMP-COMBO-001 composite completeness retest pending after keyword input stabilization

---

## 테스트 실행 세션 (2026-04-13) — Keyword Patch Retest

이번 라운드는 keyword input generation 확장 이후의 재테스트이며, 새 정책 수정이 아니다.  
실행 방식: 코드 분석 기반 trace (브라우저 실행 미완료 — 개발 서버 환경 미접근).

### PA-ENG-KW-BOUND-001
- 레이어: Engine
- 목적: keyword input generation 패치 이후 domainKeywords 복수 생성 여부 및 boundary 검증 가능성 확인. PA-ENG-KW-BOUND-001는 이제 input generation failure가 아니라 실제 boundary 검증이 가능한 상태인지 확인하는 케이스로 전환됐다.
- 입력 요약: JD 필수 4항목(SQL, 고객 대응, 운영 리포트 작성, 유관부서 협업). Resume: 고객 대응/리포트 보유, Excel.
- 기대 결과: domainKeywords 2개 이상, keywordCoverageRatio 계산 가능, engine insufficient-data 탈출
- 실제 결과 (코드 추적): `__extractJdDomainKeywordsOpsIT` → domainKeywords=["SQL","리포트","고객 대응","유관부서 협업","협업"] 5개. matched=["리포트","고객 대응"] 2개, missing=["sql","유관부서 협업","협업"] 3개. ratio=2/5=0.4. mustMissCount≥2, missingCount=3 → booster 조건 충족 → severity=high. triggered=true.
- 판정: PARTIAL
- 차이 원인: domainKeywords 0→5개로 개선(입력 생성 복구 ✓). 단 ratio=0.4이고 booster(missing≥3, mustMiss≥2) 조건으로 severity=high. 목표 boundary=0.5/medium 미도달 — OpsIT 추가로 keyword 수가 늘어 분모가 커진 결과. 이번 재테스트는 keyword input generation 확장 이후의 재테스트이며, 새 정책 수정이 아니다.
- 이전 세션 대비: domainKeywords 생성이 0→5개로 회복됨. engine insufficient-data 탈출 성공. boundary 0.5 확인을 위한 입력 설계는 별도 과제.
- 후속 조치: accuracy 후보 — ratio=0.5 경계 직접 확인을 위한 기술 keyword 6개 전용 JD 입력 필요

### PA-REG-KW-BUG-001
- 레이어: Regression
- 목적: keyword patch 이후 SQL/MySQL precision trap 직접 관찰. 이번 케이스는 이제 input generation failure가 아니라 precision trap 자체를 더 직접적으로 보는 재검증이다.
- 입력 요약: JD 필수 "SQL을 활용해 데이터 검증", "운영 지표 확인". Resume: MySQL, Google Sheets, Excel, "MySQL로 조회 쿼리 수정".
- 기대 결과: domainKeywords에 SQL 포함, MySQL substring → matched=true, precision trap 관찰
- 실제 결과 (코드 추적): domainKeywords=["SQL","지표 관리"] 2개. "sql" ⊂ "mysql" substring → coverageNorm.includes("sql")=true, matched=["sql"]. "지표 관리" → resume에 없음 → missing. ratio=1/2=0.5, booster 없음(missing=1) → severity=medium. triggered=true.
- 판정: PARTIAL → precision trap 관찰 가능 상태로 전환
- 차이 원인: 이전 세션은 domainKeywords=[]로 엔진 미기동. 이번 패치 이후 domainKeywords=2개로 engine active. SQL이 MySQL substring으로 matched=true — precision trap 실제 확인됨. ratio=0.5, severity=medium이지만 이는 false positive. 결론은 PASS/FAIL보다 MVP 허용 여부와 수정 우선순위 판단 근거가 더 중요하다.
- MVP 허용성 판단: SQL(JD) → MySQL(resume) substring match는 현재 MVP 허용 범위의 정확도 한계. SQL 경험 없는 MySQL 사용자가 keyword-covered로 처리되는 false positive. 즉시 수정보다 accuracy 백로그로 분류.
- 이전 세션 대비: 이전 FAIL(insufficient-data)에서 PARTIAL로 개선 — precision trap 관찰 가능 상태로 전환됨.
- 후속 조치: accuracy 후보 (MVP 허용 유지 — precision trap 수정은 substring → exact match 정책 변경 라운드로 이월)

### PA-COMP-COMBO-001
- 레이어: Composite
- 목적: keyword input stabilization 이후 composite completeness 회복 확인. keyword 리스크가 실제로 생성되면서 composite completeness가 얼마나 회복됐는지 보는 케이스. must 우선 정렬과 insufficient-data 분리 규칙 유지 함께 확인.
- 입력 요약: JD 필수(SQL, 5년 이상 경력, 고객 이슈 대응). Resume(2023.01~2024.02 약 1년 2개월, Excel+Sheets, 성과 별도 정리하지 않음).
- 기대 결과: keyword risk 실제 생성, composite topRisks에 keyword 포함, supporting.insufficientData에 achievement
- 실제 결과 (코드 추적): domainKeywords=["SQL","이슈 대응"] 2개. resume에 "sql"/"이슈 대응" 없음 → matched=[], ratio=0/2=0, severity=high, triggered=true. must(SQL 미충족)→high/critical. experience(1.2년 vs 5년)→high. achievement(세부 성과 없음)→insufficient-data. topRisks=[must, experience, keyword(high)], supporting.insufficientData=[achievement]. overallBand=high_risk.
- 판정: PARTIAL
- 차이 원인: keyword 엔진 이전 insufficient-data → 실제 high risk 생성으로 개선. 단 목표했던 "keyword medium" 조합은 ratio=0으로 달성 불가. 이번 재테스트는 composite 정책 재검증이 아니라 keyword input stabilization 이후 조합 completeness를 확인하는 목적이다. must 우선 정렬과 insufficient-data 분리 규칙은 유지됨.
- 이전 세션 대비: keyword insufficient-data → keyword high로 개선. composite 이전보다 완전해짐(3-way → 4-way triggered).
- 후속 조치: accuracy 후보 — "keyword medium" 조합을 테스트하려면 ratio≈0.3~0.5 범위가 나오는 JD(기술 keyword 6개 중 2~3개 resume 보유) 입력 설계 필요
## follow-up 메모 (2026-04-13) — 리포트 섹션 연결

- 이번 라운드는 엔진 판정 변경이 아니라 결과 화면 표시/근거 노출 연결 라운드다.
- 확인 포인트는 PASS/FAIL 갱신이 아니라, `experience_level_gap`, `gap_explanation_missing`, `jd_keyword_coverage_gap`, `must_requirements_gap`가 결과 화면의 `서류 탈락 원인 분석` 블록에서 각각 별도 섹션으로 보이는지다.
- `buildGapExplanationMissingRisk.js`는 raw에 `gapDescriptions`, `transitionNarratives`만 추가했고 severity는 그대로다.
- `buildJdKeywordCoverageGapRisk.js`는 raw에 `matchedKeywords`, `domainKeywords`만 추가했고 severity는 그대로다.
- follow-up UI 확인 시, 연차/레벨과 공백/이직 섹션의 `입력 예시 보기`가 기존 insufficient-data 도움말과 동일 문구로 연결되는지만 추가 검수하면 된다.

## ROUND2 — 2026-04-13: 체감 검증 + explanation strengthening

### PA-ALIAS-KW-ROUND2-001
- 레이어: Alias Bridge
- 목적: ROUND1 keyword alias bridge 실제 체감 개선 확인
- 검증 방식: 코드 추적 (정적 분석)
- 케이스: JD "Power BI" → resume "PowerBI" or "powerbi"
- TOOL_ALIASES 그룹 포함 여부: power bi, powerbi, pbi 동일 그룹 → _tryAliasMatch 개입 가능
- 판정: 정상 개입 확인 (PASS)
- alias 항목은 aliasMatched[]에 분리 기록, raw.aliasMatchedKeywords로 노출

### PA-ALIAS-KW-ROUND2-002
- 레이어: Alias Bridge
- 목적: cert alias bridge — SQLD/SQL 개발자 흔들림
- 검증 방식: 코드 추적
- 케이스: JD "SQLD" → resume "SQL 개발자" (또는 역방향)
- cert_rules.v0.json jdSignalMapping에서 동일 그룹 포함 확인
- _CERT_KW_GROUPS 경로로 _tryAliasMatch 개입
- 판정: 정상 개입 확인 (PASS)

### PA-ALIAS-KW-ROUND2-FP-001
- 레이어: False Positive 방어
- 목적: TASK_ALIASES 제외 확인
- 검증 방식: 코드 추적
- 케이스: "보고", "협업", "운영" 등 일반 업무 표현
- _tryAliasMatch는 TOOL_ALIASES + _CERT_KW_GROUPS만 참조, TASK_ALIASES 없음
- 판정: false positive 방어 유지 확인 (PASS)

### PA-ALIAS-MUST-ROUND2-001
- 레이어: Alias Bridge (Must)
- 목적: must cert alias bridge 체감 확인
- 검증 방식: 코드 추적
- 케이스: JD mustHave "ADsP" → resume raw text "ADSP"
- _MUST_CERT_GROUPS 경로로 _certAliasMatch 개입
- certAliasResolvedItems에 기록, evidence 문구 추가됨
- 판정: 정상 개입 확인 (PASS)

### PA-EXPLANATION-ROUND2-001
- 레이어: Explanation Strengthening
- 목적: alias bridge 적용 시 사용자 노출 문구 확인
- keyword: aliasMatched.length > 0 → evidence에 "표기만 다른 동일 항목은 보정해 반영했습니다." + "다만 의미가 넓은 일반 업무 표현은 오탐을 막기 위해 보수적으로 제외했습니다." 추가
- must: certAliasResolvedItems.length > 0 → evidence에 "자격증처럼 명칭 흔들림이 잦은 항목은 별도 보정했지만, 일반 업무/역할 표현은 동일선상에서 인정하지 않았습니다." 추가
- 판정: 문구 강산.md 원문 그대로 적용 (PASS)

## ROUND3 — 2026-04-13: read-path explanation hardening

### PA-R3-KW-001 keyword alias 보정 있음 케이스
- aliasMatched >= 1: evidence에 3줄 추가 — "표기만 다른 동일 항목은 보정해 반영했습니다." + "도구·자격증처럼 확인 가능한 항목은 영문/한글/축약 차이를 일부 정규화해 다시 확인했습니다." + "다만 의미가 넓은 일반 업무 표현은 오탐을 막기 위해 보수적으로 제외했습니다."
- 판정: 강산.md 원문 그대로 적용 (PASS)

### PA-R3-KW-002 keyword alias 보정 없음 케이스
- aliasMatched = 0: else 분기 — "이번 결과는 이력서에서 직접 확인되는 표현 중심으로 정리했습니다." + "의미가 넓게 퍼질 수 있는 일반 업무 표현은 오탐을 막기 위해 보수적으로 연결하지 않았습니다."
- 판정: 강산.md 원문 그대로 적용 (PASS)

### PA-R3-MUST-001 must cert alias 보정 있음 케이스
- triggered && certAliasResolvedItems >= 1: "필수요건은 과대판정을 막기 위해 더 보수적으로 확인했습니다." + "자격증처럼..." + "즉, 현재 미충족으로 남은 항목은 표현 차이를 일부 보정한 뒤에도 직접 근거가 약한 항목입니다."
- 판정: 강산.md 원문 그대로 적용 (PASS)

### PA-R3-MUST-002 must cert alias 보정 없음 케이스
- triggered && certAliasResolvedItems = 0: "필수요건은 과대판정을 막기 위해 더 보수적으로 확인했습니다." + "현재 미충족으로 남은 항목은 이력서에서 직접 근거가 약하거나 확인되지 않은 항목입니다."
- 판정: 강산.md 원문 그대로 적용 (PASS)

### PA-R3-REGRESSION
- severity 계산 변경 없음
- composite/top3 변경 없음
- UI 구조 변경 없음
- consumer(PreciseAnalysisFlow.jsx) 변경 없음 — evidence[] read path 그대로
- exact/miss 계산 변경 없음

## ROUND4 — 2026-04-13: precision trap hardening

### 조사 결과
- precision trap owner: buildJdKeywordCoverageGapRisk.js
- exact match 경로: coverageNorm.includes(kw) — "sql"이 "mysql"/"postgresql"/"nosql" substring으로 오탐
- alias bridge 경로: TOOL_ALIASES.sql=["sql","mysql","mssql","postgresql"] — exact miss 후에도 alias bridge로 연결
- 두 경로 모두 차단 필요

### 패치 방식: left-boundary guard + alias block map (1파일 수정)
- _PT_BOUNDARY: {"sql"} — includes() 대신 (?<![a-z0-9])sql regex 적용
- _PT_ALIAS_BLOCK: sql → {mysql, mssql, postgresql} 연결 차단
- _tryAliasMatch 내부 ptBlock 체크 추가

### PA-R4-BLOCK-001 sql → mysql (차단)
- JD "sql" / resume "mysql 사용" → _leftBoundaryMatch: "y" precedes "sql" → blocked
- alias bridge: ptBlock.has("mysql") = true → blocked
- 판정: missing ✓

### PA-R4-BLOCK-002 sql → postgresql (차단)
- JD "sql" / resume "postgresql 운영" → "e" precedes "sql" → blocked / ptBlock → blocked
- 판정: missing ✓

### PA-R4-BLOCK-003 sql → nosql (차단)
- JD "sql" / resume "nosql 경험" → "o" precedes "sql" → blocked
- alias bridge: "nosql" not in TOOL_ALIASES sql group → 원래 안 연결됨
- 판정: missing ✓

### PA-R4-KEEP-001 sql → sql 작성 (유지)
- JD "sql" / resume "sql 작성" → start precedes "sql" → passes
- 판정: exactMatched ✓

### PA-R4-KEEP-002 sql → oracle sql (유지)
- JD "sql" / resume "oracle sql 사용" → space precedes "sql" → passes
- 판정: exactMatched ✓

### PA-R4-KEEP-003 sql → sqld 보유 (유지)
- JD "sql" / resume "sqld 보유" → start precedes "sql" in "sqld" → passes
- 판정: exactMatched ✓

### PA-R4-ALIAS-001 power bi / excel alias bridge regression (유지)
- "power bi" → NOT in _PT_BOUNDARY → includes() 그대로 → no change
- "excel" → NOT in _PT_BOUNDARY → no change
- alias bridge: NOT in _PT_ALIAS_BLOCK → ptBlock=null → 기존 동작 유지
- 판정: regression 없음 ✓

### 경계 케이스 조사 (이번 라운드 패치 제외)
- "ga": saga/engagement/yoga 등 substring 위험 높음. 단 "ga"가 JD keyword로 단독 추출되는 빈도 낮음. 다음 라운드 후보.
- "bi": airbnb/mobile 등 위험. TOOL_ALIASES에 "bi" 단독 그룹 없음. 다음 라운드 후보.
- "hr": architecture/three 위험. 현재 이번 라운드 미적용.

## ROUND5 — 2026-04-13: short-keyword precision pack (ga/bi/hr)

### 조사 결과
- ga/bi/hr 모두 TOOL_ALIASES 미포함 → alias bridge 차단 불필요
- _PT_BOUNDARY 추가만으로 충분 (1줄 수정)

### 후보 판정
- ga: A — engagement/saga/legal substring 오탐 높음. GA/GA4 선두 위치로 정상 유지.
- bi: A — ambition/mobile/mobility substring 오탐 높음. "BI", "power bi" 공백 선행으로 정상 유지.
- hr: A — three/thrive substring 오탐. HR/HRM 선두 위치로 정상 유지.

### PA-R5-BLOCK-GA-001
- JD "ga" / resume "customer engagement 운영" → "enga**ga**ment" left char n → blocked ✓
- JD "ga" / resume "saga 프로젝트" → left char a → blocked ✓
- JD "ga" / resume "legal agreement" → left char e → blocked ✓

### PA-R5-KEEP-GA-001
- JD "ga" / resume "GA 운영" → 선두 위치 → passes ✓
- JD "ga" / resume "GA4 분석" → 선두 위치 → passes ✓
- 참고: "Google Analytics" → "google analytics"에 "ga" substring 없음 → 이미 miss (패치 무관)

### PA-R5-BLOCK-BI-001
- JD "bi" / resume "ambition-driven" → left char m → blocked ✓
- JD "bi" / resume "mobility strategy" → left char o → blocked ✓
- JD "bi" / resume "combination 전략" → left char m → blocked ✓
- 참고: "airbnb" → b(3)n(4)b(5), "bi" substring 없음 → 원래 오탐 아님

### PA-R5-KEEP-BI-001
- JD "bi" / resume "BI 대시보드 구축" → 선두 위치 → passes ✓
- JD "bi" / resume "Power BI 사용" → "power bi 사용" 공백 선행 → passes ✓
- 참고: "Business Intelligence" → "bi" substring 없음 → 원래 miss (패치 무관)

### PA-R5-BLOCK-HR-001
- JD "hr" / resume "three projects" → left char t → blocked ✓
- JD "hr" / resume "thrive in startup" → left char t → blocked ✓

### PA-R5-KEEP-HR-001
- JD "hr" / resume "HR 운영" → 선두 위치 → passes ✓
- JD "hr" / resume "HRM 지원" → 선두 위치 → passes ✓
- 참고: "Human Resources" → "hr" substring 없음 → 원래 miss (패치 무관)

### alias bridge regression
- ga/bi/hr 모두 TOOL_ALIASES 미포함 → alias bridge ptBlock 변경 없음 → regression 없음
- sql 계열 기존 ptBlock 유지

## ROUND6 — 2026-04-13: user-scenario QA pack

### SC-01: SQL/PowerBI/Excel — MySQL resume (alias 보정 성공형)
- 입력: JD ["sql","power bi","excel"] / resume: powerbi, 엑셀, mysql
- 실제: sql=missing(mysql ptBlock), power bi=aliasMatched, excel=aliasMatched
- ratio=2/3≈0.67, severity=low, aliasMatched=2
- 판정: PASS — SQL miss 납득, Power BI/Excel 보정 자연스러움

### SC-02: SQLD/데이터리포팅 must — cert alias 보수 판정형
- 입력: must ["sqld","데이터 리포팅 경험"] / resume: SQL 개발자 자격증 보유, 대시보드 운영 경험
- 실제: sqld=certAliasResolved, 데이터 리포팅 경험=missing
- effectiveMustMiss=1, severity=medium, 보수 판정 3줄 문구 노출
- 판정: PASS — cert alias 구제 성공, 일반 업무 표현 보수 판정 납득

### SC-03: GA/BI — engagement/mobility/Power BI (precision trap 방어형)
- 입력: JD ["ga","bi"] / resume: engagement, mobility, Power BI
- 실제: ga=missing(engagement 오탐 차단), bi=exactMatched(power bi 공백 선행 통과)
- ratio=1/2=0.5, severity=medium
- 판정: PASS — precision trap 방어 성공, Power BI에서 bi 정상 매칭

### SC-04: HR — three/HRM (precision trap 방어형)
- 입력: JD ["hr"] / resume: three years of 운영 경험, HRM 운영 지원
- 실제: hr=exactMatched(three 차단, hrm 선두 통과)
- ratio=1/1, severity=none, triggered=false
- 판정: PASS — precision 방어 성공, HRM 자연스럽게 통과

### SC-05: SQL/Tableau/ADsP/stakeholder — mixed 현실형
- 입력: JD ["sql","tableau","adsp","stakeholder communication"] / resume: sql query, adsp, 유관부서 협업
- 실제: sql=exactMatched, adsp=exactMatched, tableau=missing, stakeholder communication=missing
- ratio=2/4=0.5, severity=medium, aliasMatched=0
- 판정: BORDERLINE — engine은 맞음. "stakeholder communication" miss는 "유관부서 협업" 한/영 차이로 발생. evidence 문구 "의미가 넓게 퍼질 수 있는 일반 업무 표현은 오탐을 막기 위해 보수적으로 연결하지 않았습니다."로 커버. 분류: backlog 문제(한/영 업무 표현 브리지 미구현)

### SC-06: Korean-English backlog 노출형
- 입력: JD ["마케팅 경험 3년 이상","campaign management"] / resume: 마케팅팀 근무, 캠페인 기획
- 실제: 둘 다 missing, severity=high
- 판정: FAIL(backlog) — 의도된 한계. 서술형 기간/한영 표현 브리지 미구현. 이번 라운드 범위 밖.

### 즉시 수정 필요 여부
- 없음. 모든 FAIL/BORDERLINE은 backlog 문제로 분류됨.

### 전체 총평
- ROUND1-5 패치 조합이 실제 시나리오에서 예상대로 작동함
- alias 보정(keyword/must), precision trap 방어(sql/ga/bi/hr), 보수 판정 문구가 함께 납득됨
- 사용자에게 보여도 되는 수준: 조건부 YES (tool/cert 중심 JD에서 납득 가능)
- 아직 조심할 조건: 한/영 혼용 업무 표현, 서술형 요건, Tableau 등 TOOL_ALIASES 미포함 툴
- 다음 1순위: backlog — 한/영 업무 표현 브리지 또는 TOOL_ALIASES 확장(Tableau 등)


## 2026-04-13 ROUND7 Real-Case Packet QA

### 테스트 성격
- 실제 업로드 사례를 resume-style packet으로 재구성한 현실 QA 라운드.
- 메인 케이스 3건: 김나래 / 에실로 Sales Representative / 연구직 -> GTA·CRA 전환.
- weak pair는 qualitative 참고용으로만 분리.
- 범위: keyword 판정, must 판정, precision trap 방어 유지 여부, 사용자 노출 가능성.
- docs/끄적.md는 상위 금지 규칙에 따라 미접근.

### ROUND7-RC-001 / CASE-A
- 기대 판정: data/AI/SQL/PM hit, consulting deliverable/고객 과제 정의/제안형 브릿지는 약함.
- QA 판정: BORDERLINE
- 분류: explanation/read-path + pair 자체 한계

### ROUND7-RC-002 / CASE-B
- 기대 판정: 광학 전공/면허/업계 인턴/고객응대 hit, 매출관리/account management/채널 운영 공백은 miss 유지.
- QA 판정: BORDERLINE
- 분류: explanation/read-path

### ROUND7-RC-003 / CASE-C
- 기대 판정: SOP/문서화/정확성/정합성 hit, site monitoring/IRB·EC/TMF·eTMF/query resolution은 miss 유지.
- QA 판정: BORDERLINE
- 분류: explanation/read-path + pair 자체 한계

### ROUND7 종합 결론
- 3개 메인 케이스 모두 즉시 엔진 수정 신호는 없음.
- precision trap 방어가 깨졌다고 볼 사례는 없음.
- 이번 라운드의 핵심 이슈는 engine bug보다 read-path 품질이다.
- backlog: target role 추정 기반 QA 표시 강화 / role bridge 부족과 transferable strength 동시 설명 / 컨설팅·세일즈·clinical ops 설명 보강


## 2026-04-13 ROUND8 Transferable-Strength Explanation Patch

### 테스트 성격
- 전환형 BORDERLINE explanation hardening
- 범위는 keyword/must builder evidence[] 한정
- consumer, severity, composite, ordering 무수정

### owner 확인
- keyword builder anchor: matchedKeywordCount / missingKeywordCount / const raw
- must builder anchor: effectiveMustHit / effectiveMustMiss / requiredLines.length
- consumer anchor: PreciseAnalysisFlow.jsx 의 risk.evidence -> evidenceItems read-path

### mixed profile 검증
- keyword: matchedKeywordCount >= 1 && missingKeywordCount >= 1 조건 추가 확인
- must: effectiveMustHit >= 1 && effectiveMustMiss >= 1 조건 추가 확인
- 각 builder에 지정 문구 2줄 존재 확인

### strong/full miss 검증
- 조건문이 mixed profile 전용이라 strong/full miss에는 비노출
- hopeful wording이 완전 miss에 확장되지 않음

### regression
- npm run -s build: PASS
- severity/composite/top3/risk ordering 관련 코드 변경 없음
- alias bridge / precision pack(sql/ga/bi/hr) 관련 코드 변경 없음


## 2026-04-13 ROUND9 Experience Duration Patch

### 테스트 성격
- producer-first duration normalization + aggregation
- consumer 계산 없음
- experience_level_gap 최종 판정 입력 반영까지 확인

### 기간 파싱
- 2023.02 ~ 2025.01 -> 24개월 확인
- 2년 3개월 -> 27개월 확인
- 3년 1개월 -> 37개월 확인
- 2022.05.09 ~ 2025.07.11 (3년 2개월 3일) -> 38개월 확인
- 2025.08 ~ 현재 -> 현재 시점 기준 9개월 확인

### 합산 / overlap
- 2년 3개월 + 3년 1개월 -> 64개월 = 5년 4개월 확인
- 2023.01 ~ 2023.12 + 2023.06 ~ 2024.03 -> raw 22개월 / unique 15개월 확인

### 실제 사례형 적용
- 김나래 유사 입력
  - 2022.05.09 ~ 2025.07.11
  - 2025.08 ~ 현재
  -> rawTotalMonths 47 / uniqueTotalMonths 47 / counted 2 확인
- experience_level_gap raw.totalCareerMonths가 duration pack uniqueTotalMonths를 사용함을 확인

### regression
- npm run -s build: PASS
- severity/composite/top3/risk ordering 변경 없음
- keyword/must/precision pack(sql/ga/bi/hr) 무영향
- UI layout 무영향

## 2026-04-13 ROUND10 - function mix + recency weighting

### 기능 혼합 케이스
- 입력: 2020.01 ~ 2021.12 marketing / 2022.01 ~ 2024.12 field sales
- 결과: rawTotalMonths 60 / uniqueTotalMonths 60
- 결과: primaryFunction = sales
- 결과: dominantRecentFunction = sales
- 결과: secondaryFunctions에 marketing 유지
- 검증: 2년 마케팅 + 3년 영업을 단순 총경력 5년이 아니라 영업 우세로 읽음

### 분석 PM 케이스
- 입력: 2021.01 ~ 2023.06 data analytics / 2023.07 ~ current PM
- 결과: dominantRecentFunction = project_management
- 결과: primaryFunction = project_management
- 결과: secondaryFunctions에 data_analytics 유지

### 실제 사례형 적용
- 김나래 유사 입력
  - 결과: primaryFunction = project_management
  - 결과: dominantRecentFunction = operations
  - 결과: secondaryFunctions = data_analytics, operations
  - 결과: 총 경력은 충분하지만 주력 기능과 타깃 기능 차이 + 인접 기능 전환 문구가 evidence에 추가됨
- 연구 CRA 전환 유사 입력
  - 결과: primaryFunction = research_rnd
  - 결과: targetFunctionHint = operations
  - 결과: 연구 중심 누적 기능과 타깃 직접 수행 경험 구분 문구가 evidence에 추가됨

### regression
- ROUND9 duration pack 무영향 확인
- keyword/must/precision pack 무영향 확인
- severity/composite/top3/risk ordering 변경 없음
- UI layout 변경 없음
- npm run -s build: PASS
