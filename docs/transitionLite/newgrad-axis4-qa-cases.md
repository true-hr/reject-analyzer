# Newgrad Axis4 QA Cases

## 목적

신입 축4가 `고객 커뮤니케이션 적합성`이 아니라 `targetJobId-aware 이해관계자 소통 적합성`으로 작동하는지 검증한다.

## Gold Cases

### 1. 동일 입력 / targetJobId만 변경

- 입력 개요: 고객/사용자 stakeholder가 있는 인턴 1건 + 수업 팀프로젝트 1건 + 소통 관련 workStyle/strength 약간
- targetJobId:
  - `JOB_BUSINESS_SERVICE_PLANNING`
  - `JOB_PROCUREMENT_SCM_PURCHASING`
  - `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
  - `JOB_HR_ORGANIZATION_RECRUITING`
- 기대 방향:
  - 서비스기획은 customer/user hit가 일부 relevance로 읽혀 중간 이상 가능
  - 구매는 vendor/cross-function 부재 때문에 보수적으로 읽힘
  - 백엔드는 cross-function/manager 부재 때문에 customer evidence 과대평가 금지
  - HR은 candidate/internal 조율 evidence가 없으면 낮게 읽힘
- 왜 필요한지: same input에서 targetJobId-aware 결과 분기가 실제로 있는지 확인하는 기준 케이스

### 2. customer-facing 경험

- 입력 개요: 고객 응대 중심 아르바이트/인턴, customer_user direct evidence 반복
- targetJobId:
  - `JOB_SALES_B2B_SALES`
  - `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS`
  - `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
  - `JOB_ENGINEERING_DEVELOPMENT_RESEARCH_AND_DEVELOPMENT`
- 기대 방향:
  - 영업/CS는 상대적으로 강하게 읽힘
  - 백엔드/R&D는 customer evidence만으로 high 직행 금지
- 왜 필요한지: customer-facing bias가 일부 직무에만 제한적으로 살아 있는지 확인

### 3. cross-functional internal 경험

- 입력 개요: 개발/디자인/운영과 협업한 프로젝트, 요구 정리와 조율 직접 수행
- targetJobId:
  - `JOB_BUSINESS_SERVICE_PLANNING`
  - `JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING`
  - `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS`
  - `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
  - `JOB_SALES_B2B_SALES`
- 기대 방향:
  - 서비스기획/운영기획/데이터/백엔드는 상승
  - 영업은 상대적으로 덜 핵심
- 왜 필요한지: internal/cross-functional stakeholder relevance가 직무마다 달라지는지 확인

### 4. candidate-facing 경험

- 입력 개요: 대외활동 또는 교내 프로그램에서 지원자 안내, 인터뷰 조율, 참여자 커뮤니케이션 경험
- targetJobId:
  - `JOB_HR_ORGANIZATION_RECRUITING`
  - `JOB_MARKETING_CONTENT_MARKETING`
  - `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
- 기대 방향:
  - HR/채용에서 강하게 읽힘
  - 일반 마케팅/개발에서는 제한적 relevance
- 왜 필요한지: candidate stakeholder가 customer와 분리되어 반영되는지 확인

### 5. vendor-facing 경험

- 입력 개요: 협력사 일정 조율, 외주 커뮤니케이션, 납품/운영 파트너 조율
- targetJobId:
  - `JOB_PROCUREMENT_SCM_PURCHASING`
  - `JOB_PROCUREMENT_SCM_SCM`
  - `JOB_PROCUREMENT_SCM_LOGISTICS`
  - `JOB_BUSINESS_SERVICE_PLANNING`
- 기대 방향:
  - 구매/SCM/물류에서 강하게 읽힘
  - 서비스기획에서는 보조적
- 왜 필요한지: vendor relevance layer가 실제로 존재하는지 확인

### 6. learner/public-facing 경험

- 입력 개요: 교육 프로그램 운영, 참여자 안내, 공공 행사 운영, 민원성 응대
- targetJobId:
  - `JOB_EDUCATION_COUNSELING_COACHING_LEARNING_DESIGN`
  - `JOB_PUBLIC_ADMINISTRATION_SUPPORT_PUBLIC_PROGRAM_OPERATIONS`
  - `JOB_SALES_B2B_SALES`
- 기대 방향:
  - 교육/공공에서는 강하게 읽힘
  - 일반 B2B 영업에서는 제한적으로 읽힘
- 왜 필요한지: learner/public stakeholder가 customer taxonomy에 흡수되지 않는지 확인

### 7. self-report strong / evidence weak

- 입력 개요: workStyle와 strengths에는 소통 신호가 많지만 경험 evidence는 거의 없음
- targetJobId: 아무 직무나 가능
- 기대 방향:
  - high 금지
  - explanation은 self-report가 참고 신호라는 점을 명시
- 왜 필요한지: self-report-only ceiling 검증

### 8. internal-team-only

