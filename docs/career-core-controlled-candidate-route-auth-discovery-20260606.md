# Career Core Controlled Candidate Route Auth Discovery

Date: 2026-06-06

Batch: Discovery/Contract Batch / Controlled Candidate Route Auth Discovery

## 1. Purpose

This discovery documents the current route, auth/session, and Supabase ownership patterns before implementing a public Controlled Candidate preview route.

This batch is discovery, documentation, fixture, and deterministic test only. It does not implement a route, auth helper, database read/write, Supabase read/write, UI, runtime wiring, or changed-file guard update.

## 2. Route Surface Inventory

| Candidate surface | exists | usedForRuntime | evidenceFiles | notes |
| --- | --- | --- | --- | --- |
| `src/api/**` | false | false | [] | No tracked `src/api` directory. The Career Core changed-file guard still hard-blocks this path if introduced later. |
| `api/**` | true | true | `api/enhance.js`, `api/parse.js`, `api/save-analysis-run.js`, `api/admin-analysis.js`, `vercel.json` | Existing Vercel-style serverless handlers use `export default async function handler(req, res)`. `vercel.json` preserves `/api/**` and rewrites non-API paths to SPA `index.html`. |
| `pages/api/**` | false | false | [] | No tracked Next.js Pages API route surface found. |
| `app/api/**` | false | false | [] | No tracked Next.js App Router API route surface found. |
| `supabase/functions/**` | true | true | `supabase/functions/send-test-experience-recall-push/index.ts`, `supabase/functions/send-weekly-experience-recall-push/index.ts`, `supabase/functions/send-experience-recall-reminders-v2/index.ts` | Existing Supabase Edge Functions are operational surfaces, mostly scheduler/push related. They are not the current web `/api/**` route convention. |
| `server/**` | false | false | [] | No tracked server directory found. |
| `functions/**` | false | false | [] | No tracked root functions directory found. |
| `edge/**` | false | false | [] | No tracked root edge directory found. |

Discovery commands used tracked-file and scoped searches equivalent to the requested route/auth searches. Broad unscoped recursive commands hit `.git`, `node_modules`, and local browser temp folders, so final evidence was collected from tracked paths under `api`, `src`, and `supabase`.

## 3. Existing Route Examples

Existing deployed public API route pattern found: root `api/**` Vercel functions.

| File path | Request method | Auth method | Supabase read/write | Response shape | changed-file guard impact |
| --- | --- | --- | --- | --- | --- |
| `api/enhance.js` | `POST`, `OPTIONS` | No user auth; API key is server env `GEMINI_API_KEY` | No Supabase | Success `{ ok: true, ai }`; errors use `{ ok: false, error }` | New or modified `api/**` route files are not allowed by current Career Core changed-file guard default patterns. |
| `api/parse.js` | `POST`, `OPTIONS` | No user auth; API key is server env `GEMINI_API_KEY` | No Supabase | Success `{ ok: true, parsed }`; errors use `{ ok: false, error: { code, message } }` | Same guard impact. |
| `api/admin-analysis.js` | `GET`, `OPTIONS` | Bearer token, `supabase.auth.getUser(accessToken)`, admin allowlist by user id/email | Service-role read-only `select` from analysis tables | Success `{ ok: true, items }` or `{ ok: true, input, run }`; errors use `{ ok: false, error: { code, message } }` | Same guard impact. |
| `api/save-analysis-run.js` | `POST`, `GET` for health action, `OPTIONS` | Bearer token via local helpers. Uses `verifySupabaseAccessToken`, `verifyMcpToken`, and direct `supabase.auth.getUser(accessToken)` depending on action. | Contains both writes and reads. Ownership-safe read examples use `.eq("user_id", verifiedUserId)`. Writes are forbidden for Controlled Candidate preview. | Mostly `{ ok: true, ... }`; helper errors use `{ ok: false, error: { code, message } }` | Same guard impact. |
| `api/resume-registration.js` | `POST`, `OPTIONS` | Bearer token, service-role `supabase.auth.getUser(accessToken)` | Service-role writes to storage and tables using verified user id | Success `{ ok: true, id, assetId }`; errors use `{ ok: false, error: { code, message } }` | Same guard impact. |
| `api/share.js` | `GET`, `POST`, `OPTIONS` | No user auth | Upstash or in-memory share storage, not Supabase | Success `{ ok: true, sharePack }` or `{ ok: true, id }`; errors use `{ ok: false, error }` | Same guard impact. |
| `supabase/functions/send-test-experience-recall-push/index.ts` | `POST`, `OPTIONS` | Bearer token, `supabase.auth.getUser(token)` | Service-role read-only subscription lookup with `.eq("user_id", user.id)` plus external push send | Success `{ ok: true, sent, recordDate }`; errors use `{ ok: false, error }` | `supabase/**` is hard-blocked by current Career Core changed-file guard. |

