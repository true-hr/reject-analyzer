# Explanation Ready Evidence Schema

작성일: 2026-04-08  
버전: v1.0  
성격: SSOT / 설계 문서 / 코드 변경 없음

---

## 1. 문서 목적

이 문서는 신입 5축 엔진에서 사용하는 입력 데이터를 **설명 가능한 evidence 단위**로 정리하기 위한 schema를 정의한다.

목적은 세 가지다.

1. scorer용 signal과 explanation용 evidence를 구분한다.  
2. 같은 입력을 축마다 다른 속성으로 읽을 수 있게 만든다.  
3. 이후 `scoreReason`, `liftOrLimit`, QA fixture가 모두 같은 evidence 구조를 참조하게 만든다.

이 문서는 "새 엔진 설계" 문서가 아니다.  
이미 존재하는 rich signals / reasons / summary 자산을 버리지 않고, explanationCard와 score-anchor 체계가 읽을 수 있는 **evidence-ready shape**로 정리하는 문서다.

---

## 2. 전역 원칙

### 2-1. 입력 raw data와 explanation evidence는 다르다
raw input은 사용자가 넣은 값이고, explanation evidence는 그 값을 축별 해석에 쓸 수 있도록 정리한 구조다.

예:
- raw: `컴퓨터공학 전공`
- evidence: `majorEvidence.majorLinkType = direct`

즉, explanation은 raw를 직접 읽지 않고, raw를 해석한 evidence를 읽는다.

---

### 2-2. scorer signal과 explanation evidence는 구분한다
같은 정보원이 scorer와 explanation 양쪽에 쓰일 수는 있지만, 역할은 구분한다.

- scorer signal: 계산/분기용
- explanation evidence: 사용자에게 설명 가능한 단위

금지:
- scorer 내부 플래그를 그대로 사용자 문장으로 노출
- signal이 곧 explanation이라고 간주하는 것

---

### 2-3. 같은 입력도 축마다 다른 속성으로 읽는다
같은 project도 축마다 읽는 속성이 달라야 한다.

예:
- Axis1: role directness
- Axis2: industry context
- Axis3: outcome / responsibility / duration
- Axis4: stakeholder exposure / interaction
- Axis5: behavior alignment / self-report consistency

금지:
- project 하나를 모든 축에서 같은 이유로 재사용
- "프로젝트 경험이 있습니다"를 1/2/3축 모두에서 반복

---

### 2-4. explanation evidence는 최소 "설명 가능한 이름"을 가져야 한다
모든 evidence는 최소 아래 둘 중 하나를 가져야 한다.

- 사용자에게 보여줄 label
- builder 내부에서 쓸 evidenceSummaryLabel

설명이 가능한 이름 없이 boolean만 있으면 explanation 품질이 급격히 떨어진다.

---

### 2-5. evidence는 최소 positive / limiting 양쪽 해석 가능성이 있어야 한다
좋은 schema는 "강한 근거"만 담는 구조가 아니라,
왜 상위 점수로 못 올라갔는지도 읽을 수 있어야 한다.

즉 evidence schema는 가능한 한 아래 두 방향을 모두 허용해야 한다.

- positive reading
- limiting reading

---

## 3. evidence 공통 상위 구조

모든 explanation-ready evidence pack은 아래 상위 구조를 따른다.

```json
{
  "majorEvidence": {},
  "projectEvidence": [],
  "internshipEvidence": [],
  "contractEvidence": [],
  "certificationEvidence": [],
  "strengthsEvidence": {},
  "workstyleEvidence": {},
  "metaEvidence": {}
}
```

---

## 4. 공통 필드 규칙

각 evidence object는 가능한 한 아래 공통 필드를 따른다.

```json
{
  "sourceType": "major | project | internship | contract | certification | strengths | workstyle",
  "label": "",
  "evidenceSummaryLabel": "",
  "explanationUsable": true,
  "confidence": "high | medium | low",
  "rawSourceAvailable": true
}
```

필드 설명

