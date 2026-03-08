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

export function isHighQualityJDSentence(sentence) {
  const s = String(sentence || "").trim();
  if (!s) return false;
  if (s.length < 8) return false;

  const compact = s.replace(/\s+/g, "");
  const uiNoiseRe = /(접수기간|기업정보|추천공고|문의|지원방법|마감일|복리후생안내|더보기|공유하기|스크랩|공고원문보기|채용관)/;
  if (compact.length <= 28 && uiNoiseRe.test(compact)) return false;

  // very short header/footer-like fragments
  if (s.length <= 20 && /^(담당업무|주요업무|자격요건|우대사항|지원자격|필수요건|requirements|responsibilities|preferred|qualifications)\:?$/i.test(s)) {
    return false;
  }

  return true;
}

export function extractSentenceDomain(sentence) {
  const s = String(sentence || "").toLowerCase();
  if (!s.trim()) return "unknown";

  const taxonomy = [
    { domain: "service_planning", re: /(서비스\s*기획|서비스기획|프로덕트|product|\bpm\b|\bpo\b|요구사항|로드맵)/i },
    { domain: "strategy", re: /(전략기획|사업전략|경영기획|신사업|\bgtm\b|growth\s*strategy|go[-\s]?to[-\s]?market)/i },
    { domain: "data_analysis", re: /(\bsql\b|\bbi\b|대시보드|지표|가설검증|ab\s*test|a\/b\s*test)/i },
    { domain: "marketing", re: /(캠페인|브랜딩|퍼포먼스|\bcrm\b)/i },
    { domain: "hr", re: /(채용|평가|노무|온보딩|조직문화)/i },
    { domain: "operations", re: /(현장관리|스케줄|물류|운영관리|오퍼레이션)/i },
    { domain: "finance", re: /(재무|회계|결산|예산|손익|세무)/i },
    { domain: "sales", re: /(영업|세일즈|수주|리드관리|account\s*executive|\bbd\b)/i },
  ];

  const matchedDomains = [];
  for (const rule of taxonomy) {
    if (rule.re.test(s)) matchedDomains.push(rule.domain);
  }
  if (matchedDomains.length === 1) return matchedDomains[0];
  if (matchedDomains.length === 0) return "unknown";
  return "unknown";
}

export function isDomainCompatible(jdDomain, resumeDomain) {
  const j = String(jdDomain || "unknown");
  const r = String(resumeDomain || "unknown");
  if (j === "unknown" || r === "unknown") return true;
  return j === r;
}

export function isSemanticScoreAcceptable(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return false;
  return n >= 0.75;
}

export function isGenericSemanticSentence(line) {
  const s = String(line || "").trim();
  if (!s) return true;
  const t = s.toLowerCase();

  const headlineTokenMatches = t.match(/채용|모집|경력직|신입|인턴|팀장\/팀원|팀장|팀원|담당자|부문|포지션|직군/g) || [];
  const hasRecruitVerb = /(채용|모집)/.test(t);
  const hasHeadlineRole = /(경력직|신입|인턴|팀장\/팀원|팀장|팀원|담당자|부문|포지션|직군)/.test(t);
  if (s.length <= 48 && hasRecruitVerb && hasHeadlineRole) return true;
  if (s.length <= 52 && headlineTokenMatches.length >= 3) return true;

  const specificRe = /(로드맵|서비스\s*정책|와이어프레임|\bgtm\b|\bkpi\b|\bsql\b|\bcrm\b|a\/b\s*테스트|ab\s*test|사용자\s*데이터|경쟁사\s*분석|경영진\s*보고|현장관리|스케줄|물류|운영관리|오퍼레이션)/i;
  if (specificRe.test(t)) return false;

  const genericMatches = t.match(/관리|지원|대응|협업|개선|운영|조정|요청사항|프로세스|커뮤니케이션/g) || [];
  if (genericMatches.length >= 2) return true;
  if (genericMatches.length >= 1 && s.length <= 30) return true;

  return false;
}

