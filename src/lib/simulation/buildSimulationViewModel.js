// src/lib/simulation/buildSimulationViewModel.js

function mapType(group) {
  const typeMap = {
    salary: {
      code: "SALARY_ALERT",
      title: " 연봉 역전 경계형",
      description: "보상 기대치와 조직 밴드 정합성 리스크가 높게 해석될 수 있습니다.",
    },
    domain: {
      code: "DOMAIN_SHIFT",
      title: " 도메인 전환 설득 실패형",
      description: "산업 전환의 전이 근거가 약하면 검증 비용이 커집니다.",
    },
    impact: {
      code: "IMPACT_WEAK",
      title: " 성과 검증 불가형",
      description: "정량 성과가 부족하면 주장형으로 오해될 수 있습니다.",
    },
    structure: {
      code: "STRUCTURE_WEAK",
      title: " 추상 서술형",
      description: "핵심 근거가 흐리면 면접관이 확인할 게 많아집니다.",
    },
  };

  return typeMap[group] || {
    code: "MIXED",
    title: "혼합 리스크형",
    description: "여러 리스크가 동시에 작동하고 있습니다.",
  };
}

function buildDecisionLogs(topRisks) {
  //  MVP: group 기반 1줄 로그만 (확장 시 explain/semantic/selfCheck 반영 가능)
  const decisionLogMap = {
    salary: "연봉 조정 실패 시 이탈 가능성 계산  보수적으로 해석",
    domain: "산업 전환인데 전이 근거 약함  검증 비용 증가",
    impact: "성과 수치 부족  검증 불가로 분류될 가능성",
    structure: "주장만 있고 근거가 약함  확인 질문 증가",
  };

  return topRisks
    .map(r => {
      const g = r?.group;
      const msg = decisionLogMap[g];
      return msg ? `${msg}` : null;
    })
    .filter(Boolean)
    .slice(0, 3);
}

export function buildSimulationViewModel(riskResults = []) {
  function __safeNum(v, fb = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fb;
  }

  function __getPriority(r) {
    return __safeNum(r?.priority, __safeNum(r?.raw?.priority, 0));
  }

  // ✅ PATCH: gate 판정은 layer + id prefix + raw.layer까지 포함 (표시용 only)
  function __isGate(r) {
    const layer = String(r?.layer || r?.raw?.layer || "").toLowerCase();
    const id = String(r?.id || "");
    return layer === "gate" || id.startsWith("GATE__");
  }

  const sorted = [...(riskResults || [])].sort((a, b) => __getPriority(b) - __getPriority(a));

  // ✅ PATCH: "컷 신호 TOP3"는 gate를 우선 포함 (최대 3개), 부족분은 일반 리스크로 채움
  const __gates = sorted.filter(__isGate);
  const __normals = sorted.filter((r) => !__isGate(r));
  const __need = Math.max(0, 3 - Math.min(3, __gates.length));
  const top3 = [...__gates.slice(0, 3), ...__normals.slice(0, __need)].slice(0, 3);

  const primaryGroup = top3[0]?.group || null;
  const userType = mapType(primaryGroup);
  const logs = buildDecisionLogs(top3);

  const avgPriority =
    top3.reduce((s, r) => s + __getPriority(r), 0) / (top3.length || 1);
  return {
    top3,
    // ✅ append-only alias for UI compatibility
    signalsTop3: top3,
    userType,
    logs,
    meta: {
      avgPriority,
      primaryGroup,
      totalCount: (riskResults || []).length,
    },
  };
}