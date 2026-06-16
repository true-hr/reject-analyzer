# GitHub App Connection Contract

> Status: Design draft only
> Date: 2026-06-15
> Runtime impact: None

## 1. Product Goal

PASSMAP should let a signed-in user connect a GitHub account, select explicitly accessible repositories, and reuse GitHub pull request metadata as developer career evidence.

The preferred long-term integration path is a GitHub App. The connection must support minimal repository access, user trust, short-lived credential use, and compatibility with the existing manual GitHub PR import path.

## 2. Decision: GitHub App Over OAuth App

Use a GitHub App as the preferred connection model before considering a broad OAuth App flow.

Reasons:

- GitHub Apps support fine-grained permissions.
- GitHub Apps allow repository-level access selection during installation.
- GitHub Apps use short-lived installation and user tokens.
- A GitHub OAuth App that needs private repository access would likely require the broad `repo` scope.
- PASSMAP's developer-career extraction use case should minimize repository access and make the trust boundary clear.

OAuth App support is not prohibited forever, but it is not the MVP path. Any future OAuth fallback must document its scope risk and must not silently expand access beyond the user's selected intent.

## 3. MVP Connection Flow

The MVP flow should be:

1. User clicks `GitHub 연결하기`.
2. PASSMAP starts a GitHub App install/authorize flow.
3. User installs or authorizes the GitHub App and selects repositories on GitHub.
4. GitHub redirects back to PASSMAP.
5. PASSMAP handles the callback through the existing API action pattern without adding a new Vercel API function if possible.
6. PASSMAP verifies the Supabase user session server-side.
7. PASSMAP stores GitHub connection metadata.
8. PASSMAP lists repositories accessible through the installation.
9. User selects a repository for PASSMAP use.
10. PASSMAP verifies repository access before import.
11. Later, recent merged PR candidates can reuse the existing `github_pr_preview` candidate flow.

The existing manual import contract remains:

```text
POST /api/save-analysis-run?action=github_pr_preview
```

GitHub App work must not break this endpoint or require a connected GitHub account for manual import.

## 4. Explicitly Out Of Scope For This PR

This document-only PR must not:

- implement a GitHub App flow
- implement an OAuth App flow
- add API routes
- add Vercel functions
- add package dependencies
- add environment files or environment variable values
- add an automatically applied migration
- touch production or staging databases
- use SQL Editor
- start scheduler, Kakao, Push, or OpenAI work
- change manual GitHub PR import behavior
- expose URL, key, token, password, or service-role values
- commit screenshots or temporary artifacts

## 5. Vercel Function-Count Constraint

PASSMAP currently treats Vercel function count as a protected deployment constraint. As of this design draft, the expected `api/**/*.js` count is 12.

GitHub App implementation should avoid adding a new file under `api/**/*.js`. The preferred path is extending the existing action router pattern on the current save-analysis-run API function.

Required verification for implementation PRs:

```text
api/**/*.js count remains 12
no new api route added
```

If a future implementation cannot satisfy this constraint, that PR must explicitly explain why a new function is unavoidable before making the change.

## 6. No-New-API-Route Rule

Do not add a new public route such as:

```text
/api/github/connect
/api/github/callback
/api/github/repos
/api/github/import
```

Instead, prefer action names under the existing save-analysis-run route:

```text
POST /api/save-analysis-run?action=github_connection_status
POST /api/save-analysis-run?action=github_connection_prepare
POST /api/save-analysis-run?action=github_connection_callback_stub
POST /api/save-analysis-run?action=github_repository_access_preview
POST /api/save-analysis-run?action=github_pr_preview
```

These action names are reserved under the existing route. The route count must remain unchanged unless explicitly approved.

## 7. Save-Analysis-Run Action Router Strategy

The implementation should add narrowly scoped action handlers behind the existing action router rather than creating standalone Vercel functions.

Suggested responsibilities:

| Action | Responsibility |
|---|---|
| `github_connection_status` | Return current connection and selected repository state for the signed-in user. |
| `github_connection_prepare` | Return the safe GitHub App connection-start contract for a verified user session. |
| `github_connection_callback_stub` | Reserve the callback action contract without token exchange or DB writes. |
| `github_repository_access_preview` | Normalize and validate a repository access snapshot without GitHub API calls or DB writes. |
| `github_pr_preview` | Continue the existing manual/import candidate preview contract. |

