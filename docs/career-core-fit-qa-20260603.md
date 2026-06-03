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
| qa-fit-003-bio-quality-to-pm-saas | product_planning_pm / b2b_saas | Direct should not appear; unrelated or transferable should dominate. | unrelated | 0 | 0 | 0 | 48 | 0 | PASS |
| qa-fit-004-bio-quality-aligned | production_quality / bio_pharma | High direct relevance for production quality and bio pharma. | direct | 42 | 0 | 0 | 0 | 0 | PASS |
| qa-fit-005-career-content-education | marketing_growth / career_education | Industry direct, role marketing or transferable. | direct | 36 | 0 | 0 | 0 | 0 | PASS |
| qa-fit-006-data-assist-to-pm | product_planning_pm / b2b_saas | Adjacent or transferable should dominate. | transferable | 0 | 0 | 24 | 0 | 0 | PASS |
| qa-fit-007-insufficient-info | product_planning_pm / b2b_saas | Unknown should dominate and direct should not appear. | unknown | 0 | 0 | 0 | 0 | 12 | PASS |
| qa-fit-008-mixed-career | product_planning_pm / b2b_saas | Duration sum should be 84 months; PM direct, operations adjacent or transferable, production not direct for PM/SaaS. | transferable | 24 | 0 | 36 | 24 | 0 | PASS |

## Case notes

- `qa-fit-001-pm-saas-aligned`: PM/SaaS direct fit is correctly detected.
- `qa-fit-002-ops-to-pm`: operations work is classified as transferable, which is acceptable for v0 but may be slightly conservative compared with adjacent.
- `qa-fit-003-bio-quality-to-pm-saas`: no direct false positive. After calibration, production quality and bio pharma evidence resolves to unrelated for PM/SaaS instead of transferable.
- `qa-fit-004-bio-quality-aligned`: bio production quality direct fit is correctly detected.
- `qa-fit-005-career-content-education`: career education industry and marketing role fit are correctly direct.
- `qa-fit-006-data-assist-to-pm`: data analytics support is adjacent at role level and transferable overall, which is plausible for v0.
- `qa-fit-007-insufficient-info`: unknown dominates as expected.
- `qa-fit-008-mixed-career`: total classified months is 84 by experience duration sum. PM is direct, operations is transferable, and production quality is unrelated for PM/SaaS.

## Calibration note

The 2026-06-03 fit calibration pass addressed both REVIEW cases from the initial QA:

- Bio production quality to PM/SaaS changed from `transferable` to `unrelated` at overall level when the experience is centered on `production_quality` + `bio_pharma` and lacks B2B SaaS target evidence.
- Data analysis support to PM/SaaS changed from role `direct` to role `adjacent` when evidence contains broad product/metric/dashboard/report wording but lacks stronger PM signals such as PM, Product Manager, roadmap, requirements, service planning, or equivalent Korean planning terms.

Remaining caution: role and industry sub-scores can still be broader than product-facing copy should expose directly. Product surfaces should lead with overall fit and explain direct months separately from transferable months.

## Found issue types

| type | observation | severity |
| --- | --- | --- |
| keyword 부족 | v0 only recognizes the small merged catalog, so cases outside PM, operations, data, marketing, production quality, bio, SaaS, cosmetics, and career education will often fall to unknown or broad transferable. | P1 |
| 너무 후한 direct 판정 | The sampled broad product-metric data support case no longer receives role direct after calibration. Continue monitoring real-user samples. | P2 |
| transferable 기준 애매함 | Bio production quality to PM/SaaS no longer upgrades to transferable from strength/process cues alone. Similar distant-domain combinations still need more QA coverage. | P2 |
| industry adjacency 부족 | Only small adjacency maps exist. Manufacturing, platform, commerce, and other map-only labels are not fully catalog-backed, which limits real-world coverage. | P1 |
| role/industry 결합 규칙 조정 필요 | Mixed career output can read as "5 years transferable + 2 years direct" for PM/SaaS. This may be useful, but product copy should not overstate transferable months as directly relevant years. | P2 |

## Next patch priorities

- P0: No obvious P0 wrong classification found in the eight synthetic QA cases after calibration.
- P1: Expand taxonomy and keyword coverage for industry domains and role families before broad product rollout.
- P2: Add product-facing copy rules that separate direct months from transferable months.
- P2: Add more mixed-career fixtures with overlapping dates once unique de-overlapped month aggregation is planned.

## Connection recommendation

Connect this first to JD-tailored resume work, not rejection analysis or asset map. The current output is best suited for explaining which experiences to emphasize for a target JD. Rejection analysis needs stricter risk calibration, and asset map / AI Inbox should wait until taxonomy breadth and product copy rules are clearer.
