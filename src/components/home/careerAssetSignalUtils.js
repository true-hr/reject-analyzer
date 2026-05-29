const PATTERN_COLORS = ["bg-violet-500", "bg-blue-500", "bg-teal-500", "bg-indigo-500", "bg-cyan-500"];

export const DIRECTION_CANDIDATES = [
  { title: "서비스기획 · PM",     keywords: ["백로그", "요구사항", "우선순위", "로드맵", "기획", "문제", "구조", "기능", "사용자"] },
  { title: "운영기획",             keywords: ["릴리즈", "운영", "점검", "프로세스", "기준", "관리"] },
  { title: "프로젝트 코디네이션",  keywords: ["이해관계자", "협업", "조율", "합의", "커뮤니케이션"] },
  { title: "데이터 기반 PM",       keywords: ["지표", "데이터", "분석", "리뷰", "실험", "개선"] },
  { title: "마케팅/그로스 기획",   keywords: ["마케팅", "고객", "캠페인", "콘텐츠", "퍼널", "전환", "시장", "voc"] },
  { title: "리서치/인사이트 기획", keywords: ["리서치", "벤치마킹", "인사이트", "조사"] },
];

export const JOB_CANDIDATES = [
  { title: "서비스기획 · PM",     keywords: ["백로그","요구사항","우선순위","로드맵","기획","문제","구조","사용자","기능"] },
  { title: "데이터 기반 PM",       keywords: ["지표","데이터","분석","리뷰","실험","개선"] },
  { title: "운영기획",             keywords: ["릴리즈","운영","점검","프로세스","기준","관리"] },
  { title: "마케팅/그로스 기획",   keywords: ["마케팅","고객","캠페인","콘텐츠","퍼널","전환"] },
  { title: "프로젝트 코디네이션",  keywords: ["이해관계자","협업","조율","합의","커뮤니케이션"] },
  { title: "리서치/인사이트 기획", keywords: ["리서치","벤치마킹","시장","voc","인사이트"] },
  { title: "프로덕트 전략",        keywords: ["제품","서비스","런칭","전략","사업"] },
];

export function isLowSignalLabel(label) {
  const text = String(label || "").trim();
  if (!text) return true;
  if (text.length <= 2) return true;
  if (/^\d+$/.test(text)) return true;
  if (/^(회의|업무|담당|기타|일반)$/.test(text)) return true;
  if (/^[가-힣A-Za-z0-9]+(팀|부|실|센터|그룹|파트)$/.test(text)) return true;
  return false;
}

export function normalizeAssetLabel(label) {
  const text = String(label || "").trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  if (/백로그|우선순위/.test(lower)) return "우선순위 판단";
  if (/릴리즈|배포|출시/.test(lower)) return "릴리즈 운영 관리";
  if (/이해관계자|의사결정|조율|합의/.test(lower)) return "의사결정 조율";
  if (/사업.*과제|과제.*정리|과제.*구조/.test(lower)) return "과제 구조화";
  if (/시장|자료|리서치|벤치마킹|조사/.test(lower)) return "시장 리서치";
  if (/사용자.*문제|문제.*구체|문제.*정의/.test(lower)) return "문제 정의";
  if (/요구사항|기능.*정리|기능.*요구/.test(lower)) return "요구사항 정리";
  if (/로드맵/.test(lower)) return "로드맵 관리";
  if (/고객|voc|리뷰|문의/.test(lower)) return "고객 인사이트 정리";
  if (/지표|데이터|분석|실험/.test(lower)) return "데이터 기반 개선";
  if (/운영|프로세스|기준|관리/.test(lower)) return "운영 기준화";
  return text;
}

