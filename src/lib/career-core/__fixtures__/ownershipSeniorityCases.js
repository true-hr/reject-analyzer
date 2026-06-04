export const ownershipSeniorityCases = Object.freeze([
  {
    id: "ownership_01_accounting_admin_excel_entry",
    title: "같은 엑셀 산출물이지만 경리/회계보조 수준인 케이스",
    resumeInput: {
      roleTitle: "경리 사무원",
      artifact: "월별 매입/매출 엑셀 정리표",
      description: [
        "거래처별 세금계산서와 영수증을 취합해 월별 매입/매출 엑셀 파일로 정리",
        "정해진 양식에 맞춰 금액, 일자, 거래처명을 입력하고 누락 자료를 담당자에게 요청",
        "회계 담당자가 검토할 수 있도록 증빙 파일명을 정리하고 폴더에 보관",
      ],
      context: {
        decisionAuthority: "none",
        reviewStructure: "senior_review_required",
        accountingJudgment: "not_evidenced",
      },
    },
  },
  {
    id: "ownership_02_senior_accountant_excel_close_pack",
    title: "같은 엑셀 산출물이지만 시니어 회계사/결산 담당 수준인 케이스",
    resumeInput: {
      roleTitle: "시니어 회계 담당자",
      artifact: "월마감 결산 검토 엑셀 패키지",
      description: [
        "월마감 시 매출, 매입, 미수금, 미지급금 계정별 원장과 보조명세를 대사",
        "전월 대비 차이와 비정상 변동 항목을 분석해 조정 전표 필요 여부를 판단",
        "감사 대응을 위해 주요 계정별 산출 근거와 증빙 링크를 결산 검토 파일에 정리",
        "대표와 외부 회계법인에 월마감 이슈와 재무 영향도를 설명",
      ],
      context: {
        decisionAuthority: "lead",
        reviewStructure: "owns_close_review",
        accountingJudgment: "explicit",
      },
    },
  },
  {
    id: "ownership_03_finance_analyst_excel_forecast_model",
    title: "엑셀을 쓰지만 회계가 아니라 재무분석/예측 모델링인 케이스",
    resumeInput: {
      roleTitle: "재무분석 담당자",
      artifact: "매출 예측 엑셀 모델",
      description: [
        "월별 매출, 객단가, 재구매율 데이터를 기반으로 분기 매출 예측 모델을 작성",
        "시나리오별 매출 민감도를 분석해 영업 목표와 예산 배분 회의에 제공",
        "경영진 요청에 따라 보수/기준/공격 시나리오를 비교하고 리스크 요인을 설명",
      ],
      context: {
        decisionAuthority: "recommend",
        reviewStructure: "executive_review",
        accountingJudgment: "not_primary",
      },
    },
  },
  {
    id: "ownership_04_hr_ops_excel_payroll_support",
    title: "엑셀 산출물이 HR 운영/급여 보조인 케이스",
    resumeInput: {
      roleTitle: "HR 운영 담당자",
      artifact: "근태/급여 기초자료 엑셀",
      description: [
        "직원별 근태, 연차, 초과근무 시간을 취합해 급여 계산 전 기초자료를 정리",
        "누락된 근태 신청과 승인 상태를 확인해 부서별 담당자에게 재요청",
        "노무사무소 전달 전 급여 기초자료의 형식 오류와 중복 입력을 점검",
      ],
      context: {
        decisionAuthority: "support",
        reviewStructure: "outsourced_payroll_review",
        accountingJudgment: "not_applicable",
      },
    },
  },
  {
    id: "ownership_05_product_ops_excel_funnel_report",
    title: "엑셀 산출물이 서비스 운영/제품 개선 근거인 케이스",
    resumeInput: {
      roleTitle: "서비스 운영 매니저",
      artifact: "가입 퍼널 주간 리포트 엑셀",
      description: [
        "가입 단계별 전환율과 이탈 지점을 주간 엑셀 리포트로 정리",
        "반복 이탈 구간을 발견해 온보딩 문구와 알림 타이밍 개선안을 제안",
        "개선 배포 후 전환율 변화를 추적해 제품팀과 후속 실험 우선순위를 논의",
      ],
      context: {
        decisionAuthority: "recommend_and_follow_up",
        reviewStructure: "cross_functional_review",
        accountingJudgment: "not_applicable",
      },
    },
  },
  {
    id: "ownership_06_ambiguous_excel_only",
    title: "엑셀 사용만 있고 직무 깊이/소유권을 판단할 수 없는 케이스",
    resumeInput: {
      roleTitle: "사무보조",
      artifact: "엑셀 자료 정리",
      description: [
        "엑셀을 활용해 자료를 정리",
        "팀에서 요청한 파일을 취합하고 표 형태로 정리",
      ],
      context: {
        decisionAuthority: "unknown",
        reviewStructure: "unknown",
        accountingJudgment: "unknown",
      },
    },
  },
]);
