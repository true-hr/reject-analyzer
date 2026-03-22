# Phase 3B Normalized Batch

## Generated Job Files

- `src/data/job/ontology/JOB_PMO_PROGRAM_MANAGER.js`
- `src/data/job/ontology/JOB_PROJECT_MANAGER_DELIVERY.js`
- `src/data/job/ontology/JOB_GROWTH_PM.js`
- `src/data/job/ontology/JOB_DATA_SCIENTIST_DS.js`
- `src/data/job/ontology/JOB_DATA_ENGINEER_DE.js`
- `src/data/job/ontology/JOB_ACCOUNT_EXECUTIVE_AE.js`
- `src/data/job/ontology/JOB_CUSTOMER_SUCCESS_CS.js`
- `src/data/job/ontology/JOB_PARTNERSHIP_BD.js`
- `src/data/job/ontology/JOB_PERFORMANCE_MARKETER.js`
- `src/data/job/ontology/JOB_BRAND_MARKETER.js`

## Generated Industry Files

- `src/data/industry/registry/IND_PROCUREMENT_CATEGORY_MANAGEMENT.js`
- `src/data/industry/registry/IND_PROCUREMENT_DIRECT_PROCUREMENT.js`
- `src/data/industry/registry/IND_PROCUREMENT_INDIRECT_PROCUREMENT.js`
- `src/data/industry/registry/IND_PROCUREMENT_COST_MANAGEMENT.js`
- `src/data/industry/registry/IND_PROCUREMENT_SCM_PLANNING.js`
- `src/data/industry/registry/IND_PROCUREMENT_SUPPLY_RISK.js`

## Canonical IDs

### Job

- `JOB_PMO_PROGRAM_MANAGER`
- `JOB_PROJECT_MANAGER_DELIVERY`
- `JOB_GROWTH_PM`
- `JOB_DATA_SCIENTIST_DS`
- `JOB_DATA_ENGINEER_DE`
- `JOB_ACCOUNT_EXECUTIVE_AE`
- `JOB_CUSTOMER_SUCCESS_CS`
- `JOB_PARTNERSHIP_BD`
- `JOB_PERFORMANCE_MARKETER`
- `JOB_BRAND_MARKETER`

### Industry

- `IND_PROCUREMENT_CATEGORY_MANAGEMENT`
- `IND_PROCUREMENT_DIRECT_PROCUREMENT`
- `IND_PROCUREMENT_INDIRECT_PROCUREMENT`
- `IND_PROCUREMENT_COST_MANAGEMENT`
- `IND_PROCUREMENT_SCM_PLANNING`
- `IND_PROCUREMENT_SUPPLY_RISK`

## Source Origin

### Job

| canonical id | source origin |
|---|---|
| `JOB_PMO_PROGRAM_MANAGER` | `src/lib/roleDictionary.js` `role: "pmo_program_manager"` |
| `JOB_PROJECT_MANAGER_DELIVERY` | `src/lib/roleDictionary.js` `role: "project_manager_delivery"` |
| `JOB_GROWTH_PM` | `src/lib/roleDictionary.js` `role: "growth_pm"` |
| `JOB_DATA_SCIENTIST_DS` | `src/lib/roleDictionary.js` `role: "data_scientist_ds"` |
| `JOB_DATA_ENGINEER_DE` | `src/lib/roleDictionary.js` `role: "data_engineer_de"` |
| `JOB_ACCOUNT_EXECUTIVE_AE` | `src/lib/roleDictionary.js` `role: "account_executive_ae"` |
| `JOB_CUSTOMER_SUCCESS_CS` | `src/lib/roleDictionary.js` `role: "customer_success_cs"` |
| `JOB_PARTNERSHIP_BD` | `src/lib/roleDictionary.js` `role: "partnership_bd"` |
| `JOB_PERFORMANCE_MARKETER` | `src/lib/roleDictionary.js` `role: "performance_marketer"` |
| `JOB_BRAND_MARKETER` | `src/lib/roleDictionary.js` `role: "brand_marketer"` |

### Industry

| canonical id | source origin |
|---|---|
| `IND_PROCUREMENT_CATEGORY_MANAGEMENT` | `src/lib/semantic/taxonomy/domainTaxonomy.js` `domain: "category_management"` |
| `IND_PROCUREMENT_DIRECT_PROCUREMENT` | `src/lib/semantic/taxonomy/domainTaxonomy.js` `domain: "direct_procurement"` |
| `IND_PROCUREMENT_INDIRECT_PROCUREMENT` | `src/lib/semantic/taxonomy/domainTaxonomy.js` `domain: "indirect_procurement"` |
| `IND_PROCUREMENT_COST_MANAGEMENT` | `src/lib/semantic/taxonomy/domainTaxonomy.js` `domain: "cost_management"` |
| `IND_PROCUREMENT_SCM_PLANNING` | `src/lib/semantic/taxonomy/domainTaxonomy.js` `domain: "scm_planning"` |
| `IND_PROCUREMENT_SUPPLY_RISK` | `src/lib/semantic/taxonomy/domainTaxonomy.js` `domain: "supply_risk"` |

