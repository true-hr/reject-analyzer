// FINAL PATCHED FILE: src/lib/decision/utils/thresholds.js

// decision thresholds (append-only)
// - 현재는 완전히 비어있던 파일이므로 "깨지지 않는 최소 계약"만 제공합니다.
// - 다른 모듈이 import 하더라도 런타임 에러가 나지 않도록
//   (1) 숫자 임계값 상수
//   (2) 레벨 판정 유틸
//   (3) 기본 export
// 를 함께 제공합니다.
//
// 주의: 아직 소비처(import/사용)가 없다고 하셨으므로,
// 특정 도메인 룰(회사 규모/직무별) 같은 추측 로직은 넣지 않습니다.

export const THRESHOLDS_V1 = {
  // 0~1 score 기준
  low: 0.33,
  mid: 0.66,
};

// append-only alias (향후 버전 업 대비)
export const DEFAULT_THRESHOLDS = THRESHOLDS_V1;

/**
 * 0~1 점수를 low/mid/high로 변환
 * @param {number} score01
 * @param {{low:number, mid:number}} [t]
 * @returns {"low"|"mid"|"high"}
 */
export function scoreToLevel(score01, t = THRESHOLDS_V1) {
  const n = Number(score01);
  const x = Number.isFinite(n) ? n : 0;

  if (x < t.low) return "low";
  if (x < t.mid) return "mid";
  return "high";
}

/**
 * 레벨을 표시 라벨(한글)로 변환 (UI에서 바로 쓰기용)
 * @param {"low"|"mid"|"high"} level
 * @returns {"낮음"|"보통"|"높음"}
 */
export function levelToKorean(level) {
  if (level === "low") return "낮음";
  if (level === "high") return "높음";
  return "보통";
}

// append-only default export
export default THRESHOLDS_V1;
