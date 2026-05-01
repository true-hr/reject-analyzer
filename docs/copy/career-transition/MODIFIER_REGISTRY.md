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

---

### b2c_consumer

- **modifierKey**: b2c_consumer
- **group**: domain
- **appliesTo**: customerType.scoreReason, industryContext.liftOrLimit

**Applies When**

목표 직무 도메인이 B2C 소비자 서비스이고, 지원자의 기존 경험이 B2B 또는 오프라인 중심인 경우.

**Adds**

소비자 행동 특성(빠른 이탈, 감성 구매, 바이럴 의존)에 대한 이해 필요성. B2C의 전환율·리텐션·NPS 지표 맥락.

**Avoids**

B2C 경험이 이미 있는 지원자에게 적용하지 않는다.

**Example Phrase**

B2C 서비스는 개별 소비자의 즉각적인 판단과 이탈이 지표에 빠르게 반영됩니다. B2B와 달리 감성적 요소와 UX 마찰이 전환율에 직결됩니다.

---

### offline_operation_heavy

- **modifierKey**: offline_operation_heavy
- **group**: domain
- **appliesTo**: jobStructure.scoreReason, industryContext.liftOrLimit

**Applies When**

목표 직무 도메인이 오프라인 운영 중심이거나, 현장 인력·물리적 프로세스가 핵심인 경우.

**Adds**

온라인 제품 지표 외에 현장 실행, 오프라인 운영 복잡성, 파트너 의존도에 대한 이해 필요성.

**Avoids**

순수 디지털 서비스 도메인에는 적용하지 않는다.

**Example Phrase**

이 서비스는 오프라인 현장 운영이 제품 경험과 직접 연결됩니다. 현장 변수와 디지털 지표를 함께 읽는 역량이 필요합니다.

---

### senior_without_ownership_risk

- **modifierKey**: senior_without_ownership_risk
- **group**: seniority
- **appliesTo**: responsibilityScope.scoreReason, roleCharacter.liftOrLimit
- **targetYears**: 7년 이상

**Applies When**

고연차임에도 불구하고 실질적인 전략적 오너십(제품 방향, 팀 의사결정, 수익 책임)이 확인되지 않는 경우.

**Adds**

"연차가 높다 = 오너십이 있다"는 가정 금지. 실질적인 판단 권한과 성과 책임 경험이 별도로 확인되어야 함.

**Avoids**

오너십 증거가 실제로 있는 고연차 지원자에게 적용하지 않는다.

**Example Phrase**

연차는 높지만 이력서에서 전략적 판단 책임이 명확하게 드러나지 않습니다. "어떤 결정을 주도했고 어떤 결과를 만들었는지"가 추가로 표현되어야 합니다.

---

### leadership_evidence_present

- **modifierKey**: leadership_evidence_present
- **group**: seniority
- **appliesTo**: responsibilityScope.lead, roleCharacter.scoreReason

**Applies When**

이력서에서 팀 리드, 조직 설계, 후배 육성, 의사결정 영향력이 확인된 경우.

**Adds**

리더십 경험이 목표 직무의 시니어 요건과 연결됨을 강화. 단순 실행자 이미지에서 판단자/설계자 이미지로 전환.

**Avoids**

리더십 경험이 실제로 없거나 형식적인 직함만 있는 경우.

**Example Phrase**

팀을 이끈 경험이 확인됩니다. 이 경험은 목표 직무에서 요구하는 조직 협업 설계와 의사결정 영향력과 직접 연결됩니다.

---

### customer_problem_evidence

- **modifierKey**: customer_problem_evidence
- **group**: evidence
- **appliesTo**: jobStructure.lead, jobStructure.scoreReason

**Applies When**

이력서에서 실제 고객 문제를 발견하고 이를 서비스/제품/정책 개선으로 연결한 경험이 확인된 경우.

**Adds**

고객 문제 정의 역량 강조. PM/서비스기획 역할의 핵심 연결 근거로 사용.

**Avoids**

고객 문의 처리 경험만 있고 문제 정의로 연결되지 않은 경우.

**Example Phrase**

고객이 겪는 문제를 직접 발견하고 개선 과제로 연결한 경험이 있습니다. 이 역량은 서비스 흐름 개선과 기능 정의에 바로 연결됩니다.

---

### strategy_evidence

- **modifierKey**: strategy_evidence
- **group**: evidence
- **appliesTo**: responsibilityScope.scoreReason, jobStructure.criteria

**Applies When**

이력서에서 전략 방향 제안, 시장 분석, 경쟁사 비교, 사업성 검토 경험이 확인된 경우.

