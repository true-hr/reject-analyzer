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

This MVP intentionally does not implement:

- GitHub OAuth app registration or callback handling.
- GitHub API calls or webhook signature verification.
- Database insert/update behavior.
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

The first MVP produces a preview response only. The next PR can persist the same shape after auth, repository ownership, and storage policy are reviewed.

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
- `external_id`: `github_pr:{repo_identifier}:{pr_number}`
- `source_hash`: `trace.source_hash`
- `raw_text`: server-only sanitized source summary or metadata envelope, not a client-selected full diff
- `metadata`: `trace`, PR URL, merged timestamp, and summarized file stats

`experience_cards`:

- `source_type`: `github_pull_request`
- `title`: `career_asset_candidate.title`
- `summary`: `career_asset_candidate.evidence_summary`
- `status`: initial review queue status, then existing review transitions
- `dedupe_key`: generated contract `dedupe_key`
- `payload`: `work_signal`, `career_asset_candidate`, and `resume_bullet_candidates`

`experience_evidence`:

- `evidence_type`: `pull_request_metadata`
- `source_ref`: `trace`
- `content`: `evidence[]`
- `confidence`: deterministic contract-level confidence can be added in the persistence PR

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
- If the same PR number changes meaningfully enough to produce a different normalized hash, show it only when product policy allows a revised candidate.

## Security, Privacy, and Credential Guardrails

- Never return access credentials, raw OAuth credentials, client secrets, service role keys, authorization headers, or GitHub bearer values in the candidate response.
- Never include private repository full diff text in the response.
- Do not write `raw_sources.raw_text` from a browser client.
- Treat PR body and file names as user-controlled text and sanitize before response serialization.
- Keep the first route as server-only preview logic with bearer-required structure.
- Do not call GitHub, OpenAI, Kakao, SMS, Push, Supabase write APIs, or scheduler code in this contract PR.

## Follow-Up Steps

1. Add GitHub OAuth and repository ownership verification.
2. Add persistence into `raw_sources`, `experience_cards`, and `experience_evidence`.
3. Wire the candidate into `AiExperienceInboxPanel`.
4. Add the 6 PM notification scheduler.
5. Connect Kakao/Push delivery only after consent, channel eligibility, and privacy review.
