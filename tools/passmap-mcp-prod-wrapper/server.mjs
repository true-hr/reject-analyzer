// tools/passmap-mcp-prod-wrapper/server.mjs
// Production stdio MCP wrapper for PASSMAP.
//
// Exposes the same two tools as tools/passmap-mcp-local/ — same names, same
// input schemas — but forwards calls to the Vercel API host instead of
// writing to a local JSON file.
//
//   save_experience_candidate    → POST /api/save-analysis-run
//                                       ?action=mcp_save_experience
//   search_experience_candidates → POST /api/save-analysis-run
//                                       ?action=mcp_search_experiences
//
// Auth: Bearer ${PASSMAP_MCP_TOKEN}. The wrapper boots even when the env
// var is missing so that Claude Desktop / mcp-inspector can still list the
// tools; missing-token errors are surfaced only at tool-call time.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  saveExperienceCandidate,
  searchExperienceCandidates,
  getConfig,
} from "./lib/apiClient.mjs";
import {
  ALLOWED_SOURCE_PLATFORMS,
  SEARCH_LIMIT_DEFAULT,
  SEARCH_LIMIT_MAX,
} from "./lib/validate.mjs";

const SERVER_NAME = "passmap-mcp-prod-wrapper";
const SERVER_VERSION = "0.1.0";

function _textContent(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  };
}

function _errorContent(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    isError: true,
  };
}

const saveInputShape = {
  title: z.string().min(2, "title은 2자 이상이어야 합니다.").describe("경험 후보 제목 (20자 이내 권장)"),
  situation: z.string().optional().describe("상황·배경 (STAR의 S)"),
  task: z.string().optional().describe("맡은 역할/과제 (STAR의 T)"),
  actions: z.array(z.string()).optional().describe("사용자가 실제로 한 행동 목록"),
  resultCandidate: z.string().optional().describe("결과 후보. 원문 근거가 약하면 비워 두세요."),
  skills: z.array(z.string()).optional().describe("역량·스킬 태그"),
  jobTags: z.array(z.string()).optional().describe("직무 태그 (예: 서비스기획, PM)"),
  industryTags: z.array(z.string()).optional().describe("산업 태그 (예: 핀테크, 커머스)"),
  evidenceTexts: z.array(z.string()).optional().describe("원문 발화 근거 인용. AI가 만든 문장은 넣지 마세요."),
  riskNotes: z.array(z.string()).optional().describe("과장 위험·불확실성 메모"),
  sourcePlatform: z
    .enum(ALLOWED_SOURCE_PLATFORMS)
    .optional()
    .describe("원본 대화 플랫폼"),
  sourceConversationTitle: z.string().optional().describe("원본 대화 제목 (선택)"),
};

const searchInputShape = {
  query: z.string().optional().describe("자유 텍스트 검색어. 대소문자·부분 일치."),
  skills: z.array(z.string()).optional().describe("스킬 태그 AND 필터"),
  jobTags: z.array(z.string()).optional().describe("직무 태그 AND 필터"),
  industryTags: z.array(z.string()).optional().describe("산업 태그 AND 필터"),
  limit: z
    .number()
    .int()
    .positive()
    .max(SEARCH_LIMIT_MAX)
    .optional()
    .describe(`결과 최대 개수 (기본 ${SEARCH_LIMIT_DEFAULT}, 상한 ${SEARCH_LIMIT_MAX})`),
};

const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

server.tool(
  "save_experience_candidate",
  "현재 AI 대화에서 사용자가 실제로 한 일·결정·결과를 PASSMAP 운영 API에 경험 후보로 저장합니다. " +
    "원문 전체는 저장하지 않고, evidenceTexts에 명시한 인용만 보관합니다. " +
    "PASSMAP_MCP_TOKEN 환경변수가 필요하며, 미설정 시 호출 시점에 친절한 오류를 반환합니다.",
  saveInputShape,
  async (args) => {
    const result = await saveExperienceCandidate(args);
    return result.ok ? _textContent(result) : _errorContent(result);
  }
);

server.tool(
  "search_experience_candidates",
  "PASSMAP 운영 API에서 사용자가 저장한 경험 후보를 검색합니다. " +
    "query는 자유 텍스트 부분 일치(대소문자 무시)이며, skills/jobTags/industryTags는 AND 필터입니다. " +
    "PASSMAP_MCP_TOKEN 환경변수가 필요하며, 미설정 시 호출 시점에 친절한 오류를 반환합니다.",
  searchInputShape,
  async (args) => {
    const result = await searchExperienceCandidates(args || {});
    return result.ok ? _textContent(result) : _errorContent(result);
  }
);

async function main() {
  // Boot diagnostics go to stderr so they cannot corrupt the stdio MCP
  // protocol frames on stdout. Token plaintext is never logged — only the
  // boolean "tokenPresent" + the resolved API base.
  const cfg = getConfig();
  console.error(
    `[passmap-mcp-prod-wrapper] boot: apiBase=${cfg.apiBase} ` +
      `apiBaseSource=${cfg.apiBaseSource} tokenPresent=${cfg.tokenPresent}`
  );
  if (!cfg.tokenPresent) {
    console.error(
      "[passmap-mcp-prod-wrapper] PASSMAP_MCP_TOKEN is not set. The server " +
        "will still start so tool listings work, but every tool call will " +
        "return PASSMAP_MCP_TOKEN_MISSING until the env var is provided."
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Stdio servers stay attached for the lifetime of the parent client.
}

main().catch((err) => {
  console.error("[passmap-mcp-prod-wrapper] fatal:", err);
  process.exit(1);
});