export function shouldAllowUnknownSafePair(jdText, resumeText, jdDomain, resumeDomain) {
  const j = String(jdDomain || "unknown");
  const r = String(resumeDomain || "unknown");

  if (j !== "unknown" && r !== "unknown") return true;

  const jdGeneric = isGenericSemanticSentence(jdText);
  const rsGeneric = isGenericSemanticSentence(resumeText);

  if (j === "unknown" && r === "unknown") {
    // both unknown: only pass when both sides are not generic
    return !(jdGeneric || rsGeneric);
  }

  const strictKnown = new Set(["service_planning", "strategy", "data_analysis", "marketing", "operations"]);
  if (j !== "unknown" && r === "unknown") {
    if (strictKnown.has(j) && rsGeneric) return false;
    return true;
  }
  if (j === "unknown" && r !== "unknown") {
    if (strictKnown.has(r) && jdGeneric) return false;
    return true;
  }

  return true;
}

// append-only: pair-state classifier for semantic acceptance policy
export function getSemanticPairState(jdDomain, resumeDomain) {
  const j = String(jdDomain || "unknown");
  const r = String(resumeDomain || "unknown");
  if (j === "unknown" && r === "unknown") return "unknown-unknown";
  if (j !== "unknown" && r === "unknown") return "known-unknown";
  if (j === "unknown" && r !== "unknown") return "unknown-known";
  if (j === r) return "known-known-match";
  return "known-known-mismatch";
}

// append-only: semantic threshold policy v2
export function getSemanticAcceptanceThresholdByPairState(pairState) {
  const p = String(pairState || "unknown-unknown");
  if (p === "known-known-match") return 0.7;
  if (p === "known-unknown") return 0.82;
  if (p === "unknown-known") return 0.82;
  if (p === "known-known-mismatch") return 0.85;
  return 0.75; // unknown-unknown / fallback
}