- 입력 개요: 내부 팀원과만 일한 경험만 있고 cross-function/external evidence 없음
- targetJobId:
  - `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
  - `JOB_BUSINESS_SERVICE_PLANNING`
  - `JOB_SALES_B2B_SALES`
- 기대 방향:
  - high ceiling 방지
  - 특히 영업에서 과대평가 금지
- 왜 필요한지: internal-team-only ceiling 검증

### 9. mixed-stakeholders vague

- 입력 개요: stakeholder가 항상 mixed만 찍혀 있고 directness/role 설명이 불명확함
- targetJobId: 아무 직무나 가능
- 기대 방향:
  - vague mixed evidence만으로 high 금지
- 왜 필요한지: 혼합 입력 과대해석 방지

### 10. UX/서비스기획

- 입력 개요: 사용자 인터뷰/피드백 수집 + 개발/디자인 협업 프로젝트
- targetJobId:
  - `JOB_DESIGN_UX_DESIGN`
  - `JOB_BUSINESS_SERVICE_PLANNING`
  - `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`
- 기대 방향:
  - UX/서비스기획은 상대적으로 상승
  - 백엔드는 user evidence보다 cross-function/manager hit가 더 중요하게 읽힘
- 왜 필요한지: 사용자 접점과 cross-function 조합이 특정 직무에서만 강하게 작동하는지 검증

## Manual Evaluation Snippet

아래처럼 same input에서 `targetJobId`만 바꿔 axis4 결과를 비교한다.

```js
import { buildNewgradAxisPack } from "../../src/lib/analysis/buildNewgradAxisPack.js";

const baseInput = {
  major: "경영학",
  targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
  targetJobLabel: "서비스기획",
  internships: [
    {
      title: "현장실습",
      stakeholderType: "고객 / 사용자",
      description: "고객 문의 응대와 요구사항 정리를 보조했습니다.",
      durationMonths: 2,
    },
  ],
  projects: [
    {
      name: "수업 팀프로젝트",
      description: "개발/디자인과 협업해 기능 기획안을 정리했습니다.",
    },
  ],
  strengths: ["커뮤니케이션"],
  workStyleNotes: "협업이 많은 환경에서 일하는 편입니다.",
};

for (const jobId of [
  "JOB_BUSINESS_SERVICE_PLANNING",
  "JOB_PROCUREMENT_SCM_PURCHASING",
  "JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT",
  "JOB_HR_ORGANIZATION_RECRUITING",
]) {
  const pack = buildNewgradAxisPack({ ...baseInput, targetJobId: jobId });
  console.log(jobId, pack.axes.customerType.score, pack.axes.customerType.band, pack.axes.customerType.explanation?.summary);
}
```

## 이번 라운드 실제 확인 결과

위와 유사한 same input 비교에서 아래가 확인됐다.

- `JOB_BUSINESS_SERVICE_PLANNING`: `score 60`, `band mid`
- `JOB_PROCUREMENT_SCM_PURCHASING`: `score 40`, `band low`
- `JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT`: `score 40`, `band low`
- `JOB_HR_ORGANIZATION_RECRUITING`: `score 40`, `band low`

즉 same input + different `targetJobId`에서 axis4 결과가 의미 있게 달라졌다.

## Normalize Follow-up

이번 follow-up은 scoring을 바꾸지 않고 normalize bottleneck만 완화했을 때 end-to-end 결과가 얼마나 개선되는지 확인하는 목적이었다.

### before / after 포인트

- before:
  - project가 거의 항상 `unknown_other`
  - UI stakeholder option이 5개뿐이라 `candidate_applicant`, `learner_participant`, `public_citizen`, `cross_function_partner`, `manager_reviewer`를 직접 만들기 어려움
  - candidate / learner / public sample은 direct injection으로만 검증 가능
- after:
  - project heuristic으로 `cross_function_partner`, `manager_reviewer` 등 제한적 추론 가능
  - internship / contract / project 선택 UI에서 richer stakeholder를 직접 선택 가능
  - candidate / learner / public sample을 UI-compatible path로 재현 가능

### UI-compatible path 재현 결과

- `B_cross_function_heavy_ui_after`
  - `cross_function_partner`, `manager_reviewer` evidence가 실제 생성됨
  - 서비스기획 / 구매 / 백엔드 / CS에서 primary hit가 생김
  - 다만 score band는 여전히 `mid`에 머무름
- `C_candidate_facing_ui_after`
  - `candidate_applicant`, `manager_reviewer` evidence가 실제 생성됨
  - HR/채용에서 `mid_high 80` 재현 성공
- `E_learner_public_ui_after`
  - `learner_participant`, `public_citizen` evidence가 실제 생성됨
  - 교육기획에서 `mid_high 80` 재현 성공

### unknown_other 변화

representative UI-compatible sample 기준:

- before:
  - `A_customer_heavy_ui`, `B_cross_function_heavy_ui_limited`, `F_internal_only_ui` evidence 합산에서 `unknown_other` 비율이 대략 `25%`
- after:
  - 같은 representative 흐름에서 `unknown_other` 비율 `0%`

### 남은 한계

- normalize를 보강해도 `mid 60 쏠림`이 완전히 풀리지는 않았다.
- `cross_function_partner` evidence가 생겨도 일부 직무는 여전히 `mid`에 머문다.
- current UI path에는 아직 free-text summary가 없어 heuristic가 읽을 수 있는 문맥 폭이 좁다.
- `community_audience`, `executive_decision_maker`는 여전히 직접적 재현성이 낮다.
