# GitHub PR Career Candidate MVP Contract

## 1st MVP Scope

This PR defines the minimum server-side contract for turning a GitHub pull request trace into a PASSMAP career candidate preview.

In scope:

- Accept a fixture-like GitHub PR payload on a server route.
- Convert PR title, body, changed files, additions, deletions, and `merged_at` into a deterministic candidate object.
- Produce a contract shape with `trace`, `work_signal`, `career_asset_candidate`, `resume_bullet_candidates`, `evidence`, `dedupe_key`, and `recommended_action`.
- Keep the output compatible with the existing `raw_sources`, `experience_cards`, and `experience_evidence` storage flow.
- Verify the contract with a local deterministic Node test.

## Excluded Scope

The first contract MVP intentionally did not implement database insert/update behavior.

The persistence MVP intentionally still does not implement:

- GitHub OAuth app registration or callback handling.
- GitHub API calls or webhook signature verification.
- OpenAI or other model calls.
- Kakao, SMS, Push, or email notifications.
- Scheduler wiring, including the planned 6 PM reminder.
- Account merge, backfill, email/name matching, public profile linking, all-commit analysis, or Jira/Slack/Notion import.

## Data Flow

```text
GitHub PR Trace
-> Work Signal
-> Career Asset Candidate
-> Resume Bullet Candidate
-> raw_sources / experience_cards / experience_evidence compatible mapping
```

The first MVP produced a preview response only. The persistence MVP accepts the same fixture-like PR payload from an authenticated PASSMAP user and stores a safe candidate preview in the existing PASSMAP experience tables.

The persistence MVP does not verify GitHub repository ownership yet because GitHub OAuth and GitHub API calls are intentionally out of scope.

## GitHub PR Payload Example

```json
{
  "action": "closed",
  "repository": {
    "full_name": "passmap/reject-analyzer",
    "html_url": "https://github.com/passmap/reject-analyzer"
  },
  "pull_request": {
    "number": 42,
    "title": "Add career candidate preview contract for GitHub PR traces",
    "body": "Creates a deterministic contract preview.",
    "html_url": "https://github.com/passmap/reject-analyzer/pull/42",
    "additions": 188,
    "deletions": 27,
    "merged_at": "2026-06-12T09:00:00Z"
  },
  "files": [
    {
      "filename": "src/lib/githubCareerCandidateContract.js",
      "status": "added",
      "additions": 120,
      "deletions": 0
    }
  ]
}
```

Private full diff text is not part of the candidate response. File evidence is limited to filename, status, additions, and deletions.

## Work Signal JSON Schema

```json
{
  "id": "github-pr:{repo_identifier}:{pr_number}:{normalized_hash}",
  "type": "quality_contract | security_auth | product_ui | backend_api | data_model | product_engineering",
  "title": "string",
  "summary": "string",
  "merged_at": "ISO-8601 string or null",
  "changed_files": [
    {
      "filename": "string",
      "status": "string",
      "additions": "number",
      "deletions": "number"
    }
  ],
  "stats": {
    "additions": "number",
    "deletions": "number",
    "changed_file_count": "number"
  },
  "normalized_hash": "16-char sha256 prefix"
}
```

## Career Asset Candidate JSON Schema

```json
{
  "asset_type": "project_contribution",
  "title": "string",
  "contribution_scope": "same value as work_signal.type",
  "impact_level": "focused | medium | high",
  "evidence_summary": "string",
  "review_status_mapping": {
    "reject": "archived",
    "approve": "converted"
  }
}
```

## Resume Bullet Candidate JSON Schema

```json
[
  "Delivered {work signal type} work through PR #{number} across {file count} files with +{additions}/-{deletions} changes."
]
```

The first MVP only guarantees a deterministic starter bullet. Later AI rewriting can create stronger user-facing bullets after persistence and review.

## Existing Table Mapping

`raw_sources`:

- `source_type`: `github_pull_request`
- `source_label`: `GitHub PR #{number}: {candidate title}`
- `detected_period`: `trace.merged_at`
- `summary`: `career_asset_candidate.evidence_summary`
- `raw_text`: `null`
- `metadata.importMethod`: `github_pr_career_candidate_preview`
- `metadata.dedupe_key`: contract `dedupe_key`
- `metadata.trace`: sanitized provider trace
- `metadata.changed_files`: filename/status/additions/deletions summary only
- `metadata.rawTextStored`: `false`
- `metadata.fullDiffStored`: `false`

