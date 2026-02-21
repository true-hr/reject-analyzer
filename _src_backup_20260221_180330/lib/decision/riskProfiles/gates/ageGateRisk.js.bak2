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
      title: "연령대가 서류 단계에서 보수적으로 작용할 가능성",
      why:
        age >= 45
          ? "동일 직급/연차 대비 연령이 높으면 내부 밴드·승진 구조와 충돌로 서류에서 보수적 판단이 발생할 수 있습니다."
          : "일부 조직에서는 연령대와 직급 기대치 간 괴리를 리스크로 인식할 수 있습니다.",
      action:
        "연령이 아닌 '최근 3년 성과', '리더십 범위', '즉시 전력화 가능성'을 상단에 배치하여 프레이밍을 전환하세요.",
      counter:
        "경력 깊이·의사결정 권한·대형 프로젝트 경험이 명확하면 연령 리스크는 약화됩니다.",
      signals: [`입력 나이: ${age}`],
    };
  },
};