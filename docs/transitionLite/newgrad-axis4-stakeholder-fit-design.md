# Newgrad Axis4 Stakeholder Fit Design

이 문서는 axis4 redesign SSOT 초안이다.
targetJobId-aware stakeholder relevance가 핵심이다.
customer-facing 축으로의 회귀를 금지한다.

## 배경

기존 축4는 `고객 커뮤니케이션 적합성`이라는 이름을 갖고 있었지만, 실제 계산은 개별 직무별 relevance를 읽지 않고 공통 stakeholder weight를 사용했다. 그 결과 서비스기획, HR/채용, 구매/SCM, 운영기획, 데이터/개발, 연구/R&D, 교육기획, 공공계열처럼 고객 직접 응대보다 다른 이해관계자 조율이 더 중요한 직무에서 왜곡 위험이 컸다.

이번 라운드에서 확인된 핵심 사실은 아래와 같다.

- 기존 axis4 score는 `targetJobId`를 읽지 않았다.
- stakeholder taxonomy가 전 직무 공통 5개 bucket에 가깝게 고정돼 있었다.
- `candidate`, `learner`, `public`, `manager`, `cross_function` 같은 richer stakeholder 의미가 score에 반영되지 않았다.
- same input에서 `targetJobId`만 바뀌어도 axis4 점수와 요약이 거의 같게 유지될 가능성이 높았다.
- 일부 subVertical rationale만 달랐고, scoring truth 자체는 job-aware가 아니었다.

## 새 축 정의

- 내부 정의: `Axis4 = Stakeholder Interaction Fit`
- 사용자 노출명: `이해관계자 소통 적합성`

이 축은 아래만 본다.

- 목표 직무에서 중요한 상대와의 접점이 있었는지
- 그 접점이 직접 소통/조율/설명 수준이었는지
- 상호작용이 반복적이고 실질적이었는지
- 해당 상대가 targetJobId 기준으로 얼마나 중요한지

이 축은 아래를 직접 판단하지 않는다.

- 직무 전문성 자체
- 산업 이해 자체
- 성과 크기 자체
- 경험 깊이 자체

## 설계 원칙

- taxonomy와 job relevance를 분리한다.
- stakeholder canonical key는 SSOT registry에서만 정의한다.
- targetJobId별 중요도는 별도 relevance registry에서만 정의한다.
- normalize는 axis4 evidence를 공통 shape로 만든다.
- scorer는 evidence 기반으로 계산하고, relevance는 약한 가중 보정으로만 붙인다.
- self-report는 보조 신호로만 사용하고 ceiling breaker로 사용하지 않는다.
- axis1/2/3/5 scoring은 건드리지 않는다.

## 신규 taxonomy

`src/data/transitionLite/newgradStakeholderTaxonomyRegistry.js`

canonical key:

- `customer_user`
- `candidate_applicant`
- `learner_participant`
- `public_citizen`
- `internal_team`
- `cross_function_partner`
- `manager_reviewer`
- `external_partner_vendor`
- `field_practitioner_operator`
- `executive_decision_maker`
- `community_audience`
- `mixed_stakeholders`
- `unknown_other`

이 registry는 alias normalize와 display label만 담당한다. 직무 relevance는 여기서 정의하지 않는다.

## 신규 relevance layer

`src/data/transitionLite/newgradAxis4JobStakeholderRelevanceRegistry.js`

이 registry는 targetJobId별로 아래를 제공한다.

- `primary`
- `secondary`
- `tertiary`
- `rationale`

이번 라운드 최소 커버리지는 아래 actual job id 기준으로 넣었다.

