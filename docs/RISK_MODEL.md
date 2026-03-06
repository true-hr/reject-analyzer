# PASSMAP Risk Model

본 문서는 PASSMAP 현실 리스크 모델에 아래 3개 리스크를 추가하기 위한 설계 정의다.

- `AGE_SENIORITY_GAP`
- `TITLE_SENIORITY_MISMATCH`
- `JOB_HOPPING_DENSITY`

## Engine Placement

- 엔진 흐름: `gate -> must -> domain -> seniority risk -> exp -> preferred`
- 원칙: 본 문서의 3개 리스크는 `gate`가 아닌 `risk signal`로 동작한다.

## 1) AGE_SENIORITY_GAP

### 1. 목적
- 나이 대비 누적 경력 연차가 낮을 때, 면접관이 성장속도/경력연속성 리스크로 해석할 가능성을 반영한다.

### 2. 입력 데이터 (state 필드)
- `state.age` (만 나이)
- `state.career.totalYears` (누적 경력 연차)

### 3. 계산 방식
- `expectedCareer = age - 24`
- `gap = expectedCareer - careerYears`

### 4. risk level 기준
- `gap <= 2`: 정상(리스크 없음)
- `2 < gap <= 5`: weak risk
- `gap > 5`: strong risk

### 5. PASSMAP 리포트 문구
- weak: `경력 연차가 나이 대비 다소 짧게 보여, 성장속도에 대한 확인 질문이 나올 수 있습니다.`
- strong: `경력 대비 나이가 늦은 편으로 판단될 수 있어, 경력 공백/전환 사유를 명확히 설명해야 합니다.`

### 6. engine priority 위치
- 레이어: `seniority risk` (domain 다음, exp 이전)
- 우선순위 권장: `TITLE_SENIORITY_MISMATCH` 다음, `JOB_HOPPING_DENSITY` 이전

### 7. gate 여부
- `false` (gate 아님, risk signal)

---

## 2) TITLE_SENIORITY_MISMATCH

### 1. 목적
- 현재 직급과 목표 직급의 점프 폭이 큰 경우, 역할 준비도/책임 범위 정합성 리스크를 반영한다.

### 2. 입력 데이터 (state 필드)
- `state.levelCurrent`
- `state.levelTarget`

### 3. 계산 방식
- 직급 문자열을 내부 레벨 인덱스로 정규화한다.
- `levelGap = targetLevelIndex - currentLevelIndex`

### 4. risk level 기준
- `levelGap <= 0`: 정상(리스크 없음)
- `levelGap = 1`: weak risk
- `levelGap >= 2`: strong risk

### 5. PASSMAP 리포트 문구
- weak: `현재 직급 대비 목표 직급이 한 단계 높아, 역할 범위 확장에 대한 검증 질문이 나올 수 있습니다.`
- strong: `현재 직급 대비 목표 직급 점프 폭이 커, 역할 준비도에 대한 보수적 판단이 발생할 수 있습니다.`

### 6. engine priority 위치
- 레이어: `seniority risk` (domain 다음, exp 이전)
- 우선순위 권장: seniority 리스크 중 최상위

### 7. gate 여부
- `false` (gate 아님, risk signal)

---

## 3) JOB_HOPPING_DENSITY

### 1. 목적
- 짧은 기간 내 이직 빈도가 높은 경우, 안정성/지속성 리스크를 반영한다.

### 2. 입력 데이터 (state 필드)
- `state.career.jobChanges`
- `state.career.totalYears`

### 3. 계산 방식
- `density = jobChanges / careerYears`
- `careerYears <= 0`인 경우 계산 제외(리스크 미산정)

### 4. risk level 기준
- `density <= 0.25`: 정상(리스크 없음)
- `0.25 < density <= 0.4`: weak risk
- `density > 0.4`: strong risk

### 5. PASSMAP 리포트 문구
- weak: `이직 빈도가 다소 높은 편으로 보여, 이동 사유와 성과 연속성 설명이 중요합니다.`
- strong: `짧은 기간 내 이직 밀도가 높아 안정성 리스크로 해석될 수 있습니다.`

### 6. engine priority 위치
- 레이어: `exp`
- 우선순위 권장: exp 리스크 상단(근속/공백 관련 신호와 함께 평가)
- `JOB_HOPPING_DENSITY는 seniority risk 후보였으나, 경력 안정성/연속성 성격이 강하므로 exp 레이어에 배치한다.`

### 7. gate 여부
- `false` (gate 아님, risk signal)

---

## Scoring Policy (권장)

- strong: 높은 가중치
- weak: 중간 가중치
- normal: 0점
- 최종 판단 시 gate를 대체하지 않고, 면접관 판단 시뮬레이터의 보수성 신호로만 합산한다.
