// Mock AI Record Summary - Rule-based inference for work record classification
// Pure function: no side effects, no external API calls

/**
 * Analyzes raw work record text and generates mock AI summary
 * using rule-based keyword matching
 *
 * @param {Object} input
 * @param {string} input.rawText - Natural language work record
 * @param {string} [input.currentJobId] - Current job ID context
 * @param {"weekly"|"project"} [input.recordType] - Record type
 * @param {Object} [input.existingTags] - Existing tags to preserve
 * @returns {Object} Mock AI summary result
 */
export function mockAIRecordSummary(input) {
  const {
    rawText = "",
    currentJobId = "",
    recordType = "weekly",
    existingTags = {},
  } = input || {};

  const trimmed = String(rawText || "").trim();

  // Initialize output structure
  const output = {
    workTypeTags: [],
    collaborationContextTags: [],
    outcomeTags: [],
    skillSignals: [],
    resumeUsefulness: { level: "low", reason: "요구사항을 파악할 정보 부족" },
    followUpQuestions: [],
    confidence: 0,
    warnings: [],
  };

  // Guard: empty input
  if (!trimmed) {
    output.warnings.push("업무 기록이 비어있습니다. 내용을 입력해주세요.");
    output.confidence = 0;
    return output;
  }

  // Guard: too short
  if (trimmed.length < 10) {
    output.warnings.push("업무 기록이 너무 짧습니다. 더 자세히 설명해주세요.");
    output.confidence = 0.1;
    return output;
  }

  const lowerText = trimmed.toLowerCase();
  const detectedTags = new Set();
  let signalCount = 0;
  let hasAction = false;
  let hasResult = false;
  let hasQuantitativeChange = false;

  // Rule 1: Analysis / Metrics / Data
  const analysisKeywords = [
    "분석",
    "지표",
    "데이터",
    "전환율",
    "신청률",
    "매출",
    "비용",
    "비교",
    "리포트",
    "통계",
    "조사",
    "검증",
    "측정",
  ];
  if (analysisKeywords.some((kw) => lowerText.includes(kw))) {
    output.workTypeTags.push({
      id: "analysis_metric_review",
      label: "지표·데이터 점검",
      source: "mock",
    });
    detectedTags.add("analysis");
    signalCount++;
    output.skillSignals.push({
      id: "data_driven_diagnosis",
      label: "데이터 기반 문제 진단",
      reason: "분석/지표/데이터 키워드 감지",
    });
  }

  // Rule 2: Planning / Documentation
  const planningKeywords = [
    "기획",
    "정리",
    "문서",
    "가이드",
    "기준",
    "정책",
    "구조화",
    "faq",
    "매뉴얼",
    "규칙",
    "체계",
  ];
  if (planningKeywords.some((kw) => lowerText.includes(kw))) {
    output.workTypeTags.push({
      id: "planning_documentation",
      label: "기획·문서화",
      source: "mock",
    });
    detectedTags.add("planning");
    signalCount++;
    output.skillSignals.push({
      id: "information_structuring",
      label: "정보 구조화",
      reason: "기획/문서화 키워드 감지",
    });
  }

  // Rule 3: Execution / Improvement
  const executionKeywords = [
    "개선",
    "수정",
    "적용",
    "실행",
    "반영",
    "테스트",
    "실험",
    "변경",
    "업데이트",
    "배포",
  ];
  if (executionKeywords.some((kw) => lowerText.includes(kw))) {
    output.outcomeTags.push({
      id: "improvement_action",
      label: "개선 실행",
      source: "mock",
    });
    detectedTags.add("execution");
    signalCount++;
    hasAction = true;
    output.skillSignals.push({
      id: "execution_drive",
      label: "실행력",
      reason: "실행/개선 키워드 감지",
    });
  }

  // Rule 4: Collaboration
  const collaborationKeywords = [
    "협업",
    "회의",
    "공유",
    "전달",
    "조율",
    "요청",
    "피드백",
    "논의",
    "함께",
    "팀",
    "조정",
  ];
  if (collaborationKeywords.some((kw) => lowerText.includes(kw))) {
    output.collaborationContextTags.push({
      id: "cross_team_collaboration",
      label: "협업·조율",
      source: "mock",
    });
    detectedTags.add("collaboration");
    signalCount++;
    output.skillSignals.push({
      id: "stakeholder_communication",
      label: "이해관계자 커뮤니케이션",
      reason: "협업/조율 키워드 감지",
    });
  }

  // Rule 5: Customer / User Context
  const customerKeywords = [
    "고객",
    "사용자",
    "문의",
    "인터뷰",
    "상담",
    "반응",
    "voc",
    "피드백",
    "의견",
  ];
  if (customerKeywords.some((kw) => lowerText.includes(kw))) {
    output.collaborationContextTags.push({
      id: "customer_user_context",
      label: "고객·사용자 맥락",
      source: "mock",
    });
    detectedTags.add("customer");
    signalCount++;
    output.skillSignals.push({
      id: "customer_understanding",
      label: "고객 문제 이해",
      reason: "고객/사용자 맥락 키워드 감지",
    });
  }

  // Rule 6: Outcome / Completion / Progress
  const outcomeKeywords = [
    "완료",
    "달성",
    "증가",
    "감소",
    "단축",
    "개선됨",
    "해결",
    "확정",
    "성공",
    "지표",
    "진척",
  ];
  if (outcomeKeywords.some((kw) => lowerText.includes(kw))) {
    output.outcomeTags.push({
      id: "measurable_progress",
      label: "성과·진척",
      source: "mock",
    });
    detectedTags.add("outcome");
    hasResult = true;
  }

  // Detect quantitative changes (numbers, percentages)
  if (/\d+%|원|개|건|명|증가|감소|배/.test(trimmed)) {
    hasQuantitativeChange = true;
  }

  // Remove duplicate tags
  const tagDeduplicate = (arr) => {
    const seen = new Set();
    return arr.filter((item) => {
      const key = `${item.id}|${item.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  output.workTypeTags = tagDeduplicate(output.workTypeTags);
  output.collaborationContextTags = tagDeduplicate(
    output.collaborationContextTags
  );
  output.outcomeTags = tagDeduplicate(output.outcomeTags);

  // Add existing tags with source: "existing"
  if (existingTags && typeof existingTags === "object") {
    if (Array.isArray(existingTags.workTypeTags)) {
      const existingWork = existingTags.workTypeTags.map((tag) => ({
        id: tag.id || tag,
        label: tag.label || tag,
        source: "existing",
      }));
      output.workTypeTags = tagDeduplicate([
        ...output.workTypeTags,
        ...existingWork,
      ]);
    }
    if (Array.isArray(existingTags.collaborationContextTags)) {
      const existingCollab = existingTags.collaborationContextTags.map(
        (tag) => ({
          id: tag.id || tag,
          label: tag.label || tag,
          source: "existing",
        })
      );
      output.collaborationContextTags = tagDeduplicate([
        ...output.collaborationContextTags,
        ...existingCollab,
      ]);
    }
    if (Array.isArray(existingTags.outcomeTags)) {
      const existingOutcome = existingTags.outcomeTags.map((tag) => ({
        id: tag.id || tag,
        label: tag.label || tag,
        source: "existing",
      }));
      output.outcomeTags = tagDeduplicate([
        ...output.outcomeTags,
        ...existingOutcome,
      ]);
    }
  }

  // Deduplicate skill signals
  const seenSkills = new Set();
  output.skillSignals = output.skillSignals.filter((skill) => {
    const key = skill.id;
    if (seenSkills.has(key)) return false;
    seenSkills.add(key);
    return true;
  });

  // Determine resumeUsefulness level
  let usefulness = "low";
  let reason = "문제, 행동, 결과 정보가 부족합니다.";

  if (hasAction && hasResult && hasQuantitativeChange) {
    usefulness = "high";
    reason = "문제/행동/결과가 명확하고 수치나 변화가 표현되어 있습니다.";
  } else if (hasAction && (hasResult || detectedTags.size >= 2)) {
    usefulness = "medium";
    reason = "행동은 드러나지만 결과나 구체적인 수치 정보가 부족합니다.";
  } else if (detectedTags.size >= 2 || trimmed.length > 50) {
    usefulness = "medium";
    reason = "업무 맥락이 어느 정도 드러나지만 성과나 변화 정보가 부족합니다.";
  }

  output.resumeUsefulness = { level: usefulness, reason };

  // Generate follow-up questions based on missing information
  const questions = [];

  if (!hasAction) {
    questions.push(
      "이 업무를 하게 된 배경이나 문제점은 무엇이었나요?"
    );
  }

  if (!hasResult) {
    questions.push("결과적으로 어떤 변화나 성과가 있었나요?");
  }

  if (!hasQuantitativeChange) {
    questions.push("수치로 표현할 수 있는 전후 변화가 있었나요?");
  }

  if (!detectedTags.has("collaboration")) {
    questions.push("누구와 협업하거나 누구에게 공유했나요?");
  }

  if (questions.length > 3) {
    output.followUpQuestions = questions.slice(0, 3);
  } else {
    output.followUpQuestions = questions;
  }

  // Add optional follow-up about resume usage
  if (
    output.resumeUsefulness.level === "medium" &&
    output.followUpQuestions.length < 3
  ) {
    output.followUpQuestions.push(
      "이 기록을 이력서에 쓴다면 가장 강조하고 싶은 점은 무엇인가요?"
    );
  }

  // Ensure at least one follow-up if high usefulness
  if (
    output.resumeUsefulness.level === "high" &&
    output.followUpQuestions.length === 0
  ) {
    output.followUpQuestions.push(
      "추가로 강화할 수 있는 세부 사항이 있나요?"
    );
  }

  // Calculate confidence score
  let confidence = 0;
  if (detectedTags.size > 0) confidence += 0.2;
  if (signalCount > 0) confidence += 0.2;
  if (hasAction) confidence += 0.15;
  if (hasResult) confidence += 0.15;
  if (hasQuantitativeChange) confidence += 0.15;
  if (trimmed.length > 100) confidence += 0.15;

  output.confidence = Math.min(confidence, 1.0);

  return output;
}
