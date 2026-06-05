# Career Core Test Guard Separation

## 1. Problem background

PR #810 consolidated Career Core changed-file checks into a shared guard. That protected narrow batches from accidental runtime, UI, API, database, deployment, environment, and package changes.

The problem was where the guard ran: several functional, contract, and regression tests executed the git diff guard as part of their normal assertions.

## 2. Why git diff guards block follow-up batches inside functional tests

Functional tests should validate behavior for the code path they target. When they also inspect every changed file on the branch, they become sensitive to unrelated but intentional follow-up batch files.

That means a later runtime batch can fail an existing behavior test before the behavior assertions run, only because the branch includes a runtime file outside that test's local allow-list. The failure is about batch scope, not runtime correctness.

## 3. Why the changed-file guard is now a dedicated script

The guard remains useful, but it should be invoked explicitly as a scope check. A dedicated script keeps protected-surface validation available without coupling it to every Career Core behavior test.

## 4. Functional test and scope guard roles

Functional, contract, and regression tests validate deterministic Career Core behavior, schemas, fixtures, and expected signals.

The changed-file guard validates branch scope. It checks whether the current branch changed only Career Core QA/docs/test-support files, plus runtime files that a batch explicitly allows.

## 5. Follow-up batch command examples

Default scope check:

```bash
node scripts/test-career-core-changed-file-guard.js
```

Allow one runtime file for a targeted runtime batch:

```bash
node scripts/test-career-core-changed-file-guard.js --allow-runtime src/lib/career-core/buildCareerProfileFromWorkRecords.js
```

Allow multiple runtime files:

```bash
node scripts/test-career-core-changed-file-guard.js --allow-runtime src/lib/career-core/buildCareerProfileFromResumeProfile.js --allow-runtime src/lib/career-core/buildCareerProfileFromWorkRecords.js
```

## 6. Runtime file allow mode

Runtime files are blocked by default. A runtime batch must pass each permitted runtime file with `--allow-runtime`.

This keeps normal QA/test batches from silently including implementation changes while still allowing intentional runtime batches to run the same guard.

## 7. Protected surface blocking policy

The guard blocks protected surfaces including API, Supabase, Vercel/env/deployment, package files, UI surfaces, and protected Career Core model/scoring/evidence files.

Protected-surface checks are not removed. They are separated from behavior tests and run through `scripts/test-career-core-changed-file-guard.js`.
