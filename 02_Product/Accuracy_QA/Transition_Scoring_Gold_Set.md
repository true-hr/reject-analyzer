# PASSMAP Transition Scoring Gold Set

## 목적
- 반복 QA에서 재사용할 기준 케이스를 registry로 관리한다.
- 이미 검증한 케이스의 중복 생성을 막고, 기대 등급과 기대 점수 범위를 안정적으로 유지한다.

## 언제 이 문서를 쓰는가
- 새 케이스를 등록할 때 본다.
- 이번 라운드에 어떤 케이스를 돌릴지 고를 때 본다.
- 기존 케이스 기대값 수정이 필요한지 검토할 때 본다.

## 다른 문서와의 관계
- 운영 규칙은 `Transition_Scoring_QA_Framework.md`를 따른다.
- 각 라운드 실행 결과는 `05_Execution/Accuracy_QA_Log.md`에 남긴다.
- 기대값 재조정이 필요하면 `05_Execution/Scoring_Calibration_Log.md`에 근거를 남긴다.

## 사용 규칙
- 새 케이스는 항상 문서 하단에 append한다.
- 기존 row를 조용히 덮어쓰지 않는다.
- 기대 등급이나 기대 점수 범위를 바꿀 때는 `notes`와 calibration log 근거를 같이 남긴다.
- `case_id`는 유일해야 하며 재사용하지 않는다.

## case status 정의
- `candidate`
  - 초안 케이스. 아직 전문가 기대값이 잠기지 않음.
- `validated`
  - 기대 등급과 범위가 합의되어 반복 QA에 사용 가능함.
- `deprecated`
  - 현재 모델/제품 범위와 맞지 않아 기본 세트에서 제외함.
- `needs_relabel`
  - 기대 등급이나 설명이 현재 기준과 충돌해 재라벨링이 필요함.

## 고정 케이스 템플릿
```md
### TSQ-CASE-0001
- current_job:
- current_industry:
- target_job:
- target_industry:
- years_of_experience:
- experience_summary:
- expert_expected_grade:
- expert_score_range:
- major_plus_factors:
- major_minus_factors:
- status:
- last_review_round:
- notes:
```

## 고정 컬럼
| case_id | current_job | current_industry | target_job | target_industry | years_of_experience | experience_summary | expert_expected_grade | expert_score_range | major_plus_factors | major_minus_factors | status | last_review_round | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TSQ-CASE-0001 |  |  |  |  |  |  |  |  |  |  | candidate |  |  |
| TSQ-CASE-0002 |  |  |  |  |  |  |  |  |  |  | candidate |  |  |
| TSQ-CASE-0003 |  |  |  |  |  |  |  |  |  |  | candidate |  |  |

## 등록 메모
- `major_plus_factors`와 `major_minus_factors`는 쉼표가 아니라 `;`로 구분해 길어져도 읽기 쉽게 유지한다.
- `expert_expected_grade`는 framework의 점수 밴드 용어를 그대로 쓴다.
- `expert_score_range`는 예: `58-67` 형식으로 적는다.
- 새 케이스는 반드시 고유 ID로 append하며, 기존 케이스를 silent overwrite 하지 않는다.

## Round 1 Seed Cases
- 이번 라운드는 초기 reusable gold set 20건을 시드한다.
- `case_id`는 `TSG-001`부터 `TSG-020`까지 순차 부여한다.
- 이번 시드에서는 사용자 요청 계약에 맞춰 `expert_expected_grade`에 `중간` 라벨을 사용한다.

### 쉬운 전환 5건

### TSG-001
- current_job: 운영기획
- current_industry: 온라인 커머스
- target_job: 운영기획
- target_industry: 오프라인 리테일
- years_of_experience: 4년
- experience_summary:
  - 이커머스 주문/정산/CS 운영 프로세스를 관리했고, 월간 운영 지표와 이슈 리포트를 만들었다.
  - 물류, 고객센터, 영업 현장과 협업하며 운영 정책 개선안을 반복 실행했다.
- expert_expected_grade: 높음
- expert_score_range: 78-88
- major_plus_factors:
  - 운영 프로세스 개선 경험이 직접 연결됨
  - KPI 관리와 유관부서 조율 경험이 유지됨
- major_minus_factors:
  - 오프라인 매장 운영 맥락은 추가 적응이 필요함
- status: candidate
- last_review_round: -
- notes: 동일 기능군 내 산업 인접 전환 기준점

### TSG-002
- current_job: B2B 영업
- current_industry: B2B SaaS
- target_job: 솔루션 영업
- target_industry: 엔터프라이즈 솔루션
- years_of_experience: 5년
- experience_summary:
  - 중견기업 대상 신규 영업과 기존 고객 업셀을 맡았고, 제안서 작성과 데모 운영을 주도했다.
  - 세일즈포스 기반 파이프라인 관리와 분기 매출 목표 달성 경험이 있다.
- expert_expected_grade: 매우 높음
- expert_score_range: 82-92
- major_plus_factors:
  - 고객 발굴부터 제안, 클로징까지 전 주기 경험이 있음
  - B2B 소프트웨어 세일즈 문맥이 유사함
- major_minus_factors:
  - 대형 엔터프라이즈 조달 구조 경험은 확인 필요
- status: candidate
- last_review_round: -
- notes: 세일즈 축 false low 탐지용 쉬운 케이스

### TSG-003
- current_job: 퍼포먼스 마케팅
- current_industry: 온라인 커머스
- target_job: CRM 마케팅
- target_industry: B2C 플랫폼
- years_of_experience: 3년
- experience_summary:
  - 검색광고, 메타 광고, 리타겟팅 캠페인을 운영하며 CAC와 ROAS를 관리했다.
  - 회원 세그먼트별 재구매 캠페인과 프로모션 메시지 A/B 테스트 경험이 있다.
- expert_expected_grade: 높음
- expert_score_range: 74-84
- major_plus_factors:
  - 퍼널 지표와 고객 세그먼트 운영 경험이 CRM과 연결됨
  - 데이터 기반 실험 경험이 유지됨
- major_minus_factors:
  - CRM 자동화 툴과 라이프사이클 설계 깊이는 확인 필요
- status: candidate
- last_review_round: -
- notes: 마케팅 인접 전환 기준점

### TSG-004
- current_job: 백엔드 개발자
- current_industry: B2B SaaS
- target_job: 플랫폼 백엔드 개발자
- target_industry: 엔터프라이즈 솔루션
- years_of_experience: 4년
- experience_summary:
  - API 서버, 배치 처리, DB 스키마 설계를 담당했고 장애 대응 온콜 경험이 있다.
  - 인증, 권한, 로그 수집 기능을 개발하며 프론트엔드와 QA와 협업했다.
- expert_expected_grade: 매우 높음
- expert_score_range: 84-94
- major_plus_factors:
  - 핵심 기술 스택과 개발 책임이 직접 연결됨
  - 서비스 운영과 안정화 경험이 재사용 가능함
- major_minus_factors:
  - 더 복잡한 레거시 시스템 적응 가능성은 별도 확인 필요
- status: candidate
- last_review_round: -
- notes: 개발 축 false low 방지용

### TSG-005
- current_job: 품질보증
- current_industry: 전기전자 제조
- target_job: 품질관리
- target_industry: 전기전자 제조
- years_of_experience: 3년
- experience_summary:
  - 공정 이상 대응, 불량 원인 분석, 고객사 품질 이슈 대응을 맡았다.
  - 협력사 품질 점검과 시정조치 보고서 작성 경험이 있다.
