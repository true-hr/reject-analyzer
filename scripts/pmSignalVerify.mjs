/**
 * scripts/pmSignalVerify.mjs
 *
 * PM 신호 해석 함수 검증 fixture
 * 출처 샘플: D:\tools\Obsidian\PASSMAP\04_Data_Assets\Record_To_Signal_Mapping_Samples.md
 *
 * 실행:
 *   node ./scripts/pmSignalVerify.mjs
 *
 * 검증 항목:
 *   1. 함수가 오류 없이 실행됨
 *   2. 샘플 기록 배치 처리 가능
 *   3. 출력 shape 안정성 (필수 키 존재)
 *   4. 대표 샘플에서 기대 신호 판독 여부
 */

import { interpretPmRecord } from "../src/lib/signals/interpretPmRecord.js";

// ── sample fixture ────────────────────────────────────────────────────────────
// Obsidian Record_To_Signal_Mapping_Samples.md 대표 20개

const SAMPLES = [
  {
    id: "S001",
    text: "고객 문의 유형을 카테고리별로 분류했다.",
    expectedSignals: ["CORE_PROBLEM_STRUCTURING", "CORE_USER_PERSPECTIVE"],
  },
  {
    id: "S002",
    text: "운영 프로세스에서 반복되는 오류 원인을 정리해서 팀에 공유했다.",
    expectedSignals: ["CORE_PROBLEM_STRUCTURING", "CORE_STAKEHOLDER_ALIGNMENT"],
  },
  {
    id: "S003",
    text: "지표 대시보드를 확인하고 이번 주 집중할 항목을 정했다.",
    expectedSignals: ["CORE_DATA_DRIVEN_JUDGMENT", "CORE_PRIORITIZATION"],
  },
  {
    id: "S004",
    text: "개발팀 요청사항을 정리해서 스프린트 일정에 반영했다.",
    expectedSignals: ["CORE_STAKEHOLDER_ALIGNMENT", "CORE_EXECUTION_COMPLETION"],
  },
  {
    id: "S005",
    text: "사용자 VOC를 읽고 자주 나오는 불편 패턴 3가지를 정리했다.",
    expectedSignals: ["CORE_USER_PERSPECTIVE", "CORE_PROBLEM_STRUCTURING"],
  },
  {
    id: "S006",
    text: "기능 배포 후 유입 지표가 떨어져서 원인을 팀에 보고했다.",
    expectedSignals: ["CORE_DATA_DRIVEN_JUDGMENT", "CORE_EXECUTION_COMPLETION"],
  },
  {
    id: "S007",
    text: "회의에서 나온 결정 사항을 요약해서 관계자에게 공유했다.",
    expectedSignals: ["CORE_STAKEHOLDER_ALIGNMENT"],
  },
  {
    id: "S008",
    text: "이번 스프린트에서 기능 A를 빼고 기능 B를 먼저 하기로 결정했다.",
    expectedSignals: ["CORE_PRIORITIZATION"],
  },
  {
    id: "S009",
    text: "고객 응대 매뉴얼을 작성해서 신규 CS 담당자 온보딩에 사용했다.",
    expectedSignals: ["CORE_EXECUTION_COMPLETION", "CORE_USER_PERSPECTIVE"],
  },
  {
    id: "S010",
    text: "A/B 테스트 결과를 보고 랜딩 페이지 방향을 바꿨다.",
    expectedSignals: ["CORE_DATA_DRIVEN_JUDGMENT", "CORE_PRIORITIZATION"],
  },
  {
    id: "S011",
    text: "반복으로 들어오는 지원 문의를 정리해서 FAQ 페이지 초안을 만들었다.",
    expectedSignals: ["CORE_PROBLEM_STRUCTURING", "CORE_USER_PERSPECTIVE"],
  },
  {
    id: "S012",
    text: "타부서 요청이 겹쳐서 어느 것을 먼저 처리할지 기준을 정했다.",
    expectedSignals: ["CORE_PRIORITIZATION", "CORE_STAKEHOLDER_ALIGNMENT"],
  },
  {
    id: "S013",
    text: "서비스 오류 원인을 정리하고 개발팀에 재현 조건을 전달했다.",
    expectedSignals: ["CORE_PROBLEM_STRUCTURING", "CORE_STAKEHOLDER_ALIGNMENT"],
  },
  {
    id: "S014",
    text: "월간 리포트 작성을 위해 팀별 성과를 취합했다.",
    expectedSignals: ["CORE_STAKEHOLDER_ALIGNMENT", "CORE_EXECUTION_COMPLETION"],
  },
  {
    id: "S015",
    text: "신규 기능 출시 전 사용성 테스트를 진행하고 결과를 정리했다.",
    expectedSignals: ["CORE_USER_PERSPECTIVE", "CORE_DATA_DRIVEN_JUDGMENT"],
  },
  {
    id: "S016",
    text: "일정이 지연된 이유를 파악하고 다음 스프린트 계획을 수정했다.",
    expectedSignals: ["CORE_PRIORITIZATION", "CORE_EXECUTION_COMPLETION"],
  },
  {
    id: "S017",
    text: "운영 중 반복 발생하는 데이터 입력 오류 패턴을 발견했다.",
    expectedSignals: ["CORE_PROBLEM_STRUCTURING", "CORE_DATA_DRIVEN_JUDGMENT"],
  },
  {
    id: "S018",
    text: "외부 파트너사와 일정 조율을 하면서 내부 팀 요구사항을 정리해 전달했다.",
    expectedSignals: ["CORE_STAKEHOLDER_ALIGNMENT"],
  },
  {
    id: "S019",
    text: "기능 기획안을 작성하고 팀 리뷰를 받아서 최종안을 확정했다.",
    expectedSignals: ["CORE_STAKEHOLDER_ALIGNMENT", "CORE_EXECUTION_COMPLETION"],
  },
  {
    id: "S020",
    text: "지표가 목표 대비 낮게 나와서 왜 그런지 원인을 팀과 같이 논의했다.",
    expectedSignals: ["CORE_DATA_DRIVEN_JUDGMENT", "CORE_STAKEHOLDER_ALIGNMENT"],
  },
];