- `JOB_BUSINESS_SERVICE_PLANNING`
- `JOB_MARKETING_CONTENT_MARKETING`
- `JOB_MARKETING_PERFORMANCE_MARKETING`
- `JOB_MARKETING_BRAND_MARKETING`
- `JOB_SALES_B2B_SALES`
- `JOB_HR_ORGANIZATION_RECRUITING`
- `JOB_PROCUREMENT_SCM_PURCHASING`
- `JOB_PROCUREMENT_SCM_SCM`
- `JOB_PROCUREMENT_SCM_LOGISTICS`
- `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS`
- `JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING`
- `JOB_BUSINESS_OPERATIONS_MANAGEMENT`
- `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS`
- `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
- `JOB_DESIGN_UX_DESIGN`
- `JOB_ENGINEERING_DEVELOPMENT_RESEARCH_AND_DEVELOPMENT`
- `JOB_EDUCATION_COUNSELING_COACHING_LEARNING_DESIGN`
- `JOB_PUBLIC_ADMINISTRATION_SUPPORT_PUBLIC_PROGRAM_OPERATIONS`

registry에 없는 job id는 default relevance를 사용한다.

## Normalize Contract

`src/lib/transitionLite/normalizeNewgradExperienceInput.js`

append-only로 `axis4InteractionEvidenceList`를 추가했다.

각 evidence item shape:

```js
{
  sourceType: "project" | "internship" | "contract" | "partTime" | "extracurricular",
  stakeholderKeys: ["customer_user", "cross_function_partner"],
  interactionIntensity: "support" | "adjacent" | "direct" | "owner",
  interactionCount: 1,
  rawStakeholderLabel: "...",
  confidence: "high" | "medium" | "low",
}
```

normalize는 명시 입력을 우선 사용하고, 불명확하면 `unknown_other`로 보수 처리한다.

`src/lib/transitionLite/normalizeNewgradSelfReportTraits.js`에는 아래를 추가했다.

- `axis4SelfReportSupportScore`
- `axis4SelfReportSignalKeys`

self-report는 axis4 보조 신호지만 직접 evidence가 약할 때 high를 밀어 올리지는 못한다.

## Scoring Contract

`src/lib/analysis/buildNewgradAxisPack.js`

새 axis4 scorer는 아래 단계를 따른다.

1. `axis4InteractionEvidenceList` 기반 evidence 수집
2. evidence volume / diversity / directness / source reliability / repeated interaction 기반 base 계산
3. `getAxis4StakeholderRelevanceByJobId(targetJobId)` 기반 relevance adjustment 계산
4. self-report support를 약하게 더함
5. guard 적용 후 5점 band로 변환

산출 payload에는 아래 diagnostics를 append-only로 넣었다.

- `jobRelevantStakeholdersHit`
- `missingImportantStakeholders`
- `interactionEvidenceSummary`
- `interactionIntensitySummary`
- `axis4RelevanceMeta`
- `selfReportSupportLevel`

## Guard Rules

아래 guard를 추가했다.

- self-report-only ceiling
- internal-team-only ceiling
- no-primary-hit guard
- vague mixed-only ceiling
- no direct/owner and no primary-hit guard

핵심은 evidence가 약한데 소통 성향 문구만으로 high가 나오는 것을 막는 것이다.

## Explanation Contract

`src/data/transitionLite/axisExplanationRegistry.js`

축4 설명은 이제 아래를 읽는다.

- `targetJobId`
- `targetJobLabel`
- `jobRelevantStakeholdersHit`
- `missingImportantStakeholders`
- `interactionEvidenceSummary`
- `interactionIntensitySummary`
- `axis4RelevanceMeta`
- `selfReportSupportLevel`

같은 score라도 targetJobId와 hit/miss stakeholder가 다르면 summary, positives, gaps, reasons가 달라질 수 있게 바꿨다.

## UI 반영

`src/components/report/TransitionLiteResult.jsx`

- 축4 사용자 노출명을 `이해관계자 소통 적합성`으로 교체했다.
- 기존 consumer 구조는 유지했다.
- producer가 준 summary/positives/gaps를 그대로 소비하는 쪽으로 두었다.

## Compatibility Notes

- `src/data/transitionLite/newgradStakeholderRegistry.js`는 삭제하지 않았다.
- 기존 consumer가 깨지지 않도록 compatibility bridge로 유지했다.
- old axis key `customerType`는 내부 consumer key로 그대로 남아 있다.
- 기존 sidecar rationale 파일은 대공사하지 않고, 새 semantics와 충돌하는 customer 편향 문구만 최소 조정했다.

## Normalize Bottleneck Update

이번 라운드는 scoring 변경이 아니라 normalize bottleneck 해소에 집중했다.

- `buildNewgradAxisPack.js` scoring 로직은 수정하지 않았다.
- `newgradAxis4JobStakeholderRelevanceRegistry.js`도 수정하지 않았다.
- `axisExplanationRegistry.js`도 수정하지 않았다.

보강한 층은 아래다.

- `normalizeNewgradExperienceInput.js`
- `NewgradTransitionLiteInput.jsx`
- `newgradStakeholderTaxonomyRegistry.js`
- `newgradStakeholderRegistry.js`
- `newgradAxis4InteractionEvidenceUtils.js`

### project heuristic 추가

기존에는 project axis4 evidence가 거의 항상 `unknown_other`로 떨어졌다.

이번 라운드에서는 project에서 아래 제한적 heuristic을 추가했다.

- 협업/개발/디자인/기획/운영/데이터/마케팅/영업/PM/PO/coordination 문맥은 `cross_function_partner`
- 발표/보고/검토/리뷰/피드백/멘토/교수/심사 문맥은 `manager_reviewer`
- 사용자/고객/인터뷰/테스트/VOC/설문 문맥은 `customer_user`
- 교육/수강생/참여자/워크숍/세미나 문맥은 `learner_participant`
- 행사/커뮤니티/오디언스 문맥은 `community_audience`
- 공공/시민/주민/민원/행정/지자체 문맥은 `public_citizen`
- 지원자/후보자/채용/면접 문맥은 `candidate_applicant`

동시에 interactionIntensity도 아래처럼 보강했다.

- 발표/설명/인터뷰/조율/협의/응대/리뷰 반영: `direct`
- 총괄/주도/책임/운영/관리: `owner`
- 협업/공유/전달: `adjacent`
- 참여/보조/지원: `support`

### current UI option minimal expansion

실무 경험 stakeholder 선택 옵션에 아래를 추가했다.

- `지원자 / 후보자`
- `학습자 / 참여자`
- `시민 / 공공 이용자`
- `타직무 협업 상대`
- `리더 / 검토자`

또한 project에도 작은 `주요 상대` 선택을 추가해, heuristic만으로 포착되지 않는 key를 직접 입력할 수 있게 했다.

### 새로 end-to-end 생성 가능해진 stakeholder

기존 UI path에서는 사실상 만들기 어려웠던 아래 key가 이번 라운드 이후 생성 가능해졌다.

- `candidate_applicant`
- `learner_participant`
- `public_citizen`
- `cross_function_partner`
- `manager_reviewer`

### 이번 라운드의 실제 효과

- scorer는 그대로 두고도 UI-compatible path에서 `candidate_applicant`, `learner_participant`, `public_citizen`, `cross_function_partner`, `manager_reviewer` evidence가 생성됐다.
- representative sample 기준 `unknown_other` 비율은 눈에 띄게 줄었다.
- 다만 `mid 60 쏠림`이 완전히 풀린 것은 아니며, normalize 개선만으로는 일부 직무에서 밴드 상승이 제한적이었다.

## QA Coverage

상세 케이스는 `docs/transitionLite/newgrad-axis4-qa-cases.md`에 정리했다.

핵심 검증은 아래다.

- same input + different `targetJobId`에서 axis4 결과가 달라지는지
- customer-facing evidence가 백엔드/R&D에서 과대평가되지 않는지
- cross-functional evidence가 서비스기획/운영기획/데이터/백엔드에서 상대적으로 살아나는지
- HR/교육/공공 맥락 stakeholder가 relevance layer에서 분리되는지
- self-report-only high가 막히는지

## 이번 라운드에서 안 건드린 것

- axis1/2/3/5 scoring semantics
- input UI 대공사
- job ontology 구조 자체
- PDF consumer 별도 재설계

## 변경 로그

files updated:

- `src/data/transitionLite/newgradStakeholderTaxonomyRegistry.js`
- `src/data/transitionLite/newgradAxis4JobStakeholderRelevanceRegistry.js`
- `src/data/transitionLite/newgradAxis4InteractionEvidenceUtils.js`
- `src/data/transitionLite/newgradStakeholderRegistry.js`
- `src/lib/transitionLite/normalizeNewgradExperienceInput.js`
- `src/lib/transitionLite/normalizeNewgradSelfReportTraits.js`
- `src/lib/analysis/buildNewgradAxisPack.js`
- `src/data/transitionLite/axisExplanationRegistry.js`
- `src/data/transitionLite/axisJobRationaleMap.js`
- `src/data/transitionLite/detailedReadRationaleMap.js`
- `src/components/report/TransitionLiteResult.jsx`

compatibility notes:

- axis4 producer meaning changed, consumer contract shape is append-only로 유지했다.
- `customerType` axis key는 유지했고, 사용자 노출명만 `이해관계자 소통 적합성`으로 전환했다.
