# Newgrad Axis 2 Test Cases

## 목적
- Newgrad Axis 2 `산업 분야 이해도` 검증 케이스를 case-id 기준으로 운영한다.
- 중복 케이스 생성을 막고, rerun / expected / actual / mismatch를 한 문서에서 이어서 본다.
- generic 5-axis gold set과 분리해서 Axis 2 점수 behavior만 따로 추적한다.

## 사용 규칙
- 새 테스트는 항상 문서 하단에 append한다.
- 새 테스트는 `case_id` 없이 만들지 않는다.
- 기존 case의 의미를 조용히 바꾸지 않는다.
- rerun은 새 case를 만들지 않고 기존 case의 `run_history`에 누적한다.
- mismatch가 나면 case 본문 수정 전에 `05_Execution/Scoring_Calibration_Log.md`에 linked case 기준으로 남긴다.
- 반복 패턴이 보일 때만 contract issue / implementation issue 논의를 연다.

## Case ID 규칙
- 형식: `NGA2-CASE-YYYYMMDD-###`
- `NGA2`는 Newgrad Axis 2 전용 테스트를 뜻한다.
- 숫자는 append-only로 증가시키고 재사용하지 않는다.

## 중복 방지 규칙
- 같은 `purpose`, 같은 `bucket`, 같은 핵심 입력 신호 조합이면 새 case를 만들지 않는다.
- input summary만 문장형으로 조금 다른 정도면 기존 case rerun으로 본다.
- expected score를 다시 검토해야 할 때는 새 case가 아니라 `case_revision_note` + calibration log로 처리한다.
- one-case-one-purpose:
  - 한 case에는 하나의 핵심 판정 질문만 둔다.
  - 전공/자격/프로젝트/인턴의 복합 검증이면 그 자체를 purpose로 명시한다.
  - role similarity guardrail과 duration/outcome guardrail은 별도 case로 분리한다.

## 버킷 운영 규칙
- bucket은 section 분기보다 고정 label로 관리한다.
- 허용 bucket:
  - `관련 신호 거의 없음`
  - `전공만 관련`
  - `자격만 관련`
  - `프로젝트만 관련`
  - `인턴만 관련`
  - `전공 + 프로젝트`
  - `전공 + 인턴`
  - `자격 + 프로젝트 + 인턴`
  - `role similarity 높지만 산업 이해 낮음`
  - `duration/outcome 강하지만 산업 이해 약함`

## 케이스 템플릿
```md
### NGA2-CASE-20260405-001
- date:
- pattern_target:
- bucket:
- variant_label:
- purpose:
- input_summary:
- targetIndustryId:
- expected_axis2_score:
- expected_score_band:
- expected_reasoning:
- actual_axis2_score:
- actual_score_band:
- actual_reasoning_summary:
- result:
- reinforces_prior_pattern:
- suspected_cause_classification:
- follow_up_needed:
- status:
- case_revision_note:
- run_history:
  - run_date:
  - expected:
  - actual:
  - result:
  - note:
```

## 필드 메모
- `purpose`: 왜 이 case가 필요한지 한 줄로 쓴다.
- `input_summary`: full payload 복사가 아니라 Axis 2 판정에 필요한 핵심만 요약한다.
- `targetIndustryId`: 실행에 사용한 실제 target industry id를 적는다.
- `expected_axis2_score`: 현재 scoring contract 기준 기대 1~5 점수다.
- `expected_score_band`: `very_low`, `low`, `mid`, `mid_high`, `high`
- `actual_axis2_score`: actual execution의 axis 2 display score다.
- `actual_score_band`: actual execution의 axis 2 band다.
- `result`: `match`, `soft mismatch`, `hard mismatch`
- `suspected_cause_classification`: `expected behavior`, `thin-evidence bias`, `cap working as intended`, `contract ambiguity`, `implementation drift`, `unable to judge`
- `follow_up_needed`: 후속 필요 여부를 짧게 적는다.
- `status`: `candidate`, `ready`, `validated`, `deprecated`

## Starter Case Queue

### NGA2-CASE-20260405-001
- date: 2026-04-05
- bucket: 관련 신호 거의 없음
- purpose: 관련 신호가 사실상 없을 때 Axis 2가 낮게 유지되는지 확인
- input_summary: target industry와 직접 맞닿는 전공, 자격, 프로젝트, 인턴 신호가 거의 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 1
- expected_score_band: very_low
- expected_reasoning: 무관 major만 존재하고 관련 전공, 자격, 프로젝트, 인턴, 계약 실무가 없어야 한다.
- actual_axis2_score: 40
- actual_score_band: low
- actual_reasoning_summary: 관련 신호가 거의 없는데도 non-empty major 존재만으로 very_low 아래로 내려가지 않고 low floor가 형성됐다.
- result: soft mismatch
- suspected_cause_classification: implementation drift
- follow_up_needed: 무관 major가 기본 low floor를 만드는지 후속 케이스로 재확인
- status: validated
- case_revision_note: 2026-04-05 first execution result appended
- run_history:
  - run_date: 2026-04-05
  - expected: very_low / 1
  - actual: low / 40
  - result: soft mismatch
  - note: 무관 major only 상태인데 low floor 유지

