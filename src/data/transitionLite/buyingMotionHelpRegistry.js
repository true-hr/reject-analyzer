function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function compactKey(value) {
  return toStr(value).replace(/\s+/g, "");
}

function item(category, normalizedKey, shortDescription) {
  return { category, normalizedKey, shortDescription };
}

export const BUYING_MOTION_HELP_TEXT = {
  "입찰형": item("입찰공공예산 계열", "BID_PUBLIC_PROCUREMENT", "정해진 기준과 절차에 맞춰 경쟁 제안으로 선정되는 구조"),
  "공공조달형": item("입찰공공예산 계열", "BID_PUBLIC_PROCUREMENT", "공공 발주 기준과 조달 절차를 거쳐 도입되는 구조"),
  "입찰연계형": item("입찰공공예산 계열", "BID_PUBLIC_PROCUREMENT", "실제 영업이 입찰 준비와 결과 대응에 강하게 연결되는 구조"),
  "공공예산형": item("입찰공공예산 계열", "BID_PUBLIC_PROCUREMENT", "예산 확보와 집행 가능성이 도입 시점을 좌우하는 구조"),
  "예산집행형": item("입찰공공예산 계열", "BID_PUBLIC_PROCUREMENT", "편성된 예산 안에서 집행 논리에 맞춰 도입되는 구조"),
  "공모형": item("입찰공공예산 계열", "BID_PUBLIC_PROCUREMENT", "공개 모집과 평가를 통해 참여선정되는 구조"),
  "공모지원형": item("입찰공공예산 계열", "BID_PUBLIC_PROCUREMENT", "지원사업공모 선정 여부가 사업 진행에 큰 영향을 주는 구조"),
  "정책집행형": item("입찰공공예산 계열", "BID_PUBLIC_PROCUREMENT", "정책 방향과 행정 집행 흐름에 따라 도입이 이뤄지는 구조"),
  "정책연계형": item("입찰공공예산 계열", "BID_PUBLIC_PROCUREMENT", "정책 과제와 연결되어 수요가 만들어지는 구조"),
  "정책연동형": item("입찰공공예산 계열", "BID_PUBLIC_PROCUREMENT", "제도 변화나 정책 흐름에 따라 시장 기회가 움직이는 구조"),
  "공공연계형": item("입찰공공예산 계열", "BID_PUBLIC_PROCUREMENT", "공공기관공공서비스 운영 맥락과 맞물려 작동하는 구조"),
  "국제협력형": item("입찰공공예산 계열", "BID_PUBLIC_PROCUREMENT", "국제 협력 과제와 파트너 구조 안에서 추진되는 방식"),
  "지원사업형": item("입찰공공예산 계열", "BID_PUBLIC_PROCUREMENT", "별도 지원사업 선정이나 프로그램 연계로 도입되는 방식"),

  "제안형": item("제안수주견적 계열", "PROPOSAL_BIDDING", "고객 요구를 해석해 방향과 해법을 제안하는 구조"),
  "프로젝트수주형": item("제안수주견적 계열", "PROPOSAL_BIDDING", "건별 프로젝트를 따내는 경쟁이 중요한 구조"),
  "프로젝트제안형": item("제안수주견적 계열", "PROPOSAL_BIDDING", "프로젝트 기획안과 제안 내용이 수주 가능성을 좌우하는 구조"),
  "전환수주형": item("제안수주견적 계열", "PROPOSAL_BIDDING", "기존 운영이나 계약을 다른 공급자가 넘겨받아 수주하는 구조"),
  "도면기반수주형": item("제안수주견적 계열", "PROPOSAL_BIDDING", "도면사양설계 기준에 맞춰 수주가 결정되는 구조"),
  "견적형": item("제안수주견적 계열", "PROPOSAL_BIDDING", "조건단가범위를 비교한 견적 경쟁이 중요한 구조"),
  "스팟수주형": item("제안수주견적 계열", "PROPOSAL_BIDDING", "건별단기성 발주를 빠르게 따내는 구조"),
  "설계제안형": item("제안수주견적 계열", "PROPOSAL_BIDDING", "고객 요구보다 설계 방향 제안이 더 중요한 구조"),
  "상품제안형": item("제안수주견적 계열", "PROPOSAL_BIDDING", "고객 상황에 맞는 상품 조합과 제안력이 중요한 구조"),
  "딜구조화형": item("제안수주견적 계열", "PROPOSAL_BIDDING", "거래 조건구조 설계 자체가 성사의 핵심인 구조"),
  "RFP형": item("제안수주견적 계열", "PROPOSAL_BIDDING", "공식 요구사항 문서에 맞춰 제안서를 제출하는 구조"),

  "프로젝트형": item("프로젝트구축도입 계열", "PROJECT_BUILD_IMPLEMENTATION", "일정산출물완료 책임이 분명한 건별 수행 구조"),
  "구축형": item("프로젝트구축도입 계열", "PROJECT_BUILD_IMPLEMENTATION", "실제 도입과 세팅, 연결, 적용 완성도가 중요한 구조"),
  "프로젝트개발형": item("프로젝트구축도입 계열", "PROJECT_BUILD_IMPLEMENTATION", "개발 프로젝트 단위로 기획수행인도가 이뤄지는 구조"),
  "설비도입형": item("프로젝트구축도입 계열", "PROJECT_BUILD_IMPLEMENTATION", "설비 설치와 운영 전환까지 포함해 도입되는 구조"),
  "설치연계형": item("프로젝트구축도입 계열", "PROJECT_BUILD_IMPLEMENTATION", "설치 이후의 안정화와 연동까지 함께 보는 구조"),
  "국제 발주형": item("프로젝트구축도입 계열", "PROJECT_BUILD_IMPLEMENTATION", "해외 발주처 기준과 일정에 따라 수주가 결정되는 구조"),
  "OEM/ODM형": item("프로젝트구축도입 계열", "PROJECT_BUILD_IMPLEMENTATION", "고객 브랜드나 요구사항에 맞춰 대신 생산개발하는 구조"),
  "위탁생산형": item("프로젝트구축도입 계열", "PROJECT_BUILD_IMPLEMENTATION", "생산 역량을 외부에 맡겨 공급하는 구조"),
  "협력사공급형": item("프로젝트구축도입 계열", "PROJECT_BUILD_IMPLEMENTATION", "협력사 등록과 공급망 편입이 중요한 구조"),
  "협력사 등록형": item("프로젝트구축도입 계열", "PROJECT_BUILD_IMPLEMENTATION", "먼저 공급 자격을 확보해야 거래가 가능한 구조"),
  "대형 고객사 공급형": item("프로젝트구축도입 계열", "PROJECT_BUILD_IMPLEMENTATION", "소수 대형 고객사 공급망 안에 들어가는 게 핵심인 구조"),

  "장기계약형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "한 번의 수주보다 오래 유지되는 계약이 중요한 구조"),
  "장기 계약형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "장기 관계와 안정적 계약 유지가 핵심인 구조"),
  "장기거래형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "단발성보다 오랜 거래 지속이 더 중요한 구조"),
  "장기공급형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "지속 납품과 공급 안정성이 핵심인 구조"),
  "장기운영형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "도입 이후 장기간 안정적으로 운영하는 능력이 중요한 구조"),
  "계약형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "조건 합의와 계약 체결이 거래 성사의 중심인 구조"),
  "연간 구독형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "해마다 갱신 여부가 중요한 장기 이용 구조"),
  "갱신형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "최초 도입보다 재계약갱신 유지가 더 중요한 구조"),
  "운영위탁형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "고객 대신 실제 운영을 맡아 안정적으로 굴리는 구조"),
  "위탁운영형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "운영 책임을 외부에 넘기고 관리하는 구조"),
  "위탁형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "일부 기능이나 운영을 외부 파트너에 맡기는 구조"),
  "프로젝트 전환 후 운영형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "구축 이후 장기 운영 계약으로 이어지는 구조"),
  "서비스 관제계약형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "지속 모니터링과 대응 계약이 핵심인 구조"),
  "수익운영형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "단순 공급보다 운영 성과와 수익 관리가 중요한 구조"),
  "공급안정형": item("장기계약운영위탁 계열", "LONG_TERM_OPERATION", "문제 없이 꾸준히 공급하는 능력이 핵심인 구조"),

  "구독형": item("구독셀프서브사용량 계열", "SUBSCRIPTION_SELF_SERVE_USAGE", "한 번 판매보다 계속 쓰게 만드는 것이 중요한 구조"),
  "셀프서브형": item("구독셀프서브사용량 계열", "SUBSCRIPTION_SELF_SERVE_USAGE", "고객이 스스로 가입도입이용할 수 있게 설계된 구조"),
  "사용량기반형": item("구독셀프서브사용량 계열", "SUBSCRIPTION_SELF_SERVE_USAGE", "실제 사용량에 따라 매출과 비용이 움직이는 구조"),
  "부분유료형": item("구독셀프서브사용량 계열", "SUBSCRIPTION_SELF_SERVE_USAGE", "무료 경험 후 일부 기능이나 혜택에 과금하는 구조"),
  "트랜잭션형": item("구독셀프서브사용량 계열", "SUBSCRIPTION_SELF_SERVE_USAGE", "거래가 발생할 때마다 수수료나 매출이 발생하는 구조"),
  "광고수익형": item("구독셀프서브사용량 계열", "SUBSCRIPTION_SELF_SERVE_USAGE", "이용자 확보 후 광고 수익으로 연결되는 구조"),
  "서비스이용형": item("구독셀프서브사용량 계열", "SUBSCRIPTION_SELF_SERVE_USAGE", "실제 서비스 이용 지속성이 중요한 구조"),
  "플랫폼확산형": item("구독셀프서브사용량 계열", "SUBSCRIPTION_SELF_SERVE_USAGE", "더 많은 참여자와 사용자를 확보할수록 강해지는 구조"),
  "확장형": item("구독셀프서브사용량 계열", "SUBSCRIPTION_SELF_SERVE_USAGE", "도입 이후 계정조직기능 확장이 중요한 구조"),

  "반복구매": item("반복구매리텐션유입 계열", "REPEAT_PURCHASE_RETENTION", "한 번보다 여러 번 다시 사게 만드는 것이 중요하고 재구매 빈도가 곧 성과가 되는 구조"),
  "반복구매형": item("반복구매리텐션유입 계열", "REPEAT_PURCHASE_RETENTION", "재구매와 유지율이 핵심 성과가 되는 구조"),
  "반복거래형": item("반복구매리텐션유입 계열", "REPEAT_PURCHASE_RETENTION", "꾸준한 거래 반복이 실적을 만드는 구조"),
  "반복사용형": item("반복구매리텐션유입 계열", "REPEAT_PURCHASE_RETENTION", "지속 사용 습관이 매출과 직결되는 구조"),
  "반복이용형": item("반복구매리텐션유입 계열", "REPEAT_PURCHASE_RETENTION", "한 번 유입보다 계속 이용하게 만드는 것이 중요한 구조"),
  "매장유입형": item("반복구매리텐션유입 계열", "REPEAT_PURCHASE_RETENTION", "실제 방문과 오프라인 유입이 구매를 좌우하는 구조"),
  "프로모션형": item("반복구매리텐션유입 계열", "REPEAT_PURCHASE_RETENTION", "판촉행사할인 자극이 구매 전환과 즉시 판매에 큰 영향을 주는 구조"),
  "회원확장형": item("반복구매리텐션유입 계열", "REPEAT_PURCHASE_RETENTION", "신규 회원 유입과 활성 사용자 확대가 중요한 구조"),
  "회원제형": item("반복구매리텐션유입 계열", "REPEAT_PURCHASE_RETENTION", "회원 기반 유지와 혜택 운영이 핵심인 구조"),
  "연회비형": item("반복구매리텐션유입 계열", "REPEAT_PURCHASE_RETENTION", "정기 회비를 기반으로 관계를 유지하는 구조"),

  "채널형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "직접 판매보다 유통 채널 관리가 중요한 구조"),
  "채널연동형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "여러 채널과의 연결연동이 성과를 좌우하는 구조"),
  "채널확장형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "채널 수와 파트너 확장이 성장의 핵심인 구조"),
  "유통채널형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "유통망 확보와 채널 운영이 중요한 구조"),
  "유통 연계형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "유통 흐름과 연결돼야 판매가 커지는 구조"),
  "도매형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "유통 단계별 대량 거래가 중심인 구조"),
  "브랜드공급형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "브랜드 기준에 맞춰 안정 공급하는 구조"),
  "브랜드형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "브랜드 인지도와 선호, 이미지가 구매를 좌우하는 구조"),
  "가맹점제휴형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "가맹점제휴 네트워크 확보가 핵심인 구조"),
  "제휴형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "파트너 제휴를 통해 확장되는 구조"),
  "제휴연동형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "제휴사 시스템고객 흐름과 연결되는 구조"),
  "인프라연동형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "기존 인프라와 연결돼야 실제 도입이 가능한 구조"),
  "플랫폼형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "다수의 공급자사용자가 함께 참여하는 구조"),
  "셀러 대상: 입점형, 광고형, 풀필먼트형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "셀러를 모아 입점광고물류 서비스로 수익화하는 구조"),
  "소비자 대상: 반복구매형, 프로모션형": item("채널유통브랜드 계열", "CHANNEL_DISTRIBUTION_BRAND", "소비자 재구매와 판촉 반응이 중요한 구조"),

  "승인형": item("승인심사규제검증 계열", "APPROVAL_REVIEW_REGULATION", "내부 승인 절차를 통과해야 실제 도입이 가능한 구조"),
  "심사승인형": item("승인심사규제검증 계열", "APPROVAL_REVIEW_REGULATION", "심사와 승인 단계를 거쳐 거래가 성사되는 구조"),
  "기술검증형": item("승인심사규제검증 계열", "APPROVAL_REVIEW_REGULATION", "기술 적합성과 성능 검증이 먼저 필요한 구조"),
  "기술평가형": item("승인심사규제검증 계열", "APPROVAL_REVIEW_REGULATION", "기술 가치와 경쟁력을 평가받아야 하는 구조"),
  "양산 승인형": item("승인심사규제검증 계열", "APPROVAL_REVIEW_REGULATION", "양산 전 승인과 품질 통과가 핵심인 구조"),
  "규제준수형": item("승인심사규제검증 계열", "APPROVAL_REVIEW_REGULATION", "법과 규정 준수 여부가 도입의 필수 조건인 구조"),
  "규제연동형": item("승인심사규제검증 계열", "APPROVAL_REVIEW_REGULATION", "규제 변화에 따라 수요와 대응이 달라지는 구조"),
  "규제대응형": item("승인심사규제검증 계열", "APPROVAL_REVIEW_REGULATION", "규제 이슈를 해결해주는 역할이 핵심인 구조"),
  "법정필수형": item("승인심사규제검증 계열", "APPROVAL_REVIEW_REGULATION", "법적으로 반드시 해야 하거나 갖춰야 하는 구조"),
  "처방유도형": item("승인심사규제검증 계열", "APPROVAL_REVIEW_REGULATION", "특정 전문가 판단과 처방 흐름이 구매에 영향을 주는 구조"),

  "관계영업형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "짧은 판매보다 신뢰 관계 축적이 중요한 구조"),
  "관계형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "지속적인 관계 유지가 거래에 큰 영향을 주는 구조"),
  "자문계약형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "전문 조언과 자문 계약이 핵심인 구조"),
  "성과신뢰형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "과거 성과와 신뢰가 다음 계약을 만드는 구조"),
  "성과연동형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "실제 성과에 따라 보상이나 계약 가치가 달라지는 구조"),
  "기관계약형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "기관 단위 계약과 승인 흐름이 중요한 구조"),
  "기관납품형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "기관 대상 납품 요건과 절차 대응이 중요한 구조"),
  "기관도입형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "기관이 공식 도입 주체가 되는 구조"),
  "병원영업형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "병원과의 관계 형성과 내부 설득, 임상행정 구조 대응이 중요한 구조"),
  "공동개발형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "단순 판매보다 함께 개발검증하는 관계가 중요한 구조"),
  "파트너십형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "장기 협력 관계를 전제로 추진되는 구조"),
  "라이선스형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "권리 사용 허가와 조건 계약이 핵심인 구조"),
  "투자유치형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "투자자 설득과 자금 유치가 사업 성사의 핵심인 구조"),
  "투자개발형": item("관계자문신뢰 계열", "RELATIONSHIP_CONSULTING_TRUST", "투자 판단과 개발 진행이 함께 움직이는 구조"),

  "광고형": item("콘텐츠광고캠페인흥행 계열", "CONTENT_AD_CAMPAIGN", "광고 집행과 노출 성과가 핵심인 구조"),
  "캠페인형": item("콘텐츠광고캠페인흥행 계열", "CONTENT_AD_CAMPAIGN", "기간별 캠페인 성과가 중요한 구조"),
  "콘텐츠소비형": item("콘텐츠광고캠페인흥행 계열", "CONTENT_AD_CAMPAIGN", "콘텐츠를 얼마나 소비하게 만드느냐가 중요한 구조"),
  "콘텐츠유도형": item("콘텐츠광고캠페인흥행 계열", "CONTENT_AD_CAMPAIGN", "콘텐츠가 구매나 행동 전환을 이끄는 구조"),
  "팬덤형": item("콘텐츠광고캠페인흥행 계열", "CONTENT_AD_CAMPAIGN", "충성도 높은 팬층의 지지가 성과를 만드는 구조"),
  "흥행형": item("콘텐츠광고캠페인흥행 계열", "CONTENT_AD_CAMPAIGN", "대중 반응과 화제성이 성과를 좌우하는 구조"),
  "프로그램형": item("콘텐츠광고캠페인흥행 계열", "CONTENT_AD_CAMPAIGN", "정해진 프로그램 운영과 참여 구조가 중요한 방식"),
  "프로그램운영형": item("콘텐츠광고캠페인흥행 계열", "CONTENT_AD_CAMPAIGN", "프로그램을 안정적으로 운영하는 역량이 중요한 방식"),
  "행사운영형": item("콘텐츠광고캠페인흥행 계열", "CONTENT_AD_CAMPAIGN", "행사 기획운영 완성도가 성과를 좌우하는 구조"),
};

const NORMALIZED_ALIAS_MAP = {
  "장기 계약형": "LONG_TERM_OPERATION",
  "장기계약형": "LONG_TERM_OPERATION",
  "반복구매": "REPEAT_PURCHASE_RETENTION",
  "반복구매형": "REPEAT_PURCHASE_RETENTION",
};

const RAW_TO_NORMALIZED_KEY = Object.fromEntries(
  Object.entries(BUYING_MOTION_HELP_TEXT).map(([raw, info]) => [raw, info.normalizedKey])
);

const COMPACT_TO_NORMALIZED_KEY = Object.fromEntries(
  Object.entries({
    ...RAW_TO_NORMALIZED_KEY,
    ...NORMALIZED_ALIAS_MAP,
  }).map(([raw, normalizedKey]) => [compactKey(raw), normalizedKey])
);

export function normalizeBuyingMotion(raw) {
  const text = toStr(raw);
  if (!text) return null;
  return COMPACT_TO_NORMALIZED_KEY[compactKey(text)] || null;
}

export function getBuyingMotionHelpText(raw) {
  const text = toStr(raw);
  if (!text) return null;
  return BUYING_MOTION_HELP_TEXT[text] || null;
}

