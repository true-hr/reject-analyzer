// src/lib/decision/roleOntology/domainTextMap.js
// text-only domain family 추론용 최소 사전 v0
// 용도: analyzer [C2] 보조 — structured domain 없을 때만 fallback
// 원칙: 오탐보다 미탐 우선 — primary hit 1개 이상 있을 때만 known 처리

function _normDomain(v) {
  return String(v == null ? "" : v).toLowerCase().trim();
}

// --- DOMAIN_TEXT_MAP ---
// primary: 3점 (강한 도메인 특정어 — 2글자 이상 복합어 위주)
// secondary: 1점 (보조 신호 — 단독으로는 known 처리 안 됨)
// 판정 기준: 총점 >= 3 (primary hit 1개 이상 OR secondary 3개 이상)
export const DOMAIN_TEXT_MAP = {
  B2B_SAAS: {
    primary: [
      "b2b saas", "saas", "enterprise saas", "b2b 솔루션", "기업용 소프트웨어",
      "소프트웨어 구독", "saas 플랫폼", "b2b 플랫폼", "클라우드 소프트웨어",
    ],
    secondary: [
      "b2b", "솔루션 영업", "기업 고객", "클라우드 솔루션", "구독 모델",
    ],
  },
  RETAIL_COMMERCE: {
    primary: [
      "리테일", "이커머스", "온라인몰", "쇼핑몰", "오픈마켓",
      "커머스 플랫폼", "이커머스 플랫폼", "온라인 쇼핑", "이커머스 운영",
    ],
    secondary: [
      "커머스", "상품 기획", "md", "리테일 운영", "카탈로그 관리",
    ],
  },
  ENTERPRISE_SOLUTIONS: {
    primary: [
      "엔터프라이즈", "enterprise solutions", "기업고객 대상", "법인고객",
      "기업 대상 솔루션", "대기업 고객", "b2b 엔터프라이즈",
    ],
    secondary: [
      "enterprise", "법인", "기업 영업", "대기업", "si 사업",
    ],
  },
  CONSUMER_BRAND: {
    primary: [
      "소비재", "b2c 브랜드", "브랜드 마케팅", "consumer brand", "fmcg",
      "d2c", "b2c 마케팅", "소비자 브랜드",
    ],
    secondary: [
      "b2c", "소비자 마케팅", "브랜딩", "소비자 대상", "소비자 캠페인",
    ],
  },
};

// --- inferDomainTextFamily ---
// text에서 도메인 family를 보수적으로 추론한다.
// 반환: { family: string, hits: string[], confidence: number }
// - family: "B2B_SAAS" | "RETAIL_COMMERCE" | "ENTERPRISE_SOLUTIONS" | "CONSUMER_BRAND" | "UNKNOWN"
// - 총점 3 미만 → UNKNOWN (primary hit 없고 secondary만으로는 known 처리 안 함)
export function inferDomainTextFamily(text) {
  const t = _normDomain(text);
  if (!t) return { family: "UNKNOWN", hits: [], confidence: 0 };

  let bestFamily = "UNKNOWN";
  let bestScore = 0;
  let bestHits = [];

  for (const [family, { primary, secondary }] of Object.entries(DOMAIN_TEXT_MAP)) {
    let score = 0;
    const hits = [];

    for (const kw of primary) {
      const q = _normDomain(kw);
      if (q && t.includes(q)) {
        score += 3;
        hits.push(kw);
      }
    }
    for (const kw of secondary) {
      const q = _normDomain(kw);
      if (q && t.includes(q)) {
        score += 1;
        hits.push(kw);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestFamily = family;
      bestHits = hits;
    }
  }

  // 보수적 판정: 총점 3 미만이면 UNKNOWN
  if (bestScore < 3) {
    return { family: "UNKNOWN", hits: [], confidence: 0 };
  }

  return {
    family: bestFamily,
    hits: bestHits.slice(0, 6),
    confidence: Math.min(1, bestScore / 9),
  };
}
