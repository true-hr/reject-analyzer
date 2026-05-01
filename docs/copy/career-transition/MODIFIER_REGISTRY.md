# PASSMAP Career Transition Modifier Registry

## Purpose

전환 맞춤 문구의 axis overlay에 조합하는 modifier를 등록하고 관리하는 SSOT다.

Modifier는 Archetype의 기본 템플릿 위에서 도메인, 연차, 증거 유형에 따라 scoreReason과 liftOrLimit을 조정한다. Curated Case Override가 있으면 modifier는 발화하지 않는다.

## Structure Rule

각 modifier는 아래 필드를 포함한다.

| 필드 | 설명 |
|---|---|
| modifierKey | 고유 식별자. snake_lower_case |
| group | domain / seniority / evidence |
| appliesTo | 이 modifier가 적용되는 axis 슬롯 목록 |
| userFacingCopy | 사용자에게 노출되는 조정 문구 방향 |
| riskCopy | 이 modifier가 활성화될 때 함께 노출할 리스크 문구 |
| resumeRewriteHint | 이 modifier 상황에서 이력서 재작성 방향 |
| avoidWhen | 이 modifier를 사용하면 안 되는 조건 |

---

## Group 1: Domain Modifier

현재 직무 경험 도메인과 목표 직무 도메인의 관계에 따라 적용한다.

---

### same_domain

- **modifierKey**: same_domain
- **group**: domain
- **appliesTo**: jobStructure.scoreReason, industryContext.lead, industryContext.liftOrLimit

**userFacingCopy**

같은 도메인이라면 전환 난이도는 낮아집니다. 기존에 다뤄온 고객 구조, 수익모델, 핵심 지표가 목표 직무에서도 바로 적용되기 때문입니다. 산업 학습 비용 없이 역할 전환에 집중할 수 있다는 점이 강점입니다.

**riskCopy**

같은 도메인 내 전환이라도, 역할 구조 자체가 다르다면 기존 방식을 그대로 가져가려는 관성이 생길 수 있습니다. 도메인 지식 강점과 역할 전환의 차이를 구분해서 표현해야 합니다.

**resumeRewriteHint**

도메인 전문성을 배경으로 쓰되, 역할 전환의 차이점을 전면에 내세운다. "같은 산업에서 일했다"보다 "이 산업의 고객 구조를 알기 때문에 목표 직무의 판단 속도가 빠르다"는 방향이 좋다.

**avoidWhen**

도메인이 실제로 다른데 같다고 판단되는 경우. 예: 커머스 마케터 → 헬스케어 PM.

---

### adjacent_domain

- **modifierKey**: adjacent_domain
- **group**: domain
- **appliesTo**: jobStructure.scoreReason, industryContext.scoreReason, industryContext.liftOrLimit

**userFacingCopy**

도메인이 완전히 같지는 않지만 유사한 고객 구조나 비즈니스 모델을 공유합니다. 핵심 개념이 겹치는 부분이 있어 전환 학습 비용이 완전히 다른 도메인보다는 낮습니다.

**riskCopy**

인접 도메인이라도 핵심 지표와 고객 행동 방식이 다를 수 있습니다. 어떤 부분이 겹치고 어떤 부분이 다른지를 명확하게 구분해야 합니다.

**resumeRewriteHint**

두 도메인의 공통점을 전면에 내세우되, 차이점에 대한 학습 의지와 전환 근거를 함께 제시한다.

**avoidWhen**

도메인 간 핵심 지표와 고객 구조가 실질적으로 다를 때. 인접해 보이지만 구매 주기나 의사결정 구조가 완전히 다른 경우.

---

### different_domain

- **modifierKey**: different_domain
- **group**: domain
- **appliesTo**: jobStructure.scoreReason, industryContext.scoreReason, industryContext.liftOrLimit

**userFacingCopy**

도메인이 바뀌면 고객 구조, 구매 주기, 핵심 지표, 규제 환경이 달라집니다. 역할 전환과 도메인 학습을 동시에 해야 하기 때문에 초기 적응 비용이 높을 수 있습니다.

**riskCopy**

도메인이 다른 전환에서는 기존 경험이 "이 산업에서도 통할 것이다"는 가정이 위험할 수 있습니다. 새 도메인의 고객과 지표를 이해한다는 근거가 이력서에 있어야 합니다.

