const HIGH_CONFIDENCE_THRESHOLD = 0.8;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.6;

const RENTAL_BLOCKED_TOKENS = ["임대", "렌탈", "리스"];
const AS_BLOCKED_TOKENS = ["as", "서비스", "정비"];
const FACILITY_BLOCKED_TOKENS = ["용역", "경비", "관리"];

const RENTAL_REAL_ESTATE_KEYWORDS = [
  "부동산임대",
  "임대관리",
  "상가임대",
  "오피스임대",
  "건물임대",
  "오피스텔임대",
  "자산임대",
  "commercial property",
  "property lease",
  "lease management",
];

const RENTAL_CONSUMER_KEYWORDS = [
  "정수기렌탈",
  "가전렌탈",
  "공기청정기렌탈",
  "생활가전렌탈",
  "구독렌탈",
  "렌탈서비스",
  "appliance rental",
  "subscription rental",
];

const RENTAL_EQUIPMENT_KEYWORDS = [
  "건설장비렌탈",
  "중장비렌탈",
  "지게차렌탈",
  "산업장비렌탈",
  "법인장비렌탈",
  "장비리스",
  "equipment rental",
];

const AUTO_SERVICE_KEYWORDS = [
  "카센터",
  "자동차정비",
  "자동차수리",
  "차량수리",
  "차량점검",
  "오토서비스",
  "타이어교환",
  "판금도색",
  "auto repair",
  "car service",
];

const FUEL_RETAIL_KEYWORDS = [
  "주유소",
  "주유운영",
  "연료소매",
  "에너지소매",
  "fuel retail",
  "gas station",
  "주유망",
  "gs칼텍스",
  "sk에너지",
  "s-oil",
  "hd현대오일뱅크",
];

const MANUFACTURER_AS_KEYWORDS = [
  "공식서비스센터",
  "서비스센터",
  "공식서비스",
  "제조사as",
  "가전as센터",
  "자동차as센터",
  "after-sales센터",
  "service center",
  "official service",
];

const AUTOMOTIVE_CONTEXT_KEYWORDS = [
  "자동차",
  "차량",
  "모빌리티",
  "타이어",
  "정비",
  "car",
  "auto",
];

const ELECTRONICS_CONTEXT_KEYWORDS = [
  "가전",
  "전자",
  "디바이스",
  "appliance",
  "electronics",
];

const FACILITY_MANAGEMENT_KEYWORDS = [
  "시설관리",
  "건물관리",
  "fm",
  "빌딩관리",
  "빌딩운영",
  "시설운영",
  "설비관리",
  "건물운영",
  "facility management",
  "building operations",
];

const SECURITY_GUARDING_KEYWORDS = [
  "경비서비스",
  "보안경비",
  "경비업",
  "출입통제",
  "물리보안",
  "경호서비스",
  "시큐리티서비스",
  "청원경찰",
  "guarding service",
  "physical security",
];

const OUTSOURCING_KEYWORDS = [
  "청소용역",
  "환경미화용역",
  "주차관리용역",
  "운영위탁용역",
  "managed service",
  "outsourced operations",
];

function normalizeForMatch(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[·•ㆍ]/g, "")
    .replace(/[\s/()[\]{}.,:;'"!?&+_-]+/g, "");
}

export function normalizeCompoundText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
}

export function scoreCandidate(base, bonuses = [], penalties = []) {
  const total = [base, ...bonuses].reduce((sum, value) => sum + Number(value || 0), 0);
  const deducted = penalties.reduce((sum, value) => sum + Number(value || 0), 0);
  return Math.max(0, Math.min(1, total - deducted));
}

function scoreToConfidence(score) {
  if (score >= HIGH_CONFIDENCE_THRESHOLD) return "high";
  if (score >= MEDIUM_CONFIDENCE_THRESHOLD) return "medium";
  return "low";
}