### NGA2-CASE-20260405-002
- date: 2026-04-05
- bucket: 전공만 관련
- purpose: 관련 전공만 있고 applied-context가 없을 때 upper cap이 지켜지는지 확인
- input_summary: 전공은 target industry와 맞지만 프로젝트, 인턴, 자격 보강은 없음
- targetIndustryId: `IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD`
- expected_axis2_score: 3
- expected_score_band: mid
- expected_reasoning: 관련 major는 primary usable signal이므로 weak generic 수준보다 한 단계는 올라가야 한다.
- actual_axis2_score: 40
- actual_score_band: low
- actual_reasoning_summary: 관련 major 단일 신호가 무관 major case와 동일한 low로 읽혀 major relevance lift가 관찰되지 않았다.
- result: soft mismatch
- suspected_cause_classification: implementation drift
- follow_up_needed: major relevance 반영 여부를 좁게 점검
- status: validated
- case_revision_note: 2026-04-05 first execution result appended
- run_history:
  - run_date: 2026-04-05
  - expected: mid / 3
  - actual: low / 40
  - result: soft mismatch
  - note: 관련 major 단독 lift 미관측

### NGA2-CASE-20260405-003
- date: 2026-04-05
- bucket: 자격만 관련
- purpose: 자격 단독 신호가 과대평가되지 않는지 확인
- input_summary: 자격은 관련 있지만 전공, 프로젝트, 인턴 applied-context는 약함
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 2
- expected_score_band: low
- expected_reasoning: 관련 자격 단독은 상한이 낮아야 하고 applied-context 없이 과대평가되면 안 된다.
- actual_axis2_score: 40
- actual_score_band: low
- actual_reasoning_summary: 관련 data certification 1건이 low에 머물렀고 higher band로 과대상승하지 않았다.
- result: match
- suspected_cause_classification: cap working as intended
- follow_up_needed: 없음
- status: validated
- case_revision_note: 2026-04-05 first execution result appended
- run_history:
  - run_date: 2026-04-05
  - expected: low / 2
  - actual: low / 40
  - result: match
  - note: certification-only cap 정상 동작

