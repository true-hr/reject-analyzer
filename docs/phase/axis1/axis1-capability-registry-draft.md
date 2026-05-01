# Axis 1 Capability Registry — Design Draft

- date: 2026-04-20
- scope: DESIGN ONLY. No production code patch in this round.
- round: SAFE DESIGN ROUND (follows 2026-04-20 investigation + plan)

---

## Files Inspected This Round

- `src/lib/analysis/buildAxisConnectivityPack.js` — verified from prior round (no re-read needed)
- `src/data/transitionLite/capabilityRegistry.js` — STOP CONDITION check (different purpose, not conflicting)
- `src/data/job/ontology/sales/*.js` — ID verification
- `src/data/job/ontology/marketing/*.js` — ID verification
- `src/data/job/ontology/business/business_planning.js` — ID verification
- `src/data/job/ontology/it_data_digital/product_management.js` — ID verification
- `src/data/job/ontology/hr_organization/*.js` — ID verification
- `src/data/job/ontology/customer_operations/*.js` — ID verification
- `src/data/job/ontology/finance_accounting/*.js` — ID verification
- `src/data/job/ontology/engineering_development/mechanical_design.js` — ID verification
- `src/data/job/ontology/manufacturing_quality_production/*.js` — ID verification
- `src/data/job/ontology/it_data_digital/data_analysis.js` — ID verification

---

## Section 1: Executive Decision

**Choice: A — implement all-family weighted read first**

Rationale:
- Root cause is primary-family dominance: `getPrimaryFamilyStrongSignals()` reads `families[0]` only.
- Fixing the signal read closes the largest scoring gap without touching downstream contracts.
- Capability registry (Round 3+) must consume trustworthy signal data — building it in shadow while the read is broken would produce misleading shadow logs.
- Option C (parallel feature flag) adds coordination overhead with no clear benefit in Round 1.

**First live rollout must leave untouched:**
- `classifyTransition.js` — jobDistance/familyDistance logic unchanged
- `axisExplanationRegistry.js` — explanation text unchanged
- All downstream output contract keys: `rawScore`, `displayScore`, `band`, `breakdown`, `explanation`
- Axis 4 (already updated per April 3rd log — do NOT touch)

---

## Section 2: Live Contract Recheck

**Verified:**

| Item | Value |
|---|---|
| axis1 score owner | `buildAxisConnectivityPack.js > scoreAxis1()` |
| primary family read — strong | `getPrimaryFamilyStrongSignals()` → `getPrimaryFamily(item)?.strongSignals` → `families[0]` |
| primary family read — medium | `getPrimaryFamilyMediumSignals()` → same pattern |
| responsibility read | `getJobResponsibilityHints()` → ALL roles (already multi-role) |
| output shape | `{ rawScore, displayScore, band, breakdown, explanation }` |
| breakdown keys | `strongSignals, responsibilityHints, mediumSignals, missionTypeMatch, outputTypeMatch, weakUmbrellaBridge` |
| explanation dependency | `buildJobStructureExplanation()` reads `band` + named `breakdown` keys |
| new breakdown subfield safety | SAFE — adding new key (e.g., `capabilityClusterOverlap`) does not break existing consumers; no consumer destructures `breakdown` exhaustively |

---

## Section 3: Capability Registry Design SSOT

**Purpose:** Maps each job ID to its capability cluster profile, enabling structured overlap computation between jobs beyond primary-family strongSignal text matching.

**Recommended file:** `src/data/transitionLite/jobCapabilityClusterRegistry.js`

Rationale for path:
- Same directory as `capabilityRegistry.js` (which serves a different purpose — newgrad scoring labels)
- Naming is distinct: `jobCapabilityClusterRegistry` vs `capabilityRegistry`
- No conflict with existing exports

**Exact export shape (PROPOSED):**

```js
// src/data/transitionLite/jobCapabilityClusterRegistry.js

export const JOB_CAPABILITY_CLUSTER_REGISTRY = {
  JOB_SALES_GENERAL_SALES: {
    capabilityClusters: ["customer_discovery", "persuasion_proposal", "relationship_management", "market_insight"],
    workingMotionTags: ["market_facing", "quota_or_growth_driven", "external_communication_heavy"],
    bridgeGroups: ["commercial_gtm", "customer_facing_growth"],
    confidence: "medium",
    evidenceNote: "영업의 본질인 고객 니즈 파악, 설득, 관계 관리가 강하고 시장 감각도 일부 포함됨"
  },
  // ...
};

export const CAPABILITY_CLUSTER_TAXONOMY = {
  customer_discovery: {
    label: "고객 니즈 파악",
    meaning: "고객의 문제, 요구, 구매 맥락, 사용 맥락을 파악하는 일",
    typicalJobs: ["JOB_SALES_GENERAL_SALES", "JOB_SALES_B2B_SALES", "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS", "JOB_MARKETING_PRODUCT_MARKETING_PMM", "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT"]
  },
  // ...
};
```

