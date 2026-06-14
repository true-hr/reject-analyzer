import {
  readBearerToken,
  setCors,
  jsonError,
  getServiceRoleClient,
  verifySupabaseAccessToken,
} from "../_mcp_auth.js";
import {
  GITHUB_PR_SOURCE_TYPE,
  buildGithubPrCareerCandidateContract,
} from "../../src/lib/githubCareerCandidateContract.js";

export const GITHUB_PR_CANDIDATE_IMPORT_METHOD = "github_pr_career_candidate_preview";
export const GITHUB_PR_CANDIDATE_DEFAULT_STATUS = "accepted";

function asString(value, max = 400) {
  if (typeof value !== "string") return "";
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > max ? trimmed.slice(0, max - 3) + "..." : trimmed;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function mapResumePotential(contract) {
  const impact = contract?.career_asset_candidate?.impact_level;
  if (impact === "high") return "high";
  if (impact === "focused") return "medium";
  return "medium";
}

function mapConfidenceLevel(contract) {
  const fileCount = Number(contract?.work_signal?.stats?.changed_file_count || 0);
  const additions = Number(contract?.work_signal?.stats?.additions || 0);
  if (fileCount >= 3 || additions >= 120) return "medium";
  return "low";
}

export function buildGithubPrPersistenceRows({ userId, contract }) {
  const verifiedUserId = asString(userId, 80);
  if (!verifiedUserId) {
    throw new Error("userId is required");
  }
  if (!contract?.dedupe_key) {
    throw new Error("contract.dedupe_key is required");
  }

  const workSignal = contract.work_signal || {};
  const asset = contract.career_asset_candidate || {};
  const trace = contract.trace || {};
  const stats = workSignal.stats || {};
  const safeTitle = asString(asset.title || workSignal.title || "GitHub PR career candidate", 180);
  const safeSummary = asString(asset.evidence_summary || workSignal.summary, 500);
  const suggestedResumeBullet = asString(asArray(contract.resume_bullet_candidates)[0], 600) || null;
  const changedFiles = asArray(workSignal.changed_files).slice(0, 20);
  const evidenceTexts = [
    asString(workSignal.title ? `PR title: ${workSignal.title}` : "", 300),
    asString(asArray(contract.evidence)[0]?.body_excerpt ? `PR body summary: ${asArray(contract.evidence)[0].body_excerpt}` : "", 360),
    asString(
      changedFiles.length > 0
        ? `Changed files: ${changedFiles
            .map((file) => `${file.filename} (${file.status}, +${file.additions}/-${file.deletions})`)
            .join("; ")}`
        : "",
      900
    ),
    asString(`PR stats: ${Number(stats.changed_file_count || 0)} files, +${Number(stats.additions || 0)}/-${Number(stats.deletions || 0)}`, 160),
  ].filter(Boolean);

  const baseMetadata = {
    importMethod: GITHUB_PR_CANDIDATE_IMPORT_METHOD,
    sourceType: GITHUB_PR_SOURCE_TYPE,
    dedupe_key: contract.dedupe_key,
    recommended_action: contract.recommended_action,
    trace,
    rawTextStored: false,
    fullDiffStored: false,
  };

  return {
    rawSource: {
      user_id: verifiedUserId,
      work_record_id: null,
      source_type: GITHUB_PR_SOURCE_TYPE,
      source_label: `GitHub PR #${trace.pr_number || 0}: ${safeTitle}`,
      detected_period: trace.merged_at || null,
      raw_text: null,
      file_url: null,
      file_name: null,
      mime_type: null,
      summary: safeSummary || null,
      processing_status: "processed",
      metadata: {
        ...baseMetadata,
        pr_url: trace.pr_url || null,
        stats,
        changed_files: changedFiles,
      },
    },
    card: {
      user_id: verifiedUserId,
      source_id: null,
      work_record_id: null,
      title: safeTitle,
      situation: safeSummary || null,
      task: asset.contribution_scope ? `Review ${asset.contribution_scope.replace(/_/g, " ")} contribution as a career asset candidate.` : null,
      actions: changedFiles.map((file) => `${file.status || "modified"} ${file.filename}`).slice(0, 10),
      result: {
        summary: safeSummary || null,
        stats,
      },
      collaboration: [],
      skills: [workSignal.type].filter(Boolean),
      job_tags: ["software_engineering"],
      industry_tags: [],
      resume_potential: mapResumePotential(contract),
      confidence_level: mapConfidenceLevel(contract),
      suggested_resume_bullet: suggestedResumeBullet,
      missing_info_questions: [],
      risk_notes: [],
      differ_reason: null,
      status: GITHUB_PR_CANDIDATE_DEFAULT_STATUS,
      metadata: {
        ...baseMetadata,
        work_signal: workSignal,
        career_asset_candidate: asset,
      },
    },
    evidence: evidenceTexts.map((evidenceText, evidenceIndex) => ({
      user_id: verifiedUserId,
      experience_card_id: null,
      source_id: null,
      evidence_text: evidenceText,
      evidence_type: "github_pr_metadata",
      source_offset_start: null,
      source_offset_end: null,
      metadata: {
        importMethod: GITHUB_PR_CANDIDATE_IMPORT_METHOD,
        dedupe_key: contract.dedupe_key,
        evidenceIndex,
      },
    })),
  };
}

export function findExistingGithubPrCandidate(rows = []) {
  const normalized = asArray(rows).filter((row) => row?.id);
  return (
    normalized.find((row) => row.status === "accepted") ||
    normalized.find((row) => row.status === "converted") ||
    normalized.find((row) => row.status === "archived") ||
    normalized[0] ||
    null
  );
}

export function buildGithubPrPersistenceResponse({ card, rawSourceId, contract, evidenceCount }) {
  const workSignal = contract?.work_signal || {};
  const asset = contract?.career_asset_candidate || {};
  const bullet = asString(asArray(contract?.resume_bullet_candidates)[0], 600);
  return {
    ok: true,
    candidate_id: card?.id || null,
    raw_source_id: rawSourceId || card?.source_id || null,
    dedupe_key: contract?.dedupe_key || null,
    status: card?.status || GITHUB_PR_CANDIDATE_DEFAULT_STATUS,
    preview: {
      work_title: asString(asset.title || workSignal.title, 180),
      summary: asString(asset.evidence_summary || workSignal.summary, 500),
      suggested_resume_bullet: bullet || null,
      evidence_count: Number(evidenceCount || 0),
    },
  };
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "POST required");
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonError(res, 503, "SUPABASE_NOT_CONFIGURED", "Service is not configured");
  }

  const accessToken = readBearerToken(req);
  const identity = await verifySupabaseAccessToken({ accessToken, supabase });
  if (!identity.ok) {
    return jsonError(res, identity.status || 401, "AUTH_REQUIRED", identity.message);
  }
  const verifiedUserId = identity.userId;

  // Persistence MVP:
  // - no GitHub API calls
  // - no model calls
  // - no notification dispatch
  const payload = req.body?.payload || req.body;
  const contract = buildGithubPrCareerCandidateContract(payload);

  let existing = null;
  try {
    const { data, error } = await supabase
      .from("experience_cards")
      .select("id, source_id, status")
      .eq("user_id", verifiedUserId)
      .eq("metadata->>dedupe_key", contract.dedupe_key)
      .limit(10);
    if (error) {
      console.error("[github-pr-preview] dedupe lookup failed:", error.message);
      return jsonError(res, 500, "SAVE_FAILED", "Could not save GitHub PR candidate");
    }
    existing = findExistingGithubPrCandidate(data);
  } catch (err) {
    console.error("[github-pr-preview] dedupe lookup unexpected:", err?.message || "unknown");
    return jsonError(res, 500, "SAVE_FAILED", "Could not save GitHub PR candidate");
  }

  if (existing) {
    return res.status(200).json(
      buildGithubPrPersistenceResponse({
        card: existing,
        rawSourceId: existing.source_id,
        contract,
        evidenceCount: contract.evidence?.length || 0,
      })
    );
  }

  const rows = buildGithubPrPersistenceRows({ userId: verifiedUserId, contract });
  let rawSource = null;
  try {
    const { data, error } = await supabase
      .from("raw_sources")
      .insert(rows.rawSource)
      .select("id")
      .single();
    if (error || !data?.id) {
      console.error("[github-pr-preview] raw_sources insert failed:", error?.message || "unknown");
      return jsonError(res, 500, "SAVE_FAILED", "Could not save GitHub PR candidate");
    }
    rawSource = data;
  } catch (err) {
    console.error("[github-pr-preview] raw_sources unexpected:", err?.message || "unknown");
    return jsonError(res, 500, "SAVE_FAILED", "Could not save GitHub PR candidate");
  }

  let card = null;
  try {
    const { data, error } = await supabase
      .from("experience_cards")
      .insert({
        ...rows.card,
        source_id: rawSource.id,
      })
      .select("id, source_id, status")
      .single();
    if (error || !data?.id) {
      console.error("[github-pr-preview] experience_cards insert failed:", error?.message || "unknown");
      return jsonError(res, 500, "SAVE_FAILED", "Could not save GitHub PR candidate");
    }
    card = data;
  } catch (err) {
    console.error("[github-pr-preview] experience_cards unexpected:", err?.message || "unknown");
    return jsonError(res, 500, "SAVE_FAILED", "Could not save GitHub PR candidate");
  }

  let evidenceCount = 0;
  if (rows.evidence.length > 0) {
    try {
      const { error } = await supabase.from("experience_evidence").insert(
        rows.evidence.map((row) => ({
          ...row,
          experience_card_id: card.id,
          source_id: rawSource.id,
        }))
      );
      if (error) {
        console.error("[github-pr-preview] evidence insert failed:", error.message);
      } else {
        evidenceCount = rows.evidence.length;
      }
    } catch (err) {
      console.error("[github-pr-preview] evidence unexpected:", err?.message || "unknown");
    }
  }

  return res.status(200).json(
    buildGithubPrPersistenceResponse({
      card,
      rawSourceId: rawSource.id,
      contract,
      evidenceCount,
    })
  );
}
