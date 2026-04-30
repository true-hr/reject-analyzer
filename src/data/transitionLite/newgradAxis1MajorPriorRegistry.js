import { getJobOntologyItemById } from "../job/jobOntology.index.js";

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function normalizeMajorPriorKey(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}

const MAJOR = Object.freeze({
  COMPUTER_SCIENCE: "\ucef4\ud4e8\ud130\uacf5\ud559",
  SOFTWARE: "\uc18c\ud504\ud2b8\uc6e8\uc5b4",
  INDUSTRIAL_ENGINEERING: "\uc0b0\uc5c5\uacf5\ud559",
  ELECTRICAL_ELECTRONIC: "\uc804\uc790 / \uc804\uae30",
  OTHER_ENGINEERING: "\uae30\ud0c0 \uacf5\ud559",
  BUSINESS_ADMIN: "\uacbd\uc601\ud559",
  ECONOMICS: "\uacbd\uc81c\ud559",
  ACCOUNTING_TAX: "\ud68c\uacc4 / \uc138\ubb34",
  FINANCE: "\uae08\uc735",
  OTHER_BUSINESS: "\uae30\ud0c0 \uc0c1\uacbd",
  PSYCHOLOGY_COUNSELING: "\uc2ec\ub9ac / \uc0c1\ub2f4",
  MEDIA: "\uc5b8\ub860 / \ubbf8\ub514\uc5b4",
  PUBLIC_POLICY: "\ud589\uc815 / \uc815\ucc45",
  SOCIOLOGY: "\uc0ac\ud68c\ud559",
  OTHER_HUMANITIES: "\uae30\ud0c0 \uc778\ubb38\uc0ac\ud68c",
  VISUAL_DESIGN: "\uc2dc\uac01\ub514\uc790\uc778",
  USER_EXPERIENCE: "\uc0ac\uc6a9\uc790 \uacbd\ud5d8",
  VIDEO_CONTENT: "\uc601\uc0c1 / \ucf58\ud150\uce20",
  PR_AD: "\uad11\uace0 / \ud64d\ubcf4",
  OTHER_DESIGN: "\uae30\ud0c0 \ub514\uc790\uc778",
  DOUBLE_MAJOR: "\ubcf5\uc218\uc804\uacf5",
  CONVERGENCE_MAJOR: "\uc5f0\uacc4\uc804\uacf5",
  UNDECLARED_OTHER: "\uc804\uacf5 \ubbf8\uc815 / \uae30\ud0c0",
  MATH_STATISTICS: "\uc218\ud559 / \ud1b5\uacc4",
  LAW: "\ubc95\ud559",
  BIO_LIFE_SCIENCE: "\uc0dd\uba85\uacfc\ud559 / \ubc14\uc774\uc624",
  PHARMACY: "\uc57d\ud559 / \uc81c\uc57d",
  CHEMISTRY_CHEMICAL_ENGINEERING: "\ud654\ud559 / \ud654\ud559\uacf5\ud559",
  ENVIRONMENT_SAFETY: "\ud658\uacbd / \uc548\uc804\uacf5\ud559",
  ARCHITECTURE_CIVIL: "\uac74\ucd95 / \ud1a0\ubaa9",
  MATERIALS_SCIENCE: "\uc7ac\ub8cc / \uc2e0\uc18c\uc7ac\uacf5\ud559",
});

const JOB_MAJOR_KEYS = Object.freeze([
  "BUSINESS",
  "SALES",
  "MARKETING",
  "CUSTOMER_OPERATIONS",
  "HR_ORGANIZATION",
  "FINANCE_ACCOUNTING",
  "PROCUREMENT_SCM",
  "MANUFACTURING_QUALITY_PRODUCTION",
  "ENGINEERING_DEVELOPMENT",
  "IT_DATA_DIGITAL",
  "DESIGN",
  "RESEARCH_PROFESSIONAL",
  "EDUCATION_COUNSELING_COACHING",
  "PUBLIC_ADMINISTRATION_SUPPORT",
]);

const ALL_WEAK_PRIOR_MAP = Object.freeze(
  JOB_MAJOR_KEYS.reduce((acc, key) => {
    acc[key] = 1;
    return acc;
  }, {})
);

function makeBaseEntry(map) {
  return Object.freeze(map);
}

const _MATH_STATISTICS_BASE = makeBaseEntry({
  BUSINESS: 1, SALES: 0, MARKETING: 2, CUSTOMER_OPERATIONS: 0, HR_ORGANIZATION: 1,
  FINANCE_ACCOUNTING: 2, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 1,
  ENGINEERING_DEVELOPMENT: 1, IT_DATA_DIGITAL: 3, DESIGN: 0, RESEARCH_PROFESSIONAL: 2,
  EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 1,
});

