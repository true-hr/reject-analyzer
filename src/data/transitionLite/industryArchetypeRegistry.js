// Industry Archetype Registry - stores industry-specific guidance for Axis2 card 3
// Provides contextual guidance for "여러 번 접한 경험" (repeated industry exposure)

const INDUSTRY_ARCHETYPES = {
  securities_asset_management: {
    id: 'securities_asset_management',
    label: '증권/자산운용',
    contextKeywords: [
      '금융시장',
      '투자상품',
      '개인/기관 투자자',
      '운용사/증권사 리서치',
      '공시자료',
      '금융 규제',
      '투자자 보호',
      '시장 신뢰',
    ],
    repeatabilityEvidenceExamples: [
      '금융시장분석',
      '투자상품비교',
      '운용사리서치',
      '투자자성향분석',
      '공시자료검토',
      '금융규제이슈정리',
      '펀드/ETF/연금상품비교',
      '시장이슈정리',
    ],
    interviewPrepSuggestions: [
      '지원회사의 대표 상품(펀드, ETF, 랩) 특징 및 고객군 파악',
      '최근 금융시장 이슈(금리, 환율, 공시제도 개편 등)와 운용사의 대응 사례 조사',
      '투자자 커뮤니케이션 방식 비교(유튜브, 뉉스레터, 고객센터 등)',
    ],
    resumeNarrativeExample:
      '정책 전공에서 제도와 시장의 관계를 공부했고, 이후 자산운용업이 투자자 보호와 시장 신뢰를 기반으로 움직인다는 점에 관심을 갖게 되었으며, 최근에는 운용사 상품과 투자자 커뮤니케이션 방식을 비교해보고 있다',
    weakEvidenceText:
      '현재 입력에서는 증권/자산운용업과 연결될 수 있는 단서가 일부 보입니다. 다만 한 번의 관심이나 단편적인 입력인지, 여러 수업·프로젝트·자격·리서치에서 반복적으로 다룬 관심사인지는 아직 강하게 드러나지 않습니다.',
    moderateEvidenceText:
      '현재 입력에서는 증권/자산운용업을 한 번의 관심으로만 본 것이 아니라, 금융시장·투자상품·규제·투자자 관점 중 일부를 함께 접한 흔적이 보입니다. 다만 운용사 리서치, 상품 비교, 공시자료 검토처럼 여러 각도에서 반복적으로 다룬 흐름까지는 아직 더 확인이 필요합니다.',
    strongEvidenceText:
      '현재 입력에서는 증권/자산운용업을 여러 각도에서 반복적으로 접한 흐름이 비교적 분명합니다. 금융시장, 투자상품, 투자자 성향, 공시·규제, 운용사 리서치 같은 단서가 함께 보인다면 단순 관심보다 산업 구조를 이해하려는 누적된 관심으로 해석할 수 있습니다.',
    repeatabilityLimitText:
      '한 단계 더 강화하려면: (1) 금융시장분석(거시경제 동향, 섹터별 성과)과 투자상품비교(펀드·ETF·연금의 구조 차이) 같은 구체적 각도의 리서치, (2) 지원회사의 대표 상품, 고객군, 최근 시장 이슈에 대한 면접 예상 질문 정리, (3) 정책→금융→상품 비교로 흐르는 관심의 축적 과정을 이력서나 자소서에서 명확히 드러내기를 권장합니다. 예: "제도와 시장의 관계를 학습한 후 투자자 보호라는 운용사의 역할에 관심을 갖게 되었고, 최근 상품·고객 커뮤니케이션 방식을 비교 분석 중입니다."',
  },
  saas_it_service: {
    id: 'saas_it_service',
    label: 'SaaS/IT 서비스',
    contextKeywords: [
      '고객문제',
      '구독/반복사용',
      '온보딩',
      '사용률',
      '이탈/리텐션',
      '가격제',
      '경쟁제품',
      '도입의사결정',
    ],
    repeatabilityEvidenceExamples: [
      '고객 페인포인트 분석',
      '경쟁제품 기능비교',
      '사용자 온보딩 흐름 검토',
      '구독 가격모델 분석',
      '사용률/리텐션 지표 이해',
      '고객 도입의사결정 요소 조사',
      'SaaS 판매사이클 학습',
      '유효성 검증(POC) 프로세스 분석',
    ],
    interviewPrepSuggestions: [
      '지원회사의 주요 고객군과 사용 사례 파악',
      '경쟁사 대비 차별점 및 가격 전략 조사',
      '최근 제품 업데이트와 고객 피드백 연결고리 이해',
    ],
    resumeNarrativeExample:
      'B2B 소프트웨어 시장에서 고객 문제 해결의 방식에 관심을 갖게 되었고, 구독 모델의 구조, 온보딩부터 리텐션까지의 고객 여정, 그리고 SaaS 기업들의 경쟁 포지셔닝을 비교해보고 있다',
    weakEvidenceText:
      '현재 입력에서는 SaaS/IT 서비스업과 연결될 수 있는 단서가 일부 보입니다. 다만 한 번의 관심이나 단편적인 입력인지, 여러 프로젝트·학습에서 반복적으로 다룬 관심사인지는 아직 명확하지 않습니다.',
    moderateEvidenceText:
      '현재 입력에서는 SaaS 시장을 한 번의 관심으로만 본 것이 아니라, 고객문제·구독모델·온보딩·경쟁제품 관점 중 일부를 함께 접한 흔적이 보입니다. 다만 고객 페인포인트 분석, 가격 전략, 리텐션 지표처럼 여러 각도에서 반복적으로 다룬 흐름까지는 추가 확인이 필요합니다.',
    strongEvidenceText:
      '현재 입력에서는 SaaS 비즈니스를 여러 각도에서 반복적으로 접한 흐름이 비교적 분명합니다. 고객 문제, 구독 가격제, 온보딩·리텐션, 경쟁 포지셔닝 같은 다면적 이해가 보인다면 산업의 운영 구조를 파악하려는 누적된 관심으로 해석할 수 있습니다.',
    repeatabilityLimitText:
      '한 단계 더 강화하려면: (1) 고객 도입의사결정 프로세스, SaaS 판매사이클, 온보딩부터 리텐션까지의 고객 여정 같은 구체적 각도의 학습, (2) 지원회사의 주요 고객군, 경쟁사 대비 차별점, 최근 제품 로드맵에 대한 면접 준비, (3) "시장 문제→구독모델→고객 성공"의 흐름을 이력서에서 명확히 드러내기를 권장합니다.',
  },
  ecommerce_retail: {
    id: 'ecommerce_retail',
    label: '이커머스/소매',
    contextKeywords: [
      '상품운영',
      '유입',
      '전환율',
      '객단가',
      '재구매',
      '프로모션',
      '재고/배송',
      '상세페이지',
      '채널별고객행동',
      '판매데이터',
    ],
    repeatabilityEvidenceExamples: [
      '상품 메타데이터 최적화(카테고리, 키워드, 이미지)',
      '고객 세그먼트별 구매 행동 분석',
      '프로모션 효과 측정',
      '채널별(웹, 앱, SNS, 마켓플레이스) 고객 흐름 비교',
      '재고·배송 전략이 판매에 미치는 영향',
      '상세페이지 개선과 전환율의 연관성',
      '재구매율 제고 전략 조사',
      '판매 데이터 기반 상품 포트폴리오 최적화',
    ],
    interviewPrepSuggestions: [
      '지원회사의 주요 상품 카테고리와 고객층 파악',
      '모바일/웹/마켓플레이스 채널별 고객 여정 및 전환 지점 분석',
      '최근 시즈널 캠페인이나 신규 상품 런칭 사례와 성과 조사',
    ],
    resumeNarrativeExample:
      '소비자 구매 행동에 관심을 갖게 되었고, 상품 운영, 채널별 고객 흐름, 프로모션 효과, 재고·배송 전략이 판매 성과에 어떻게 연결되는지를 비교 분석하고 있다',
    weakEvidenceText:
      '현재 입력에서는 이커머스/소매업과 연결될 수 있는 단서가 보입니다. 다만 한 번의 관심이거나 특정 측면만 다룬 것인지, 여러 프로젝트나 학습에서 반복적으로 다룬 관심사인지는 아직 명확하지 않습니다.',
    moderateEvidenceText:
      '현재 입력에서는 이커머스 운영을 한 번의 관심으로만 본 것이 아니라, 상품운영·유입·전환·재구매·프로모션 관점 중 일부를 함께 접한 흔적이 보입니다. 다만 채널별 고객 행동 분석, 재고 전략, 판매 데이터 최적화처럼 여러 각도에서 반복적으로 다룬 흐름까지는 추가 확인이 필요합니다.',
    strongEvidenceText:
      '현재 입력에서는 이커머스 운영을 여러 각도에서 반복적으로 접한 흐름이 비교적 분명합니다. 상품 메타데이터, 고객 세그먼트, 채널별 유입, 전환율, 재구매 전략, 판매 데이터 같은 다면적 이해가 보인다면 소매 운영의 전체 프로세스를 이해하려는 누적된 관심으로 해석할 수 있습니다.',
    repeatabilityLimitText:
      '한 단계 더 강화하려면: (1) 고객 세그먼트별 구매 행동, 채널별 전환 지점, 프로모션 효과 측정, 재고·배송 전략 같은 구체적 각도의 분석, (2) 지원회사의 주요 상품군, 고객층, 채널 전략, 최근 캠페인 사례에 대한 면접 준비, (3) "상품 관점→고객 행동→판매 최적화"의 흐름을 이력서에서 명확히 드러내기를 권장합니다.',
  },
  manufacturing_auto: {
    id: 'manufacturing_auto',
    label: '제조/자동차',
    contextKeywords: [
      '부품',
      '공정',
      '품질',
      '원가',
      '납기',
      '양산성',
      '내구성',
      '공급망',
      '안전',
      '불량/클레임',
      '생산성',
    ],
    repeatabilityEvidenceExamples: [
      '부품 설계 및 원가 구조 분석',
      '제조 공정과 품질 관리 연관성 학습',
      '공급망 최적화와 납기 관리',
      '자동차/제조 안전 규제 및 인증 기준 조사',
      '불량률 감소와 개선 활동 분석',
      '양산성(DFM) 개념 이해',
      '제조 원가 절감 사례 학습',
      '클레임 분석과 설계 개선의 연결고리',
    ],
    interviewPrepSuggestions: [
      '지원회사의 주요 제품, 부품 사양, 생산 라인 특성 파악',
      '최근 품질 개선 사례(불량률 감소, 신기술 도입 등) 및 공급망 이슈 조사',
      '자동차/제조 산업의 규제(배출, 안전, 환경)와 비용 구조의 관계 이해',
    ],
    resumeNarrativeExample:
      '제조 시스템의 효율성과 품질 관리에 관심을 갖게 되었고, 부품 설계, 공정 관리, 원가 구조, 공급망 최적화, 그리고 안전·환경 규제가 제조 전략에 어떻게 반영되는지를 학습하고 있다',
    weakEvidenceText:
      '현재 입력에서는 제조/자동차업과 연결될 수 있는 단서가 일부 보입니다. 다만 한 번의 관심이거나 특정 영역(예: 공정, 품질)만 다룬 것인지, 여러 프로젝트나 학습에서 반복적으로 다룬 관심사인지는 아직 명확하지 않습니다.',
    moderateEvidenceText:
      '현재 입력에서는 제조 운영을 한 번의 관심으로만 본 것이 아니라, 부품·공정·품질·원가·납기·안전 관점 중 일부를 함께 접한 흔적이 보입니다. 다만 공급망 최적화, 양산성 개선, 불량 분석처럼 여러 각도에서 반복적으로 다룬 흐름까지는 추가 확인이 필요합니다.',
    strongEvidenceText:
      '현재 입력에서는 제조 시스템을 여러 각도에서 반복적으로 접한 흐름이 비교적 분명합니다. 부품·공정·품질·원가·공급망·안전 같은 다면적 이해가 보인다면 제조 경영의 전체 구조를 이해하려는 누적된 관심으로 해석할 수 있습니다.',
    repeatabilityLimitText:
      '한 단계 더 강화하려면: (1) 부품 원가 구조, 공정 최적화, 양산성(DFM), 공급망 관리, 불량·클레임 분석 같은 구체적 각도의 학습, (2) 지원회사의 주요 제품, 생산 라인, 최근 품질/원가 개선 사례, 규제 변화 대응 전략에 대한 면접 준비, (3) "설계→공정→품질→원가"의 연쇄적 영향을 이력서에서 명확히 드러내기를 권장합니다.',
  },
  bio_healthcare: {
    id: 'bio_healthcare',
    label: '바이오/의료',
    contextKeywords: [
      '환자/사용자안전',
      '임상/비임상',
      '인허가',
      '품질문서',
      '규제기관',
      '근거자료',
      '제품신뢰성',
      '의료진/환자/기관고객',
      '윤리/리스크',
    ],
    repeatabilityEvidenceExamples: [
      '임상시험 및 비임상 시험 데이터 이해',
      '의료기기/약물 인허가 기준과 프로세스 학습',
      '품질 문서화(QMS, GMP) 개념 학습',
      '규제기관(식약처, FDA) 요구사항 조사',
      '의료진/환자 니즈와 제품 설계의 연결',
      '제품 신뢰성과 부작용 모니터링',
      '의료 윤리와 리스크 관리',
      '임상 근거와 마케팅 메시지의 연결고리',
    ],
    interviewPrepSuggestions: [
      '지원회사의 주요 제품(치료법, 의료기기, 솔루션), 임상 근거, 규제 상태 파악',
      '최근 임상시험 또는 인허가 진행 상황, 경쟁 제품과의 차별점 조사',
      '환자/의료진 안전, 규제 컴플라이언스, 품질 관리 철학 이해',
    ],
    resumeNarrativeExample:
      '환자 안전과 의료 신뢰성에 관심을 갖게 되었고, 임상 근거, 인허가 프로세스, 품질 관리, 규제 요구사항, 그리고 의료진·환자 커뮤니케이션이 어떻게 제품 개발과 시장 신뢰를 함께 이루는지를 학습하고 있다',
    weakEvidenceText:
      '현재 입력에서는 바이오/의료업과 연결될 수 있는 단서가 보입니다. 다만 한 번의 관심이거나 특정 측면(예: 임상 데이터, 규제)만 다룬 것인지, 여러 프로젝트나 학습에서 반복적으로 다룬 관심사인지는 아직 명확하지 않습니다.',
    moderateEvidenceText:
      '현재 입력에서는 바이오/의료 산업을 한 번의 관심으로만 본 것이 아니라, 임상·인허가·품질·규제·환자안전 관점 중 일부를 함께 접한 흔적이 보입니다. 다만 임상시험 프로세스, 품질문서화(QMS), 규제 컴플라이언스처럼 여러 각도에서 반복적으로 다룬 흐름까지는 추가 확인이 필요합니다.',
    strongEvidenceText:
      '현재 입력에서는 바이오/의료 산업을 여러 각도에서 반복적으로 접한 흐름이 비교적 분명합니다. 임상 근거, 인허가, 품질 관리, 규제 요구사항, 환자·의료진 안전 같은 다면적 이해가 보인다면 의료 신뢰성과 규제 체계를 이해하려는 누적된 관심으로 해석할 수 있습니다.',
    repeatabilityLimitText:
      '한 단계 더 강화하려면: (1) 임상시험 프로토콜과 데이터 해석, 인허가 신청서 구성, 품질 문서화(QMS, GMP), 규제기관 상호작용 같은 구체적 각도의 학습, (2) 지원회사의 파이프라인 제품, 주요 임상 근거, 규제 마일스톤, 경쟁 제품과의 차별점에 대한 면접 준비, (3) "환자 문제→임상 검증→규제 통과→신뢰성"의 흐름을 이력서에서 명확히 드러내기를 권장합니다.',
  },
};