// ── validation helpers ────────────────────────────────────────────────────────

const REQUIRED_OUTPUT_KEYS = [
  "detectedCoreSignals",
  "possibleWeakSignals",
  "suggestedImprovementActions",
  "interpretationNote",
  "coverageSummary",
];

function checkShape(result) {
  const missing = REQUIRED_OUTPUT_KEYS.filter((k) => !(k in result));
  return missing;
}

function checkExpectedSignals(result, expected) {
  const detected = new Set(result.detectedCoreSignals.map((s) => s.id));
  return expected.filter((e) => !detected.has(e));
}

// ── runner ────────────────────────────────────────────────────────────────────

let totalPass = 0;
let totalFail = 0;
const failLog = [];

console.log("=== PM Signal Verify ===\n");

for (const sample of SAMPLES) {
  let result;
  let runtimeError = null;

  try {
    result = interpretPmRecord({ text: sample.text });
  } catch (err) {
    runtimeError = err;
  }

  if (runtimeError) {
    totalFail++;
    failLog.push(`[${sample.id}] RUNTIME ERROR: ${runtimeError.message}`);
    continue;
  }

  // shape check
  const missingKeys = checkShape(result);
  if (missingKeys.length > 0) {
    totalFail++;
    failLog.push(`[${sample.id}] SHAPE ERROR: missing keys ${missingKeys.join(", ")}`);
    continue;
  }

  // expected signal check
  const missedSignals = checkExpectedSignals(result, sample.expectedSignals);
  const detectedIds = result.detectedCoreSignals.map((s) => s.id).join(", ") || "(없음)";

  if (missedSignals.length > 0) {
    totalFail++;
    failLog.push(
      `[${sample.id}] SIGNAL MISS: expected [${missedSignals.join(", ")}] | detected [${detectedIds}]`
    );
  } else {
    totalPass++;
    console.log(`[${sample.id}] PASS — detected: ${detectedIds}`);
  }
}

// ── summary ───────────────────────────────────────────────────────────────────

console.log("\n=== 결과 요약 ===");
console.log(`총 샘플: ${SAMPLES.length}`);
console.log(`통과: ${totalPass}`);
console.log(`실패: ${totalFail}`);

if (failLog.length > 0) {
  console.log("\n실패 상세:");
  failLog.forEach((msg) => console.log(" ", msg));
}

const passRate = ((totalPass / SAMPLES.length) * 100).toFixed(0);
console.log(`\n통과율: ${passRate}% (기준: 75% 이상)`);

if (totalPass / SAMPLES.length >= 0.75) {
  console.log("→ VERIFICATION PASS");
} else {
  console.log("→ VERIFICATION FAIL — evidenceHints 범위 또는 샘플 텍스트 점검 필요");
  process.exit(1);
}