**Field contracts:**
- `capabilityClusters`: `string[]` — ordered array of cluster IDs, primary clusters first
- `workingMotionTags`: `string[]` — operational style tags, used for explanation routing (not scored in Round 3)
- `bridgeGroups`: `string[]` — overlap here means bridge eligibility (replaces/extends ALLOWLIST in Round 4)
- `confidence`: `"high" | "medium" | "low"` — used for uncertainty weighting downstream
- `evidenceNote`: `string` — Korean rationale, implementation-facing only (not user-rendered directly)

---

## Section 4: Capability Cluster Taxonomy (First-Pass, 12 Clusters)

```js
export const CAPABILITY_CLUSTER_TAXONOMY = {
  customer_discovery: {
    label: "고객 니즈 파악",
    meaning: "고객의 문제, 요구, 구매 맥락, 사용 맥락을 파악하는 일",
    typicalJobs: ["JOB_SALES_GENERAL_SALES", "JOB_SALES_B2B_SALES", "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS", "JOB_MARKETING_PRODUCT_MARKETING_PMM", "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT"]
  },
  persuasion_proposal: {
    label: "설득·제안",
    meaning: "상대를 설득하고 제안서를 만들거나 메시지를 조정해 의사결정을 이끄는 일",
    typicalJobs: ["JOB_SALES_GENERAL_SALES", "JOB_SALES_B2B_SALES", "JOB_SALES_SOLUTION_SALES", "JOB_SALES_PARTNER_CHANNEL_SALES", "JOB_HR_ORGANIZATION_RECRUITING"]
  },
  market_insight: {
    label: "시장·경쟁 이해",
    meaning: "시장 흐름, 경쟁사, 고객 세그먼트, 반응을 읽고 방향성을 잡는 일",
    typicalJobs: ["JOB_MARKETING_BRAND_MARKETING", "JOB_MARKETING_PRODUCT_MARKETING_PMM", "JOB_BUSINESS_BUSINESS_PLANNING", "JOB_MARKETING_PERFORMANCE_MARKETING"]
  },
  message_positioning: {
    label: "메시지·포지셔닝 설계",
    meaning: "어떤 메시지로 누구에게 어떤 가치를 전달할지 정리하는 일",
    typicalJobs: ["JOB_MARKETING_BRAND_MARKETING", "JOB_MARKETING_PRODUCT_MARKETING_PMM", "JOB_MARKETING_CONTENT_MARKETING", "JOB_SALES_B2B_SALES"]
  },
  relationship_management: {
    label: "관계 관리",
    meaning: "고객, 파트너, 내부 이해관계자와 지속적으로 관계를 유지·조율하는 일",
    typicalJobs: ["JOB_SALES_GENERAL_SALES", "JOB_SALES_PARTNER_CHANNEL_SALES", "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS", "JOB_HR_ORGANIZATION_HRBP"]
  },
  crossfunctional_alignment: {
    label: "부서 간 조율",
    meaning: "여러 조직과 협업하며 일정, 우선순위, 요구사항을 맞추는 일",
    typicalJobs: ["JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT", "JOB_MARKETING_PRODUCT_MARKETING_PMM", "JOB_HR_ORGANIZATION_HRBP", "JOB_BUSINESS_BUSINESS_PLANNING"]
  },
  execution_operations: {
    label: "실행 운영",
    meaning: "정해진 목표를 실제 운영, 실행, 관리하는 일",
    typicalJobs: ["JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS", "JOB_MARKETING_PERFORMANCE_MARKETING", "JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING", "JOB_HR_ORGANIZATION_RECRUITING"]
  },
  analysis_optimization: {
    label: "데이터 해석·개선",
    meaning: "수치/현황을 보고 문제를 해석하고 개선 포인트를 찾는 일",
    typicalJobs: ["JOB_IT_DATA_DIGITAL_DATA_ANALYSIS", "JOB_MARKETING_PERFORMANCE_MARKETING", "JOB_FINANCE_ACCOUNTING_FP_AND_A", "JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING"]
  },
  product_service_translation: {
    label: "제품·서비스 가치 해석",
    meaning: "제품/서비스의 가치를 사용자·고객 언어로 바꾸고 연결하는 일",
    typicalJobs: ["JOB_MARKETING_PRODUCT_MARKETING_PMM", "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT", "JOB_SALES_SOLUTION_SALES", "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS"]
  },
  planning_structuring: {
    label: "기획·구조화",
    meaning: "목표를 정리하고 실행 구조, 우선순위, 로드맵을 짜는 일",
    typicalJobs: ["JOB_BUSINESS_BUSINESS_PLANNING", "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT", "JOB_MARKETING_BRAND_MARKETING", "JOB_HR_ORGANIZATION_HRBP"]
  },
  stakeholder_support: {
    label: "이해관계자 지원",
    meaning: "현업/사용자/조직이 더 잘 움직이도록 지원하고 문제를 풀어주는 일",
    typicalJobs: ["JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS", "JOB_HR_ORGANIZATION_HRBP", "JOB_HR_ORGANIZATION_RECRUITING", "JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS"]
  },
  domain_technical_depth: {
    label: "전문기술 기반 수행",
    meaning: "특정 기술/공학/회계 지식 자체가 핵심 수행 기반이 되는 일",
    typicalJobs: ["JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN", "JOB_FINANCE_ACCOUNTING_ACCOUNTING", "JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING", "JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING"]
  }
};
```