- expert_expected_grade: 높음
- expert_score_range: 76-86
- major_plus_factors:
  - 품질 이슈 분석과 개선 활동 경험이 직접 연결됨
  - 제조 현장과 협력사 대응 경험이 유지됨
- major_minus_factors:
  - 검사 표준 운영 비중이 더 높아질 수 있음
- status: candidate
- last_review_round: -
- notes: 제조/품질 계열의 쉬운 전환 기준점

### 중간 전환 5건

### TSG-006
- current_job: 데이터 분석가
- current_industry: 온라인 커머스
- target_job: 서비스기획
- target_industry: B2C 플랫폼
- years_of_experience: 4년
- experience_summary:
  - 유입, 전환, 리텐션 지표를 분석하고 대시보드와 인사이트 리포트를 만들었다.
  - 기획자와 협업해 실험 설계와 개선 우선순위 도출을 지원했다.
- expert_expected_grade: 중간
- expert_score_range: 62-72
- major_plus_factors:
  - 사용자 데이터 해석과 실험 지원 경험이 있음
  - 기획 조직과의 협업 경험이 누적돼 있음
- major_minus_factors:
  - 직접 기능 정의와 요구사항 오너십 경험은 제한적일 수 있음
  - 산업 문맥이 완전히 동일하지는 않음
- status: candidate
- last_review_round: -
- notes: 분석 기반 기획 전환의 대표 중간 케이스

### TSG-007
- current_job: 브랜드 마케팅
- current_industry: 소비재 브랜드
- target_job: 상품기획
- target_industry: 온라인 커머스
- years_of_experience: 5년
- experience_summary:
  - 시즌 캠페인 기획, 브랜드 메시지 운영, 제품 출시 프로모션을 맡았다.
  - 시장 조사와 고객 반응 분석을 기반으로 제품 포지셔닝 제안을 수행했다.
- expert_expected_grade: 중간
- expert_score_range: 60-70
- major_plus_factors:
  - 고객 인사이트와 포지셔닝 경험이 상품기획과 연결됨
  - 출시 협업 경험이 있어 상품 라이프사이클 이해가 있음
- major_minus_factors:
  - 원가, 카테고리 손익, 소싱 관점은 약할 수 있음
- status: candidate
- last_review_round: -
- notes: 마케팅에서 상품기획으로 넘어갈 때의 현실적 중간 구간

### TSG-008
- current_job: 생산기술
- current_industry: 자동차 부품 제조
- target_job: 제조혁신
- target_industry: 스마트팩토리 솔루션
- years_of_experience: 6년
- experience_summary:
  - 설비 개선과 공정 자동화 과제를 운영했고 생산성 향상 프로젝트를 리드했다.
  - 현장 엔지니어, 품질, 설비 협력사와 함께 개선안을 검증하고 적용했다.
- expert_expected_grade: 중간
- expert_score_range: 58-68
- major_plus_factors:
  - 공정 개선과 자동화 경험이 제조혁신과 직접 연결됨
  - 현장 문제를 구조화한 프로젝트 경험이 있음
- major_minus_factors:
  - 외부 고객 대상 솔루션 제안 경험은 부족할 수 있음
  - 솔루션 사업 측 관점은 추가 확인 필요
- status: candidate
- last_review_round: -
- notes: 제조 내부 개선과 솔루션 문맥 사이의 중간 전환

### TSG-009
- current_job: 사업기획
- current_industry: 엔터프라이즈 솔루션
- target_job: 전략기획
- target_industry: B2B SaaS
- years_of_experience: 5년
- experience_summary:
  - 신사업 검토, 경쟁사 분석, 사업계획 수립과 경영진 보고 자료를 담당했다.
  - 매출 구조와 파이프라인 데이터를 보고 우선 과제를 제안한 경험이 있다.
- expert_expected_grade: 높음
- expert_score_range: 66-76
- major_plus_factors:
  - 전략 문서 작성과 사업 구조 분석 경험이 바로 연결됨
  - B2B 소프트웨어 맥락이 크게 다르지 않음
- major_minus_factors:
  - SaaS 지표 기반 운영 전략 경험은 더 확인 필요
- status: candidate
- last_review_round: -
- notes: 전략/사업 문맥에서 false low를 보기 좋은 케이스

### TSG-010
- current_job: 기술영업
- current_industry: 산업장비
- target_job: 프로젝트 매니저
- target_industry: 산업자동화
- years_of_experience: 4년
- experience_summary:
  - 고객 요구 파악, 제안서 작성, 납기 조율, 설치 이후 이슈 대응까지 맡았다.
  - 기술팀과 고객사 사이에서 일정과 범위를 조율한 경험이 많다.
- expert_expected_grade: 중간
- expert_score_range: 57-67
- major_plus_factors:
  - 일정/범위/이슈 조율 경험이 PM 역할과 연결됨
  - 기술 이해와 고객 커뮤니케이션 경험을 모두 보유함
- major_minus_factors:
  - 내부 오너십 기반 프로젝트 관리 체계 경험은 제한적일 수 있음
- status: candidate
- last_review_round: -
- notes: 세일즈성 타이틀이지만 PM 전이 가능성을 보는 케이스

### 어려운 전환 5건

### TSG-011
- current_job: 채용 담당자
- current_industry: HR 서비스
- target_job: 백엔드 개발자
- target_industry: 핀테크
- years_of_experience: 3년
- experience_summary:
  - 채용 공고 운영, 면접 조율, 후보자 커뮤니케이션과 채용 데이터 정리를 담당했다.
  - 개발 조직과 협업한 경험은 있으나 직접 개발 산출물이나 기술 프로젝트 경험은 없다.
- expert_expected_grade: 매우 낮음
- expert_score_range: 10-20
- major_plus_factors:
  - 개발 조직과의 접점은 일부 있음
- major_minus_factors:
  - 핵심 직무 역량과 직접 증거가 부재함
  - 산업과 기능 전환 폭이 모두 큼
- status: candidate
- last_review_round: -
- notes: 대형 cross-function false high 탐지용

### TSG-012
- current_job: 생산관리
- current_industry: 식품 제조
- target_job: 브랜드 마케팅
- target_industry: 뷰티 브랜드
- years_of_experience: 5년
- experience_summary:
  - 생산 계획, 자재 수급, 생산 일정 관리와 현장 이슈 대응을 맡았다.
  - 소비자 조사나 브랜드 캠페인 기획 경험은 없다.
- expert_expected_grade: 매우 낮음
- expert_score_range: 12-22
- major_plus_factors:
  - 제품 생산 프로세스 이해는 제한적으로 활용 가능함
- major_minus_factors:
  - 소비자 커뮤니케이션과 브랜드 전략 경험이 없음
  - 산업 문맥도 직접 연결되지 않음
- status: candidate
- last_review_round: -
- notes: 제조에서 마케팅으로의 과대평가 방지용

### TSG-013
- current_job: 회계 담당자
- current_industry: 제조업
- target_job: 데이터 사이언티스트
- target_industry: AI·데이터 서비스
- years_of_experience: 2년
- experience_summary:
  - 월마감, 전표 검토, 비용 정산과 재무 보고 보조 업무를 수행했다.
  - 엑셀 활용은 가능하지만 모델링, 분석 프로젝트, 코딩 산출물 경험은 없다.
- expert_expected_grade: 매우 낮음
- expert_score_range: 8-18
- major_plus_factors:
  - 숫자 처리 경험은 일부 기초 자산이 될 수 있음
- major_minus_factors:
  - 분석 도구와 모델링 evidence가 부족함
  - 기능과 산업 전환 폭이 모두 큼
