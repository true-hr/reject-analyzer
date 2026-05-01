# PASSMAP Career Transition Archetype Registry

## Purpose

전환 유형 템플릿(Archetype)을 등록하고 관리하는 SSOT다.

Archetype은 비슷한 전환 구조를 공유하는 케이스들에 동일한 해석 뼈대를 제공한다. Curated Case Override가 없는 경우 이 레지스트리에서 매칭된 archetype이 발화한다.

## Structure Rule

각 archetype은 아래 필드를 포함한다.

| 필드 | 설명 |
|---|---|
| archetypeId | 고유 식별자. SNAKE_UPPER_CASE |
| label | 사람이 읽는 이름 |
| description | 이 archetype이 커버하는 전환 구조 설명 |
| canonicalExample | 가장 대표적인 케이스 (currentJob → targetJob) |
| relatedCuratedCases | 이 archetype에서 파생된 curated case key 목록 |
| primaryAxes | overlay 기본 적용 축 (최대 2개) |
| axisOverlayTemplate | 각 axis별 슬롯 템플릿 골격 |
| doNotMixWith | 혼동하기 쉬운 다른 archetype |
| coreDifference | 이 archetype만의 핵심 전환 논리 |
| status | DRAFT / ACTIVE / DEPRECATED |

## Archetype Catalog

---

### 1. PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP

- **archetypeId**: PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP
- **label**: 기획 산출물 → 제품 오너십
- **canonicalExample**: 서비스기획 → PM/Product Manager
- **relatedCuratedCases**: EXPERIENCED_SERVICE_PLANNING_TO_PRODUCT_MANAGER_V2
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: ACTIVE

**description**

기획 산출물(IA, 화면설계, 기능정의서, 정책문서) 중심으로 경험을 쌓은 직무에서, 제품 문제를 직접 정의하고 우선순위와 출시 후 성과까지 책임지는 PM 역할로 전환하는 패턴.

**coreDifference**

"무엇을 만들지 설계했다"에서 "왜 이것을 만들어야 하는지 판단하고 성과를 확인한다"로 책임이 이동한다. 산출물 완성도 → 제품 판단력이 핵심 전환 기준이다.

**axisOverlayTemplate**

jobStructure:
- lead: 서비스기획 경험은 PM 직무와 기본 구조가 많이 겹칩니다. 사용자 흐름을 정리하고 기능을 정의하며 개발·디자인 조직과 협업해 서비스를 출시하는 경험은 PM 업무의 중요한 기반입니다.
- scoreReason: 다만 PM은 기획 산출물을 만드는 역할에서 한 단계 더 나아가, 제품이 풀어야 할 문제를 정하고 우선순위를 판단하며 출시 후 성과까지 확인하는 역할입니다.
- criteria: 이 축에서는 기획 경험이 PM의 핵심 역할인 문제 정의, 제품 방향 설정, 우선순위 판단, 기능 개선, 출시 후 성과 확인과 얼마나 직접 연결되는지를 봅니다.

responsibilityScope:
- lead: 기획자는 기능과 화면의 완성도를 높이는 역할을 많이 맡지만, PM은 제품의 방향, 우선순위, 성과까지 더 넓게 책임지는 경우가 많습니다.
- liftOrLimit: "담당 화면을 설계했다"보다 "문제 후보를 비교했고, 어떤 기준으로 우선순위를 정했고, 출시 이후 어떤 데이터를 보고 개선했는지"를 보여주면 PM 역할 확장성이 더 분명해집니다.

**doNotMixWith**: PLANNING_OUTPUT_TO_DELIVERY_OWNERSHIP (PO는 PM과 책임 구조가 다르다)

---

### 2. PLANNING_OUTPUT_TO_DELIVERY_OWNERSHIP

- **archetypeId**: PLANNING_OUTPUT_TO_DELIVERY_OWNERSHIP
- **label**: 기획 산출물 → 개발 실행 오너십
- **canonicalExample**: 서비스기획 → PO/Product Owner
- **relatedCuratedCases**: EXPERIENCED_SERVICE_PLANNING_TO_PO_V1
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: ACTIVE

**description**

기획 산출물 경험에서 백로그 관리, 스프린트 계획, 개발팀과의 요구사항 우선순위 조율 책임으로 전환하는 패턴. PM보다 개발 실행 사이클과 밀착도가 높다.

**coreDifference**

PM이 "무엇을 왜 만들지 결정한다"면, PO는 "어떤 순서로 만들지 개발팀과 함께 조율하고 스프린트 목표를 달성한다"에 가깝다. 기획 산출물 경험 중에서도 개발팀과의 협업, 요구사항 우선순위 조율, 릴리즈 관리 경험이 더 직접적으로 연결된다.

**axisOverlayTemplate**

jobStructure:
- lead: 서비스기획 경험은 PO 역할과 기본 구조가 겹칩니다. 기능을 정의하고 개발·디자인 조직과 협업해 화면을 완성하는 경험은 PO 업무의 중요한 기반입니다.
- scoreReason: 다만 PO는 기획 산출물을 전달하는 역할에서 한 단계 더 나아가, 백로그를 관리하고 스프린트 우선순위를 결정하며 개발팀의 실행 사이클을 이끄는 역할입니다.
- criteria: 이 축에서는 기획 경험 중에서 개발팀과의 요구사항 협의, 우선순위 조율, 릴리즈 관리 경험이 얼마나 포함되어 있는지를 봅니다.

responsibilityScope:
- lead: 기획자는 기능 설계 완성도에 집중하는 경우가 많지만, PO는 개발 실행 사이클 전체의 속도와 품질에 책임지는 경우가 많습니다.
- liftOrLimit: "기능 정의서를 작성했다"보다 "개발팀과 함께 스프린트 목표를 정하고, 우선순위 충돌을 조율했으며, 릴리즈 후 품질을 확인했다"는 식으로 표현해야 PO 역할 연결이 강해집니다.

**doNotMixWith**: PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP

---

### 3. OPERATIONS_TO_PRODUCT_IMPROVEMENT

- **archetypeId**: OPERATIONS_TO_PRODUCT_IMPROVEMENT
- **label**: 운영 문제 → 제품 개선 전환
- **canonicalExample**: 운영기획 → PM/Product Manager
- **relatedCuratedCases**: EXPERIENCED_OPERATIONS_PLANNING_TO_PRODUCT_MANAGER_V1
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: ACTIVE

**description**

반복 운영 이슈와 프로세스 개선 경험에서, 그 문제를 제품 기능·정책·자동화 개선으로 전환하는 PM 역할로 이동하는 패턴.

**coreDifference**

운영 문제를 "직접 처리했다"에서 "제품이 해결하게 만들었다"로 책임이 이동한다. 운영 경험은 PM의 문제 발견 역량과 연결되지만, 제품화·우선순위·실행 이끌기 경험이 추가로 확인되어야 한다.