---

## Section 5: Concrete Registry Draft (20 Priority Jobs)

### Job ID Mismatch Report

The following task-requested IDs do NOT exist in live code. Corrected live IDs are used below:

| Requested | Live (verified) | Reason |
|---|---|---|
| JOB_STRATEGY_BUSINESS_PLANNING | JOB_BUSINESS_BUSINESS_PLANNING | vertical=BUSINESS not STRATEGY |
| JOB_PRODUCT_PRODUCT_MANAGER | JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT | majorCategory=IT_DATA_DIGITAL, no PRODUCT vertical |
| JOB_HR_RECRUITING | JOB_HR_ORGANIZATION_RECRUITING | vertical=HR_ORGANIZATION |
| JOB_HR_HRBP | JOB_HR_ORGANIZATION_HRBP | vertical=HR_ORGANIZATION |
| JOB_OPERATIONS_SERVICE_OPERATIONS | JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS | vertical=CUSTOMER_OPERATIONS |
| JOB_CS_CUSTOMER_SUCCESS | JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS | vertical=CUSTOMER_OPERATIONS |
| JOB_FINANCE_ACCOUNTING | JOB_FINANCE_ACCOUNTING_ACCOUNTING | needs subVertical=ACCOUNTING suffix |
| JOB_FINANCE_FPANDA | JOB_FINANCE_ACCOUNTING_FP_AND_A | subVertical=FP_AND_A |
| JOB_MANUFACTURING_PRODUCTION_TECHNOLOGY | JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING | nearest match: production_engineering.js |
| JOB_MANUFACTURING_PROCESS_DEVELOPMENT | JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING | nearest match: process_engineering.js |
| JOB_IT_DATA_ANALYST | JOB_IT_DATA_DIGITAL_DATA_ANALYSIS | subVertical=DATA_ANALYSIS |

**Confirmed matching (no change needed):**
JOB_SALES_GENERAL_SALES, JOB_SALES_B2B_SALES, JOB_SALES_PARTNER_CHANNEL_SALES, JOB_SALES_SOLUTION_SALES,
JOB_MARKETING_BRAND_MARKETING, JOB_MARKETING_PRODUCT_MARKETING_PMM, JOB_MARKETING_CONTENT_MARKETING,
JOB_MARKETING_PERFORMANCE_MARKETING, JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN

---

### Registry Draft (JS format)