- sourceType: 입력 출처
- label: 사용자에게 보여줄 수 있는 이름
- evidenceSummaryLabel: explanation builder가 우선 사용할 축약 레이블
- explanationUsable: 설명에 직접 써도 되는지
- confidence: 해석 신뢰 수준
- rawSourceAvailable: 원래 입력값 추적 가능 여부

금지:

- label 없이 boolean만 존재
- explanationUsable=false인 evidence를 주요 explanation에 직접 사용

---

## 5. 대분류 A. 입력 타입별 evidence schema

### 5-1. majorEvidence

#### 목적

전공이 직무/산업과 어떻게 연결되는지를 설명 가능한 단위로 정리

#### schema

```json
{
  "sourceType": "major",
  "label": "",
  "evidenceSummaryLabel": "",
  "majorCategory": "",
  "majorSubcategory": "",
  "majorLinkTypeToTargetJob": "direct | adjacent | weak | mismatch | none",
  "majorLinkTypeToTargetIndustry": "direct | support | weak | mismatch | none",
  "majorWeightApplied": "strong_bonus | light_bonus | neutral | light_penalty | strong_penalty",
  "primaryReadingAxis": ["axis1", "axis2"],
  "explanationUsable": true,
  "confidence": "high | medium | low"
}
```

#### 핵심 해석 포인트

- Axis1에서는 직무 직접성
- Axis2에서는 산업 맥락 연관성

positive reading 예
- 직무 direct
- 산업 support 이상

limiting reading 예
- mismatch
- weak
- major만 있고 role evidence 없음

---

### 5-2. projectEvidence

#### 목적

프로젝트를 축별로 다르게 읽을 수 있도록 다속성 evidence로 정리

#### schema

```json
{
  "sourceType": "project",
  "label": "",
  "evidenceSummaryLabel": "",
  "projectRoleLabel": "",
  "roleDirectnessToTargetJob": "direct | adjacent | weak | none",
  "industryContextFit": "strong | support | weak | none",
  "outcomeLevel": "strong | support | none",
  "responsibilityLevel": "high | medium | low | none",
  "durationLevel": "long | medium | short | none",
  "stakeholderExposureLevel": "external_strong | internal_support | weak | none",
  "stakeholderTypes": [],
  "behaviorAlignmentHint": "strong | support | weak | none",
  "primaryReadingAxis": ["axis1", "axis2", "axis3", "axis4", "axis5"],
  "explanationUsable": true,
  "confidence": "high | medium | low"
}
```

#### 축별 읽는 방식

- Axis1: roleDirectnessToTargetJob
- Axis2: industryContextFit
- Axis3: outcomeLevel, responsibilityLevel, durationLevel
- Axis4: stakeholderExposureLevel, stakeholderTypes
- Axis5: behaviorAlignmentHint

금지
- project를 단순 count로만 저장
- outcome/responsibility/duration을 분리하지 않음
- stakeholder exposure 없이 interaction 축에 재사용

---

### 5-3. internshipEvidence

#### 목적

인턴/현장 경험이 직무/산업/상호작용/실행 깊이에 미치는 영향을 구조화

#### schema

```json
{
  "sourceType": "internship",
  "label": "",
  "evidenceSummaryLabel": "",
  "roleLabel": "",
  "roleDirectnessToTargetJob": "direct | adjacent | weak | none",
  "industryContextFit": "strong | support | weak | none",
  "responsibilityLevel": "high | medium | low | none",
  "durationLevel": "long | medium | short | none",
  "stakeholderExposureLevel": "external_strong | internal_support | weak | none",
  "stakeholderTypes": [],
  "interactionStrength": "strong | support | weak | none",
  "primaryReadingAxis": ["axis1", "axis2", "axis3", "axis4"],
  "explanationUsable": true,
  "confidence": "high | medium | low"
}
```

#### 핵심 해석 포인트

- Axis1: project보다 실제 role directness를 더 강하게 읽을 수 있음
- Axis2: 산업 현장성의 핵심 source가 될 수 있음
- Axis3: duration + responsibility가 중요
- Axis4: external stakeholder 접점의 핵심 근거가 될 수 있음