Any shared GitHub logic should live under `server/api-helpers` or an equivalent existing server-only helper location. Client code must not import GitHub token-generation logic.

## 8. Minimal DB Contract Draft

This is a draft only. Do not apply a migration in this PR.

### Table Candidate 1: `github_connections`

Purpose: Store one GitHub App connection record per PASSMAP user/account installation context.

Candidate columns:

| Column | Draft type | Notes |
|---|---|---|
| `id` | `uuid primary key` | Generated server-side. |
| `user_id` | `uuid not null` | Must come from verified Supabase session, never client payload. |
| `github_account_id` | `bigint not null` | GitHub user or organization account id. |
| `github_login` | `text not null` | GitHub login for display and audit. |
| `github_account_type` | `text not null` | Expected values: `User`, `Organization`, or GitHub-provided equivalent. |
| `installation_id` | `bigint` | GitHub App installation id. Nullable for possible future OAuth-only records. |
| `connection_type` | `text not null default 'github_app'` | Expected MVP value: `github_app`; `oauth_app` is reserved for a documented future fallback. |
| `granted_permissions` | `jsonb not null default '{}'::jsonb` | Snapshot of GitHub App permissions. |
| `granted_events` | `jsonb not null default '[]'::jsonb` | Snapshot of GitHub App event subscriptions. |
| `status` | `text not null default 'connected'` | Suggested values: `connected`, `disconnected`, `revoked`, `error`. |
| `connected_at` | `timestamptz not null` | Server timestamp. |
| `disconnected_at` | `timestamptz` | Set on disconnect/revoke. |
| `last_checked_at` | `timestamptz` | Updated after status verification. |
| `created_at` | `timestamptz not null` | Server timestamp. |
| `updated_at` | `timestamptz not null` | Server timestamp. |

Draft constraints to consider:

```sql
-- Draft only. Do not apply in this PR.
unique index on (user_id, github_account_id, coalesce(installation_id, 0))
  where status = 'connected'
check (connection_type in ('github_app', 'oauth_app'))
check (status in ('connected', 'disconnected', 'revoked', 'error'))
```

### Table Candidate 2: `github_repository_access`

Purpose: Store repository-level access metadata selected and verified for a PASSMAP user.

Candidate columns:

| Column | Draft type | Notes |
|---|---|---|
| `id` | `uuid primary key` | Generated server-side. |
| `user_id` | `uuid not null` | Must come from verified Supabase session, never client payload. |
| `connection_id` | `uuid not null` | References `github_connections.id`. |
| `github_repo_id` | `bigint not null` | Stable GitHub repository id. |
| `owner` | `text not null` | Repository owner login. |
| `name` | `text not null` | Repository name. |
| `full_name` | `text not null` | `owner/name`. |
| `private` | `boolean not null` | GitHub repository privacy flag. |
| `selected` | `boolean not null default false` | Whether the user selected this repository for PASSMAP import. |
| `permission_snapshot` | `jsonb not null default '{}'::jsonb` | Server-side access snapshot at verification time. |
| `verified_at` | `timestamptz` | Set only after successful access verification. |
| `last_imported_at` | `timestamptz` | Updated after successful import. |
| `created_at` | `timestamptz not null` | Server timestamp. |
| `updated_at` | `timestamptz not null` | Server timestamp. |

Draft constraints to consider:

```sql
-- Draft only. Do not apply in this PR.
unique (connection_id, github_repo_id)
check (btrim(owner) <> '')
check (btrim(name) <> '')
check (btrim(full_name) <> '')
```

RLS expectation for both tables:

```text
user_id = auth.uid()
```

Authenticated users may select, insert, update, and delete only their own rows. Repository access rows should also reference a connection owned by the same user. Service-role access, if needed for server-side maintenance, must stay server-only and must never be exposed to the client.

## 9. Token And Encryption Requirements

Preferred token model:

- Generate GitHub App installation/user tokens on demand server-side.
- Use short-lived GitHub tokens.
- Store connection metadata, installation id, account id, and permission snapshots.
- Avoid storing GitHub access tokens where possible.