### NGA2-CASE-20260405-004
- date: 2026-04-05
- bucket: 프로젝트만 관련
- purpose: 프로젝트 문맥만 있을 때 weak support가 어디까지 허용되는지 확인
- input_summary: 프로젝트 주제는 target industry와 맞지만 전공, 자격, 인턴은 약함
- targetIndustryId: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE`
- expected_axis2_score: 2
- expected_score_band: low
- expected_reasoning: weak project support만으로는 low를 넘기면 안 된다.
- actual_axis2_score: 40
- actual_score_band: low
- actual_reasoning_summary: weak project.type 1건이 low에 머물렀고 단독 weak signal cap이 유지됐다.
- result: match
- suspected_cause_classification: cap working as intended
- follow_up_needed: 없음
- status: validated
- case_revision_note: 2026-04-05 first execution result appended
- run_history:
  - run_date: 2026-04-05
  - expected: low / 2
  - actual: low / 40
  - result: match
  - note: weak project support cap 정상 동작

### NGA2-CASE-20260405-005
- date: 2026-04-05
- bucket: 인턴만 관련
- purpose: applied-context 인턴 단일 신호가 3 이상으로 읽히는지 확인
- input_summary: target industry에 맞는 인턴 context는 있으나 전공, 자격, 프로젝트 보강은 제한적
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 3
- expected_score_band: mid
- expected_reasoning: applied-context 인턴 단일 신호는 low를 넘겨 최소 mid까지는 읽혀야 한다.
- actual_axis2_score: 60
- actual_score_band: mid
- actual_reasoning_summary: direct stakeholder가 있는 typed internship 1건이 mid까지 올랐고 applied-context signal이 실제로 반영됐다.
- result: match
- suspected_cause_classification: expected behavior
- follow_up_needed: 없음
- status: validated
- case_revision_note: 2026-04-05 first execution result appended
- run_history:
  - run_date: 2026-04-05
  - expected: mid / 3
  - actual: mid / 60
  - result: match
  - note: applied-context internship 단일 신호 반영 확인

### NGA2-CASE-20260405-006
- date: 2026-04-05
- bucket: 전공 + 프로젝트
- purpose: major와 project가 같은 방향으로 수렴할 때 mid score가 안정적으로 나오는지 확인
- input_summary: 관련 전공과 관련 프로젝트는 있으나 applied-context 인턴은 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 3
- expected_score_band: mid
- expected_reasoning: 관련 major와 weak project support가 같은 방향으로 수렴하면 low보다 한 단계 위여야 한다.
- actual_axis2_score: 40
- actual_score_band: low
- actual_reasoning_summary: 관련 major + weak project 조합인데도 project-only 수준 low에 머물러 major support가 추가 가산되지 않았다.
- result: soft mismatch
- suspected_cause_classification: implementation drift
- follow_up_needed: major signal이 실제로 반영되는지 확인 필요
- status: validated
- case_revision_note: 2026-04-05 first execution result appended
- run_history:
  - run_date: 2026-04-05
  - expected: mid / 3
  - actual: low / 40
  - result: soft mismatch
  - note: related major + weak project에서도 low 유지

### NGA2-CASE-20260405-007
- date: 2026-04-05
- bucket: 전공 + 인턴
- purpose: major와 applied-context 인턴이 함께 있을 때 4 후보가 되는지 확인
- input_summary: 관련 전공과 관련 인턴 context가 같은 방향으로 수렴하고 보강 신호가 일부 존재
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 4
- expected_score_band: mid_high
- expected_reasoning: applied-context 인턴 1건과 관련 major 1건이 같은 방향으로 정렬되면 4 후보로 봐야 한다.
- actual_axis2_score: 60
- actual_score_band: mid
- actual_reasoning_summary: direct internship는 반영됐지만 관련 major가 추가 lift를 만들지 못해 internship-only case와 동일한 mid에 머물렀다.
- result: soft mismatch
- suspected_cause_classification: implementation drift
- follow_up_needed: major + context 결합 시 4 조건이 지나치게 좁은지 점검
- status: validated
- case_revision_note: 2026-04-05 first execution result appended
- run_history:
  - run_date: 2026-04-05
  - expected: mid_high / 4
  - actual: mid / 60
  - result: soft mismatch
  - note: major support가 internship-only 대비 추가 lift를 만들지 못함

### NGA2-CASE-20260405-008
- date: 2026-04-05
- bucket: 자격 + 프로젝트 + 인턴
- purpose: 복수 독립 신호가 수렴할 때 high score가 허용되는지 확인
- input_summary: 관련 자격, 관련 프로젝트, applied-context 인턴이 같은 target industry로 수렴
- targetIndustryId: pending
- expected_axis2_score: 4
- expected_score_band: mid_high
- expected_reasoning: 복수 독립 신호 수렴 시 4 이상 후보로 본다.
- actual_axis2_score: pending
- actual_score_band: pending
- actual_reasoning_summary: pending
- result: pending
- suspected_cause_classification: pending
- follow_up_needed: first batch 실행 후 actual 기록
- status: ready
- case_revision_note: -
- run_history:
  - run_date: pending
  - expected: mid_high / 4
  - actual: pending
  - result: pending
  - note: starter slot

### NGA2-CASE-20260405-009
- date: 2026-04-05
- bucket: role similarity 높지만 산업 이해 낮음
- purpose: role similarity만 높을 때 Axis 2가 같이 올라가지 않는지 확인
- input_summary: target job role은 비슷하지만 target industry 관련 major, cert, applied-context는 약함
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 1
- expected_score_band: very_low
- expected_reasoning: role similarity는 Axis 2 direct raise 근거가 아니므로 산업 이해 신호가 없으면 very_low에 머물러야 한다.
- actual_axis2_score: 40
- actual_score_band: low
- actual_reasoning_summary: role similarity 자체는 high로 튀지 않았지만 unrelated major 존재만으로 low floor가 남아 very_low로 내려가지 않았다.
- result: soft mismatch
- suspected_cause_classification: implementation drift
- follow_up_needed: low-signal guardrail 재검증 필요
- status: validated
- case_revision_note: 2026-04-05 first execution result appended
- run_history:
  - run_date: 2026-04-05
  - expected: very_low / 1
  - actual: low / 40
  - result: soft mismatch
  - note: role guardrail 자체는 보이지만 unrelated major floor 잔존

### NGA2-CASE-20260405-010
- date: 2026-04-05
- pattern_target: A
- bucket: duration/outcome 강하지만 산업 이해 약함
- variant_label: first batch baseline
- purpose: duration과 outcome 강도가 Axis 2를 잘못 끌어올리지 않는지 확인
- input_summary: 프로젝트 duration과 outcome은 강하지만 target industry 관련 전공, 자격, 인턴 문맥은 약함
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 1
- expected_score_band: very_low
- expected_reasoning: duration과 outcome 강도는 Axis 2 direct raise 근거가 아니므로 산업 이해가 약하면 very_low에 머물러야 한다.
- actual_axis2_score: 60
- actual_score_band: mid
- actual_reasoning_summary: long duration과 typed contract/part-time context가 industry relevance와 무관한데도 mid까지 올라가 duration/outcome guardrail이 충분히 눌리지 않았다.
- result: hard mismatch
- reinforces_prior_pattern: yes
- suspected_cause_classification: implementation drift
- follow_up_needed: typed contract/support signal이 Axis 2에서 과대작동하는지 좁게 조사
- status: validated
- case_revision_note: 2026-04-05 first execution result appended
- run_history:
  - run_date: 2026-04-05
  - expected: very_low / 1
  - actual: mid / 60
  - result: hard mismatch
  - note: duration/outcome 약한 bucket이 mid까지 상승

### NGA2-CASE-20260405-011
- date: 2026-04-05
- pattern_target: A
- bucket: 관련 신호 거의 없음
- variant_label: 무관 전공 + weak project support
- purpose: unrelated major와 weak project support만 있을 때 very_low floor가 유지되는지 재확인
- input_summary: 심리 계열 전공, 캡스톤 프로젝트 1건, applied-context 인턴/자격 없음
- targetIndustryId: `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE`
- expected_axis2_score: 1
- expected_score_band: very_low
- expected_reasoning: 무관 전공과 weak project support 조합은 industry understanding direct raise 근거가 아니므로 very_low에 머물러야 한다.
- actual_axis2_score: 40
- actual_score_band: low
- actual_reasoning_summary: unrelated major와 weak project.type만 있는데도 low floor가 유지됐다.
- result: soft mismatch
- reinforces_prior_pattern: yes
- suspected_cause_classification: implementation drift
- follow_up_needed: weak project + non-empty major floor 반복 확인 완료
- status: validated
- case_revision_note: 2026-04-05 second calibration batch appended
- run_history:
  - run_date: 2026-04-05
  - expected: very_low / 1
  - actual: low / 40
  - result: soft mismatch
  - note: pattern A repeat check - weak project variant

### NGA2-CASE-20260405-012
- date: 2026-04-05
- pattern_target: A
- bucket: 관련 신호 거의 없음
- variant_label: 무관 전공 + 비연결 자격
- purpose: non-industry-linked certification이 very_low bucket을 올리는지 재확인
- input_summary: 심리 계열 전공, 어학 자격 1건, applied-context 인턴/프로젝트 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 1
- expected_score_band: very_low
- expected_reasoning: 어학 자격은 target industry linked certification이 아니므로 산업 이해 점수 direct raise 근거가 되면 안 된다.
- actual_axis2_score: 60
- actual_score_band: mid
- actual_reasoning_summary: unrelated major + language certification 조합이 very_low가 아니라 mid까지 상승했다.
- result: hard mismatch
- reinforces_prior_pattern: yes
- suspected_cause_classification: implementation drift
- follow_up_needed: non-linked certification이 weakSignalCount를 통해 과대작동하는지 조사 필요
- status: validated
- case_revision_note: 2026-04-05 second calibration batch appended
- run_history:
  - run_date: 2026-04-05
  - expected: very_low / 1
  - actual: mid / 60
  - result: hard mismatch
  - note: pattern A repeat check - non-linked certification variant

### NGA2-CASE-20260405-013
- date: 2026-04-05
- pattern_target: A
- bucket: role similarity 높지만 산업 이해 낮음
- variant_label: role similarity + 비연결 자격
- purpose: role similarity impression과 non-linked certification이 함께 있어도 very_low guardrail이 유지되는지 확인
- input_summary: 심리 계열 전공, 백엔드 역할 프로젝트 1건, 어학 자격 1건, target industry direct context 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 1
- expected_score_band: very_low
- expected_reasoning: role similarity와 non-linked certification은 Axis 2 direct raise 근거가 아니므로 industry understanding 약한 상태를 벗어나면 안 된다.
- actual_axis2_score: 60
- actual_score_band: mid
- actual_reasoning_summary: role similarity 인상과 비연결 자격 조합이 industry understanding 약한 상태인데도 mid까지 올라갔다.
- result: hard mismatch
- reinforces_prior_pattern: yes
- suspected_cause_classification: implementation drift
- follow_up_needed: role guardrail보다 weak/generic signal 결합 가산이 더 크게 작동하는지 점검 필요
- status: validated
- case_revision_note: 2026-04-05 second calibration batch appended
- run_history:
  - run_date: 2026-04-05
  - expected: very_low / 1
  - actual: mid / 60
  - result: hard mismatch
  - note: pattern A repeat check - role impression variant

### NGA2-CASE-20260405-014
- date: 2026-04-05
- pattern_target: A
- bucket: duration/outcome 강하지만 산업 이해 약함
- variant_label: duration/outcome + 현업 실무자 support
- purpose: long duration과 typed support가 industry relevance 없이도 점수를 끌어올리는지 재확인
- input_summary: 심리 계열 전공, 실제 적용 프로젝트 1건, 현업 실무자 상대 계약성 업무 1건, target industry direct context 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 1
- expected_score_band: very_low
- expected_reasoning: duration, outcome, typed support는 industry-specific evidence가 아니므로 very_low guardrail을 넘기면 안 된다.
- actual_axis2_score: 60
- actual_score_band: mid
- actual_reasoning_summary: duration/outcome 강도와 typed contract support가 industry relevance 없이 mid를 만들었다.
- result: hard mismatch
- reinforces_prior_pattern: yes
- suspected_cause_classification: implementation drift
- follow_up_needed: supportContextCount와 contract typed context 기여를 좁게 확인 필요
- status: validated
- case_revision_note: 2026-04-05 second calibration batch appended
- run_history:
  - run_date: 2026-04-05
  - expected: very_low / 1
  - actual: mid / 60
  - result: hard mismatch
  - note: pattern A repeat check - duration/support variant

### NGA2-CASE-20260405-015
- date: 2026-04-05
- pattern_target: B
- bucket: 전공만 관련
- variant_label: 관련 전공만 명확
- purpose: clearly related major only가 최소 mid lift를 만드는지 재확인
- input_summary: 경제학 전공만 있고 인턴, 프로젝트, 자격 보강은 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 3
- expected_score_band: mid
- expected_reasoning: related major는 primary usable signal이므로 unrelated-major case보다 한 단계는 높아야 한다.
- actual_axis2_score: 40
- actual_score_band: low
- actual_reasoning_summary: clearly related major only가 still low에 머물러 first batch under-lift 패턴이 반복됐다.
- result: soft mismatch
- reinforces_prior_pattern: yes
- suspected_cause_classification: implementation drift
- follow_up_needed: related major only lift 미반영 반복 확인 완료
- status: validated
- case_revision_note: 2026-04-05 second calibration batch appended
- run_history:
  - run_date: 2026-04-05
  - expected: mid / 3
  - actual: low / 40
  - result: soft mismatch
  - note: pattern B repeat check - major only variant

### NGA2-CASE-20260405-016
- date: 2026-04-05
- pattern_target: B
- bucket: 전공 + 프로젝트
- variant_label: 관련 전공 + weak project support 변형
- purpose: related major와 weak project support 조합이 mid로 올라가는지 재확인
- input_summary: 경제학 전공, 캡스톤 데이터 분석 프로젝트 1건, applied-context 인턴 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 3
- expected_score_band: mid
- expected_reasoning: related major와 weak project support가 같은 방향으로 수렴하면 low보다 한 단계 위여야 한다.
- actual_axis2_score: 40
- actual_score_band: low
- actual_reasoning_summary: related major + weak project 조합이 again low에 머물러 project-only 수준과 구분되지 않았다.
- result: soft mismatch
- reinforces_prior_pattern: yes
- suspected_cause_classification: implementation drift
- follow_up_needed: major relevance가 weak project와 결합돼도 가산되지 않는지 확인 완료
- status: validated
- case_revision_note: 2026-04-05 second calibration batch appended
- run_history:
  - run_date: 2026-04-05
  - expected: mid / 3
  - actual: low / 40
  - result: soft mismatch
  - note: pattern B repeat check - major + project variant

### NGA2-CASE-20260405-017
- date: 2026-04-05
- pattern_target: B
- bucket: 전공 + 인턴
- variant_label: 관련 전공 + direct internship context 변형
- purpose: related major와 direct internship context가 함께 있을 때 mid_high 후보가 되는지 재확인
- input_summary: 경제학 전공, 외부 파트너 상대 학기 중 인턴 1건, 추가 자격/프로젝트 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 4
- expected_score_band: mid_high
- expected_reasoning: related major 1건과 direct internship context 1건이 정렬되면 4 후보로 봐야 한다.
- actual_axis2_score: 60
- actual_score_band: mid
- actual_reasoning_summary: direct internship는 반영됐지만 related major가 추가 lift를 만들지 못해 again mid에 머물렀다.
- result: soft mismatch
- reinforces_prior_pattern: yes
- suspected_cause_classification: implementation drift
- follow_up_needed: 4 조건이 major + context 조합에서 지나치게 좁은지 조사 필요
- status: validated
- case_revision_note: 2026-04-05 second calibration batch appended
- run_history:
  - run_date: 2026-04-05
  - expected: mid_high / 4
  - actual: mid / 60
  - result: soft mismatch
  - note: pattern B repeat check - major + direct internship variant

### NGA2-CASE-20260405-018
- date: 2026-04-05
- pattern_target: B
- bucket: 전공 + 자격
- variant_label: 관련 전공 + 산업 연결 자격
- purpose: related major와 industry-linked certification 조합이 low를 넘는지 재확인
- input_summary: 경제학 전공, 금융 자격 1건, 인턴/프로젝트 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 3
- expected_score_band: mid
- expected_reasoning: related major와 industry-linked certification 조합은 thin evidence라도 mid까지는 읽혀야 한다.
- actual_axis2_score: 40
- actual_score_band: low
- actual_reasoning_summary: related major + industry-linked certification도 still low에 머물러 B pattern이 다시 반복됐다.
- result: soft mismatch
- reinforces_prior_pattern: yes
- suspected_cause_classification: implementation drift
- follow_up_needed: major + certification aligned pair under-lift 확인 완료
- status: validated
- case_revision_note: 2026-04-05 second calibration batch appended
- run_history:
  - run_date: 2026-04-05
  - expected: mid / 3
  - actual: low / 40
  - result: soft mismatch
  - note: pattern B repeat check - major + linked certification variant

### NGA2-CASE-20260405-019
- date: 2026-04-05
- pattern_target: A
- bucket: 프로젝트만 관련
- variant_label: unrelated major + weak project support
- purpose: weak project support가 unrelated major와 결합될 때 low cap을 유지하는지 확인
- input_summary: 심리학 전공, 사이드프로젝트 1건, 금융과 직접 맞닿는 인턴/자격 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 2
- expected_score_band: low
- expected_reasoning: weak project support 단독은 low cap이어야 한다.
- actual_axis2_score: 40
- actual_score_band: low
- actual_reasoning_summary: weak project support가 low에 머물렀고 unrelated major가 추가 상승을 만들지 않았다.
- result: match
- reinforces_prior_pattern: no
- suspected_cause_classification: cap working as intended
- follow_up_needed: 없음
- status: validated
- case_revision_note: 2026-04-05 targeted expansion first run appended
- run_history:
  - run_date: 2026-04-05
  - expected: low / 2
  - actual: low / 40
  - result: match
  - note: weak project support low cap 유지

### NGA2-CASE-20260405-020
- date: 2026-04-05
- pattern_target: A
- bucket: 인턴만 관련
- variant_label: unrelated major + strong internship support
- purpose: unrelated major라도 strong typed internship support가 mid까지 올라가는지 확인
- input_summary: 심리학 전공, 외부 파트너 상대 금융권 인턴 1건, 프로젝트/자격 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 3
- expected_score_band: mid
- expected_reasoning: direct internship context가 있으면 major mismatch여도 mid까지는 가능해야 한다.
- actual_axis2_score: 60
- actual_score_band: mid
- actual_reasoning_summary: strong internship context가 실제로 mid lift를 만들었다.
- result: match
- reinforces_prior_pattern: no
- suspected_cause_classification: expected behavior
- follow_up_needed: 없음
- status: validated
- case_revision_note: 2026-04-05 targeted expansion first run appended
- run_history:
  - run_date: 2026-04-05
  - expected: mid / 3
  - actual: mid / 60
  - result: match
  - note: strong internship support mid lift 확인

### NGA2-CASE-20260405-021
- date: 2026-04-05
- pattern_target: B
- bucket: 전공만 관련
- variant_label: related major + no real supporting evidence
- purpose: related major only가 현재 harness에서 최소 mid로 읽히는지 재확인
- input_summary: 경제학 전공만 있고 자격/프로젝트/인턴 보강은 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 3
- expected_score_band: mid
- expected_reasoning: related major는 primary usable signal이라 low보다는 한 단계 위여야 한다.
- actual_axis2_score: 60
- actual_score_band: mid
- actual_reasoning_summary: 이번 targeted run에서는 related major only가 mid로 읽혀 prior under-lift 기록과 충돌했다.
- result: match
- reinforces_prior_pattern: no
- suspected_cause_classification: unable to judge
- follow_up_needed: prior case payload / raw result 재대조 필요
- status: validated
- case_revision_note: 2026-04-05 targeted expansion first run appended
- run_history:
  - run_date: 2026-04-05
  - expected: mid / 3
  - actual: mid / 60
  - result: match
  - note: prior B pattern과 충돌하는 retest 결과

### NGA2-CASE-20260405-022
- date: 2026-04-05
- pattern_target: B
- bucket: 전공 + 프로젝트
- variant_label: related major + weak but repeated project signal
- purpose: related major와 weak project 반복 신호가 mid를 유지하는지 확인
- input_summary: 경제학 전공, 금융 데이터 프로젝트 2건, 인턴/자격 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 3
- expected_score_band: mid
- expected_reasoning: related major와 weak project 반복은 low를 넘겨 mid에 머무는 것이 자연스럽다.
- actual_axis2_score: 60
- actual_score_band: mid
- actual_reasoning_summary: repeated weak project signal이 related major와 결합돼 mid 수준으로 읽혔다.
- result: match
- reinforces_prior_pattern: no
- suspected_cause_classification: expected behavior
- follow_up_needed: 없음
- status: validated
- case_revision_note: 2026-04-05 targeted expansion first run appended
- run_history:
  - run_date: 2026-04-05
  - expected: mid / 3
  - actual: mid / 60
  - result: match
  - note: repeated weak project + related major mid 유지

### NGA2-CASE-20260405-023
- date: 2026-04-05
- pattern_target: A
- bucket: 자격만 관련
- variant_label: unrelated major + cert only
- purpose: unrelated major에서 industry-linked certification only가 low cap을 유지하는지 확인
- input_summary: 심리학 전공, 금융 자격 1건, 프로젝트/인턴 없음
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 2
- expected_score_band: low
- expected_reasoning: certification only는 low cap이어야 한다.
- actual_axis2_score: 40
- actual_score_band: low
- actual_reasoning_summary: cert-only case가 low에 머물러 cap이 유지됐다.
- result: match
- reinforces_prior_pattern: no
- suspected_cause_classification: cap working as intended
- follow_up_needed: 없음
- status: validated
- case_revision_note: 2026-04-05 targeted expansion first run appended
- run_history:
  - run_date: 2026-04-05
  - expected: low / 2
  - actual: low / 40
  - result: match
  - note: cert-only cap 재확인

### NGA2-CASE-20260405-024
- date: 2026-04-05
- pattern_target: B
- bucket: 전공 + 프로젝트 + 인턴
- variant_label: related major + internship/project both strong
- purpose: related major, project, internship이 모두 강할 때 high 후보가 되는지 확인
- input_summary: 경제학 전공, 금융 데이터 프로젝트 1건, 금융기관 인턴 1건
- targetIndustryId: `IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING`
- expected_axis2_score: 4
- expected_score_band: high
- expected_reasoning: major + project + internship이 정렬되면 high bucket에 들어가야 한다.
- actual_axis2_score: 80
- actual_score_band: mid_high
- actual_reasoning_summary: strong combined signals가 mid_high까지 상승했고 3-band 해석에서는 high로 본다.
- result: match
- reinforces_prior_pattern: no
- suspected_cause_classification: expected behavior
- follow_up_needed: 없음
- status: validated
- case_revision_note: 2026-04-05 targeted expansion first run appended
- run_history:
  - run_date: 2026-04-05
  - expected: high / 4
  - actual: mid_high / 80
  - result: match
  - note: strong combo high-side retest 정상

## 2026-04-05 Axis 2 Old Mismatch Repro Check

### NGA2-REPRO-20260405-002R
- source_old_case_id: `NGA2-CASE-20260405-002`
- payload_summary: IT target industry, related major only, no project / internship / certification
- current_result: `mid / 60`
- prior_recorded_result: `low / 40`
- conflict: yes
- likely_cause: `old payload shape 차이` 또는 `old harness / read path 차이`
- note: same harness retest에서는 under-lift가 재현되지 않았다.

### NGA2-REPRO-20260405-006R
- source_old_case_id: `NGA2-CASE-20260405-006`
- payload_summary: finance target industry, related major + weak project 1건
- current_result: `mid / 60`
- prior_recorded_result: `low / 40`
- conflict: yes
- likely_cause: `old payload shape 차이` 또는 `expectation drift`
- note: 현재 harness에서는 related major + weak project가 mid로 읽혔다.

### NGA2-REPRO-20260405-007R
- source_old_case_id: `NGA2-CASE-20260405-007`
- payload_summary: finance target industry, related major + direct internship context
- current_result: `mid / 60`
- prior_recorded_result: `mid / 60`
- conflict: no
- likely_cause: `none`
- note: direct internship context 쪽 결과는 same harness에서도 prior 기록과 일치했다.

### repro reading
- 3건 중 2건은 prior mismatch가 same harness에서 재현되지 않았다.
- 현재 evidence로는 `실제 scoring inconsistency`보다 `old payload shape 차이` 또는 `old harness/read path 차이` 쪽이 더 그럴듯하다.
- 따라서 Axis 2는 아직 버그 확정보다 old/new payload raw 비교가 우선이다.
## 2026-04-05 Axis 2 Raw Repro Narrowing

### reconstruction target
- focus_old_cases:
  - `NGA2-CASE-20260405-002`
  - `NGA2-CASE-20260405-006`
- narrowing_points:
  - old payload field shape 차이
  - normalization 전/후 `major` shape 차이
  - targetIndustry anchor는 동일 유지
  - project typing / internship context는 기존 repro shape 최대한 유지

### rerun entries

#### `NGA2-REPRO-20260405-002R2`
- source_case: `NGA2-CASE-20260405-002`
- purpose: related-major under-lift old mismatch를 raw major object shape로 재검증
- payload_summary: `major`를 문자열이 아니라 `{ category: "engineering_it", subcategory: "", label: "" }` 형태로 주입
- prior_recorded_result: `low / 40`
- current_result: `low / 40`
- conflict: `no`
- likely_cause_bucket: `payload_shape_conflict`
- why_this_matters: canonical 문자열 major와 raw object-category major가 서로 다른 relevance 결과를 만든다.

#### `NGA2-REPRO-20260405-006R2`
- source_case: `NGA2-CASE-20260405-006`
- purpose: related-major + weak project old mismatch를 raw major object shape로 재검증
- payload_summary: `major`를 `{ category: "business_economics", subcategory: "", label: "" }` 형태로 주입하고 weak project 유지
- prior_recorded_result: `low / 40`
- current_result: `low / 40`
- conflict: `no`
- likely_cause_bucket: `payload_shape_conflict`
- why_this_matters: normalization 전 major category code가 직접 relevance 계산에 들어가면 old low가 재현된다.

### raw repro memo
- current_reading:
  - prior mismatch 2건은 same harness + raw-object major shape에서 old `low / 40`이 재현됐다.
  - 따라서 current mixed/conflict의 가장 유력한 원인은 `payload_shape_conflict`다.
  - `read_path_conflict` 가능성은 남지만 1순위는 아니다.
- next_note:
  - Axis 2는 logic bug 단정보다 old raw payload 기록 보존 여부를 먼저 확인해야 한다.
## 2026-04-05 Axis 2 Raw Payload Snapshot Comparison

### prior mismatch recovery
- `NGA2-CASE-20260405-002`
  - old expected: `mid / 3`
  - old actual: `low / 40`
  - raw payload availability: exact raw payload 없음
  - recovery status: `reconstructed_from_notes`
- `NGA2-CASE-20260405-006`
  - old expected: `mid / 3`
  - old actual: `low / 40`
  - raw payload availability: exact raw payload 없음
  - recovery status: `reconstructed_from_notes`
- `NGA2-CASE-20260405-007`
  - old expected: `mid_high / 4`
  - old actual: `mid / 60`
  - raw payload availability: exact raw payload 없음, 목적/요약/actual 기록만 존재
  - recovery status: `partial_payload_available`

### controlled snapshot variants

#### `NGA2-SNAPSHOT-20260405-002A`
- source_case: `NGA2-CASE-20260405-002`
- variant_label: `002-string-major-control`
- changed_field: `major string`
- raw_major: `"컴퓨터공학"`
- normalized_major: `"컴퓨터공학"`
- scorer_consumption_summary:
  - majorStrength: `2`
  - majorAligned: `true`
  - weakProjectSignal: `false`
  - strongContextCount: `0`
- actual_result: `mid / 60`
- repro: `no`
- note: related major lift가 정상 반영된다.

#### `NGA2-SNAPSHOT-20260405-002B`
- source_case: `NGA2-CASE-20260405-002`
- variant_label: `002-object-category-only`
- changed_field: `major object -> category code only`
- raw_major: `{ category: "engineering_it", subcategory: "", label: "" }`
- normalized_major: `"engineering_it"`
- scorer_consumption_summary:
  - majorStrength: `0`
  - majorAligned: `false`
  - weakSignalCount: `1`
- actual_result: `low / 40`
- repro: `yes`
- note: old low mismatch가 same harness에서 재현된다.

#### `NGA2-SNAPSHOT-20260405-002C`
- source_case: `NGA2-CASE-20260405-002`
- variant_label: `002-object-with-label`
- changed_field: `major object but label preserved`
- raw_major: `{ category: "engineering_it", subcategory: "컴퓨터공학", label: "컴퓨터공학" }`
- normalized_major: `"컴퓨터공학"`
- scorer_consumption_summary:
  - majorStrength: `2`
  - majorAligned: `true`
- actual_result: `mid / 60`
- repro: `no`
- note: object shape 자체가 아니라 normalization 후 남는 문자열이 핵심이다.

#### `NGA2-SNAPSHOT-20260405-006A`
- source_case: `NGA2-CASE-20260405-006`
- variant_label: `006-string-major-weak-project`
- changed_field: `major string + weak project`
- raw_major: `"경영학"`
- normalized_major: `"경영학"`
- scorer_consumption_summary:
  - majorStrength: `2`
  - majorAligned: `true`
  - projectSupportCount: `1`
  - weakProjectSignal: `true`
- actual_result: `mid / 60`
- repro: `no`
- note: related major + weak project는 current harness에서 mid가 맞다.

#### `NGA2-SNAPSHOT-20260405-006B`
- source_case: `NGA2-CASE-20260405-006`
- variant_label: `006-object-category-only-weak-project`
- changed_field: `major object -> category code only`
- raw_major: `{ category: "business_economics", subcategory: "", label: "" }`
- normalized_major: `"business_economics"`
- scorer_consumption_summary:
  - majorStrength: `0`
  - majorAligned: `false`
  - projectSupportCount: `1`
  - weakSignalCount: `2`
- actual_result: `low / 40`
- repro: `yes`
- note: old under-lift가 same harness에서 다시 재현된다.

#### `NGA2-SNAPSHOT-20260405-006C`
- source_case: `NGA2-CASE-20260405-006`
- variant_label: `006-project-type-only-change`
- changed_field: `project.type weak -> non-weak`
- raw_major: `"경영학"`
- normalized_major: `"경영학"`
- scorer_consumption_summary:
  - majorStrength: `2`
  - majorAligned: `true`
  - projectSupportCount: `0`
- actual_result: `mid / 60`
- repro: `no`
- note: 이번 비교에서는 project typing보다 major normalization 문자열이 더 큰 충돌 지점이다.

#### `NGA2-SNAPSHOT-20260405-007A`
- source_case: `NGA2-CASE-20260405-007`
- variant_label: `007-string-major-direct-internship-control`
- changed_field: `control`
- raw_major: `"경영학"`
- normalized_major: `"경영학"`
- scorer_consumption_summary:
  - majorStrength: `2`
  - majorAligned: `true`
  - strongContextCount: `1`
- actual_result: `mid / 60`
- repro: `control consistent`
- note: prior 기록과 같은 mid가 나온다.

#### `NGA2-SNAPSHOT-20260405-007B`
- source_case: `NGA2-CASE-20260405-007`
- variant_label: `007-object-category-only-direct-internship-control`
- changed_field: `major object -> category code only`
- raw_major: `{ category: "business_economics", subcategory: "", label: "" }`
- normalized_major: `"business_economics"`
- scorer_consumption_summary:
  - majorStrength: `0`
  - majorAligned: `false`
  - strongContextCount: `1`
- actual_result: `mid / 60`
- repro: `control consistent`
- note: direct internship context가 살아 있으면 major lift가 죽어도 mid는 유지된다.

### snapshot reading lock
- current strongest conflict point는 `major` raw object가 아니라 `normalizeMajor()` 이후 남는 문자열이다.
- `label/subcategory`가 비고 `category code`만 남으면 related-major keyword hit가 사라져 Axis 2 low가 재현된다.
- targetIndustry anchor는 이번 controlled set에서 안정적으로 유지됐다.
- internship/context와 certifications shape는 이번 set에서 주요 충돌 원인으로 보이지 않았다.
