// tools/passmap-mcp-local/server.mjs
// Local stdio MCP server for the PASSMAP "experience candidate" demo.
//
// Purpose: validate the save / search tool UX and data shape with a local
// MCP client (Claude Desktop / mcp-inspector). NOT a production endpoint.
// - Stores data in ./data/experiences.json on disk (single file).
// - Never talks to Supabase or any production API.
// - Designed so the same tool names, input shape, and response shape can be
//   reused later in a real Vercel API route + service-role Supabase save.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { saveExperience, searchExperiences } from "./lib/store.mjs";
import {
  ALLOWED_SOURCE_PLATFORMS,
  SEARCH_LIMIT_DEFAULT,
  SEARCH_LIMIT_MAX,
} from "./lib/validate.mjs";

const SERVER_NAME = "passmap-mcp-local";
const SERVER_VERSION = "0.1.0";

function _textContent(payload) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function _errorContent(errorCode, message) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ ok: false, errorCode, message }, null, 2),
      },
    ],
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
    .enum([...ALLOWED_SOURCE_PLATFORMS])
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

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

server.tool(
  "save_experience_candidate",
  "현재 AI 대화에서 사용자가 실제로 한 일·결정·결과를 PASSMAP 로컬 데모 저장소에 경험 후보로 저장합니다. " +
    "원문 전체는 저장하지 않고, evidenceTexts에 명시한 인용만 보관합니다.",
  saveInputShape,
  async (args) => {
    try {
      const saved = saveExperience(args);
      return _textContent({
        ok: true,
        experienceId: saved.id,
        message: "경험 후보를 로컬 PASSMAP 데모 저장소에 저장했습니다.",
        saved,
      });
    } catch (err) {
      return _errorContent(err.code || "SAVE_FAILED", err.message || "저장에 실패했습니다.");
    }
  }
);

server.tool(
  "search_experience_candidates",
  "PASSMAP 로컬 데모 저장소에서 사용자가 저장한 경험 후보를 검색합니다. " +
    "query는 자유 텍스트 부분 일치(대소문자 무시)이며, skills/jobTags/industryTags는 AND 필터입니다.",
  searchInputShape,
  async (args) => {
    try {
      const result = searchExperiences(args || {});
      return _textContent({
        ok: true,
        count: result.count,
        items: result.items,
      });
    } catch (err) {
      return _errorContent(err.code || "SEARCH_FAILED", err.message || "검색에 실패했습니다.");
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Stdio servers stay attached for the lifetime of the parent client.
  // No stdout chatter — MCP requires stdio for protocol only.
}

main().catch((err) => {
  // Errors must go to stderr so they don't corrupt stdio protocol frames.
  console.error("[passmap-mcp-local] fatal:", err);
  process.exit(1);
});