**axisOverlayTemplate**

jobStructure:
- lead: 운영기획 경험은 PM의 문제 발견 업무와 연결될 수 있습니다. 반복되는 운영 이슈와 고객 불편을 가까이에서 봤다는 점은 제품 개선 과제를 찾는 데 강점이 됩니다.
- scoreReason: 다만 PM은 운영 문제를 직접 처리하는 역할이 아니라, 그 문제를 제품 기능·정책·자동화 개선으로 바꾸는 역할입니다. 기존 경험이 운영 관리에만 머물렀다면 PM 적합도는 제한적으로 해석될 수 있습니다.
- criteria: 이 축에서는 운영기획 경험이 PM의 핵심 업무인 문제정의, 개선 과제 도출, 우선순위 판단, 기능 개선, 성과 확인과 얼마나 연결되는지를 봅니다.

responsibilityScope:
- lead: 운영기획은 프로세스 개선과 실행 관리에 강점이 있지만, PM은 그 문제를 제품 개선으로 전환하는 책임이 더 중요합니다.
- liftOrLimit: "운영 프로세스를 개선했다"보다 "운영 병목을 제품 요구사항으로 정의했고, 자동화 또는 기능 개선으로 연결했다"는 식으로 쓰는 것이 좋습니다.

**doNotMixWith**: ANALYTICS_TO_PRODUCT_DECISION, CX_TO_SERVICE_DESIGN

---

### 4. ANALYTICS_TO_PRODUCT_DECISION

- **archetypeId**: ANALYTICS_TO_PRODUCT_DECISION
- **label**: 분석 역량 → 제품 의사결정
- **canonicalExample**: 데이터분석 → PM/Product Manager
- **relatedCuratedCases**: EXPERIENCED_DATA_ANALYST_TO_PRODUCT_MANAGER_V1
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: ACTIVE

**description**

데이터 분석과 리포팅 경험에서, 분석 결과를 바탕으로 제품 문제를 정의하고 실행을 이끄는 PM 역할로 전환하는 패턴.

**coreDifference**

"분석 결과를 전달했다"에서 "분석을 바탕으로 제품 문제를 정의하고 우선순위를 결정하며 실행을 이끈다"로 책임이 이동한다. 데이터 해석 강점은 PM의 가설검증·우선순위 판단 역량과 직결되지만, 분석 → 실행 전환 경험이 핵심 판단 기준이다.

**axisOverlayTemplate**

jobStructure:
- lead: 데이터분석 경험은 PM의 데이터 기반 문제정의 업무와 강하게 연결될 수 있습니다. 사용자 행동과 지표를 읽을 수 있다는 점은 PM 전환에서 중요한 강점입니다.
- scoreReason: 다만 PM은 분석 결과를 전달하는 역할이 아니라, 분석을 바탕으로 제품 문제를 정의하고 우선순위를 결정하며 실행을 이끄는 역할입니다. 기존 경험이 리포트와 대시보드 제공 중심이라면 PM 적합도는 제한적으로 해석될 수 있습니다.
- criteria: 이 축에서는 데이터분석 경험이 PM의 핵심 업무인 문제정의, 지표 해석, 가설검증, 우선순위 판단, 제품 개선 실행과 얼마나 연결되는지를 봅니다.

responsibilityScope:
- lead: 데이터분석은 문제를 발견하는 데 강점이 있지만, PM은 그 문제를 해결 과제로 정하고 실행까지 이끄는 책임이 더 강합니다.
- liftOrLimit: "대시보드를 만들었다"보다 "이 지표를 통해 문제를 정의했고, 개선 우선순위를 바꾸었고, 제품 실험이나 기능 개선으로 이어졌다"는 흐름으로 써야 합니다.

**doNotMixWith**: PERFORMANCE_MARKETING_TO_GROWTH_PRODUCT, OPERATIONS_TO_PRODUCT_IMPROVEMENT

---

### 5. PERFORMANCE_MARKETING_TO_GROWTH_PRODUCT

- **archetypeId**: PERFORMANCE_MARKETING_TO_GROWTH_PRODUCT
- **label**: 퍼포먼스마케팅 → 그로스/제품 성장
- **canonicalExample**: 퍼포먼스마케팅 → PM/Product Manager (Growth)
- **relatedCuratedCases**: EXPERIENCED_PERFORMANCE_MARKETING_TO_PRODUCT_MANAGER_V1
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: ACTIVE

**description**

퍼널·전환·실험 경험을 제품 성장 문제로 확장하는 패턴. 그로스 PM, Growth Product Manager와 연결성이 높다. 광고 운영 효율 최적화에 머무르지 않고, 제품 안의 전환 흐름과 사용자 경험을 개선하는 역할로 이동한다.

**coreDifference**

"ROAS를 개선했다"에서 "퍼널 병목을 발견하고, 제품 경험 개선 가설을 세우고, 실험 또는 기능 개선으로 전환율을 높였다"로 책임이 이동한다. 매체 운영 중심 경험과 제품 퍼널 개선 경험을 구분하는 것이 이 archetype의 핵심 판단이다.

**axisOverlayTemplate**

jobStructure:
- lead: 퍼포먼스마케팅 경험은 그로스 PM 또는 제품 성장 PM과 연결성이 있습니다. 유입, 전환, 퍼널, 실험을 다뤄본 경험은 제품 성장 문제를 이해하는 데 도움이 됩니다.
- scoreReason: 다만 PM은 광고 성과를 최적화하는 역할이 아니라, 제품 안에서 사용자가 왜 전환하지 않고 어디서 이탈하는지 정의하고 개선하는 역할입니다. 기존 경험이 매체 운영과 광고 효율 개선에만 머물렀다면 PM 적합도는 제한적으로 해석될 수 있습니다.
- criteria: 이 축에서는 퍼포먼스마케팅 경험이 PM의 핵심 업무인 고객 문제정의, 퍼널 개선, 실험 설계, 제품 전환율 개선, 성장 전략과 얼마나 연결되는지를 봅니다.

responsibilityScope:
- lead: 퍼포먼스마케팅은 성장 지표를 개선하는 경험이 있지만, PM은 그 지표를 제품 경험과 기능 개선으로 연결하는 책임이 더 강합니다.
- liftOrLimit: "캠페인을 운영했다"보다 "전환 퍼널 문제를 발견하고 제품팀과 개선 실험을 설계했으며, 결과를 기준으로 다음 우선순위를 조정했다"는 식으로 표현해야 합니다.

**doNotMixWith**: ANALYTICS_TO_PRODUCT_DECISION, PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP

---

### 6. CX_TO_SERVICE_DESIGN

- **archetypeId**: CX_TO_SERVICE_DESIGN
- **label**: CX/리서처 → 서비스 경험 설계
- **canonicalExample**: UX리서처/CX디자이너 → 서비스디자이너
- **relatedCuratedCases**: (TODO — 서비스디자인 전용 case)
- **primaryAxes**: jobStructure, customerType
- **status**: DRAFT

