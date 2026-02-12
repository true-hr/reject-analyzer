// src/lib/storage.js
import { defaultState } from "./schema";

const KEY_V2 = "reject_analyzer_v2";
export const KEY_V3 = "reject_analyzer_v3";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function makeDefaultState() {
  return structuredClone ? structuredClone(defaultState) : JSON.parse(JSON.stringify(defaultState));
}

export function migrateV2toV3(v2) {
  const base = makeDefaultState();
  if (!v2 || typeof v2 !== "object") return base;

  return {
    ...base,
    company: typeof v2.company === "string" ? v2.company : base.company,
    role: typeof v2.role === "string" ? v2.role : base.role,
    stage: typeof v2.stage === "string" ? v2.stage.replace("서류+과제", "서류") : base.stage,
    applyDate: typeof v2.applyDate === "string" ? v2.applyDate : base.applyDate,
    jd: typeof v2.jd === "string" ? v2.jd : base.jd,
    resume: typeof v2.resume === "string" ? v2.resume : base.resume,
    interviewNotes: typeof v2.interviewNotes === "string" ? v2.interviewNotes : base.interviewNotes,
    // v2에 portfolio가 있었으면 유지, 없으면 빈값
    portfolio: typeof v2.portfolio === "string" ? v2.portfolio : "",
    career: base.career,
    selfCheck: {
      ...base.selfCheck,
      ...(v2.selfCheck && typeof v2.selfCheck === "object" ? v2.selfCheck : {}),
    },
  };
}

export function loadState() {
  if (typeof window === "undefined") return makeDefaultState();

  // v3 우선
  const rawV3 = window.localStorage.getItem(KEY_V3);
  if (rawV3) {
    const parsed = safeParse(rawV3);
    if (parsed && typeof parsed === "object") {
      // 기본값 + 병합(필드 누락 방지)
      return {
        ...makeDefaultState(),
        ...parsed,
        career: { ...defaultState.career, ...(parsed.career || {}) },
        selfCheck: { ...defaultState.selfCheck, ...(parsed.selfCheck || {}) },
      };
    }
  }

  // v2 -> v3 migration
  const rawV2 = window.localStorage.getItem(KEY_V2);
  if (rawV2) {
    const v2 = safeParse(rawV2);
    const migrated = migrateV2toV3(v2);
    saveState(migrated);
    return migrated;
  }

  return makeDefaultState();
}

export function saveState(state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_V3, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY_V3);
  } catch {
    // ignore
  }
}
