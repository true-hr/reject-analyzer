import assert from "node:assert/strict";
import {
  classifyAuthLinkError,
  getAuthLinkErrorUserMessage,
  sanitizeAuthLinkError,
} from "../authErrorDiagnostics.js";

{
  const error = new Error("Auth session missing!");
  const diagnostic = sanitizeAuthLinkError(error);
  assert.equal(diagnostic.category, "session");
  assert.equal(getAuthLinkErrorUserMessage(error), "로그인 세션을 다시 확인한 뒤 시도해주세요.");
}

{
  const error = new Error("Unsupported provider: kakao provider is not enabled");
  assert.equal(classifyAuthLinkError(error), "provider_config");
  assert.equal(getAuthLinkErrorUserMessage(error), "카카오 계정 연결 설정을 확인해야 합니다.");
}

{
  const error = new Error("URL not allowed: https://passmap-app.vercel.app/?token=secret-token&code=abc");
  const diagnostic = sanitizeAuthLinkError(error);
  assert.equal(diagnostic.category, "redirect");
  assert.equal(getAuthLinkErrorUserMessage(error), "카카오 연결 반환 주소 설정을 확인해야 합니다.");
  assert.doesNotMatch(JSON.stringify(diagnostic), /passmap-app|secret-token|code=abc/);
}

{
  const error = new Error(
    "failed access_token=secret refresh_token=secret user 11111111-1111-1111-1111-111111111111 test@example.com +821012345678"
  );
  const diagnostic = sanitizeAuthLinkError(error);
  assert.equal(diagnostic.category, "unknown");
  assert.equal(
    getAuthLinkErrorUserMessage(error),
    "카카오 계정 연결을 시작하지 못했습니다. 잠시 후 다시 시도해주세요."
  );
  assert.doesNotMatch(JSON.stringify(diagnostic), /secret|11111111|test@example|821012345678/);
}

console.log("authErrorDiagnostics tests passed");