**description**

고객 여정 리서치, 인터뷰, 사용성 테스트, 페르소나 설계 경험에서 서비스 경험 설계(Service Design) 역할로 전환하는 패턴. 정책·화면·기능 요구사항 중심의 서비스기획이 아니라, 리서치·여정·사용성·경험 아키텍처 중심의 설계 역할이다.

**coreDifference**

"고객 인터뷰와 여정을 분석했다"에서 "그 분석을 서비스 경험 아키텍처와 터치포인트 설계로 연결한다"로 책임이 이동한다. 기능 정의와 정책 문서 작성은 이 archetype의 핵심 산출물이 아니다.

**Not Covers**

서비스기획 전환에는 사용하지 않는다. CS/CX 출신이 VOC·반복문의·온보딩 경험을 기반으로 서비스기획으로 전환하는 경우는 CUSTOMER_SUPPORT_TO_SERVICE_PLANNING 또는 CUSTOMER_SUCCESS_TO_SERVICE_PLANNING으로 처리한다.

**axisOverlayTemplate**

jobStructure:
- lead: 리서치와 고객 여정 분석 경험은 서비스 경험 설계의 핵심 기반입니다. 사용자가 서비스 안에서 어떻게 이동하고 어디서 막히는지를 체계적으로 분석해온 역량은 서비스디자이너에게 직접적으로 연결됩니다.
- scoreReason: 다만 서비스디자인은 리서치 결과를 경험 아키텍처·터치포인트·서비스 청사진으로 구조화하는 역할입니다. 분석 경험이 설계 산출물로 연결된 경험이 있는지가 핵심 판단 기준입니다.
- criteria: 이 축에서는 리서치 경험이 서비스 청사진, 여정 지도, 경험 설계안 등 설계 산출물로 얼마나 연결되었는지를 봅니다.

customerType:
- lead: 고객 여정과 접점을 직접 다룬 경험은 서비스 경험 설계에서 중요한 강점입니다.
- liftOrLimit: "인터뷰를 진행했다"보다 "인터뷰 결과를 여정 지도나 서비스 청사진으로 구조화해 설계 방향에 반영했다"는 식으로 표현해야 서비스디자인 역량으로 연결됩니다.

**doNotMixWith**: CUSTOMER_SUPPORT_TO_SERVICE_PLANNING, CUSTOMER_SUCCESS_TO_SERVICE_PLANNING, OPERATIONS_TO_PRODUCT_IMPROVEMENT

---

### 7. ACCOUNTING_TO_BUSINESS_FINANCE

- **archetypeId**: ACCOUNTING_TO_BUSINESS_FINANCE
- **label**: 회계 결산 → 사업 재무 분석
- **canonicalExample**: 회계 → FP&A
- **relatedCuratedCases**: EXPERIENCED_ACCOUNTING_TO_FPA_V1 (TODO)
- **primaryAxes**: jobStructure, industryContext
- **status**: DRAFT

**description**

결산·비용 관리·세무 경험에서, 예산 편성·실적 분석·사업부 의사결정 지원으로 전환하는 패턴. 정확성과 규정 준수 중심에서 사업 판단 지원 중심으로 관점이 이동한다.

**coreDifference**

"장부를 정확하게 관리했다"에서 "숫자가 사업에 미치는 의미를 해석하고, 의사결정자가 더 나은 선택을 하도록 돕는다"로 책임이 이동한다. 회계 지식은 FP&A의 기반이 되지만, 분석적 사고와 비즈니스 감각이 추가로 요구된다.

**axisOverlayTemplate**

jobStructure:
- lead: 회계 경험은 FP&A의 재무 분석 역량과 기본 구조가 겹칩니다. 결산, 비용 분석, 원가 파악 경험은 예산 수립과 실적 분석의 중요한 기반이 됩니다.
- scoreReason: 다만 FP&A는 장부를 정확하게 관리하는 역할이 아니라, 재무 데이터를 사업 성과와 연결해 의사결정자에게 인사이트를 제공하는 역할입니다. 기존 경험이 규정 준수와 마감 처리 중심이었다면 FP&A 적합도는 분석·사업 이해 경험에 따라 달라집니다.
- criteria: 이 축에서는 회계 경험 중 사업부 비용 구조 분석, 예산 대비 실적 검토, 의사결정 지원 보고서 작성 경험이 얼마나 포함되어 있는지를 봅니다.

industryContext:
- lead: 회계 경험을 쌓은 산업의 비용 구조와 수익모델을 이해하고 있다는 점은 동일 산업 FP&A에서 강점이 됩니다.
- liftOrLimit: 결산 처리 경험만 쓰기보다, "이 산업의 비용 드라이버가 무엇인지 파악했고, 어떤 지표를 관리하면 사업 성과가 달라지는지 이해하고 있다"는 방향으로 표현해야 합니다.

**doNotMixWith**: PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP

---

### 8. SALES_TO_BUSINESS_DEVELOPMENT

- **archetypeId**: SALES_TO_BUSINESS_DEVELOPMENT
- **label**: 영업 딜 → 사업 개발
- **canonicalExample**: B2B영업 → 사업개발/BD
- **relatedCuratedCases**: EXPERIENCED_B2B_SALES_TO_BUSINESS_DEVELOPMENT_V1 (TODO)
- **primaryAxes**: jobStructure, customerType
- **status**: DRAFT

**description**

고객·시장 접점과 딜 성사 경험에서, 파트너십·신규사업·시장확장 전략을 기획하고 실행하는 역할로 전환하는 패턴.

**coreDifference**

"고객에게 제품을 팔았다"에서 "시장을 분석하고, 파트너십 구조를 설계하며, 회사의 성장 기회를 만든다"로 책임이 이동한다. 영업 경험은 고객과 시장 감각을 제공하지만, 전략 기획과 구조화 역량이 추가로 요구된다.

**axisOverlayTemplate**

jobStructure:
- lead: B2B영업 경험은 사업개발의 시장 접점 역량과 연결됩니다. 고객 니즈를 파악하고 딜을 성사시킨 경험은 파트너십 발굴과 신규사업 기획에 유용한 기반이 됩니다.
- scoreReason: 다만 사업개발은 개별 딜을 성사시키는 역할이 아니라, 시장 기회를 분석하고 파트너십 구조를 설계하며 회사 차원의 성장 전략을 만드는 역할입니다. 기존 경험이 할당 목표 달성 중심이었다면 전략 기획 역량이 추가로 확인되어야 합니다.
- criteria: 이 축에서는 영업 경험 중 시장 분석, 신규 파트너 발굴, 제안 구조화, 계약 조건 협상, 사업 기회 정의 경험이 얼마나 포함되어 있는지를 봅니다.

