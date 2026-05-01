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
- **label**: CS/CX → 서비스 설계
- **canonicalExample**: CS/CX → 서비스기획
- **relatedCuratedCases**: EXPERIENCED_CX_TO_SERVICE_PLANNING_V1 (TODO)
- **primaryAxes**: jobStructure, customerType
- **status**: DRAFT

**description**

VOC 수집과 고객 불편 대응 경험에서, 그 이해를 기능 개선·서비스 흐름 설계·정책 개선으로 연결하는 서비스기획 역할로 전환하는 패턴. 고객의 언어를 제품의 언어로 번역하는 것이 이 archetype의 핵심이다.

**coreDifference**

"고객 문의를 처리했다"에서 "반복 문의의 원인을 분석하고, 개선 과제를 정의해 기획·정책·화면 변경으로 연결한다"로 책임이 이동한다.

**axisOverlayTemplate**

jobStructure:
- lead: CS/CX 경험은 서비스기획의 문제 발견 역량과 연결될 수 있습니다. 고객 불편과 반복 문의를 직접 다뤄본 경험은 서비스 흐름의 취약 지점을 파악하는 데 유리합니다.
- scoreReason: 다만 서비스기획은 고객 문의를 처리하는 역할이 아니라, 그 문의의 원인이 된 서비스 구조와 흐름을 개선하는 역할입니다. 기존 경험이 문의 응대 처리에만 머물렀다면 기획 역할로의 전환은 추가 증거가 필요합니다.
- criteria: 이 축에서는 CS/CX 경험 중 반복 문의 원인 분석, 개선 제안, 정책 변경 기여, 화면 흐름 개선 협업 경험이 얼마나 포함되어 있는지를 봅니다.

customerType:
- lead: CS/CX 출신은 고객이 어디서 막히고 어떤 언어로 불편을 표현하는지 잘 알고 있습니다. 이 이해는 서비스기획에서 사용자 흐름 설계와 정책 개선에 직접적인 강점이 됩니다.
- liftOrLimit: 고객 응대 경험만 쓰기보다, "이 문의가 반복되는 이유를 분석했고, 화면 흐름 또는 정책 개선안으로 제안했다"는 식으로 표현해야 기획 역량으로 연결됩니다.

**doNotMixWith**: OPERATIONS_TO_PRODUCT_IMPROVEMENT

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

## Archetype Status Summary

| archetypeId | canonicalExample | primaryAxes | status |
|---|---|---|---|
| PLANNING_OUTPUT_TO_PRODUCT_OWNERSHIP | 서비스기획 → PM | jobStructure, responsibilityScope | ACTIVE |
| PLANNING_OUTPUT_TO_DELIVERY_OWNERSHIP | 서비스기획 → PO | jobStructure, responsibilityScope | ACTIVE |
| OPERATIONS_TO_PRODUCT_IMPROVEMENT | 운영기획 → PM | jobStructure, responsibilityScope | ACTIVE |
| ANALYTICS_TO_PRODUCT_DECISION | 데이터분석 → PM | jobStructure, responsibilityScope | ACTIVE |
| PERFORMANCE_MARKETING_TO_GROWTH_PRODUCT | 퍼포먼스마케팅 → PM | jobStructure, responsibilityScope | ACTIVE |
| CX_TO_SERVICE_DESIGN | CS/CX → 서비스기획 | jobStructure, customerType | DRAFT |
| ACCOUNTING_TO_BUSINESS_FINANCE | 회계 → FP&A | jobStructure, industryContext | DRAFT |
| SALES_TO_BUSINESS_DEVELOPMENT | B2B영업 → 사업개발 | jobStructure, customerType | DRAFT |

## Working Rule

1. 새 archetype을 추가하기 전에 기존 archetype 중 커버 가능한 것이 있는지 먼저 확인한다.
2. DRAFT 상태의 archetype은 curated case가 LOCKED 이상이 된 후 ACTIVE로 전환한다.
3. axisOverlayTemplate은 relatedCuratedCases의 케이스 전문을 기준으로 작성하고, 일반화된 표현으로 유지한다.
4. doNotMixWith에 적힌 archetype과 표현 구조가 섞이지 않도록 한다.
5. DEPRECATED 처리는 curated case가 완전히 대체한 경우에만 허용한다.

---

Version: 1.0.0
Created: 2026-05-01