const _LAW_BASE = makeBaseEntry({
  BUSINESS: 1, SALES: 0, MARKETING: 0, CUSTOMER_OPERATIONS: 0, HR_ORGANIZATION: 2,
  FINANCE_ACCOUNTING: 2, PROCUREMENT_SCM: 0, MANUFACTURING_QUALITY_PRODUCTION: 0,
  ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 0, DESIGN: 0, RESEARCH_PROFESSIONAL: 3,
  EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 2,
});

const _BIO_LIFE_SCIENCE_BASE = makeBaseEntry({
  BUSINESS: 1, SALES: 0, MARKETING: 1, CUSTOMER_OPERATIONS: 0, HR_ORGANIZATION: 0,
  FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 2,
  ENGINEERING_DEVELOPMENT: 2, IT_DATA_DIGITAL: 1, DESIGN: 0, RESEARCH_PROFESSIONAL: 2,
  EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 1,
});

const _PHARMACY_BASE = makeBaseEntry({
  BUSINESS: 1, SALES: 0, MARKETING: 1, CUSTOMER_OPERATIONS: 0, HR_ORGANIZATION: 0,
  FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 2,
  ENGINEERING_DEVELOPMENT: 1, IT_DATA_DIGITAL: 0, DESIGN: 0, RESEARCH_PROFESSIONAL: 2,
  EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 1,
});

const _CHEMISTRY_CHEMICAL_ENGINEERING_BASE = makeBaseEntry({
  BUSINESS: 1, SALES: 0, MARKETING: 1, CUSTOMER_OPERATIONS: 0, HR_ORGANIZATION: 0,
  FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 2,
  ENGINEERING_DEVELOPMENT: 2, IT_DATA_DIGITAL: 0, DESIGN: 0, RESEARCH_PROFESSIONAL: 2,
  EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 1,
});

const _ENVIRONMENT_SAFETY_BASE = makeBaseEntry({
  BUSINESS: 1, SALES: 0, MARKETING: 0, CUSTOMER_OPERATIONS: 0, HR_ORGANIZATION: 0,
  FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 2,
  ENGINEERING_DEVELOPMENT: 1, IT_DATA_DIGITAL: 0, DESIGN: 0, RESEARCH_PROFESSIONAL: 1,
  EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 2,
});

const _ARCHITECTURE_CIVIL_BASE = makeBaseEntry({
  BUSINESS: 1, SALES: 0, MARKETING: 0, CUSTOMER_OPERATIONS: 0, HR_ORGANIZATION: 0,
  FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 1,
  ENGINEERING_DEVELOPMENT: 1, IT_DATA_DIGITAL: 0, DESIGN: 0, RESEARCH_PROFESSIONAL: 1,
  EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 2,
});

const _MATERIALS_SCIENCE_BASE = makeBaseEntry({
  BUSINESS: 1, SALES: 0, MARKETING: 1, CUSTOMER_OPERATIONS: 0, HR_ORGANIZATION: 0,
  FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 2,
  ENGINEERING_DEVELOPMENT: 2, IT_DATA_DIGITAL: 0, DESIGN: 0, RESEARCH_PROFESSIONAL: 2,
  EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 1,
});

