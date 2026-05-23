// @MX:ANCHOR: [AUTO] Axis2 job-aware industry specialization registry
// @MX:REASON: Overrides the 12 semantic guidance fields per (archetypeKey, subVertical) pair;
//             generic industry archetype fallback remains intact when no entry exists.

const NEWGRAD_AXIS2_JOB_INDUSTRY_SPEC = Object.freeze({

  pharmaceutical: Object.freeze({

    QUALITY_CONTROL: Object.freeze({
      // Row 1 — background
      backgroundWeakEvidenceText:
        "약학·생명과학 배경이 있지만, GMP 환경에서 원료·공정·완제품 시험이 어떻게 설계되고 기준이 어떻게 적용되는지는 아직 명확하지 않습니다.",
      backgroundModerateEvidenceText:
        "분석화학·미생물학 학습이 있어 시험 원리는 이해할 근거가 있으나, 시험법 밸리데이션, 기준값 설정 근거, OOS 처리 절차까지는 더 필요합니다.",
      backgroundStrongEvidenceText:
        "약학·생명과학 배경과 실험 분석 경험이 함께 보여, QC 시험 기준 이해와 결과 판정의 기초 근거로 이어질 수 있습니다.",
      backgroundLimitText:
        "다만 실제 QC 업무에서 (1) 시험법 설정과 밸리데이션 근거, (2) OOS·일탈 발생 시 조사 절차, (3) 안정성시험 프로토콜과 배치 출하 판정 흐름까지 이해했다는 근거는 더 필요합니다.",

      // Row 2 — work context
      workContextWeakEvidenceText:
        "제약 QC 업무 환경을 보여주는 직접 경험이 아직 명확하지 않습니다.",
      workContextModerateEvidenceText:
        "실험·분석 관련 경험이 일부 감지되나, GMP 체계 안에서 원료·공정·완제 시험을 수행하고 배치 출하 판정에 기여한 경험까지는 확인이 필요합니다.",
      workContextStrongEvidenceText:
        "GMP 환경에서 시험 수행, 기준 적합성 판정, 이상 결과 조사 등 QC 핵심 업무를 경험한 근거가 보입니다.",
      workContextLimitText:
        "(1) 시험 항목별 기준값 설정과 밸리데이션 이력, (2) OOS·일탈 발생 시 조사·조치 절차, (3) 안정성시험 결과 해석과 배치 출하 판정 기준, (4) 데이터 무결성과 GMP 문서화 요건 같은 각도를 심화하세요.",

      // Row 3 — repeatability
      weakEvidenceText:
        "제약 QC 환경에 대한 반복 노출은 아직 제한적으로 읽힙니다.",
      moderateEvidenceText:
        "실험·분석 또는 품질 관련 경험이 일부 반복되어 QC 관련 맥락이 보이기 시작합니다.",
      strongEvidenceText:
        "GMP 기반 시험·검사 환경에 여러 차례 노출된 근거가 반복적으로 확인됩니다.",
      repeatabilityLimitText:
        "(1) 원료·공정·완제별 시험 항목 차이, (2) OOS와 일탈의 구분 및 처리 절차, (3) 안정성시험 설계(가속·장기)와 결과 해석, (4) 배치 출하 판정 기준과 QC 책임 범위 같은 각도를 심화하세요.",
    }),

    QUALITY_ASSURANCE_QA: Object.freeze({
      // Row 1 — background
      backgroundWeakEvidenceText:
        "품질 관련 배경이 있지만, GMP 품질시스템에서 SOP 관리, 변경관리, 감사 대응이 어떻게 운영되는지는 아직 명확하지 않습니다.",
      backgroundModerateEvidenceText:
        "규제 또는 품질 관련 학습이 있어 GMP 기준 이해의 근거는 있으나, 품질시스템 운영, 일탈·CAPA 연계, 문서 신뢰성 관리까지는 더 필요합니다.",
      backgroundStrongEvidenceText:
        "품질 체계나 규제 구조에 대한 이해가 GMP 기반 QA 업무의 기초 근거로 이어질 수 있습니다.",
      backgroundLimitText:
        "다만 실제 QA 업무에서 (1) SOP 작성·개정·폐기 절차, (2) 일탈 발행부터 CAPA 완료까지의 흐름, (3) 내부감사·공급업체 감사 방법론, (4) 규제기관 실사 대응 경험까지 이해했다는 근거는 더 필요합니다.",

      // Row 2 — work context
      workContextWeakEvidenceText:
        "제약 QA 업무 환경을 보여주는 직접 경험이 아직 명확하지 않습니다.",
      workContextModerateEvidenceText:
        "품질 관련 경험이 일부 감지되나, GMP 체계에서 SOP 관리, 일탈·CAPA, 변경관리를 주도한 경험까지는 확인이 필요합니다.",
      workContextStrongEvidenceText:
        "GMP 품질시스템 운영, 일탈·CAPA 처리, 내부감사 또는 외부실사 대응 등 QA 핵심 역할을 경험한 근거가 보입니다.",
      workContextLimitText:
        "(1) 변경관리 절차와 위험 평가 방법, (2) 일탈 조사와 CAPA 근거 문서화, (3) 내부·외부(규제기관) 감사 준비와 대응 경험, (4) 문서 신뢰성(데이터 무결성) 관리 원칙 같은 각도를 심화하세요.",

      // Row 3 — repeatability
      weakEvidenceText:
        "제약 품질시스템 환경에 대한 반복 노출은 아직 제한적으로 읽힙니다.",
      moderateEvidenceText:
        "품질 또는 규제 관련 경험이 일부 반복되어 QA 관련 맥락이 형성되기 시작합니다.",
      strongEvidenceText:
        "GMP 품질시스템, 감사, 문서화 환경에 여러 차례 노출된 근거가 반복적으로 확인됩니다.",
      repeatabilityLimitText:
        "(1) SOP 생애주기 관리와 문서 통제 절차, (2) 일탈 유형별(공정·시험·환경) 처리 차이, (3) 감사 유형(내부·고객사·규제기관)별 준비 방식, (4) 품질시스템 KPI와 CAPA 유효성 검증 방법 같은 각도를 심화하세요.",
    }),

    PRODUCTION_MANAGEMENT: Object.freeze({
      // Row 1 — background
      backgroundWeakEvidenceText:
        "공학·생산 관련 배경이 있지만, GMP 환경에서 배치 생산, 제조기록, 수율 관리가 어떻게 운영되는지는 아직 명확하지 않습니다.",
      backgroundModerateEvidenceText:
        "공정 또는 생산 관련 학습이 있어 제조 환경 이해의 근거는 있으나, 배치 기록 관리, 수율 모니터링, GMP 생산 일정 계획까지는 더 필요합니다.",
      backgroundStrongEvidenceText:
        "생산공정이나 제조 환경에 대한 이해가 GMP 기반 생산관리 역할의 기초 근거로 이어질 수 있습니다.",
      backgroundLimitText:
        "다만 실제 생산관리 업무에서 (1) 배치 기록과 제조 지시서 관리, (2) 생산 일정과 원부자재 공급 연계, (3) 수율 편차 분석과 공정 이상 대응, (4) GMP 생산 환경 유지와 이탈 관리까지 이해했다는 근거는 더 필요합니다.",

      // Row 2 — work context
      workContextWeakEvidenceText:
        "제약 생산관리 업무 환경을 보여주는 직접 경험이 아직 명확하지 않습니다.",
      workContextModerateEvidenceText:
        "생산 또는 공정 관련 경험이 일부 감지되나, GMP 환경에서 배치 생산을 계획·실행하고 제조기록과 수율을 관리한 경험까지는 확인이 필요합니다.",
      workContextStrongEvidenceText:
        "GMP 생산 환경에서 배치 계획·실행, 제조기록 관리, 수율 모니터링 등 생산관리 핵심 역할을 경험한 근거가 보입니다.",
      workContextLimitText:
        "(1) 배치 기록(BMR) 작성·검토·승인 절차, (2) 생산 일정과 원부자재·설비 가용성 연계, (3) 수율 이상과 OOS 연계 조사 절차, (4) 공급 안정성 관리와 재고 버퍼 운영 방식 같은 각도를 심화하세요.",

      // Row 3 — repeatability
      weakEvidenceText:
        "제약 생산 환경에 대한 반복 노출은 아직 제한적으로 읽힙니다.",
      moderateEvidenceText:
        "생산·공정 관련 경험이 일부 반복되어 GMP 생산 맥락이 형성되기 시작합니다.",
      strongEvidenceText:
        "GMP 배치 생산, 제조기록, 공급 흐름에 여러 차례 노출된 근거가 반복적으로 확인됩니다.",
      repeatabilityLimitText:
        "(1) 배치 크기·유형(파일럿·상업)별 생산 운영 차이, (2) 원부자재 수급 계획과 공급사 관리 연계, (3) 생산 KPI(수율·가동률·납기)와 이상 대응 기준, (4) GMP 청소·소독·환경 모니터링 주기 관리 방식 같은 각도를 심화하세요.",
    }),

    DIGITAL_MARKETING: Object.freeze({
      // Row 1 — background
      backgroundWeakEvidenceText:
        "마케팅·커뮤니케이션 배경이 있지만, 전문의약품·일반의약품의 규제 범위 안에서 학술 근거를 기반으로 메시지를 설계하는 구조는 아직 명확하지 않습니다.",
      backgroundModerateEvidenceText:
        "마케팅·커뮤니케이션 학습이 있어 메시지 설계와 채널 운영의 기초는 있으나, 의약품 규제 범위, 적응증 기반 메시지, HCP 대상 학술 접근 방식까지는 더 필요합니다.",
      backgroundStrongEvidenceText:
        "마케팅 배경과 함께 의약품 또는 의료 관련 콘텐츠·규제 환경에 대한 이해가 함께 보입니다.",
      backgroundLimitText:
        "다만 실제 제약 마케팅 업무에서 (1) 식약처 광고·판촉 규제와 허용 메시지 기준, (2) 전문의약품과 일반의약품의 채널·규제 차이, (3) HCP(의사·약사) 대상 학술 근거 기반 접근 방식, (4) 처방 트렌드와 브랜드 성과 지표 해석까지 이해했다는 근거는 더 필요합니다.",

      // Row 2 — work context
      workContextWeakEvidenceText:
        "제약 마케팅 업무 환경을 보여주는 직접 경험이 아직 명확하지 않습니다.",
      workContextModerateEvidenceText:
        "마케팅 또는 콘텐츠 관련 경험이 일부 감지되나, 의약품 규제 범위 안에서 HCP·채널 대상 메시지를 설계하고 브랜드를 운영한 경험까지는 확인이 필요합니다.",
      workContextStrongEvidenceText:
        "의약품 규제 범위 내 마케팅, 학술 근거 기반 메시지 설계, HCP 또는 채널 대상 캠페인 운영 경험이 보입니다.",
      workContextLimitText:
        "(1) 전문의약품·일반의약품별 허용 판촉 방식과 규제 기준 차이, (2) 학술 근거(임상 데이터, 가이드라인)를 마케팅 메시지로 전환하는 방식, (3) 병원·약국·온라인 채널별 접근 전략과 의사결정 구조, (4) 처방 데이터와 시장점유율 분석을 마케팅 의사결정에 활용하는 방식 같은 각도를 심화하세요.",

      // Row 3 — repeatability
      weakEvidenceText:
        "제약 마케팅 환경에 대한 반복 노출은 아직 제한적으로 읽힙니다.",
      moderateEvidenceText:
        "마케팅 또는 규제 관련 경험이 일부 반복되어 제약 채널·메시지 맥락이 형성되기 시작합니다.",
      strongEvidenceText:
        "규제 범위 안의 의약품 마케팅, HCP 접근, 채널 운영에 여러 차례 노출된 근거가 반복적으로 확인됩니다.",
      repeatabilityLimitText:
        "(1) 전문의약품 대 일반의약품의 마케팅 규제 차이와 허용 채널, (2) 학술 심포지엄·디지털 채널별 HCP 접근 전략, (3) 처방 추적·브랜드 성과 KPI와 채널 최적화 기준, (4) 글로벌 사·국내 규제의 판촉 메시지 승인 프로세스 같은 각도를 심화하세요.",
    }),

    REGULATORY_AFFAIRS: Object.freeze({
      // Row 1 — background
      backgroundWeakEvidenceText:
        "RA·규제 관련 배경이 있더라도, 제약 허가자료 구조와 규정 요구사항이 실제 제출 자료에 어떻게 적용되는지는 아직 명확하지 않습니다.",
      backgroundModerateEvidenceText:
        "약학·규제 관련 학습이 있어 허가 근거 이해의 토대는 있으나, CTD/eCTD 구조·변경허가 판단·제출자료 정합성까지는 더 필요합니다.",
      backgroundStrongEvidenceText:
        "의약품 유효성·안전성·품질 근거를 함께 보는 이해가 제약 RA 업무의 기초 근거로 이어질 수 있습니다.",
      backgroundLimitText:
        "다만 실제 RA 업무에서 (1) 허가자료 구성과 CTD/eCTD 구조, (2) 변경허가·변경신고 판단 기준, (3) 규정 요구사항과 제품 자료의 정합성 검토, (4) 규제기관 질의 대응 흐름까지 이해했다는 근거는 더 필요합니다.",

      // Row 2 — work context
      workContextWeakEvidenceText:
        "제약 RA 업무 환경을 보여주는 직접 경험이 아직 명확하지 않습니다.",
      workContextModerateEvidenceText:
        "규제·문서 관련 경험이 일부 감지되나, 허가자료 작성·검토·변경관리·규제기관 커뮤니케이션까지는 확인이 필요합니다.",
      workContextStrongEvidenceText:
        "허가자료 검토, 변경허가 대응, 규제기관 질의 응답 등 RA 핵심 업무 경험이 보입니다.",
      workContextLimitText:
        "(1) 품목허가 신청 자료 구조와 제출 순서, (2) 변경허가/변경신고 판단과 자료 보완, (3) 질의응답 대응 및 근거 문서화, (4) 글로벌 규제와 국내 규정 차이 같은 각도를 심화하세요.",

      // Row 3 — repeatability
      weakEvidenceText:
        "제약 허가·규제 환경에 대한 반복 노출은 아직 제한적으로 읽힙니다.",
      moderateEvidenceText:
        "규제 또는 문서 관련 경험이 일부 반복되어 RA 맥락이 형성되기 시작합니다.",
      strongEvidenceText:
        "허가자료·변경관리·규제기관 대응 환경에 여러 차례 노출된 근거가 반복적으로 확인됩니다.",
      repeatabilityLimitText:
        "(1) CTD 모듈별 역할과 자료 연결, (2) 변경 유형별 제출 전략과 허가 이력 관리, (3) 규제기관 질의 유형별 대응 논리, (4) 유효성·안전성·품질 근거 간 정합성 검토 같은 각도를 심화하세요.",
    }),

  }),

  chemical_materials_battery: Object.freeze({

    CIRCUIT_DESIGN: Object.freeze({
      // Row 1 — background
      backgroundWeakEvidenceText:
        "전자·전기 배경이 감지되더라도, 화학·소재·배터리 산업에서 회로설계 역할이 어떤 맥락에서 요구되는지—배터리 전압·전류·온도 센싱, 보호회로, 충방전 제어, BMS 구조와 회로 학습이 어떻게 연결되는지—는 아직 명확하지 않습니다.",
      backgroundModerateEvidenceText:
        "전자·전기 전공을 기반으로 회로이론, 전자회로 또는 전력전자 관련 학습이 감지됩니다. 이 배경은 배터리 산업 회로설계와 연결될 수 있으나, 전압·전류·온도 센싱, 보호회로, 충방전 제어, BMS 구조와의 연결로 확장해 설명했는지는 추가 확인이 필요합니다.",
      backgroundStrongEvidenceText:
        "전자·전기 전공과 함께 회로이론, 전력전자, 계측, 제어 등 배터리 산업 회로설계와 연결되는 배경이 보입니다. 전압·전류·온도 센싱, 보호회로, BMS 구조와의 연결을 설명할 수 있는 기초 근거로 이어질 수 있습니다.",
      backgroundLimitText:
        "다만 전공 배경이 배터리 산업 회로설계 맥락과 연결된다는 근거를 더 보이려면, (1) 전압·전류·온도 측정 회로와 학습의 연결, (2) 보호회로·BMS 구조에 대한 이해가 어떻게 형성됐는지, (3) 충방전 제어, 발열, 안전성 관점에서 회로 신뢰성을 어떻게 이해했는지까지 확장해 설명할 필요가 있습니다.",

      // Row 2 — work context
      workContextWeakEvidenceText:
        "배터리 산업에서 회로설계 관련 역할을 경험했다고 보이는 근거가 아직 명확하지 않습니다. 전자회로나 측정 관련 경험이 보이더라도, 배터리 전압·전류·온도 센싱, 보호회로 동작, 충방전 제어, 열관리, 안전성·신뢰성 검증 맥락까지는 추가 확인이 필요합니다.",
      workContextModerateEvidenceText:
        "회로 또는 전자회로 관련 경험이 일부 감지됩니다. 배터리 산업의 회로설계는 회로가 단순히 동작하는지뿐 아니라 배터리 전압·전류·온도 측정값이 안정적으로 수집되는지, 과전압·과전류·과열 상황에서 보호회로가 어떻게 반응하는지, 충방전 조건에서 회로가 신뢰성 있게 동작하는지를 함께 다루기 때문에, 이런 맥락까지 경험했는지는 추가 확인이 필요합니다.",
      workContextStrongEvidenceText:
        "배터리 전압·전류·온도 측정, 보호회로 설계·검증, 충방전 제어 또는 BMS 관련 회로 경험이 보입니다. 이러한 근거가 있다면 배터리 산업의 회로설계 실무 조건을 이해할 가능성이 비교적 높게 읽힙니다.",
      workContextLimitText:
        "(1) 배터리 전압·전류·온도 측정 회로의 정확도·안정성 확인 방법, (2) 과전압·과전류·과열 이상 상황에서의 보호회로 동작 검증, (3) 충방전 조건과 발열 리스크 속에서의 회로 신뢰성 확인, (4) BMS 또는 배터리 시스템 구조에서 회로가 담당하는 역할과 인터페이스 같은 각도를 심화하세요.",

      // Row 3 — repeatability
      weakEvidenceText:
        "배터리 산업의 회로설계 맥락에 대한 반복 노출은 아직 제한적으로 읽힙니다.",
      moderateEvidenceText:
        "전자회로, 계측, 전력전자 또는 제어 관련 경험이 일부 반복되어 배터리 산업 회로설계 맥락이 형성되기 시작합니다.",
      strongEvidenceText:
        "배터리 전압·전류·온도 센싱, 보호회로, 충방전 제어 또는 BMS 환경에서 회로설계 역할을 여러 차례 경험한 근거가 반복적으로 확인됩니다.",
      repeatabilityLimitText:
        "(1) BMS 구조 학습이나 프로젝트, (2) 보호회로 또는 전원회로 설계 경험, (3) 전압·전류·온도 측정 및 오실로스코프·멀티미터 기반 검증, (4) 충방전·발열·안전 이슈를 회로 관점으로 정리한 경험, (5) 안전성·신뢰성 검증과 이상 상황 대응 관점 같은 각도를 정리하세요.",
    }),

  }),

  ai_data_cloud: Object.freeze({

    PROJECT_MANAGEMENT: Object.freeze({
      // Row 1 — background
      backgroundWeakEvidenceText:
        "프로젝트관리 관련 배경이 있더라도, AI/데이터/클라우드 환경에서 PM/PO/PL이 일정·범위 관리만으로는 부족하고 데이터 흐름·모델 학습·인프라·보안 검토까지 함께 다뤄야 한다는 점은 아직 명확하지 않습니다.",
      backgroundModerateEvidenceText:
        "경영·산업공학·통계·데이터 관련 학습이 있어 일정·자원·지표 관리의 기초 근거는 있으나, AI/데이터/클라우드 산업에서는 PoC→운영 전환, 데이터 품질, 모델 성능 관리, 보안·권한·비용 구조까지 PM/PO가 함께 봐야 한다는 점은 더 확인이 필요합니다.",
      backgroundStrongEvidenceText:
        "프로젝트관리 배경과 함께 데이터·AI·클라우드 관련 학습이나 프로젝트 경험이 함께 보여, PM/PO/PL이 단순 일정 관리가 아니라 데이터 파이프라인·모델·인프라 관점을 이해해야 한다는 점의 기초 근거로 이어질 수 있습니다.",
      backgroundLimitText:
        "다만 실제 AI/데이터/클라우드 PM/PO 업무에서 (1) PoC와 운영 전환 사이의 일정·범위 차이, (2) 데이터 품질·라벨링·재학습 주기를 일정에 반영하는 방식, (3) 클라우드 인프라 비용과 성능 트레이드오프, (4) 보안·권한·규제 검토가 일정에 미치는 영향까지 이해했다는 근거는 더 필요합니다.",

      // Row 2 — work context
      workContextWeakEvidenceText:
        "AI/데이터/클라우드 영역에서 PM/PO/PL로서 데이터 흐름·모델 실험·인프라·운영 안정성을 함께 다룬 직접 경험이 아직 명확하지 않습니다.",
      workContextModerateEvidenceText:
        "B2C 플랫폼이나 일반 IT 환경에서 PM/PO 또는 기획 경험이 일부 감지되어, 기능 정의·요구사항·우선순위 조율의 기초는 있을 수 있습니다. 다만 AI/데이터/클라우드에서는 데이터셋 준비, 모델 성능 검증, 클라우드 비용·보안 검토, B2B 도입 결정 구조 같은 PM/PO 작업 조건이 추가되기 때문에 이러한 맥락까지 경험했는지는 확인이 필요합니다.",
      workContextStrongEvidenceText:
        "AI/데이터/클라우드 프로젝트에서 데이터 파이프라인 일정 조율, 모델 학습·평가 관리, 인프라 비용 관리, 보안·권한 검토 같은 업무를 PM/PO 입장에서 다룬 근거가 보입니다. B2C 플랫폼의 A/B 테스트·퍼널·리텐션 기반 의사결정 경험이 함께 있다면 데이터 기반 제품 PM/PO 문맥으로 일부 전이될 수 있습니다.",
      workContextLimitText:
        "(1) 모델 학습·평가·재학습 주기와 릴리즈 일정의 정렬, (2) 데이터 품질 이슈 발생 시 일정·범위 재조정 방법, (3) 클라우드 인프라 선택과 비용 최적화 협의, (4) 보안·권한·규제(고객사 IT 검토 포함) 일정 반영, (5) PoC→상용 운영 전환 시 KPI와 책임 범위 정의 같은 각도를 심화하세요.",

      // Row 3 — repeatability
      weakEvidenceText:
        "AI/데이터/클라우드 PM/PO 환경에 대한 반복 노출은 아직 제한적으로 읽힙니다.",
      moderateEvidenceText:
        "데이터 기반 제품 개선이나 기술 조직과의 협업 경험이 일부 반복되어 AI/데이터/클라우드 PM/PO 맥락이 형성되기 시작합니다.",
      strongEvidenceText:
        "데이터셋·모델·클라우드 인프라·보안·운영 안정성을 함께 다루는 PM/PO 환경에 여러 차례 노출된 근거가 반복적으로 확인됩니다.",
      repeatabilityLimitText:
        "(1) B2C 플랫폼 PM 경험과 B2B AI/데이터/클라우드 PM의 의사결정 구조 차이, (2) 도입 고객(IT·보안·현업)의 검토 흐름과 일정 영향, (3) 모델·데이터 품질 이슈가 발생했을 때의 우선순위 재조정, (4) 클라우드 비용·성능·안정성을 함께 보는 트레이드오프, (5) PoC→운영 전환 단계의 책임 범위 정의 같은 각도를 정리하세요.",
    }),

    SERVICE_PLANNING: Object.freeze({
      // Row 1 — background
      backgroundWeakEvidenceText:
        "서비스기획·프로덕트 기획 관련 배경이 있더라도, AI/데이터/클라우드 제품에서 기능 기획이 데이터 흐름·모델 성능·운영 안정성과 어떻게 묶여 움직이는지는 아직 명확하지 않습니다.",
      backgroundModerateEvidenceText:
        "UX·서비스기획·데이터 분석 관련 학습이나 경험이 있어 사용자 흐름·요구사항 정리의 기초 근거는 있으나, AI/데이터/클라우드 제품에서는 데이터 가용성, 모델 한계, PoC 결과 해석, B2B 도입 의사결정 구조까지 기획자가 함께 봐야 한다는 점은 더 확인이 필요합니다.",
      backgroundStrongEvidenceText:
        "서비스기획·UX 배경과 함께 데이터·AI·클라우드 학습이나 프로젝트 경험이 함께 보여, 기능 기획이 데이터·모델·운영 관점과 함께 움직여야 한다는 점의 기초 근거로 이어질 수 있습니다.",
      backgroundLimitText:
        "다만 실제 AI/데이터/클라우드 기획 업무에서 (1) 데이터 가용성·품질이 기능 정의에 미치는 영향, (2) 모델 정확도·지연·비용을 사용자 시나리오에 반영하는 방식, (3) PoC 결과를 상용 기능으로 전환할 때의 의사결정 구조, (4) B2B 고객의 보안·권한·규제 요구가 기능 설계를 어떻게 제약하는지까지 이해했다는 근거는 더 필요합니다.",

      // Row 2 — work context
      workContextWeakEvidenceText:
        "AI/데이터/클라우드 제품에서 기획자(서비스기획·프로덕트 기획·UX 서비스 설계) 입장으로 데이터·모델·운영을 함께 고려한 직접 경험이 아직 명확하지 않습니다.",
      workContextModerateEvidenceText:
        "B2C 플랫폼 UX·서비스기획 경험에서 사용자 흐름·요구사항 정리·A/B 테스트·퍼널·리텐션 분석 같은 데이터 기반 제품 개선 경험이 일부 감지됩니다. 이러한 신호는 AI/데이터/클라우드 제품 기획 문맥으로 일부 전이될 수 있으나, B2B 도입 구조·기술 조직 협업·보안/규제 검토·운영 안정성 측면의 경험까지는 별도로 확인이 필요합니다.",
      workContextStrongEvidenceText:
        "데이터·모델·인프라가 함께 움직이는 제품에서 기능 정의, 데이터 요건 정리, 모델 결과 해석, 운영 시나리오 설계 같은 기획 업무를 다룬 근거가 보입니다. B2C 플랫폼의 데이터 기반 UX 개선 경험과 이러한 B2B AI 제품 기획 경험이 함께 있다면 산업 전이 가능성이 더 명확하게 읽힙니다.",
      workContextLimitText:
        "(1) 데이터셋·라벨링·품질이 기능 가용성에 미치는 영향, (2) 모델 한계(정확도·지연·비용)를 사용자 시나리오로 풀어내는 방식, (3) PoC 결과 검증과 상용 기능 전환 의사결정, (4) B2B 도입 고객의 IT·보안·현업 의사결정 구조와 요구사항 우선순위 조율, (5) 운영 단계의 데이터 모니터링·재학습 트리거 정의 같은 각도를 심화하세요.",

      // Row 3 — repeatability
      weakEvidenceText:
        "AI/데이터/클라우드 제품 기획 환경에 대한 반복 노출은 아직 제한적으로 읽힙니다.",
      moderateEvidenceText:
        "데이터 기반 제품 개선, A/B 테스트, 퍼널·리텐션 분석 같은 B2C 플랫폼 기획 경험이 일부 반복되어 AI/데이터/클라우드 제품 기획 맥락과 부분적으로 연결되기 시작합니다.",
      strongEvidenceText:
        "데이터·모델·인프라·운영을 함께 고려하는 제품 기획 환경에 여러 차례 노출된 근거가 반복적으로 확인됩니다.",
      repeatabilityLimitText:
        "(1) B2C 플랫폼 기획 경험과 B2B AI 제품 기획의 의사결정 구조 차이, (2) 모델·데이터 한계가 기능 정의에 미치는 영향, (3) PoC→상용 전환 시 기획자가 정의해야 할 KPI와 검증 기준, (4) B2B 고객의 보안·권한·규제 요구가 화면·정책에 반영되는 방식, (5) 운영 단계의 데이터 모니터링·재학습·롤백 기준 정의 같은 각도를 정리하세요.",
    }),

  }),

  biotechnology: Object.freeze({

    QUALITY_CONTROL: Object.freeze({
      // Row 1 — background
      backgroundWeakEvidenceText:
        "생명과학·바이오 관련 배경이 있지만, 바이오 제품의 품질 기준, 시험법, 안정성·무균 관리가 실제 QC 판단에 어떻게 적용되는지는 아직 명확하지 않습니다.",
      backgroundModerateEvidenceText:
        "생명과학·바이오공학·실험 분석 배경이 있어 시험 원리와 생물학적 특성을 이해할 근거는 있으나, 원액·완제 품질 기준, 시험법 적합성, 무균·오염 관리, 문서화 기준까지는 더 확인이 필요합니다.",
      backgroundStrongEvidenceText:
        "생명과학·바이오 배경과 분석·실험 경험이 함께 보여, 바이오 제품의 시험 기준과 품질 판정 구조를 이해하는 기초 근거로 이어질 수 있습니다.",
      backgroundLimitText:
        "다만 실제 바이오 QC 업무에서 (1) 원액·완제별 시험 항목과 기준값, (2) 무균·미생물·단백질·세포 기반 시험의 차이, (3) 안정성시험과 시험법 적합성, (4) 결과 기록과 GMP 문서화 요건까지 이해했다는 근거는 더 필요합니다.",

      // Row 2 — work context
      workContextWeakEvidenceText:
        "현재 입력에서는 바이오 QC 업무 환경을 직접 경험했다고 보기는 어렵습니다. 실험이나 생명과학 배경은 감지되지만, 품질 기준에 따라 시험 결과를 기록·판정하고 일탈이나 이상 결과를 다루는 QC 맥락은 아직 확인이 필요합니다.",
      workContextModerateEvidenceText:
        "실험·분석 또는 바이오 관련 경험이 일부 감지되어 QC 업무의 기초와 연결될 수 있습니다. 다만 실제 바이오 QC는 원액·완제 시험, 무균·오염 관리, 안정성시험, 결과 기록과 문서화를 품질 기준 안에서 다루기 때문에 이러한 업무 조건까지 경험했는지는 추가 확인이 필요합니다.",
      workContextStrongEvidenceText:
        "바이오 제품의 시험·검사, 품질 기준 확인, 결과 기록, 안정성 또는 무균 관리와 관련된 경험이 보입니다. 이러한 근거가 있다면 바이오 QC의 실제 업무 조건을 이해할 가능성이 비교적 높게 읽힙니다.",
      workContextLimitText:
        "(1) 원액·완제별 시험 항목과 기준 적합성 판단, (2) 무균·미생물·오염 관리 기준, (3) 안정성시험과 시험 결과 기록 방식, (4) OOS·일탈 발생 시 조사와 문서화 절차, (5) GMP 또는 품질시스템 안에서 QC가 담당하는 책임 범위를 심화하세요.",

      // Row 3 — repeatability
      weakEvidenceText:
        "바이오 품질관리 환경에 대한 반복 노출은 아직 제한적으로 읽힙니다.",
      moderateEvidenceText:
        "바이오 실험·분석 또는 품질 관련 경험이 일부 반복되어 QC 관련 맥락이 형성되기 시작합니다.",
      strongEvidenceText:
        "바이오 제품의 시험 기준, 안정성, 무균·오염 관리, 문서화 환경에 여러 차례 노출된 근거가 반복적으로 확인됩니다.",
      repeatabilityLimitText:
        "(1) 바이오 제품 유형별 품질 기준 차이, (2) 세포·단백질·미생물 시험의 판정 기준, (3) 안정성시험과 시험법 적합성, (4) 원액·완제 시험 결과 기록과 문서화, (5) 품질 기준을 벗어난 결과가 발생했을 때의 OOS·일탈 처리 흐름을 정리하세요.",
    }),

  }),

});

export function getNewgradAxis2JobIndustrySpecialization(archetypeKey, subVertical) {
  const key = String(archetypeKey || "").trim();
  const sv = String(subVertical || "").trim().toUpperCase();
  if (!key || !sv) return null;
  return NEWGRAD_AXIS2_JOB_INDUSTRY_SPEC[key]?.[sv] ?? null;
}
