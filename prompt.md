좋습니다. 방향은 승인합니다.
이제 요약이 아니라 실제 적용 가능한 최종 코드 전체를 주세요.

[필수]
아래 3개 파일에 대해 실제 붙여넣기 가능한 최종 코드만 주세요.

1) src/components/input/InputFlow.jsx
- handleRole 최종 코드 전체

2) src/lib/decision/riskProfiles/companyIndustryContext/domainShiftRisk.js
- 수정되는 3곳 모두의 최종 코드 전체
- when / score / explain 각각 생략 금지

3) src/lib/decision/riskProfiles/companySizeJumpRisk.js
- 수정되는 roleCurrent / roleTarget 관련 최종 코드 전체

[중요 검증]
- domainShiftRisk.js에서 current fallback에 state.role이 완전히 제거됐는지
- 3곳 모두 동일 계약인지
- target fallback은 roleTarget 우선 + legacy용 state.role 유지인지
- companySizeJumpRisk.js도 동일 원칙인지

[출력 형식]
1. 수정 분류
2. 영향 파일
3. 정확한 수정 위치
4. 붙여넣기 가능한 최종 코드
5. 수동 테스트 체크리스트

[주의]
- diff 금지
- 요약 금지
- 실제 최종 코드만
- 함수 일부만 말고 교체 가능한 블록 전체를 줄 것