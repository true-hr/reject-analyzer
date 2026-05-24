# PASSMAP MCP prod wrapper — sample prompts

Claude Desktop / mcp-inspector에서 본 wrapper를 등록한 뒤 바로 써볼 수 있는 자연어 프롬프트 모음입니다. 모든 예시는 `save_experience_candidate` / `search_experience_candidates` tool만을 사용합니다.

---

## 1. 저장 — 진행한 대화에서 경험 후보 1건 만들기

### 가장 기본 (과장 금지)

```
방금 대화에서 내가 실제로 한 일만 PASSMAP 경험 후보로 저장해줘.
과장하지 말고 evidenceTexts에는 내가 말한 문장만 그대로 넣어줘.
sourcePlatform은 chatgpt로 표시해줘.
```

### STAR 명시 + 결과는 약하면 비워두기

```
이번 대화를 STAR로 정리해서 PASSMAP에 저장해줘.
- title은 20자 이내로
- situation, task, actions는 채우고
- resultCandidate는 내가 명시한 결과 수치가 없으면 빈 값으로 둬
- evidenceTexts에는 내가 친 문장만 인용
- 출처는 sourcePlatform=claude, sourceConversationTitle은 이 대화 제목
```

### 위험·불확실성 메모 동반 저장

```
방금 결정 과정을 PASSMAP 경험 후보로 저장해줘.
다만 다음 두 가지는 riskNotes에 명시해줘:
- 결과를 검증할 수치가 아직 없다
- 외부 협업자가 같이 만든 결과라 내 기여만 분리하기 어렵다
태그는 skills=["서비스기획"], jobTags=["PM"], industryTags=["HR Tech"]로.
```

---

## 2. 검색 — 저장된 경험 후보 찾기

### 자유 텍스트

```
PASSMAP에서 MCP, 서비스기획, HR Tech 관련 경험 후보를 찾아줘.
```

### 다중 태그 AND 필터

```
PASSMAP에서 다음 조건으로 검색해줘:
- skills 안에 "PM"과 "데이터분석" 둘 다 들어 있는 경험
- 최대 5개
```

### 직무 + 산업 교집합

```
PASSMAP 경험 중에 jobTags에 "PM"이 있고 industryTags에 "핀테크"가 있는 항목만 보여줘.
limit은 3.
```

---

## 3. 동작 확인용

### tool 목록만 확인 (token 미설정 환경에서도 가능)

```
지금 사용 가능한 tool 목록 알려줘.
```

기대: `save_experience_candidate`, `search_experience_candidates` 두 개가 나옵니다. 토큰이 없으면 실제 호출 시점에 `PASSMAP_MCP_TOKEN_MISSING` 오류가 반환됩니다 (네트워크 호출은 일어나지 않습니다).

### 토큰 미설정 상태에서 일부러 호출하기

```
search_experience_candidates를 호출해서 PASSMAP에 저장된 게 있는지 확인해줘.
```

기대 응답 (toolResult.content[0].text):

```json
{
  "ok": false,
  "errorCode": "PASSMAP_MCP_TOKEN_MISSING",
  "message": "PASSMAP_MCP_TOKEN 환경변수가 필요합니다. PASSMAP에서 pairing code를 발급한 뒤 token으로 교환해 설정하세요."
}
```

---

## 4. 하면 안 되는 프롬프트 (서버가 무시함)

이런 식으로 원문을 통째로 넘기려 해도 운영 서버가 `rawText` / `raw_text` / `user_id` 필드를 명시적으로 무시합니다. wrapper도 사전 검증 단계에서 제거합니다.

```
대화 전체 원문을 rawText에 그대로 넣어서 PASSMAP에 저장해줘.
```

→ 저장은 정상 진행되지만 `rawText`는 어디에도 보관되지 않습니다 (`raw_sources.raw_text = null`, `metadata.rawTextStored = false`). PASSMAP에 영구 저장되는 것은 STAR 후보 카드 + 사용자가 인용한 짧은 발화(`evidenceTexts`)뿐입니다.
