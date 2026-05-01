# 정밀 분석 Input Map v1

> 이 문서는 JD + 이력서 기반 정밀 분석의 1차 MVP 구현 전에,
> 각 리스크 엔진이 어떤 입력을 공식 근거로 사용할지 고정하기 위한 기준 문서다.
> 코드 구현 시 이 문서를 직접 참조한다.

---

## 1. 문서 목적

이 문서는 JD + 이력서 기반 정밀 분석의 1차 MVP 구현 전에,
각 리스크 엔진이 어떤 입력을 공식 근거로 사용할지 고정하기 위한 문서다.

핵심 목적은 세 가지다.

1. 엔진 간 역할 중복을 막는다.
2. 판정 근거를 일관되게 유지한다.
3. 이후 threshold 조정과 QA를 쉽게 만든다.

이번 문서의 범위는 1차 MVP 우선 엔진 5개에 한정한다.

- 필수요건 미충족
- 연차/레벨 불일치
- 성과 검증 불가
- 공백/이직 설명 부재
- JD 키워드 반영 부족

---

## 2. 공통 원칙

### 2-1. 데이터 소스 원칙

모든 엔진의 원천 데이터는 JD 원문과 이력서 원문이다.
다만 엔진은 원문을 직접 판정에 쓰지 않고, 구조화된 필드와 요약 신호를 공식 입력으로 사용한다.

### 2-2. 핵심 입력 / 보조 입력 / 제외 입력

각 엔진은 아래 세 가지를 분리해 정의한다.

- **핵심 입력**: 해당 엔진의 주 판정 근거
- **보조 입력**: severity 조정 또는 근거 보강용
- **제외 입력**: 이 엔진에서 보지 않기로 한 입력

### 2-3. 엔진 경계 원칙

한 엔진은 하나의 핵심 질문에 답해야 한다.
여러 리스크를 한 엔진에서 동시에 판단하지 않는다.

### 2-4. 1차 MVP 우선 원칙

1차에서는 rule-based 또는 rule 중심 hybrid 엔진만 우선한다.
AI 생성 성격이 강한 항목은 뒤로 미룬다.

---

## 3. 1차 MVP 엔진별 Input Map

### 3-1. 필수요건 미충족

**엔진 목적**
JD의 필수 자격, 필수 경험, 필수 역량 중 이력서에서 직접 확인되지 않는 항목이 있는지 판정한다.

**핵심 입력**
- `fit.match.must.miss`
- `fit.match.must.hits`
- `fit.summary.must_total`
- `fit.summary.must_hit`
- `fit.summary.must_miss`

**보조 입력**
- `fit.jdModel.mustHave`
- `fit.jdModel.sections.requiredLines`
- `parsedJd.parsed.constraints`

**제외 입력**
- `parsedResume.parsed.timeline`
- `parsedResume.parsed.achievements`
- `parsedResume.parsed.gaps`
- `fit.jdModel.domainKeywords`

**판정 질문**
- JD 필수요건 중 직접 확인되는 항목은 몇 개인가?
- 미확인 항목은 실제 필수 섹션 기반인가?
- 우대사항이 필수요건으로 잘못 흡수된 것은 아닌가?

**설계 메모**
이 엔진은 "지원 자격 충족 여부"만 다룬다.
성과, 공백, 산업 맥락을 섞지 않는다.

---

### 3-2. 연차/레벨 불일치

**엔진 목적**
JD의 요구 연차 또는 시니어리티와 이력서상 확인되는 경력 기간이 어긋나는지 판정한다.

**핵심 입력**
- `fit.jdModel.experienceYears`
- `fit.resume.structured.employmentPeriods`

**보조 입력**
- `fit.resume.ageHint`
- `parsedResume.parsed.timeline`

**제외 입력**
- `parsedResume.parsed.achievements`
- `fit.match.must.miss`
- `fit.jdModel.domainKeywords`
- `parsedResume.parsed.gaps`

**판정 질문**
- JD 최소 연차 대비 이력서상 확인 가능한 총 경력은 얼마인가?
- 기간 누락 때문에 과소 계산되는 것은 아닌가?
- 과잉경력 또는 seniority mismatch 신호가 있는가?

**설계 메모**
이 엔진은 기간과 레벨만 다룬다.
성과나 키워드 문제와 섞지 않는다.

---

### 3-3. 성과 검증 불가

**엔진 목적**
이력서에서 결과, 수치, 성과 근거가 충분히 드러나는지 판정한다.

**핵심 입력**
- `parsedResume.parsed.achievements`

**보조 입력**
- `parsedResume.parsed.timeline`
- `parsedResume.parsed.timeline[].bullets`

**제외 입력**
- `fit.resume.structured.employmentPeriods`
- `parsedResume.parsed.gaps`
- `fit.jdModel.experienceYears`
- `fit.jdModel.domainKeywords`

**판정 질문**
- 성과 항목이 존재하는가?
- 수치, 비율, 결과 표현이 충분한가?
- 업무 수행만 있고 결과 설명은 없는가?

**설계 메모**
이 엔진은 "성과가 보이는가"만 다룬다.
이직 패턴, 공백, 연차 이슈와 분리한다.

---

### 3-4. 공백/이직 설명 부재

**엔진 목적**
경력 사이 공백이 존재할 때, 해당 기간에 대한 설명 근거가 이력서 안에 있는지 판정한다.

**핵심 입력**
- `fit.resume.structured.employmentPeriods`
- `parsedResume.parsed.gaps`

**보조 입력**
- `parsedResume.parsed.timeline`
- `parsedResume.parsed.transitionNarrative`