export function makeCandidate({ canonicalId, score, reasons, matchedKeywords, blockedBy }) {
  const roundedScore = Math.round(score * 100) / 100;
  const candidate = {
    canonicalId,
    score: roundedScore,
    confidence: scoreToConfidence(roundedScore),
    reasons: [...new Set((reasons || []).filter(Boolean))],
    matchedKeywords: [...new Set((matchedKeywords || []).filter(Boolean))],
  };

  if (blockedBy?.length) {
    candidate.blockedBy = [...new Set(blockedBy.filter(Boolean))];
  }

  return candidate;
}

function buildResolverContext(input = {}) {
  const rawLabel = normalizeCompoundText(input.rawLabel);
  const companyText = normalizeCompoundText(input.companyText);
  const preferredSector = normalizeCompoundText(input.preferredSector);
  const preferredSubSector = normalizeCompoundText(input.preferredSubSector);
  const currentJobId = normalizeCompoundText(input.currentJobId);
  const targetJobId = normalizeCompoundText(input.targetJobId);
  const searchableParts = [
    companyText,
    preferredSector,
    preferredSubSector,
    currentJobId,
    targetJobId,
  ].filter(Boolean);

  return {
    rawLabel,
    normalizedLabel: rawLabel,
    companyText,
    preferredSector,
    preferredSubSector,
    searchableText: searchableParts.join(" "),
    normalizedSearchText: normalizeForMatch(searchableParts.join(" ")),
  };
}

function collectBlockedTokens(rawLabel, blockedTokens) {
  const normalizedRaw = normalizeForMatch(rawLabel);

  return blockedTokens.filter((token) => normalizedRaw.includes(normalizeForMatch(token)));
}

function getMatchedKeywords(normalizedSearchText, keywords) {
  return keywords.filter((keyword) => normalizedSearchText.includes(normalizeForMatch(keyword)));
}

function hasKeyword(normalizedSearchText, keywords) {
  return getMatchedKeywords(normalizedSearchText, keywords).length > 0;
}

function hasSectorHint(preferredSector, preferredSubSector, expectedHints) {
  const sectorText = `${preferredSector} ${preferredSubSector}`;
  const normalized = normalizeForMatch(sectorText);
  return expectedHints.some((hint) => normalized.includes(normalizeForMatch(hint)));
}

function mergeCandidates(candidateGroups) {
  const merged = new Map();

  for (const candidate of candidateGroups.flat().filter(Boolean)) {
    const existing = merged.get(candidate.canonicalId);
    if (!existing || existing.score < candidate.score) {
      merged.set(candidate.canonicalId, candidate);
      continue;
    }

    existing.reasons = [...new Set([...existing.reasons, ...candidate.reasons])];
    existing.matchedKeywords = [...new Set([...existing.matchedKeywords, ...candidate.matchedKeywords])];
    if (candidate.blockedBy?.length) {
      existing.blockedBy = [...new Set([...(existing.blockedBy || []), ...candidate.blockedBy])];
    }
  }

  return [...merged.values()].sort((a, b) => b.score - a.score);
}

