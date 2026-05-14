// src/lib/workTrace/extractExperienceCandidates.js
// Front-end fetch wrapper for /api/extract-experience-candidates.
// Follows the base URL fallback pattern used across the project.

function _getApiBase() {
  const base = (
    import.meta.env.VITE_PARSE_API_BASE ||
    import.meta.env.VITE_AI_PROXY_URL ||
    import.meta.env.VITE_API_BASE ||
    ""
  ).toString().trim().replace(/\/$/, "");
  return base;
}

/**
 * Extract career experience candidates from raw work trace text.
 *
 * @param {{ rawText: string, signal?: AbortSignal }} params
 * @returns {Promise<{
 *   ok: boolean,
 *   sourceType?: string,
 *   detectedPeriod?: string|null,
 *   summary?: string,
 *   candidates?: object[],
 *   errorCode?: string,
 *   message?: string,
 * }>}
 */
export async function extractExperienceCandidates({ rawText, signal } = {}) {
  if (!rawText || typeof rawText !== "string" || rawText.trim().length < 30) {
    return {
      ok: false,
      errorCode: "RAW_TEXT_TOO_SHORT",
      message: "내용이 너무 짧아요. 조금 더 입력해 주세요.",
    };
  }

  const base = _getApiBase();
  const url = base ? `${base}/api/extract-experience-candidates` : "/api/extract-experience-candidates";

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: rawText.trim() }),
      ...(signal ? { signal } : {}),
    });
  } catch (e) {
    if (e?.name === "AbortError") {
      return { ok: false, errorCode: "ABORTED", message: "요청이 취소됐어요." };
    }
    return {
      ok: false,
      errorCode: "NETWORK_ERROR",
      message: "서버에 연결하지 못했어요. 네트워크를 확인해 주세요.",
    };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, errorCode: "PARSE_ERROR", message: "서버 응답을 읽지 못했어요." };
  }

  if (!res.ok || !data?.ok) {
    const errCode = data?.error?.code || `HTTP_${res.status}`;
    const errMsg = data?.error?.message || "경험 분석 중 오류가 발생했어요.";
    return { ok: false, errorCode: errCode, message: errMsg };
  }

  const d = data.data || {};
  return {
    ok: true,
    sourceType: d.sourceType || "unknown",
    detectedPeriod: d.detectedPeriod ?? null,
    summary: d.summary || "",
    candidates: Array.isArray(d.experienceCandidates) ? d.experienceCandidates : [],
  };
}
