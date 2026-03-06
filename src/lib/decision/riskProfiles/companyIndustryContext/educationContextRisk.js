// src/lib/decision/riskProfiles/companyIndustryContext/educationContextRisk.js
// 학력 배경 참고 신호 (비gate, 설명형 signal)
// - hard gate 아님. 점수 감점 최소화, 설명 문구 반영 중심.
// - 경력이 충분할수록 영향 약화.

const _EDU_RANK = { highschool: 1, college: 2, bachelor: 3, master: 4, phd: 5 };
const _EDU_LABEL = { highschool: "고졸", college: "전문대", bachelor: "학사", master: "석사", phd: "박사" };

function _getEduRank(level) {
  return _EDU_RANK[level] ?? 3; // 기본값: 학사
}

function _jdMentionsHighEdu(jd) {
  return /석사|박사|대학원|master|phd|mba/i.test(String(jd || ""));
}

// "우대"가 아닌 필수/조건 수준의 고학력 요구 표현만 감지
function _jdRequiresHighEdu(jd) {
  return /석사\s*(이상|필수|자격|요구|조건|졸업)|박사\s*(이상|필수|자격|요구|졸업)|대학원\s*(졸업|이상|필수|출신)|master.*required|phd.*required/i.test(String(jd || ""));
}

export const educationContextRisk = {
  id: "DOMAIN__EDUCATION_CONTEXT",

  group: "companyIndustryContext",

  layer: "domain",

  priority: 20,

  severityBase: 1.5,

  tags: ["education", "background"],

  when: (ctx) => {
    const level = ctx?.state?.career?.educationLevel;
    if (!level) return false;
    const rank = _getEduRank(level);
    // 고졸/전문대: 항상 참고 신호 표시
    if (rank < 3) return true;
    // 학사: JD에 석사/박사 필수 요구 시에만 (우대 표현은 제외)
    if (rank === 3 && _jdRequiresHighEdu(ctx?.state?.jd)) return true;
    // 석사: JD에 박사 필수 요구 시에만
    if (rank === 4 && /박사\s*(이상|필수|요구)|phd.*required/i.test(String(ctx?.state?.jd || ""))) return true;
    return false;
  },

  score: (ctx) => {
    const level = ctx?.state?.career?.educationLevel;
    const rank = _getEduRank(level);
    const totalYears = Number(ctx?.state?.career?.totalYears ?? 0);
    const jdHigh = _jdMentionsHighEdu(ctx?.state?.jd);
    const jdRequires = _jdRequiresHighEdu(ctx?.state?.jd);

    let base = 0;
    if (rank < 3 && jdRequires) base = 0.22; // 고졸/전문대 + 필수 고학력
    else if (rank < 3 && jdHigh) base = 0.14; // 고졸/전문대 + 우대 언급
    else if (rank < 3)           base = 0.10; // 고졸/전문대 (언급 없음)
    else if (rank === 3)         base = 0.12; // 학사 + JD 필수 석사
    else                         base = 0.08; // 석사 + JD 필수 박사

    // 경력 충분할수록 학력 영향 완화
    if (totalYears >= 10) base *= 0.45;
    else if (totalYears >= 7) base *= 0.60;
    else if (totalYears >= 5) base *= 0.75;

    return Math.round(base * 100) / 100;
  },

  explain: (ctx) => {
    const level = ctx?.state?.career?.educationLevel;
    const rank = _getEduRank(level);
    const label = _EDU_LABEL[level] || "학사";
    const totalYears = Number(ctx?.state?.career?.totalYears ?? 0);
    const jdHigh = _jdMentionsHighEdu(ctx?.state?.jd);
    const jdRequires = _jdRequiresHighEdu(ctx?.state?.jd);
    const jdPhd = /박사\s*(이상|필수|요구)|phd.*required/i.test(String(ctx?.state?.jd || ""));

    const why = [];
    const action = [];
    const counter = [];

    if (rank < 3 && jdRequires) {
      why.push(`JD에 석사/박사급 학력이 필수 조건으로 명시되어 있어, 최종 학력(${label})이 검토 포인트가 될 수 있어요.`);
    } else if (rank < 3 && jdHigh) {
      why.push(`JD에 석사/박사 우대 언급이 있어요. 최종 학력(${label})이 참고 포인트가 될 수 있어요.`);
    } else if (rank < 3) {
      why.push(`최종 학력(${label})이 해당 직무의 일반적인 기대 학력보다 낮을 수 있어요.`);
    } else if (rank === 3 && jdRequires) {
      why.push(`JD에 석사 이상이 필수 조건으로 명시되어 있어요. 학사 학위로도 도전 가능하지만 참고 포인트예요.`);
    } else if (rank === 4 && jdPhd) {
      why.push(`JD에 박사급 학력 필수 언급이 있어요. 석사 학위로도 충분히 경쟁력 있는 경우가 많아요.`);
    }

    if (totalYears >= 7) {
      counter.push(`경력 ${totalYears}년이 학력 이슈를 충분히 보완할 수 있어요.`);
    } else if (totalYears >= 5) {
      counter.push(`경력 ${totalYears}년이 학력 우려를 상당 부분 상쇄해요.`);
    }

    action.push("실무 성과·수치·임팩트를 구체적으로 기재해 학력 외 전문성을 보여주세요.");
    if (rank < 3) {
      action.push("포트폴리오·프로젝트·자격증 등 역량 증빙을 추가로 첨부하면 효과적이에요.");
    }

    return {
      title: "학력 배경 참고 신호",
      why,
      signals: [`최종 학력: ${label}`, jdRequires ? "JD 고학력 필수 명시" : jdHigh ? "JD 고학력 우대 언급" : null].filter(Boolean),
      action,
      counter,
    };
  },

  suppressIf: [],
};
