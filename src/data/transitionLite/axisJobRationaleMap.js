// src/data/transitionLite/axisJobRationaleMap.js
// SSOT for whyThisAxisMatters text per axis x subVertical.
//
// CONTRACT:
//   Key structure: axisKey ("axis1"~"axis5") -> { base, bySubVertical }
//   base    : job-agnostic fallback (always non-empty)
//   bySubVertical : subVertical-specific override (optional)
//
// Consumer: buildNewgradAxisPack.js
// getAxisJobRationale(axisKey, subVertical) is the only intended access point.

export const AXIS_JOB_RATIONALE_MAP = {
  axis1: {
    base: "전공·프로젝트·인턴 경험이 목표 직무 과업과 얼마나 직접 맞닿는지를 봅니다.",
    bySubVertical: {
      SERVICE_PLANNING:  "서비스기획은 기능 정의와 구현 협업이 핵심이라, 관련 경험이 직무 과업과 맞닿는지를 봅니다.",
      UX_SERVICE_DESIGN: "UX·서비스 설계는 흐름 설계가 핵심 과업이라, 유사한 경험이 직무 과업과 연결되는지를 봅니다.",
      B2B_SALES:         "B2B 영업은 고객 발굴과 제안이 핵심 과업이라, 유사한 실행 경험이 직무와 겹치는지를 봅니다.",
      BRAND_MARKETING:   "브랜드 마케팅은 메시지 설계와 캠페인 기획이 핵심이라, 관련 경험이 직무 과업과 맞는지를 봅니다.",
      RECRUITING:        "채용 업무는 요구사항 정리와 프로세스 운영이 핵심이라, 유사한 실행 경험이 있는지를 봅니다.",
    },
  },
  axis2: {
    base: "경험이 목표 산업에 대한 이해와 맥락을 얼마나 제공하는지를 봅니다.",
    bySubVertical: {
      SERVICE_PLANNING:  "IT·플랫폼 서비스의 구조를 알아야 기획이 가능하므로, 산업 맥락 접점이 있는지를 봅니다.",
      UX_SERVICE_DESIGN: "서비스 흐름을 설계하려면 산업과 사용자 맥락 이해가 필요하므로 이 축을 함께 봅니다.",
      B2B_SALES:         "B2B 영업은 고객사 산업을 이해해야 설득이 가능하므로, 산업 접점 경험이 있는지를 봅니다.",
      BRAND_MARKETING:   "브랜드 마케팅은 시장과 소비자 맥락 이해가 핵심이라, 산업 접점 경험이 있는지를 봅니다.",
      RECRUITING:        "채용 업무는 현업 도메인을 이해해야 요구사항 파악이 쉬워지므로 산업 맥락을 함께 봅니다.",
    },
  },
  axis3: {
    base: "경험에서 실제로 얼마나 깊이 실행하고 관여했는지를 직무 수준과 비교합니다.",
    bySubVertical: {
      SERVICE_PLANNING:  "서비스기획은 요구사항 정의부터 출시까지 실행 깊이가 중요하므로, 관여 범위를 함께 봅니다.",
      UX_SERVICE_DESIGN: "UX 설계는 흐름 전체를 실제로 만들어본 경험이 중요하므로, 실행 범위와 깊이를 봅니다.",
      B2B_SALES:         "B2B 영업은 제안부터 계약까지 직접 관여한 경험이 설득력이 있으므로 실행 범위를 봅니다.",
      BRAND_MARKETING:   "브랜드 마케팅은 캠페인을 직접 기획하고 실행한 경험이 중요하므로, 관여 범위를 봅니다.",
      RECRUITING:        "채용 업무는 전체 프로세스를 직접 운영해본 경험이 중요하므로, 실행 깊이를 함께 봅니다.",
    },
  },
  axis4: {
    base: "경험에서 다룬 상대방이 직무의 주요 이해관계자와 얼마나 겹치는지를 봅니다.",
    bySubVertical: {
      SERVICE_PLANNING:  "서비스기획은 사용자와 내부 협업 상대를 함께 다루므로, 유사한 이해관계자 경험이 있는지를 봅니다.",
      UX_SERVICE_DESIGN: "UX 설계는 사용자와 협업 상대를 함께 이해해야 하므로, 유사한 이해관계자 접점이 있는지를 함께 봅니다.",
      B2B_SALES:         "B2B 영업은 고객사 실무자와 의사결정자 관계 형성이 핵심이라, 유사한 이해관계자 경험이 있는지를 봅니다.",
      BRAND_MARKETING:   "브랜드 마케팅은 소비자와 파트너사를 모두 다루므로, 유사한 이해관계자 경험을 봅니다.",
      RECRUITING:        "채용 업무는 후보자와 현업 담당자를 모두 상대하므로, 유사한 이해관계자 소통 경험이 있는지를 봅니다.",
    },
  },
  axis5: {
    base: "협업 방식과 소통 패턴이 직무가 요구하는 행동 양식과 얼마나 맞는지를 봅니다.",
    bySubVertical: {
      SERVICE_PLANNING:  "서비스기획은 유관부서 조율과 소통이 일상이라, 협업 성향과 직무 방식의 적합도를 봅니다.",
      UX_SERVICE_DESIGN: "UX 설계는 공감 능력과 팀 소통이 중요하므로, 협업 성향이 직무 방식과 맞는지를 봅니다.",
      B2B_SALES:         "B2B 영업은 관계 유지와 설득 스타일이 중요하므로, 성향과 직무 방식의 적합도를 함께 봅니다.",
      BRAND_MARKETING:   "브랜드 마케팅은 창의적 사고와 협업 실행이 모두 필요하므로, 성향과 직무 방식의 적합도를 봅니다.",
      RECRUITING:        "채용 업무는 사람을 대하는 방식과 정리력이 핵심이라, 성향과 직무 방식의 적합도를 봅니다.",
    },
  },
};

export function getAxisJobRationale(axisKey, subVertical) {
  const entry = AXIS_JOB_RATIONALE_MAP[String(axisKey || "")];
  if (!entry) return "";
  const override = subVertical && typeof subVertical === "string"
    ? entry.bySubVertical?.[subVertical.trim()]
    : undefined;
  return override || entry.base || "";
}