**resumeRewriteHint**

새 도메인에 대한 사전 이해나 관심을 구체적으로 표현한다. "이 산업을 공부하고 있다"보다 "이 산업의 고객 구조에서 어떤 문제를 발견했다"는 방향이 좋다.

**avoidWhen**

도메인이 실제로 같거나 인접한 경우. 도메인 차이가 있더라도 지원자가 해당 도메인 학습 경험을 이미 갖고 있을 때.

---

### technical_data_heavy_domain

- **modifierKey**: technical_data_heavy_domain
- **group**: domain
- **appliesTo**: jobStructure.criteria, roleCharacter.scoreReason

**userFacingCopy**

데이터나 기술 이해가 중요한 도메인에서는, 분석 역량과 기술 언어에 대한 기본 이해가 PM 또는 기획 역할에서도 중요하게 평가될 수 있습니다.

**riskCopy**

기술·데이터 도메인에서는 "기술을 이해하는 기획자"와 "기획만 하는 기획자"의 차이가 크게 보일 수 있습니다. SQL, 데이터 파이프라인, 실험 설계에 대한 기본 이해가 있는지가 중요한 신호입니다.

**resumeRewriteHint**

SQL 쿼리 작성, 데이터 분석 도구 활용, 개발팀과의 스펙 협의 경험을 구체적으로 표현한다.

**avoidWhen**

기술 이해가 실질적으로 요구되지 않는 도메인(예: 오프라인 운영 중심 서비스).

---

### regulated_domain

- **modifierKey**: regulated_domain
- **group**: domain
- **appliesTo**: industryContext.scoreReason, industryContext.criteria

**userFacingCopy**

금융, 헬스케어, 법률 등 규제가 강한 도메인에서는 컴플라이언스 이해와 규제 대응 경험이 역할 수행의 중요한 배경이 됩니다.

**riskCopy**

규제 도메인에 경험이 없다면, 제품이나 기획 결정에 규제 제약이 어떻게 작동하는지 이해하는 데 시간이 필요합니다. 이 학습 비용을 과소평가하지 않아야 합니다.

**resumeRewriteHint**

규제 환경에서 어떤 제약을 경험했고, 어떻게 대응했는지를 구체적으로 표현한다. "금융 규정을 준수했다"보다 "규제 제약 안에서 어떤 설계 결정을 내렸는지"를 보여준다.

**avoidWhen**

규제 수준이 낮은 도메인. 또는 지원자가 이미 동일 규제 환경에서 경험을 갖고 있는 경우.

---

### b2b_saas_domain

- **modifierKey**: b2b_saas_domain
- **group**: domain
- **appliesTo**: industryContext.scoreReason, customerType.liftOrLimit

**userFacingCopy**

B2B SaaS 도메인은 리드 품질, 세일즈 퍼널, 활성률, 유지율, 갱신율이 핵심 지표입니다. 커머스나 소비자 서비스와는 고객 획득 방식과 전환 구조가 크게 다릅니다.

**riskCopy**

B2C 중심 경험을 가진 지원자가 B2B SaaS로 전환할 때는 단순 전환율보다 리드 품질, 세일즈 사이클, 온보딩 완료율 같은 B2B 지표 이해가 요구됩니다.

**resumeRewriteHint**

B2B 고객의 의사결정 구조(챔피언, 구매자, 사용자 분리), 계약 갱신 구조, 온보딩 완료율 개선 경험을 표현한다.

**avoidWhen**

B2C 또는 커머스 도메인 PM으로 지원하는 경우. 또는 지원자가 이미 B2B SaaS 경험을 갖고 있어 modifier 적용이 필요 없는 경우.

---

### commerce_domain

- **modifierKey**: commerce_domain
- **group**: domain
- **appliesTo**: industryContext.lead, customerType.scoreReason

**userFacingCopy**

커머스 도메인에서는 구매 전환율, 장바구니 이탈률, 재구매율, 객단가가 핵심 지표입니다. 상품 구성, 가격, 프로모션, 배송 경험이 제품 성장 문제와 직결됩니다.

**riskCopy**

커머스 경험은 이 도메인에서 강점이 되지만, 커머스 밖으로 나가면 지표 체계와 고객 행동 방식이 달라집니다. 도메인 전환 시 이 차이를 보완할 근거가 필요합니다.