---

### 5-4. contractEvidence

#### 목적

계약직/파트타임/단기 실무 경험을 독립된 evidence로 보존

#### schema

```json
{
  "sourceType": "contract",
  "label": "",
  "evidenceSummaryLabel": "",
  "roleLabel": "",
  "roleDirectnessToTargetJob": "direct | adjacent | weak | none",
  "industryContextFit": "strong | support | weak | none",
  "responsibilityLevel": "high | medium | low | none",
  "durationLevel": "long | medium | short | none",
  "stakeholderExposureLevel": "external_strong | internal_support | weak | none",
  "stakeholderTypes": [],
  "interactionStrength": "strong | support | weak | none",
  "primaryReadingAxis": ["axis1", "axis2", "axis3", "axis4"],
  "explanationUsable": true,
  "confidence": "medium | low | high"
}
```

#### 주의

internshipEvidence와 매우 유사하더라도 sourceType은 분리 유지한다.  
이유:

- 설명에서 "인턴"과 "계약/파트타임"은 사용자 체감 의미가 다름
- QA fixture에서 분리 검증이 필요함

---

### 5-5. certificationEvidence

#### 목적

자격/수료/교육 신호를 산업 및 직무 보조 evidence로 구조화

#### schema

```json
{
  "sourceType": "certification",
  "label": "",
  "evidenceSummaryLabel": "",
  "certType": "license | course | bootcamp | training | other",
  "jobRelevance": "direct | support | weak | none",
  "industryRelevance": "direct | support | weak | none",
  "practicalSignalStrength": "strong | support | weak | none",
  "primaryReadingAxis": ["axis1", "axis2"],
  "explanationUsable": true,
  "confidence": "high | medium | low"
}
```

#### 원칙

- certification은 Axis1/2의 보조 근거다
- project/internship보다 우선 근거가 되면 안 되는 케이스가 많다
- 단독으로 고점을 만들지 않도록 schema 해석 단계에서 주의

---

### 5-6. strengthsEvidence

#### 목적

self-report된 강점을 설명 가능한 matching evidence로 구조화

#### schema

```json
{
  "sourceType": "strengths",
  "label": "",
  "evidenceSummaryLabel": "",
  "matchedStrengthLabels": [],
  "matchStrengthLevel": "strong | support | weak | none",
  "selfReportOnlyRisk": "high | medium | low",
  "experienceAlignmentHint": "strong | support | weak | none",
  "primaryReadingAxis": ["axis5"],
  "explanationUsable": true,
  "confidence": "medium | low | high"
}
```

#### 주의

Axis5는 self-report 축이므로 반드시 아래 해석을 허용해야 한다.

- positive: 직무 성향과 맞는 강점 신호
- limiting: 자기보고 수준에 머무는 위험

---

### 5-7. workstyleEvidence

#### 목적

일하는 방식(workstyle)과 직무 요구의 적합성을 self-report 기반 evidence로 구조화

#### schema

```json
{
  "sourceType": "workstyle",
  "label": "",
  "evidenceSummaryLabel": "",
  "matchedWorkStyleLabels": [],
  "workStyleMatchLevel": "strong | support | weak | none",
  "interactionEligibleHint": "strong | support | weak | none",
  "experienceAlignmentHint": "strong | support | weak | none",
  "selfReportOnlyRisk": "high | medium | low",
  "primaryReadingAxis": ["axis4", "axis5"],
  "explanationUsable": true,
  "confidence": "medium | low | high"
}
```

#### 축별 읽는 방식

- Axis4에서는 "누구를 상대했는가"가 핵심이므로 workstyle은 보조 signal만 허용
- Axis5에서는 "어떻게 일하는가"가 핵심이므로 주요 signal 허용

금지
- Axis4 scoreReason을 workstyle만으로 설명
- Axis5 scoreReason을 interaction experience만으로 설명

---

### 5-8. metaEvidence

#### 목적

설명 조립에 필요한 meta-level 판단 정보를 별도 보관

#### schema