## Major / Sub Mapping

### Job

| canonical id | major | sub |
|---|---|---|
| `JOB_PMO_PROGRAM_MANAGER` | `PM` | `PMO_PROGRAM_MANAGER` |
| `JOB_PROJECT_MANAGER_DELIVERY` | `PM` | `PROJECT_MANAGER_DELIVERY` |
| `JOB_GROWTH_PM` | `PM` | `GROWTH_PM` |
| `JOB_DATA_SCIENTIST_DS` | `DATA` | `DATA_SCIENTIST_DS` |
| `JOB_DATA_ENGINEER_DE` | `DATA` | `DATA_ENGINEER_DE` |
| `JOB_ACCOUNT_EXECUTIVE_AE` | `SALES` | `ACCOUNT_EXECUTIVE_AE` |
| `JOB_CUSTOMER_SUCCESS_CS` | `SALES` | `CUSTOMER_SUCCESS_CS` |
| `JOB_PARTNERSHIP_BD` | `SALES` | `PARTNERSHIP_BD` |
| `JOB_PERFORMANCE_MARKETER` | `MARKETING` | `PERFORMANCE_MARKETER` |
| `JOB_BRAND_MARKETER` | `MARKETING` | `BRAND_MARKETER` |

### Industry

| canonical id | major | sub |
|---|---|---|
| `IND_PROCUREMENT_CATEGORY_MANAGEMENT` | `PROCUREMENT` | `CATEGORY_MANAGEMENT` |
| `IND_PROCUREMENT_DIRECT_PROCUREMENT` | `PROCUREMENT` | `DIRECT_PROCUREMENT` |
| `IND_PROCUREMENT_INDIRECT_PROCUREMENT` | `PROCUREMENT` | `INDIRECT_PROCUREMENT` |
| `IND_PROCUREMENT_COST_MANAGEMENT` | `PROCUREMENT` | `COST_MANAGEMENT` |
| `IND_PROCUREMENT_SCM_PLANNING` | `PROCUREMENT` | `SCM_PLANNING` |
| `IND_PROCUREMENT_SUPPLY_RISK` | `PROCUREMENT` | `SUPPLY_RISK` |

## Fields Added Or Strengthened

### Job

- `label`
- `aliases`
- `families`
- `roles`
- `axes`
- `adjacentFamilies`
- `boundaryHints`
- `summaryTemplate`
- optional:
  - `strongSignals`
  - `mediumSignals`
  - `boundarySignals`
  - `domainHints`
  - `proofStyleHints`
  - `outputArtifacts`
  - `seniorityHints`

### Industry

- `label`
- `aliases`
- `marketType`
- `operatingRhythm`
- `decisionStructure`
- `proofSignals`
- `domainIntensity`
- `adjacentIndustries`
- `jobInteractionHints`
- `summaryTemplate`

## Fields Still Thin Or Follow-Up Worthy

- Industry optional fields are still intentionally omitted in this batch.
- Several job items still use same-family boundary movement to distinguish close neighbors inside PM, DATA, and SALES.
- Industry coverage is broader than the pilot but still constrained to procurement/scm source material.
- STRATEGY and unresolved ops/procurement bridge roles were left for a later batch because policy was not stable enough.

## Rules Tightened Compared To Pilot

- `summaryTemplate` tone was made more uniform across all new job items.
- `axes` now consistently separate three interpretation dimensions per item.
- `adjacentFamilies` aim to include at least one realistic confusion point from the source inventory.
- Industry items were selected to reduce pure vendor/commercial repetition and cover planning, cost, and risk contexts.
- `jobInteractionHints` were written to emphasize why a job-family signal matters in the selected domain, not only that it appears.

## Common Gaps Observed In The Batch

- Source role keys remain much narrower than normalized labels and boundaries.
- Same-family boundary writing is still harder than cross-family boundary writing.
- Procurement/scm remains the only strong industry/domain source, so industry coverage is structurally uneven.
- Roles with finance/strategy or ops/procurement overlap still need a policy-first batch.

## Next Areas To Strengthen

- Resolve STRATEGY versus FINANCE versus BIZOPS normalization policy.
- Add one more marketing cluster after locking content/PR boundary rules.
- Add one more sales cluster after locking AE/SE/CS/BD same-family boundary style.
- Decide whether procurement/scm should stay as industry registry, function-domain registry, or dual-track assets.