**resumeRewriteHint**

전환율, 재구매율, 객단가 개선 경험을 구체적인 수치와 함께 표현한다. 상품 기획, 가격 전략, 프로모션 설계 경험도 포함한다.

**avoidWhen**

SaaS, 헬스케어, B2B 서비스 등 커머스 지표 구조가 적용되지 않는 도메인으로 지원하는 경우.

---

### platform_domain

- **modifierKey**: platform_domain
- **group**: domain
- **appliesTo**: jobStructure.criteria, customerType.scoreReason

**userFacingCopy**

플랫폼 도메인에서는 공급자와 소비자 양면 시장의 균형, 네트워크 효과, 매칭 품질이 핵심 문제입니다. 단일 고객만 보는 서비스와는 제품 설계 기준이 다릅니다.

**riskCopy**

플랫폼의 복잡성은 공급자 경험과 소비자 경험을 동시에 고려해야 한다는 데 있습니다. 단면 서비스 경험만 있다면 플랫폼 트레이드오프 이해가 요구됩니다.

**resumeRewriteHint**

공급자 온보딩, 매칭 품질 개선, 양면 지표(공급자 이탈률 + 소비자 전환율) 동시 관리 경험을 표현한다.

**avoidWhen**

단일 고객 서비스로 지원하는 경우. 또는 지원자가 이미 플랫폼 경험을 갖고 있어 modifier 적용이 불필요한 경우.

---

## Group 2: Seniority Modifier

지원자의 경력 연차에 따라 기대 역할과 판단 기준을 조정한다.

---

### junior

- **modifierKey**: junior
- **group**: seniority
- **appliesTo**: responsibilityScope.scoreReason, responsibilityScope.liftOrLimit
- **targetYears**: 1~3년

**userFacingCopy**

저연차 전환은 완전한 제품 오너십보다 기여 역할로의 전환으로 설계하는 것이 현실적입니다. 퍼널 분석, 실험 운영, 기능 개선 협업 같은 실행 경험이 중요한 평가 기준이 됩니다.

**riskCopy**

저연차에서 "PM을 하고 싶다"는 의지만으로는 부족합니다. 구체적인 제품 개선 경험, 데이터 기반 판단 사례, 협업 과정에서의 기여를 보여줘야 합니다.

**resumeRewriteHint**

직책 전환보다 역할 기여를 강조한다. "PM 역할을 했다"보다 "이 문제를 발견하고, 이 개선을 제안했으며, 이 결과가 나왔다"는 흐름으로 작성한다.

**avoidWhen**

5년 이상 경력자에게 적용하는 경우. 또는 지원 직무에서 저연차 포지션이 없는 경우.

---

### mid

- **modifierKey**: mid
- **group**: seniority
- **appliesTo**: jobStructure.scoreReason, responsibilityScope.criteria
- **targetYears**: 3~7년

**userFacingCopy**

중간 연차 전환은 기여 역할을 넘어 독립적인 문제 정의와 실행 이끌기 역량이 요구됩니다. 개발·디자인·사업 조직과의 협업에서 조율 역할을 맡은 경험이 중요합니다.

**riskCopy**

중간 연차라면 "이 역할을 하고 싶다"보다 "이 역할을 이미 부분적으로 하고 있었다"를 증명하는 것이 중요합니다. 역할 전환 의지보다 역할 수행 근거가 더 설득력 있습니다.

**resumeRewriteHint**

역할 확장 경험을 전면에 내세운다. 기존 직무 범위를 넘어 어떤 책임을 자발적으로 맡았는지, 어떤 의사결정을 주도했는지를 표현한다.

**avoidWhen**

1~2년 미만 초기 경력자. 또는 8년 이상 시니어급에게 적용하는 경우.

---

### senior

- **modifierKey**: senior
- **group**: seniority
- **appliesTo**: jobStructure.criteria, responsibilityScope.scoreReason, roleCharacter.scoreReason
- **targetYears**: 7년 이상

**userFacingCopy**

고연차 전환은 단순 역할 이동이 아니라 전략 수준의 기여가 요구됩니다. 성장 전략, 제품 지표 체계, 조직 협업 설계, 수익모델 개선 경험이 확인되어야 합니다.

**riskCopy**