```json
{
  "primaryEvidenceSource": "major | project | internship | contract | certification | strengths | workstyle | mixed | none",
  "alignedSourceCount": 0,
  "countOnlyFallbackUsed": false,
  "selfReportAlignedDirectly": false,
  "explanationConfidenceOverall": "high | medium | low"
}
```

#### 역할

이 값들은 개별 evidence가 아니라 assembly helper에서 쓰는 meta context다.  
직접 사용자 문장으로 노출하지는 않되, criteria Layer B / scoreReason / fallback guard에 사용 가능하다.

---

## 6. 대분류 B. 축별 evidence reading map

### 6-1. Axis1 reading map

#### 핵심 질문

전공과 역할 경험이 목표 직무 과업과 얼마나 직접 이어지는가

#### 우선 참조 evidence

- majorEvidence.majorLinkTypeToTargetJob
- projectEvidence[].roleDirectnessToTargetJob
- internshipEvidence[].roleDirectnessToTargetJob
- contractEvidence[].roleDirectnessToTargetJob
- certificationEvidence.jobRelevance (보조만)

금지
- industryContextFit을 Axis1 핵심 근거로 사용
- outcomeLevel을 Axis1 scoreReason 주근거로 사용

---

### 6-2. Axis2 reading map

#### 핵심 질문

목표 산업 문맥과 연결되는 evidence가 얼마나 직접적이고 반복적인가

#### 우선 참조 evidence

- majorEvidence.majorLinkTypeToTargetIndustry
- certificationEvidence.industryRelevance
- projectEvidence[].industryContextFit
- internshipEvidence[].industryContextFit
- contractEvidence[].industryContextFit

금지
- roleDirectnessToTargetJob을 Axis2 핵심 근거로 사용
- 단순 자격 유무만으로 high band 판정

---

### 6-3. Axis3 reading map

#### 핵심 질문

실제로 얼마나 깊이 있게 맡아 수행했고 결과/지속성이 있었는가

#### 우선 참조 evidence

- projectEvidence[].outcomeLevel
- projectEvidence[].responsibilityLevel
- projectEvidence[].durationLevel
- internshipEvidence[].responsibilityLevel
- internshipEvidence[].durationLevel
- contractEvidence[].responsibilityLevel
- contractEvidence[].durationLevel

금지
- roleDirectness만으로 Axis3 고점 판정
- stakeholder exposure만으로 Axis3 설명

---

### 6-4. Axis4 reading map

#### 핵심 질문

누구와 어떤 접점에서 얼마나 직접적으로 상호작용했는가

#### 우선 참조 evidence

- projectEvidence[].stakeholderExposureLevel
- projectEvidence[].stakeholderTypes
- internshipEvidence[].stakeholderExposureLevel
- internshipEvidence[].stakeholderTypes
- contractEvidence[].stakeholderExposureLevel
- contractEvidence[].stakeholderTypes
- workstyleEvidence.interactionEligibleHint (보조만)

금지
- strengths/workstyle만으로 Axis4 핵심 판정
- stakeholderTypes 없이 "소통형" 같은 generic wording 사용

---

### 6-5. Axis5 reading map

#### 핵심 질문

강점/일 방식이 직무 요구와 얼마나 맞고 실제 경험과 얼마나 정합적인가

#### 우선 참조 evidence

- strengthsEvidence.matchStrengthLevel
- workstyleEvidence.workStyleMatchLevel
- strengthsEvidence.experienceAlignmentHint
- workstyleEvidence.experienceAlignmentHint
- metaEvidence.selfReportAlignedDirectly

금지
- stakeholder exposure를 Axis5 핵심 근거로 사용
- self-report only 상태를 high confidence처럼 설명

---

## 7. 대분류 C. evidence → selector 연결 규칙

### 7-1. primary positive selector 입력 규칙

primary positive는 각 축에서 아래 조건을 만족하는 evidence 중 가장 강한 것을 선택한다.

- explanationUsable = true
- 해당 축의 핵심 reading field가 support 이상
- label 또는 evidenceSummaryLabel 존재

---

### 7-2. primary limiting selector 입력 규칙

