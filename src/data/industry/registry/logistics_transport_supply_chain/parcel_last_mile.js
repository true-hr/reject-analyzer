export const IND_LOGISTICS_TRANSPORT_SUPPLY_CHAIN_PARCEL_LAST_MILE = {
  id: "IND_LOGISTICS_TRANSPORT_SUPPLY_CHAIN_PARCEL_LAST_MILE",
  label: "택배 / 라스트마일",
  sector: "LOGISTICS_TRANSPORT_SUPPLY_CHAIN",
  subSector: "PARCEL_LAST_MILE",
  aliases: [
    "택배",
    "라스트마일",
    "택배배송",
    "배송 네트워크",
    "courier",
    "parcel delivery",
    "last mile delivery",
    "당일배송",
    "새벽배송"
  ],
  offeringModel: "소형 화물과 주문 단위 배송을 집하, 분류, 간선, 최종 배송 네트워크로 연결해 대량 처리한다.",
  customerMarket: "MIXED",
  buyingMotion: "반복구매형, 계약형, 채널연동형",
  regulationBarrier: "MEDIUM - 운송 안전, 종사자 운영, 서비스 품질, 네트워크 운영 규율이 중요하다.",
  valueChainPosition: "이커머스·리테일·브랜드의 최종 배송 접점을 담당하는 배송 실행 영역",
  salesCycle: "MID",
  decisionStructure: "화주사 물류, 운영, 플랫폼, 재무가 단가와 커버리지, 배송 품질, 시스템 연동성을 함께 검토한다.",
  proofSignals: [
    "배송완료율",
    "정시배송률",
    "배송클레임율",
    "지역 커버리지",
    "건당 원가",
    "피크 대응력",
    "분류 생산성",
    "재배송률"
  ],
  coreContext: [
    "고정망 운영과 물동량 변동 대응이 동시에 중요하다.",
    "배송 품질은 고객경험과 브랜드 평판에 직접 연결된다.",
    "분류 효율과 간선·배송 네트워크 조합이 수익성을 좌우한다.",
    "프로모션 시즌과 피크 시즌 대응 역량이 큰 차이를 만든다.",
    "플랫폼 연동과 트래킹 가시성이 거래 유지에 중요하다."
  ],
  boundaryHints: [
    "3PL이 전체 물류 운영 위탁이라면 택배·라스트마일은 주문 단위 배송 실행이 중심이다.",
    "풀필먼트와 밀접하지만, 이 산업의 핵심은 보관보다 배송 네트워크 운영이다.",
    "포워딩처럼 국제 구간 주선이 아니라 최종 소비자 접점 배송이 핵심이다."
  ],
  summaryTemplate: "{label} 산업은 주문 단위의 소형 화물을 빠르고 안정적으로 최종 수령지까지 전달하는 배송 네트워크 산업입니다. 경쟁력은 단가만이 아니라 커버리지, 정시배송률, 피크 대응력, 클레임 통제, 시스템 연동성에서 결정되며, 성과는 배송 품질과 처리 생산성으로 가장 직접적으로 드러납니다.",
  jobInteractionHints: [
    "운영직무는 일상 운영보다 피크 물량 대응, 예외 처리, 클레임 통제 역량이 더 중요해진다.",
    "SCM·기획은 이론적 최적화보다 실제 네트워크 병목 제거와 CAPA 조정 경험이 강하게 평가된다.",
    "영업은 단가 협상만으로는 약하고 커버리지, SLA, 시스템 연동, 시즌 대응 논리가 중요하다.",
    "데이터 직무는 단순 리포팅보다 라우팅, 지연 원인, 배송 품질 개선에 연결되는 분석이 더 유효하다."
  ]
};
