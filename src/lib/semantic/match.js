// src/lib/semantic/match.js
// JD/이력서 문장 의미매칭(Top-K) - 임베딩 기반

import { embedText } from "./embedding.js";

export function splitToUnits(text, { maxUnits = 140, isJd = false } = {}) {
  // ✅ PATCH ROUND 13 (append-only): JD noise filter helpers
  function __normalizeUnitLine(s) {
    return s
      .replace(/^[\-\•\·\*\s]+/, "")
      .replace(/^(\d+\.)\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  function __isLikelyJdNoiseLine(s, original) {
    // bullet prefix가 original에 있으면 noise 판단 안 함
    if (/^[\s]*[\-\•\·\*]/.test(original) || /^[\s]*\d+\./.test(original)) return false;
    // 보수 규칙: 짧은 업무명 종결어로 끝나는 경우 noise 아님
    // 예: "Payroll 운영", "급여 정산", "4대보험 신고", "HRIS 관리"
    const __TASK_ENDINGS = ["운영", "관리", "정산", "기획", "분석", "신고", "지원", "개선", "구축", "처리", "수립", "대응"];
    if (s.length <= 30 && __TASK_ENDINGS.some(e => s.endsWith(e))) return false;
    // 1) 정확 문구
    const __EXACT = ["이런 일을 합니다", "이런 업무를 합니다", "다음과 같은 업무를 수행합니다", "이런 분을 찾고 있어요"];
    if (__EXACT.some(e => s === e || s === e + ".")) return true;
    // 2) 섹션 소개형
    if (/^주요 업무는|^담당 업무는|^이 포지션은|^본 포지션은|^우리 팀은|^자격요건은|^우대사항은/.test(s)) return true;
    // 3) 헤더성 단문 (정확 일치 또는 콜론)
    const __HEADER = ["담당업무", "주요업무", "자격요건", "우대사항", "지원자격", "필수요건", "주요 역할", "주요 업무", "담당 업무", "Responsibilities", "Requirements", "Preferred"];
    if (__HEADER.some(w => s === w || s === w + ":")) return true;
    // 4) 설명형 종결
    if (/합니다\.?$|입니다\.?$|드립니다\.?$|됩니다\.?$|수행합니다\.?$|담당합니다\.?$/.test(s)) return true;
    return false;
  }

  const t0 = (text ?? "").toString();
  if (!t0.trim()) return [];

  // 1) 줄 단위 우선
  let parts = t0
    .split(/\r?\n+/)
    .map((x) => x.trim())
    .filter(Boolean);

  // 2) 불릿/구분자 추가 분해
  const out = [];
  for (const p of parts) {
    // 너무 길면 문장 기호로 추가 분해(한국어도 대체로 마침표/;/: 사용)
    const sub = p
      .split(/(?<=[\.\!\?\;\:])\s+|[\-]\s+/g)
      .map((x) => x.trim())
      .filter(Boolean);

    for (const s of sub) {
      const ss = __normalizeUnitLine(s);
      // 너무 짧은 건 제외
      if (ss.length < 8) continue;
      // ✅ PATCH ROUND 13 (append-only): JD noise filter (isJd=true일 때만 적용)
      if (isJd && __isLikelyJdNoiseLine(ss, s)) continue;
      out.push(ss);
      if (out.length >= maxUnits) return out;
    }
  }
  return out.slice(0, maxUnits);
}

export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let na = 0;
  let nb = 0;

  for (let i = 0; i < a.length; i++) {
    const x = Number(a[i]);
    const y = Number(b[i]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (!denom) return 0;
  return dot / denom;
}

export async function semanticMatchJDResume(jdText, resumeText, opts = {}) {
  // ✅ PATCH (append-only): opts.jdUnits가 있으면 structured units 사용, 없으면 raw split fallback
  const jdUnits =
    Array.isArray(opts?.jdUnits) && opts.jdUnits.length > 0
      ? opts.jdUnits.slice(0, opts?.maxJdUnits ?? 40)
      : splitToUnits(jdText, { maxUnits: opts?.maxJdUnits ?? 40, isJd: true });
  const rsUnits = splitToUnits(resumeText, { maxUnits: opts?.maxResumeUnits ?? 120 });

  // ✅ PATCH ROUND 4 (append-only): semantic 전용 필터 — 짧은 단어 토큰(sap, excel 등) 제거
  // original jdUnits는 유지, embedding 입력에만 semanticUnits 사용
  function __isValidSemanticUnit(t) {
    if (!t) return false;
    const s = String(t).trim();
    if (!s) return false;
    if (s.length < 5) return false;
    if (!s.includes(" ")) return false;
    return true;
  }
  const semanticUnits = jdUnits.filter(__isValidSemanticUnit);
  // ✅ PATCH ROUND 5 (append-only): semanticUnits가 빈 경우 soft fallback
  // — 모든 jdUnits가 짧은 토큰일 때 recall 0 방지
  const finalSemanticUnits =
    semanticUnits.length > 0
      ? semanticUnits
      : jdUnits
          .map((x) => String(x || "").trim())
          .filter(Boolean)
          .slice(0, Math.min(10, opts?.maxJdUnits ?? 40));

  if (finalSemanticUnits.length === 0 || rsUnits.length === 0) {
    return {
      ok: false,
      reason: "insufficient_text",
      jdCount: jdUnits.length,
      resumeCount: rsUnits.length,
      matches: [],
    };
  }

  const embedOpts = {
    device: opts?.device ?? "auto",
    dtype: opts?.dtype ?? "q8",
    useLocalStorageCache: opts?.useLocalStorageCache ?? true,
  };

  // 임베딩 생성(순차/병렬). 너무 많은 병렬은 브라우저 부담  제한 병렬
  const concurrency = Math.max(1, Math.min(4, opts?.concurrency ?? 3));
  async function mapLimit(list, fn) {
    const res = new Array(list.length);
    let idx = 0;
    const workers = new Array(concurrency).fill(0).map(async () => {
      while (idx < list.length) {
        const cur = idx++;
        res[cur] = await fn(list[cur], cur);
      }
    });
    await Promise.all(workers);
    return res;
  }

  const jdEmb = await mapLimit(finalSemanticUnits, (t) => embedText(t, embedOpts));
  const rsEmb = await mapLimit(rsUnits, (t) => embedText(t, embedOpts));

  const topK = Math.max(1, Math.min(8, opts?.topK ?? 4));
  const matches = [];

  for (let i = 0; i < finalSemanticUnits.length; i++) {
    const a = jdEmb[i];
    if (!a) {
      matches.push({
        jd: finalSemanticUnits[i],
        candidates: [],
        best: null,
      });
      continue;
    }

    const scored = [];
    for (let j = 0; j < rsUnits.length; j++) {
      const b = rsEmb[j];
      if (!b) continue;
      const s = cosineSimilarity(a, b);
      scored.push({ text: rsUnits[j], score: s });
    }

    scored.sort((x, y) => (y.score - x.score));
    const candidates = scored.slice(0, topK);

    matches.push({
      jd: finalSemanticUnits[i],
      candidates,
      best: candidates[0] ?? null,
    });
  }

  return {
    ok: true,
    model: "Xenova/all-MiniLM-L6-v2",
    device: embedOpts.device,
    dtype: embedOpts.dtype,
    jdCount: jdUnits.length,
    resumeCount: rsUnits.length,
    topK,
    matches,
  };
}