primary limiting은 각 축에서 아래 조건을 만족하는 evidence 또는 meta 상태를 선택한다.

- 핵심 reading field가 weak / none
- selfReportOnlyRisk가 high
- countOnlyFallbackUsed = true
- alignedSourceCount 부족
- explanationUsable = true 또는 metaEvidence 기반으로 설명 가능

---

### 7-3. secondary evidence selector 입력 규칙

secondary는 아래 경우에만 사용한다.

- primary만으로 explanation이 지나치게 빈약할 때
- positive/limiting 한쪽이 너무 약할 때
- Layer B evidence 명시가 필요할 때

---

## 8. 대분류 D. scoreReason / liftOrLimit와의 연결

### 8-1. scoreReason 연결 규칙

scoreReason은 evidence schema에서 최소 아래 2개를 같이 참조해야 한다.

- primaryPositiveEvidence
- primaryLimitingEvidence

즉 scoreReason은 schema 상으로도 pair 구조를 전제한다.

---

### 8-2. liftOrLimit 연결 규칙

liftOrLimit는 evidence schema에서 아래 둘 중 하나를 참조한다.

- nextLiftEvidenceType
- structuralLimitEvidenceType

즉 evidence schema는 처음부터 lift mode / limit mode 조립을 지원해야 한다.

---

### 8-3. Axis5 예외 규칙

Axis5는 반드시 아래 둘을 같이 볼 수 있어야 한다.

- matched self-report signal
- self-report only risk 또는 experience alignment 부족

이 구조가 없으면 Axis5 explanation이 다시 positive 편향으로 흐른다.

---

## 9. 실패 패턴

### 9-1. raw input direct use

실패:

raw 전공명/프로젝트명을 바로 문장으로 넣고 해석 속성이 없음

왜 실패인가:

- scorer와 explanation의 연결이 끊김
- QA 불가능

---

### 9-2. count 중심 schema

실패:

projectCount, internshipCount만 있고 role/outcome/stakeholder가 없음

왜 실패인가:

- Axis1/3/4를 구분할 수 없음

---

### 9-3. self-report 과신 schema

실패:

strengths/workstyle에 positive match만 있고 risk/consistency 필드 없음

왜 실패인가:

- Axis5가 무조건 고평가됨

---

### 9-4. 축 간 속성 미분리

실패:

project 하나를 "좋은 경험"으로만 저장

왜 실패인가:

- Axis1/2/3/4가 같은 이유를 반복

---

## 10. 구현 전 체크포인트

| 체크포인트 | 이유 | 대상 |
|---|---|---|
| 기존 signals를 위 schema 필드에 매핑 가능한지 | 신규 데이터 생성이 아니라 기존 자산 승격이어야 함 | buildNewgradAxisPack.js |
| axisExplanationRegistry의 reasons/helper가 이 schema를 읽도록 바꿀 수 있는지 | explanation 조립 연결 필요 | axisExplanationRegistry.js |
| metaEvidence를 builder가 별도 필드로 받을지 내부 조립할지 | assembly owner 명확화 필요 | axisExplanationRegistry.js |
| project/internship/contract가 구분 저장 가능한지 | sourceType 유지 필요 | input normalization 경로 |
| Axis5 risk 필드가 실제로 생성 가능한지 | self-report bias 방지 | strength/workstyle helper |

---

## 11. 다음 단계 연결

이 문서 다음 단계는 아래 순서다.

1. 00_HQ/Axis_Evidence_Selection_Rules.md  
   primary positive / primary limiting / secondary 선택 규칙 잠금

2. 00_HQ/Score_Explanation_Alignment_Rules.md  
   scorer와 explanation이 같은 evidence를 읽도록 정렬

3. QA fixture 설계  
   evidence 상태별 expected score / expected explanation 검증

---

## 12. 최종 판단

READY FOR NEXT STEP: YES  
이유:
- 5축별로 어떤 evidence 속성이 필요한지 정의 완료
- scorer signal과 explanation evidence를 구분하는 기준 정의 완료
- 다음 단계(selector rules)로 바로 연결 가능