- status: candidate
- last_review_round: -
- notes: evidence 무시형 false high 탐지용

### TSG-014
- current_job: 퍼포먼스 마케팅
- current_industry: 온라인 커머스
- target_job: 전략구매
- target_industry: 제조업
- years_of_experience: 4년
- experience_summary:
  - 광고 예산 운영, 캠페인 성과 분석, 대행사 협업을 중심으로 일했다.
  - 협상 경험이 있더라도 매체 단가 조율 수준이며 공급망/원가 구조 경험은 없다.
- expert_expected_grade: 낮음
- expert_score_range: 20-30
- major_plus_factors:
  - 성과 수치 관리와 외부 파트너 협의 경험이 일부 있음
- major_minus_factors:
  - 구매 직무 핵심인 공급망, 원가, 벤더 관리 경험이 없음
  - 산업 문맥 전환 폭이 큼
- status: candidate
- last_review_round: -
- notes: 협상 키워드만으로 과대평가하면 안 되는 케이스

### TSG-015
- current_job: 프론트엔드 개발자
- current_industry: 게임
- target_job: 재무기획
- target_industry: 금융
- years_of_experience: 4년
- experience_summary:
  - 웹 UI 개발, 사용자 이벤트 로깅, 프론트 성능 개선을 담당했다.
  - 예산 관리나 재무 분석, 경영 계획 수립 경험은 없다.
- expert_expected_grade: 매우 낮음
- expert_score_range: 5-15
- major_plus_factors:
  - 데이터 기반 사고는 일부 보조 자산이 될 수 있음
- major_minus_factors:
  - 재무기획 핵심 업무와 직접 연결되는 evidence가 없음
  - 산업과 기능 모두 급격히 전환됨
- status: candidate
- last_review_round: -
- notes: 대형 직무 점프의 하한선 역할

### 경계/애매 케이스 5건

### TSG-016
- current_job: 서비스기획
- current_industry: B2C 플랫폼
- target_job: 프로덕트 매니저
- target_industry: B2B SaaS
- years_of_experience: 5년
- experience_summary:
  - 사용자 요구사항 정의, 화면 정책 수립, 개발 우선순위 조율을 맡았다.
  - 데이터 분석과 실험 리뷰 경험은 있으나 제품 수익 구조를 직접 책임진 적은 제한적이다.
- expert_expected_grade: 중간
- expert_score_range: 55-70
- major_plus_factors:
  - 요구사항 정의와 개발 협업 경험이 강함
  - 서비스 개선 관점은 PM과 상당 부분 연결됨
- major_minus_factors:
  - B2B SaaS 고객/매출 구조 이해는 별도 확인 필요
  - PM 오너십 범위가 더 넓을 수 있음
- status: candidate
- last_review_round: -
- notes: title 차이보다 실제 오너십 차이를 봐야 하는 케이스

### TSG-017
- current_job: 영업기획
- current_industry: 소비재 유통
- target_job: 사업개발
- target_industry: B2B SaaS
- years_of_experience: 6년
- experience_summary:
  - 채널별 매출 계획, 프로모션 손익 분석, 신규 거래처 검토를 담당했다.
  - 제휴 논의와 내부 보고 경험은 있으나 장기 파트너십 발굴을 직접 리드한 경험은 제한적이다.
- expert_expected_grade: 중간
- expert_score_range: 50-65
- major_plus_factors:
  - 매출 구조 해석과 파트너 논의 경험이 있음
  - 사업성 검토 문맥이 일부 연결됨
- major_minus_factors:
  - SaaS 사업개발의 솔루션 이해와 제휴 구조 경험은 약할 수 있음
  - 타이틀 유사성 대비 실제 역할 차이가 존재함
- status: candidate
- last_review_round: -
- notes: 영업기획과 사업개발을 과도하게 동일시하지 않기 위한 케이스

### TSG-018
- current_job: 데이터 분석가
- current_industry: 핀테크
- target_job: 리스크 관리
- target_industry: 은행·여신
- years_of_experience: 4년
- experience_summary:
  - 대출 전환율, 부정거래 패턴, 운영 지표를 분석하고 이상 징후 리포트를 만들었다.
  - 정량 분석은 강하지만 규제 해석과 심사 정책 오너십은 직접 맡지 않았다.
- expert_expected_grade: 중간
- expert_score_range: 52-67
- major_plus_factors:
  - 금융 데이터 해석과 이상 패턴 분석 경험이 있음
  - 산업 문맥이 완전히 동떨어지지 않음
- major_minus_factors:
  - 리스크 정책과 규제 대응 경험은 부족할 수 있음
- status: candidate
- last_review_round: -
- notes: 분석 강점이 규제/심사 직무로 얼마나 이전되는지 보기 좋은 케이스

### TSG-019
- current_job: 품질보증
- current_industry: 제약·바이오
- target_job: 규제대응
- target_industry: 제약·바이오
- years_of_experience: 5년
- experience_summary:
  - GMP 문서 관리, 일탈 조사, CAPA 운영과 내부 감사 대응을 수행했다.
  - 품질 시스템 이해는 깊지만 인허가 제출 문서 작성 경험은 제한적이다.
- expert_expected_grade: 중간
- expert_score_range: 55-70
- major_plus_factors:
  - 규정, 문서, 감사 대응 경험이 강하게 연결됨
  - 산업 특수성이 동일함
- major_minus_factors:
  - 인허가 전략과 대외 제출 경험은 별도 확인 필요
- status: candidate
- last_review_round: -
- notes: 같은 산업 내 cross-function 경계 케이스

### TSG-020
- current_job: 공정기술 엔지니어
- current_industry: 반도체 제조
- target_job: 기술영업
- target_industry: 반도체 장비
- years_of_experience: 7년
- experience_summary:
  - 공정 개선, 수율 문제 분석, 장비 협력사와의 기술 커뮤니케이션을 담당했다.
  - 고객 대응 경험은 일부 있지만 매출 목표와 파이프라인 운영 책임은 없었다.
- expert_expected_grade: 중간
- expert_score_range: 45-60
- major_plus_factors:
  - 기술 이해와 고객사/협력사 소통 경험이 있음
  - 산업 문맥이 강하게 이어짐
- major_minus_factors:
  - 영업 오너십과 매출 책임 경험이 부족함
  - 대외 설득 역량을 직접 입증한 evidence는 제한적일 수 있음
- status: candidate
- last_review_round: -
- notes: 산업은 가깝지만 책임 범위가 확장되는 calibration 가치 높은 케이스

## 2026-04-03 Gold Set Reset Policy
- 기존 gold set은 과거 axis 체계 기준일 수 있으므로 그대로 신뢰하지 않는다.
- 새 5축 기준 문서가 SSOT다.
- 우선 Axis 1 / 4 / 5 중심으로 gold case를 다시 쌓는다.
- 초기 gold set은 exact numeric score보다 expected band + reasoning 우선으로 설계한다.
- 향후 calibration이 쌓이면 숫자 기준을 더 정밀화한다.

## Axis 1 / 4 / 5 후보 케이스 적재 규칙
- 이번 1차 적재 대상은 Axis 1 / Axis 4 / Axis 5 판정 차이가 분명한 케이스를 우선한다.
- 직무명 표면 유사도보다 업무 구조, 고객군, 일의 결 차이를 설명할 수 있는 케이스를 우선한다.
- 같은 대분류 안 이동과 다른 대분류 이동을 모두 섞어 적재한다.
- 아직 대량 케이스 생성보다 skeleton과 분류 기준 잠금이 우선이다.