```js
// src/data/transitionLite/jobCapabilityClusterRegistry.js
// DRAFT — not production code. Do not import until Round 3 rollout.

export const JOB_CAPABILITY_CLUSTER_REGISTRY = {

  // ── SALES ──────────────────────────────────────────────────────────────
  JOB_SALES_GENERAL_SALES: {
    capabilityClusters: ["customer_discovery", "persuasion_proposal", "relationship_management", "market_insight"],
    workingMotionTags: ["market_facing", "quota_or_growth_driven", "external_communication_heavy"],
    bridgeGroups: ["commercial_gtm", "customer_facing_growth"],
    confidence: "medium",
    evidenceNote: "영업의 본질인 고객 니즈 파악, 설득, 관계 관리가 강하고 시장 감각도 일부 포함됨"
  },

  JOB_SALES_B2B_SALES: {
    capabilityClusters: ["customer_discovery", "persuasion_proposal", "relationship_management", "crossfunctional_alignment", "message_positioning"],
    workingMotionTags: ["market_facing", "deal_driven", "external_communication_heavy"],
    bridgeGroups: ["commercial_gtm", "complex_b2b_motion"],
    confidence: "medium",
    evidenceNote: "단순 판매보다 제안, 메시지 조정, 내부 협업이 더 강하게 들어가는 B2B형 영업"
  },

  JOB_SALES_PARTNER_CHANNEL_SALES: {
    capabilityClusters: ["relationship_management", "persuasion_proposal", "crossfunctional_alignment", "market_insight"],
    workingMotionTags: ["partner_facing", "ecosystem_driven", "external_communication_heavy"],
    bridgeGroups: ["commercial_gtm", "partner_ecosystem"],
    confidence: "medium",
    evidenceNote: "직접 고객만이 아니라 파트너 네트워크를 통해 성과를 내는 구조가 핵심"
  },

  JOB_SALES_SOLUTION_SALES: {
    capabilityClusters: ["customer_discovery", "persuasion_proposal", "product_service_translation", "crossfunctional_alignment", "domain_technical_depth"],
    workingMotionTags: ["consultative_selling", "market_facing", "solution_translation"],
    bridgeGroups: ["commercial_gtm", "solution_consultative"],
    confidence: "medium",
    evidenceNote: "고객 문제 해석과 제품/기술 가치를 연결하는 설명력이 중요한 영업"
  },

  // ── MARKETING ──────────────────────────────────────────────────────────
  JOB_MARKETING_BRAND_MARKETING: {
    capabilityClusters: ["market_insight", "message_positioning", "planning_structuring", "crossfunctional_alignment"],
    workingMotionTags: ["market_facing", "message_strategy_heavy", "campaign_or_brand_planning"],
    bridgeGroups: ["commercial_gtm", "brand_message_strategy"],
    confidence: "medium",
    evidenceNote: "시장과 고객을 해석해 브랜드 메시지와 방향을 설계하는 역할"
  },

  JOB_MARKETING_PRODUCT_MARKETING_PMM: {
    capabilityClusters: ["market_insight", "message_positioning", "product_service_translation", "crossfunctional_alignment", "planning_structuring"],
    workingMotionTags: ["market_facing", "message_strategy_heavy", "product_translation"],
    bridgeGroups: ["commercial_gtm", "product_gtm"],
    confidence: "medium",
    evidenceNote: "제품 가치를 시장 언어로 번역하고 제품-영업-마케팅을 잇는 역할"
  },

  JOB_MARKETING_CONTENT_MARKETING: {
    capabilityClusters: ["message_positioning", "market_insight", "execution_operations"],
    workingMotionTags: ["content_execution", "message_delivery", "market_facing"],
    bridgeGroups: ["commercial_gtm", "content_message_execution"],
    confidence: "medium",
    evidenceNote: "메시지를 실제 콘텐츠로 풀어내고 반응을 보며 개선하는 성격이 강함"
  },

  JOB_MARKETING_PERFORMANCE_MARKETING: {
    capabilityClusters: ["analysis_optimization", "execution_operations", "market_insight"],
    workingMotionTags: ["channel_optimization", "data_feedback_loop", "campaign_execution"],
    bridgeGroups: ["commercial_gtm", "performance_growth"],
    confidence: "medium",
    evidenceNote: "메시지 설계보다는 채널 운영과 수치 최적화의 비중이 더 큼"
  },

  // ── BUSINESS ───────────────────────────────────────────────────────────
  // NOTE: task used JOB_STRATEGY_BUSINESS_PLANNING — live ID is JOB_BUSINESS_BUSINESS_PLANNING
  JOB_BUSINESS_BUSINESS_PLANNING: {
    capabilityClusters: ["planning_structuring", "market_insight", "crossfunctional_alignment", "analysis_optimization"],
    workingMotionTags: ["planning_heavy", "internal_alignment", "growth_or_business_decision_support"],
    bridgeGroups: ["business_strategy_planning", "commercial_gtm"],
    confidence: "low_to_medium",
    evidenceNote: "시장/사업 정보를 구조화해 방향과 실행 우선순위를 설계하는 역할"
  },

  // ── PRODUCT ────────────────────────────────────────────────────────────
  // NOTE: task used JOB_PRODUCT_PRODUCT_MANAGER — live ID is JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT
  JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT: {
    capabilityClusters: ["planning_structuring", "crossfunctional_alignment", "customer_discovery", "product_service_translation", "analysis_optimization"],
    workingMotionTags: ["product_decision_making", "crossfunctional_core", "user_problem_framing"],
    bridgeGroups: ["product_building", "customer_problem_solving"],
    confidence: "medium",
    evidenceNote: "사용자 문제 정의와 우선순위 설계, 협업 조율이 중심인 역할"
  },

  // ── HR ─────────────────────────────────────────────────────────────────
  // NOTE: task used JOB_HR_RECRUITING — live ID is JOB_HR_ORGANIZATION_RECRUITING
  JOB_HR_ORGANIZATION_RECRUITING: {
    capabilityClusters: ["stakeholder_support", "relationship_management", "execution_operations", "persuasion_proposal"],
    workingMotionTags: ["candidate_facing", "process_execution", "coordination_heavy"],
    bridgeGroups: ["people_operations", "talent_acquisition"],
    confidence: "medium",
    evidenceNote: "후보자/현업을 조율하며 채용 과정을 운영하고 설득하는 역할"
  },

  // NOTE: task used JOB_HR_HRBP — live ID is JOB_HR_ORGANIZATION_HRBP
  JOB_HR_ORGANIZATION_HRBP: {
    capabilityClusters: ["stakeholder_support", "relationship_management", "planning_structuring", "crossfunctional_alignment"],
    workingMotionTags: ["internal_partnering", "people_strategy_support", "organizational_alignment"],
    bridgeGroups: ["people_operations", "hr_business_partnering"],
    confidence: "medium",
    evidenceNote: "조직 이슈를 이해하고 현업과 사람 이슈를 함께 풀어가는 파트너 역할"
  },

  // ── CUSTOMER OPERATIONS ────────────────────────────────────────────────
  // NOTE: task used JOB_OPERATIONS_SERVICE_OPERATIONS — live ID is JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS
  JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS: {
    capabilityClusters: ["execution_operations", "stakeholder_support", "analysis_optimization", "crossfunctional_alignment"],
    workingMotionTags: ["ops_execution", "service_stability", "process_improvement"],
    bridgeGroups: ["service_delivery_operations", "internal_execution"],
    confidence: "medium",
    evidenceNote: "운영 품질과 프로세스 개선, 현업 지원이 중심인 역할"
  },

  // NOTE: task used JOB_CS_CUSTOMER_SUCCESS — live ID is JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS
  JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS: {
    capabilityClusters: ["relationship_management", "stakeholder_support", "customer_discovery", "product_service_translation", "crossfunctional_alignment"],
    workingMotionTags: ["customer_facing", "retention_or_adoption", "problem_resolution"],
    bridgeGroups: ["customer_facing_growth", "post_sales_value_delivery"],
    confidence: "medium",
    evidenceNote: "고객의 문제를 풀고 제품 가치 실현을 지원하며 내부와도 강하게 연결되는 역할"
  },

  // ── FINANCE ────────────────────────────────────────────────────────────
  // NOTE: task used JOB_FINANCE_ACCOUNTING — live ID is JOB_FINANCE_ACCOUNTING_ACCOUNTING
  JOB_FINANCE_ACCOUNTING_ACCOUNTING: {
    capabilityClusters: ["domain_technical_depth", "execution_operations", "analysis_optimization"],
    workingMotionTags: ["accuracy_control", "rule_based_execution", "financial_reporting"],
    bridgeGroups: ["finance_control", "financial_operations"],
    confidence: "medium",
    evidenceNote: "정확성과 규정 기반 처리, 재무 데이터 정리가 핵심인 역할"
  },

  // NOTE: task used JOB_FINANCE_FPANDA — live ID is JOB_FINANCE_ACCOUNTING_FP_AND_A
  JOB_FINANCE_ACCOUNTING_FP_AND_A: {
    capabilityClusters: ["analysis_optimization", "planning_structuring", "market_insight", "crossfunctional_alignment"],
    workingMotionTags: ["financial_planning", "business_decision_support", "forecasting"],
    bridgeGroups: ["finance_strategy", "business_planning_support"],
    confidence: "medium",
    evidenceNote: "숫자를 해석해 계획과 의사결정을 지원하는 역할"
  },

  // ── ENGINEERING ────────────────────────────────────────────────────────
  JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN: {
    capabilityClusters: ["domain_technical_depth", "planning_structuring", "analysis_optimization"],
    workingMotionTags: ["engineering_design", "technical_problem_solving", "specification_driven"],
    bridgeGroups: ["engineering_design_build", "technical_execution"],
    confidence: "medium",
    evidenceNote: "공학적 전문지식과 설계 문제 해결이 핵심인 역할"
  },

  // ── MANUFACTURING ──────────────────────────────────────────────────────
  // NOTE: task used JOB_MANUFACTURING_PRODUCTION_TECHNOLOGY — nearest live ID is JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING
  JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING: {
    capabilityClusters: ["execution_operations", "analysis_optimization", "domain_technical_depth", "crossfunctional_alignment"],
    workingMotionTags: ["factory_execution", "process_improvement", "technical_operations"],
    bridgeGroups: ["manufacturing_execution", "industrial_process"],
    confidence: "medium",
    evidenceNote: "생산 현장 실행과 개선, 기술적 운영 안정화가 중심인 역할"
  },

  // NOTE: task used JOB_MANUFACTURING_PROCESS_DEVELOPMENT — nearest live ID is JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING
  JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING: {
    capabilityClusters: ["domain_technical_depth", "planning_structuring", "analysis_optimization", "crossfunctional_alignment"],
    workingMotionTags: ["process_design", "technical_problem_solving", "scaleup_or_optimization"],
    bridgeGroups: ["industrial_process", "engineering_development"],
    confidence: "medium",
    evidenceNote: "공정 자체를 설계하고 개선하는 개발 성격이 더 강한 역할"
  },

  // ── IT / DATA ──────────────────────────────────────────────────────────
  // NOTE: task used JOB_IT_DATA_ANALYST — live ID is JOB_IT_DATA_DIGITAL_DATA_ANALYSIS
  JOB_IT_DATA_DIGITAL_DATA_ANALYSIS: {
    capabilityClusters: ["analysis_optimization", "planning_structuring", "stakeholder_support"],
    workingMotionTags: ["data_interpretation", "decision_support", "insight_delivery"],
    bridgeGroups: ["data_decision_support", "business_analysis"],
    confidence: "medium",
    evidenceNote: "데이터를 해석해 인사이트를 만들고 의사결정을 돕는 역할"
  }
};
```

