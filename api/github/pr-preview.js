import { readBearerToken, setCors, jsonError } from "../_mcp_auth.js";
import { buildGithubPrCareerCandidateContract } from "../../src/lib/githubCareerCandidateContract.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "POST required");
  }

  const bearer = readBearerToken(req);
  if (!bearer) {
    return jsonError(res, 401, "AUTH_REQUIRED", "Authorization Bearer token required");
  }

  // Contract skeleton only:
  // - no GitHub API calls
  // - no DB writes
  // - no model calls
  // - no notification dispatch
  // TODO: Replace this bearer presence check with the product auth verifier
  // when the GitHub OAuth integration PR is opened.
  const payload = req.body?.payload || req.body;
  const candidate = buildGithubPrCareerCandidateContract(payload);

  return res.status(200).json({
    ok: true,
    mode: "contract_preview",
    candidate,
  });
}