customerType:
- lead: B2B영업 출신은 고객사의 의사결정 구조와 구매 요인을 잘 이해하고 있습니다. 이 이해는 파트너십 상대방의 니즈를 빠르게 파악하는 데 강점이 됩니다.
- liftOrLimit: 매출 달성 경험만 쓰기보다, "이 시장에서 어떤 고객이 왜 구매하고, 어떤 장벽이 있는지를 파악했으며, 그 이해를 바탕으로 어떤 제안 구조를 설계했는지"를 보여주면 사업개발 역할과 연결이 강해집니다.

**doNotMixWith**: PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP, ACCOUNTING_TO_BUSINESS_FINANCE

---

---

### 9. PLANNING_OUTPUT_TO_BUSINESS_STRATEGY

- **archetypeId**: PLANNING_OUTPUT_TO_BUSINESS_STRATEGY
- **label**: 기획 산출물 → 사업 전략
- **canonicalExample**: 서비스기획 → 사업기획
- **relatedCuratedCases**: EXPERIENCED_SERVICE_PLANNING_TO_BUSINESS_PLANNING_V1
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: ACTIVE

**Covers**

서비스/기능 단위 기획 경험에서 시장·수익·사업성과 관점의 전략기획 역할로 이동하는 전환.

**Not Covers**

PM 전환(PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP)과 혼용 금지. 사업기획은 제품 개선이 아니라 수익모델·사업구조·성장전략이 핵심.

**Core Translation**

"기능을 기획했다" → "이 기능이 수익/비용/시장에 어떤 영향을 미치는지 판단했다"

**Typical Strength**

서비스 내부 구조와 고객 흐름 이해. 개발/디자인 협업 경험.

**Typical Risk**

숫자와 시장 논리 경험 부재. 사업성 판단, 수익모델 설계, 경쟁사 비교 경험이 얕을 수 있음.

**Resume Rewrite Direction**

"화면을 설계했다" → "이 기능이 어떤 사업 목표를 달성했고 수치로 어떤 결과가 나왔는지" 로 연결.

**Candidate Curated Cases**

서비스기획→사업기획, 콘텐츠기획→사업기획

**doNotMixWith**: PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP

---

### 10. OPERATIONS_TO_SERVICE_PLANNING

- **archetypeId**: OPERATIONS_TO_SERVICE_PLANNING
- **label**: 운영 실행 → 서비스 흐름 설계
- **canonicalExample**: 운영기획 → 서비스기획
- **relatedCuratedCases**: (TODO)
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: DRAFT

**Covers**

반복 운영 이슈와 고객 접점 경험에서, 그 이슈를 서비스 흐름·기능·정책 개선으로 설계하는 역할로 전환.

**Not Covers**

PM 전환(OPERATIONS_TO_PRODUCT_IMPROVEMENT)과 다름. 서비스기획은 제품 오너십보다 UX흐름·정책 설계에 가까움.

**Core Translation**

"운영 문제를 처리했다" → "서비스 흐름에서 문제 지점을 찾아 기능·정책·화면 개선으로 연결했다"

**Typical Strength**

현장 고객 이슈 이해. 운영 예외 케이스와 엣지케이스 감각.

**Typical Risk**

화면 설계, IA 구성, 기능 정의 경험 부재. 기획 산출물 작성 역량 증명이 필요.

**Resume Rewrite Direction**

"운영 SOP를 만들었다" → "이 SOP의 비효율 원인을 찾았고, 서비스 흐름 개선으로 어떻게 연결했는지"로 재작성.

**Candidate Curated Cases**

운영기획→서비스기획, CS운영→서비스기획

**doNotMixWith**: OPERATIONS_TO_PRODUCT_IMPROVEMENT, CX_TO_SERVICE_DESIGN

---

### 11. OPERATIONS_TO_BUSINESS_PLANNING

- **archetypeId**: OPERATIONS_TO_BUSINESS_PLANNING
- **label**: 운영 실행 → 사업 전략 지원
- **canonicalExample**: 운영기획 → 사업기획
- **relatedCuratedCases**: (TODO)
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: DRAFT

**Covers**

운영 효율화·프로세스 개선 경험에서 사업 성과 분석·전략 지원 역할로 확장하는 전환.

**Not Covers**

PM 전환, 서비스기획 전환과 혼용 금지. 사업기획은 수익·시장·성장 논리 중심.

**Core Translation**

"운영 지표를 관리했다" → "이 지표가 사업 성과에 어떤 의미인지 분석하고 전략 의사결정에 연결했다"

**Typical Strength**

내부 데이터와 프로세스 이해. KPI 관리 경험.

**Typical Risk**

시장 분석, 수익모델 설계, 외부 경쟁 분석 경험이 약할 수 있음.

**Resume Rewrite Direction**

"KPI를 관리했다" → "이 KPI 변화가 사업 의사결정에 어떻게 사용되었는지"로 연결.

**Candidate Curated Cases**

운영기획→사업기획, 물류운영→사업기획

**doNotMixWith**: OPERATIONS_TO_SERVICE_PLANNING, PLANNING_OUTPUT_TO_BUSINESS_STRATEGY

---

### 12. ANALYTICS_TO_BUSINESS_INSIGHT

- **archetypeId**: ANALYTICS_TO_BUSINESS_INSIGHT
- **label**: 분석 역량 → 사업 인사이트
- **canonicalExample**: 데이터분석 → 사업기획/전략기획
- **relatedCuratedCases**: (TODO)
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: DRAFT

**Covers**

데이터 분석·리포팅 경험에서 사업 의사결정 지원, 전략기획, 경영기획 역할로 전환하는 패턴.

**Not Covers**

PM 전환(ANALYTICS_TO_PRODUCT_DECISION)과 다름. 사업기획/전략기획은 제품 개선이 아니라 수익·시장·성장 판단이 목적.

**Core Translation**

"분석 결과를 보고했다" → "이 분석이 어떤 사업 의사결정을 바꿨고 어떤 전략 방향을 만들었는지"

**Typical Strength**

데이터 해석, 시각화, 정량적 근거 제시 역량. 의사결정자 설득 경험.

**Typical Risk**

시장 전략, 사업 구조 설계, P&L 관리 경험 부재.

**Resume Rewrite Direction**

"대시보드를 만들었다" → "이 지표 분석이 어떤 전략 변화를 이끌었는지"로 연결.

**Candidate Curated Cases**

데이터분석→전략기획, BI분석→사업기획

**doNotMixWith**: ANALYTICS_TO_PRODUCT_DECISION

---

### 13. PERFORMANCE_MARKETING_TO_SERVICE_PLANNING

- **archetypeId**: PERFORMANCE_MARKETING_TO_SERVICE_PLANNING
- **label**: 퍼포먼스마케팅 → 서비스 흐름 설계
- **canonicalExample**: 퍼포먼스마케팅 → 서비스기획
- **relatedCuratedCases**: EXPERIENCED_PERFORMANCE_MARKETING_TO_SERVICE_PLANNING_V1
- **primaryAxes**: jobStructure, customerType
- **status**: ACTIVE

