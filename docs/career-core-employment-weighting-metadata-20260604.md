# Career Core Employment Weighting Metadata Adapter

## Purpose

This batch adds a pure Career Core utility for reading employment-type metadata from a raw label, a normalized employment type, or a classifier result object.

The adapter defines metadata only. It does not wire employment metadata into timeline calculation, CareerProfile calculation, scoring, database fields, API responses, or UI behavior.

## Why weightedExperienceMonths is not calculated yet

`weightedExperienceMonths` requires duration, overlap handling, gap mapping, leave/military interval rules, and short-tenure policy. This batch has only employment-type information, so calculating weighted months here would mix metadata lookup with timeline and profile logic.

Keeping this patch metadata-only allows downstream patches to consume stable metadata without changing CareerProfile behavior prematurely.

## Classifier and metadata adapter roles

`classifyEmploymentType()` normalizes raw employment labels and returns:

- `raw`
- `normalizedEmploymentType`
- `matchedLabel`
- classifier confidence and warnings

`getEmploymentTypeMetadata()` consumes either a raw label, a normalized type, or the classifier object and returns:

- experience/gap/signal flags
- experience weight
- short-tenure applicability metadata
- possible risk signals
- metadata application status flags
- warnings for unknown, missing, or ambiguous variant cases

## Normalized metadata vs label variant metadata

The adapter does not rely only on `normalizedEmploymentType`. Some fixture expectations differ inside the same normalized type. The adapter therefore uses `matchedLabel` from the classifier when label-level metadata is needed.

Variant-sensitive normalized types:

- `founder_or_self_employed`: self-employed labels use `business_scope_clarity_risk`; founder labels use `business_outcome_clarity_risk`.
- `gap`: career gap labels use `career_gap_risk`; career exploration labels use `career_direction_risk`.
- `project_contract`: outsourcing labels use `scope_clarity_risk`; project contract labels use `continuity_risk` and `scope_clarity_risk`.

Direct normalized input is still supported. When a normalized type needs variant context but no label is available, the adapter returns safe union metadata and an ambiguity warning where required.

## Supported metadataVariant values

- `full_time`
- `contract`
- `internship`
- `experience_internship`
- `conversion_internship`
- `dispatch`
- `freelance`
- `self_employed`
- `founder`
- `founder_or_self_employed`
- `part_time_job`
- `part_time`
- `outsourcing`
- `project_contract`
- `trainee`
- `bootcamp`
- `gap`
- `career_gap`
- `career_exploration`
- `military_service`
- `leave_of_absence`
- `unpaid_activity`
- `unknown`

## Metadata basis

The adapter follows `expectedEmploymentProfiles.js` as the source of truth.

| normalizedEmploymentType | experienceWeight | riskSignalsPossible |
| --- | ---: | --- |
| `full_time` | `1.0` | `[]` |
| `contract` | `0.85` | `["contract_continuity_risk"]` |
| `internship` | `0.4` | `[]` |
| `experience_internship` | `0.35` | `[]` |
| `conversion_internship` | `0.55` | `[]` |
| `dispatch` | `0.75` | `["employment_stability_risk"]` |
| `freelance` | `0.65` | `["scope_clarity_risk", "continuity_risk"]` |
| `founder_or_self_employed` | `"contextual"` | variant-based |
| `part_time` | `0.3` | `["depth_limit_risk"]` |
| `project_contract` | `0.6` | variant-based |
| `training` | `0` | `[]` |
| `gap` | `0` | variant-based |
| `military_service` | `0` | `[]` |
| `leave_of_absence` | `"contextual"` | `["availability_or_continuity_risk"]` |
| `unpaid_activity` | `"contextual_low"` | `["professional_depth_risk"]` |

## Unknown and missing handling

Missing input returns `normalizedEmploymentType: "unknown"`, `metadataVariant: "unknown"`, `riskSignalsPossible: ["employment_type_missing"]`, and `warnings: ["missing_employment_type"]`.

Unknown non-empty input returns `normalizedEmploymentType: "unknown"`, `metadataVariant: "unknown"`, `riskSignalsPossible: ["employment_type_unknown"]`, and `warnings: ["unknown_employment_type"]`.

## Application status

Every returned metadata object includes:

```js
metadataAppliedToTimeline: false
metadataAppliedToCareerProfile: false
```

These flags are always false in this batch. The metadata is comparable and testable, but it is not applied to timeline or CareerProfile calculations.

## Harness change

`scripts/qa-career-core-date-employment-baseline.js` now separates employment classifier and employment metadata results:

- classifier pass means raw label normalization matches the matrix.
- metadata pass means metadata lookup matches `expectedEmploymentProfiles.js`.
- metadata review remains because the metadata is not applied to timeline or CareerProfile.

Expected harness shape:

- Date matrix remains `36/36/0/36/0/0`.
- Date raw period parser remains `36/36`.
- Employment classifier becomes `20/20/20/0`.
- Employment metadata becomes `20/20/20/20/0`.
- Combined cases remain unsupported.
- Overall conclusion remains `REVIEW`.

## Verification result

Completed after this batch:

```powershell
node scripts/test-career-core-employment-metadata.js # PASS
node scripts/test-career-core-employment-type.js # PASS
node scripts/qa-career-core-date-employment-baseline.js # REVIEW, expected metadata pass/review
node scripts/test-career-core-period-parser.js # PASS
node scripts/test-career-core-timeline.js # PASS
node scripts/test-career-core-signals.js # PASS
node scripts/test-career-core-fit.js # PASS
node scripts/test-career-core-work-records-adapter.js # PASS
node scripts/qa-career-core-fit-real-cases.js # PASS
npm run build # FAIL: vite binary is not available in this fresh worktree
```

## Next patch candidates

1. employment-aware short tenure override
2. gap employment type mapping into timeline calculation
3. combined date + employment timeline adapter
4. weightedExperienceMonths calculation
5. project overlap dedup
6. leave/military special interval modeling
