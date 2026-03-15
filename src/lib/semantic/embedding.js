// src/lib/semantic/embedding.js
// 브라우저 내 임베딩(Transformers.js) - 싱글턴 로더 + 메모리/로컬 캐시
// 목표: "배포 사용자도 사용" (localhost 불필요)
// NOTE: 실패해도 앱이 죽지 않도록 "예외는 밖으로 던지되, 호출부에서 폴백" 전제.

import { pipeline, env } from "@huggingface/transformers";

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

// (A) 싱글턴: 모델 로더
let __extractorPromise = null;

// (B) 캐시 (메모리)
const __mem = {
  embByKey: new Map(), // key -> number[]
};

// (C) 로컬스토리지 캐시 (옵션)
const LS_PREFIX = "ra_semantic_embed_v1::";
const LS_MAX_CHARS = 2_000_000; // 너무 커지면 저장 안 함(대략 2MB 수준 방어)

function __safeJSONParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function __safeJSONStringify(v) {
  try { return JSON.stringify(v); } catch { return ""; }
}

function __hash32(str) {
  // 가벼운 해시(비암호). 캐시 키 목적.
  const s = (str ?? "").toString();
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function __makeKey(text) {
  const t = (text ?? "").toString().trim();
  return __hash32(t);
}

function __lsGet(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const parsed = __safeJSONParse(raw);
    if (!parsed || !Array.isArray(parsed) || parsed.length < 10) return null;
    return parsed;
  } catch {
    return null;
  }
}

function __lsSet(key, arr) {
  try {
    if (!Array.isArray(arr) || arr.length < 10) return;
    const raw = __safeJSONStringify(arr);
    if (!raw) return;
    if (raw.length > LS_MAX_CHARS) return; // 너무 크면 저장 안 함
    localStorage.setItem(LS_PREFIX + key, raw);
  } catch {}
}

export async function getEmbedder({ device = "auto", dtype = "q8" } = {}) {
  // Transformers.js 기본값으로도 동작하지만, 안정성 위해 옵션을 명시적으로 받음.
  // device: "webgpu" | "wasm" | "cpu" | "auto"
  // dtype: "fp32" | "fp16" | "q8" | "auto"
  const runtimeDevice = (() => {
    const d = String(device || "").trim().toLowerCase();
    if (d === "webgpu") return "webgpu";
    if (d === "wasm") return "wasm";
    if (d === "auto") return "auto";
    if (d === "cpu") return "wasm";
    return "wasm";
  })();
  if (!__extractorPromise) {
    __extractorPromise = (async () => {
      // 기본은 원격 모델/런타임 사용(out-of-box). 필요시 여기서 env 설정 가능.
      // env.allowRemoteModels = true; // 기본 true 성격 (버전에 따라 다를 수 있어 건드리지 않음)
      // env.allowLocalModels = false;

      const extractor = await pipeline(
        "feature-extraction",
        MODEL_ID,
        { device: runtimeDevice, dtype }
      );
      return extractor;
    })();
  }
  return __extractorPromise;
}

export async function embedText(text, opts = {}) {
  const t = (text ?? "").toString().trim();
  if (!t) return null;

  const key = __makeKey(t);

  // 1) 메모리 캐시
  if (__mem.embByKey.has(key)) return __mem.embByKey.get(key);

  // 2) localStorage 캐시(옵션)
  if (opts?.useLocalStorageCache) {
    const ls = __lsGet(key);
    if (ls) {
      __mem.embByKey.set(key, ls);
      return ls;
    }
  }

  // 3) 임베딩 생성
  const extractor = await getEmbedder({
    device: opts?.device ?? "auto",
    dtype: opts?.dtype ?? "q8",
  });

  // Transformers.js 권장: pooling + normalize로 sentence embedding 형태로 사용
  // (mean pooling + L2 normalize)
  const out = await extractor(t, { pooling: "mean", normalize: true });
  const arr = out?.tolist?.()?.[0] ?? out?.tolist?.() ?? null;

  if (!arr || !Array.isArray(arr) || arr.length < 10) return null;

  __mem.embByKey.set(key, arr);
  if (opts?.useLocalStorageCache) __lsSet(key, arr);

  return arr;
}

export function __debugSemanticCacheSize() {
  return {
    mem: __mem.embByKey.size,
  };
}