// Loose matching helper - handles variations in industry label naming
const LABEL_ALIASES = {
  // Securities & Asset Management
  '증권': 'securities_asset_management',
  '자산운용': 'securities_asset_management',
  '금융투자': 'securities_asset_management',
  '펀드': 'securities_asset_management',
  '운용사': 'securities_asset_management',
  '증권사': 'securities_asset_management',
  '금융시장': 'securities_asset_management',
  '투자': 'securities_asset_management',

  // SaaS & IT Service
  'saas': 'saas_it_service',
  'b2b 소프트웨어': 'saas_it_service',
  'it 서비스': 'saas_it_service',
  '소프트웨어': 'saas_it_service',
  '클라우드': 'saas_it_service',
  '구독': 'saas_it_service',
  '구독 서비스': 'saas_it_service',

  // E-commerce & Retail
  '이커머스': 'ecommerce_retail',
  '전자상거래': 'ecommerce_retail',
  '소매': 'ecommerce_retail',
  '온라인 쇼핑': 'ecommerce_retail',
  '마켓플레이스': 'ecommerce_retail',
  '상품 운영': 'ecommerce_retail',
  '판매': 'ecommerce_retail',

  // Manufacturing & Auto
  '제조': 'manufacturing_auto',
  '자동차': 'manufacturing_auto',
  '자동차산업': 'manufacturing_auto',
  '부품': 'manufacturing_auto',
  '생산': 'manufacturing_auto',
  '공장': 'manufacturing_auto',

  // Bio & Healthcare
  '바이오': 'bio_healthcare',
  '의료': 'bio_healthcare',
  '의약': 'bio_healthcare',
  '의료기기': 'bio_healthcare',
  '제약': 'bio_healthcare',
  '헬스케어': 'bio_healthcare',
  '임상': 'bio_healthcare',
};