## 밴드 정의 초안
- `low`
  - 해당 축에서 연결성이 낮고, 설득을 위해 별도 보완 설명이 많이 필요하다.
- `mid`
  - 연결점과 단절점이 함께 존재하며, reasoning 품질에 따라 해석 차이가 발생할 수 있다.
- `high`
  - 해당 축 기준으로 연결성이 강하고, 기존 경험을 자연스럽게 재사용할 수 있다.

## disagreement 기록 규칙
- disagreement는 exact score 차이보다 band 해석 충돌을 먼저 기록한다.
- 충돌이 발생하면 어떤 축에서 왜 다르게 읽혔는지 reasoning 중심으로 남긴다.
- 특히 Axis 1 / 4 / 5는 직무명, 산업명, 표면 키워드에 끌린 오판 가능성을 따로 메모한다.

## 추후 runner 입력 shape 메모
- 초기 runner 입력은 최소한 아래 필드를 받는 skeleton을 전제로 한다.
  - current job
  - target job
  - current industry
  - target industry
  - axis 1 expected band
  - axis 1 reasoning
  - axis 4 expected band
  - axis 4 reasoning
  - axis 5 expected band
  - axis 5 reasoning
  - disagreement risk memo
- exact numeric score는 후속 calibration 이후 선택 필드로 확장한다.

## Runner Case Skeleton
- 아래 skeleton은 baseline lock용 예시다.
- 실제 값이 아직 다 채워지지 않아도 되며, runner 구현 전에 문서 기준을 먼저 맞추기 위한 형태다.

```md
### CASE-RUNNER-SKEL-001
- caseId: TSQ-CASE-AX145-001
- currentJob: 운영기획
- currentIndustry: 온라인 커머스
- targetJob: 서비스운영
- targetIndustry: B2C 플랫폼
- focusAxes: [1,4,5]
- expected:
  - axis1.band: high
  - axis4.band: mid
  - axis5.band: high
- reasoningHints:
  - 업무 구조는 운영 프로세스 설계/개선 중심으로 이어짐
  - 고객 구조는 직접 소비자 접점 여부 차이를 확인해야 함
  - 일의 성격은 운영형/조율형 성격이 유지됨
- notes: baseline skeleton
```

```md
### CASE-RUNNER-SKEL-002
- caseId: TSQ-CASE-AX145-002
- currentJob: B2B 영업
- currentIndustry: B2B SaaS
- targetJob: CRM 마케팅
- targetIndustry: B2C 플랫폼
- focusAxes: [1,4,5]
- expected:
  - axis1.band: low
  - axis4.band: low
  - axis5.band: mid
- reasoningHints:
  - 업무 구조는 영업 오너십과 CRM 운영 구조가 다름
  - 고객 구조는 B2B 의사결정과 B2C 사용자 운영 구조 차이가 큼
  - 일의 성격은 설득형에서 운영형/분석형으로 일부 전환됨
- notes: disagreement risk high
```

```md
### CASE-RUNNER-SKEL-003
- caseId: TSQ-CASE-AX145-003
- currentJob: 백엔드 개발자
- currentIndustry: B2B SaaS
- targetJob: 플랫폼 백엔드 개발자
- targetIndustry: 엔터프라이즈 솔루션
- focusAxes: [1,4,5]
- expected:
  - axis1.band: high
  - axis4.band: mid
  - axis5.band: high
- reasoningHints:
  - 업무 구조는 API/DB/장애 대응 중심으로 직접 연결됨
  - 고객 구조는 외부 고객 접점보다 내부 제품/기술 이해관계자 비중을 함께 봐야 함
  - 일의 성격은 실행형/문제해결형 성격이 강하게 유지됨
- notes: false low 방지용 skeleton
```

### Baseline Case Pack v1

### CASE-RUNNER-AX145-001
- caseId: TSQ-CASE-AX145-101
- currentJob: 서비스운영
- currentIndustry: B2C 플랫폼
- targetJob: 운영기획
- targetIndustry: B2C 플랫폼
- focusAxes: [1,4,5]
- expected:
  - axis1.band: mid_high
  - axis4.band: high
  - axis5.band: mid
- reasoningHints:
  - 구조는 운영 정책 정리와 프로세스 개선으로 이어지지만, 실시간 처리에서 기획 비중으로 이동한다.
  - 고객/이해관계자는 유사하나 일의 성격이 운영 실행 중심에서 운영 설계 중심으로 바뀐다.
  - 역할 폭은 넓어지지만 완전한 책임 단계 점프까지는 아니다.

### CASE-RUNNER-AX145-002
- caseId: TSQ-CASE-AX145-102
- currentJob: 기업교육 기획/운영
- currentIndustry: HRD 서비스
- targetJob: 교육/조직개발
- targetIndustry: 일반 기업 HR
- focusAxes: [1,4,5]
- expected:
  - axis1.band: mid_high
  - axis4.band: mid
  - axis5.band: mid
- reasoningHints:
  - 구조는 교육 설계와 프로그램 운영 경험이 이어지지만, 내부 조직 변화 맥락을 새로 읽어야 한다.
  - 고객은 외부 클라이언트에서 내부 구성원/리더로 바뀌어 이해관계자 구조가 달라진다.
  - 일의 성격은 교육 실행과 설계의 연결성이 높아 완전한 low로 읽히면 안 된다.

### CASE-RUNNER-AX145-003
- caseId: TSQ-CASE-AX145-103
- currentJob: 기업교육 기획/운영
- currentIndustry: HRD 서비스
- targetJob: 직무교육 담당
- targetIndustry: 제조 대기업
- focusAxes: [1,4,5]
- expected:
  - axis1.band: high
  - axis4.band: mid
  - axis5.band: mid
- reasoningHints:
  - 구조는 커리큘럼 설계, 강의 운영, 학습 피드백 루프가 직접 이어진다.
  - 고객은 외부 발주처에서 내부 현업/직원으로 바뀌지만 교육이라는 일의 성격은 유지된다.
  - 역할 폭은 비슷하되 내부 이해관계자 정렬이 추가되어 약간의 적응 비용이 있다.

### CASE-RUNNER-AX145-004
- caseId: TSQ-CASE-AX145-104
- currentJob: 신사업/사업개발(BD)
- currentIndustry: B2B SaaS
- targetJob: 브랜드마케팅
- targetIndustry: 소비재
- focusAxes: [1,4,5]
- expected:
  - axis1.band: low
  - axis4.band: very_low
  - axis5.band: mid
- reasoningHints:
  - 표면상 시장/성장 키워드는 비슷해 보여도 구조는 제휴/매출 오너십과 브랜드 포지셔닝 운영으로 갈린다.
  - 고객과 이해관계자는 B2B 의사결정자에서 대중 소비자 중심으로 크게 바뀐다.
  - 책임 수준은 비슷할 수 있으나 일의 성격이 달라 Axis 1과 Axis 4를 낮게 읽어야 한다.
- notes: 표면 유사성에 끌려 false high가 나기 쉬운 케이스

### CASE-RUNNER-AX145-005
- caseId: TSQ-CASE-AX145-105
- currentJob: B2B영업
- currentIndustry: 산업재 유통
- targetJob: 제안영업
- targetIndustry: SI/솔루션
- focusAxes: [1,4,5]
- expected:
  - axis1.band: mid_high
  - axis4.band: low
  - axis5.band: mid
