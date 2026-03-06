현재 PASSMAP 엔진에 roleDistance util이 구현되었고, Node 테스트를 통해 정상 동작을 확인하려고 한다.

테스트 목적은 다음 두 가지이다.

alias normalization이 정상 작동하는지

role graph 기반 distance 계산이 정상 작동하는지

다음 테스트 케이스를 실행하여 결과를 출력하라.

cases:

["전략기획","전략기획"]
["전략기획","사업기획"]
["전략기획","프로덕트 매니저"]
["account executive","strategic planning"]
["b2b sales","bd"]
["recruiter","hrd"]
["fp&a","세무"]
["데이터 분석","데이터 엔지니어"]
["회계","퍼포먼스 마케팅"]

출력 형식은 다음과 같아야 한다.

"roleA" → "roleB"
canonical: canonicalRoleA / canonicalRoleB
distance: N

검증 기준:

distance 0
동일 직무

distance 1
그래프 직접 연결

distance 2
그래프 2-step

distance 3+
직무 기능 전환

Infinity
그래프 연결 없음

테스트 실행 후 결과가 예상과 다른 케이스가 있으면 원인을 분석하고 수정 제안을 하라.

기존 PASSMAP 코드(analyzer / decision engine)는 수정하지 않는다.

roleDistance util의 정확성 검증만 수행한다.