# Career Core Employment-aware Short Tenure Override

## Purpose

This batch adds a pure utility for evaluating whether a short duration should become a short-tenure risk candidate after considering employment type metadata.

The utility only returns a risk decision candidate. It does not mutate CareerProfile risk signals and does not wire the result into timeline, scoring, UI, API, database, or deployment surfaces.

## Why duration alone is not enough

Duration-only short-tenure rules incorrectly flag cases such as internships, training, bootcamps, project work, military service, leave, and gaps. A 3-month internship or 4-month bootcamp is structurally different from a 5-month full-time job. The employment type must decide whether short tenure is applicable, contextual, or not applicable.

## Relationship to employment metadata

`evaluateShortTenureRisk()` uses `getEmploymentTypeMetadata()` when the caller provides a raw employment label or normalized type. It also accepts a precomputed `employmentTypeMetadata` object.

The utility reads:

- `normalizedEmploymentType`
- `metadataVariant`
- `riskSignalsPossible`

It then applies short-tenure policy without changing the metadata adapter or CareerProfile.

## shortTenureApplicable modes

### true

Applies to:

- `full_time`

If `durationMonthsInclusive < shortTenureThresholdMonths`, the utility returns:

- `shortTenureRisk: true`
- `riskSignalsPossible: ["short_tenure"]`
- `confidence: "high"`

### false

Applies to:

- `internship`
- `experience_internship`
- `conversion_internship`
- `training`
- `gap`
- `military_service`
- `leave_of_absence`

Short duration does not become a short-tenure risk. The utility returns explicit override reasons such as:

- `internship_not_short_tenure_applicable`
- `training_not_work_experience`
- `gap_not_employment_tenure`
- `military_service_not_general_employment_tenure`
- `leave_not_employment_tenure`

### contextual

Applies to:

- `contract`
- `dispatch`
- `freelance`
- `founder_or_self_employed`
- `part_time`
- `project_contract`
- `unpaid_activity`

If duration is short, the utility returns:

- `shortTenureRisk: "contextual"`
- metadata risk signals as `riskSignalsPossible`
- `overrideReason: "employment_type_contextual_short_tenure"`
- `confidence: "medium"`

It does not assert `short_tenure` for contextual employment types.

## Supported employment type decisions

| normalizedEmploymentType | decision |
| --- | --- |
| `full_time` | short tenure applicable |
| `contract` | contextual |
| `dispatch` | contextual |
| `freelance` | contextual |
| `founder_or_self_employed` | contextual |
| `part_time` | contextual |
| `project_contract` | contextual |
| `unpaid_activity` | contextual |
| `internship` | not applicable |
| `experience_internship` | not applicable |
| `conversion_internship` | not applicable |
| `training` | not applicable |
| `gap` | not applicable |
| `military_service` | not applicable |
| `leave_of_absence` | not applicable |

## Unknown and duration missing

Unknown employment type returns:

- `shortTenureApplicable: "unknown"`
- `shortTenureRisk: "unknown"`
- `overrideReason: "employment_type_unknown"`
- `confidence: "low"`

Missing or invalid duration returns:

- `isShortDuration: "unknown"`
- `shortTenureRisk: "unknown"`
- `overrideReason: "duration_missing"`
- `warnings: ["duration_missing"]`

## Application status

Every result includes:

```js
appliedToCareerProfile: false
```

This batch does not apply the decision to CareerProfile risk signals.

## Why it is not wired yet

Wiring this into CareerProfile or timeline would change user-facing risk output and requires separate handling for gap mapping, combined date/employment intervals, weighted experience months, overlap deduplication, and leave/military interval modeling.

## Harness change

`scripts/qa-career-core-date-employment-baseline.js` now reports:

- Employment classifier: `20/20/20/0`
- Employment metadata: `20/20/20/20/0`
- Employment short tenure override: `20/20/20/20/0`

The harness conclusion remains `REVIEW` because the override is comparable and verified, but not applied to timeline or CareerProfile.

## Verification result

Completed after this batch:

```powershell
node scripts/test-career-core-short-tenure-risk.js # PASS
node scripts/test-career-core-employment-metadata.js # PASS
node scripts/test-career-core-employment-type.js # PASS
node scripts/qa-career-core-date-employment-baseline.js # REVIEW, expected
node scripts/test-career-core-period-parser.js # PASS
node scripts/test-career-core-timeline.js # PASS
node scripts/test-career-core-signals.js # PASS
node scripts/test-career-core-fit.js # PASS
node scripts/test-career-core-work-records-adapter.js # PASS
node scripts/qa-career-core-fit-real-cases.js # PASS
npm run build # FAIL: vite binary is not available in this fresh worktree
```

## Next patch candidates

1. gap employment type mapping into timeline calculation
2. combined date + employment timeline adapter
3. weightedExperienceMonths calculation
4. project overlap dedup
5. leave/military special interval modeling