export function buildPatternsFromRecords(records) {
  if (!records || records.length === 0) return null;
  const counts = {};
  const pushTag = (tag) => {
    const raw = String(tag || "").trim();
    if (!raw) return;
    if (isLowSignalLabel(raw)) return;
    const label = normalizeAssetLabel(raw);
    if (!label) return;
    if (isLowSignalLabel(label)) return;
    counts[label] = (counts[label] || 0) + 1;
  };
  for (const row of records) {
    for (const tag of (Array.isArray(row.strength_tags) ? row.strength_tags : [])) pushTag(tag);
    for (const tag of (Array.isArray(row.skill_tags) ? row.skill_tags : [])) pushTag(tag);
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (sorted.length === 0) return null;
  const maxCount = sorted[0][1];
  return sorted.map(([label, count], i) => ({
    label,
    pct: Math.max(60, Math.min(90, Math.round((count / maxCount) * 88))),
    color: PATTERN_COLORS[i] || "bg-slate-400",
  }));
}

export function buildTracesFromRecords(records, fallbackTraces = []) {
  if (!records || records.length === 0) return null;
  const candidates = [];
  const seen = new Set();

  const push = (label) => {
    const s = String(label || "").trim();
    if (!s) return;
    const key = s.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(s);
  };

  for (const row of records.slice(0, 10)) {
    const title = String(row.title || "").trim();
    if (!title) continue;
    for (const part of title.split(/[,/\n]/).map(s => s.trim()).filter(Boolean)) {
      push(part);
      if (candidates.length >= 6) break;
    }
    if (candidates.length >= 6) break;
  }

  for (const row of records) {
    if (candidates.length >= 6) break;
    for (const tag of (Array.isArray(row.strength_tags) ? row.strength_tags : [])) {
      push(tag);
      if (candidates.length >= 6) break;
    }
  }

  for (const row of records) {
    if (candidates.length >= 6) break;
    for (const tag of (Array.isArray(row.skill_tags) ? row.skill_tags : [])) {
      push(tag);
      if (candidates.length >= 6) break;
    }
  }

  if (candidates.length === 0) return null;
  return candidates.map((label, i) => ({
    label,
    color: fallbackTraces[i]?.color ?? fallbackTraces[0]?.color ?? "#3B82F6",
    bg:    fallbackTraces[i]?.bg    ?? fallbackTraces[0]?.bg    ?? "rgba(59,130,246,0.14)",
  }));
}

function findDirectionCandidate(label) {
  const lower = String(label || "").toLowerCase();
  if (!lower || isLowSignalLabel(label)) return null;
  let best = null;
  for (const candidate of DIRECTION_CANDIDATES) {
    const hits = candidate.keywords.filter((kw) => lower.includes(String(kw).toLowerCase()));
    if (hits.length === 0) continue;
    if (!best || hits.length > best.hits.length) {
      best = { candidate, hits };
    }
  }
  return best;
}

export function buildDirectionsFromPatterns(patterns, fallbackDirections = []) {
  if (!patterns || patterns.length === 0) return null;
  if (!fallbackDirections || fallbackDirections.length === 0) return null;
  const usedTitles = new Set();
  const directions = [];
  patterns.forEach((pattern, i) => {
    const raw = String(pattern.label || "").trim();
    if (!raw) return;
    const match = findDirectionCandidate(raw);
    if (!match || usedTitles.has(match.candidate.title)) return;
    usedTitles.add(match.candidate.title);
    const fallback = fallbackDirections[directions.length] ?? fallbackDirections[i] ?? fallbackDirections[0];
    const pct = typeof pattern.pct === "number"
      ? Math.max(58, Math.min(92, Math.round(pattern.pct - 2)))
      : fallback.pct;
    directions.push({ ...fallback, label: match.candidate.title, pct });
  });
  return directions.length ? directions : null;
}

function safeParsePayloadObj(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const p = JSON.parse(value);
      return p && typeof p === "object" && !Array.isArray(p) ? p : {};
    } catch { return {}; }
  }
  return {};
}

function countConnectedSignals(records) {
  if (!records || records.length === 0) return 0;
  let count = 0;
  for (const row of records) {
    if (Array.isArray(row.strength_tags)) count += row.strength_tags.length;
    if (Array.isArray(row.skill_tags))    count += row.skill_tags.length;
    const payload = safeParsePayloadObj(row.raw_payload);
    if (Array.isArray(payload.experienceSignals)) count += payload.experienceSignals.length;
  }
  return count;
}

export function buildJobMatchFromSignals({ records, traces, patterns, fallbackJobMatch }) {
  if (!records || records.length === 0) return null;
  if (!fallbackJobMatch) return null;
  if ((!traces || traces.length === 0) && (!patterns || patterns.length === 0)) return null;
  const labels = [
    ...(Array.isArray(traces) ? traces.map(t => t.label) : []),
    ...(Array.isArray(patterns) ? patterns.map(p => p.label) : []),
  ].filter(Boolean);
  const lowerText = labels.join(" ").toLowerCase();
  const scored = JOB_CANDIDATES
    .map(c => ({ title: c.title, score: c.keywords.filter(kw => lowerText.includes(kw)).length }))
    .filter(c => c.score >= 1)
    .sort((a, b) => b.score - a.score);
  const usedTitles = new Set(scored.map(c => c.title));
  const fill = (fallbackJobMatch.positions || [])
    .filter(p => !usedTitles.has(p.title))
    .map(p => ({ title: p.title, score: 0 }));
  const selected = [...scored, ...fill].slice(0, 3);
  const recordCount = Array.isArray(records) ? records.length : 0;
  const signalCount = countConnectedSignals(records);
  const hitCount = scored.reduce((sum, c) => sum + c.score, 0);
  let score = 66 + Math.min(10, recordCount * 2) + Math.min(8, hitCount * 2) + Math.min(4, signalCount);
  score = Math.max(68, Math.min(88, Math.round(score)));
  return {
    ...fallbackJobMatch,
    score,
    label: "기록 기반 연결도",
    positions: selected.map((item, idx) => ({
      rank: idx + 1,
      title: item.title,
      badge: idx === 0 ? "연결 높음" : null,
    })),
  };
}

export function buildCareerAssetSignals(records, options = {}) {
  const safeRecords = Array.isArray(records) ? records : [];
  const patterns = buildPatternsFromRecords(safeRecords);
  const traces = buildTracesFromRecords(safeRecords, options.fallbackTraces);
  const directions = buildDirectionsFromPatterns(patterns, options.fallbackDirections);
  const jobMatch = buildJobMatchFromSignals({
    records: safeRecords,
    traces,
    patterns,
    fallbackJobMatch: options.fallbackJobMatch,
  });

  return { patterns, traces, directions, jobMatch };
}
