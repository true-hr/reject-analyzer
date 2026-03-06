// scripts/ext-resolve.mjs
// Node.js ESM 커스텀 훅 — testEngine analyze 모드 전용
// 엔진 코드(analyzer/decision/simulation) 무수정 원칙 준수용
//
// [resolve] extension-less relative import → .js 자동 추가
// [load]    hiddenRisk/v11Stable.js 소스에 computeHiddenRisk re-export 주입
//           (analyzer.js가 v11Stable.js에서 computeHiddenRisk를 import하지만
//            실제 구현은 hiddenRisk.js에 있으므로, load 단계에서 보완)

import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

// ── resolve 훅: extension-less relative import → .js ──────────────
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[a-zA-Z0-9]+$/.test(specifier)) {
    try {
      const parent = new URL(context.parentURL);
      const resolved = new URL(specifier, parent);
      const absPath = fileURLToPath(resolved);

      // 1순위: specifier.js
      const withJs = absPath + ".js";
      if (existsSync(withJs)) {
        return nextResolve(pathToFileURL(withJs).href, context);
      }

      // 2순위: specifier/index.js
      const withIndex = absPath + "/index.js";
      if (existsSync(withIndex)) {
        return nextResolve(pathToFileURL(withIndex).href, context);
      }
    } catch {
      // 해석 실패 시 기본 resolve로 위임
    }
  }

  return nextResolve(specifier, context);
}

// ── load 훅: v11Stable.js에 computeHiddenRisk re-export 주입 ──────
// analyzer.js가 "./hiddenRisk/v11Stable.js"에서 computeHiddenRisk를
// import하지만, 실제 export는 hiddenRisk.js에만 있음.
// 엔진 파일 수정 없이 테스트 환경에서만 보완.
export async function load(url, context, nextLoad) {
  if (url.endsWith("/hiddenRisk/v11Stable.js")) {
    const result = await nextLoad(url, context);
    if (result.format === "module") {
      const raw = result.source;
      const src =
        typeof raw === "string"
          ? raw
          : new TextDecoder().decode(raw);
      // ../hiddenRisk.js = hiddenRisk/v11Stable.js 기준 상위 hiddenRisk.js
      const patch = '\nexport { computeHiddenRisk } from "../hiddenRisk.js";';
      return { ...result, source: src + patch };
    }
  }
  return nextLoad(url, context);
}
