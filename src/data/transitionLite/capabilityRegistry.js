export const CAPABILITY_REGISTRY = {
  stakeholder_communication: {
    label: "고객, 동료, 상사, 외부 파트너 등과 직접 이야기하고 조율한 경험",
    shortDescription: "누구를 상대했고 어떻게 직접 소통했는지 보는 역량",
    tone: "core",
  },
  collaboration_coordination: {
    label: "여러 사람과 역할, 일정, 일을 맞춰가며 진행한 경험",
    shortDescription: "여러 사람과 맞춰 일하고 운영을 조율하는 역량",
    tone: "core",
  },
  user_or_customer_understanding: {
    label: "사용자나 고객이 원하는 것을 파악하고 반영한 경험",
    shortDescription: "사용자나 고객의 맥락과 요구를 읽고 반영하는 역량",
    tone: "core",
  },
  structured_delivery: {
    label: "정보를 정리해서 명확하게 전달한 경험",
    shortDescription: "요구사항이나 정보를 구조화해 정리하고 전달하는 역량",
    tone: "core",
  },
  execution_depth: {
    label: "얼마나 직접, 얼마나 책임지고 해봤는지",
    shortDescription: "결과 수준과 지속성, 실제 수행 깊이를 보여주는 역량",
    tone: "core",
  },
  domain_context: {
    label: "이 업종의 실제 환경과 흐름을 아는 정도",
    shortDescription: "목표 산업과 업무 맥락을 이해하고 연결하는 역량",
    tone: "core",
  },
  job_alignment: {
    label: "내가 해온 경험이 이 직무와 얼마나 직접 맞는지",
    shortDescription: "현재 경험이 목표 직무 과업과 직접 맞닿는 정도",
    tone: "core",
  },
  work_style_signal: {
    label: "내가 어떤 방식으로 일하는 편인지",
    shortDescription: "자기보고 기반 강점과 업무 스타일을 보조적으로 보여주는 신호",
    tone: "support",
  },
};

export function getCapabilityMeta(capabilityId) {
  return CAPABILITY_REGISTRY[capabilityId] || null;
}
