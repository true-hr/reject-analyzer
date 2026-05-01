# JOB_RESPONSIBILITY_PROFILE_MAP Audit

## 1. 총 canonical job id 개수
- 114

## 2. map에 들어간 id 개수
- 114

## 3. 누락 id 목록
- 없음

## 4. profile별 개수 집계
- individual_execution: 13
- execution_plus_coordination: 51
- cross_function_coordination: 26
- planning_and_decision: 22
- high_scope_ownership: 2

## 5. 경계 판정이 어려웠던 직무
- JOB_BUSINESS_BUSINESS_DEVELOPMENT | Business Development | planning_and_decision | 파트너십 실행도 있지만 사업 모델 설계와 시장 진입 방향 판단이 책임의 중심이었다. 단순 조율보다 계획과 의사결정 지원 비중이 더 컸다.
- JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS | Customer Success | cross_function_coordination | 고객 성과를 보지만 핵심 책임은 고객과 내부 팀을 연결해 리스크와 확장 흐름을 조율하는 데 있다. 결과 ownership보다 운영 허브 성격이 더 선명했다.
- JOB_HR_ORGANIZATION_HRBP | Hrbp | planning_and_decision | 조직 구조, 인력 계획, 리더 자문이 직접 책임으로 잡혀 있었다. 운영 실행형 HR보다 상위 판단과 방향 제시 책임이 더 강했다.
- JOB_ENGINEERING_DEVELOPMENT_SYSTEMS_ENGINEERING | Systems Engineering | planning_and_decision | 요구사항 구조화와 시스템 아키텍처 정의가 owner 책임으로 명시됐다. 통합 실행도 있으나 중심축은 상위 설계와 판단이었다.
- JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT | Production Management | high_scope_ownership | 생산 라인 운영을 넘어서 실적, 자원, 일정 결과를 함께 책임지는 역할이다. 조율형보다는 운영 결과 ownership이 더 크게 걸린 직무로 봤다.
- JOB_MARKETING_PR_COMMUNICATIONS | Pr Communications | cross_function_coordination | 메시지 작성보다 대외 이슈 대응과 내외부 이해관계자 정렬 책임이 더 강했다. 직접 수행형보다 조율 허브 성격으로 읽는 편이 맞았다.
- JOB_PROCUREMENT_SCM_STRATEGIC_SOURCING | Strategic Sourcing | planning_and_decision | 단순 발주보다 공급 구조 판단과 소싱 전략 설계가 중심이다. 실행 coordination 요소는 있지만 우선 책임은 계획과 선택에 있었다.
- JOB_RESEARCH_PROFESSIONAL_CONSULTING | Consulting | planning_and_decision | 프로젝트 수행형 요소가 있어도 최종 산출은 방향 제안과 의사결정 지원에 맞춰져 있었다. 직접 실행보다 판단 프레임을 만드는 책임이 더 컸다.
- JOB_SALES_KEY_ACCOUNT_MANAGEMENT | Key Account Management | high_scope_ownership | 계정 단위의 장기 성장과 복수 이해관계자 관계를 함께 책임지는 구조다. 일반 영업 조율보다 계정 outcome ownership이 더 분명했다.
- JOB_SALES_TECHNICAL_SALES | Technical Sales | cross_function_coordination | 기술 설명을 직접 하더라도 핵심은 세일즈, 프리세일즈, 고객 기술조직 사이를 연결해 수주를 진전시키는 데 있다. 직접 수행형보다 고객/내부 연결 책임이 더 강했다.

## 6. 생성 근거 규칙 요약
- 주로 읽은 필드: roles[].responsibilityHints, roles[].levelHints, families[].summaryTemplate, families[].strongSignals, families[].boundarySignals
- execution_plus_coordination vs cross_function_coordination 구분 기준: 직접 산출이나 처리 책임이 중심이면 execution_plus_coordination, 여러 팀과 이해관계자를 연결하고 운영 구조를 맞추는 책임이 중심이면 cross_function_coordination
- planning_and_decision vs high_scope_ownership 구분 기준: 방향 설정과 구조 정의가 중심이면 planning_and_decision, 조직·라인·계정·사업 단위의 운영 결과 책임이 크게 걸리면 high_scope_ownership
- individual_execution vs execution_plus_coordination 구분 기준: 정해진 범위 안에서 직접 수행이 중심이면 individual_execution, 직접 수행에 더해 개선·협업·운영 연결 책임이 붙으면 execution_plus_coordination