- reasoningHints:
  - 구조는 고객 니즈 파악, 설득, 딜 진행이라는 공통 축이 있어 완전한 low는 아니다.
  - 산업 맥락은 범용 유통과 프로젝트성 솔루션 제안으로 크게 달라 Axis 4는 낮게 본다.
  - 역할 폭은 유사하지만 제안 문서화와 기술/구축 이해 비중이 늘어난다.

### CASE-RUNNER-AX145-006
- caseId: TSQ-CASE-AX145-106
- currentJob: 일반영업
- currentIndustry: 소비재
- targetJob: 사업기획
- targetIndustry: 소비재
- focusAxes: [1,4,5]
- expected:
  - axis1.band: low
  - axis4.band: high
  - axis5.band: low
- reasoningHints:
  - 같은 산업 안 이동이어도 구조는 영업 실행/매출 압박과 사업기획의 분석/조정/의사결정 지원이 다르다.
  - 고객 구조보다 내부 경영진/유관부서 조율 비중이 커져 일의 성격이 크게 바뀐다.
  - 역할 폭과 책임 수준도 개인 영업 오너십에서 사업 단위 기획으로 이동해 Axis 5가 낮거나 갈린다.

### CASE-RUNNER-AX145-007
- caseId: TSQ-CASE-AX145-107
- currentJob: 기계설계
- currentIndustry: 제조
- targetJob: 품질/검증
- targetIndustry: 제조
- focusAxes: [1,4,5]
- expected:
  - axis1.band: mid
  - axis4.band: high
  - axis5.band: mid
- reasoningHints:
  - 구조는 제품 사양 이해와 기술 문서 기반 판단이 이어지지만, 설계 생성과 검증 판단은 핵심 산출물이 다르다.
  - 고객은 외부보다 내부 개발/생산/품질 이해관계자 비중이 높아 산업 맥락은 가깝다.
  - 역할 폭은 비슷하나 책임 초점이 생성에서 검증으로 이동한다.

### CASE-RUNNER-AX145-008
- caseId: TSQ-CASE-AX145-108
- currentJob: 제조 생산관리
- currentIndustry: 제조
- targetJob: SCM/물류
- targetIndustry: 유통/물류
- focusAxes: [1,4,5]
- expected:
  - axis1.band: mid_high
  - axis4.band: mid
  - axis5.band: mid
- reasoningHints:
  - 구조는 일정, 재고, 흐름 관리라는 운영 체인이 이어져 bridgeable하다.
  - 산업 차이로 고객과 파트너 구조는 달라지지만 value flow를 다루는 성격은 연결된다.
  - 역할 폭은 현장 중심에서 네트워크 조율 중심으로 옮겨가며 lateral에 가깝다.

### CASE-RUNNER-AX145-009
- caseId: TSQ-CASE-AX145-109
- currentJob: 금융권 백엔드 개발
- currentIndustry: 금융
- targetJob: 게임 서버 개발
- targetIndustry: 게임
- focusAxes: [1,4,5]
- expected:
  - axis1.band: mid
  - axis4.band: very_low
  - axis5.band: mid
- reasoningHints:
  - 개발 직무 표면은 비슷하지만 서비스 구조, 성능 우선순위, 고객 체감 맥락이 크게 다르다.
  - 산업과 사용자 맥락이 강하게 갈려 Axis 4는 낮게 읽어야 한다.
  - 책임 수준은 비슷할 수 있어 Axis 5는 과하게 깎지 않는다.
- notes: 같은 개발 직군이라도 산업 구조 차이를 분리해서 봐야 하는 케이스

### CASE-RUNNER-AX145-010
- caseId: TSQ-CASE-AX145-110
- currentJob: 공공기관 행정
- currentIndustry: 공공기관
- targetJob: HR
- targetIndustry: 일반 기업
- focusAxes: [1,4,5]
- expected:
  - axis1.band: low
  - axis4.band: low
  - axis5.band: mid
- reasoningHints:
  - 문서 처리와 조정 업무의 표면 유사성은 있으나 인사 제도 운영과 조직 인력 이슈 대응 구조는 별개다.
  - 고객/이해관계자는 대국민·공공 절차에서 내부 조직/리더/구성원으로 바뀐다.
  - 역할 폭은 비슷해 보일 수 있어 Axis 5는 low보다 mid 쪽 ambiguity를 남긴다.

### CASE-RUNNER-AX145-011
- caseId: TSQ-CASE-AX145-111
- currentJob: PM
- currentIndustry: B2B SaaS
- targetJob: 서비스기획
- targetIndustry: B2C 플랫폼
- focusAxes: [1,4,5]
- expected:
  - axis1.band: mid_high
  - axis4.band: low
  - axis5.band: low
- reasoningHints:
  - 구조는 요구사항 정리, 우선순위 조정, 릴리스 협업으로 이어져 직무 연결성은 높다.
  - 고객과 시장 맥락은 B2B 구매자 중심에서 B2C 사용자 경험 중심으로 크게 달라진다.
  - PM이 더 넓은 오너십을 가졌다면 서비스기획 전환은 역할 폭 downgrade 또는 lateral ambiguity로 읽힐 수 있다.
- notes: Axis 5 disagreement 가능성 높음

### CASE-RUNNER-AX145-012
- caseId: TSQ-CASE-AX145-112
- currentJob: 기술영업
- currentIndustry: 엔터프라이즈 솔루션
- targetJob: 솔루션영업
- targetIndustry: 엔터프라이즈 솔루션
- focusAxes: [1,4,5]
- expected:
  - axis1.band: high
  - axis4.band: high
  - axis5.band: mid_high
- reasoningHints:
  - 구조는 고객 문제 파악, 기술 설명, 제안 정렬, 수주 지원으로 직접 이어진다.
  - 고객과 이해관계자는 IT 의사결정자/현업/구매 조직으로 거의 동일하다.
  - 역할 폭과 오너십은 유사하되 제품 포트폴리오 범위에 따라 slight up 가능성이 있다.

## Baseline Case Coverage Memo
- 현재 baseline은 `surface-similar but structurally low`, `adjacent-family bridgeable`, `same job family / different industry`, `responsibility expansion or downgrade ambiguity`를 모두 포함한다.
- Axis 1은 false high 방지용 케이스와 bridgeable 케이스가 같이 들어가 있어 직무명 표면 유사성 편향을 체크할 수 있다.
- Axis 4는 같은 직군이라도 산업/customer context가 크게 바뀌는 묶음(`금융권 백엔드 개발 -> 게임 서버 개발`, `B2B영업 -> 제안영업`)을 포함한다.
- Axis 5는 `일반영업 -> 사업기획`, `PM -> 서비스기획`처럼 역할 폭과 오너십 범위가 낮거나 갈리는 케이스를 넣었다.
- 아직 비어 있는 유형은 `same job / same industry but level up`, `cross-family but persuasive senior case`, `ownership downgrade with same title`, `public-to-regulated-private specialist` 쪽이다.
- 다음 충원 우선순위는 `same-family near`, `cross-family but persuasive`, `responsibility expansion`, `ownership downgrade or lateral ambiguity`의 세부 레벨 분해다.

## Disagreement Log Row Format
- 아래 포맷은 baseline lock용 disagreement 기록 형식이다.
- exact score 차이보다 band 해석 충돌 기록을 우선한다.

```md
caseId:
axis:
expectedBand:
actualBand:
reason:
action:
status:
```

## 2026-04-04 Axis 1~5 Baseline Real Cases
- 이번 묶음은 PASSMAP 실제 입력 SSOT만 사용한 5축 baseline 1차 적재본이다.
- 모든 케이스는 `focusAxes: [1,2,3,4,5]`로 읽고, expected는 exact score 없이 axis별 band만 남긴다.
- 같은 제목처럼 보여도 문제 해결 방식과 산출물이 다르면 Axis 2 / Axis 3을 별도로 낮춰 읽는다.