**제외 입력**
- `parsedResume.parsed.achievements`
- `fit.match.must.miss`
- `fit.jdModel.domainKeywords`
- `parsedResume.parsed.skills`

**판정 질문**
- 고용기간 사이에 의미 있는 공백이 있는가?
- 해당 공백에 대한 설명 텍스트가 존재하는가?
- 설명이 있으면 리스크를 얼마나 낮출 것인가?

**설계 메모**
이 엔진은 "공백이 있다"가 아니라 "공백 설명이 없다"를 판정한다.
짧은 재직, 잦은 이직 자체는 별도 엔진으로 다룬다.

---

### 3-5. JD 키워드 반영 부족

**엔진 목적**
JD에서 반복되는 핵심 도메인, 직무 키워드가 이력서에 텍스트 수준에서 반영되어 있는지 판정한다.

**핵심 입력**
- `fit.jdModel.domainKeywords`
- `parsedResume.parsed.skills`
- resume 원문 텍스트

**보조 입력**
- `fit.match.must.miss`
- `fit.match.preferred.miss`
- `parsedResume.parsed.summary`
- `parsedResume.parsed.timeline[].bullets`

**제외 입력**
- `fit.resume.structured.employmentPeriods`
- `parsedResume.parsed.gaps`
- `parsedResume.parsed.achievements` 단독 판정
- `fit.jdModel.experienceYears`

**판정 질문**
- JD 핵심 키워드가 이력서에 얼마나 반영되는가?
- 기술, 도메인 언어가 누락되어 있는가?
- 경험은 있어 보이지만 JD 언어로 번역되지 않은 상태인가?

**설계 메모**
이 엔진은 "표현/반영 부족"을 다룬다.
실제 경험 부족 엔진과 반드시 분리한다.

---

## 4. 엔진 간 경계 규칙

### 4-1. 필수요건 미충족 vs JD 키워드 반영 부족

- **필수요건 미충족**: 자격/조건 자체가 직접 확인되지 않는 문제
- **JD 키워드 반영 부족**: 경험은 있을 수 있으나 JD 언어가 이력서에 반영되지 않은 문제

자격/필수/조건은 필수요건 엔진이 담당하고, 표현/도메인 언어는 키워드 엔진이 담당한다.

### 4-2. 연차/레벨 불일치 vs 공백/이직 설명 부재

- **연차/레벨 불일치**: 총 경력 또는 seniority 총량 문제
- **공백/이직 설명 부재**: 경력 사이 빈 기간 설명 문제

총량은 연차 엔진, 구간 설명은 공백 엔진이 담당한다.

### 4-3. 성과 검증 불가 vs JD 키워드 반영 부족

- **성과 검증 불가**: 결과, 수치, 임팩트 근거 부족
- **JD 키워드 반영 부족**: JD 표현, 도메인 언어 반영 부족

결과 증명은 성과 엔진, 용어 정합성은 키워드 엔진이 담당한다.

---

## 5. 필수요건 분류 정책 v1

### 5-1. Hard Must

아래 중 하나면 Hard Must 후보로 본다.

- JD의 자격요건, 필수요건, 지원자격 섹션에 직접 기재된 항목
- 최소 연차 조건
- 법적, 자격 필수 조건
- 필수 언어, 필수 자격증, 필수 라이선스
- 미충족 시 지원 자체가 어려운 조건

### 5-2. Soft Must

아래는 Soft Must 후보로 본다.

- 필수 섹션에는 없지만 JD 전반에서 반복적으로 강조되는 핵심 업무 역량
- 해당 포지션 수행에 사실상 필수에 가까운 도구나 도메인
- 주요업무와 강하게 연결되는 핵심 경험

### 5-3. Preferred

아래는 Preferred로 본다.

- 우대사항 섹션에 직접 기재된 항목
- 있으면 가산점이지만 없어도 지원 가능한 항목
- 선택적 도메인 경험
- 부가 자격증, 부가 도구 경험

### 5-4. 1차 MVP 적용 원칙

1차 MVP에서는 Hard Must만 "필수요건 미충족" 엔진의 치명 판정 근거로 사용한다.
Soft Must는 후속의 "직무 핵심 경험 부족" 엔진으로 넘긴다.
Preferred는 필수요건 미충족 엔진 severity에 직접 반영하지 않는다.

---

## 6. 다음 구현 우선순위

### 6-1. 바로 구현할 엔진 순서

1. 필수요건 미충족 ← 이미 구현 완료 (precise-risk-v1)
2. 연차/레벨 불일치
3. 성과 검증 불가
4. 공백/이직 설명 부재
5. JD 키워드 반영 부족

### 6-2. 구현 순서 원칙

- 가장 객관적이고 근거가 명확한 엔진부터 구현
- 공통 contract를 먼저 고정
- 리스크별 output shape를 통일
- 한 엔진씩 QA 후 다음 엔진으로 이동

### 6-3. 후속 엔진 (2차 이후)

아래는 2차 이후로 넘긴다.

- 직무 핵심 경험 부족
- 강점 선명도 부족
- 업무 깊이 부족
- 산업 맥락 연결 약함
- 면접 공격 포인트
- 면접 예상질문

---

## 7. 구현 시 주의사항

- 한 엔진이 여러 리스크를 동시에 설명하지 않도록 유지
- 필수요건 엔진에 우대사항을 섞지 말 것
- 공백 엔진과 이직 패턴 엔진을 혼동하지 말 것
- 키워드 부족과 실제 경험 부족을 같은 문제로 취급하지 말 것
- 1차 MVP에서는 가독성/구조 문제 엔진을 억지로 넣지 말 것
