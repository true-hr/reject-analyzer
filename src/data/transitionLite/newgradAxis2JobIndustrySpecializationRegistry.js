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

  }),

});

export function getNewgradAxis2JobIndustrySpecialization(archetypeKey, subVertical) {
  const key = String(archetypeKey || "").trim();
  const sv = String(subVertical || "").trim().toUpperCase();
  if (!key || !sv) return null;
  return NEWGRAD_AXIS2_JOB_INDUSTRY_SPEC[key]?.[sv] ?? null;
}
