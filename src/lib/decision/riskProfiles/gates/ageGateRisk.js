export const ageGateRisk = {
  id: "GATE__AGE",
  group: "gates",
  layer: "gate",

  when: ({ state } = {}) => {
    const n = Number(String(state?.age ?? "").trim());
    return Number.isFinite(n) && n > 0;
  },

  score: ({ state } = {}) => {
    const age = Number(String(state?.age ?? "").trim());
    if (!Number.isFinite(age) || age <= 0) return 0;

    // 🔥 문턱형 구조 (현실형 서류 컷 반영)
    if (age < 35) return 0.05;
    if (age < 40) return 0.45;
    if (age < 45) return 0.70;
    if (age < 50) return 0.88;
    return 0.97;
  },

  // 🔥 score 기반 동적 priority
  priority: 0, // 엔진 normalize 단계에서 덮어씀

  explain: ({ state } = {}) => {
    const age = Number(String(state?.age ?? "").trim());
    if (!Number.isFinite(age) || age <= 0) return null;

    return {
      title: "나이가 회사 기준선을 넘으면 서류에서 보수적으로 컷될 가능성",
      why: [
        age >= 45
          ? "동일 직급/연차 대비 나이가 높으면 내부 밴드/승진 구조와 충돌로 서류 단계에서 보수적으로 컷될 수 있습니다."
          : "조직은 나이를 직급 기대치/성장 곡선과 함께 보며 리스크로 인식할 수 있습니다.",
      ],
      action: [
        "나이 자체를 설득하기보다 '최근 3년 성과', '리더십 범위', '즉시전력 근거'를 상단에 배치해 리스크를 상쇄하세요.",
      ],
      counter: [
        "성과 스케일, 의사결정 권한, 프로젝트 리딩이 명확하면 나이 리스크는 약화될 수 있습니다.",
      ],
      signals: [`입력 나이: ${age}`],
    };
  },
};

