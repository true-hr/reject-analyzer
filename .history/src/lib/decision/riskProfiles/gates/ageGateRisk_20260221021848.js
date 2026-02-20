export const ageGateRisk = {
  id: "ageGateRisk",
  group: "gate",
  layer: "document",
  priority: 60,

  // state.age 기반 (App.jsx: set("age", ...))
  when: ({ state } = {}) => {
    const raw = String(state?.age ?? "").trim();
    const n = Number(raw);
    return Number.isFinite(n) && n > 0;
  },

  // 35부터 완만하게, 40/45에서 강해짐 (0~1)
  score: ({ state } = {}) => {
    const raw = String(state?.age ?? "").trim();
    const age = Number(raw);
    if (!Number.isFinite(age) || age <= 0) return 0;

    // piecewise (보수적으로)
    if (age < 35) return 0.05;
    if (age < 40) return 0.35 + (age - 35) * (0.15 / 5); // 0.35~0.50
    if (age < 45) return 0.60 + (age - 40) * (0.20 / 5); // 0.60~0.80
    if (age < 50) return 0.85 + (age - 45) * (0.08 / 5); // 0.85~0.93
    return 0.95;
  },

  explain: ({ state } = {}) => {
    const raw = String(state?.age ?? "").trim();
    const age = Number(raw);
    if (!Number.isFinite(age) || age <= 0) return null;

    // 너무 단정하지 않고, “서류 단계에서 필터로 작동 가능” 뉘앙스
    let band = "낮음";
    if (age >= 35 && age < 40) band = "주의";
    else if (age >= 40 && age < 45) band = "높음";
    else if (age >= 45) band = "매우 높음";

    const signals = [
      `입력 나이: ${raw}`,
      "참고: 나이 기준은 회사/직무/레벨/경력연차에 따라 크게 달라질 수 있음",
    ];

    const why =
      age >= 40
        ? "서류 단계에서는 ‘스펙/경력’보다 먼저 ‘필터 조건’이 작동하는 경우가 있습니다. 특히 동일 레벨/연차 대비 연령이 높게 인식되면, 인터뷰 이전에 컷될 가능성이 올라갑니다."
        : "일부 회사/직무는 서류 단계에서 연령을 민감하게 보기도 합니다. 다른 강점이 있어도 ‘리스크 신호’로 잡힐 수 있습니다.";

    const action =
      "지원 타겟을 ‘연차/레벨 매칭’ 기준으로 재정렬하고, 이력서 상단에 ‘최근 2~3년 핵심 성과(숫자/임팩트)’를 더 강하게 배치하세요. (서류 필터를 넘기려면 첫 페이지 설득력이 필요합니다.)";

    const counter =
      "단, 경력 연차가 정확히 맞고(또는 해당 직무에서 희소 스킬/도메인) 최근 성과 근거가 강하면, 연령 신호가 약화될 수 있습니다.";

    return {
      title: "나이(연차/레벨) 필터 리스크 가능성",
      why,
      action,
      counter,
      signals,
      meta: {
        age,
        band,
      },
    };
  },
};