### Bucket A. 표면상 유사하지만 Axis 2 또는 Axis 3에서 갈리는 케이스

### CASE-RUNNER-AX12345-001
- caseId: TSG-AX12345-001
- currentJob: 서비스운영
- currentIndustry: 온라인 커머스
- targetJob: 운영기획
- targetIndustry: 온라인 커머스
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: mid_high
  - axis2.band: mid
  - axis3.band: mid
  - axis4.band: high
  - axis5.band: mid
- reasoningHints:
  - 업무 구조는 운영 흐름과 이슈 관리로 이어지지만, 운영기획은 반복 처리보다 기준 설계와 운영 체계 정비 비중이 더 크다.
  - 문제 해결 방식은 실시간 예외 처리 중심에서 원인 구조화와 정책 설계 중심으로 이동한다.
  - 산출물은 처리 안정화 결과에서 SOP, KPI 체계, 운영 정책으로 바뀐다.
  - 산업 맥락은 동일하다.
  - 역할 범위는 실행 오너에서 체계 설계 오너로 넓어진다.

### CASE-RUNNER-AX12345-002
- caseId: TSG-AX12345-002
- currentJob: B2B 영업
- currentIndustry: 엔터프라이즈 솔루션
- targetJob: 제안영업
- targetIndustry: IT SI / SM / 구축형 서비스
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: mid_high
  - axis2.band: mid
  - axis3.band: mid
  - axis4.band: mid
  - axis5.band: mid
- reasoningHints:
  - 수주를 향한 영업 구조는 이어지지만, 제안영업은 제안서 구조화와 RFP 대응 비중이 더 높다.
  - 문제 해결 방식은 관계 확장 중심에서 요구사항 해석과 제안 논리 조립 중심으로 이동한다.
  - 산출물은 파이프라인 관리보다 제안서, 수행 범위, 가격 구조 정렬 쪽으로 바뀐다.
  - 산업 맥락은 둘 다 B2B지만 구매 절차와 의사결정 구조가 다르다.
  - 역할 범위는 개인 세일즈보다 딜 구조화 오너십이 상대적으로 커진다.

### Bucket B. 직무명은 다르지만 구조적으로 이어져 Axis 1은 중간 이상인 케이스

### CASE-RUNNER-AX12345-003
- caseId: TSG-AX12345-003
- currentJob: 프로젝트관리(PM)
- currentIndustry: B2B SaaS
- targetJob: 서비스기획
- targetIndustry: B2C 플랫폼
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: mid_high
  - axis2.band: mid
  - axis3.band: mid
  - axis4.band: low
  - axis5.band: mid
- reasoningHints:
  - 요구사항 정리, 우선순위 조정, 릴리스 협업 구조는 이어진다.
  - 문제 해결 방식은 일정/조율 중심에서 사용자 흐름 정의와 기능 정책 설계 중심으로 바뀐다.
  - 산출물은 일정 관리물에서 서비스 정책, 화면/기능 요구 구조로 이동한다.
  - 산업과 고객 맥락은 B2B에서 B2C로 크게 바뀐다.
  - 역할 범위는 넓게 보면 비슷하지만 오너십 초점이 달라 borderline이다.

### CASE-RUNNER-AX12345-004
- caseId: TSG-AX12345-004
- currentJob: 생산관리
- currentIndustry: 자동차 / 모빌리티
- targetJob: SCM
- targetIndustry: 자동차 / 모빌리티
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: mid_high
  - axis2.band: mid_high
  - axis3.band: mid
  - axis4.band: high
  - axis5.band: mid
- reasoningHints:
  - 일정, 자재, 재고, 병목 관리라는 운영 구조가 이어진다.
  - 문제 해결 방식은 현장 생산 균형화에서 공급 흐름 최적화로 넓어진다.
  - 산출물은 생산 계획과 현장 실행 안정화에서 공급 계획과 리드타임 관리로 달라진다.
  - 산업 맥락은 동일하다.
  - 책임 범위는 공장 내부 중심에서 공급 네트워크 조율까지 확장된다.

### Bucket C. 산출물 / 평가 기준 차이로 Axis 3이 특히 낮아야 하는 케이스

### CASE-RUNNER-AX12345-005
- caseId: TSG-AX12345-005
- currentJob: 품질보증(QA)
- currentIndustry: 의료기기
- targetJob: 규제대응 / RA
- targetIndustry: 의료기기
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: mid
  - axis2.band: mid
  - axis3.band: low
  - axis4.band: high
  - axis5.band: mid
- reasoningHints:
  - 규정과 문서 기반 운영 구조는 일부 맞닿지만 핵심 업무 축은 다르다.
  - 문제 해결 방식은 품질 이슈 시정과 검증에서 인허가 요구 해석과 문서 적합성 관리로 바뀐다.
  - 산출물과 평가 기준은 품질 개선 결과에서 허가 문서 적합성과 규제 대응 완결성으로 갈린다.
  - 산업 규제 맥락은 동일하다.
  - 역할 범위는 품질 시스템 오너와 규제 문서 오너로 분리된다.

### CASE-RUNNER-AX12345-006
- caseId: TSG-AX12345-006
- currentJob: 기구설계
- currentIndustry: 전기전자 / 가전
- targetJob: 테스트 / 검증
- targetIndustry: 전기전자 / 가전
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: mid
  - axis2.band: mid
  - axis3.band: low
  - axis4.band: high
  - axis5.band: mid
- reasoningHints:
  - 제품 이해와 기술 문서 해석 구조는 이어진다.
  - 문제 해결 방식은 설계 생성과 대안 도출에서 결함 재현, 조건 통제, 검증 판단으로 바뀐다.
  - 산출물은 도면과 설계 변경안에서 시험 결과, 검증 보고, 판정 근거로 달라진다.
  - 산업 맥락은 동일하다.
  - 역할 범위는 유사하지만 오너십 초점이 생성에서 검증으로 이동한다.

### Bucket D. 산업 차이 때문에 Axis 4가 특히 낮아야 하는 케이스

### CASE-RUNNER-AX12345-007
- caseId: TSG-AX12345-007
- currentJob: 백엔드개발
- currentIndustry: AI / 데이터 / 클라우드
- targetJob: 백엔드개발
- targetIndustry: 게임 / 콘텐츠 플랫폼
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: high
  - axis2.band: mid
  - axis3.band: mid_high
  - axis4.band: low
  - axis5.band: mid_high
- reasoningHints:
  - 직무 구조는 서버 개발, 데이터 흐름, 운영 안정화로 이어진다.
  - 문제 해결 방식은 비슷하지만 서비스 부하 특성, 속도 우선순위, 운영 맥락이 달라진다.
  - 산출물은 모두 백엔드 기능이지만 평가 기준이 플랫폼 안정성 대 사용자 체감 성능으로 갈린다.
  - 산업 맥락과 사용자 접점은 크게 다르다.
  - 역할 범위는 유사하다.

### CASE-RUNNER-AX12345-008
- caseId: TSG-AX12345-008
- currentJob: 일반영업
- currentIndustry: 온라인 커머스
- targetJob: 일반영업
- targetIndustry: 기업금융 / 법인영업
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: mid
  - axis2.band: low
  - axis3.band: mid
  - axis4.band: very_low
  - axis5.band: mid