const AXIS1_MAJOR_PRIOR_BASE = Object.freeze({
  [normalizeMajorPriorKey(MAJOR.COMPUTER_SCIENCE)]: makeBaseEntry({
    BUSINESS: 1, SALES: 1, MARKETING: 1, CUSTOMER_OPERATIONS: 1, HR_ORGANIZATION: 0,
    FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 2, IT_DATA_DIGITAL: 3, DESIGN: 1, RESEARCH_PROFESSIONAL: 2,
    EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 0,
  }),
  [normalizeMajorPriorKey(MAJOR.SOFTWARE)]: makeBaseEntry({
    BUSINESS: 1, SALES: 1, MARKETING: 1, CUSTOMER_OPERATIONS: 1, HR_ORGANIZATION: 0,
    FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 2, IT_DATA_DIGITAL: 3, DESIGN: 1, RESEARCH_PROFESSIONAL: 2,
    EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 0,
  }),
  [normalizeMajorPriorKey(MAJOR.INDUSTRIAL_ENGINEERING)]: makeBaseEntry({
    BUSINESS: 3, SALES: 1, MARKETING: 1, CUSTOMER_OPERATIONS: 2, HR_ORGANIZATION: 1,
    FINANCE_ACCOUNTING: 1, PROCUREMENT_SCM: 3, MANUFACTURING_QUALITY_PRODUCTION: 3,
    ENGINEERING_DEVELOPMENT: 2, IT_DATA_DIGITAL: 2, DESIGN: 0, RESEARCH_PROFESSIONAL: 2,
    EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.ELECTRICAL_ELECTRONIC)]: makeBaseEntry({
    BUSINESS: 1, SALES: 2, MARKETING: 0, CUSTOMER_OPERATIONS: 1, HR_ORGANIZATION: 0,
    FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 2,
    ENGINEERING_DEVELOPMENT: 3, IT_DATA_DIGITAL: 2, DESIGN: 0, RESEARCH_PROFESSIONAL: 2,
    EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 0,
  }),
  [normalizeMajorPriorKey(MAJOR.OTHER_ENGINEERING)]: makeBaseEntry({
    BUSINESS: 1, SALES: 1, MARKETING: 0, CUSTOMER_OPERATIONS: 1, HR_ORGANIZATION: 0,
    FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 2,
    ENGINEERING_DEVELOPMENT: 3, IT_DATA_DIGITAL: 1, DESIGN: 0, RESEARCH_PROFESSIONAL: 2,
    EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 0,
  }),
  [normalizeMajorPriorKey(MAJOR.BUSINESS_ADMIN)]: makeBaseEntry({
    BUSINESS: 3, SALES: 2, MARKETING: 3, CUSTOMER_OPERATIONS: 2, HR_ORGANIZATION: 2,
    FINANCE_ACCOUNTING: 2, PROCUREMENT_SCM: 2, MANUFACTURING_QUALITY_PRODUCTION: 1,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 1, DESIGN: 0, RESEARCH_PROFESSIONAL: 2,
    EDUCATION_COUNSELING_COACHING: 1, PUBLIC_ADMINISTRATION_SUPPORT: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.ECONOMICS)]: makeBaseEntry({
    BUSINESS: 2, SALES: 1, MARKETING: 2, CUSTOMER_OPERATIONS: 1, HR_ORGANIZATION: 1,
    FINANCE_ACCOUNTING: 3, PROCUREMENT_SCM: 2, MANUFACTURING_QUALITY_PRODUCTION: 1,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 2, DESIGN: 0, RESEARCH_PROFESSIONAL: 2,
    EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 2,
  }),
  [normalizeMajorPriorKey(MAJOR.ACCOUNTING_TAX)]: makeBaseEntry({
    BUSINESS: 1, SALES: 0, MARKETING: 0, CUSTOMER_OPERATIONS: 1, HR_ORGANIZATION: 0,
    FINANCE_ACCOUNTING: 3, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 1, DESIGN: 0, RESEARCH_PROFESSIONAL: 1,
    EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.FINANCE)]: makeBaseEntry({
    BUSINESS: 1, SALES: 1, MARKETING: 1, CUSTOMER_OPERATIONS: 1, HR_ORGANIZATION: 0,
    FINANCE_ACCOUNTING: 3, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 1, DESIGN: 0, RESEARCH_PROFESSIONAL: 2,
    EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.OTHER_BUSINESS)]: makeBaseEntry({
    BUSINESS: 2, SALES: 1, MARKETING: 2, CUSTOMER_OPERATIONS: 1, HR_ORGANIZATION: 1,
    FINANCE_ACCOUNTING: 2, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 1, DESIGN: 0, RESEARCH_PROFESSIONAL: 1,
    EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.PSYCHOLOGY_COUNSELING)]: makeBaseEntry({
    BUSINESS: 1, SALES: 1, MARKETING: 1, CUSTOMER_OPERATIONS: 2, HR_ORGANIZATION: 3,
    FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 0, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 0, DESIGN: 0, RESEARCH_PROFESSIONAL: 2,
    EDUCATION_COUNSELING_COACHING: 3, PUBLIC_ADMINISTRATION_SUPPORT: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.MEDIA)]: makeBaseEntry({
    BUSINESS: 1, SALES: 1, MARKETING: 3, CUSTOMER_OPERATIONS: 2, HR_ORGANIZATION: 1,
    FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 0, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 1, DESIGN: 2, RESEARCH_PROFESSIONAL: 2,
    EDUCATION_COUNSELING_COACHING: 1, PUBLIC_ADMINISTRATION_SUPPORT: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.PUBLIC_POLICY)]: makeBaseEntry({
    BUSINESS: 2, SALES: 0, MARKETING: 1, CUSTOMER_OPERATIONS: 2, HR_ORGANIZATION: 2,
    FINANCE_ACCOUNTING: 1, PROCUREMENT_SCM: 1, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 0, DESIGN: 0, RESEARCH_PROFESSIONAL: 3,
    EDUCATION_COUNSELING_COACHING: 1, PUBLIC_ADMINISTRATION_SUPPORT: 3,
  }),
  [normalizeMajorPriorKey(MAJOR.SOCIOLOGY)]: makeBaseEntry({
    BUSINESS: 1, SALES: 1, MARKETING: 2, CUSTOMER_OPERATIONS: 2, HR_ORGANIZATION: 2,
    FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 0, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 1, DESIGN: 0, RESEARCH_PROFESSIONAL: 2,
    EDUCATION_COUNSELING_COACHING: 2, PUBLIC_ADMINISTRATION_SUPPORT: 2,
  }),
  [normalizeMajorPriorKey(MAJOR.OTHER_HUMANITIES)]: makeBaseEntry({
    BUSINESS: 1, SALES: 1, MARKETING: 1, CUSTOMER_OPERATIONS: 1, HR_ORGANIZATION: 1,
    FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 0, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 0, DESIGN: 0, RESEARCH_PROFESSIONAL: 1,
    EDUCATION_COUNSELING_COACHING: 1, PUBLIC_ADMINISTRATION_SUPPORT: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.VISUAL_DESIGN)]: makeBaseEntry({
    BUSINESS: 0, SALES: 0, MARKETING: 2, CUSTOMER_OPERATIONS: 0, HR_ORGANIZATION: 0,
    FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 0, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 1, DESIGN: 3, RESEARCH_PROFESSIONAL: 1,
    EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 0,
  }),
  [normalizeMajorPriorKey(MAJOR.USER_EXPERIENCE)]: makeBaseEntry({
    BUSINESS: 1, SALES: 0, MARKETING: 2, CUSTOMER_OPERATIONS: 1, HR_ORGANIZATION: 0,
    FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 0, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 2, DESIGN: 3, RESEARCH_PROFESSIONAL: 1,
    EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 0,
  }),
  [normalizeMajorPriorKey(MAJOR.VIDEO_CONTENT)]: makeBaseEntry({
    BUSINESS: 0, SALES: 0, MARKETING: 3, CUSTOMER_OPERATIONS: 1, HR_ORGANIZATION: 0,
    FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 0, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 1, DESIGN: 2, RESEARCH_PROFESSIONAL: 1,
    EDUCATION_COUNSELING_COACHING: 1, PUBLIC_ADMINISTRATION_SUPPORT: 0,
  }),
  [normalizeMajorPriorKey(MAJOR.PR_AD)]: makeBaseEntry({
    BUSINESS: 1, SALES: 1, MARKETING: 3, CUSTOMER_OPERATIONS: 1, HR_ORGANIZATION: 0,
    FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 0, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 1, DESIGN: 2, RESEARCH_PROFESSIONAL: 1,
    EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.OTHER_DESIGN)]: makeBaseEntry({
    BUSINESS: 0, SALES: 0, MARKETING: 1, CUSTOMER_OPERATIONS: 0, HR_ORGANIZATION: 0,
    FINANCE_ACCOUNTING: 0, PROCUREMENT_SCM: 0, MANUFACTURING_QUALITY_PRODUCTION: 0,
    ENGINEERING_DEVELOPMENT: 0, IT_DATA_DIGITAL: 1, DESIGN: 2, RESEARCH_PROFESSIONAL: 0,
    EDUCATION_COUNSELING_COACHING: 0, PUBLIC_ADMINISTRATION_SUPPORT: 0,
  }),
  [normalizeMajorPriorKey(MAJOR.DOUBLE_MAJOR)]: ALL_WEAK_PRIOR_MAP,
  [normalizeMajorPriorKey(MAJOR.CONVERGENCE_MAJOR)]: ALL_WEAK_PRIOR_MAP,
  [normalizeMajorPriorKey(MAJOR.UNDECLARED_OTHER)]: ALL_WEAK_PRIOR_MAP,
  // MATH_STATISTICS canonical key and aliases
  [normalizeMajorPriorKey(MAJOR.MATH_STATISTICS)]: _MATH_STATISTICS_BASE,
  [normalizeMajorPriorKey("수학")]: _MATH_STATISTICS_BASE,
  [normalizeMajorPriorKey("통계학")]: _MATH_STATISTICS_BASE,
  [normalizeMajorPriorKey("응용통계")]: _MATH_STATISTICS_BASE,
  [normalizeMajorPriorKey("수리통계")]: _MATH_STATISTICS_BASE,
  [normalizeMajorPriorKey("데이터사이언스")]: _MATH_STATISTICS_BASE,
  [normalizeMajorPriorKey("데이터과학")]: _MATH_STATISTICS_BASE,
  [normalizeMajorPriorKey("빅데이터")]: _MATH_STATISTICS_BASE,
  [normalizeMajorPriorKey("인공지능")]: _MATH_STATISTICS_BASE,
  [normalizeMajorPriorKey("AI")]: _MATH_STATISTICS_BASE,
  [normalizeMajorPriorKey("계량경제")]: _MATH_STATISTICS_BASE,
  [normalizeMajorPriorKey("금융공학")]: _MATH_STATISTICS_BASE,
  // LAW canonical key and aliases
  [normalizeMajorPriorKey(MAJOR.LAW)]: _LAW_BASE,
  [normalizeMajorPriorKey("법률")]: _LAW_BASE,
  [normalizeMajorPriorKey("법무")]: _LAW_BASE,
  [normalizeMajorPriorKey("법학과")]: _LAW_BASE,
  [normalizeMajorPriorKey("지식재산")]: _LAW_BASE,
  [normalizeMajorPriorKey("지식재산학")]: _LAW_BASE,
  [normalizeMajorPriorKey("특허")]: _LAW_BASE,
  [normalizeMajorPriorKey("특허법")]: _LAW_BASE,
  [normalizeMajorPriorKey("국제법")]: _LAW_BASE,
  [normalizeMajorPriorKey("행정법")]: _LAW_BASE,
  [normalizeMajorPriorKey("기업법무")]: _LAW_BASE,
  [normalizeMajorPriorKey("컴플라이언스")]: _LAW_BASE,
  // BIO_LIFE_SCIENCE canonical key and aliases
  [normalizeMajorPriorKey(MAJOR.BIO_LIFE_SCIENCE)]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("생명과학")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("생물학")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("생명공학")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("바이오")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("바이오공학")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("바이오테크놀로지")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("분자생물학")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("미생물학")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("유전공학")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("생화학")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("생명시스템")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("생명정보학")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("바이오시스템")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("의생명과학")]: _BIO_LIFE_SCIENCE_BASE,
  [normalizeMajorPriorKey("의생명공학")]: _BIO_LIFE_SCIENCE_BASE,
  // PHARMACY canonical key and aliases
  [normalizeMajorPriorKey(MAJOR.PHARMACY)]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("약학")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("약학과")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("제약학")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("제약공학")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("제약산업학")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("임상약학")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("한약학")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("약과학")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("의약학")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("의약품")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("약무")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("약물학")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("약리학")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("독성학")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("의약품인허가")]: _PHARMACY_BASE,
  [normalizeMajorPriorKey("제약바이오")]: _PHARMACY_BASE,
  // CHEMISTRY_CHEMICAL_ENGINEERING canonical key and aliases
  [normalizeMajorPriorKey(MAJOR.CHEMISTRY_CHEMICAL_ENGINEERING)]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("화학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("화학과")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("응용화학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("공업화학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("화학공학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("화공")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("화공학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("화공생명공학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("생명화학공학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("고분자공학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("고분자")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("정밀화학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("유기화학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("무기화학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("분석화학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("물리화학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("재료화학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  [normalizeMajorPriorKey("나노화학")]: _CHEMISTRY_CHEMICAL_ENGINEERING_BASE,
  // ENVIRONMENT_SAFETY canonical key and aliases
  // Note: "환경" 단독은 환경경영/환경정책 등 비전공 입력과 충돌 위험으로 제외
  [normalizeMajorPriorKey(MAJOR.ENVIRONMENT_SAFETY)]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("환경공학")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("환경학")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("환경과학")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("환경보건")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("보건환경")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("환경안전")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("산업안전")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("안전공학")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("산업위생")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("안전보건")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("EHS")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("HSE")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("소방방재")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("방재공학")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("재난안전")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("대기환경")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("수질환경")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("폐기물")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("화학물질관리")]: _ENVIRONMENT_SAFETY_BASE,
  [normalizeMajorPriorKey("환경화학")]: _ENVIRONMENT_SAFETY_BASE,
  // ARCHITECTURE_CIVIL canonical key and aliases
  // Note: "건설" 단독은 회사명/프로젝트 경험 입력과 충돌 위험으로 제외
  // Note: "도시" 단독은 범위 과대로 제외
  [normalizeMajorPriorKey(MAJOR.ARCHITECTURE_CIVIL)]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("건축")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("건축학")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("건축학과")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("건축공학")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("건축설계")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("실내건축")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("토목")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("토목공학")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("건설공학")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("건설환경공학")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("도시공학")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("도시계획")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("도시설계")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("교통공학")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("조경학")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("조경")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("공간정보")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("지리정보")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("GIS")]: _ARCHITECTURE_CIVIL_BASE,
  [normalizeMajorPriorKey("인프라공학")]: _ARCHITECTURE_CIVIL_BASE,
  // MATERIALS_SCIENCE canonical key and aliases
  // Note: 고분자공학/재료화학/나노화학은 CHEMISTRY alias에 이미 귀속 — 이번 라운드에서 소유권 이동 없음
  // Note: 반도체공학은 ELECTRICAL_ELECTRONIC 또는 별도 SEMICONDUCTOR 후보와 충돌 가능성으로 제외
  // Note: 배터리/이차전지/에너지공학은 추후 별도 전공 후보 — "소재" 포함 alias만 허용
  [normalizeMajorPriorKey(MAJOR.MATERIALS_SCIENCE)]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("재료공학")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("재료과학")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("신소재공학")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("신소재")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("소재공학")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("금속공학")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("금속재료")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("세라믹공학")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("세라믹")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("나노소재")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("반도체소재")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("전자재료")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("에너지소재")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("배터리소재")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("이차전지소재")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("복합재료")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("재료물성")]: _MATERIALS_SCIENCE_BASE,
  [normalizeMajorPriorKey("소재화학")]: _MATERIALS_SCIENCE_BASE,
});

const AXIS1_MAJOR_PRIOR_OVERRIDE = Object.freeze({
  [normalizeMajorPriorKey(MAJOR.INDUSTRIAL_ENGINEERING)]: Object.freeze({
    PROJECT_MANAGEMENT: 1,
    OPERATIONS_MANAGEMENT: 1,
    SCM: 1,
    DEMAND_SUPPLY_PLANNING: 1,
    DATA_ANALYSIS: 1,
    IT_PLANNING: 1,
    PRODUCTION_MANAGEMENT: 1,
    MANUFACTURING_INNOVATION: 1,
    INVENTORY_MANAGEMENT: 1,
    LOGISTICS: 1,
    OPERATION_PLANNING: 1,
    QUALITY_OPERATIONS: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.PSYCHOLOGY_COUNSELING)]: Object.freeze({
    RECRUITING: 1,
    LEARNING_OD: 1,
    CAREER_COUNSELING: 1,
    CAREER_COACHING: 1,
    CUSTOMER_SUPPORT_CS: 1,
    CUSTOMER_SUCCESS: 1,
    CORPORATE_TRAINING: 1,
    JOB_TRAINING: 1,
    LEARNING_DESIGN: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.MEDIA)]: Object.freeze({
    CONTENT_MARKETING: 1,
    PR_COMMUNICATIONS: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.ELECTRICAL_ELECTRONIC)]: Object.freeze({
    TECHNICAL_SALES: 1,
    SOLUTION_SALES: 1,
    CIRCUIT_DESIGN: 1,
    EMBEDDED_DEVELOPMENT: 1,
    SYSTEMS_ENGINEERING: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.OTHER_ENGINEERING)]: Object.freeze({
    TECHNICAL_SALES: 1,
    MECHANICAL_DESIGN: 1,
    TESTING_VALIDATION: 1,
    TECHNICAL_SUPPORT_FIELD_ENGINEERING: 1,
    PRODUCTION_ENGINEERING: 1,
    PROCESS_ENGINEERING: 1,
    QUALITY_CONTROL: 1,
    QUALITY_ASSURANCE_QA: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.BUSINESS_ADMIN)]: Object.freeze({
    CRM_MARKETING: 1,
    PRODUCT_MARKETING_PMM: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.ECONOMICS)]: Object.freeze({
    FP_AND_A: 1,
    FINANCE: 1,
    TREASURY: 1,
    MARKET_INDUSTRY_RESEARCH: 1,
    CONSULTING: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.ACCOUNTING_TAX)]: Object.freeze({
    ACCOUNTING: 1,
    TAX: 1,
    INTERNAL_CONTROL: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.FINANCE)]: Object.freeze({
    TREASURY: 1,
    IR_DISCLOSURE: 1,
    FINANCE: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.PUBLIC_POLICY)]: Object.freeze({
    ADMINISTRATION: 1,
    POLICY_SUPPORT: 1,
    PUBLIC_PROGRAM_OPERATIONS: 1,
    EXTERNAL_RELATIONS: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.VISUAL_DESIGN)]: Object.freeze({
    GRAPHIC_DESIGN: 1,
    BX_BRAND_DESIGN: 1,
    CONTENT_DESIGN: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.USER_EXPERIENCE)]: Object.freeze({
    UX_DESIGN: 1,
    PRODUCT_DESIGN: 1,
    UI_DESIGN: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.VIDEO_CONTENT)]: Object.freeze({
    MOTION_DESIGN: 1,
    CONTENT_DESIGN: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.PR_AD)]: Object.freeze({
    BRAND_MARKETING: 1,
    PR_COMMUNICATIONS: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.COMPUTER_SCIENCE)]: Object.freeze({
    FRONTEND_DEVELOPMENT: 1,
    BACKEND_DEVELOPMENT: 1,
    FULLSTACK_DEVELOPMENT: 1,
    MOBILE_DEVELOPMENT: 1,
    DATA_ENGINEERING: 1,
    DEVOPS_INFRA: 1,
    SECURITY: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.SOFTWARE)]: Object.freeze({
    FRONTEND_DEVELOPMENT: 1,
    BACKEND_DEVELOPMENT: 1,
    FULLSTACK_DEVELOPMENT: 1,
    MOBILE_DEVELOPMENT: 1,
    DATA_ENGINEERING: 1,
    DEVOPS_INFRA: 1,
    SECURITY: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.MATH_STATISTICS)]: Object.freeze({
    FP_AND_A: 1,
    FINANCE: 1,
    MARKET_INDUSTRY_RESEARCH: 1,
    CONSULTING: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.LAW)]: Object.freeze({
    LEGAL: 1,
    PATENT_INTELLECTUAL_PROPERTY: 1,
    REGULATORY_AFFAIRS: 1,
    INTERNAL_CONTROL: 1,
    LABOR_RELATIONS: 1,
    POLICY_RESEARCH: 1,
    EXTERNAL_RELATIONS: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.BIO_LIFE_SCIENCE)]: Object.freeze({
    TECHNICAL_RESEARCH: 1,
    RESEARCH_AND_DEVELOPMENT: 1,
    QUALITY_CONTROL: 1,
    QUALITY_ASSURANCE_QA: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.PHARMACY)]: Object.freeze({
    REGULATORY_AFFAIRS: 1,
    QUALITY_ASSURANCE_QA: 1,
    QUALITY_CONTROL: 1,
    EXPERT_REVIEW_EVALUATION: 1,
    TECHNICAL_RESEARCH: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.CHEMISTRY_CHEMICAL_ENGINEERING)]: Object.freeze({
    PROCESS_ENGINEERING: 1,
    PRODUCTION_ENGINEERING: 1,
    QUALITY_CONTROL: 1,
    RESEARCH_AND_DEVELOPMENT: 1,
    TECHNICAL_RESEARCH: 1,
    QUALITY_ASSURANCE_QA: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.ENVIRONMENT_SAFETY)]: Object.freeze({
    ENVIRONMENT_HEALTH_SAFETY: 1,
    REGULATORY_AFFAIRS: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.ARCHITECTURE_CIVIL)]: Object.freeze({
    PROJECT_MANAGEMENT: 1,
    TECHNICAL_SUPPORT_FIELD_ENGINEERING: 1,
    PROCUREMENT: 1,
    STRATEGIC_SOURCING: 1,
    SUPPLIER_VENDOR_MANAGEMENT: 1,
  }),
  [normalizeMajorPriorKey(MAJOR.MATERIALS_SCIENCE)]: Object.freeze({
    RESEARCH_AND_DEVELOPMENT: 1,
    TECHNICAL_RESEARCH: 1,
    QUALITY_CONTROL: 1,
    QUALITY_ASSURANCE_QA: 1,
    TECHNICAL_SUPPORT_FIELD_ENGINEERING: 1,
  }),
});

// High-frequency exception corrections: narrow majorCategory-level +1 adjustments
// for combinations that are consistently under-scored by the base matrix.
// Rule: boost = Math.max(override, exceptionAdjustment) — no stacking, max +1.
const AXIS1_MAJOR_PRIOR_EXCEPTION_ADJUSTMENTS = Object.freeze({
  [normalizeMajorPriorKey(MAJOR.COMPUTER_SCIENCE)]: Object.freeze({ BUSINESS: 1 }),
  [normalizeMajorPriorKey(MAJOR.SOFTWARE)]:         Object.freeze({ BUSINESS: 1 }),
  [normalizeMajorPriorKey(MAJOR.BUSINESS_ADMIN)]:   Object.freeze({ IT_DATA_DIGITAL: 1 }),
  [normalizeMajorPriorKey(MAJOR.ECONOMICS)]:        Object.freeze({ SALES: 1 }),
  [normalizeMajorPriorKey(MAJOR.FINANCE)]:          Object.freeze({ SALES: 1 }),
});

function resolveTargetJobContext(targetJobId) {
  const item = getJobOntologyItemById(toStr(targetJobId));
  if (!item) {
    return { item: null, majorCategory: "", subcategory: "" };
  }
  return {
    item,
    majorCategory: toStr(item.majorCategory).toUpperCase(),
    subcategory: toStr(item.subcategory).toUpperCase(),
  };
}

function toPriorLabel(score) {
  if (score >= 3) return "direct";
  if (score === 2) return "adjacent";
  if (score === 1) return "weak";
  return "mismatch";
}

export function resolveNewgradAxis1MajorPrior(targetJobId, majorText) {
  const safeMajorText = toStr(majorText);
  if (!safeMajorText) {
    return {
      base: 0,
      override: 0,
      exceptionAdjustment: 0,
      final: 0,
      label: "none",
      majorKey: "",
      selectedMajorKey: "",
      comparedMajorKeys: [],
      targetMajorCategory: "",
      targetSubcategory: "",
      matched: false,
      resolutionMode: "no_major",
      matchedBy: "none",
    };
  }

  const { majorCategory, subcategory } = resolveTargetJobContext(targetJobId);
  const normalizedKey = normalizeMajorPriorKey(safeMajorText);
  const baseMap = AXIS1_MAJOR_PRIOR_BASE[normalizedKey] || null;
  const base = majorCategory ? Number(baseMap?.[majorCategory]) : 1;
  const safeBase = Number.isFinite(base) ? base : 1;
  const overrideMap = AXIS1_MAJOR_PRIOR_OVERRIDE[normalizedKey] || null;
  const override = Number(overrideMap?.[subcategory] || 0);
  const exceptionMap = AXIS1_MAJOR_PRIOR_EXCEPTION_ADJUSTMENTS[normalizedKey] || null;
  const exceptionAdjustment = Number(exceptionMap?.[majorCategory] || 0);
  // No stacking: take the larger of override or exceptionAdjustment, not both
  const boost = Math.max(override, exceptionAdjustment);
  const final = Math.max(0, Math.min(3, safeBase + boost));

  const resolutionMode = !baseMap ? "unknown_major_fallback" : "single";
  const matchedBy = !baseMap ? "fallback"
    : boost <= 0 ? "base"
    : override >= exceptionAdjustment ? "override"
    : "exception";

  return {
    base: safeBase,
    override,
    exceptionAdjustment,
    final,
    label: toPriorLabel(final),
    majorKey: normalizedKey,
    selectedMajorKey: normalizedKey,
    comparedMajorKeys: [],
    targetMajorCategory: majorCategory,
    targetSubcategory: subcategory,
    matched: Boolean(baseMap),
    resolutionMode,
    matchedBy,
  };
}

// Infrastructure-only: resolves multiple major candidates and picks the best prior.
// Active callsite not yet wired (payload has single major field).
// Tie-breaker: 1) boost-applied > none, 2) higher final, 3) higher base, 4) first major.
export function resolveNewgradAxis1MajorPriorBest(majorCandidates, targetJobId) {
  if (!Array.isArray(majorCandidates) || majorCandidates.length === 0) {
    return resolveNewgradAxis1MajorPrior(targetJobId, "");
  }
  if (majorCandidates.length === 1) {
    return resolveNewgradAxis1MajorPrior(targetJobId, majorCandidates[0]);
  }

  const resolved = majorCandidates.map((m) =>
    resolveNewgradAxis1MajorPrior(targetJobId, m)
  );

  let best = resolved[0];
  for (let i = 1; i < resolved.length; i++) {
    const challenger = resolved[i];
    const bestHasBoost = best.override > 0 || best.exceptionAdjustment > 0;
    const chalHasBoost = challenger.override > 0 || challenger.exceptionAdjustment > 0;
    if (chalHasBoost && !bestHasBoost) { best = challenger; continue; }
    if (bestHasBoost && !chalHasBoost) { continue; }
    if (challenger.final > best.final) { best = challenger; continue; }
    if (challenger.base > best.base) { best = challenger; continue; }
  }

  return {
    ...best,
    resolutionMode: "double_major",
    comparedMajorKeys: resolved.map((r) => r.majorKey),
  };
}

export default resolveNewgradAxis1MajorPrior;