**Covers**

광고 퍼널·전환 최적화 경험에서 서비스 UX흐름·정책·기능 개선 설계 역할로 전환.

**Not Covers**

PM 전환(PERFORMANCE_MARKETING_TO_GROWTH_PRODUCT)과 언어 분리 필수. 서비스기획은 제품 성장 오너십보다 UX/정책/기능 설계가 핵심.

**Core Translation**

"전환율을 높이는 광고를 운영했다" → "사용자가 서비스 안에서 어디서 막히고 어떤 흐름 개선이 필요한지 설계했다"

**Typical Strength**

사용자 행동 데이터와 퍼널 이해. A/B 실험 감각.

**Typical Risk**

기획 산출물(IA, 화면설계, 정책문서) 작성 경험 부재.

**Resume Rewrite Direction**

"광고를 최적화했다" → "서비스 내 전환 흐름의 어떤 지점을 개선했고 어떤 기획안을 작성했는지"로 연결.

**Candidate Curated Cases**

퍼포먼스마케팅→서비스기획, CRM마케팅→서비스기획

**doNotMixWith**: PERFORMANCE_MARKETING_TO_GROWTH_PRODUCT

---

### 14. SALES_TO_ACCOUNT_MANAGEMENT

- **archetypeId**: SALES_TO_ACCOUNT_MANAGEMENT
- **label**: 신규 영업 → 고객사 관리
- **canonicalExample**: B2B영업 → 키어카운트/AM
- **relatedCuratedCases**: (TODO)
- **primaryAxes**: jobStructure, customerType
- **status**: DRAFT

**Covers**

신규 딜 중심 영업 경험에서 기존 고객 관계 유지·갱신·업셀 중심으로 이동하는 전환.

**Not Covers**

사업개발(SALES_TO_BUSINESS_DEVELOPMENT)과 다름. AM은 시장 확장이 아니라 고객 관계 심화와 갱신율 중심.

**Core Translation**

"새 고객을 찾았다" → "고객이 계속 머물고 더 많이 쓰도록 관계를 설계했다"

**Typical Strength**

고객 니즈 파악, 신뢰 형성, 계약 협상 경험.

**Typical Risk**

장기 관계 관리, 갱신율 분석, 온보딩 설계 경험 부재.

**Resume Rewrite Direction**

"신규 계약을 체결했다" → "기존 고객의 재계약률을 어떻게 유지했고 어떤 방식으로 관계를 관리했는지"로 보완.

**Candidate Curated Cases**

B2B영업→AM, 채널영업→KAM

**doNotMixWith**: SALES_TO_BUSINESS_DEVELOPMENT

---

### 15. SALES_ADMIN_TO_BUSINESS_PLANNING

- **archetypeId**: SALES_ADMIN_TO_BUSINESS_PLANNING
- **label**: 영업 지원/관리 → 사업기획
- **canonicalExample**: 영업관리 → 사업기획
- **relatedCuratedCases**: (TODO)
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: DRAFT

**Covers**

영업 데이터 관리, 실적 분석, 지원 업무 경험에서 사업 성과 분석·기획 역할로 전환.

**Not Covers**

직접 영업(SALES_TO_BUSINESS_DEVELOPMENT)과 다름. 영업관리 출신은 딜 경험이 아니라 데이터와 프로세스 경험이 핵심.

**Core Translation**

"영업 실적 데이터를 집계했다" → "이 데이터를 해석해 사업 의사결정에 어떤 인사이트를 제공했는지"

**Typical Strength**

영업 지표 이해, 보고서 작성, 내부 프로세스 파악.

**Typical Risk**

시장 전략, 사업 기회 발굴, 수익모델 설계 경험 부재.

**Resume Rewrite Direction**

"실적 보고서를 작성했다" → "이 보고서가 어떤 전략 변화를 이끌었는지"로 연결.

**Candidate Curated Cases**

영업관리→사업기획, 영업지원→전략기획

**doNotMixWith**: SALES_TO_BUSINESS_DEVELOPMENT, ANALYTICS_TO_BUSINESS_INSIGHT

---

### 16. ACCOUNTING_TO_MANAGEMENT_PLANNING

- **archetypeId**: ACCOUNTING_TO_MANAGEMENT_PLANNING
- **label**: 회계 결산 → 경영기획
- **canonicalExample**: 회계 → 경영기획/관리회계
- **relatedCuratedCases**: (TODO)
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: DRAFT

**Covers**

결산·비용 관리 경험에서 예산 편성, 경영 성과 분석, 경영진 의사결정 지원으로 전환.

**Not Covers**

FP&A(ACCOUNTING_TO_BUSINESS_FINANCE)와 다름. 경영기획은 사업부 단위 분석보다 전사 경영 관리와 경영진 보고가 중심.

**Core Translation**

"장부를 정확히 기록했다" → "전사 비용 구조와 수익성을 해석해 경영 판단에 필요한 정보를 제공했다"

**Typical Strength**

재무 데이터 정확성, 비용 구조 파악, 규정 준수 경험.

**Typical Risk**

전략적 해석, 의사결정 지원 보고서 작성, 사업부 이해 경험 부재.

**Resume Rewrite Direction**

"결산을 완료했다" → "이 결산 데이터가 경영 판단에 어떻게 활용되었는지"로 방향 전환.

**Candidate Curated Cases**

회계→경영기획, 원가회계→관리회계

**doNotMixWith**: ACCOUNTING_TO_BUSINESS_FINANCE

---

### 17. HR_OPERATIONS_TO_HRBP

- **archetypeId**: HR_OPERATIONS_TO_HRBP
- **label**: 인사 운영 → 현업 파트너링
- **canonicalExample**: 인사운영 → HRBP
- **relatedCuratedCases**: EXPERIENCED_HR_OPERATIONS_TO_HRBP_V1 (TODO)
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: DRAFT

**Covers**

인사제도 운영, 노무, 급여, 평가 관리 경험에서 현업 조직과 파트너링하는 HRBP 역할로 전환.

**Not Covers**

채용(RECRUITING_TO_HRBP)과 다름. 인사운영 출신은 제도 경험이 강점이지만 현업 협업·조직 진단 경험이 추가로 요구됨.

**Core Translation**

"인사 제도를 운영했다" → "현업 조직의 인력 이슈를 진단하고 제도 설계로 해결했다"

**Typical Strength**

노무·평가·보상 제도 이해. 내부 규정과 프로세스 정확성.

**Typical Risk**

현업 니즈 파악, 조직 문화 진단, 경영진 설득 경험 부재.

**Resume Rewrite Direction**

"인사 제도를 관리했다" → "어떤 현업 이슈를 발견했고 제도 변경으로 어떻게 해결했는지"로 연결.

**Candidate Curated Cases**