export async function semanticMatchJDResume(jdText, resumeText, opts = {}) {
  // ✅ PATCH (append-only): semantic input post-process helpers
  function __normUnitKey(s) {
    return String(s || "")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }
  function __dedupeUnits(arr) {
    const src = Array.isArray(arr) ? arr : [];
    const out = [];
    const seen = new Set();
    for (const x of src) {
      const t = String(x || "").trim();
      if (!t) continue;
      const k = __normUnitKey(t);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  }
  function __isLikelySemanticJdNoiseLine(s) {
    const t = String(s || "").trim();
    if (!t) return false;
    const k = t.replace(/\s+/g, "");
    // conservative: only short portal/ui labels
    if (k.length <= 24 && /^(접수기간|기업정보|추천공고|문의해주세요|채용관|상세요강|지원방법|더보기|공고원문보기|공유하기|스크랩)$/.test(k)) return true;
    if (k.length <= 24 && /(더보기|공유하기|스크랩|문의해주세요|추천공고|공고원문보기)/.test(k)) return true;
    // keep likely JD core headers
    if (/(담당업무|주요업무|자격요건|우대사항|지원자격|필수요건|requirements|responsibilities|qualifications|preferred)/i.test(t)) return false;
    return false;
  }

  // ✅ PATCH (append-only): opts.jdUnits가 있으면 structured units 사용, 없으면 raw split fallback
  let jdUnits =
    Array.isArray(opts?.jdUnits) && opts.jdUnits.length > 0
      ? opts.jdUnits.slice(0, opts?.maxJdUnits ?? 40)
      : splitToUnits(jdText, { maxUnits: opts?.maxJdUnits ?? 40, isJd: true });
  let rsUnits = splitToUnits(resumeText, { maxUnits: opts?.maxResumeUnits ?? 120 });
  // ✅ PATCH (append-only): dedupe inputs right after split/bridge
  jdUnits = __dedupeUnits(jdUnits);
  rsUnits = __dedupeUnits(rsUnits);

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
  // ✅ PATCH (append-only): 2nd-pass JD semantic noise filter + dedupe
  const finalSemanticUnitsFiltered = __dedupeUnits(
    finalSemanticUnits.filter((x) => !__isLikelySemanticJdNoiseLine(x))
  );
  const finalSemanticUnitsSafe =
    finalSemanticUnitsFiltered.length > 0 ? finalSemanticUnitsFiltered : finalSemanticUnits;
  const finalJdUnitsForMatch = finalSemanticUnitsSafe.filter(isHighQualityJDSentence);
  const jdUnitsForMatch =
    finalJdUnitsForMatch.length > 0 ? finalJdUnitsForMatch : [];

  if (jdUnitsForMatch.length === 0 || rsUnits.length === 0) {
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

  const jdEmb = await mapLimit(jdUnitsForMatch, (t) => embedText(t, embedOpts));
  const rsEmb = await mapLimit(rsUnits, (t) => embedText(t, embedOpts));
  const jdDomains = jdUnitsForMatch.map((t) => extractSentenceDomain(t));
  const rsDomains = rsUnits.map((t) => extractSentenceDomain(t));
  const __policyStats = {
    acceptedCount: 0,
    blockedByDomainCompatCount: 0,
    blockedByUnknownSafeCount: 0,
    blockedByThresholdCount: 0,
  };

  const topK = Math.max(1, Math.min(8, opts?.topK ?? 4));
  const matches = [];

  for (let i = 0; i < jdUnitsForMatch.length; i++) {
    const a = jdEmb[i];
    if (!a) {
      matches.push({
        jd: jdUnitsForMatch[i],
        candidates: [],
        best: null,
        debug: {
          pairState: null,
          rawBestScore: null,
          appliedThreshold: null,
          acceptedCount: 0,
          blockedReason: "embedding_missing",
        },
      });
      continue;
    }

    const scored = [];
    const __pairDebugRows = [];
    for (let j = 0; j < rsUnits.length; j++) {
      const b = rsEmb[j];
      if (!b) continue;
      const __pairState = getSemanticPairState(jdDomains[i], rsDomains[j]);
      const __threshold = getSemanticAcceptanceThresholdByPairState(__pairState);
      if (!isDomainCompatible(jdDomains[i], rsDomains[j])) {
        __policyStats.blockedByDomainCompatCount += 1;
        __pairDebugRows.push({
          pairState: __pairState,
          rawScore: null,
          threshold: __threshold,
          accepted: false,
          blockedReason: "domain_compat",
        });
        continue;
      }
      if (!shouldAllowUnknownSafePair(jdUnitsForMatch[i], rsUnits[j], jdDomains[i], rsDomains[j])) {
        __policyStats.blockedByUnknownSafeCount += 1;
        __pairDebugRows.push({
          pairState: __pairState,
          rawScore: null,
          threshold: __threshold,
          accepted: false,
          blockedReason: "unknown_safe",
        });
        continue;
      }
      const s = cosineSimilarity(a, b);
      const __accept = Number.isFinite(Number(s)) && Number(s) >= __threshold;
      if (!__accept) {
        __policyStats.blockedByThresholdCount += 1;
        __pairDebugRows.push({
          pairState: __pairState,
          rawScore: s,
          threshold: __threshold,
          accepted: false,
          blockedReason: "threshold",
        });
        continue;
      }
      __policyStats.acceptedCount += 1;
      __pairDebugRows.push({
        pairState: __pairState,
        rawScore: s,
        threshold: __threshold,
        accepted: true,
        blockedReason: null,
      });
      scored.push({ text: rsUnits[j], score: s });
    }

    scored.sort((x, y) => (y.score - x.score));
    const candidates = scored.slice(0, topK);
    const __acceptedRows = __pairDebugRows.filter((x) => x && x.accepted);
    const __blockedRows = __pairDebugRows.filter((x) => x && !x.accepted);
    const __bestAccepted = __acceptedRows.length
      ? __acceptedRows.slice().sort((a, b) => (Number(b.rawScore) - Number(a.rawScore)))[0]
      : null;
    const __blockedReason = __blockedRows.length
      ? __blockedRows[0]?.blockedReason || "threshold"
      : (__acceptedRows.length ? null : "no_pairs");

    matches.push({
      jd: jdUnitsForMatch[i],
      candidates,
      best: candidates[0] ?? null,
      debug: {
        pairState: __bestAccepted?.pairState || (__blockedRows[0]?.pairState || null),
        rawBestScore: Number.isFinite(Number(__bestAccepted?.rawScore)) ? Number(__bestAccepted.rawScore) : null,
        appliedThreshold: Number.isFinite(Number(__bestAccepted?.threshold))
          ? Number(__bestAccepted.threshold)
          : (Number.isFinite(Number(__blockedRows[0]?.threshold)) ? Number(__blockedRows[0].threshold) : null),
        acceptedCount: __acceptedRows.length,
        blockedReason: __blockedReason,
      },
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
    debug: {
      thresholdPolicy: "semantic_threshold_policy_v2_pair_state",
      acceptedCount: __policyStats.acceptedCount,
      blockedReason: {
        domainCompat: __policyStats.blockedByDomainCompatCount,
        unknownSafe: __policyStats.blockedByUnknownSafeCount,
        threshold: __policyStats.blockedByThresholdCount,
      },
    },
  };
}
