import { classifyOwnershipSeniority } from "./classifyOwnershipSeniority.js";

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildCurrentReading(classification) {
  if (classification.evidenceLevel === "inferred_weak") {
    return "현재 표현만으로는 엑셀/자료 정리 경험은 확인되지만, 직무 깊이와 소유권은 판단하기 어렵습니다.";
  }
  if (classification.ownershipLevel === "support") {
    return "현재 표현은 보조·지원 역할 중심으로 읽힙니다. 더 높은 수준의 경험이라면 판단, 책임 범위, 결과 활용 근거가 필요합니다.";
  }
  if (classification.ownershipLevel === "recommend" || classification.ownershipLevel === "recommend_and_follow_up") {
    return "현재 표현은 분석·제안 경험으로 읽힙니다. 더 강하게 쓰려면 제안이 실제 의사결정이나 개선 결과로 이어진 근거가 필요합니다.";
  }
  if (classification.ownershipLevel === "lead") {
    return "현재 표현은 해당 업무를 주도하거나 책임진 경험으로 읽힙니다. 성과 규모와 검토/승인 범위를 함께 쓰면 더 강해집니다.";
  }
  return "현재 표현만으로는 업무의 책임 범위와 전문 판단 수준이 불명확합니다.";
}

const ROLE_SPECIFIC_SUGGESTIONS = Object.freeze({
  accounting_admin: {
    missingEvidence: [
      "단순 입력을 넘어 계정 대사나 오류 검토를 했는지",
      "회계 담당자나 외부 회계법인 검토 전에 어떤 판단을 했는지",
      "월마감, 부가세, 감사 대응 등 더 큰 회계 프로세스와 연결됐는지",
    ],
    clarificationQuestions: [
      "정해진 양식에 입력만 한 것인가요, 아니면 금액 차이나 누락 원인을 직접 확인했나요?",
      "이 엑셀 자료가 월마감, 세무 신고, 감사 대응 중 어디에 사용됐나요?",
      "검토자가 발견하기 전에 본인이 잡아낸 오류나 개선한 방식이 있나요?",
    ],
    rewriteFocus: [
      "입력/정리만 썼다면 증빙 정확도와 누락 방지 중심으로 표현",
      "검토/판단이 있었다면 대사, 오류 확인, 조정 필요 여부 판단을 명시",
      "자료가 쓰인 상위 프로세스(월마감/세무/감사)를 함께 표기",
    ],
  },
  accounting_finance: {
    missingEvidence: [
      "담당 계정 범위와 월마감 책임 범위",
      "조정 전표 판단이나 회계처리 검토 사례",
      "감사 대응 또는 경영진 보고에서 설명한 재무 영향",
    ],
    clarificationQuestions: [
      "어떤 계정 또는 명세를 직접 대사했나요?",
      "차이가 발생했을 때 조정 전표 필요 여부를 직접 판단했나요?",
      "월마감 결과를 누구에게 보고하거나 설명했나요?",
    ],
    rewriteFocus: [
      "계정 대사, 차이 분석, 조정 판단, 감사 대응을 한 문장 안에 연결",
      "본인이 책임진 월마감 범위와 이해관계자를 명시",
      "재무 영향이나 리스크를 설명한 경험을 강조",
    ],
  },
  finance_analysis: {
    missingEvidence: [
      "모델에 사용한 핵심 가정과 변수",
      "분석 결과가 예산, 영업 목표, 투자, 리소스 배분에 쓰였는지",
      "예측 정확도나 의사결정 기여 결과",
    ],
    clarificationQuestions: [
      "예측 모델에서 어떤 가정과 지표를 사용했나요?",
      "분석 결과가 어떤 의사결정에 반영됐나요?",
      "시나리오별 차이를 누구에게 설명했나요?",
    ],
    rewriteFocus: [
      "단순 리포트가 아니라 가정, 시나리오, 의사결정 지원을 드러냄",
      "예측/민감도 분석이 실제 계획이나 예산 배분에 연결된 부분을 명시",
      "모델의 사용 대상과 결과 활용처를 함께 작성",
    ],
  },
  hr_operations: {
    missingEvidence: [
      "급여/근태 자료의 정확도 검증 기준",
      "누락·오류를 어떻게 확인하고 해결했는지",
      "노무/급여 정책 판단까지 했는지, 아니면 기초자료 준비였는지",
    ],
    clarificationQuestions: [
      "급여 계산 자체를 담당했나요, 아니면 계산 전 기초자료를 준비했나요?",
      "근태 오류나 누락을 발견했을 때 어떤 기준으로 확인했나요?",
      "노무사무소나 내부 담당자에게 전달한 자료가 어떤 의사결정에 쓰였나요?",
    ],
    rewriteFocus: [
      "HR 운영 자료라는 맥락을 명확히 하고 회계/재무로 과대해석하지 않음",
      "정확도, 누락 방지, 부서 간 follow-up을 강조",
      "정책 판단이 있었다면 그 범위를 별도로 명시",
    ],
  },
  product_operations: {
    missingEvidence: [
      "분석한 퍼널/지표와 발견한 문제",
      "제안한 개선안과 실제 배포 여부",
      "배포 후 전환율, 이탈률, 사용성 지표 변화",
    ],
    clarificationQuestions: [
      "어떤 퍼널 단계나 사용자 행동 데이터를 봤나요?",
      "발견한 이탈 원인에 대해 어떤 개선안을 제안했나요?",
      "개선 후 지표 변화를 추적했나요?",
    ],
    rewriteFocus: [
      "엑셀 리포트가 제품/운영 개선으로 이어진 흐름을 작성",
      "문제 발견 → 개선 제안 → 배포 후 추적 순서로 구조화",
      "제품팀/개발팀과의 협업과 후속 실험 우선순위를 명시",
    ],
  },
  unknown_admin_support: {
    missingEvidence: [
      "정리한 자료의 목적과 사용처",
      "본인이 판단하거나 개선한 부분",
      "누가 이 자료를 검토하거나 의사결정에 사용했는지",
    ],
    clarificationQuestions: [
      "정해진 양식에 입력만 한 것인가요, 아니면 직접 기준을 만들었나요?",
      "그 자료는 누구에게 전달됐고 어떤 의사결정에 사용됐나요?",
      "자료 정리 과정에서 오류를 발견하거나 개선한 사례가 있나요?",
    ],
    rewriteFocus: [
      "엑셀 사용 자체보다 목적, 판단, 결과 활용처를 보강",
      "직무 도메인이 불명확하면 회계/재무/운영 등으로 단정하지 않음",
      "근거가 부족하면 질문을 통해 책임 범위를 확인",
    ],
  },
});

function suggestionsFor(roleFamily) {
  return ROLE_SPECIFIC_SUGGESTIONS[roleFamily] ?? ROLE_SPECIFIC_SUGGESTIONS.unknown_admin_support;
}

export function suggestOwnershipEvidenceImprovements(input = {}) {
  const classification = input.classification ?? classifyOwnershipSeniority(input);
  const roleSuggestions = suggestionsFor(classification.roleFamily);
  const shouldNotInfer = toArray(classification.shouldNotInfer);

  return {
    currentReading: buildCurrentReading(classification),
    roleFamily: classification.roleFamily,
    ownershipLevel: classification.ownershipLevel,
    judgmentLevel: classification.judgmentLevel,
    seniorityLevel: classification.seniorityLevel,
    evidenceLevel: classification.evidenceLevel,
    confidence: classification.confidence,
    missingEvidence: roleSuggestions.missingEvidence,
    clarificationQuestions: roleSuggestions.clarificationQuestions,
    rewriteFocus: roleSuggestions.rewriteFocus,
    shouldNotClaim: shouldNotInfer,
    safeClaimBoundary: classification.explanationBoundary,
    appliedToResume: false,
    appliedToCareerProfile: false,
  };
}
