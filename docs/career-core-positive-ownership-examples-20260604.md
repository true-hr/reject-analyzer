# Career Core Positive Ownership Examples - 2026-06-04

## Summary

- Added positive ownership fixtures for Sales, Growth Marketing, CX, Data, and PM/Service Planning.
- Added Korean positive ownership fixtures for the same five domains.
- Updated `classifyOwnershipSeniority()` so positive ownership is inferred only when domain, action, ownership, judgment, and impact evidence appears together.
- Added Korean evidence regex for ownership, judgment, and impact signals used in PASSMAP resume inputs.
- Preserved existing false-positive guardrails by keeping domain-specific `shouldNotInfer` expansion scoped to `unknown_admin_support`.

## Positive Cases

- Sales proposal strategy owner: customer problem discovery, proposal strategy, commercial negotiation, and revenue ownership.
- Growth marketing campaign owner: campaign hypothesis, creative A/B testing, performance metric analysis, and budget optimization.
- CX/VOC improvement owner: VOC analysis, customer journey diagnosis, support policy improvement, and customer issue reduction.
- Data metric/dashboard analyst: metric definition, SQL query design, root cause analysis, dashboard design, and decision support.
- PM/service planning requirements owner: problem definition, requirements definition, prioritization, cross-functional collaboration, and post-release monitoring.

## Korean Positive Cases

- Sales: 고객 문제 파악, 요구사항 직접 파악, 제안 전략 구성, 가격/도입 범위 협상, 계약 전환, 수주 기여.
- Growth Marketing: 캠페인 가설 수립, 소재 A/B 테스트, 타겟 세그먼트, 예산 배분, CPA/전환율/ROAS 분석, 소재 개선.
- CX/VOC: VOC 분석, 고객 문의 유형 분석, 고객 여정 문제 정의, 상담 정책/응대 가이드 개선, 반복 문의 감소, 처리 시간 개선.
- Data: 지표 정의, SQL 쿼리 직접 작성, 전환율 하락 원인 분석, 대시보드 설계, 의사결정 지원, 리텐션 KPI, 코호트 분석.
- PM/Service Planning: 문제 정의, 요구사항 정의, PRD 작성, 사용자 스토리, 우선순위 결정, 정책/플로우 설계, 개발/디자인 협업, 배포 후 지표 모니터링.

## Guardrails

- No CareerProfile wiring.
- No timeline/RoleFit/scoring changes.
- No UI/API/DB/Supabase/env/deployment changes.
- No package changes.
- Existing negative/domain precision cases must remain passing.

## Verification

Record command results in the PR body:

- `node scripts/test-career-core-ownership-positive.js`
- `node scripts/test-career-core-ownership-domain-precision.js`
- `node scripts/test-career-core-ownership-precision.js`
- `node scripts/test-career-core-ownership-seniority.js`
- `node scripts/test-career-core-ownership-evidence-improvements.js`
- `node scripts/test-career-core-gap-employment-timeline.js`
- `node scripts/test-career-core-short-tenure-risk.js`
- `node scripts/test-career-core-employment-metadata.js`
- `node scripts/test-career-core-employment-type.js`
- `node scripts/qa-career-core-date-employment-baseline.js`
- `npm run build`
