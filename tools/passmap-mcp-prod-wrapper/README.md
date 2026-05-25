# passmap-mcp-prod-wrapper

PASSMAP 운영 환경용 stdio MCP wrapper. Claude Desktop / mcp-inspector 같은 MCP 호스트가 이 wrapper를 spawn하면, 사용자의 AI 대화에서 추출한 경험 후보를 PASSMAP 운영 저장소에 직접 저장하거나 검색할 수 있습니다.

로컬 데모(`tools/passmap-mcp-local/`)와 **tool 이름·입력 schema는 동일**합니다. 차이는 저장 경로뿐입니다.

| | local 데모 | prod wrapper (본 패키지) |
|---|---|---|
| 저장 위치 | `./data/experiences.json` (단일 파일) | PASSMAP 운영 Supabase (`raw_sources` / `experience_cards` / `experience_evidence`) |
| 호출 경로 | wrapper 내부 함수 | `POST https://reject-analyzer.vercel.app/api/save-analysis-run?action=mcp_*` |
| 인증 | 없음 | `Authorization: Bearer ${PASSMAP_MCP_TOKEN}` |
| 용도 | UX 검증 | 실 사용 |

---

## 전제

- 12-B1 (pairing code → MCP token 인프라) 배포 완료
- 12-B2 (`mcp_save_experience` / `mcp_search_experiences` 운영 endpoint) 배포 완료
- Supabase `user_mcp_pairings` 마이그레이션 적용 완료
- 본 wrapper를 실행할 환경(Claude Desktop 등)에 `PASSMAP_MCP_TOKEN` 환경변수 설정 가능
- Node.js 18.17+

---

## URL 정책 (12-B4)

본 wrapper의 REST base URL은 **반드시 Vercel API host**입니다.

```
API_BASE_URL = https://reject-analyzer.vercel.app   (default)
```

GitHub Pages(`https://true-hr.github.io/reject-analyzer/`)는 정적 프론트 전용이며 `/api/*` serverless 함수가 존재하지 않습니다. wrapper base로 GitHub Pages 주소를 넣으면 모든 호출이 404가 됩니다. 자세한 정책은 저장소 루트 CLAUDE.md "Operating URL Policy" 섹션 참조.

특수 사유로 override가 필요하면 `PASSMAP_API_BASE` 환경변수를 사용하세요. 다음 경우에는 override가 **자동으로 무시**되고 기본 Vercel host로 fallback 됩니다. 부팅 시 stderr 진단에 `apiBaseSource=ignored-*`로 노출됩니다.

| 입력 | `apiBaseSource` |
|---|---|
| URL parse 실패 또는 `http(s)://` 이외의 스킴 (예: `not a url`, `ftp://...`) | `ignored-malformed` |
| 호스트가 `*.github.io` (예: `https://true-hr.github.io/reject-analyzer`, `https://true-hr.github.io`) | `ignored-github-pages` |
| 경로가 `/reject-analyzer`로 시작 (Pages base path, 어떤 호스트든) | `ignored-github-pages` |

즉 GitHub Pages 주소는 실수로 넣어도 wrapper가 Vercel로 자동 교정합니다. 다른 Vercel 프리뷰 / 자체 dev API host로 향하는 의도적 override는 그대로 허용됩니다 (예: `https://some-vercel-preview.vercel.app`, `https://example.test`).

---

## 노출 tool

### 1. `save_experience_candidate`

운영 endpoint: `POST /api/save-analysis-run?action=mcp_save_experience`

| 필드 | 타입 | 필수 | 비고 |
|---|---|---|---|
| `title` | string ≥ 2자 | ✅ | 경험 후보 제목 (20자 이내 권장) |
| `situation` | string | ⚠️ | STAR의 S |
| `task` | string | ⚠️ | STAR의 T |
| `actions` | string[] | ⚠️ | 사용자가 실제로 한 행동 |
| `resultCandidate` | string |  | 결과 후보. 근거가 약하면 비워 둘 것 |
| `skills` / `jobTags` / `industryTags` | string[] |  | 태그 |
| `evidenceTexts` | string[] |  | 원문 인용. AI 생성문 금지 |
| `riskNotes` | string[] |  | 과장 위험·불확실성 메모 |
| `sourcePlatform` | `"chatgpt" \| "gemini" \| "claude" \| "manual" \| "unknown"` |  | 원본 대화 플랫폼 |
| `sourceConversationTitle` | string |  | 원본 대화 제목 |

⚠️ `situation` / `task` / `actions` 중 **최소 한 개**는 채워야 합니다.

`rawText` / `raw_text` / `user_id` / `userId` 같은 필드는 호출자가 보내더라도 wrapper가 사전 검증 단계에서 제거하고, 운영 서버도 명시적으로 무시합니다.

### 2. `search_experience_candidates`

운영 endpoint: `POST /api/save-analysis-run?action=mcp_search_experiences`

| 필드 | 타입 | 비고 |
|---|---|---|
| `query` | string | 자유 텍스트 검색 (대소문자 무시, 부분 일치) |
| `skills` / `jobTags` / `industryTags` | string[] | 각 dimension 내 AND 필터 |
| `limit` | number | 기본 5, 상한 10 |

---

## 인증 (PASSMAP_MCP_TOKEN)

본 wrapper는 **장기 MCP token**을 환경변수에서 읽습니다.