고연차일수록 "왜 이 시점에 이 전환을 선택했는가"에 대한 설명이 필요합니다. 역량 부족이 아니라 커리어 전략으로서의 전환임을 설득력 있게 표현해야 합니다.

**resumeRewriteHint**

전략적 기여를 전면에 내세운다. 개별 기능 개선보다 조직·제품·사업 성과에 어떤 영향을 미쳤는지를 숫자와 함께 표현한다. 리더십 경험과 의사결정 영향력을 명확하게 드러낸다.

**avoidWhen**

3년 미만 경력자. 또는 지원 직무에서 시니어 포지션이 없는 경우.

---

## Group 3: Evidence Modifier

이력서에서 확인된 증거 유형에 따라 강점 부각 방식과 리스크 표현을 조정한다.

---

### output_only

- **modifierKey**: output_only
- **group**: evidence
- **appliesTo**: responsibilityScope.scoreReason, responsibilityScope.liftOrLimit

**userFacingCopy**

기획 산출물, 화면설계, 보고서, 문서 작성 중심의 경험은 해당 역할의 실행 능력을 증명하지만, 문제 정의, 우선순위 판단, 성과 확인 경험은 별도로 확인이 필요합니다.

**riskCopy**

산출물 중심 경험만으로는 "무엇을 왜 만들어야 하는지 결정하는 역할"로의 전환이 충분히 설득되지 않을 수 있습니다. 판단 경험과 성과 연결을 추가해야 합니다.

**resumeRewriteHint**

산출물 자체를 쓰기보다, 그 산출물이 어떤 문제를 해결했고 어떤 결과로 이어졌는지를 연결해 표현한다. "기획서를 작성했다"보다 "이 기획서가 어떤 의사결정에 사용되었고 어떤 변화를 만들었는지"를 표현한다.

**avoidWhen**

이력서에 이미 지표 개선, 의사결정 참여, 실험 설계 같은 판단 경험이 확인된 경우.

---

### metric_evidence

- **modifierKey**: metric_evidence
- **group**: evidence
- **appliesTo**: jobStructure.lead, jobStructure.scoreReason

**userFacingCopy**

지표 개선 경험이 있다는 것은 목표 직무에서도 데이터 기반 판단이 가능하다는 신호입니다. 전환율, 리텐션, 활성률 같은 구체적인 지표 개선 사례가 있으면 PM 또는 기획 역할 적합도가 높아집니다.

**riskCopy**

지표 개선 수치만 쓰면 "운이 좋았거나 외부 변수 영향"으로 해석될 수 있습니다. 어떤 문제를 어떻게 정의했고 어떤 방법으로 개선했는지를 함께 표현해야 합니다.

**resumeRewriteHint**

지표 수치를 제시할 때 반드시 "무엇을 발견했고 → 어떤 가설을 세웠고 → 어떤 실행을 했고 → 어떤 결과가 나왔는지"의 흐름으로 연결한다.

**avoidWhen**

지표 개선 경험이 전혀 없는 경우. 또는 수치가 불확실하거나 과장될 위험이 있는 경우.

---

### ownership_evidence

- **modifierKey**: ownership_evidence
- **group**: evidence
- **appliesTo**: responsibilityScope.lead, responsibilityScope.scoreReason

**userFacingCopy**

제품이나 기능의 방향을 직접 결정한 경험이 있다는 것은 PM 역할 적합도의 강한 신호입니다. 기획부터 출시까지 책임진 경험이 확인되면 전환 설득력이 높아집니다.

**riskCopy**

"오너십이 있었다"는 주장만으로는 부족합니다. 어떤 결정을 내렸고, 그 결정의 근거는 무엇이었으며, 결과는 어떠했는지가 함께 확인되어야 합니다.

**resumeRewriteHint**

"담당했다"보다 "어떤 결정을 직접 내렸고, 어떤 이유로 그 우선순위를 선택했으며, 이후 어떻게 확인했는지"를 표현한다.

**avoidWhen**

오너십 경험이 실제로는 상사의 결정을 실행한 것에 가까운 경우. 과장 위험이 있으면 사용하지 않는다.

---

### crossfunctional_evidence

- **modifierKey**: crossfunctional_evidence
- **group**: evidence
- **appliesTo**: responsibilityScope.criteria, customerType.scoreReason