export function resolveRentalLeaseCandidates(input = {}) {
  const context = buildResolverContext(input);
  const blockedTokens = collectBlockedTokens(context.rawLabel, RENTAL_BLOCKED_TOKENS);
  const realEstateMatches = getMatchedKeywords(context.normalizedSearchText, RENTAL_REAL_ESTATE_KEYWORDS);
  const consumerMatches = getMatchedKeywords(context.normalizedSearchText, RENTAL_CONSUMER_KEYWORDS);
  const equipmentMatches = getMatchedKeywords(context.normalizedSearchText, RENTAL_EQUIPMENT_KEYWORDS);
  const candidates = [];

  if (realEstateMatches.length) {
    const base = realEstateMatches.length >= 2 ? 0.58 : 0.48;
    const bonuses = [
      realEstateMatches.length >= 2 ? 0.3 : 0.27,
      context.companyText ? 0.05 : 0,
      hasSectorHint(context.preferredSector, context.preferredSubSector, ["constructionrealestateinfra", "부동산", "임대", "자산"]) ? 0.1 : 0,
    ];
    const penalties = [
      consumerMatches.length ? 0.2 : 0,
      equipmentMatches.length ? 0.2 : 0,
    ];

    candidates.push(
      makeCandidate({
        canonicalId: "IND_CONSTRUCTION_REAL_ESTATE_INFRA_REAL_ESTATE_ASSET_MANAGEMENT",
        score: scoreCandidate(base, bonuses, penalties),
        reasons: [
          "부동산/상가/오피스/임대관리 단서가 확인됨",
          realEstateMatches.length >= 2 ? "부동산 임대 관련 강한 키워드가 2개 이상 매칭됨" : "부동산 임대 관련 강한 키워드가 매칭됨",
        ],
        matchedKeywords: realEstateMatches,
      })
    );
  }

  if (consumerMatches.length) {
    candidates.push(
      makeCandidate({
        canonicalId: "IND_LIFESTYLE_SERVICES_CONSUMER_RENTAL",
        score: scoreCandidate(
          0.35,
          [
            consumerMatches.length >= 2 ? 0.24 : 0.18,
            context.companyText ? 0.12 : 0,
            hasSectorHint(context.preferredSector, context.preferredSubSector, ["distributioncommerceconsumergoods", "consumer", "가전", "구독", "렌탈"]) ? 0.1 : 0,
          ],
          [realEstateMatches.length ? 0.2 : 0, equipmentMatches.length ? 0.15 : 0]
        ),
        reasons: [
          "렌탈/구독/가전 단서가 확인됨",
          "신규 leaf 필요 후보",
        ],
        matchedKeywords: consumerMatches,
        blockedBy: blockedTokens,
      })
    );
  }

  if (equipmentMatches.length) {
    candidates.push(
      makeCandidate({
        canonicalId: "IND_CONSTRUCTION_REAL_ESTATE_INFRA_EQUIPMENT_RENTAL_OPERATIONS",
        score: scoreCandidate(
          0.35,
          [
            equipmentMatches.length >= 2 ? 0.24 : 0.18,
            context.companyText ? 0.12 : 0,
            hasSectorHint(context.preferredSector, context.preferredSubSector, ["b2b", "industrial", "equipment", "장비", "렌탈"]) ? 0.1 : 0,
          ],
          [realEstateMatches.length ? 0.2 : 0, consumerMatches.length ? 0.15 : 0]
        ),
        reasons: [
          "건설/산업 장비 렌탈 단서가 확인됨",
          "신규 leaf 필요 후보",
        ],
        matchedKeywords: equipmentMatches,
        blockedBy: blockedTokens,
      })
    );
  }

  return {
    blockedTokens,
    candidates,
  };
}

