# PASSMAP MCP Local Demo — Sample Prompts

Claude Desktop이나 ChatGPT MCP 호스트가 이 로컬 서버에 연결되었을 때, 실제로 두 tool을 호출시키는 자연어 프롬프트 예시입니다. UX 검증 단계에서 그대로 입력해 보세요.

응답으로 host가 `save_experience_candidate` 또는 `search_experience_candidates` tool을 호출하면 정상입니다. 호스트가 tool을 호출하지 않고 자체 답변만 하면 프롬프트를 명시적으로 다듬어야 합니다.

---

## 예시 1 — 대화에서 사용자 행동만 골라 저장

```
이 대화에서 내가 실제로 한 일만 골라 패스맵 경험 후보로 저장해줘.
원문 전체를 그대로 저장하지는 말고, 내 발화 인용만 evidenceTexts에 넣어줘.
AI가 제안한 아이디어는 actions에 넣지 마.
```

기대 동작:
- `save_experience_candidate` 1회 호출
- `evidenceTexts`에 사용자 발화만 인용
- `actions`에 사용자가 실제로 했다고 말한 것만 포함
- `resultCandidate`는 원문 근거 있을 때만 채움

---

## 예시 2 — JD 기반 매칭 검색

```
패스맵에서 네이버 서비스기획 JD에 맞는 내 경험을 찾아줘.
jobTags에 "서비스기획", skills에 "문제 정의" 같은 게 들어간 카드를 우선 보여줘.
결과는 3개까지만.
```

기대 동작:
- `search_experience_candidates` 1회 호출
- `query`는 "서비스기획" 또는 JD 키워드
- `jobTags`, `skills` 둘 다 채움
- `limit: 3`

---

## 예시 3 — 역량 기반 자유 검색

```
최근에 패스맵에 저장한 경험 중에서 문제해결이나 장애 분석 역량을 보여주는 거 3개만 찾아줘.
```

기대 동작:
- `search_experience_candidates` 호출
- `query: "문제해결"` 또는 `skills: ["문제해결", "장애 분석"]`
- `limit: 3`

---

## 예시 4 — 위험 표기 저장

```
이번 결제 안정화 경험은 결과 수치가 추정값이라 정확하지 않아.
riskNotes에 "결과 수치 원문 미확인" 같은 과장 위험 메모를 남기고 저장해줘.
```

기대 동작:
- `save_experience_candidate` 호출
- `riskNotes` 배열에 위험 메모 포함
- `resultCandidate`는 비우거나 추정값임을 명시한 문장만

---

## 예시 5 — 다중 저장 + 즉시 검색 라운드트립

```
방금 정리한 회고 3개를 패스맵에 따로따로 저장한 다음,
"문제 정의"가 포함된 카드만 다시 검색해서 보여줘.
```

기대 동작:
- `save_experience_candidate` 3회 호출
- 마지막에 `search_experience_candidates({ skills: ["문제 정의"] })` 호출
- 호스트가 검색 결과 요약을 자연어로 보여줌

---

## 안티-패턴 (피해야 할 호출)

다음 동작은 1차 MCP 데모 의도와 충돌합니다. 호스트가 이런 식으로 호출하면 프롬프트를 다듬거나 tool description을 강화해야 합니다.

- 사용자가 명시적으로 요청하지 않았는데 자동으로 `save_experience_candidate`를 호출
- 사용자 발화가 아닌 AI 제안 문장을 `evidenceTexts`에 넣음
- `rawText` 같은 원문 전체를 받는 경로를 새로 시도 (이 데모 schema에 없음)
- 다른 사용자 데이터를 검색하려고 시도 (이 데모는 단일 로컬 저장소뿐이라 무의미)

---

## 운영 MCP 이행 시 변경되는 것

- 사용자 식별: pairing code로 `verifiedUserId`를 받음. 자연어 프롬프트는 변하지 않음.
- 저장 대상: 로컬 JSON → Supabase `raw_sources`/`experience_cards`/`experience_evidence` 3 테이블 분리.
- 검색 범위: 단일 파일 → RLS-우회된 service role의 `WHERE user_id = verifiedUserId` 강제.
- rate limit: Upstash 기반 일일 한도.
- tool 이름과 입력 schema는 의도적으로 동일하게 유지됩니다.