## 4. Auth And Session Inventory

| Item | Found | Evidence files | Notes |
| --- | --- | --- | --- |
| Supabase auth usage | true | `src/lib/auth.js`, `src/lib/supabaseClient.js`, `api/_mcp_auth.js`, `api/_security.js`, `api/admin-analysis.js`, `api/save-analysis-run.js`, `supabase/functions/send-test-experience-recall-push/index.ts` | The app uses Supabase Auth on both browser and server surfaces. |
| `getUser` usage | true | `api/_mcp_auth.js`, `api/_security.js`, `api/admin-analysis.js`, `api/save-analysis-run.js`, `api/resume-registration.js`, `supabase/functions/send-test-experience-recall-push/index.ts` | Server-side routes verify Bearer access tokens with `supabase.auth.getUser(token)`. |
| `getSession` usage | true | `src/lib/auth.js`, `src/App.jsx`, `src/pages/AdminAnalysisPage.jsx`, `src/lib/mcp/mcpPairingClient.js`, `src/lib/workTrace/saveWorkTraceCandidates.js` | Browser/client code gets the current Supabase session through the existing `getSession()` helper. |
| `requireAuth` helper | false | Search found no `requireAuth` helper. | Do not invent a new helper for this route without a separate auth-helper contract. |
| Existing server auth helper | true | `api/_mcp_auth.js` | `readBearerToken(req)` and `verifySupabaseAccessToken({ accessToken, supabase })` are the closest reusable server route helper pair for PASSMAP web-user identity. |
| `session.userId` pattern | true, fixture/local contract only | `src/lib/career-core/__fixtures__/controlledCandidateAuthRoutePlacementContractCases.js`, `src/lib/career-core/__fixtures__/controlledCandidateApiResponseContractCases.js` | Current Controlled Candidate local handler contracts allow this shape for importable handler tests. |
| `session.user.id` pattern | true | `src/lib/auth.js`, `src/App.jsx`, `src/lib/workTrace/saveWorkTraceCandidates.js`, `src/components/home/HomeDashboard.jsx` | Real Supabase sessions expose `session.user.id`. |
| localStorage/token auth | partial | `src/App.jsx` has `LS_AUTH_KEY`; `src/lib/supabaseClient.js` configures Supabase auth persistence with `storageKey`. | App UI persists display auth state locally, but server routes should trust only Bearer token verification, not localStorage state. |

Recommendation for a future public route: use the existing server-side Bearer token pattern from `api/_mcp_auth.js`: `readBearerToken(req)`, `getServiceRoleClient()`, and `verifySupabaseAccessToken({ accessToken, supabase })`. Client-side `getSession()` can supply the access token to the caller, but the route must verify the token server-side.

## 5. Ownership Validation Inventory

