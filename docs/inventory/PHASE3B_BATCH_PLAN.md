# Phase 3B Batch Plan

## Batch Scope Principles

- This batch expands normalized assets without connecting them to analyzer, decision, simulation, UI, or any lookup layer.
- Job normalization is the primary scope.
- Industry normalization is limited to domains that frequently interact with the selected jobs.
- This batch is append-only and does not rewrite legacy ontology files.
- This batch aims for a reusable template, not full coverage.

## Jobs Selected For This Batch

- `pmo_program_manager`
- `project_manager_delivery`
- `growth_pm`
- `data_scientist_ds`
- `data_engineer_de`
- `account_executive_ae`
- `customer_success_cs`
- `partnership_bd`
- `performance_marketer`
- `brand_marketer`

## Industries Selected For This Batch

- `category_management`
- `direct_procurement`
- `indirect_procurement`
- `cost_management`
- `scm_planning`
- `supply_risk`

## Selection Reasons

### Job Selection

- The selected jobs have comparatively clear role keys in `src/lib/roleDictionary.js`.
- Their families are already present in the source and do not require a major redesign of the family system.
- They extend the pilot across PM, DATA, SALES, and MARKETING without overreaching into unresolved support/admin clusters.
- They are suitable for the Phase 3A normalized template: label, aliases, axes, adjacentFamilies, boundaryHints, and summaryTemplate can be added without redefining the source ontology.

### Industry Selection

- The selected industry/domain items come directly from `src/lib/semantic/taxonomy/domainTaxonomy.js`.
- They broaden the prior pilot beyond vendor/commercial analytics into planning, cost, and risk contexts.
- They remain limited to the procurement/scm source scope instead of inventing unsupported industries.
- They are sufficient to exercise job interaction hints across PROCUREMENT, DATA, SALES, PM, and STRATEGY-adjacent contexts.

## Excluded Items And Reasons

### Jobs Excluded

- `growth_marketer`
  - Deferred because the growth boundary overlaps with `growth_pm` and `performance_marketer`; better handled after one more naming pass.
- `content_marketer`
  - Deferred because content production requires a slightly different artifact/proof pattern than the first batch template.
- `pr_communications`
  - Deferred because PR and brand/communications boundaries need a clearer adjacent family rule.
- `planning_budget_control`
  - Deferred because the boundary between STRATEGY and FINANCE needs a locked policy first.
- `finance_strategy_fpa`
  - Deferred for the same reason: canonical major and family interpretation need a policy before batch normalization.
- `bizops_ops_strategy`
  - Deferred because it is broad and likely needs a dedicated bizops rule.
- `srm_vendor_mgmt`
  - Deferred because it overlaps directly with procurement vendor domains and would benefit from a post-policy batch.
- `supply_chain_scm`
  - Deferred because the role is broad and overlaps with planning, logistics, and risk.

### Industries Excluded

- `strategic_sourcing`
- `vendor_management`
- `contract_commercial`
- `purchasing_analytics`
- `manufacturing_materials`
  - Already covered in the pilot.
- `inventory_logistics`
  - Deferred because the boundary between operating context and industry registry remains wide.

## Naming Rules For This Batch

- Canonical ids follow `CANONICAL_ID_RULES.md`.
- Job ids use `JOB_` prefix.
- Industry ids use `IND_` prefix.
- Labels are readable names, not source keys.
- Aliases are search helpers only and do not replace the canonical id.

## SummaryTemplate Rules

### Job

- `oneLiner`: concise role definition
- `strengthFocus`: strongest interpretation axis
- `riskFocus`: failure mode when the boundary evidence is weak

### Industry

- `oneLiner`: concise domain/industry definition
- `expectationFocus`: what this context expects as evidence
- `riskFocus`: what makes the fit look shallow or generic

## Boundary And Adjacency Rules

- `adjacentFamilies` must include at least two meaningful neighboring families.
- At least one adjacent family should reflect a realistic confusion point from the source inventory.
- `boundaryHints` must describe an actual interpretation shift, not generic wording.
- `jobInteractionHints` must name a concrete `jobFamily` and explain why the interaction matters in that domain.

