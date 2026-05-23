# PASSMAP MCP Local Demo

PASSMAP의 MCP Connector 1차 데모입니다. **운영용이 아닙니다.** ChatGPT/Claude 같은 MCP 호스트가 PASSMAP에 경험 후보를 저장/검색하는 흐름의 **UX와 데이터 구조만 로컬에서 검증**합니다.

## 목적

- 운영 Supabase에 저장하지 않습니다.
- PASSMAP 운영 API/Auth/env를 건드리지 않습니다.
- 저장은 이 폴더 안 `data/experiences.json` 파일에만 일어납니다.
- MCP tool 이름·입력 schema·응답 shape를 그대로 운영 endpoint에 옮길 수 있도록 설계되어 있습니다.

## 폴더 구조

```
tools/passmap-mcp-local/
├── package.json          # 독립 패키지 (루트 package.json 무변경)
├── server.mjs            # stdio MCP 서버 본체
├── self-test.mjs         # 의존성 없는 핵심 로직 smoke 테스트
├── lib/
│   ├── validate.mjs      # 입력 검증 (순수 함수)
│   └── store.mjs         # JSON 파일 저장/검색 (순수 함수)
├── data/
│   └── experiences.json  # 로컬 저장소 (커밋해서 공유하지 마세요)
├── README.md
└── sample-prompts.md
```

## 실행 환경

- Windows 11, Node v18.17 이상 (검증: v24.13.1)
- 작업 경로 예시: `C:\Users\qorrk\Documents\passmap-work\reject-analyzer\tools\passmap-mcp-local`

## 핵심 로직만 먼저 검증 (의존성 설치 불필요)

`self-test.mjs`는 MCP SDK 없이 순수 JS만 사용합니다. 의존성 설치 전에 데이터 shape를 확인할 수 있습니다.

```powershell
cd "C:\Users\qorrk\Documents\passmap-work\reject-analyzer\tools\passmap-mcp-local"
& "C:\Program Files\nodejs\node.exe" self-test.mjs
```

`ALL TESTS PASSED`가 나오면 핵심 로직은 정상입니다.

## MCP 서버 실행 (의존성 설치 후)

루트 `package.json`은 그대로 둡니다. 이 폴더 안에서만 의존성을 설치합니다.

```powershell
cd "C:\Users\qorrk\Documents\passmap-work\reject-analyzer\tools\passmap-mcp-local"
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" start
```

서버는 stdio 프로토콜로 동작하므로 콘솔에 보이는 출력은 없습니다. MCP 호스트가 spawn해야 의미가 있습니다.

## Claude Desktop 연결 설정