**Adds**

전략적 사고 역량 강조. 사업기획/전략기획 타겟에서 강점 신호로 사용.

**Avoids**

전략이라는 단어만 쓰이고 실질적 내용이 없는 경우.

**Example Phrase**

전략 방향을 제안하거나 시장 분석을 주도한 경험이 확인됩니다. 목표 직무에서 요구하는 사업 판단력과 연결됩니다.

---

### roadmap_evidence

- **modifierKey**: roadmap_evidence
- **group**: evidence
- **appliesTo**: responsibilityScope.lead, jobStructure.scoreReason

**Applies When**

이력서에서 로드맵 수립, 기능 우선순위 결정, 릴리즈 계획 조율 경험이 확인된 경우.

**Adds**

우선순위 판단 역량 강조. PM/PO 타겟에서 결정적 강점 신호.

**Avoids**

로드맵을 공유받아 실행만 한 경우.

**Example Phrase**

기능 우선순위를 직접 결정하거나 로드맵 계획에 실질적으로 관여한 경험이 확인됩니다.

---

### process_improvement_evidence

- **modifierKey**: process_improvement_evidence
- **group**: evidence
- **appliesTo**: jobStructure.scoreReason, responsibilityScope.criteria

**Applies When**

이력서에서 기존 프로세스 분석, 병목 발견, 개선안 설계 및 적용 경험이 확인된 경우.

**Adds**

문제 정의와 개선 실행 역량. 운영/서비스기획/사업기획 타겟에서 강점 연결.

**Avoids**

단순 SOP 준수 경험만 있는 경우.

**Example Phrase**

기존 프로세스의 비효율을 발견하고 개선안을 설계해 적용한 경험이 있습니다. 구조적 문제 해결 역량의 근거가 됩니다.

---

## Group 4: Target Role Modifier

목표 직무 유형에 따라 axis overlay의 방향성을 조정한다. Archetype이 전환 구조를 정의한다면, Target Role Modifier는 도착지 역할의 핵심 기준을 명확히 한다.

---

### target_product_ownership

- **modifierKey**: target_product_ownership
- **group**: target_role
- **appliesTo**: jobStructure.criteria, responsibilityScope.scoreReason

**Applies When**

목표 직무가 PM/Product Manager이며, 제품 방향 결정·우선순위·출시 후 성과 책임이 명시된 경우.

**Adds**

"문제를 정의하고 성과를 확인하는" 오너십 판단 기준을 전면에 내세움.

**Avoids**

PO, 서비스기획, 사업기획 타겟과 혼용하지 않는다.

**Example Phrase**

PM은 무엇을 만들지 결정하고 출시 후 성과를 직접 확인하는 역할입니다. 이 흐름 전체를 주도한 경험이 있는지가 핵심 판단 기준입니다.

---

### target_service_flow

- **modifierKey**: target_service_flow
- **group**: target_role
- **appliesTo**: jobStructure.criteria, customerType.scoreReason

**Applies When**

목표 직무가 서비스기획이며, UX 흐름·정책·기능 정의·화면 설계가 핵심인 경우.

**Adds**

"사용자 흐름을 정의하고 정책과 화면으로 구현했는지"를 판단 기준으로 강화.

**Avoids**

PM, PO, 사업기획 타겟과 혼용하지 않는다.

**Example Phrase**

서비스기획은 사용자가 서비스 안에서 경험하는 흐름을 정의하고, 그것을 기능·정책·화면으로 구현하는 역할입니다.

---

### target_business_strategy

- **modifierKey**: target_business_strategy
- **group**: target_role
- **appliesTo**: jobStructure.criteria, responsibilityScope.scoreReason

**Applies When**

목표 직무가 사업기획/전략기획이며, 수익모델·시장 분석·사업성 판단이 핵심인 경우.

**Adds**

"숫자를 사업 관점으로 해석하고 전략 방향에 기여했는지"를 판단 기준으로 강화.

**Avoids**

PM, 서비스기획 타겟과 혼용하지 않는다.

**Example Phrase**

사업기획은 제품 개선이 아니라 수익·비용·시장·경쟁 관점에서 사업 방향을 정의하는 역할입니다.

---

### target_finance_planning

- **modifierKey**: target_finance_planning
- **group**: target_role
- **appliesTo**: jobStructure.criteria, industryContext.scoreReason

**Applies When**

목표 직무가 FP&A/경영기획/관리회계이며, 예산·실적 분석·의사결정 지원이 핵심인 경우.

**Adds**

"숫자가 사업에 미치는 의미를 해석하고 경영 판단에 제공했는지"를 판단 기준으로 강화.

