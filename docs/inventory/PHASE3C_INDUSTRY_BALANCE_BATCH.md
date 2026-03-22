# Phase 3C Industry Balance Batch

## Generated Industry Files

- `src/data/industry/registry/IND_SOFTWARE_B2B_SAAS.js`
- `src/data/industry/registry/IND_ENTERPRISE_SOLUTIONS.js`
- `src/data/industry/registry/IND_RETAIL_COMMERCE.js`
- `src/data/industry/registry/IND_CONSUMER_BRAND.js`

## Canonical IDs

- `IND_SOFTWARE_B2B_SAAS`
- `IND_ENTERPRISE_SOLUTIONS`
- `IND_RETAIL_COMMERCE`
- `IND_CONSUMER_BRAND`

## Source Origin

| canonical id | source origin |
|---|---|
| `IND_SOFTWARE_B2B_SAAS` | `src/lib/decision/roleOntology/domainTextMap.js` `family: "B2B_SAAS"` |
| `IND_ENTERPRISE_SOLUTIONS` | `src/lib/decision/roleOntology/domainTextMap.js` `family: "ENTERPRISE_SOLUTIONS"` |
| `IND_RETAIL_COMMERCE` | `src/lib/decision/roleOntology/domainTextMap.js` `family: "RETAIL_COMMERCE"` |
| `IND_CONSUMER_BRAND` | `src/lib/decision/roleOntology/domainTextMap.js` `family: "CONSUMER_BRAND"` |

## Major / Sub Mapping

| canonical id | major | sub |
|---|---|---|
| `IND_SOFTWARE_B2B_SAAS` | `SOFTWARE` | `B2B_SAAS` |
| `IND_ENTERPRISE_SOLUTIONS` | `ENTERPRISE` | `SOLUTIONS` |
| `IND_RETAIL_COMMERCE` | `RETAIL` | `COMMERCE` |
| `IND_CONSUMER_BRAND` | `CONSUMER` | `BRAND` |

## Connected Job Families Or Representative Jobs

| canonical id | representative job families / jobs |
|---|---|
| `IND_SOFTWARE_B2B_SAAS` | `PM`, `SALES`, `DATA` / `JOB_GROWTH_PM`, `JOB_ACCOUNT_EXECUTIVE_AE`, `JOB_CUSTOMER_SUCCESS_CS`, `JOB_DATA_ENGINEER_DE` |
| `IND_ENTERPRISE_SOLUTIONS` | `SALES`, `PM`, `DATA` / `JOB_ACCOUNT_EXECUTIVE_AE`, `JOB_PARTNERSHIP_BD`, `JOB_PROJECT_MANAGER_DELIVERY` |
| `IND_RETAIL_COMMERCE` | `MARKETING`, `PM`, `DATA` / `JOB_PERFORMANCE_MARKETER`, `JOB_BRAND_MARKETER`, `JOB_GROWTH_PM` |
| `IND_CONSUMER_BRAND` | `MARKETING`, `PM`, `SALES` / `JOB_BRAND_MARKETER`, `JOB_PERFORMANCE_MARKETER`, `JOB_PARTNERSHIP_BD` |

## proofSignals Summary

- `IND_SOFTWARE_B2B_SAAS`: subscription, enterprise SaaS buying motion, release cadence, adoption/renewal context
- `IND_ENTERPRISE_SOLUTIONS`: enterprise buying, solution proposal, multi-stakeholder evaluation, implementation motion
- `IND_RETAIL_COMMERCE`: transaction and conversion context, merchandising cadence, campaign-performance linkage
- `IND_CONSUMER_BRAND`: brand positioning, launch motion, consumer-facing campaign logic, demand creation

## jobInteractionHints Summary

- `IND_SOFTWARE_B2B_SAAS`: PM / SALES / DATA
- `IND_ENTERPRISE_SOLUTIONS`: SALES / PM / DATA
- `IND_RETAIL_COMMERCE`: MARKETING / PM / DATA
- `IND_CONSUMER_BRAND`: MARKETING / PM / SALES

## Procurement Bias Correction Role

- This batch adds broad market and operating contexts that were absent from the procurement-heavy registry.
- It does not replace procurement assets.
- It gives Phase 3 registry examples for software subscription, enterprise solution motion, commerce operation, and consumer brand context.

## Remaining Coverage Gaps

- HR vertical industry/context remains unnormalized.
- Manufacturing broad industry outside procurement-linked material context remains unnormalized.
- Finance / securities / insurance style broad market context remains unnormalized.
- Healthcare / public sector / regulated verticals remain unnormalized.
- The new balance items come from an auxiliary source, so a stronger primary broad-industry source is still desirable.

