방금 수정한 2파일 기준으로 다음 검증만 진행해줘. 추가 리팩토링 금지.

검증 목표:
1) 아래 2개 URL이 더 이상 "올바른 링크를 입력해 주세요."로 떨어지지 않는지 확인
- https://www.jobkorea.co.kr/Recruit/GI_Read/48632687?sc=729&sn=103
- https://www.jobkorea.co.kr/Recruit/GI_Read/48715314?sc=511

2) 성공 시
- textarea에 본문이 주입되는지
- extractionMode / finalDecision / errorCode 가 무엇인지 확인

3) 실패 시
- INVALID_URL / NOT_JOB_DESCRIPTION / TEXT_TOO_SHORT / FETCH_FAILED 중 정확히 어느 코드인지 확인
- 프론트에 어떤 메시지가 노출되는지 확인

4) 회귀 확인
- 명백한 비공고 URL 1개는 여전히 차단되는지 확인
- 사람인 링크 1개도 기존처럼 정상 동작하는지 확인

출력 형식:
1. 검증 분류
2. 확인 파일
3. URL별 결과
4. 문제 있으면 정확한 실패 지점
5. 추가 수정 필요 여부 (O/X)