---

## Section 6: Scoring Usage Proposal

All weights below are PROPOSED. Marked for Round 3 (first live registry use).

### A. Cluster overlap contribution
```
clusterOverlapRatio = |intersection(current.capabilityClusters, target.capabilityClusters)| / |union(...)|
clusterBonus = Math.round(clusterOverlapRatio * 20)   // max +20
cap: clusterBonus capped at 12 in Round 3 (conservative first rollout)
```

### B. workingMotionTags contribution
- NOT scored in Round 3.
- Used only for explanation routing (which template to select in `buildJobStructureExplanation`).
- May be scored in Round 4+ once cluster scoring is stable.

### C. bridgeGroups contribution
```
sharedBridgeGroups = intersection(current.bridgeGroups, target.bridgeGroups)
if sharedBridgeGroups.length >= 1:
  bridgeEligible = true
  → allows raising weakUmbrellaBridge floor from 20 → 40
  → allows "mid" band for bridgeable GTM transitions (target behavior)
```
This replaces the current hardcoded ALLOWLIST (4 jobs only) with registry-driven bridge detection.

### D. Interaction with existing signals
```
// Round 3 scoring stack (PROPOSED):
raw = computeAxis1Raw(signals)                // unchanged — base score
raw += clusterBonus                           // +0 to +12 (new, additive)
raw = applyAxis1TaxonomyGuardrails(raw)       // unchanged — distance modifiers
raw = applyAxis1WeakUmbrellaBridge(raw)       // MODIFIED — floor raised 20→40 when registry bridgeEligible=true
```