인사운영→HRBP, 인사총무→HRBP

**doNotMixWith**: RECRUITING_TO_HRBP

---

### 18. RECRUITING_TO_HRBP

- **archetypeId**: RECRUITING_TO_HRBP
- **label**: 채용 → 현업 파트너링
- **canonicalExample**: 채용담당 → HRBP
- **relatedCuratedCases**: (TODO)
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: DRAFT

**Covers**

채용 프로세스 관리, JD 작성, 후보자 평가 경험에서 조직 이슈 진단과 인력 전략 파트너링으로 전환.

**Not Covers**

인사운영(HR_OPERATIONS_TO_HRBP)과 다름. 채용 출신은 제도 경험 없이 사람 평가 경험이 강점.

**Core Translation**

"좋은 사람을 뽑았다" → "이 조직에 어떤 역량이 필요한지 현업과 함께 정의했다"

**Typical Strength**

조직 역량 이해, 사람 평가, 현업 소통 경험.

**Typical Risk**

인사 제도·노무·보상 이해 부재. HRBP의 제도적 업무 경험이 약할 수 있음.

**Resume Rewrite Direction**

"채용 목표를 달성했다" → "이 포지션을 왜 뽑았고 어떤 역량 정의에서 출발했는지"로 연결.

**Candidate Curated Cases**

채용담당→HRBP, TA→HRBP

**doNotMixWith**: HR_OPERATIONS_TO_HRBP

---

### 19. PROCUREMENT_TO_BUSINESS_PLANNING

- **archetypeId**: PROCUREMENT_TO_BUSINESS_PLANNING
- **label**: 구매/조달 → 사업기획
- **canonicalExample**: 구매담당 → 사업기획
- **relatedCuratedCases**: (TODO)
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: DRAFT

**Covers**

공급업체 관리, 단가 협상, 발주 관리 경험에서 사업 성과 분석·기획 역할로 전환.

**Not Covers**

SCM(공급망 전략)으로의 전환과 다름. 사업기획은 공급망이 아니라 수익·시장·전략이 목적.

**Core Translation**

"원가를 낮췄다" → "이 비용 구조가 사업 수익성에 어떤 의미인지 분석하고 전략 의사결정에 연결했다"

**Typical Strength**

협상, 수치 기반 판단, 공급망 비용 구조 이해.

**Typical Risk**

시장 분석, 수익모델, 성장 전략 경험 부재.

**Resume Rewrite Direction**

"협상으로 단가를 낮췄다" → "이 원가 개선이 사업 수익성에 어떤 영향을 미쳤는지"로 연결.

**Candidate Curated Cases**

구매→사업기획, 전략소싱→사업개발

**doNotMixWith**: SALES_TO_BUSINESS_DEVELOPMENT, ANALYTICS_TO_BUSINESS_INSIGHT

---

### 20. ENGINEERING_TO_PRODUCT_PLANNING

- **archetypeId**: ENGINEERING_TO_PRODUCT_PLANNING
- **label**: 개발 실행 → 제품/서비스 기획
- **canonicalExample**: 개발자 → PM / 서비스기획
- **relatedCuratedCases**: (TODO)
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: DRAFT

**Covers**

개발 구현 경험에서 제품 문제 정의, 우선순위 판단, 비개발 조직과의 협업 중심 역할로 전환.

**Not Covers**

기술PM(Tech PM)과 일반 PM을 혼용하면 안 됨. 개발 출신이라도 사용자 문제 정의·비즈니스 판단 경험이 별도로 요구됨.

**Core Translation**

"기능을 구현했다" → "어떤 기능을 왜 만들어야 하는지 판단하고 비개발 조직을 설득했다"

**Typical Strength**

기술 이해, 개발팀 협업, 구현 가능성 판단.

**Typical Risk**

사용자 리서치, 비즈니스 지표 해석, 기획 문서 작성 경험 부재.

**Resume Rewrite Direction**

"기능을 개발했다" → "이 기능의 방향 결정에 어떻게 관여했고 어떤 사용자 문제를 해결했는지"로 전환.

**Candidate Curated Cases**

개발자→PM, 풀스택개발자→서비스기획

**doNotMixWith**: PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP

---

### 21. TECH_SUPPORT_TO_SERVICE_PLANNING

- **archetypeId**: TECH_SUPPORT_TO_SERVICE_PLANNING
- **label**: 기술 지원 → 서비스 흐름 설계
- **canonicalExample**: 기술지원/SI컨설턴트 → 서비스기획
- **relatedCuratedCases**: (TODO)
- **primaryAxes**: jobStructure, customerType
- **status**: DRAFT

**Covers**

고객 기술 이슈 해결과 시스템 운영 지원 경험에서 서비스 흐름 설계, 기능 개선 기획으로 전환.

**Not Covers**

ENGINEERING_TO_PRODUCT_PLANNING과 다름. 기술지원 출신은 직접 개발 경험보다 현장 문제 해결과 고객 접점 경험이 강점.

**Core Translation**

"고객 기술 문제를 해결했다" → "반복되는 기술 이슈의 원인을 서비스 구조 개선으로 연결했다"

**Typical Strength**

현장 고객 이슈 이해, 시스템 내부 흐름 파악, 문제 재현 능력.

**Typical Risk**

기획 산출물 작성, UI/UX 설계, 우선순위 판단 경험 부재.

**Resume Rewrite Direction**

"이슈를 해결했다" → "이 이슈가 반복된 이유를 분석했고 어떤 서비스 개선안으로 연결했는지"로 전환.

**Candidate Curated Cases**

기술지원→서비스기획, SI컨설턴트→서비스기획

**doNotMixWith**: ENGINEERING_TO_PRODUCT_PLANNING, CX_TO_SERVICE_DESIGN

---

### 22. DESIGN_TO_PRODUCT_PLANNING

- **archetypeId**: DESIGN_TO_PRODUCT_PLANNING
- **label**: 디자인 실행 → 제품/서비스 기획
- **canonicalExample**: UX디자이너 → 서비스기획 / PM
- **relatedCuratedCases**: (TODO)
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: DRAFT

**Covers**

UX/UI 디자인 경험에서 서비스 흐름 정의, 기능 기획, 제품 방향 판단 역할로 전환.

**Not Covers**

서비스디자이너→서비스기획 혼용 주의. 디자인 실행과 기획 의사결정은 역할 구조가 다름.

**Core Translation**

"화면을 설계했다" → "어떤 사용자 문제를 해결하기 위해 이 흐름을 설계했고 어떤 기준으로 우선순위를 정했는지"

**Typical Strength**

UX 사고, 사용자 흐름 이해, 시각적 커뮤니케이션.

**Typical Risk**

비즈니스 지표 연결, 개발 협업 주도, 우선순위 결정 경험 부재.

**Resume Rewrite Direction**

"디자인을 완성했다" → "이 설계 결정이 어떤 사용자 문제를 해결했고 어떤 결과로 이어졌는지"로 연결.

