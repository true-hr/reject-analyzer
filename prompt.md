[목표]
PASSMAP domainShiftRisk 정확도 향상을 위해,
currentRole / targetRole source priority를 roleInference 중심으로 재정렬하는 최소 수정 설계를 먼저 만든다.

[현재 확인된 팩트]
- ctx.objective.roleInference는 사용되지만, target 쪽 fallback 성격이 강함
- currentRole 쪽은 roleInference를 전혀 안 쓰거나 거의 안 씀
- state.role / state.roleTarget 같은 거친 값이 inference보다 앞서 채택되는 구간이 있어
  정확도 저하 가능성이 있음
- 이 불균형 때문에 roleDistance/ontology가 있어도 입력 role 자체가 부정확할 수 있음

[이번 작업 목표]
코드부터 수정하지 말고,
src/lib/decision/riskProfiles/companyIndustryContext/domainShiftRisk.js 에서
currentRole / targetRole source priority를 정확히 정리하고,
최소 수정 패치 설계를 먼저 제시하라.

[절대 금지]
- App.jsx 수정 금지
- analyzer 수정 금지
- roleDistance.js 수정 금지
- score 체계 변경 금지
- broad refactor 금지

[해야 할 일]
1. domainShiftRisk.js에서 현재 currentRole / targetRole 추출식을 실제 코드 기준으로 다시 정리하라.
2. ctx.objective.roleInference 안에 어떤 필드가 있는지 확인하라.
   - fineRole
   - familyRole
   - 기타 role 관련 필드
3. currentRole과 targetRole 각각에 대해
   "현재 우선순위"와 "권장 우선순위"를 비교표로 제시하라.
4. 정확도 관점에서 왜 수정이 필요한지 설명하라.
5. 최소 수정으로 가능한 패치 설계를 제시하라.
6. 아직 코드는 수정하지 말고 설계와 영향 범위만 답하라.

[출력 형식]
1) 수정 분류: 안전 패치 / 결정적 패치
2) 영향 파일: O/X
3) currentRole 현재 우선순위
4) targetRole 현재 우선순위
5) 권장 우선순위안
6) 정확도 개선 기대 효과
7) 수동 검증 시나리오 6개