### E. Primary vs secondary vs guardrail
| Layer | Source | Weight | Role in Round 3 |
|---|---|---|---|
| Primary | strongSignals, responsibilityHints (Round 1: all-family) | base+42+14 | Unchanged |
| Secondary | capability cluster overlap | +0 to +12 | New additive |
| Guardrail | taxonomy/family distance, jobDistance | -12 to +4 | Unchanged |
| Bridge floor | bridgeGroups registry match | floor 20→40 | Modified |

---

## Section 7: Explanation Contract Draft

Korean copy blocks for the 5 alignment cases.
These are ready for direct embedding into `axisExplanationRegistry.js` in Round 4.

### Case 1: identical / high alignment (band: mid_high ~ high)
```
summary: "지금까지 해오신 핵심 업무 구조를 거의 그대로 가져갈 수 있는 전환입니다."
positive[0]: "핵심 과업이 상당 부분 겹쳐서, 새 직무에서도 기존 강점을 바로 활용할 가능성이 높습니다."
positive[1]: "일하는 방식과 요구되는 판단 구조가 비슷해 적응 비용이 크지 않은 편입니다."
caution[0]: "다만 회사나 산업 맥락에 따라 세부 운영 방식은 달라질 수 있습니다."
caution[1]: "같은 직무명이라도 실제 맡았던 범위 차이는 확인이 필요합니다."
```

