import { createHash } from "node:crypto";

export const GITHUB_PR_SOURCE_TYPE = "github_pull_request";
export const GITHUB_PR_RECOMMENDED_ACTION = "review_career_asset_candidate";
export const GITHUB_PR_STATUS_MAPPING = Object.freeze({
  rejected: "archived",
  accepted: "converted",
});

const SENSITIVE_KEY_RE = /(token|secret|credential|authorization|password|private[_-]?key|service[_-]?role|oauth)/i;
const SENSITIVE_VALUE_RE = new RegExp(
  [
    "gh" + "[pousr]_[A-Za-z0-9_]{20,}",
    "github" + "_pat_[A-Za-z0-9_]{20,}",
    "sk" + "-[A-Za-z0-9_-]{20,}",
    "Bearer\\s+[A-Za-z0-9._-]+",
    "service" + "[_-]?role[_-]?key",
    "client" + "[_-]?secret",
  ].join("|"),
  "gi"
);

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashValue(value) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function asText(value) {
  return typeof value === "string" ? value : "";
}

function sanitizeText(value) {
  return asText(value).replace(SENSITIVE_VALUE_RE, "[REDACTED]");
}

function sanitizeObject(value) {
  if (Array.isArray(value)) return value.map(sanitizeObject);
  if (!value || typeof value !== "object") {
    return typeof value === "string" ? sanitizeText(value) : value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEY_RE.test(key))
      .map(([key, entry]) => [key, sanitizeObject(entry)])
  );
}

function normalizeWhitespace(value) {
  return sanitizeText(value).replace(/\s+/g, " ").trim();
}

function slug(value) {
  return normalizeWhitespace(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function getRepoIdentifier(payload) {
  const repo = payload?.repository || {};
  return (
    asText(repo.full_name) ||
    asText(repo.node_id) ||
    asText(repo.html_url) ||
    asText(payload?.repo) ||
    "unknown-repository"
  );
}

function getPullRequest(payload) {
  return payload?.pull_request || payload?.pr || payload || {};
}

function summarizeFiles(files) {
  return (Array.isArray(files) ? files : [])
    .map((file) => ({
      filename: asText(file.filename || file.path),
      status: asText(file.status || "modified"),
      additions: Number(file.additions || 0),
      deletions: Number(file.deletions || 0),
    }))
    .filter((file) => file.filename)
    .slice(0, 20);
}

function classifySignal(title, body, files) {
  const text = `${title} ${body} ${files.map((file) => file.filename).join(" ")}`.toLowerCase();
  if (/(auth|login|oauth|permission|rls|security)/.test(text)) return "security_auth";
  if (/(test|fixture|contract|qa|spec)/.test(text)) return "quality_contract";
  if (/(ui|ux|panel|modal|screen|layout)/.test(text)) return "product_ui";
  if (/(api|route|server|endpoint|webhook)/.test(text)) return "backend_api";
  if (/(db|sql|schema|migration|supabase)/.test(text)) return "data_model";
  return "product_engineering";
}

function inferImpactLevel(additions, deletions, files) {
  if (files >= 8 || additions + deletions >= 600) return "high";
  if (files >= 3 || additions + deletions >= 120) return "medium";
  return "focused";
}

function buildSummary(title, signalType, additions, deletions, files) {
  const cleanTitle = normalizeWhitespace(title) || "GitHub pull request";
  return `${cleanTitle} (${signalType}, ${files} files, +${additions}/-${deletions})`;
}

export function buildGithubPrCareerCandidateContract(payload) {
  const cleanPayload = sanitizeObject(payload || {});
  const pr = getPullRequest(cleanPayload);
  const repoIdentifier = getRepoIdentifier(cleanPayload);
  const prNumber = Number(pr.number || cleanPayload.number || 0);
  const title = normalizeWhitespace(pr.title);
  const body = normalizeWhitespace(pr.body);
  const files = summarizeFiles(cleanPayload.files || pr.files || []);
  const additions = Number(pr.additions ?? cleanPayload.additions ?? files.reduce((sum, file) => sum + file.additions, 0));
  const deletions = Number(pr.deletions ?? cleanPayload.deletions ?? files.reduce((sum, file) => sum + file.deletions, 0));
  const mergedAt = asText(pr.merged_at || cleanPayload.merged_at);
  const signalType = classifySignal(title, body, files);
  const impactLevel = inferImpactLevel(additions, deletions, files.length);
  const normalizedWorkSignal = {
    repo_identifier: repoIdentifier,
    pr_number: prNumber,
    signal_type: signalType,
    impact_level: impactLevel,
    title_slug: slug(title),
    changed_file_count: files.length,
    additions,
    deletions,
    merged_at: mergedAt || null,
  };
  const normalizedWorkSignalHash = hashValue(normalizedWorkSignal).slice(0, 16);
  const summary = buildSummary(title, signalType, additions, deletions, files.length);

  return {
    source_type: GITHUB_PR_SOURCE_TYPE,
    trace: {
      provider: "github",
      event: "pull_request",
      repo_identifier: repoIdentifier,
      pr_number: prNumber,
      pr_url: asText(pr.html_url),
      merged_at: mergedAt || null,
      source_hash: hashValue({
        repo_identifier: repoIdentifier,
        pr_number: prNumber,
        title,
        merged_at: mergedAt || null,
      }).slice(0, 16),
    },
    work_signal: {
      id: `github-pr:${repoIdentifier}:${prNumber}:${normalizedWorkSignalHash}`,
      type: signalType,
      title,
      summary,
      merged_at: mergedAt || null,
      changed_files: files,
      stats: { additions, deletions, changed_file_count: files.length },
      normalized_hash: normalizedWorkSignalHash,
    },
    career_asset_candidate: {
      asset_type: "project_contribution",
      title: title || `PR #${prNumber}`,
      contribution_scope: signalType,
      impact_level: impactLevel,
      evidence_summary: summary,
      review_status_mapping: {
        reject: GITHUB_PR_STATUS_MAPPING.rejected,
        approve: GITHUB_PR_STATUS_MAPPING.accepted,
      },
    },
    resume_bullet_candidates: [
      `Delivered ${signalType.replace(/_/g, " ")} work through PR #${prNumber} across ${files.length} files with +${additions}/-${deletions} changes.`,
    ],
    evidence: [
      {
        evidence_type: "pull_request_metadata",
        title,
        body_excerpt: body.slice(0, 240),
        files,
        merged_at: mergedAt || null,
      },
    ],
    dedupe_key: `github_pr:${repoIdentifier}:${prNumber}:${normalizedWorkSignalHash}`,
    recommended_action: GITHUB_PR_RECOMMENDED_ACTION,
  };
}

export function containsSensitiveContractValue(value) {
  const serialized = stableStringify(value);
  SENSITIVE_VALUE_RE.lastIndex = 0;
  return SENSITIVE_VALUE_RE.test(serialized);
}
