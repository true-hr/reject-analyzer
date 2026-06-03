# Career Core Gap Employment Timeline Mapping

## Purpose

This batch adds a pure Career Core utility for mapping explicit employment-type gap intervals into a structured employment timeline representation.

The utility is intentionally narrow. It recognizes explicit gap employment labels such as `공백`, `경력 공백`, `gap`, `진로탐색`, and `career exploration`, then marks those intervals as gap intervals that should not count as work experience.

This batch does not wire the result into `analyzeCareerTimeline()`, CareerProfile, scoring, UI, API, database, or deployment surfaces.

## Why this comes before the combined timeline adapter

The combined date + employment adapter will eventually need to preserve all employment intervals, calculate weighted months, deduplicate overlaps, model leave/military intervals, and update CareerProfile-level summaries.

Before doing that, explicit gap intervals must be proven separately. Otherwise a resume row like:

```text
2019.08 ~ 2020.12 / 공백
2021.01 ~ 2021.12 / 계약직
2022.01 ~ 2024.06 / 정규직
```

could be incorrectly counted as 59 months of experience instead of 42 work months plus 17 explicit gap months.

## Added utility

File:

```text
src/lib/career-core/mapGapEmploymentTimeline.js
```

Export:

```js
mapGapEmploymentTimeline(input, options = {})
```

Input forms:

```js
mapGapEmploymentTimeline({
  company: "잡커넥트",
  roles: [
    { title: "개인 사유 공백", period: "2019.08 ~ 2020.12", employmentType: "공백" },
    { title: "채용 운영 계약직", period: "2021.01 ~ 2021.12", employmentType: "계약직" },
    { title: "채용 운영 담당자", period: "2022.01 ~ 2024.06", employmentType: "정규직" }
  ]
})
```

The utility also accepts fixture-shaped inputs that contain `resumeInput.roles`.

## Design

Each role is parsed through existing foundation utilities:

- `parseCareerPeriod()` for dates and inclusive duration
- `getEmploymentTypeMetadata()` for countsAsExperience/countsAsGap/countsAsSignal
- `evaluateShortTenureRisk()` for non-applied short tenure candidate status

The returned interval contains:

- `normalizedEmploymentType`
- `metadataVariant`
- `startMonth`
- `endMonth`
- `durationMonths`
- `timelineKind`
- `countsAsExperience`
- `countsAsGap`
- `countsAsSignal`
- `gapMonths`
- `experienceMonths`
- `mappedToTimeline: false`
- `mappedToCareerProfile: false`

## Explicit gap mapping rules

If employment metadata says `countsAsGap === true`, the interval is mapped as:

```js
{
  timelineKind: "gap",
  countsAsExperience: false,
  countsAsGap: true,
  gapMonths: durationMonths,
  experienceMonths: 0,
  mappedToTimeline: false,
  mappedToCareerProfile: false
}
```

The interval also receives the warning:

```text
gap_not_counted_as_experience
```

## Non-gap intervals

Non-gap intervals are preserved as `employment_or_signal` intervals.

Examples:

- `정규직` counts as experience.
- `계약직` counts as experience.
- `부트캠프` is a signal/training interval, not work experience and not a gap.
- `군복무` is a special signal interval, not work experience and not a gap.
- `대외활동` is contextual signal, not explicit gap.

## Application status

Every returned mapping has:

```js
mappedToAnalyzeCareerTimeline: false
mappedToCareerProfile: false
```

Each interval also has:

```js
mappedToTimeline: false
mappedToCareerProfile: false
```

This batch is not changing existing timeline or CareerProfile behavior.

## Harness change

`qa-career-core-date-employment-baseline.js` now reports explicit gap employment mapping separately:

```text
Gap employment mapping total/comparable/unsupported/pass/review/fail: 7/1/6/1/1/0
```

Meaning:

- 7 total combined cases exist.
- 1 case has explicit gap employment and is comparable now.
- 6 cases remain unsupported by this narrow batch.
- 1 comparable case passes.
- 1 review remains because the mapping is not applied to `analyzeCareerTimeline()` or CareerProfile.

The overall harness conclusion remains `REVIEW` because combined timeline support, weighted months, project overlap dedup, leave modeling, and military modeling remain unsupported.

## Verification

Expected verification commands:

```powershell
node scripts/test-career-core-gap-employment-timeline.js
node scripts/test-career-core-short-tenure-risk.js
node scripts/test-career-core-employment-metadata.js
node scripts/test-career-core-employment-type.js
node scripts/qa-career-core-date-employment-baseline.js
node scripts/test-career-core-period-parser.js
node scripts/test-career-core-timeline.js
node scripts/test-career-core-signals.js
node scripts/test-career-core-fit.js
node scripts/test-career-core-work-records-adapter.js
node scripts/qa-career-core-fit-real-cases.js
```

`npm run build` can be attempted, but recent fresh worktrees have failed because the Vite binary is not available. Package files should not be changed for this batch.

## Guardrails

- No `analyzeCareerTimeline()` wiring
- No CareerProfile wiring
- No weightedExperienceMonths calculation
- No full combined date + employment adapter
- No project overlap dedup
- No leave/military interval modeling
- No taxonomy/scoring changes
- No UI/API/DB/Supabase/env/deployment changes

## Next patch candidates

1. combined date + employment timeline adapter
2. weightedExperienceMonths calculation
3. project overlap dedup
4. leave/military special interval modeling
