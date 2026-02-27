// src/lib/decision/riskProfiles/timeline/index.js
// timeline 그룹: 커리어 흐름/재직기간/이직 빈도 등 "시간축" 리스크를 모읍니다.
// ✅ 원칙: 여기서는 배열만 export 하고, 실제 규칙은 각 *Risk.js 파일에서 정의합니다.

import { timelineRisk } from "./timelineRisk.js";

// timeline 그룹 profiles
// - timelineRisk.js가 아직 비어있다면, 아래 import에서 에러가 나므로
//   timelineRisk.js에도 최소 export const timelineRisk = {...} 형태는 있어야 합니다.
export const TIMELINE_PROFILES = [timelineRisk];