`%APPDATA%\Claude\claude_desktop_config.json` (Windows) 또는 `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)에 다음을 추가합니다.

```json
{
  "mcpServers": {
    "passmap-local": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "C:\\Users\\qorrk\\Documents\\passmap-work\\reject-analyzer\\tools\\passmap-mcp-local\\server.mjs"
      ]
    }
  }
}
```

수정 후 Claude Desktop을 완전히 종료(트레이까지) 후 재실행하면 두 개의 tool이 노출됩니다.

## mcp-inspector로 단독 검증 (선택)

```powershell
cd "C:\Users\qorrk\Documents\passmap-work\reject-analyzer\tools\passmap-mcp-local"
& "C:\Program Files\nodejs\npx.cmd" @modelcontextprotocol/inspector node server.mjs
```

브라우저 UI에서 두 tool을 직접 호출해 응답을 확인할 수 있습니다.

## Tool 1 — `save_experience_candidate`

현재 AI 대화에서 사용자가 실제로 한 일·결정·결과를 경험 후보로 저장합니다.

### 입력 예시

```json
{
  "title": "결제 실패율 0.8 → 0.4% 개선",
  "situation": "월 100만 건 결제 중 실패율 0.8%였음",
  "task": "결제 안정화 책임자로 지정됨",
  "actions": ["원인 분석", "PG사 연동 재설계", "재시도 큐 도입"],
  "resultCandidate": "실패율 0.4%로 절반 감소",
  "skills": ["문제 정의", "결제 안정화", "장애 분석"],
  "jobTags": ["PM", "서비스기획"],
  "industryTags": ["커머스"],
  "evidenceTexts": [
    "사용자: PG 재시도 큐를 새로 도입해서 실패율이 0.4%까지 떨어졌어."
  ],
  "riskNotes": [],
  "sourcePlatform": "chatgpt",
  "sourceConversationTitle": "결제 안정화 회고"
}
```

### 응답 예시

```json
{
  "ok": true,
  "experienceId": "exp_<uuid>",
  "message": "경험 후보를 로컬 PASSMAP 데모 저장소에 저장했습니다.",
  "saved": { "...전체 저장본..." }
}
```

### 검증 규칙

- `title` 필수, 2자 이상
- `situation`/`task`/`actions` 중 최소 한 개 필요
- `sourcePlatform`은 `chatgpt|gemini|claude|manual|unknown` 외 값이면 `unknown`으로 정규화
- 원문 전체(rawText)는 입력 schema에 **존재하지 않음** — 의도적으로 받지 않음
- `evidenceTexts`는 사용자 발화 인용만 권장 (AI 생성 문장은 넣지 말 것)

## Tool 2 — `search_experience_candidates`

저장된 경험 후보를 검색합니다.

### 입력 예시

```json
{
  "query": "결제",
  "jobTags": ["PM"],
  "industryTags": ["커머스"],
  "limit": 5
}
```

### 응답 예시

```json
{
  "ok": true,
  "count": 1,
  "items": [
    {
      "id": "exp_<uuid>",
      "title": "결제 실패율 0.8 → 0.4% 개선",
      "summary": "월 100만 건 결제 중 실패율 0.8%였음 / 결제 안정화 책임자로 지정됨",
      "skills": ["문제 정의", "결제 안정화", "장애 분석"],
      "jobTags": ["PM", "서비스기획"],
      "industryTags": ["커머스"],
      "suggestedUse": "이 경험은 PM, 서비스기획, 커머스 관련 이력서·면접 문항에 활용할 수 있습니다.",
      "evidenceTexts": ["사용자: PG 재시도 큐를 새로 도입해서 실패율이 0.4%까지 떨어졌어."],
      "createdAt": "2026-..."
    }
  ]
}
```

### 검색 규칙

- `query`: `title`, `situation`, `task`, `actions[]`, `resultCandidate`, `skills[]`, `jobTags[]`, `industryTags[]`, `evidenceTexts[]` 전체에서 대소문자 무시 부분 일치
- `skills`/`jobTags`/`industryTags`: 각 차원 내부에서 AND 필터
- `query`가 비어 있으면 최신순 반환
- `limit` 기본 5, 상한 10

## 알려진 한계

- **단일 사용자 파일 저장소**입니다. 여러 MCP 호스트가 동시에 호출하면 마지막 쓰기가 이깁니다.
- 검색은 단순 substring + 태그 AND 필터입니다. 의미 검색·랭킹·tsvector 없음.
- `experience_evidence`/`experience_cards`/`raw_sources` 같은 Supabase 스키마 구조를 1행 JSON으로 합쳐 두었습니다. 운영 endpoint 이전 시 3 테이블 분리 매핑이 필요합니다.
- `data/experiences.json`은 **개인 로컬 저장소**이며 Git에 커밋해 공유하지 마세요. (필요하면 `.gitignore`에 추가)
- 이 폴더의 `package.json`/`node_modules`는 루트와 무관합니다. 운영 CI가 이 폴더를 빌드할 일은 없습니다.

## 운영 MCP로 가기 전 남은 것

1. **사용자 식별**: pairing-code 발급 / 검증 API (`api/mcp/pair.js`), 1회용 코드 → 장기 토큰 매핑 테이블(`user_mcp_pairings`).
2. **Vercel API route**: `api/mcp/save-experience.js` + `api/mcp/search-experiences.js` (또는 HTTP MCP 통합 endpoint 1개).
3. **Supabase 저장 매핑**: 이 데모의 단일 JSON 페이로드를 `raw_sources` + `experience_cards` + `experience_evidence` 3 테이블로 분리. 페이로드 빌더 분리는 11-A에서 만든 `saveAcceptedWorkTraceCandidates` 패턴 재사용.
4. **service_role 정책**: 11-A의 브라우저 RLS와 분리하여 서버는 `Bearer + getUser → verifiedUserId 강제` 패턴(`api/save-analysis-run.js`)을 따른다.
5. **rate limit / abuse**: `api/_security.js`의 Upstash 패턴 차용.
6. **DB 스키마 변경**: pairing 테이블 1개만 신규 — Protected 작업이라 별도 승인 필요.
7. **ChatGPT/Claude 등록**: MCP 마켓플레이스 등록은 가장 마지막.

`save_experience_candidate` / `search_experience_candidates` **tool 이름과 입력 schema는 이 데모와 운영판이 동일하게 유지**되도록 설계했습니다. 호스트(ChatGPT/Claude) 프롬프트 자산을 재사용할 수 있습니다.
