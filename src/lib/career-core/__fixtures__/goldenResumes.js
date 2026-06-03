export const careerCoreGoldenResumes = Object.freeze([
  {
    caseId: "golden_01_direct_service_planner",
    title: "정석 유관 경력자 - 커리어 플랫폼 서비스기획",
    intent: [
      "서비스기획, PM, PO를 엉뚱하게 분리하지 않는지 확인한다.",
      "B2B SaaS와 커리어 플랫폼 산업 신호를 놓치지 않는지 확인한다.",
      "정량 성과가 있는데 weak_metric_evidence로 과잉 리스크 처리하지 않는지 확인한다.",
    ],
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      candidateLabel: "김서윤",
      experiences: [
        {
          id: "golden-01-exp-01",
          company: "넥스트커리어랩",
          title: "서비스기획자",
          startDate: "2020-03",
          endDate: "2023-08",
          bullets: [
            {
              text: "B2B SaaS 기반 커리어 플랫폼의 이력서 진단, 상담 예약, 기업 관리자 화면 요구사항을 정의하고 화면 정책을 정리했다.",
              evidenceType: "strong",
            },
            {
              text: "지원자 온보딩 퍼널을 개편해 무료 진단 완료율을 38%에서 54%로 높이고 유료 상담 전환율을 11%에서 18%로 개선했다.",
              evidenceType: "metric",
            },
            {
              text: "PO, 디자이너, 프론트엔드, 백엔드, 커리어 컨설턴트와 릴리즈 범위를 조율하고 QA 체크리스트를 운영했다.",
              evidenceType: "strong",
            },
          ],
        },
        {
          id: "golden-01-exp-02",
          company: "커리어온",
          title: "주니어 서비스기획자",
          startDate: "2018-07",
          endDate: "2020-02",
          bullets: [
            {
              text: "교육/커리어 서비스의 수강 신청, 취업 코칭 신청, 상담 배정 운영 화면을 기획했다.",
              evidenceType: "strong",
            },
            {
              text: "상담 배정 템플릿과 운영 플로우를 표준화해 담당자 수기 확인 시간을 월 32시간 줄였다.",
              evidenceType: "metric",
            },
          ],
        },
      ],
    },
  },
  {
    caseId: "golden_02_career_consulting_to_service_planning",
    title: "직무 전환 가능자 - 이직코칭 운영에서 서비스기획 인접",
    intent: [
      "상담/코칭 운영을 단순 CS로 낮게 해석하지 않는지 확인한다.",
      "운영 프로세스 개선을 서비스기획 신호로 볼 수 있는지 확인한다.",
      "커리어 교육, HR, 취업 컨설팅 산업을 연결해서 보는지 확인한다.",
    ],
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      candidateLabel: "박민재",
      experiences: [
        {
          id: "golden-02-exp-01",
          company: "트루커리어파트너스",
          title: "이직코칭 운영 매니저",
          startDate: "2021-01",
          endDate: "2024-12",
          bullets: [
            {
              text: "이직코칭 프로그램의 초기 진단, 컨설턴트 매칭, 상담 일정, 후속 과제 운영 프로세스를 관리했다.",
              evidenceType: "strong",
            },
            {
              text: "상담 신청 후 첫 코칭까지 걸리는 평균 리드타임을 5.1일에서 2.0일로 줄이기 위해 접수 분류와 배정 SOP를 재설계했다.",
              evidenceType: "metric",
            },
            {
              text: "반복 문의와 상담 이슈를 정리해 이력서 첨삭, 면접 준비, 연봉 협상 콘텐츠 개선 요구사항으로 전달했다.",
              evidenceType: "strong",
            },
          ],
        },
        {
          id: "golden-02-exp-02",
          company: "잡콘텐츠스튜디오",
          title: "콘텐츠 운영 담당자",
          startDate: "2019-03",
          endDate: "2020-12",
          bullets: [
            {
              text: "취업 뉴스레터, 직무별 이력서 가이드, 온라인 특강 신청 페이지와 참여자 설문 운영을 담당했다.",
              evidenceType: "strong",
            },
            {
              text: "주간 콘텐츠 성과 리포트에서 신청 수, 참석률, 상담 전환율을 추적하고 개선 아이디어를 정리했다.",
              evidenceType: "metric",
            },
          ],
        },
      ],
    },
  },
  {
    caseId: "golden_03_manufacturing_quality_to_bio_operations",
    title: "산업 전환자 - 제조 생산/품질에서 바이오 운영 인접",
    intent: [
      "제조, 품질, 생산관리를 단순 현장직으로만 보지 않는지 확인한다.",
      "공정관리, 품질기록, 리스크 대응 신호를 잡는지 확인한다.",
      "바이오 생산/품질 운영과 adjacent 관계를 볼 수 있는지 확인한다.",
    ],
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      candidateLabel: "이도현",
      experiences: [
        {
          id: "golden-03-exp-01",
          company: "한성정밀",
          title: "생산관리 담당자",
          startDate: "2018-04",
          endDate: "2022-03",
          bullets: [
            {
              text: "부품 제조 라인의 일일 생산계획, 작업지시, 공정별 실적 집계, 납기 리스크 점검을 담당했다.",
              evidenceType: "strong",
            },
            {
              text: "불량 재작업 원인을 공정별로 기록하고 작업 순서와 검사 체크리스트를 조정해 월간 재작업률을 14% 낮췄다.",
              evidenceType: "metric",
            },
            {
              text: "품질 이슈 발생 시 생산, 품질, 설비 담당자와 원인 확인 및 임시 대응 계획을 조율했다.",
              evidenceType: "strong",
            },
          ],
        },
        {
          id: "golden-03-exp-02",
          company: "세영테크",
          title: "품질검사 보조",
          startDate: "2016-08",
          endDate: "2018-02",
          bullets: [
            {
              text: "입고 검사, 치수 측정, 불량 로그 작성, 검사 성적서 정리를 지원했다.",
              evidenceType: "strong",
            },
            {
              text: "LOT별 검사 기록과 협력사 이슈 목록을 정리해 품질 회의 자료로 전달했다.",
              evidenceType: "strong",
            },
          ],
        },
      ],
    },
  },
  {
    caseId: "golden_04_gap_short_tenure_transition",
    title: "공백·짧은 재직 포함 경력자 - 바이오 생산 이후 커리어 리서치",
    intent: [
      "공백을 무조건 탈락 사유로 과대평가하지 않는지 확인한다.",
      "짧은 재직과 최근 전환 경험을 분리해 보는지 확인한다.",
      "강점과 리스크를 동시에 표현하는지 확인한다.",
    ],
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      candidateLabel: "정하늘",
      experiences: [
        {
          id: "golden-04-exp-01",
          company: "커리어인사이트",
          title: "커리어 리서치 어시스턴트",
          startDate: "2023-10",
          endDate: "2024-09",
          bullets: [
            {
              text: "채용공고, 이력서 피드백, 커리어 전환 사례를 수집해 직무, 산업, 리스크 신호별로 태깅했다.",
              evidenceType: "strong",
            },
            {
              text: "180건의 후보자 사례를 스프레드시트로 정리하고 경력 공백, 짧은 재직, 산업 전환 패턴을 분류했다.",
              evidenceType: "metric",
            },
          ],
        },
        {
          id: "golden-04-exp-02",
          company: "삼성바이오로직스",
          title: "바이오의약품 생산 엔지니어",
          startDate: "2018-03",
          endDate: "2019-07",
          bullets: [
            {
              text: "바이오의약품 생산 설비 운전, GMP 배치 기록, 공정 이상 보고를 담당했다.",
              evidenceType: "strong",
            },
            {
              text: "파일럿 생산 라인의 수율 모니터링과 세척 검증 문서 정리를 지원했다.",
              evidenceType: "strong",
            },
          ],
        },
      ],
    },
  },
  {
    caseId: "golden_05_mixed_ops_growth_service",
    title: "복합 경력자 - 운영기획, 그로스, 서비스 신호 혼합",
    intent: [
      "운영, 그로스, 서비스기획, 데이터 신호를 한 단어로 뭉개지 않는지 확인한다.",
      "primaryRoleFamily와 secondaryRoleFamilies를 구분하는지 확인한다.",
      "복합 경력의 강점과 방향성 리스크를 함께 잡는지 확인한다.",
    ],
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      candidateLabel: "최유진",
      experiences: [
        {
          id: "golden-05-exp-01",
          company: "로컬커머스랩",
          title: "운영기획 매니저",
          startDate: "2021-06",
          endDate: "2024-05",
          bullets: [
            {
              text: "지역 상점 입점, 파트너 온보딩, 운영 정책, KPI 대시보드, CRM 캠페인 운영안을 기획했다.",
              evidenceType: "strong",
            },
            {
              text: "파트너 활성화 퍼널을 분석해 재구매 캠페인과 운영 플레이북을 개편했고 월 반복 주문율을 19% 높였다.",
              evidenceType: "metric",
            },
            {
              text: "고객 문의, 상점 운영 데이터, 캠페인 결과를 묶어 서비스 개선 과제를 정리했다.",
              evidenceType: "strong",
            },
          ],
        },
        {
          id: "golden-05-exp-02",
          company: "브랜드콘텐츠랩",
          title: "콘텐츠 마케팅 담당자",
          startDate: "2019-12",
          endDate: "2021-04",
          bullets: [
            {
              text: "브랜드 콘텐츠, 랜딩 페이지 문구, 캠페인 리포트, 사용자 인터뷰 요약을 담당했다.",
              evidenceType: "strong",
            },
            {
              text: "콘텐츠 A/B 테스트와 타깃 세그먼트 분석을 통해 체험 신청 전환율을 14% 개선했다.",
              evidenceType: "metric",
            },
          ],
        },
      ],
    },
  },
]);