/**
 * Get industry archetype by label with loose matching
 * @param {string} targetIndustryLabel - User input industry label (e.g., "증권", "금융투자", "SaaS", "이커머스")
 * @returns {object|null} - Industry archetype object or null if not found
 */
function getIndustryArchetype(targetIndustryLabel) {
  if (!targetIndustryLabel) return null;

  const normalized = targetIndustryLabel.toLowerCase().trim();

  // Direct lookup in aliases
  if (LABEL_ALIASES[normalized]) {
    const archetypeId = LABEL_ALIASES[normalized];
    return INDUSTRY_ARCHETYPES[archetypeId] || null;
  }

  // Check if label partially matches any alias key
  for (const [alias, archetypeId] of Object.entries(LABEL_ALIASES)) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return INDUSTRY_ARCHETYPES[archetypeId] || null;
    }
  }

  return null;
}

/**
 * Get industry-specific repeatability guidance for Row 3
 * @param {string} targetIndustryLabel - User input industry label
 * @param {object} options - Options object with evidence strength indicators
 * @param {number} options.strongContextCount - Count of strong industry context signals
 * @param {number} options.supportContextCount - Count of supporting industry context signals
 * @returns {object|null} - Guidance object with verdictText, evidenceText, limitText, actionHint, or null
 */
function getIndustryRepeatabilityGuidance(targetIndustryLabel, options = {}) {
  const archetype = getIndustryArchetype(targetIndustryLabel);

  if (!archetype) {
    return null;
  }

  const { strongContextCount = 0, supportContextCount = 0 } = options;
  const totalEvidence = strongContextCount + supportContextCount;

  let evidenceText = archetype.weakEvidenceText;
  if (totalEvidence >= 2) {
    evidenceText = archetype.moderateEvidenceText;
  }
  if (totalEvidence >= 4 || (totalEvidence >= 3 && strongContextCount >= 2)) {
    evidenceText = archetype.strongEvidenceText;
  }

  return {
    verdictText: `산업 경험: ${archetype.label}`,
    evidenceText,
    limitText: archetype.repeatabilityLimitText,
    actionHint: `${archetype.label}에 대해 다음 영역 학습을 권장합니다: ${archetype.interviewPrepSuggestions[0]}`,
    confidence: totalEvidence >= 4 ? 0.85 : totalEvidence >= 2 ? 0.6 : 0.4,
  };
}

module.exports = {
  INDUSTRY_ARCHETYPES,
  getIndustryArchetype,
  getIndustryRepeatabilityGuidance,
};