- reasoningHints:
  - 영업 활동이라는 표면 구조는 같지만 고객 문제와 의사결정 구조가 크게 다르다.
  - 문제 해결 방식은 상품 판매 중심에서 금융 구조 제안과 리스크 판단이 섞인 형태로 바뀐다.
  - 산출물은 계약 성사라는 공통점이 있어도 제안 내용과 평가 기준이 다르다.
  - 산업 맥락은 매우 멀다.
  - 역할 범위는 유사해 보여 Axis 5는 과도하게 낮추지 않는다.

### Bucket E. 역할 폭 / 책임 수준 차이 때문에 Axis 5가 낮거나 갈리는 케이스

### CASE-RUNNER-AX12345-009
- caseId: TSG-AX12345-009
- currentJob: 기업교육
- currentIndustry: HR / 채용 / 인사서비스
- targetJob: 교육 / 조직개발(OD)
- targetIndustry: HR / 채용 / 인사서비스
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: mid
  - axis2.band: mid
  - axis3.band: mid
  - axis4.band: high
  - axis5.band: low
- reasoningHints:
  - 교육 설계와 운영 경험은 연결되지만, 조직개발은 개인 과정 운영보다 조직 차원의 변화 설계 비중이 높다.
  - 문제 해결 방식은 프로그램 실행에서 조직 진단과 개입 설계로 이동한다.
  - 산출물은 교육 운영 결과에서 조직개발 아젠다와 변화 프로그램 구조로 바뀐다.
  - 산업 맥락은 동일하다.
  - 책임 범위와 오너십 스케일이 커져 Axis 5를 낮게 둔다.

### CASE-RUNNER-AX12345-010
- caseId: TSG-AX12345-010
- currentJob: 행정
- currentIndustry: 공공기관
- targetJob: HR 운영(HR Ops)
- targetIndustry: HR / 채용 / 인사서비스
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: low
  - axis2.band: low
  - axis3.band: low
  - axis4.band: low
  - axis5.band: mid
- reasoningHints:
  - 문서 처리와 운영 지원이라는 표면 유사성은 있지만 핵심 업무 구조는 다르다.
  - 문제 해결 방식은 행정 절차 집행에서 인사 데이터와 운영 정책 관리로 바뀐다.
  - 산출물은 공문/행정 처리 결과에서 인사 운영 정확도와 제도 운영 안정성으로 달라진다.
  - 산업과 이해관계자 구조도 바뀐다.
  - 역할 폭은 지원 성격이라 겉보기보다 Axis 5만 약간 남는다.

### Bucket F. 전반적으로 높아야 하는 near-transition 케이스

### CASE-RUNNER-AX12345-011
- caseId: TSG-AX12345-011
- currentJob: 기술영업
- currentIndustry: 엔터프라이즈 솔루션
- targetJob: 솔루션영업
- targetIndustry: 엔터프라이즈 솔루션
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: high
  - axis2.band: high
  - axis3.band: high
  - axis4.band: high
  - axis5.band: mid_high
- reasoningHints:
  - 고객 문제 파악, 제품 설명, 제안 정렬, 수주 지원 구조가 거의 이어진다.
  - 문제 해결 방식도 기술 설명과 문제-솔루션 매핑 중심으로 유사하다.
  - 산출물과 평가 기준은 제안 적합성, 딜 진전, 수주 기여로 가깝다.
  - 산업과 고객 맥락이 동일하다.
  - 포트폴리오 범위 차이 정도만 남는다.

### CASE-RUNNER-AX12345-012
- caseId: TSG-AX12345-012
- currentJob: UI 디자인
- currentIndustry: B2C 플랫폼
- targetJob: 프로덕트디자인
- targetIndustry: B2C 플랫폼
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: high
  - axis2.band: mid_high
  - axis3.band: high
  - axis4.band: high
  - axis5.band: mid_high
- reasoningHints:
  - 화면 구조 설계와 사용자 흐름 반영이라는 업무 축이 이어진다.
  - 문제 해결 방식은 시각 설계 중심에서 문제 정의와 인터랙션 판단까지 조금 넓어진다.
  - 산출물은 화면 설계안과 제품 경험 개선안으로 매우 가깝다.
  - 산업과 사용자 맥락은 동일하다.
  - 오너십은 조금 넓어지지만 near-transition으로 읽는다.

### Bucket G. 전반적으로 낮아야 하는 cross-transition 케이스

### CASE-RUNNER-AX12345-013
- caseId: TSG-AX12345-013
- currentJob: 신사업/사업개발(BD)
- currentIndustry: 핀테크
- targetJob: 브랜드마케팅
- targetIndustry: 럭셔리 / 패션 / 뷰티
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: low
  - axis2.band: low
  - axis3.band: low
  - axis4.band: very_low
  - axis5.band: mid
- reasoningHints:
  - 성장 목표라는 상위 목적은 비슷해 보여도 핵심 업무 구조가 다르다.
  - 문제 해결 방식은 제휴/시장 진입 구조화에서 브랜드 메시지와 캠페인 운영으로 바뀐다.
  - 산출물과 평가 기준도 사업 기회 발굴에서 브랜드 인지도와 캠페인 반응으로 달라진다.
  - 산업 맥락 차이가 매우 크다.
  - 책임 수준은 비슷할 수 있어 Axis 5만 상대적으로 덜 낮다.

### CASE-RUNNER-AX12345-014
- caseId: TSG-AX12345-014
- currentJob: 일반영업
- currentIndustry: 식음료 유통
- targetJob: 사업기획
- targetIndustry: 식음료 유통
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: low
  - axis2.band: low
  - axis3.band: low
  - axis4.band: high
  - axis5.band: low
- reasoningHints:
  - 산업은 같지만 영업 실행과 사업 계획 수립은 구조적으로 다르다.
  - 문제 해결 방식은 거래 성사와 관계 관리에서 사업 구조 분석과 의사결정 지원으로 이동한다.
  - 산출물은 매출 실적과 거래 결과에서 사업 계획안과 손익 가설로 달라진다.
  - 산업 맥락은 동일하다.
  - 역할 폭과 오너십 기준이 달라 Axis 5도 낮다.

### Bucket H. borderline disagreement 유도용 케이스

### CASE-RUNNER-AX12345-015
- caseId: TSG-AX12345-015
- currentJob: 공공사업 운영
- currentIndustry: 공공기관
- targetJob: 대외협력
- targetIndustry: 공공기관
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: mid
  - axis2.band: mid
  - axis3.band: mid
  - axis4.band: high
  - axis5.band: mid_high
- reasoningHints:
  - 외부 기관과 조율하는 운영 구조는 이어질 수 있다.
  - 문제 해결 방식은 사업 운영 안정화에서 이해관계자 정렬과 관계 조정 중심으로 일부 이동한다.
  - 산출물은 운영 결과와 보고에서 협력 구조 정리와 대외 커뮤니케이션 결과로 갈린다.
  - 산업과 제도 맥락은 동일하다.
  - 대외 대표성 비중 때문에 Axis 5 해석이 갈릴 수 있다.

### CASE-RUNNER-AX12345-016
- caseId: TSG-AX12345-016
- currentJob: 기업교육
- currentIndustry: 교육 / 코칭 / 훈련서비스
- targetJob: 직무교육
- targetIndustry: 교육 / 코칭 / 훈련서비스
- focusAxes: [1,2,3,4,5]
- expected:
  - axis1.band: mid_high
  - axis2.band: mid_high
  - axis3.band: high
  - axis4.band: high
  - axis5.band: mid