**Candidate Curated Cases**

UX디자이너→서비스기획, 프로덕트디자이너→PM

**doNotMixWith**: PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP, ENGINEERING_TO_PRODUCT_PLANNING

---

### 23. RESEARCH_TO_PRODUCT_OR_STRATEGY

- **archetypeId**: RESEARCH_TO_PRODUCT_OR_STRATEGY
- **label**: 리서치/조사 → 제품 또는 전략 기획
- **canonicalExample**: UX리서처/마케팅리서처 → PM / 전략기획
- **relatedCuratedCases**: (TODO)
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: DRAFT

**Covers**

사용자 리서치, 시장 조사, 인사이트 도출 경험에서 제품 방향 판단 또는 전략 기획 역할로 전환.

**Not Covers**

ANALYTICS_TO_PRODUCT_DECISION과 다름. 리서치 출신은 정량보다 정성 인사이트 강점이 핵심.

**Core Translation**

"인사이트를 리포트로 전달했다" → "이 인사이트가 어떤 제품/전략 의사결정을 바꿨는지"

**Typical Strength**

사용자 이해, 문제 정의, 인사이트 구조화.

**Typical Risk**

실행 주도, 우선순위 결정, 개발/사업 조직 협업 경험 부재.

**Resume Rewrite Direction**

"리서치 결과를 발표했다" → "이 리서치가 어떤 의사결정으로 이어졌는지"를 명시.

**Candidate Curated Cases**

UX리서처→PM, 시장조사→전략기획

**doNotMixWith**: ANALYTICS_TO_PRODUCT_DECISION, ANALYTICS_TO_BUSINESS_INSIGHT

---

### 24. ADMIN_TO_BUSINESS_PLANNING

- **archetypeId**: ADMIN_TO_BUSINESS_PLANNING
- **label**: 경영 지원/총무 → 사업기획
- **canonicalExample**: 경영지원 → 사업기획
- **relatedCuratedCases**: (TODO)
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: DRAFT

**Covers**

경영지원, 총무, 비서 등 조직 운영 지원 경험에서 사업 분석·기획 역할로 전환하는 패턴. 전환 거리가 가장 먼 유형 중 하나.

**Not Covers**

어떤 PM/서비스기획/데이터 archetype과도 혼용 금지. 경영지원→사업기획은 전환 자체를 어떻게 정당화할지가 핵심.

**Core Translation**

"경영진을 지원했다" → "경영 의사결정 과정을 가까이에서 봤기 때문에 전략 기획의 맥락을 이해한다"

**Typical Strength**

전사 프로세스 이해, 보고서 작성, 경영진 소통 경험.

**Typical Risk**

사업 분석, 시장 조사, 수익모델 설계 경험 전무. 역할 전환 근거가 가장 얇음.

**Resume Rewrite Direction**

경영지원 경험에서 전략 판단에 기여한 구체적 사례를 찾아야 함. 없으면 Generic Fallback으로 처리. 전환 의지보다 보완 경험(스터디, 사이드 프로젝트, 추가 자격)을 전면에.

**Candidate Curated Cases**

경영지원→사업기획 (전환 거리 크므로 Curated Case보다 Fallback 처리 권장)

**doNotMixWith**: 전체 다른 archetype과 혼용 금지

---

### 25. CUSTOMER_SUPPORT_TO_SERVICE_PLANNING

- **archetypeId**: CUSTOMER_SUPPORT_TO_SERVICE_PLANNING
- **label**: 고객지원(CS) → 서비스기획
- **canonicalExample**: CS/고객지원 → 서비스기획
- **relatedCuratedCases**: EXPERIENCED_CX_TO_SERVICE_PLANNING_V1 (공유 검토 필요)
- **primaryAxes**: jobStructure, customerType
- **status**: DRAFT

**Covers**

고객지원(CS) 경험 — 문의 응대, 민원 처리, VOC 집계, 반복 이슈 분류 — 에서 그 이슈의 원인이 되는 서비스 정책·화면 흐름·기능을 개선하는 서비스기획 역할로 전환하는 패턴.

**Not Covers**

서비스디자인 전환(CX_TO_SERVICE_DESIGN) 아님. 리서치·여정 지도·사용성 테스트 중심 전환은 CX_TO_SERVICE_DESIGN으로 처리. 온보딩·리텐션·고객성공 경험 중심 전환은 CUSTOMER_SUCCESS_TO_SERVICE_PLANNING으로 처리.

**Core Translation**

"고객 문의를 처리했다" → "이 문의가 반복되는 서비스 구조 원인을 찾아 화면 흐름·정책·기능 개선 요구사항으로 정의했다"

**Typical Strength**

고객 언어와 불편 패턴 이해. 운영 예외 케이스와 엣지케이스 감각. 서비스 취약 지점 발견.

**Typical Risk**

기획 산출물(IA, 화면설계, 정책 문서) 작성 역량 부재. 문의 응대 역할과 기획 역할의 차이를 이력서에서 명확히 구분하지 못하는 경우.

**Resume Rewrite Direction**

"문의를 처리했다" → "이 문의 유형이 반복된 이유를 분석했고, 어떤 화면·정책 개선으로 감소시켰는지"를 구체적으로 표현.

**Candidate Curated Cases**

CS/고객지원→서비스기획, 고객센터운영→서비스기획

**doNotMixWith**: CX_TO_SERVICE_DESIGN, CUSTOMER_SUCCESS_TO_SERVICE_PLANNING, OPERATIONS_TO_SERVICE_PLANNING

---

### 26. CUSTOMER_SUCCESS_TO_SERVICE_PLANNING

- **archetypeId**: CUSTOMER_SUCCESS_TO_SERVICE_PLANNING
- **label**: 고객성공(CX) → 서비스기획
- **canonicalExample**: CSM/고객성공 → 서비스기획
- **relatedCuratedCases**: EXPERIENCED_CX_TO_SERVICE_PLANNING_V1 (공유 검토 필요)
- **primaryAxes**: jobStructure, responsibilityScope
- **status**: DRAFT

**Covers**

고객성공(Customer Success) 경험 — 온보딩 설계, 사용률 모니터링, 리텐션 이슈 분석, 고객 여정 개선 — 에서 그 경험을 서비스기획의 운영 가능한 기능 요구사항·정책·구조 개선으로 전환하는 패턴.

**Not Covers**

서비스디자인 전환(CX_TO_SERVICE_DESIGN) 아님. 리서치·페르소나·사용성 중심 전환은 CX_TO_SERVICE_DESIGN. 단순 문의 처리 중심 전환은 CUSTOMER_SUPPORT_TO_SERVICE_PLANNING.

**Core Translation**

"고객이 서비스를 잘 쓰도록 도왔다" → "온보딩 병목과 이탈 지점을 발견해 서비스 흐름·기능·안내 구조 개선 요구사항으로 정의했다"

