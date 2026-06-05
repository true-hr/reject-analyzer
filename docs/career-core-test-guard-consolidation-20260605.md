# Career Core Test Guard Consolidation 2026-06-05

## Problem Background
Several Career Core QA scripts protected their batch scope with local changed-file guards. Those guards were useful for preventing accidental runtime, UI, API, database, environment, deployment, and package changes from slipping into narrow QA batches.

## Why PR-Specific Lists Created Rework
The older guards encoded a single PR's exact file list. After a batch merged, later Career Core batches could add valid docs, tests, fixtures, or explicitly allowed runtime files and still fail older tests because the older test only recognized its own PR files. This created repeated guard-only patches instead of a stable policy.

## Shared Helper Policy
`src/lib/career-core/__testUtils__/careerCoreChangedFileGuard.js` centralizes the changed-file policy.

Tests now call:

```js
assertCareerCoreChangedFilesAllowed({
  allowedRuntimeFiles: ["src/lib/career-core/buildCareerProfileFromResumeProfile.js"],
  allowedExtraFiles: ["src/lib/career-core/__testUtils__/careerCoreChangedFileGuard.js"],
  context: "controlled runtime wiring",
});
```

The helper checks committed, staged, unstaged, and untracked paths against `origin/main`.

## Default Allowed Scope
The helper allows Career Core QA surfaces by default:

- `docs/career-core-*.md`
- `scripts/test-career-core-*.js`
- `src/lib/career-core/__fixtures__/*.js`
- `src/lib/career-core/__testUtils__/*.js`

## Default Blocked Scope
The helper always blocks protected surfaces:

- `src/api/**`
- `supabase/**`
- `vercel.json`
- `.env*`
- package files
- `src/components/**`
- CareerProfile schema, controlled signal engine, evidence trace, confidence calibration, RoleFit, and scoring files

## Runtime File Allowance
Runtime files are not allowed by default. A test may allow a runtime file only by passing it through `allowedRuntimeFiles`.

This keeps runtime batches explicit while allowing future doc/test/fixture/test utility additions without PR-specific guard churn.

## How Future Batches Use This
Future Career Core QA scripts should import the helper and pass only their batch-specific runtime files. Most documentation, test, fixture, and test utility changes should need no local allowed-file list.

## Why This Batch Does Not Implement Runtime Changes
This is a QA infrastructure batch only. It does not change ResumeProfile runtime wiring, WorkRecords runtime wiring, CareerProfile schema, RoleFit, scoring, UI, API, database, Supabase, env, deployment, or package behavior.
