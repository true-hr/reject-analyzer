# Career Core Controlled Candidate Auth Route Placement Contract

Date: 2026-06-06

Batch: QA/Contract Batch / Controlled Candidate Auth + Route Placement

## 1. Purpose

This contract fixes route placement, auth/session, and ownership read guard requirements before connecting the Controlled Candidate preview local handler to any public route.

This batch is documentation, fixture, and deterministic test only. It does not implement a public API route, auth helper, database read/write, Supabase integration, UI, or runtime wiring.

## 2. Route Placement Policy

Current implementation state:

```text
handleControlledCandidatePreviewApiRequest() is an importable local handler.
It is not a deployed public API route yet.
```

Future route candidate:

```text
POST /api/career-core/controlled-candidates/preview
```

If project routing conventions differ, use this logical endpoint name until the deploy surface is confirmed:

```text
careerCoreControlledCandidatesPreview
```

Policy:

```text
Do not create a route file until it is confirmed that src/api/** is the deployed route surface for this project.
If the Vite SPA structure leaves public API routing unclear, confirm the Edge Function or existing server-route convention first.
```

## 3. Auth And Session Policy

Required principles:

```text
Do not generate controlled candidate previews without authentication.
A user identifier such as session.userId or session.user.id is required.
Do not invent a new auth helper.
If an existing project auth/session helper exists, only that helper may be used.
If no existing helper exists, public route implementation stays blocked.
```

Error contract:

```js
{
  ok: false,
  error: {
    code: "UNAUTHENTICATED",
    message: "Authentication is required.",
    details: []
  }
}
```

## 4. Resource Ownership Policy

Allowed input ownership principles:

```text
resumeProfile must be provided by or owned by the current session user.
workRecords must be owned by the current session user.
manualConfirmedCandidates must be confirmations from the current session user.
Records that include a different userId must not be processed.
```

Return `FORBIDDEN_RESOURCE` when:

```text
workRecord.userId differs from session.userId.
resumeProfile.userId differs from session.userId.
manualConfirmedCandidates.userId differs from session.userId.
Only persisted resource ids are passed and no resource owner verification helper exists.
```

## 5. Read-Only Policy

Allowed:

```text
request body validation
session user id read
input ownership read validation
controlled candidate preview generation
candidate-only response mapping
```

Forbidden:

```text
DB insert/update/delete
Supabase write
CareerProfile update
manual confirmation save
preview result save
RoleFit/scoring update
company/public exposure
```

## 6. Persisted Resource Id Policy

If a future API accepts ids only:

```js
{
  resumeProfileId,
  workRecordIds
}
```

Then all of the following are required:

```text
A read-only ownership verification helper is required.
Unauthorized ids return FORBIDDEN_RESOURCE.
If no ownership helper exists, route implementation stays blocked.
If DB reads are needed, only read-only queries are allowed.
DB writes remain forbidden.
```

This batch must not implement id-based fetch behavior.

## 7. Public Route Implementation Gate

Actual public route implementation may proceed only after all of these are true:

```text
route placement is confirmed
auth/session helper is confirmed
resource ownership read helper is confirmed
FORBIDDEN_RESOURCE is testable
DB/Supabase write prohibition is testable
candidate-only response contract is preserved
```

## 8. Forbidden Behaviors

```text
Do not create an auth-bypass route.
Do not allow preview without a session.
Do not process persisted ids without resource ownership verification.
Do not allow writeToDatabase or writeToSupabase.
Do not return candidates as final strengths.
Do not use confirmed/final naming in UI or API for this preview route.
```