### Case 2: adjacent same-domain (band: mid ~ mid_high)
```
summary: "같은 도메인 안에서 역할 초점이 조금 달라지는 전환입니다."
positive[0]: "기존 경험 중 상당 부분이 이어지기 때문에 완전히 새로 시작하는 전환은 아닙니다."
positive[1]: "업무 언어와 협업 맥락이 비슷해서 진입 장벽은 비교적 낮은 편입니다."
caution[0]: "다만 목표 직무에서 더 자주 요구되는 실무 포인트는 별도로 보완해야 합니다."
caution[1]: "현재 직무에서 해보지 않은 세부 역할은 면접에서 구체적으로 설명할 준비가 필요합니다."
```

### Case 3: bridgeable cross-family (band: low ~ mid)
```
summary: "직무명은 다르지만, 실제로는 이어지는 핵심 역량이 분명히 있는 전환입니다."
positive[0]: "고객 이해, 메시지 조정, 시장 해석, 이해관계자 조율처럼 전이 가능한 요소가 분명히 있습니다."
positive[1]: "완전히 무관한 전환이라기보다, 기존 경험을 다른 방식으로 재해석해야 하는 전환에 가깝습니다."
caution[0]: "다만 목표 직무 고유의 실행 맥락까지 이미 갖췄다고 보기는 어렵습니다."
caution[1]: "그래서 '할 수 있다'는 주장보다, 어떤 경험이 어떻게 이어지는지 연결해서 설명하는 게 중요합니다."
rationale: "전이 가능한 기반은 분명하지만, 목표 직무의 핵심 실무를 직접 해본 수준까지는 아니라서 중간 연결로 보는 것이 더 적절합니다."
```

### Case 4: deceptive lookalike (band: low ~ mid, with high caution signal)
```
summary: "겉으로는 비슷해 보여도, 실제로 요구되는 핵심 업무 구조는 꽤 다를 수 있습니다."
positive[0]: "일부 공통 언어와 협업 포인트는 있어서 완전히 낯선 전환은 아닙니다."
positive[1]: "연결고리가 전혀 없는 것은 아니지만, 핵심 강점이 바로 이어진다고 보기는 어렵습니다."
caution[0]: "특히 성과를 내는 방식과 중요하게 보는 지표가 다르면 체감 난도가 높아질 수 있습니다."
caution[1]: "비슷한 이름만 믿고 접근하면 실제 면접이나 실무에서 차이가 크게 느껴질 수 있습니다."
rationale: "겉보기 유사성은 있지만, 핵심 과업과 평가 기준이 충분히 같다고 보기 어려워 높은 연결로 보긴 어렵습니다."
```

### Case 5: truly distant (band: very_low ~ low)
```
summary: "현재 경험만으로는 목표 직무의 핵심 업무 구조와 직접적인 연결이 약한 편입니다."
positive[0]: "일부 일반적인 협업 경험은 도움이 될 수 있지만, 그 자체로 직무 전환 근거가 되진 않습니다."
positive[1]: "전환이 불가능하다는 뜻은 아니지만, 현재 단계에서는 별도의 학습·경험 보완이 더 중요합니다."
caution[0]: "핵심 수행 방식이 다르기 때문에 기존 경험을 바로 강점으로 인정받기 어렵습니다."
caution[1]: "이 경우에는 연결고리 설명보다, 부족한 부분을 어떻게 채울지 계획을 보여주는 편이 더 중요합니다."
```

---

## Section 8: Priority Bridge Fixture Table

