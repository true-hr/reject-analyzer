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
    .map((r) => {
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

  function __clamp01(v) {
    const n = __safeNum(v, 0);
    return n < 0 ? 0 : n > 1 ? 1 : n;
  }

  function __getPriority(r) {
    return __safeNum(r?.priority, __safeNum(r?.raw?.priority, 0));
  }

  function __getScore01(r) {
    // riskResults.score는 0~1로 들어오는 전제 (없으면 0)
    return __clamp01(r?.score ?? r?.raw?.score ?? 0);
  }

  // ✅ PATCH: gate 판정은 layer + id prefix + raw.layer까지 포함 (표시용 only)
  function __isGate(r) {
    const layer = String(r?.layer || r?.raw?.layer || "").toLowerCase();
    const id = String(r?.id || "");
    return layer === "gate" || id.startsWith("GATE__");
  }
  // ✅ PATCH (append-only): strength/label helpers for Top3 grouping (표시용 only)
  function __getStrengthCode(r) {
    // 다양한 케이스 흡수 (A/B/C/D or 1~4 등)
    const s =
      r?.strength ??
      r?.raw?.strength ??
      r?.grade ??
      r?.raw?.grade ??
      r?.level ??
      r?.raw?.level ??
      null;

    if (s == null) return null;

    const str = String(s).trim().toUpperCase();

    // 숫자 등급 대응(있으면)
    if (str === "4" || str === "3") return "A";
    if (str === "2") return "B";
    if (str === "1" || str === "0") return "C";

    // 이미 A/B/C/D면 그대로
    if (str === "A" || str === "B" || str === "C" || str === "D") return str;

    return null;
  }

  function __levelForTop3(r) {
    // 1) Gate는 무조건 critical
    if (__isGate(r)) return "critical";

    // 2) strength 기반
    const sc = __getStrengthCode(r);
    if (sc === "A") return "critical";
    if (sc === "B") return "warning";

    return "neutral";
  }

  // 제목/한줄근거: 가능한 한 riskResult 내부 필드 우선
  function __getTitle(r) {
    return (
      r?.title ??
      r?.label ??
      r?.name ??
      r?.raw?.title ??
      r?.raw?.label ??
      r?.raw?.name ??
      String(r?.id || "")
    );
  }

  function __getOneLiner(r) {
    return (
      r?.oneLiner ??
      r?.reasonShort ??
      r?.summary ??
      r?.raw?.oneLiner ??
      r?.raw?.reasonShort ??
      r?.raw?.summary ??
      null
    );
  }
  function __byId(rr, id) {
    const hit = (rr || []).find((x) => String(x?.id || "") === String(id || ""));
    return hit ? __getScore01(hit) : null;
  }

  function __avgScore01(rr) {
    const arr = (rr || []).map(__getScore01);
    if (!arr.length) return 0;
    return arr.reduce((s, x) => s + x, 0) / arr.length;
  }

  function __pickTop2(rrSorted) {
    const gates = (rrSorted || []).filter(__isGate);
    const normals = (rrSorted || []).filter((r) => !__isGate(r));

    const rank = (a, b) => {
      const pa = __getPriority(a);
      const pb = __getPriority(b);
      if (pb !== pa) return pb - pa;
      const sa = __getScore01(a);
      const sb = __getScore01(b);
      return sb - sa;
    };

    const g2 = [...gates].sort(rank).slice(0, 2);
    if (g2.length >= 2) return g2;

    const need = 2 - g2.length;
    const n2 = [...normals].sort(rank).slice(0, need);
    return [...g2, ...n2].slice(0, 2);
  }

  function __derivePosition({ posRaw, gateMax }) {
    // 게이트가 강하면 포지션 라벨은 하드로 내려야 "테스트형"에서 설득력이 생김
    if (__clamp01(gateMax) >= 0.85) {
      return { label: "❄️ 구조적 탈락권", band: "fail_hard", pct: Math.round(__clamp01(posRaw) * 100) };
    }

    const p = __clamp01(posRaw);
    const pct = Math.round(p * 100);

    if (pct < 20) return { label: "❄️ 구조적 탈락권", band: "fail", pct };
    if (pct < 40) return { label: "🧊 보류 관망권", band: "hold", pct };
    if (pct < 60) return { label: "⚖️ 경합 구간", band: "edge", pct };
    if (pct < 80) return { label: "🚀 우선 검토권", band: "shortlist", pct };
    return { label: "🏆 합격 유력권", band: "strong", pct };
  }

  function __determineType({ gateMax, posRaw, trust, fit, risk, top2 }) {
    const gm = __clamp01(gateMax);
    const pr = __clamp01(posRaw);
    const t = __clamp01(trust);
    const f = __clamp01(fit);
    const r = __clamp01(risk);

    // 1) 게이트 우선
    if (gm >= 0.85) {
      if (pr < 0.3) {
        return {
          typeId: "TYPE_GATE_BLOCK",
          emoji: "🚧",
          label: "구조적 차단형",
          oneLiner: "역량보다 조건/게이트가 먼저 걸립니다.",
          userTypeCompat: {
            code: "TYPE_GATE_BLOCK",
            title: "🚧 구조적 차단형",
            description: "면접 설득 이전에 조건(게이트) 해소가 우선입니다.",
          },
        };
      }
      return {
        typeId: "TYPE_CONDITION_CONFLICT",
        emoji: "🪞",
        label: "조건 충돌형",
        oneLiner: "역량은 괜찮지만 조건에서 충돌이 납니다.",
        userTypeCompat: {
          code: "TYPE_CONDITION_CONFLICT",
          title: "🪞 조건 충돌형",
          description: "실력과 별개로 연령/보상/조건에서 필터링될 수 있습니다.",
        },
      };
    }

    // 2) 전환/적합도 중심
    if (f < 0.45) {
      return {
        typeId: "TYPE_SHIFT_TRIAL",
        emoji: "🔁",
        label: "전환 시험대형",
        oneLiner: "전환 설득 근거를 테스트받는 구간입니다.",
        userTypeCompat: {
          code: "TYPE_SHIFT_TRIAL",
          title: "🔁 전환 시험대형",
          description: "도메인/직무 전환의 전이 근거가 핵심 쟁점이 됩니다.",
        },
      };
    }

    // 3) 신뢰/설득 중심
    if (t < 0.55 && f > 0.65) {
      return {
        typeId: "TYPE_PERSUASION_WEAK",
        emoji: "📉",
        label: "설득 부족형",
        oneLiner: "경험은 맞는데 임팩트/근거가 약하게 보입니다.",
        userTypeCompat: {
          code: "TYPE_PERSUASION_WEAK",
          title: "📉 설득 부족형",
          description: "성과 밀도(정량/맥락/기여)가 약하면 질문이 늘어납니다.",
        },
      };
    }

    // 4) 강한 합격/즉전감
    if (t > 0.75 && r < 0.25) {
      return {
        typeId: "TYPE_READY_CORE",
        emoji: "🔥",
        label: "즉전감 핵심형",
        oneLiner: "바로 써먹을 수 있는 카드로 보입니다.",
        userTypeCompat: {
          code: "TYPE_READY_CORE",
          title: "🔥 즉전감 핵심형",
          description: "검증 비용이 낮고, 즉시 투입 가능한 인상입니다.",
        },
      };
    }

    // 5) 평균/경합
    if (pr >= 0.4 && pr < 0.6) {
      return {
        typeId: "TYPE_EDGE_BALANCE",
        emoji: "⚖️",
        label: "줄타기 관망형",
        oneLiner: "가능성은 보이지만 확신은 부족합니다.",
        userTypeCompat: {
          code: "TYPE_EDGE_BALANCE",
          title: "⚖️ 줄타기 관망형",
          description: "결정적 한 방(근거/정합성)이 없으면 보류될 수 있습니다.",
        },
      };
    }

    // 6) 무난 기본형 (fallback)
    return {
      typeId: "TYPE_STABLE_AVG",
      emoji: "🧊",
      label: "무난 통과형",
      oneLiner: "큰 결함은 없지만 인상은 약할 수 있습니다.",
      userTypeCompat: {
        code: "TYPE_STABLE_AVG",
        title: "🧊 무난 통과형",
        description: "안정적이지만, 차별 포인트가 약하면 우선순위가 내려갈 수 있습니다.",
      },
    };
  }

  const sorted = [...(riskResults || [])].sort((a, b) => __getPriority(b) - __getPriority(a));

  // ✅ PATCH: "컷 신호 TOP3"는 gate를 우선 포함 (최대 3개), 부족분은 일반 리스크로 채움
  const __gates = sorted.filter(__isGate);
  const __normals = sorted.filter((r) => !__isGate(r));
  const __need = Math.max(0, 3 - Math.min(3, __gates.length));
  const top3 = [...__gates.slice(0, 3), ...__normals.slice(0, __need)].slice(0, 3);

  // ---------- interpretation (유형 테스트 엔진: riskResults 기반, AI 없음) ----------
  const gateScores = __gates.map(__getScore01);
  const gateMax = gateScores.length ? Math.max(...gateScores) : 0;

  const domainShift = __byId(sorted, "SIMPLE__DOMAIN_SHIFT") ?? 0;
  const roleShift = __byId(sorted, "SIMPLE__ROLE_SHIFT") ?? 0;

  const docOnly = sorted.filter((r) => !__isGate(r));
  const docAvg = __avgScore01(docOnly);

  // overallScore가 여기로 안 넘어오므로, riskResults 기반 posRaw(0~1) 프록시
  // - gate가 있으면 거의 그게 결정
  // - gate 없으면 docAvg가 결정
  const posRaw = __clamp01(1 - (0.78 * __clamp01(gateMax) + 0.22 * __clamp01(docAvg)));

  const fit = __clamp01(1 - __clamp01(0.65 * __clamp01(domainShift) + 0.35 * __clamp01(roleShift)));
  const risk = __clamp01(0.85 * __clamp01(gateMax) + 0.15 * __clamp01(docAvg));
  const trust = __clamp01(0.60 * (1 - __clamp01(docAvg)) + 0.40 * (1 - __clamp01(gateMax) * 0.60));

  const position = __derivePosition({ posRaw, gateMax });

  const top2 = __pickTop2(sorted);
  const type = __determineType({
    gateMax,
    posRaw,
    trust,
    fit,
    risk,
    top2,
  });

  const interpretation = {
    typeId: type?.typeId || "TYPE_MIXED",
    emoji: type?.emoji || "🧩",
    label: type?.label || "혼합 리스크형",
    oneLiner: type?.oneLiner || "여러 리스크가 동시에 작동하고 있습니다.",
    positionLabel: position?.label || "⚖️ 경합 구간",
    positionPct: __safeNum(position?.pct, Math.round(posRaw * 100)),
    signals: {
      gateMax: __clamp01(gateMax),
      domainShift: __clamp01(domainShift),
      roleShift: __clamp01(roleShift),
      docAvg: __clamp01(docAvg),
      posRaw: __clamp01(posRaw),
      trust: __clamp01(trust),
      fit: __clamp01(fit),
      risk: __clamp01(risk),
    },
    top2: top2.map((x) => x?.id).filter(Boolean),
  };

  // 기존 group 기반은 보조로만 남김(메타/디버그 용)
  const primaryGroup = top3[0]?.group || null;

  // ✅ userType을 "유형 테스트 결과"로 교체(기존 UI 그대로여도 타입이 다양하게 보이게)
  const userType = type?.userTypeCompat || mapType(primaryGroup);

  const logs = buildDecisionLogs(top3);

  const avgPriority = top3.reduce((s, r) => s + __getPriority(r), 0) / (top3.length || 1);

  // ✅ NEW (append-only): pass position payload for UI (SimulatorLayout compatibility)
  // 점수 톤 정책(자존감 박살 방지):
  // - 정말 안 맞는 케이스도 30점대부터 시작
  // - 평범(무난) 구간이 60~70점대에 오도록 완만하게 매핑
  // 기존 posRaw(0~1)는 "리스크 기반 프록시"라서 너무 박하게 나올 수 있음 → UI용 점수로 변환
  const __posRaw01 = __clamp01(__safeNum(posRaw, 0.35));

  // basePct(참고용): 기존 계산(직접 노출 X)
  const __basePct = __safeNum(interpretation?.positionPct, Math.round(__posRaw01 * 100));

  // generousPct(노출용): 30 ~ 85 범위 중심으로 스케일
  // - posRaw=0.00 → 30
  // - posRaw=0.55 → 60
  // - posRaw=0.73 → 70
  // - posRaw=1.00 → 85
  const __generousPct = __clamp01((30 + 55 * __posRaw01) / 100);
  const __posPct = Math.max(30, Math.min(95, Math.round(__generousPct * 100)));
  // "면접관 해석 유형" 표현과 맞추기: pass.bandLabel은 position이 아니라 interpretation 타입 라벨을 우선 사용
  // - 예: "🚧 구조적 차단형"
  const __bandLabel =
    (interpretation?.label ? `${interpretation.emoji || ""} ${interpretation.label}`.trim() : null) ||
    (userType?.title ? String(userType.title).trim() : null) ||
    (position?.label ? String(position.label).trim() : null) ||
    "🎯 해석 중";

  // upliftHint도 “면접관 해석 유형” 톤으로: 조직은 잠재력을 보지만… / 판단: 설득 포인트 탐색 중
  const __upliftHint =
    interpretation?.oneLiner ||
    "조직은 잠재력을 보지만, “이 경험이 여기서도 통할까?”를 궁금해하고 있습니다.";

  return {
    top3,
    // ✅ append-only alias for UI compatibility
    signalsTop3: top3,
    userType,
    logs,
    // ✅ new: interpretation (테스트형 결과)
    interpretation,

    // ✅ NEW (append-only): score fields for Pass position UI
    passProbability: __posPct,
    pass: {
      percent: __posPct,
      percentText: `${__posPct}%`,
      bandLabel: __bandLabel,
      upliftHint: __upliftHint,
      // (append-only) 리포트 “면접관 해석 유형” 섹션과 문구/구조 맞추기용
      headline: "🎯 당신의 현재 면접관 해석 유형",
      stageLabel: "보완 단계",
      judgementLabel: "판단: 설득 포인트 탐색 중",
      // (debug/tuning) 원본 프록시도 남김
      basePct: __basePct,
      posRaw: __posRaw01,
    },

    meta: {
      avgPriority,
      primaryGroup,
      totalCount: (riskResults || []).length,
      // ✅ extra meta for tuning/debug
      gateMax: interpretation?.signals?.gateMax ?? 0,
      posPct: interpretation?.positionPct ?? null,
      fit: interpretation?.signals?.fit ?? null,
      trust: interpretation?.signals?.trust ?? null,
      risk: interpretation?.signals?.risk ?? null,
      top2: interpretation?.top2 ?? [],
    },
  };

}