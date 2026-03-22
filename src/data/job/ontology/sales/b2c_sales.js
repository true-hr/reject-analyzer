export const JOB_ONTOLOGY_ITEM = {
  vertical: "SALES",
  subVertical: "B2C_SALES",
  aliases: [
    "B2C 영업",
    "개인고객 영업",
    "소비자 영업",
    "리테일 영업",
    "매장 영업",
    "대면 영업",
    "consumer sales",
    "B2C sales",
    "retail sales",
    "store sales",
    "personal sales",
    "direct sales"
  ],
  families: [
    {
      id: "STORE_FRONT_B2C_SALES",
      label: "매장·현장 응대형 영업",
      aliases: [
        "매장 영업",
        "현장 영업",
        "오프라인 영업",
        "store sales",
        "retail sales",
        "front sales"
      ],
      strongSignals: [
        "매장 방문 고객 응대와 구매 전환",
        "현장 상담을 통한 상품 추천 및 판매",
        "매장 목표 매출과 객단가 관리",
        "프로모션, 진열, 행사와 연계한 판매 유도",
        "고객 반응에 따라 대면 설득과 클로징 수행",
        "일별 판매 실적과 방문객 전환 관리",
        "매장 운영팀과 함께 현장 판매 이슈 대응"
      ],
      mediumSignals: [
        "상품 설명과 비교 안내",
        "현장 이벤트나 판촉 연계",
        "재방문 고객 응대",
        "매장별 판매 데이터 확인",
        "고객 불만 초기 대응"
      ],
      boundarySignals: [
        "방문 고객 응대보다 직접 고객을 찾아 나가는 비중이 커지면 방문·외부개척형 B2C 영업으로 이동",
        "상담 이후 계약 서류, 가입 심사, 후속 관리 비중이 커지면 상담·전환형 B2C 영업으로 이동",
        "대리점, 가맹점, 판매사 관리 비중이 커지면 채널·유통형 B2C 영업으로 이동"
      ],
      adjacentFamilies: [
        "FIELD_ACQUISITION_B2C_SALES",
        "CONSULTATIVE_CONVERSION_B2C_SALES",
        "CHANNEL_RETAIL_B2C_SALES"
      ],
      boundaryNote: "고객이 들어오는 현장에서 응대하고 바로 구매를 전환시키는 책임이 분명하면 매장·현장 응대형 영업으로 읽힙니다. 반면 직접 고객을 찾아가거나 계약 후속 관리 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 매장이나 현장에서 고객을 응대해 즉시 구매로 연결하는 성격이 강합니다. 반면 외부 개척이나 계약 후속 관리 비중이 커지면 다른 B2C 영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "FIELD_ACQUISITION_B2C_SALES",
      label: "방문·외부개척형 B2C 영업",
      aliases: [
        "방문 영업",
        "외부 영업",
        "개인 고객 개척 영업",
        "field sales",
        "door to door sales",
        "outbound consumer sales"
      ],
      strongSignals: [
        "잠재 개인고객을 직접 찾아가 상담과 판매를 진행",
        "상권, 지역, 행사 현장 등에서 신규 고객 발굴",
        "아웃바운드 방식으로 고객 접점 확보",
        "첫 상담부터 계약 또는 가입 전환까지 직접 수행",
        "개별 고객 설득과 반대 처리 비중이 큼",
        "현장 리드 확보와 일일 활동량 관리",
        "미개척 지역 또는 신규 고객군 공략"
      ],
      mediumSignals: [
        "행사 부스 또는 외부 채널 활용",
        "고객 접촉 건수와 상담 전환율 관리",
        "현장 판촉물 활용",
        "개별 고객 니즈 파악",
        "후속 방문 또는 재접촉 관리"
      ],
      boundarySignals: [
        "고정 매장 내 방문 고객 응대 비중이 커지면 매장·현장 응대형 영업으로 이동",
        "상담 이후 장기 팔로업과 계약 심사 관리 비중이 커지면 상담·전환형 B2C 영업으로 이동",
        "대리점이나 판매 파트너를 통한 간접 판매가 중심이면 채널·유통형 B2C 영업으로 이동"
      ],
      adjacentFamilies: [
        "STORE_FRONT_B2C_SALES",
        "CONSULTATIVE_CONVERSION_B2C_SALES",
        "CHANNEL_RETAIL_B2C_SALES"
      ],
      boundaryNote: "고객이 찾아오기를 기다리기보다 직접 접점을 만들고 첫 계약을 성사시키는 책임이 중심이면 방문·외부개척형 B2C 영업으로 읽힙니다. 반면 현장 응대나 후속 관리 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 개인고객을 직접 발굴하고 설득해 첫 계약이나 구매를 만드는 성격이 강합니다. 반면 매장 응대나 장기 상담 관리 비중이 커지면 다른 B2C 영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "CONSULTATIVE_CONVERSION_B2C_SALES",
      label: "상담·전환형 B2C 영업",
      aliases: [
        "상담 영업",
        "전환 영업",
        "고객 상담 영업",
        "consultative sales",
        "conversion sales",
        "inbound sales"
      ],
      strongSignals: [
        "문의나 관심을 보인 고객을 상담해 계약으로 전환",
        "상품, 서비스, 가입 조건을 비교 설명하고 설계",
        "고객 상황에 맞는 옵션 또는 플랜 제안",
        "상담 후 계약 서류, 가입 절차, 심사 진행 관리",
        "상담 리드별 전환율과 취소율 관리",
        "반복 팔로업을 통해 계약 마무리",
        "단순 안내보다 설득과 전환 책임이 분명함"
      ],
      mediumSignals: [
        "전화, 채팅, 방문 예약 기반 상담",
        "고객 이탈 사유 파악과 재설득",
        "상담 스크립트 또는 제안 포인트 관리",
        "옵션별 견적 안내",
        "상담 결과 기록과 후속 일정 관리"
      ],
      boundarySignals: [
        "단순 문의 응대나 CS 비중이 커지고 판매 책임이 약해지면 고객상담/CS로 이동",
        "즉시 현장 판매 비중이 커지면 매장·현장 응대형 영업으로 이동",
        "외부에서 신규 고객을 직접 찾아오는 비중이 커지면 방문·외부개척형 B2C 영업으로 이동"
      ],
      adjacentFamilies: [
        "STORE_FRONT_B2C_SALES",
        "FIELD_ACQUISITION_B2C_SALES",
        "CHANNEL_RETAIL_B2C_SALES"
      ],
      boundaryNote: "문의 고객이나 유입 고객을 상담해 실제 계약으로 바꾸는 책임이 분명하면 상담·전환형 B2C 영업으로 읽힙니다. 반면 단순 응대만 하거나 외부 개척이 중심이면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 관심 고객을 상담해 실제 계약이나 가입으로 전환시키는 성격이 강합니다. 반면 단순 고객응대나 외부 개척 비중이 커지면 다른 B2C 영업 경계로 읽힐 수 있습니다."
    },
    {
      id: "CHANNEL_RETAIL_B2C_SALES",
      label: "채널·유통형 B2C 영업",
      aliases: [
        "유통 영업",
        "채널 영업",
        "리테일 채널 영업",
        "가맹점 영업",
        "channel sales",
        "retail channel sales",
        "distribution sales"
      ],
      strongSignals: [
        "대리점, 가맹점, 판매점 등 유통 채널을 관리",
        "채널별 판매 목표와 실적 관리",
        "입점, 판매 정책, 판촉 조건 협의",
        "판매점 교육과 현장 지원 수행",
        "채널 재고, 진열, 프로모션 운영 조율",
        "간접 판매 구조를 통해 소비자 매출 확대",
        "판매 파트너와의 계약 및 관계 관리"
      ],
      mediumSignals: [
        "판매점 방문과 운영 점검",
        "채널별 매출 데이터 리뷰",
        "판촉물 배포 및 캠페인 연계",
        "판매 인센티브 운영 지원",
        "유통 파트너 커뮤니케이션"
      ],
      boundarySignals: [
        "최종 소비자를 직접 상대하는 비중이 커지면 매장·현장 응대형 또는 상담·전환형으로 이동",
        "대리점보다 기업 파트너나 리셀러 관리가 중심이면 B2B 채널 영업으로 이동",
        "운영 관리와 매장 지원만 남고 판매 책임이 약해지면 운영관리 또는 영업지원으로 이동"
      ],
      adjacentFamilies: [
        "STORE_FRONT_B2C_SALES",
        "CONSULTATIVE_CONVERSION_B2C_SALES",
        "FIELD_ACQUISITION_B2C_SALES"
      ],
      boundaryNote: "직접 소비자를 상대하기보다 판매 채널과 유통 파트너를 통해 매출을 만드는 구조라면 채널·유통형 B2C 영업으로 읽힙니다. 반면 직접 판매나 상담 전환 비중이 커지면 다른 family로 이동합니다.",
      summaryTemplate: "이 직무는 판매점, 가맹점, 유통 파트너를 통해 소비자 매출을 만드는 성격이 강합니다. 반면 최종 고객 직접 응대나 상담 전환 비중이 커지면 다른 B2C 영업 경계로 읽힐 수 있습니다."
    }
  ],
  roles: [
    {
      id: "RETAIL_SALES_ASSOCIATE",
      label: "매장 영업 담당",
      aliases: [
        "매장 영업",
        "retail sales associate",
        "store sales associate"
      ],
      family: "STORE_FRONT_B2C_SALES",
      responsibilityHints: [
        "방문 고객 응대",
        "상품 설명과 구매 전환",
        "매장 매출 관리",
        "현장 판촉 실행"
      ],
      levelHints: [
        "주니어는 고객 응대와 판매 실행 비중이 큼",
        "시니어는 매장 실적 관리와 현장 운영 조율 비중이 큼"
      ]
    },
    {
      id: "FIELD_SALES_REPRESENTATIVE",
      label: "방문 영업 담당",
      aliases: [
        "방문 영업",
        "field sales representative",
        "outbound sales representative"
      ],
      family: "FIELD_ACQUISITION_B2C_SALES",
      responsibilityHints: [
        "신규 고객 발굴",
        "외부 현장 상담",
        "첫 계약 전환",
        "활동량 및 전환율 관리"
      ],
      levelHints: [
        "주니어는 접점 확보와 상담 건수 비중이 큼",
        "시니어는 주요 지역 개척과 클로징 비중이 큼"
      ]
    },
    {
      id: "SALES_CONSULTANT",
      label: "상담 영업 담당",
      aliases: [
        "상담 영업",
        "sales consultant",
        "inbound sales consultant"
      ],
      family: "CONSULTATIVE_CONVERSION_B2C_SALES",
      responsibilityHints: [
        "고객 상담과 니즈 파악",
        "옵션 또는 플랜 제안",
        "계약 전환",
        "후속 팔로업 관리"
      ],
      levelHints: [
        "주니어는 상담 응대와 후속 안내 비중이 큼",
        "시니어는 전환 설계와 고난도 고객 설득 비중이 큼"
      ]
    },
    {
      id: "RETAIL_CHANNEL_MANAGER",
      label: "유통 영업 담당",
      aliases: [
        "유통 영업",
        "채널 영업",
        "retail channel manager"
      ],
      family: "CHANNEL_RETAIL_B2C_SALES",
      responsibilityHints: [
        "유통 채널 관리",
        "판매점 실적 관리",
        "판촉 및 입점 조건 협의",
        "파트너 교육과 지원"
      ],
      levelHints: [
        "주니어는 채널 운영 지원과 현장 점검 비중이 큼",
        "시니어는 채널 전략과 주요 거래처 협상 비중이 큼"
      ]
    }
  ],
  axes: [
    {
      axisId: "CUSTOMER_CONTACT_MODE",
      label: "고객 접점 방식",
      values: [
        "방문 고객 응대",
        "직접 찾아가는 개척",
        "상담 유입 전환",
        "채널을 통한 간접 판매"
      ]
    },
    {
      axisId: "PRIMARY_SALES_MOTION",
      label: "주요 영업 방식",
      values: [
        "현장 설득과 즉시 판매",
        "외부 접점 확보와 첫 계약",
        "상담과 팔로업 전환",
        "유통 채널 운영과 실적 확대"
      ]
    },
    {
      axisId: "WORKFLOW_WEIGHT",
      label: "업무 무게중심",
      values: [
        "매장 실적과 현장 대응",
        "활동량과 개척 성과",
        "상담 품질과 전환율",
        "파트너 관리와 판매 정책"
      ]
    },
    {
      axisId: "SALES_ENVIRONMENT",
      label: "영업 환경",
      values: [
        "오프라인 매장·현장",
        "외부 행사·지역 개척",
        "상담센터·예약·방문 상담",
        "대리점·가맹점·판매점 네트워크"
      ]
    }
  ],
  adjacentFamilies: [
    "일반영업",
    "B2B 영업",
    "파트너영업 / 채널영업",
    "고객상담 / CS",
    "서비스운영",
    "운영관리"
  ],
  boundaryHints: [
    "매장에 들어온 고객을 응대하고 즉시 구매를 전환하는 비중이 많아지면 매장·현장 응대형 영업으로 읽힙니다.",
    "직접 고객을 찾아가 신규 접점을 만들고 첫 계약을 만드는 비중이 커지면 방문·외부개척형 B2C 영업으로 이동합니다.",
    "문의 고객이나 유입 고객을 상담해 계약으로 바꾸는 비중이 커지면 상담·전환형 B2C 영업으로 이동합니다.",
    "판매점, 가맹점, 대리점 같은 유통 채널을 통해 매출을 만드는 비중이 커지면 채널·유통형 B2C 영업으로 이동합니다.",
    "판매 책임보다 단순 문의 응대와 불만 처리 비중이 커지면 고객상담/CS로 이동합니다.",
    "채널이 소비자 판매점이 아니라 기업 파트너 구조로 바뀌면 B2B 채널 영업 경계로 이동합니다.",
    "운영 지원과 현장 관리만 남고 직접 판매 책임이 약해지면 운영관리 또는 영업지원 경계로 이동합니다."
  ],
  summaryTemplate: "이 직무는 개인고객을 대상으로 구매나 계약을 만들어내는 B2C 영업 성격이 강합니다. 다만 실제 역할은 매장 응대형, 외부 개척형, 상담 전환형, 채널·유통형으로 나뉘며 작동 방식이 달라집니다. 반면 단순 고객응대나 운영 지원 비중이 커지면 다른 경계로 읽힐 수 있습니다."
};