`experience_cards`:

- `title`: `career_asset_candidate.title`
- `situation`: `career_asset_candidate.evidence_summary`
- `task`: review-oriented career asset candidate note
- `actions`: changed file summaries, not patches
- `result`: safe summary and stats
- `resume_potential`: mapped from candidate impact/confidence (`high` for high impact, otherwise `medium`)
- `confidence_level`: deterministic local confidence (`medium` when there is enough file/change evidence, otherwise `low`)
- `suggested_resume_bullet`: first `resume_bullet_candidates[]` entry
- `status`: `accepted` by default so the existing candidate inbox can review it
- `metadata.importMethod`: `github_pr_career_candidate_preview`
- `metadata.dedupe_key`: contract `dedupe_key`
- `metadata.work_signal`: sanitized work signal
- `metadata.career_asset_candidate`: sanitized candidate contract

`experience_evidence`:

- `evidence_type`: `pull_request_metadata`
- Persistence API value: `github_pr_metadata`
- `evidence_text`: PR title, PR body summary/excerpt, changed file summary, and aggregate additions/deletions only
- `metadata.dedupe_key`: contract `dedupe_key`
- `metadata.importMethod`: `github_pr_career_candidate_preview`

Private repository full diff text, GitHub tokens, OAuth credentials, client secrets, and service role keys must not be stored in any of these rows.

Existing inbox behavior should be reused:

- Reject/exclude -> experience_cards.status = archived
- Approve/convert -> experience_cards.status = converted

## Dedupe and Re-Recommendation Guard

The MVP `dedupe_key` format is:

```text
github_pr:{repo_identifier}:{pr_number}:{normalized_work_signal_hash}
```

`normalized_work_signal_hash` is derived from repo identifier, PR number, signal type, impact level, title slug, changed file count, additions, deletions, and `merged_at`.

Persistence PR guardrails:

- If the same `dedupe_key` already exists with `archived`, do not re-recommend it automatically.
- If the same `dedupe_key` already exists with `converted`, do not create another candidate.
- If the same `dedupe_key` already exists with `accepted`, return the existing candidate instead of creating a duplicate.
- The API uses `experience_cards.metadata->>dedupe_key` for this MVP, avoiding a schema migration.
- If the same PR number changes meaningfully enough to produce a different normalized hash, show it only when product policy allows a revised candidate.

## Persistence API Response

Successful persistence returns a narrow preview shape:

```json
{
  "ok": true,
  "candidate_id": "experience card uuid",
  "raw_source_id": "raw source uuid",
  "dedupe_key": "github_pr:{repo_identifier}:{pr_number}:{hash}",
  "status": "accepted",
  "preview": {
    "work_title": "candidate title",
    "summary": "safe summary",
    "suggested_resume_bullet": "one deterministic resume bullet",
    "evidence_count": 4
  }
}
```

The response intentionally does not include:

- GitHub token, OAuth credential, client secret, service role key, or Authorization header.
- Full private diff text or patch hunks.
- `raw_sources.raw_text`.
- The full `work_signal` or raw PR payload.

## Security, Privacy, and Credential Guardrails

- Never return access credentials, raw OAuth credentials, client secrets, service role keys, authorization headers, or GitHub bearer values in the candidate response.
- Never include private repository full diff text in the response.
- Do not write `raw_sources.raw_text` from a browser client.
- The persistence API writes only from the server route after Supabase bearer-token verification.
- Treat PR body and file names as user-controlled text and sanitize before response serialization.
- Keep the route server-only with bearer-required structure.
- Do not call GitHub, OpenAI, Kakao, SMS, Push, or scheduler code in this persistence PR.

## Follow-Up Steps

1. Add GitHub OAuth and repository ownership verification.
2. Add persistence into `raw_sources`, `experience_cards`, and `experience_evidence`.
3. Wire the candidate into `AiExperienceInboxPanel`.
4. Add the 6 PM notification scheduler.
5. Connect Kakao/Push delivery only after consent, channel eligibility, and privacy review.