export function resolveAsAutoFuelCandidates(input = {}) {
  const context = buildResolverContext(input);
  const blockedTokens = collectBlockedTokens(context.rawLabel, AS_BLOCKED_TOKENS);
  const autoMatches = getMatchedKeywords(context.normalizedSearchText, AUTO_SERVICE_KEYWORDS);
  const fuelMatches = getMatchedKeywords(context.normalizedSearchText, FUEL_RETAIL_KEYWORDS);
  const manufacturerMatches = getMatchedKeywords(context.normalizedSearchText, MANUFACTURER_AS_KEYWORDS);
  const automotiveContextMatches = getMatchedKeywords(context.normalizedSearchText, AUTOMOTIVE_CONTEXT_KEYWORDS);
  const electronicsContextMatches = getMatchedKeywords(context.normalizedSearchText, ELECTRONICS_CONTEXT_KEYWORDS);
  const candidates = [];

  if (autoMatches.length) {
    candidates.push(
      makeCandidate({
        canonicalId: "IND_LIFESTYLE_SERVICES_AUTO_SERVICE",
        score: scoreCandidate(
          0.4,
          [
            autoMatches.length >= 2 ? 0.28 : 0.22,
            context.companyText ? 0.12 : 0,
            hasSectorHint(context.preferredSector, context.preferredSubSector, ["manufacturing", "automotive", "모빌리티", "자동차"]) ? 0.08 : 0,
          ],
          [fuelMatches.length ? 0.2 : 0]
        ),
        reasons: [
          "자동차 정비/카센터 운영 단서가 확인됨",
          "신규 leaf 필요 후보",
        ],
        matchedKeywords: autoMatches,
        blockedBy: blockedTokens.includes("정비") && !automotiveContextMatches.length ? ["정비"] : [],
      })
    );
  }

  if (fuelMatches.length) {
    candidates.push(
      makeCandidate({
        canonicalId: "IND_ENERGY_ENVIRONMENT_PUBLIC_INFRA_FUEL_RETAIL_OPERATIONS",
        score: scoreCandidate(
          0.4,
          [
            fuelMatches.length >= 2 ? 0.28 : 0.22,
            context.companyText ? 0.12 : 0,
            hasSectorHint(context.preferredSector, context.preferredSubSector, ["energy", "fuel", "주유", "에너지"]) ? 0.08 : 0,
          ],
          [autoMatches.length ? 0.2 : 0]
        ),
        reasons: [
          "주유소/연료 소매 운영 단서가 확인됨",
          "신규 leaf 필요 후보",
        ],
        matchedKeywords: fuelMatches,
        blockedBy: blockedTokens,
      })
    );
  }

  if (manufacturerMatches.length) {
    const manufacturerBase = 0.32;
    const manufacturerBonuses = [
      manufacturerMatches.length >= 2 ? 0.2 : 0.14,
      context.companyText ? 0.08 : 0,
    ];

    if (automotiveContextMatches.length) {
      candidates.push(
        makeCandidate({
          canonicalId: "IND_MANUFACTURING_AUTOMOTIVE_MOBILITY",
          score: scoreCandidate(
            manufacturerBase,
            [
              ...manufacturerBonuses,
              automotiveContextMatches.length >= 2 ? 0.22 : 0.17,
              hasSectorHint(context.preferredSector, context.preferredSubSector, ["manufacturing", "automotive", "모빌리티", "자동차"]) ? 0.08 : 0,
            ],
            [fuelMatches.length ? 0.18 : 0]
          ),
          reasons: [
            "제조사 AS 단서와 자동차 업권 단서가 함께 확인됨",
          ],
          matchedKeywords: [...manufacturerMatches, ...automotiveContextMatches],
          blockedBy: blockedTokens,
        })
      );
    } else if (electronicsContextMatches.length) {
      candidates.push(
        makeCandidate({
          canonicalId: "IND_MANUFACTURING_ELECTRONICS_APPLIANCES",
          score: scoreCandidate(
            manufacturerBase,
            [
              ...manufacturerBonuses,
              electronicsContextMatches.length >= 2 ? 0.22 : 0.17,
              hasSectorHint(context.preferredSector, context.preferredSubSector, ["manufacturing", "electronics", "appliances", "전자", "가전"]) ? 0.08 : 0,
            ]
          ),
          reasons: [
            "제조사 AS 단서와 가전/전자 업권 단서가 함께 확인됨",
          ],
          matchedKeywords: [...manufacturerMatches, ...electronicsContextMatches],
          blockedBy: blockedTokens,
        })
      );
    } else {
      const lowScore = scoreCandidate(manufacturerBase, manufacturerBonuses, [0.06]);
      candidates.push(
        makeCandidate({
          canonicalId: "IND_MANUFACTURING_AUTOMOTIVE_MOBILITY",
          score: lowScore,
          reasons: [
            "제조사 AS 단서는 있으나 자동차/가전 업권 단서가 부족함",
          ],
          matchedKeywords: manufacturerMatches,
          blockedBy: ["업권 단서 부족"],
        }),
        makeCandidate({
          canonicalId: "IND_MANUFACTURING_ELECTRONICS_APPLIANCES",
          score: lowScore,
          reasons: [
            "제조사 AS 단서는 있으나 자동차/가전 업권 단서가 부족함",
          ],
          matchedKeywords: manufacturerMatches,
          blockedBy: ["업권 단서 부족"],
        })
      );
    }
  }

  return {
    blockedTokens,
    candidates,
  };
}

