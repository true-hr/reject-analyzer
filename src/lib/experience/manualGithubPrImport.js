const SENSITIVE_KEY_RE = /(token|secret|credential|authorization|password|private[_-]?key|service[_-]?role|oauth|patch|diff)/i;
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

export const MANUAL_GITHUB_PR_DEFAULT_CHANGED_FILES =
  "src/components/example.js, modified, 24, 3";

function asText(value, max = 1000) {
  if (value === null || value === undefined) return "";
  const text = String(value)
    .replace(/@@[\s\S]*?@@/g, "[REDACTED_DIFF]")
    .replace(SENSITIVE_VALUE_RE, "[REDACTED]")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function sanitizeObject(value) {
  if (Array.isArray(value)) return value.map(sanitizeObject);
  if (!value || typeof value !== "object") return typeof value === "string" ? asText(value, 2000) : value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEY_RE.test(key))
      .map(([key, entry]) => [key, sanitizeObject(entry)])
  );
}

export function normalizeGithubRepositoryInput(value) {
  const raw = asText(value, 300)
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^github\.com\//i, "")
    .replace(/\/pull\/\d+.*$/i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");
  const parts = raw.split("/").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return raw;
  return `${parts[0]}/${parts[1]}`;
}

export function parseManualGithubChangedFilesSummary(value) {
  const lines = String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines
    .map((line) => {
      const parts = line.split(",").map((part) => part.trim());
      const filename = asText(parts[0], 240);
      if (!filename) return null;
      return {
        filename,
        status: asText(parts[1] || "modified", 40) || "modified",
        additions: asNumber(parts[2], 0),
        deletions: asNumber(parts[3], 0),
      };
    })
    .filter(Boolean)
    .slice(0, 20);
}

export function validateManualGithubPrImportInput(input = {}) {
  const repoFullName = normalizeGithubRepositoryInput(input.repository);
  const prNumber = Number(input.prNumber);
  const title = asText(input.title, 240);
  const files = parseManualGithubChangedFilesSummary(input.changedFilesSummary);
  const errors = [];
  if (!repoFullName || !/^[^/\s]+\/[^/\s]+$/.test(repoFullName)) {
    errors.push("Repository full name 또는 GitHub PR URL을 owner/repo 형태로 입력해 주세요.");
  }
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    errors.push("PR number는 1 이상의 숫자여야 합니다.");
  }
  if (!title) {
    errors.push("PR title은 필수입니다.");
  }
  if (files.length === 0) {
    errors.push("changed files summary를 1개 이상 입력해 주세요.");
  }
  return {
    ok: errors.length === 0,
    errors,
    normalized: { repoFullName, prNumber, title, files },
  };
}

export function buildManualGithubPrImportPayload(input = {}) {
  const validation = validateManualGithubPrImportInput(input);
  if (!validation.ok) {
    const err = new Error(validation.errors.join(" "));
    err.code = "MANUAL_GITHUB_PR_IMPORT_INVALID";
    err.validation = validation;
    throw err;
  }

  const { repoFullName, prNumber, title, files } = validation.normalized;
  const additions = asNumber(input.additions, files.reduce((sum, file) => sum + file.additions, 0));
  const deletions = asNumber(input.deletions, files.reduce((sum, file) => sum + file.deletions, 0));
  const mergedAt = asText(input.mergedAt, 80) || null;
  const body = asText(input.body, 2000);
  const safePayload = {
    action: "closed",
    repository: {
      full_name: repoFullName,
      html_url: `https://github.com/${repoFullName}`,
    },
    pull_request: {
      number: prNumber,
      title,
      body,
      html_url: `https://github.com/${repoFullName}/pull/${prNumber}`,
      additions,
      deletions,
      merged_at: mergedAt,
    },
    files,
  };
  return sanitizeObject(safePayload);
}

export function buildManualGithubPrImportDisplay(response = {}) {
  const preview = response?.preview && typeof response.preview === "object" ? response.preview : {};
  return {
    ok: response?.ok === true,
    candidateId: asText(response?.candidate_id, 120),
    rawSourceId: asText(response?.raw_source_id, 120),
    dedupeKey: asText(response?.dedupe_key, 300),
    status: asText(response?.status, 60),
    workTitle: asText(preview.work_title, 240),
    summary: asText(preview.summary, 800),
    suggestedResumeBullet: asText(preview.suggested_resume_bullet, 800),
    evidenceCount: asNumber(preview.evidence_count, 0),
  };
}
