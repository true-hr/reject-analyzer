// src/lib/semantic/match.js
// JD/이력서 문장 의미매칭(Top-K) - 임베딩 기반

import { embedText } from "./embedding.js";

export function splitToUnits(text, { maxUnits = 140 } = {}) {
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
      const ss = s.replace(/\s+/g, " ").trim();
      // 너무 짧은 건 제외
      if (ss.length < 8) continue;
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
  const jdUnits = splitToUnits(jdText, { maxUnits: opts?.maxJdUnits ?? 40 });
  const rsUnits = splitToUnits(resumeText, { maxUnits: opts?.maxResumeUnits ?? 120 });

  if (jdUnits.length === 0 || rsUnits.length === 0) {
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

  const jdEmb = await mapLimit(jdUnits, (t) => embedText(t, embedOpts));
  const rsEmb = await mapLimit(rsUnits, (t) => embedText(t, embedOpts));

  const topK = Math.max(1, Math.min(8, opts?.topK ?? 4));
  const matches = [];

  for (let i = 0; i < jdUnits.length; i++) {
    const a = jdEmb[i];
    if (!a) {
      matches.push({
        jd: jdUnits[i],
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
      jd: jdUnits[i],
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
