다음 단계 진행.

이번 작업은 원인 확정 후 최소 패치 적용이다.

1. 수정 분류
- 안전에 가까운 소규모 정책 패치
- append-only / 최소 수정

2. 영향 파일
- O: src/App.jsx
- 1파일만 수정

3. 작업 목표
- fast mode에서 JD/Resume 입력 단계를 건너뛴 경우에도
  career fallback 조건(role + industry + totalYears)이 충족되면
  canAnalyze가 true가 되도록 수정
- deep/full 기존 동작은 절대 깨지지 않게 유지

4. 정확한 수정 위치
- src/App.jsx
- canAnalyze를 계산하는 useMemo 블록
- 기존 return Boolean(jd && __resumeAttached); 구문 기준

5. 수정 원칙
- 기존 구조/함수/변수/순서 유지
- 가능하면 append-only
- 기존 jd && __resumeAttached 경로는 완전 동일 유지
- fast mode 전용 fallback만 추가
- 다른 파일 건드리지 말 것

6. 추가 요청
- 패치 후 아래 3가지를 코드 기준으로 함께 확인:
  1) fast mode에서 role/industry/totalYears가 모두 있으면 canAnalyze true가 되는지
  2) deep/full mode에서는 기존처럼 jd + resume 기준이 그대로 유지되는지
  3) 빈 상태에서는 여전히 분석이 막히는지

7. 출력 형식
- 수정 분류
- 영향 파일
- 정확한 수정 위치
- 붙여넣는 최종 코드
- 검증 결과 3줄

주의:
- 리팩토링 금지
- 설명 길게 하지 말고 실행용 결과만
- 임시 console.log 넣으면 삭제 필요 여부 표시