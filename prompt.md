## 2026-03-08 PASSMAP InterviewQuestion v2 (primary + followUp) 추가

### 1. 수정 분류

* 안전 패치
* append-only
* 최소 수정
* 엔진 로직 영향 없음

### 2. 영향 파일

src/lib/decision/index.js (1파일)

---

# 3. 작업 목표

기존 InterviewQuestion v1 구조에 **followUp 질문 1개를 추가**하여
면접관 질문 흐름을 다음처럼 확장한다.

```
primary question
   ↓
followUp question
```

기존 fallback 구조는 그대로 유지한다.

```
family → layer → group → generic
```

UI 연결은 하지 않는다.

---

# 4. 기존 구조 (v1)

```
interviewQuestion: {
  primary: "...",
  canonicalKey: "...",
  ruleHit: true/false,
  version: "v1",
  source: "canonical_family_rule"
}
```

---

# 5. 확장 구조 (v2)

```
interviewQuestion: {
  primary: "...",
  followUp: "...",
  canonicalKey: "...",
  ruleHit: true/false,
  version: "v2",
  source: "canonical_family_rule | layer_fallback | group_fallback | generic_fallback"
}
```

primary는 기존 질문 유지
followUp만 새로 추가

---

# 6. FOLLOWUP_QUESTION_RULES 추가

위치
RISK_INTERVIEW_RULES 근처 상수 구간

```
const FOLLOWUP_QUESTION_RULES = {

  TITLE_SENIORITY_MISMATCH:
    "그 사례에서 본인이 직접 내린 가장 중요한 의사결정은 무엇이었고, 그 판단이 결과에 어떤 영향을 줬는지 설명해 주실 수 있을까요?",

  ROLE_SKILL_MISSING:
    "그 경험에서 본인이 실제로 수행한 핵심 작업과, 그 작업이 결과에 어떻게 기여했는지 조금 더 구체적으로 설명해 주실 수 있을까요?",

  DOMAIN_SHIFT:
    "그 경험에서 사용했던 접근 방식이나 문제 해결 방법이 이 포지션의 문제와 어떻게 연결될 수 있는지 설명해 주실 수 있을까요?",

  OWNERSHIP_GAP:
    "그 프로젝트에서 본인이 직접 결정하거나 책임졌던 부분은 어디까지였고, 그 결정이 결과에 어떤 영향을 줬나요?",

  LANGUAGE_SIGNAL:
    "그 결과를 만들기 위해 실제로 어떤 행동을 했고, 이전 상태와 비교했을 때 무엇이 달라졌는지 설명해 주실 수 있을까요?",

  TIMELINE_INCONSISTENCY:
    "그 시기의 선택이나 이동이 이후 커리어 방향에 어떤 영향을 줬는지 설명해 주실 수 있을까요?"
};
```

---

# 7. helper 확장

기존

```
__buildInterviewQuestionV1(ctx)
```

을 수정하지 말고
**followUp만 추가**

```
function __buildInterviewQuestionV1(ctx) {

  const family = ctx?.canonicalKey || null;

  const result = { ...기존 생성 로직 };

  let followUp = null;

  if (family && FOLLOWUP_QUESTION_RULES[family]) {
    followUp = FOLLOWUP_QUESTION_RULES[family];
  }

  return {
    ...result,
    followUp,
    version: "v2"
  };
}
```

---

# 8. fallback followUp

family가 없는 경우

```
followUp:
"그 상황에서 본인이 직접 한 행동과 그로 인해 달라진 결과를 조금 더 구체적으로 설명해 주실 수 있을까요?"
```

---

# 9. 검증 포인트

다음은 반드시 동일해야 한다.

* analyzer 결과
* scoring
* priority
* Top3 risk
* pass probability

그리고 확인

1. canonical family hit 시 followUp 생성되는지
2. fallback 경로에서도 followUp 생성되는지
3. explain.interviewerNote 영향 없는지

---

# 10. 금지사항

* decision/index.js 외 파일 수정 금지
* UI 수정 금지
* resolver 수정 금지
* fallback 구조 변경 금지
* helper 리팩토링 금지
* scoring 경로 수정 금지