**userFacingCopy**

개발, 디자인, 마케팅, 사업 조직과 협업해 결과를 만든 경험은 PM 또는 기획 역할에서 중요한 강점입니다. 조율과 설득 역량이 실제로 검증된 신호로 해석됩니다.

**riskCopy**

"협업했다"는 표현만으로는 부족합니다. 어떤 갈등이나 우선순위 충돌이 있었고, 어떻게 조율했으며, 결과적으로 어떤 결정이 나왔는지가 표현되어야 합니다.

**resumeRewriteHint**

협업 경험을 "함께 일했다"보다 "어떤 이해관계 충돌이 있었고, 어떤 근거로 조율했으며, 어떤 결과물이 나왔는지"로 표현한다.

**avoidWhen**

협업이 단순 보고나 전달 수준이었던 경우. 또는 주도적 역할 없이 수동적으로 참여한 경우.

---

### domain_evidence

- **modifierKey**: domain_evidence
- **group**: evidence
- **appliesTo**: industryContext.lead, industryContext.scoreReason

**userFacingCopy**

해당 도메인에서 쌓은 경험은 목표 직무에서 빠른 적응력의 근거가 됩니다. 고객 구조, 핵심 지표, 주요 플레이어에 대한 이해는 역할 전환 비용을 낮춥니다.

**riskCopy**

도메인 경험이 강점이 되려면 그 경험이 목표 역할과 연결되어야 합니다. "이 산업에서 일했다"보다 "이 산업에서 이런 문제를 발견했고, 이런 방식으로 접근했다"가 더 설득력 있습니다.

**resumeRewriteHint**

도메인 지식을 배경 설명으로만 쓰지 않는다. 해당 도메인 경험에서 어떤 인사이트를 얻었고, 그것이 목표 역할에서 어떻게 활용될 수 있는지를 연결한다.

**avoidWhen**

도메인 경험이 얕거나 단기인 경우. 또는 목표 도메인과 현재 도메인이 실질적으로 다른 경우.

---

### weak_evidence

- **modifierKey**: weak_evidence
- **group**: evidence
- **appliesTo**: jobStructure.scoreReason, responsibilityScope.scoreReason, responsibilityScope.liftOrLimit

**userFacingCopy**

지원 직무와 직결되는 경험이 이력서에서 명확하게 확인되지 않습니다. 전환 근거를 보완할 구체적인 경험 서술이 필요합니다.

**riskCopy**

증거가 부족한 전환은 "하고 싶다"는 의지로만 설득되는 위험이 있습니다. 부족한 경험을 인정하되, 어떤 방식으로 보완하고 있는지를 함께 표현해야 합니다.

**resumeRewriteHint**

부족한 부분을 숨기기보다, 현재 시점에서 어떤 학습과 경험을 추가하고 있는지를 구체적으로 표현한다. 사이드 프로젝트, 스터디, 관련 역할 기여 경험도 근거가 될 수 있다.

**avoidWhen**

이력서에 전환 근거가 충분히 확인되는 경우. 이 modifier는 증거가 실질적으로 부족할 때만 적용한다.

---

## Modifier Combination Rule

1. Domain Modifier는 1개만 적용한다. 2개 이상 동시 적용 금지.
2. Seniority Modifier는 1개만 적용한다.
3. Evidence Modifier는 최대 2개까지 조합 가능하다. 단, output_only + metric_evidence 조합은 충돌이므로 금지.
4. Curated Case Override가 있으면 어떤 modifier도 발화하지 않는다.
5. modifier 적용 후 Archetype의 기본 lead 문구는 유지한다. modifier는 scoreReason과 liftOrLimit만 조정한다.

## Modifier Conflict Table

| modifier A | modifier B | 충돌 여부 | 이유 |
|---|---|---|---|
| output_only | metric_evidence | 충돌 | 산출물 중심 경험과 지표 개선 경험은 동시에 해당될 수 없음 |
| same_domain | different_domain | 충돌 | 도메인 관계는 하나만 성립함 |
| junior | senior | 충돌 | 연차 구간은 하나만 성립함 |
| weak_evidence | ownership_evidence | 충돌 | 오너십 증거가 있으면 weak_evidence 적용 대상이 아님 |

---

Version: 1.0.0
Created: 2026-05-01
