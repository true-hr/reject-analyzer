너는 PASSMAP 코드베이스에서 append-only / 최소 수정 원칙만 지키는 엔지니어다.

현재 상태:

leadershipRiskEvaluator.js 추가 완료

analyze() return에 leadershipRisk 추가 완료

지금 단계는 점수 반영이 아니라 리포트 노출만 진행한다

중요 규칙:

decisionScore 수정 금지

gateCap 수정 금지

analyzer 구조 수정 금지

기존 riskProfiles 수정 금지

Top3 강제 편입 금지

신규 helper 추가 금지

기존 leadershipRisk 값을 리포트 설명용으로만 노출

append-only / 최소 수정만 허용

목표

analysis.leadershipRisk 또는 최종 result의 leadershipRisk를 읽어서,
리포트 UI에서 none이 아닐 때만 짧은 설명 블록 1개를 노출한다.

이 블록은:

최종 점수에 영향 주지 않음

gate처럼 보이면 안 됨

“추가 확인 포인트” 또는 “채용 해석 포인트” 성격이어야 함

노출 우선순위

기존 리포트 구조를 조사해서 아래 중 가장 최소 수정으로 붙일 수 있는 위치 1곳만 선택한다.

우선순위:

hidden risk / 추가 확인 포인트 카드

내부 해석/설명 카드

context signal 성격의 보조 카드

Top3 핵심 리스크 영역에는 이번 라운드에서 넣지 않는다.

해야 할 일

현재 리포트 렌더 경로에서 leadershipRisk를 읽어올 수 있는 가장 가까운 파일 1개만 찾는다

그 파일 1개만 수정해서, leadershipRisk.riskLevel !== "none"일 때만 설명 블록을 append-only로 추가한다

문구는 type별로 분기한다

문구 규칙

leadership_gap

“지원 역할은 리더 경험을 요구하는 방향으로 해석될 수 있어, 실제 리딩 경험 여부를 추가 확인받을 가능성이 있습니다.”

scope_mismatch

“현재 리더십 수준과 지원 역할 범위 사이에 차이가 있어, 채용 측이 역할 적합성을 추가로 확인할 수 있습니다.”

overqualified

“현재 리더십 수준 대비 지원 역할이 더 실무 중심으로 보여, 오버스펙 또는 역할 불일치로 해석될 수 있습니다.”

추가로 scaleDirection도 문구에 약하게만 반영 가능:

upgrade → “상향 이동 맥락에서는 일부 완화될 수 있습니다.”

downgrade → “하향 이동 맥락에서는 의문이 더 커질 수 있습니다.”

단, 문구는 과장하지 말고 참고 신호처럼만 보여라.

출력 형식

반드시 아래 형식으로만 답해라.

수정 분류

영향 파일

정확한 삽입 위치

붙여넣기 최종 코드

테스트 방법

중요:

실제 코드를 읽고 가장 최소 수정 파일 1개만 선택

구조 변경 금지

설명보다 실행 코드 중심으로 답할 것