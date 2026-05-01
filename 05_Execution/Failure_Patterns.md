# Failure Patterns

## 사용 목적
- 반복되는 버그 / 실수 / 조사 낭비를 줄이기 위한 재발 방지 사전
- 다음 조사에서 먼저 볼 증상과 anchor를 빠르게 찾기 위한 문서

## 언제 업데이트하는가
- 같은 유형의 문제나 실수가 2회 이상 반복될 때
- 조사 시간이 반복 낭비되었다고 판단될 때
- 패턴으로 일반화할 가치가 있을 때

## 기록 원칙
- 증상 / 원인 / 재발 방지 / 다음 조사 anchor 중심
- 추측이 아니라 확인된 사실 기준으로 적기
- 미확정이면 후보로 두고 확정 기록처럼 쓰지 않기

## Template
### [패턴명]

#### 증상
- 

#### 실제 원인
- 

#### 재발 방지 규칙
- 

#### 다음에 먼저 볼 파일 / anchor
- 

### [후보] true high까지 같이 눌러버리는 과보정

#### 증상
- boundary correction을 넣었는데 strong high control까지 함께 하향된다.

#### 실제 원인
- upper-mid만 겨냥해야 할 guard가 high outcome / repeated strong case까지 같이 먹는다.

#### 재발 방지 규칙
- boundary guard는 `base 4` 같은 좁은 조건으로 제한한다.
- `high outcome` 보존 조건을 분리해서 확인한다.

#### 다음에 먼저 볼 파일 / anchor
- `src/lib/analysis/buildNewgradAxisPack.js`
- `scoreExecutionDepth(input)`

### [후보] combo case 전체를 일괄 하향하는 과도한 수정

#### 증상
- `project + internship`이면 strong case/weak case 구분 없이 전부 한 단계 내려간다.

#### 실제 원인
- combo existence만 보고 감산하고 evidence strength를 안 나눈다.

#### 재발 방지 규칙
- combo guard에는 outcome strength 또는 base band 조건을 같이 둔다.
- `projectOutcomeLift < 2` 같은 보존 조건을 먼저 본다.

#### 다음에 먼저 볼 파일 / anchor
- `src/lib/analysis/buildNewgradAxisPack.js`
- `const semanticLift = ...`
- `const guardedSemanticLift = ...`

### [후보] base 4 외 구간까지 불필요하게 영향 주는 수정

#### 증상
- lower-mid / true-mid 안정 구간까지 같이 흔들린다.

#### 실제 원인
- boundary fix가 base band 조건 없이 broad하게 적용된다.

#### 재발 방지 규칙
- calibration guard는 exact base entry 조건과 함께 둔다.
- lower-mid / true-mid representative case를 같이 재검증한다.

#### 다음에 먼저 볼 파일 / anchor
- `src/lib/analysis/buildNewgradAxisPack.js`
- `base = 4` 진입 조건

## Starter Pattern Candidates
### [후보] consumer가 producer owner를 덮어씀

#### 증상
- 

#### 실제 원인
- 

#### 재발 방지 규칙
- 

#### 다음에 먼저 볼 파일 / anchor
- 

### [후보] generic fallback이 explicit asset보다 앞섬

#### 증상
- 

#### 실제 원인
- 

#### 재발 방지 규칙
- 

#### 다음에 먼저 볼 파일 / anchor
- 

### [후보] raw key가 UI에 노출됨

#### 증상
- 

#### 실제 원인
- 

#### 재발 방지 규칙
- 

#### 다음에 먼저 볼 파일 / anchor
- 

### [후보] empty shell이 남음

#### 증상
- 

#### 실제 원인
- 

#### 재발 방지 규칙
- 

#### 다음에 먼저 볼 파일 / anchor
- 

### [후보] score owner와 narrative owner가 분리됨

#### 증상
- 

#### 실제 원인
- 

#### 재발 방지 규칙
- 

#### 다음에 먼저 볼 파일 / anchor
- 

### [후보] UTF-8 / mojibake 문제

#### 증상
- 

#### 실제 원인
- 

#### 재발 방지 규칙
- 

#### 다음에 먼저 볼 파일 / anchor
- 

### [후보] patch 범위가 커져 연쇄 수정 발생

#### 증상
- 

#### 실제 원인
- 

#### 재발 방지 규칙
- 

#### 다음에 먼저 볼 파일 / anchor
- 
### [축3] upper-mid inflation post-patch replay

#### 증상
- pre-patch에서는 `project + internship` upper-mid 조합이 `100/high`로 과상승했다.
- post-patch replay에서는 동일 계열 fixture 4건이 모두 `80/mid_high`로 내려왔다.

#### 실제 원인
- `base === 4` 상태에서 `project + internship combo`와 약한 semantic lift가 결합되며 과하게 `5`로 진입하던 경로였다.

#### 재발 방지 규칙
- target case만 개선됐는지 보지 말고 true high / stable mid / low control을 같이 본다.
- coarse 3-band만 보지 말고 `displayScore`와 narrative tier를 같이 본다.
- Axis 3 수정 전후에는 고정 fixture 8건을 반드시 재실행한다.

#### 다음에 먼저 볼 파일 / anchor
- `src/lib/analysis/buildNewgradAxisPack.js`
- `scoreExecutionDepth(input)`
- `const guardedSemanticLift =`
- `return Math.min(5, base + guardedSemanticLift);`