- reasoningHints:
  - 교육 설계와 운영 구조는 이어진다.
  - 문제 해결 방식은 조직 단위 과제 대응에서 특정 직무 역량 중심 설계로 조금 좁아진다.
  - 산출물은 과정 설계안, 교안, 운영 결과로 거의 가깝다.
  - 산업 맥락은 동일하다.
  - 역할 범위는 넓은 기업교육에서 직무 특화로 조정되어 Axis 5가 갈릴 수 있다.

## 2026-04-04 Starter Set Concrete Selection for First Manual QA Run

이 starter set은 전체 16건 baseline을 대체하지 않으며, first manual QA run용 첫 샘플 묶음이다.

### Final Selected Cases

#### Case 1 — TSG-AX12345-011
- selectionBucket: near-transition
- currentJob: 기술영업 / currentIndustry: 엔터프라이즈 솔루션
- targetJob: 솔루션영업 / targetIndustry: 엔터프라이즈 솔루션
- primaryAxesToWatch: Axis 1, Axis 2, Axis 4 (모두 high 예상)
- whySelected: near-transition의 기준점. 모든 축이 high~mid_high 구간이어야 정상임을 먼저 확인하는 역할. "이 케이스가 낮게 나오면 scoring formula가 보수적으로 잘못 잠긴 것"을 확인하는 false-low 탐지 앵커
- manualQAValue: near-transition에서 false low가 발생하는지 빠르게 탐지

#### Case 2 — TSG-AX12345-007
- selectionBucket: Axis 4 split-strong
- currentJob: 백엔드개발 / currentIndustry: AI / 데이터 / 클라우드
- targetJob: 백엔드개발 / targetIndustry: 게임 / 콘텐츠 플랫폼
- primaryAxesToWatch: Axis 1 (high), Axis 4 (low)
- whySelected: 동일 직무명인데 Axis 4 (고객 유형 연결성)가 낮아야 하는 핵심 교정 케이스. "직무명이 같다고 Axis 4가 자동으로 높지 않다"는 원축 기준의 핵심 원리를 테스트. Axis 1이 high이고 Axis 4가 low인 축 간 분리를 직접 드러냄
- manualQAValue: Axis 4 독립성 교정 효과 최대. 직무명 동일성에 끌려 false high 주는 경향 탐지

#### Case 3 — TSG-AX12345-003
- selectionBucket: borderline + Axis 4 split
- currentJob: 프로젝트관리(PM) / currentIndustry: B2B SaaS
- targetJob: 서비스기획 / targetIndustry: B2C 플랫폼
- primaryAxesToWatch: Axis 1 (mid_high), Axis 4 (low), Axis 5 (mid borderline)
- whySelected: 직무 구조 연결성은 높은데 고객 유형 연결성이 낮은 대표적 borderline. B2B→B2C 반전이 Axis 4를 어떻게 낮추는지, 그 판단이 Axis 1과 분리되는지를 직접 확인하는 케이스. Axis 5도 갈릴 수 있어 disagreement 학습 효과 높음
- manualQAValue: Axis 1 / Axis 4 분리 교정. B2B→B2C 전환에서 Axis 4 독립 판정 감각 교정

#### Case 4 — TSG-AX12345-009
- selectionBucket: Axis 5 split-strong
- currentJob: 기업교육 / currentIndustry: HR / 채용 / 인사서비스
- targetJob: 교육 / 조직개발(OD) / targetIndustry: HR / 채용 / 인사서비스
- primaryAxesToWatch: Axis 4 (high), Axis 5 (low)
- whySelected: 같은 산업, 비슷한 직무명인데 Axis 5 (직무 성격 연결성)가 낮아야 하는 핵심 교정 케이스. "교육 설계/운영"과 "조직개발"은 표면상 유사하지만 일의 결이 다르다. Axis 5가 title보다 work character를 읽어야 함을 교정
- manualQAValue: Axis 5 독립성 교정 효과 최대. 직무명 유사성이 직무 성격 연결성을 자동으로 보장하지 않음을 탐지

#### Case 5 — TSG-AX12345-013
- selectionBucket: cross-transition
- currentJob: 신사업/사업개발(BD) / currentIndustry: 핀테크
- targetJob: 브랜드마케팅 / targetIndustry: 럭셔리 / 패션 / 뷰티
- primaryAxesToWatch: Axis 1 (low), Axis 2 (low), Axis 4 (very_low), Axis 5 (mid — 상대적으로만)
- whySelected: cross-transition 앵커. 다수 축이 low인데 Axis 5만 mid로 남는 패턴을 확인. "성장 목표라는 표면 유사성에 끌려 false high를 주면 안 된다"는 것을 anchor하는 케이스
- manualQAValue: false high 방지. 전반적 cross-transition에서 과대평가 패턴 탐지

### Why These 5 Cases First
- 이 5건은 원축 5개 중 Axis 1/4/5 교정에 집중적이다
- Axis 4 교정: TSG-AX12345-007 (같은 직무, 다른 산업), TSG-AX12345-003 (B2B→B2C 반전)
- Axis 5 교정: TSG-AX12345-009 (같은 산업/유사 직무명, 일의 결이 다름)
- near anchor: TSG-AX12345-011 (false low 탐지)
- cross anchor: TSG-AX12345-013 (false high 탐지)
- 이 5건으로 "표면 유사성이 각 축을 자동으로 높이지 않는다"는 원축 독립 판정 원리를 빠르게 교정 가능

### Excluded but Important Next Candidates

#### TSG-AX12345-008
- whyDeferred: Axis 4 very_low 케이스로 TSG-AX12345-007과 역할이 겹침. 2차 라운드에서 "같은 직무명 다른 산업" 변형을 보강할 때 함께 실행하면 효과적

#### TSG-AX12345-015
- whyDeferred: Axis 5 disagreement 가능성이 높은 좋은 borderline이지만, TSG-AX12345-003이 borderline 역할을 이미 커버. 2차 라운드에서 공공기관 맥락 borderline으로 유용

#### TSG-AX12345-014
- whyDeferred: 같은 산업(식음료 유통)인데 Axis 4 high, Axis 1/3/5 low라는 특이한 패턴. 흥미롭지만 첫 QA run에 넣으면 해석이 복잡해질 수 있어 2차로 이동

## 5축 Baseline Coverage Memo
- 현재 baseline은 `same-family near`, `adjacent-family bridgeable`, `same industry / different job`, `same job / different industry`, `similar workflow / different deliverable`, `ownership expansion`, `public / private interpretation gap`을 모두 포함한다.
- Axis 2는 `표면상 유사하지만 해결 메커니즘이 갈리는 케이스`를 추가해 false high를 막는 방향으로 보강했다.
- Axis 3은 `산출물 / 평가 기준`이 갈리는 케이스를 별도 버킷으로 분리해 low 판독 근거가 보이게 했다.
- Axis 4는 `같은 직무 / 다른 산업` 케이스를 넣어 직무명 동일성이 산업 맥락 차이를 덮지 못하게 했다.
- Axis 5는 `책임 범위 확대`, `역할 범위 축소`, `대외 대표성 증가`처럼 같은 제목만으로 읽기 어려운 갈림을 포함한다.
- 아직 부족한 family는 `same job / same industry 내 level-up`, `파트너영업 / 채널영업 인접 전환`, `IR / 공시와 경영분석 / FP&A 인접 전환`, `규제 산업 specialist 간 public-private 이동`이다.
- 다음 보강은 `similar deliverable / different problem-solving mode`, `ownership downgrade with same title`, `lateral but domain-shifted`, `public-private borderline` 쪽을 우선한다.
