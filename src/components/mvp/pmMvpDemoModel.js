export const DEFAULT_RESUME_PROFILE_DISPLAY = {
  name: "백강산",
  phone: "010-0000-0000",
  email: "email@example.com",
  location: "서울",
  portfolioUrl: "portfolio.example.com",
};

export const DEFAULT_RESUME_EXPERIENCE_DISPLAY = {
  company: "OO회사",
  role: "",
  startDate: "2023.03",
  endDate: "현재",
  description: "운영 이슈 대응, 협업 조율, 문서화 기반 개선",
};

export const DEFAULT_RESUME_EDUCATION_DISPLAY = [{
  school: "OO대학교",
  major: "OOO학과",
  startDate: "2016.03",
  endDate: "2022.02",
  description: "학력 정보 업데이트 예정",
}];

export function buildDemoResult(input, sourceTrack) {
  const sourceText = String(input?.text || "").trim();
  const isProjectTrack = sourceTrack === "project" || input?.track === "project";
  const helperPrefix = isProjectTrack ? "프로젝트 기록 기준" : "이번 주 기록 기준";

  const projectName = String(input?.projectName || "").trim();
  const projectGoal = String(input?.projectGoal || "").trim();
  const projectActions = String(input?.projectActions || "").trim();
  const projectResult = String(input?.projectResult || "").trim();

  const projectSummary = isProjectTrack
    ? `${projectName ? `${projectName} 프로젝트는 ` : ""}${projectGoal || "설정한 목표"}를 중심으로 수행 행동과 결과를 이력서 경험으로 정리할 수 있습니다.`
    : null;

  const compact = (v, fallback = "") => String(v || "").trim() || fallback;

  const projectResumeLine = isProjectTrack && (projectActions || projectResult)
    ? `${projectActions ? projectActions + (projectResult ? " " : "") : ""}${projectResult ? "그 결과 " + projectResult : ""}`.trim()
    : null;

  const finalResumeLine = projectResumeLine ||
    "반복적으로 발생하는 오류 문의 유형을 구조화하고, 개발팀과 협업해 대응 문서를 정리함으로써 운영 효율과 후속 대응 흐름 개선에 기여했습니다.";

  const projectCardResumeLine = isProjectTrack
    ? (projectName
        ? `${projectName} 프로젝트에서 ${compact(projectGoal, "업무 목표")}를 달성하기 위해 ${compact(projectActions, "필요한 행동")}을 수행했고, ${compact(projectResult, "의미 있는 결과")}로 이어지는 경험을 만들었습니다.`
        : `${compact(projectGoal, "설정한 목표")}를 달성하기 위해 ${compact(projectActions, "필요한 행동")}을 수행했고, ${compact(projectResult, "의미 있는 결과")}로 이어지는 경험을 만들었습니다.`)
    : null;

  const structuredCards = isProjectTrack
    ? [
        { label: "프로젝트 목표", value: compact(projectGoal, "아직 입력되지 않았습니다.") },
        { label: "핵심 행동", value: compact(projectActions, "아직 입력되지 않았습니다.") },
        { label: "결과·성과", value: compact(projectResult, "아직 입력되지 않았습니다.") },
        { label: "이력서 문장 후보", value: projectCardResumeLine || compact(finalResumeLine, "이력서 문장은 기록이 더 쌓이면 자동으로 정리됩니다.") },
      ]
    : [
        { label: "이번 주 요약", value: compact(sourceText, "이번 주 기록을 남기면 자동으로 정리됩니다.") },
        { label: "읽힌 업무 신호", value: "운영 이슈 구조화, 협업 조율, 후속 실행 관리, 문서화 역량" },
        { label: "이력서 문장 후보", value: finalResumeLine },
      ];

  return {
    sourceText,
    helperPrefix,
    summary: projectSummary,
    resumeLine: finalResumeLine,
    structuredCards,
    strengths: ["운영 이슈 구조화", "협업 조율", "후속 실행 관리", "문서화 역량"],
    strengthDescription: "이번 경험은 단순 처리 업무보다, 반복 이슈를 정리하고 협업 흐름을 정리하는 강점으로 읽힙니다.",
    pmSignals: ["여러 이해관계자와의 협업 조율", "반복 이슈를 구조화한 경험"],
    serviceSignals: ["운영 흐름 정리", "요구사항/이슈 문서화"],
    missingSignals: ["우선순위 판단 근거", "성과 수치 표현"],
    nextActions: [
      "대응 시간이나 처리 건수처럼 수치가 있으면 함께 넣어보기",
      "왜 이 이슈를 먼저 정리했는지 맥락 추가하기",
      "사용자/고객 관점에서 의미를 한 줄 더 붙이기",
    ],
    readiness: {
      summaryTitle: "현재 준비도 요약",
      summaryText: "PM 준비도 48%\n최근 기록 반영 후 +6%",
      summarySubtext: "이번 기록으로 협업 조율 신호와 운영 구조화 신호가 강화됐습니다.",
      ownedSignals: ["여러 이해관계자와의 협업 조율 경험", "반복 이슈를 구조화한 경험", "실행 후 후속 조치까지 정리한 경험"],
      missingSignals: ["우선순위 판단 기준 제시 경험", "데이터 기반 판단 표현", "고객 문제를 정의하는 관점"],
      nextSignals: ["성과를 숫자나 변화 기준으로 표현하기", "왜 이 문제를 먼저 풀었는지 배경 추가하기", "사용자/고객 기준으로 문장 재정리하기"],
      recentChange: "이번 기록으로 크로스펑셔널 협업 신호가 새롭게 강화됐습니다. 부족 신호 3개 중 1개는 일부 보완 가능한 상태로 바뀌었습니다.",
    },
  };
}
