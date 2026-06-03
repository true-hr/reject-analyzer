# JD Tailoring Career Core UI QA - 2026-06-03

## QA purpose

Verify that the read-only `Career Core v0 추정` summary added to the JD tailoring panel renders correctly, updates safely when JD text changes, and does not break existing JD tailoring data flow.

## Environment

- Branch: `qa/jd-tailoring-career-core-ui-20260603`
- Base: `origin/main` after PR #708 merge
- QA mode: isolated Vite harness mounting the real `ResumeJdTailoringPanel` with synthetic sample resume data
- Browser QA: Playwright Chromium through `scripts/qa-jd-tailoring-career-core-ui.js`
- Data: synthetic/sample only

## Commands

```bash
npm ci --legacy-peer-deps
npm install --no-save --legacy-peer-deps playwright
node scripts/qa-jd-tailoring-career-core-ui.js
node scripts/test-career-core-timeline.js
node scripts/test-career-core-signals.js
node scripts/test-career-core-fit.js
node scripts/qa-career-core-fit-real-cases.js
node scripts/test-resume-jd-tailoring-data.js
node scripts/test-resume-jd-career-core-bridge.js
npm run build
```

## Case results

| case | expected | actual | status |
| --- | --- | --- | --- |
| Existing JD tailoring summary | Fit score, must-have match, promoted/deprioritized, gap, and target version summary remain visible. | Existing cards and target version summary rendered with no JS error. | PASS |
| PM/SaaS JD | Career Core summary shows target `product_planning_pm / b2b_saas` and month buckets. | Summary rendered with primary `transferable`, all buckets visible, target visible. | PASS |
| Ambiguous JD | Career Core should not over-infer a sample PM target. | Summary falls back to `판정 불가` and shows conservative skip copy. | PASS |
| Bio/GMP quality JD | Target should switch to `production_quality / bio_pharma`. | Target estimate updated correctly after textarea change. | PASS |
| Career/resume/interview JD | Target should include `career_education`. | Target estimate updated to `marketing_growth / career_education`. | PASS |
| Profile missing | Existing no-profile state should render without Career Core box. | No-profile message rendered and Career Core summary was absent. | PASS |
| Desktop layout | Summary box should not collide with textarea/cards/results. | Desktop screenshot shows clean spacing and readable buckets. | PASS |
| Mobile layout | Buckets should wrap vertically without horizontal overflow. | Mobile screenshot passed overflow check and remained readable. | PASS |

## Screenshots

- `screenshots/jd-tailoring-career-core-desktop.png`
- `screenshots/jd-tailoring-career-core-mobile.png`

## Findings

- The read-only summary itself rendered correctly on desktop and mobile.
- Existing JD tailoring output remained visible: fit score, must-have match, promoted/deprioritized, gaps, and target version summary.
- QA found one clear issue: `ResumeJdTailoringPanel` passed `sampleTargetRole` into Career Core target inference, so ambiguous JD text could still infer PM/SaaS from sample defaults.

## Changes made

- Minimal fix in `ResumeJdTailoringPanel.jsx`: Career Core target inference now uses JD text and JD fit only, not the sample target role/company defaults used by the existing target version preview.
- Added `scripts/qa-jd-tailoring-career-core-ui.js` to mount the real panel in a Vite QA harness, verify key cases, and save screenshots.

## Remaining limits

- QA harness uses sample resume data, not real user data.
- The app-level Resume tab flow was not end-to-end tested through parsing/upload because that path can require broader app state and user interaction.
- Playwright is used as a no-save local QA dependency for this script; it is not added to project dependencies.
- Career Core remains a reference estimate and should not be framed as final eligibility.

## Next steps

- Add more JD wording fixtures for target inference before expanding product exposure.
- Prefer explicit target role/industry inputs over sample defaults for future JD tailoring flows.
- Keep the Career Core box read-only until product copy and taxonomy coverage are broader.
