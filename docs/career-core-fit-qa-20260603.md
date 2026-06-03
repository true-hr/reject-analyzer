# Career Core Fit v0 QA - 2026-06-03

## QA purpose

Validate that the merged Career Analysis Core v0 fit layer behaves plausibly on synthetic ResumeProfile and target combinations before connecting it to product surfaces. This QA uses deterministic sample data only and does not call AI, APIs, UI, DB, or deployment paths.

## Command

```bash
node scripts/qa-career-core-fit-real-cases.js
```

## Summary table

| case id | target | expected | actual primaryFitLevel | direct | adjacent | transferable | unrelated | unknown | judgment |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| qa-fit-001-pm-saas-aligned | product_planning_pm / b2b_saas | High direct relevance for PM and B2B SaaS. | direct | 30 | 0 | 0 | 0 | 0 | PASS |
| qa-fit-002-ops-to-pm | product_planning_pm / b2b_saas | Adjacent or transferable should dominate. | transferable | 0 | 0 | 36 | 0 | 0 | PASS |
| qa-fit-003-bio-quality-to-pm-saas | product_planning_pm / b2b_saas | Direct should not appear; unrelated or transferable should dominate. | transferable | 0 | 0 | 48 | 0 | 0 | REVIEW |
| qa-fit-004-bio-quality-aligned | production_quality / bio_pharma | High direct relevance for production quality and bio pharma. | direct | 42 | 0 | 0 | 0 | 0 | PASS |
| qa-fit-005-career-content-education | marketing_growth / career_education | Industry direct, role marketing or transferable. | direct | 36 | 0 | 0 | 0 | 0 | PASS |
| qa-fit-006-data-assist-to-pm | product_planning_pm / b2b_saas | Adjacent or transferable should dominate. | transferable | 0 | 0 | 24 | 0 | 0 | REVIEW |
| qa-fit-007-insufficient-info | product_planning_pm / b2b_saas | Unknown should dominate and direct should not appear. | unknown | 0 | 0 | 0 | 0 | 12 | PASS |
| qa-fit-008-mixed-career | product_planning_pm / b2b_saas | Duration sum should be 84 months; PM direct, operations adjacent or transferable, production not direct for PM/SaaS. | transferable | 24 | 0 | 60 | 0 | 0 | PASS |

## Case notes

- `qa-fit-001-pm-saas-aligned`: PM/SaaS direct fit is correctly detected.
- `qa-fit-002-ops-to-pm`: operations work is classified as transferable, which is acceptable for v0 but may be slightly conservative compared with adjacent.
- `qa-fit-003-bio-quality-to-pm-saas`: no direct false positive, but production quality is classified as transferable rather than unrelated because process improvement and operations-adjacent cues are strong.
- `qa-fit-004-bio-quality-aligned`: bio production quality direct fit is correctly detected.
- `qa-fit-005-career-content-education`: career education industry and marketing role fit are correctly direct.
- `qa-fit-006-data-assist-to-pm`: data analytics support is transferable overall, which is plausible for v0. The role sub-score is direct because the sample mentions product metrics, so this needs review before product copy uses role-level labels.
- `qa-fit-007-insufficient-info`: unknown dominates as expected.
- `qa-fit-008-mixed-career`: total classified months is 84 by experience duration sum. PM is direct, while operations and production quality are transferable.

## Found issue types

| type | observation | severity |
| --- | --- | --- |
| keyword 부족 | v0 only recognizes the small merged catalog, so cases outside PM, operations, data, marketing, production quality, bio, SaaS, cosmetics, and career education will often fall to unknown or broad transferable. | P1 |
| 너무 후한 direct 판정 | No overall direct false positives were found. However, the data support case gets a role direct sub-score from broad product-metric wording while overall remains transferable. | P1 |
| transferable 기준 애매함 | Bio production quality to PM/SaaS becomes transferable rather than unrelated because process/operations strength signals are treated as portable. This is defensible but needs product wording care. | P1 |
| industry adjacency 부족 | Only small adjacency maps exist. Manufacturing, platform, commerce, and other map-only labels are not fully catalog-backed, which limits real-world coverage. | P1 |
| role/industry 결합 규칙 조정 필요 | Mixed career output can read as "5 years transferable + 2 years direct" for PM/SaaS. This may be useful, but product copy should not overstate transferable months as directly relevant years. | P2 |

## Next patch priorities

- P0: No obvious P0 wrong classification found in the eight synthetic QA cases.
- P1: Expand taxonomy and keyword coverage for industry domains and role families before broad product rollout.
- P1: Calibrate transferable vs unrelated for domain-distant roles, especially production quality to PM/SaaS.
- P2: Add product-facing copy rules that separate direct months from transferable months.
- P2: Add more mixed-career fixtures with overlapping dates once unique de-overlapped month aggregation is planned.

## Connection recommendation

Connect this first to JD-tailored resume work, not rejection analysis or asset map. The current output is best suited for explaining which experiences to emphasize for a target JD. Rejection analysis needs stricter risk calibration, and asset map / AI Inbox should wait until taxonomy breadth and product copy rules are clearer.
