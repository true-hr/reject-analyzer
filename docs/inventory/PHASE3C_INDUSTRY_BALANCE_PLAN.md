# Phase 3C Industry Balance Plan

## Batch Scope Principles

- This batch is industry-first and exists to reduce the procurement-heavy skew left by Phase 3A and Phase 3B.
- No new job ontology files are added in this batch.
- Primary industry source `src/lib/semantic/taxonomy/domainTaxonomy.js` does not provide non-procurement market families.
- For balance correction, this batch uses `src/lib/decision/roleOntology/domainTextMap.js` as an auxiliary broad-market source.
- The generated items are still append-only normalized assets and remain disconnected from analyzer, decision, simulation, UI, and any lookup layer.

## Industry Candidates To Add

- `B2B_SAAS`
- `ENTERPRISE_SOLUTIONS`
- `RETAIL_COMMERCE`
- `CONSUMER_BRAND`

## Selection Reasons

### `B2B_SAAS`

- Strong match for `JOB_PMO_PROGRAM_MANAGER`, `JOB_PROJECT_MANAGER_DELIVERY`, `JOB_GROWTH_PM`, `JOB_ACCOUNT_EXECUTIVE_AE`, `JOB_CUSTOMER_SUCCESS_CS`, and `JOB_PARTNERSHIP_BD`.
- Also provides a reasonable platform context for `JOB_DATA_ENGINEER_DE`.

### `ENTERPRISE_SOLUTIONS`

- Strong match for `JOB_ACCOUNT_EXECUTIVE_AE`, `JOB_PARTNERSHIP_BD`, `JOB_SALES_ENGINEER_SE`, and program/delivery roles.
- Adds a non-procurement B2B solution context missing from current registry.

### `RETAIL_COMMERCE`

- Strong match for `JOB_GROWTH_PM`, `JOB_PERFORMANCE_MARKETER`, `JOB_BRAND_MARKETER`, and `JOB_DATA_ANALYST_BI`.
- Adds a clear commerce operating context that the current procurement registry does not cover.

### `CONSUMER_BRAND`

- Strong match for `JOB_BRAND_MARKETER`, `JOB_PERFORMANCE_MARKETER`, and growth-oriented PM work.
- Adds a market-facing brand context distinct from B2B platform and procurement environments.

## Excluded Candidates And Reasons

- `HR_VERTICAL_DOMAINS` entries in `src/lib/semantic/taxonomy/hrTaxonomy.js`
  - Excluded because they are vertical semantic domains rather than broad industry balance items for the current job batch.
- Additional procurement/scm entries
  - Excluded because this batch exists to reduce, not deepen, procurement skew.
- New invented platform or IT-service families outside the existing source
  - Excluded because this batch must stay source-grounded.

## Batch Coverage Intent

- `B2B_SAAS`: PM, SALES, DATA, CUSTOMER lifecycle
- `ENTERPRISE_SOLUTIONS`: SALES, BD, delivery, technical-solution context
- `RETAIL_COMMERCE`: GROWTH, PERFORMANCE, DATA, commerce operations
- `CONSUMER_BRAND`: BRAND, PERFORMANCE, campaign-oriented market context

## Naming Rules

- Canonical ids follow `CANONICAL_ID_RULES.md`.
- Industry ids use `IND_` prefix.
- Labels are readable industry/context names, not source family keys.
- Source family names are preserved in aliases or manifest notes when needed.

## SummaryTemplate Rules

- `oneLiner`: concise context definition
- `expectationFocus`: evidence this context expects from jobs
- `riskFocus`: what makes the fit look generic or shallow

## jobInteractionHints Rules

- Each item must include at least three concrete job families.
- Each hint must explain why that family matters in the context, not only mention it.
- Prefer representative job families already expanded in Phase 3A and 3B.

## proofSignals Rules

- Use source-grounded market or context evidence.
- Avoid repeating job responsibilities as proof signals.
- Prefer customer model, revenue model, buying motion, or delivery context clues.

