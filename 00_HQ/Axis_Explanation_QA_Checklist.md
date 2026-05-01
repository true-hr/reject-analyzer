# Axis Explanation QA Checklist

## 문서 목적

이 문서는 explanationCard가 계약대로 생성되었는지 검증하기 위한 QA 기준이다.

## 1. 공통 체크리스트

각 축 explanationCard는 아래를 만족해야 한다.

구조 체크

- lead가 있다
- criteria가 있다
- scoreReason이 있다
- liftOrLimit가 있다

내용 체크

- 입력 근거가 드러난다
- 축이 보는 기준이 드러난다
- 왜 현재 점수인지 설명한다
- 제한 요인 또는 상승 조건이 있다

정합성 체크

- score와 문장 톤이 맞다
- band와 설명의 강도가 맞다
- 다른 축과 거의 같은 문장이 아니다
- generic 칭찬문으로 끝나지 않는다

## 2. 실패 판정 기준

아래 중 하나라도 해당하면 실패다.

- 현재 점수 이유가 없다
- 근거 입력이 무엇인지 알 수 없다
- criteria가 없어 축 기준이 안 보인다
- liftOrLimit가 없어 다음 행동 방향이 없다
- score 3인데 사실상 4~5처럼 읽힌다
- 다른 축 설명과 문장 구조/내용이 지나치게 유사하다

## 3. fallback 허용 기준

아래 경우에만 제한적으로 fallback 허용

- usable evidence 부족
- required signal 누락
- 특정 축에 연결 가능한 input 부족

fallback 사용 시:

- `available: false` 표기
- `fallbackReason` 기록
- generic 설명 남발 금지

## 4. 축별 중복 체크

- Axis 1과 Axis 2가 같은 이야기 반복하지 않는가
- Axis 3이 단순히 프로젝트 개수 설명으로 끝나지 않는가
- Axis 4가 Axis 5와 성향 문장으로 겹치지 않는가

## 5. 샘플 QA 질문

각 축마다 아래 질문을 던져본다.

- 이 설명만 읽고 왜 3점인지 알 수 있는가?
- 무엇이 있어서 이 점수가 유지됐는가?
- 무엇이 없어서 더 못 올라갔는가?
- 다른 축 설명과 관점이 구분되는가?
