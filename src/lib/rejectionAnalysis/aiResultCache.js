// 서류탈락 원인 분석 AI 심화 해석의 클라이언트 LocalStorage 캐시.
//
// - 목적: 동일 입력(JD + 이력서 + 지원 모집부문 + groundingMode + composite 요약)으로
//   재분석할 때 결과가 매번 미세하게 흔들리는 문제를 줄이고, 불필요한 AI 호출 비용을
//   절감한다.
// - 범위: 브라우저 로컬에서만 보관한다. 서버로 추가 저장하지 않는다.
// - 만료: 저장 시점 기준 24시간 후 자동 무효화된다.
// - 보안: 원문 전체를 key 문자열에 그대로 노출하지 않는다. 길이/앞뒤 일부 + 메타로
//   짧은 signature 를 만들고 해시는 FNV-1a 32-bit 로 생성한다.
// - 안전: LocalStorage 접근/JSON parse 실패, version 불일치, 만료, signature 불일치,
//   ok!==true, data 없음 중 하나라도 해당하면 miss 처리한다.

const CACHE_VERSION = "rejection-ai-cache-v1";
const CACHE_PREFIX = "passmap:rejection-ai-cache:v1:";
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_COMPOSITE_TOP_RISKS = 5;

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function fnv1a32(input) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function summarizeCompositeRiskContext(ctx) {
  if (!ctx || typeof ctx !== "object") return null;
  const summary = ctx.summary && typeof ctx.summary === "object" ? ctx.summary : null;
  const topRisksSource = Array.isArray(ctx.topRisks) ? ctx.topRisks : [];
  const topRisks = topRisksSource.slice(0, MAX_COMPOSITE_TOP_RISKS).map((r) => ({
    key: safeText(r && r.key),
    severity: safeText(r && r.severity),
    title: safeText(r && r.title),
  }));
  return {
    overallBand: summary ? safeText(summary.overallBand) : "",
    topRisks,
  };
}

export function buildRejectionAiCacheKeyPayload({
  jdText,
  resumeText,
  targetRoleInPosting,
  groundingMode,
  compositeRiskContext,
} = {}) {
  const jd = safeText(jdText);
  const resume = safeText(resumeText);
  if (!jd || !resume) return null;
  const target = safeText(targetRoleInPosting).trim();
  const mode = safeText(groundingMode) || "raw";
  const compositeSummary = summarizeCompositeRiskContext(compositeRiskContext);
  const compositeText = compositeSummary ? JSON.stringify(compositeSummary) : "";

  const combinedForHash = [
    `v:${CACHE_VERSION}`,
    `jd:${jd}`,
    `resume:${resume}`,
    `target:${target}`,
    `mode:${mode}`,
    `composite:${compositeText}`,
  ].join("|");
  const hash = fnv1a32(combinedForHash);

  const jdHead = jd.slice(0, 32);
  const jdTail = jd.slice(-32);
  const resumeHead = resume.slice(0, 32);
  const resumeTail = resume.slice(-32);
  const signature = fnv1a32(
    [
      `jdLen:${jd.length}`,
      `resumeLen:${resume.length}`,
      `jdHead:${jdHead}`,
      `jdTail:${jdTail}`,
      `resumeHead:${resumeHead}`,
      `resumeTail:${resumeTail}`,
      `target:${target}`,
      `mode:${mode}`,
      `composite:${compositeText}`,
    ].join("|")
  );

  return { hash, signature, mode, target };
}

function getStorage() {
  try {
    if (typeof window === "undefined") return null;
    const ls = window.localStorage;
    if (!ls) return null;
    const probeKey = `${CACHE_PREFIX}__probe`;
    ls.setItem(probeKey, "1");
    ls.removeItem(probeKey);
    return ls;
  } catch {
    return null;
  }
}

function removeQuietly(ls, storageKey) {
  try { ls.removeItem(storageKey); } catch { /* ignore */ }
}

export function readRejectionAiCache(keyPayload) {
  if (!keyPayload || !keyPayload.hash) return null;
  const ls = getStorage();
  if (!ls) return null;
  const storageKey = `${CACHE_PREFIX}${keyPayload.hash}`;

  let raw;
  try {
    raw = ls.getItem(storageKey);
  } catch {
    return null;
  }
  if (!raw) return null;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    removeQuietly(ls, storageKey);
    return null;
  }

  if (!payload || payload.version !== CACHE_VERSION) {
    removeQuietly(ls, storageKey);
    return null;
  }
  if (typeof payload.expiresAt !== "number" || payload.expiresAt <= Date.now()) {
    removeQuietly(ls, storageKey);
    return null;
  }
  if (payload.signature !== keyPayload.signature) {
    return null;
  }
  if (!payload.result || payload.result.ok !== true || !payload.result.data) {
    return null;
  }
  return payload.result;
}

export function writeRejectionAiCache(keyPayload, result) {
  if (!keyPayload || !keyPayload.hash) return;
  if (!result || result.ok !== true || !result.data) return;
  const ls = getStorage();
  if (!ls) return;

  const now = Date.now();
  const payload = {
    version: CACHE_VERSION,
    createdAt: now,
    expiresAt: now + TTL_MS,
    signature: keyPayload.signature,
    result,
  };
  const storageKey = `${CACHE_PREFIX}${keyPayload.hash}`;
  try {
    ls.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // QuotaExceededError 등은 silent — 캐시 없이도 정상 동작
  }
}
