# Phase 3B QA Notes

## Pass

- All new job ids follow `JOB_` prefix, uppercase, and underscore rules.
- All new industry ids follow `IND_` prefix, uppercase, and underscore rules.
- Every new job item contains required fields from `JOB_SSOT_MIN_SCHEMA.md`.
- Every new industry item contains required fields from `INDUSTRY_SSOT_MIN_SCHEMA.md`.
- All new job items include at least three axes.
- All new job items include boundary hints and adjacent families.
- All new industry items include proof signals, adjacent industries, and job interaction hints.

## Weak

- Same-family boundary writing still appears in PM, DATA, and SALES clusters because nearby sub-roles share the same family.
- Industry coverage is still limited to procurement/scm source material.
- Procurement bias is reduced from the pilot by adding planning, cost, and risk contexts, but not fully eliminated at the source level.

## Follow-Up Needed

- Lock a more explicit rule for same-family boundary hints before expanding more PM and SALES items.
- Lock a policy for source-family versus canonical-major conflicts before normalizing more strategy/procurement bridge roles.
- Decide whether future industry expansion requires a broader source than `domainTaxonomy.js`.