```
PASSMAP_MCP_TOKEN=pmcp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 토큰 발급 절차 (요약)

1. PASSMAP 웹에 로그인한 상태에서 `POST /api/save-analysis-run?action=mcp_pairing_create` 호출 → 6자리 pairing code 발급 (10분 TTL)
2. 본 wrapper를 실행할 호스트에서 `POST /api/save-analysis-run?action=mcp_pairing_exchange` 호출 (code 첨부) → `pmcp_…` 토큰 1회 수령 (90일 TTL)
3. 받은 토큰을 `PASSMAP_MCP_TOKEN` 환경변수에 설정

자세한 절차는 저장소 루트의 `docs/mcp-pairing.md` 참조.

### 토큰 미설정 시 동작

- 서버 boot은 **성공**합니다. Claude Desktop / mcp-inspector에서 tool 목록 자체는 보입니다.
- 어떤 tool이든 호출하면 다음 형태의 친절한 오류가 반환됩니다.

```json
{
  "ok": false,
  "errorCode": "PASSMAP_MCP_TOKEN_MISSING",
  "message": "PASSMAP_MCP_TOKEN 환경변수가 필요합니다. PASSMAP에서 pairing code를 발급한 뒤 token으로 교환해 설정하세요."
}
```

이 단계에서는 네트워크 호출도 일어나지 않으므로 토큰이 없는 상태로 wrapper를 켜 두어도 운영 API에 부하를 주지 않습니다.

---

## 실행

### 의존성 설치

```powershell
cd "C:\Users\qorrk\Documents\passmap-work\reject-analyzer\tools\passmap-mcp-prod-wrapper"
& "C:\Program Files\nodejs\npm.cmd" install
```

루트 `package.json` / `package-lock.json`은 **건드리지 않습니다.** 본 패키지는 자체 `node_modules`를 가집니다.

### Self-test (네트워크 없이 빠른 검증)

```powershell
& "C:\Program Files\nodejs\npm.cmd" run self-test
```

기대 종료: `ALL TESTS PASSED`, exit 0.

### Windows Claude Desktop 등록 예시

`%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "passmap-prod": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "C:\\Users\\qorrk\\Documents\\passmap-work\\reject-analyzer\\tools\\passmap-mcp-prod-wrapper\\server.mjs"
      ],
      "env": {
        "PASSMAP_MCP_TOKEN": "pmcp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "PASSMAP_API_BASE": "https://reject-analyzer.vercel.app"
      }
    }
  }
}
```

설정 후 Claude Desktop을 재시작하면 `save_experience_candidate` / `search_experience_candidates` 두 tool이 노출됩니다.

> ⚠️ `PASSMAP_API_BASE`에 **절대** `https://true-hr.github.io/reject-analyzer`를 넣지 마세요. GitHub Pages는 정적 프론트 전용이며 `/api/*`가 없습니다. API는 Vercel에서만 동작합니다.

### mcp-inspector로 띄우기

```powershell
& "C:\Program Files\nodejs\npx.cmd" @modelcontextprotocol/inspector `
  "C:\Program Files\nodejs\node.exe" `
  "C:\Users\qorrk\Documents\passmap-work\reject-analyzer\tools\passmap-mcp-prod-wrapper\server.mjs"
```

토큰이 설정되어 있다면 inspector UI에서 두 tool을 직접 호출해 볼 수 있습니다.

### 운영 API smoke (qa-smoke)

토큰이 없으면 명확히 SKIP 됩니다.

```powershell
& "C:\Program Files\nodejs\npm.cmd" run qa-smoke
```

토큰을 설정하고 실행하면 운영 Supabase에 1건 저장 + 검색을 수행합니다. 데이터는 운영 환경에 잔존하므로 평소엔 실행하지 마세요.

```powershell
$env:PASSMAP_MCP_TOKEN = "pmcp_..."
& "C:\Program Files\nodejs\npm.cmd" run qa-smoke
```

출력은 안전한 진단만 포함합니다 (`apiBase`, HTTP status, `experienceId`, `count`). 토큰 평문은 절대 출력되지 않습니다.

---

## 보안 정책

- `PASSMAP_MCP_TOKEN` 평문은 **wrapper 코드·자체 로그·자체 명령 출력 어디에도 기록되지 않습니다.** 서버 자체는 `tokenPresent=true|false` boolean과 `apiBase`만 stderr에 1회 출력합니다.
- `user_id`는 wrapper가 절대 송신하지 않습니다. 운영 서버가 `sha256(token) = token_hash` 매칭으로 row를 찾아 `user_id`를 강제 적용합니다 (12-B1 user_id 위조 방지 정책).
- `rawText` / `raw_text`는 wrapper 사전 검증에서 제거되며, 송신해도 운영 서버가 명시적으로 무시합니다 (12-B2 rawText 저장 금지 정책).
- 토큰을 git에 커밋하지 마세요. 본 패키지는 `.env*` 파일을 만들지 않습니다.

---

## 다음 단계

- **12-B5**: PASSMAP 웹 "MCP 연동" 패널 — 토큰 발급·목록·revoke UI 구현 완료. `?action=mcp_pairing_revoke` + `?action=mcp_pairing_list` 운영 API와 `src/components/mcp/McpConnectionPanel.jsx` 양쪽 모두 배포됨. 자세한 흐름은 `docs/mcp-pairing.md` 7-A / 7-B 절 참조.