**Avoids**

회계 결산, 세무, 재무회계 타겟과 혼용하지 않는다.

**Example Phrase**

FP&A와 경영기획은 장부를 관리하는 역할이 아니라, 재무 데이터를 사업 의사결정에 연결하는 역할입니다.

---

### target_people_partner

- **modifierKey**: target_people_partner
- **group**: target_role
- **appliesTo**: jobStructure.criteria, responsibilityScope.scoreReason

**Applies When**

목표 직무가 HRBP/조직개발이며, 현업 파트너링·조직 이슈 진단·인력 전략이 핵심인 경우.

**Adds**

"현업 조직의 문제를 HR 관점에서 해석하고 해결책을 제안했는지"를 판단 기준으로 강화.

**Avoids**

인사운영, 채용담당, 총무 타겟과 혼용하지 않는다.

**Example Phrase**

HRBP는 인사 제도를 운영하는 역할이 아니라, 현업 조직의 이슈를 파악하고 함께 해결책을 만드는 파트너 역할입니다.

---

### target_growth

- **modifierKey**: target_growth
- **group**: target_role
- **appliesTo**: jobStructure.criteria, customerType.scoreReason

**Applies When**

목표 직무가 그로스PM/Growth Hacker이며, 퍼널 최적화·사용자 획득·리텐션 개선이 핵심인 경우.

**Adds**

"퍼널의 어느 지점에서 어떤 실험으로 성장 지표를 개선했는지"를 판단 기준으로 강화.

**Avoids**

일반 PM, 브랜드마케팅, 콘텐츠 타겟과 혼용하지 않는다.

**Example Phrase**

그로스 역할은 광고 효율이 아니라 제품 안에서 사용자 획득·활성·유지를 데이터와 실험으로 개선하는 역할입니다.

---

### target_operations_excellence

- **modifierKey**: target_operations_excellence
- **group**: target_role
- **appliesTo**: jobStructure.criteria, responsibilityScope.scoreReason

**Applies When**

목표 직무가 운영기획/사업운영이며, 프로세스 효율화·KPI 관리·현장 조율이 핵심인 경우.

**Adds**

"반복 운영을 개선하고 효율 지표를 체계적으로 관리했는지"를 판단 기준으로 강화.

**Avoids**

서비스기획, 사업기획, PM 타겟과 혼용하지 않는다.

**Example Phrase**

운영기획은 서비스 안의 기능을 설계하는 역할이 아니라, 반복 프로세스를 최적화하고 운영 KPI를 관리하는 역할입니다.

---

## Modifier Combination Rule

1. Domain Modifier는 1개만 적용한다. 2개 이상 동시 적용 금지.
2. Seniority Modifier는 1개만 적용한다.
3. Evidence Modifier는 최대 2개까지 조합 가능하다. 단, output_only + metric_evidence 조합은 충돌이므로 금지.
4. Target Role Modifier는 1개만 적용한다. Archetype의 canonicalExample과 일치하는 타겟에만 사용.
5. Curated Case Override가 있으면 어떤 modifier도 발화하지 않는다.
6. modifier 적용 후 Archetype의 기본 lead 문구는 유지한다. modifier는 scoreReason과 liftOrLimit만 조정한다.

## Modifier Count Summary

| Group | 기존 | 신규 추가 | 합계 |
|---|---|---|---|
| Domain | 8 | 2 | 10 |
| Seniority | 3 | 2 | 5 |
| Evidence | 6 | 4 | 10 |
| Target Role | 0 | 7 | 7 |
| **합계** | **17** | **15** | **32** |

## Modifier Conflict Table

| modifier A | modifier B | 충돌 여부 | 이유 |
|---|---|---|---|
| output_only | metric_evidence | 충돌 | 산출물 중심 경험과 지표 개선 경험은 동시에 해당될 수 없음 |
| same_domain | different_domain | 충돌 | 도메인 관계는 하나만 성립함 |
| junior | senior | 충돌 | 연차 구간은 하나만 성립함 |
| weak_evidence | ownership_evidence | 충돌 | 오너십 증거가 있으면 weak_evidence 적용 대상이 아님 |
| senior_without_ownership_risk | leadership_evidence_present | 충돌 | 오너십 리스크와 리더십 증거는 동시에 적용될 수 없음 |

---

Version: 1.1.0
Updated: 2026-05-01
Changes: Domain 2개 신규, Seniority 2개 신규, Evidence 4개 신규, Group 4 (Target Role Modifier) 7개 신규 추가. 총 32개.
Created: 2026-05-01