| Item | Found | Evidence files | Notes |
| --- | --- | --- | --- |
| `userId` / `user_id` owner columns | true | `supabase/sql/20260515_experience_cards_schema.sql`, `supabase/sql/20260428_passmap_work_records.sql`, `supabase/sql/20260519_user_career_settings.sql`, `supabase/sql/20260523_user_mcp_pairings.sql` | Career/work and settings tables commonly use `user_id`. |
| Explicit service-role owner filter | true | `api/save-analysis-run.js`, `supabase/functions/send-test-experience-recall-push/index.ts` | Examples filter rows with verified identity, such as `.eq("user_id", verifiedUserId)` or `.eq("user_id", user.id)`. |
| RLS reliance pattern | true | `src/lib/workRecordRepository.js`, `src/lib/experience/aiInboxRepository.js`, SQL policy files | Browser repositories rely on Supabase RLS, with comments that `auth.uid() = user_id` filters rows. |
| Resource owner verification helper | partial | `api/_mcp_auth.js` verifies identity; no dedicated generic persisted-resource ownership helper for resume/work record ids was found. | Future id-based Controlled Candidate route still needs an exact read-only ownership helper/pattern for the specific resource tables. |
| Read-only select query pattern | true | `api/admin-analysis.js`, `api/save-analysis-run.js`, `src/lib/workRecordRepository.js`, `src/lib/experience/aiInboxRepository.js`, `supabase/functions/send-test-experience-recall-push/index.ts` | Read-only ownership can be implemented with verified user id plus `select` and owner filter, or with authenticated anon client plus RLS. |
| Insert/update/delete write patterns | true | `api/save-analysis-run.js`, `api/resume-registration.js`, `src/lib/workRecordRepository.js`, `src/lib/workTrace/saveWorkTraceCandidates.js`, Supabase Edge Functions | These writes exist in the project but must not be used by Controlled Candidate preview. |

Important preview constraint: even though write patterns exist, this preview route must not use them. A future route may perform only request validation, auth read, read-only ownership verification, preview generation, and candidate-only response mapping.

## 6. Changed-File Guard Impact

Evidence:

- `src/lib/career-core/__testUtils__/careerCoreChangedFileGuard.js`
- `scripts/test-career-core-changed-file-guard.js`

Current protected paths include:

```text
src/api/**
supabase/**
vercel.json
.env*
deploy/deployment named paths
package.json
package-lock.json
src/App.jsx
src/components/**
src/pages/**
selected Career Core runtime/scoring/model files
```

`src/api/**` is explicitly hard-blocked. `supabase/**` is explicitly hard-blocked. Root `api/**` is not listed in the hard-blocked patterns, but it is also not included in the default allowed Career Core QA patterns, so a new or changed `api/**` route file fails the guard unless the guard is updated or the test accepts a future explicit extra allowlist.

The current `--allow-runtime` CLI option only maps to `allowedRuntimeFiles`, and `allowedRuntimeFiles` is checked after hard-blocked paths. It is intended for specific Career Core runtime files, not route files. It cannot permit `src/api/**` or `supabase/**`, and it does not make root `api/**` a default allowed path.

Conclusion: a future public route implementation needs a separate changed-file guard update or an explicit test-time allow path for the exact intended route file. This discovery batch does not modify the guard.

## 7. Recommendation

Recommendation: B. Public route implementation is deferred.

Reasons:

```text
The existing deployed route surface appears to be root api/**, not src/api/**.
Existing auth helpers are present for server Bearer verification.
Read-only ownership patterns exist, but no dedicated generic ownership helper for Controlled Candidate persisted ids was found.
The Career Core changed-file guard does not currently allow route files by default.
```

Do not implement the public route yet.

Next required batch:

```text
Define the exact root api/** route file path or choose a Supabase Edge Function.
Confirm the route will use api/_mcp_auth.js readBearerToken + verifySupabaseAccessToken.
Define an exact read-only ownership helper/pattern for resumeProfileId and workRecordIds.
Update or explicitly configure changed-file guard allowance for only the intended route file.
Keep DB/Supabase writes forbidden.
```

Safest future placement, if the project keeps the current Vercel route convention:

```text
route surface: api/**
logical endpoint: careerCoreControlledCandidatesPreview
method: POST
auth: Bearer Supabase access token verified server-side
ownership: read-only select by verified user id, or RLS-backed authenticated read if that surface is chosen
```

Do not use `src/api/**` unless the deploy routing surface is changed and the guard is updated intentionally.

## 8. Next Implementation Gate

Actual route implementation remains blocked until all gates pass:

```text
route surface confirmed
auth/session helper confirmed
resource ownership read helper confirmed
changed-file guard allows intended route file
no DB/Supabase write
candidate-only response maintained
```