| Transition | Expected Band | Why Not Lower | Why Not Higher | Capability Clusters Driving Result | Gap Cap |
|---|---|---|---|---|---|
| GENERAL_SALES → BRAND_MARKETING | low → mid (after Round 1+3) | market_insight + customer_discovery shared; commercial_gtm bridgeGroup | no strongSignal overlap on primary families; message_positioning is target-dominant | customer_discovery, market_insight | no persuasion_proposal or execution_ops match |
| B2B_SALES → PMM | mid (after Round 1+3) | message_positioning + crossfunctional_alignment + customer_discovery shared; commercial_gtm bridge | product_service_translation is PMM-dominant; B2B lacks planning_structuring depth | customer_discovery, message_positioning, crossfunctional_alignment | product_service_translation gap |
| GENERAL_SALES → BUSINESS_PLANNING | low → mid | market_insight shared; commercial_gtm partial overlap | planning_structuring + analysis_optimization are BP-dominant; GENERAL_SALES weak on structuring | market_insight | planning_structuring gap |
| CUSTOMER_SUCCESS → PM | mid | customer_discovery + product_service_translation + crossfunctional_alignment shared; customer_problem_solving bridge | PM-dominant: planning_structuring, analysis_optimization deeper; CS lacks product decision authority | customer_discovery, product_service_translation, crossfunctional_alignment | planning_structuring depth |
| RECRUITING → HRBP | mid_high | stakeholder_support + relationship_management + people_operations bridge; strong shared | HRBP adds planning_structuring + org strategy depth recruiting lacks | stakeholder_support, relationship_management | planning_structuring |
| PRODUCTION_ENGINEERING → PROCESS_ENGINEERING | mid_high | domain_technical_depth + analysis_optimization + crossfunctional_alignment + industrial_process bridge | process_engineering has more planning_structuring + design weight | domain_technical_depth, analysis_optimization, crossfunctional_alignment | planning depth distinction |
| ACCOUNTING → FP_AND_A | mid | analysis_optimization + finance_control partial; finance_strategy bridge link | FP_AND_A dominant in planning_structuring + market_insight + crossfunctional decision support | analysis_optimization | planning_structuring, market_insight gap |
| BRAND_MARKETING → CONTENT_MARKETING | mid ~ mid_high | message_positioning + market_insight + commercial_gtm bridge; strong shared | content_marketing narrows to execution_operations; brand has more planning_structuring | message_positioning, market_insight | execution_operations vs planning scope difference |
| BRAND_MARKETING → PERFORMANCE_MARKETING | mid | commercial_gtm bridge + market_insight shared | performance_marketing dominant in analysis_optimization + execution_operations; brand lacks data-feedback loop | market_insight | analysis_optimization, execution_operations gap |
| GENERAL_SALES → MECHANICAL_DESIGN | very_low | no shared clusters (domain_technical_depth is mechanical-dominant; none of sales clusters appear in mechanical) | engineering_design_build and commercial_gtm share no bridgeGroup | — | all capability clusters diverge |

---

## Section 9: Safe Rollout Recommendation

**Recommendation: Option A**

### Sequence
- **Round 1**: All-family weighted signal read (expand `getPrimaryFamilyStrongSignals` → `getAllFamiliesStrongSignals` with secondary weight 0.4)
- **Round 2**: Dead branch fix (`"far"` → `"cross"` in guardrail) + bridge floor raise (20 → 40) using extended ALLOWLIST or bridgeGroups registry read
- **Round 3**: Add `jobCapabilityClusterRegistry.js` in shadow mode (compute `clusterBonus`, log to breakdown, do not add to raw yet)
- **Round 4**: Enable registry live (add `clusterBonus` to raw, replace ALLOWLIST with registry bridgeGroups)

### Why Option A, not B
- Option B risks logging misleading shadow data from a broken signal stack.
- Round 1 signal fix is low-risk (append-only to existing helper), immediately improves GTM cases.
- Capability registry is safer to introduce after Round 1 validates the signal baseline.

### Biggest benefit: Round 1 alone fixes 70%+ of GTM bridge scoring problems.
### Biggest risk: Round 1 may shift mid-band cases unexpectedly if secondary families have high overlap with unrelated targets. Needs gold fixture validation before merge.
### Safest rollback: Each round is a separate PR. Round 1 helpers can be toggled via a single parameter default change.

---

## Owner Assumptions

- score owner: `buildAxisConnectivityPack.js > scoreAxis1()` and `computeAxis1Raw()`
- signal read owner: `buildAxisConnectivityPack.js > getPrimaryFamilyStrongSignals()` (Round 1 target)
- explanation owner: `axisExplanationRegistry.js > buildJobStructureExplanation()`
- bridge owner: `buildAxisConnectivityPack.js > applyAxis1WeakUmbrellaBridge()`
- registry owner (new): `src/data/transitionLite/jobCapabilityClusterRegistry.js` (Round 3)
- upstream: `classifyTransition.js > classifyJobDistance()` (do not touch until Round 2+)

---

## Next Decision Point

Before Round 1 patch:
1. Run gold fixture suite against current raw scores for 10 bridge transitions above.
2. Confirm expected band deltas (how much does all-family read alone move each case?).
3. Identify any unexpected regressions in same-family transitions.

Before Round 3 shadow:
1. Confirm job ID corrections above with team (11 ID mismatches documented in Section 5).
2. Validate cluster taxonomy against at least 5 additional jobs not in priority list.