If any long-lived secret or token must be stored:

- encrypt it server-side before storage
- never expose it to the client
- never store it in plaintext
- never include it in logs, error responses, analytics, screenshots, or docs

Storage prohibitions:

- Do not store raw GitHub token values in plaintext.
- Do not store raw PR diff or patch.
- Do not store raw PR payloads when a normalized candidate shape is sufficient.
- Keep `raw_sources.raw_text` null for GitHub PR candidates.

## 10. Repository Access Verification Flow

Before PASSMAP imports or previews repository-derived PR data through a GitHub connection, it must verify access server-side.

Required flow:

1. Load the signed-in Supabase user from the server request/session.
2. Load an active `github_connections` row owned by that user.
3. Generate a short-lived GitHub App token server-side.
4. Query GitHub for the target repository by id or `owner/name`.
5. Confirm the repository belongs to the installation's accessible repository set.
6. Confirm the minimum permission needed for PR metadata import is present.
7. Write or refresh `github_repository_access.permission_snapshot`.
8. Set `verified_at` only after successful verification.
9. Proceed to PR metadata preview/import only after verification succeeds.

Repository identity should prefer `github_repo_id` over mutable names when possible. If `owner`, `name`, or `full_name` changes, implementation should refresh metadata from GitHub rather than trusting stale client values.

## 11. Manual PR Import Compatibility Rule

Manual GitHub PR import must continue working without any GitHub connection.

Existing behavior:

```text
POST /api/save-analysis-run?action=github_pr_preview
```

Compatibility requirements:

- Do not require a `github_connections` row for manual import.
- Do not require a selected repository for manual import.
- Do not change the candidate response shape solely because GitHub App support exists.
- Preserve the rule that GitHub PR candidates do not store raw PR diff/patch.
- Preserve `raw_sources.raw_text = null` for GitHub PR candidates.

GitHub App-backed import may reuse the same candidate contract, but it must add only the minimum source metadata needed to identify connection-backed provenance.

## 12. Security Guardrails

Required rules:

- No GitHub token in the client bundle.
- No service-role key exposure.
- No raw PR payload, full diff, or patch storage.
- `raw_sources.raw_text` remains null for GitHub PR candidates.
- `user_id` comes from verified Supabase session, never client payload.
- GitHub connection must not be used for account merge.
- Repository access must be verified before import.
- Manual import flow must continue working without GitHub connection.
- Disconnect/revoke behavior must be defined before production use.
- GitHub callback state must be validated server-side.
- Callback handling must not trust client-provided installation, account, repository, or user ids without server verification.
- Logs must not include tokens, secrets, full callback URLs with sensitive params, raw PR payloads, or service-role values.
- Any GitHub App private key or webhook secret must stay in server-only environment storage.

Disconnect/revoke behavior:

- User-initiated disconnect should mark the connection `disconnected`, set `disconnected_at`, and stop future imports.
- GitHub-side revocation or installation removal should mark the connection `revoked` or `error` after server verification.
- Previously normalized PASSMAP candidate records may remain according to product retention rules, but no new repository import may run through a disconnected or revoked connection.

## 13. Proposed PR Breakdown

PR A: design doc + DB contract draft only.

PR B: migration for connection/repo tables, disposable DB smoke only. Completed by `supabase/migrations/20260615142132_github_app_connection_tables.sql`.

PR C: server helper skeleton under `server/api-helpers`, no new API route.

PR D: `save-analysis-run` actions for connection status/start/callback skeleton.

PR E: repository list/access verification.

PR F: UI connection status/repository selection.

PR G: OAuth-backed PR metadata import using the existing `github_pr_preview` contract.

## 14. Open Decisions

- Exact GitHub App permissions needed for listing repositories and reading merged PR metadata.
- Whether GitHub App user authorization is required in addition to installation access for the MVP.
- Exact callback state storage mechanism and expiration policy.
- Whether repository selection allows one repository or multiple repositories in the first UI.
- Final retention policy for normalized GitHub PR candidate metadata.
- Whether the GitHub connection tables need additional production rollout grants beyond the initial authenticated own-row policies.