export function resolveFacilitySecurityOutsourcingCandidates(input = {}) {
  const context = buildResolverContext(input);
  const blockedTokens = collectBlockedTokens(context.rawLabel, FACILITY_BLOCKED_TOKENS);
  const facilityMatches = getMatchedKeywords(context.normalizedSearchText, FACILITY_MANAGEMENT_KEYWORDS);
  const securityMatches = getMatchedKeywords(context.normalizedSearchText, SECURITY_GUARDING_KEYWORDS);
  const outsourcingMatches = getMatchedKeywords(context.normalizedSearchText, OUTSOURCING_KEYWORDS);
  const candidates = [];

  if (facilityMatches.length) {
    candidates.push(
      makeCandidate({
        canonicalId: "IND_CONSTRUCTION_REAL_ESTATE_INFRA_FACILITY_MANAGEMENT_AND_OPERATIONS",
        score: scoreCandidate(
          0.48,
          [
            facilityMatches.length >= 2 ? 0.28 : 0.22,
            context.companyText ? 0.1 : 0,
            hasSectorHint(context.preferredSector, context.preferredSubSector, ["constructionrealestateinfra", "facility", "건물", "시설", "fm"]) ? 0.08 : 0,
          ],
          [securityMatches.length ? 0.18 : 0, outsourcingMatches.length ? 0.14 : 0]
        ),
        reasons: [
          "시설/빌딩/설비 운영 단서가 확인됨",
        ],
        matchedKeywords: facilityMatches,
      })
    );
  }

  if (securityMatches.length) {
    candidates.push(
      makeCandidate({
        canonicalId: "IND_PROFESSIONAL_B2B_SERVICES_SECURITY_GUARDING_SERVICES",
        score: scoreCandidate(
          0.4,
          [
            securityMatches.length >= 2 ? 0.25 : 0.2,
            context.companyText ? 0.1 : 0,
            hasSectorHint(context.preferredSector, context.preferredSubSector, ["security", "guard", "경비", "보안"]) ? 0.08 : 0,
          ],
          [facilityMatches.length ? 0.16 : 0, outsourcingMatches.length ? 0.12 : 0]
        ),
        reasons: [
          "경비/보안 운영 단서가 확인됨",
          "신규 leaf 필요 후보",
        ],
        matchedKeywords: securityMatches,
        blockedBy: blockedTokens,
      })
    );
  }

  if (outsourcingMatches.length) {
    candidates.push(
      makeCandidate({
        canonicalId: "IND_PROFESSIONAL_B2B_SERVICES_OUTSOURCING_OPERATIONS",
        score: scoreCandidate(
          0.42,
          [
            outsourcingMatches.length >= 2 ? 0.24 : 0.18,
            context.companyText ? 0.1 : 0,
            hasSectorHint(context.preferredSector, context.preferredSubSector, ["professionalb2bservices", "outsourcing", "용역", "운영대행"]) ? 0.08 : 0,
          ],
          [facilityMatches.length ? 0.12 : 0, securityMatches.length ? 0.12 : 0]
        ),
        reasons: [
          "용역/운영대행 단서가 확인됨",
        ],
        matchedKeywords: outsourcingMatches,
        blockedBy: blockedTokens,
      })
    );
  }

  return {
    blockedTokens,
    candidates,
  };
}

export function resolveCompoundIndustryCandidates(input = {}) {
  const context = buildResolverContext(input);
  const rentalResult = resolveRentalLeaseCandidates(input);
  const asResult = resolveAsAutoFuelCandidates(input);
  const facilityResult = resolveFacilitySecurityOutsourcingCandidates(input);
  const candidates = mergeCandidates([
    rentalResult.candidates,
    asResult.candidates,
    facilityResult.candidates,
  ]);
  const blockedTokens = [...new Set([
    ...rentalResult.blockedTokens,
    ...asResult.blockedTokens,
    ...facilityResult.blockedTokens,
  ])];

  return {
    mode: "ranked_candidates",
    rawLabel: context.rawLabel,
    normalizedLabel: context.normalizedLabel,
    candidates,
    blockedTokens,
    unresolved: candidates.length === 0,
  };
}