**Typical Strength**

고객 여정과 사용 패턴 이해. 온보딩·리텐션 지표 감각. 고객 성공 기준 정의 경험.

**Typical Risk**

기획 산출물 작성, 개발/디자인 협업 주도, 우선순위 결정 경험 부재. "고객을 도왔다"는 서술이 기획 역량 증명으로 연결되지 않는 경우.

**Resume Rewrite Direction**

"온보딩을 지원했다" → "온보딩 완료율이 낮은 지점을 분석했고, 어떤 화면 흐름·안내 구조 개선으로 연결했는지"를 구체적으로 표현.

**Candidate Curated Cases**

CSM→서비스기획, 고객성공매니저→서비스기획

**doNotMixWith**: CX_TO_SERVICE_DESIGN, CUSTOMER_SUPPORT_TO_SERVICE_PLANNING, OPERATIONS_TO_SERVICE_PLANNING

---

## Archetype Status Summary

| archetypeId | canonicalExample | primaryAxes | status |
|---|---|---|---|
| PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP | 서비스기획 → PM | jobStructure, responsibilityScope | ACTIVE |
| PLANNING_OUTPUT_TO_DELIVERY_OWNERSHIP | 서비스기획 → PO | jobStructure, responsibilityScope | ACTIVE |
| PLANNING_OUTPUT_TO_BUSINESS_STRATEGY | 서비스기획 → 사업기획 | jobStructure, responsibilityScope | ACTIVE |
| OPERATIONS_TO_PRODUCT_IMPROVEMENT | 운영기획 → PM | jobStructure, responsibilityScope | ACTIVE |
| OPERATIONS_TO_SERVICE_PLANNING | 운영기획 → 서비스기획 | jobStructure, responsibilityScope | DRAFT |
| OPERATIONS_TO_BUSINESS_PLANNING | 운영기획 → 사업기획 | jobStructure, responsibilityScope | DRAFT |
| ANALYTICS_TO_PRODUCT_DECISION | 데이터분석 → PM | jobStructure, responsibilityScope | ACTIVE |
| ANALYTICS_TO_BUSINESS_INSIGHT | 데이터분석 → 사업기획 | jobStructure, responsibilityScope | DRAFT |
| PERFORMANCE_MARKETING_TO_GROWTH_PRODUCT | 퍼포먼스마케팅 → PM | jobStructure, responsibilityScope | ACTIVE |
| PERFORMANCE_MARKETING_TO_SERVICE_PLANNING | 퍼포먼스마케팅 → 서비스기획 | jobStructure, customerType | ACTIVE |
| CX_TO_SERVICE_DESIGN | UX리서처/CX디자이너 → 서비스디자이너 | jobStructure, customerType | DRAFT |
| SALES_TO_BUSINESS_DEVELOPMENT | B2B영업 → 사업개발 | jobStructure, customerType | DRAFT |
| SALES_TO_ACCOUNT_MANAGEMENT | B2B영업 → AM | jobStructure, customerType | DRAFT |
| SALES_ADMIN_TO_BUSINESS_PLANNING | 영업관리 → 사업기획 | jobStructure, responsibilityScope | DRAFT |
| ACCOUNTING_TO_BUSINESS_FINANCE | 회계 → FP&A | jobStructure, industryContext | DRAFT |
| ACCOUNTING_TO_MANAGEMENT_PLANNING | 회계 → 경영기획 | jobStructure, responsibilityScope | DRAFT |
| HR_OPERATIONS_TO_HRBP | 인사운영 → HRBP | jobStructure, responsibilityScope | DRAFT |
| RECRUITING_TO_HRBP | 채용담당 → HRBP | jobStructure, responsibilityScope | DRAFT |
| PROCUREMENT_TO_BUSINESS_PLANNING | 구매 → 사업기획 | jobStructure, responsibilityScope | DRAFT |
| ENGINEERING_TO_PRODUCT_PLANNING | 개발자 → PM | jobStructure, responsibilityScope | DRAFT |
| TECH_SUPPORT_TO_SERVICE_PLANNING | 기술지원 → 서비스기획 | jobStructure, customerType | DRAFT |
| DESIGN_TO_PRODUCT_PLANNING | UX디자이너 → 서비스기획 | jobStructure, responsibilityScope | DRAFT |
| RESEARCH_TO_PRODUCT_OR_STRATEGY | UX리서처 → PM/전략기획 | jobStructure, responsibilityScope | DRAFT |
| ADMIN_TO_BUSINESS_PLANNING | 경영지원 → 사업기획 | jobStructure, responsibilityScope | DRAFT |
| CUSTOMER_SUPPORT_TO_SERVICE_PLANNING | CS/고객지원 → 서비스기획 | jobStructure, customerType | DRAFT |
| CUSTOMER_SUCCESS_TO_SERVICE_PLANNING | CSM/고객성공 → 서비스기획 | jobStructure, responsibilityScope | DRAFT |

**총 archetype: 26개** (ACTIVE: 6, DRAFT: 20)

## CX 계열 3분기 원칙

CX 계열 전환은 아래 세 archetype으로 명확히 분리한다.

| 전환 유형 | 핵심 경험 | 목표 직무 | archetype |
|---|---|---|---|
| CS/고객지원 | 문의·민원·VOC·반복 이슈 처리 | 서비스기획 | CUSTOMER_SUPPORT_TO_SERVICE_PLANNING |
| CSM/고객성공 | 온보딩·사용률·리텐션·여정 개선 | 서비스기획 | CUSTOMER_SUCCESS_TO_SERVICE_PLANNING |
| UX리서처/CX디자이너 | 리서치·여정·사용성·경험 아키텍처 | 서비스디자인 | CX_TO_SERVICE_DESIGN |

세 archetype을 혼용하면 서비스기획 문구가 리서치/디자인 방법론 방향으로 흐를 위험이 있다.

## Working Rule

1. 새 archetype을 추가하기 전에 기존 archetype 중 커버 가능한 것이 있는지 먼저 확인한다.
2. DRAFT 상태의 archetype은 curated case가 LOCKED 이상이 된 후 ACTIVE로 전환한다.
3. axisOverlayTemplate은 relatedCuratedCases의 케이스 전문을 기준으로 작성하고, 일반화된 표현으로 유지한다.
4. doNotMixWith에 적힌 archetype과 표현 구조가 섞이지 않도록 한다.
5. DEPRECATED 처리는 curated case가 완전히 대체한 경우에만 허용한다.

---

Version: 1.2.0
Updated: 2026-05-01
Changes: CX_TO_SERVICE_DESIGN → 서비스디자인 전용으로 정정. CUSTOMER_SUPPORT_TO_SERVICE_PLANNING (#25), CUSTOMER_SUCCESS_TO_SERVICE_PLANNING (#26) 복구 추가. 병합 note 제거. 총 26개.
Created: 2026-05-01
