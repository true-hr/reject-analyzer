// ✅ Vercel API base (env)
// - .env.local 예: VITE_PARSE_API_BASE=https://reject-analyzer.vercel.app
// - 없으면 상대경로(/api/enhance)로 fallback (로컬/동일오리진용)
const __BASE = (() => {
  try {
    const v = (import.meta?.env?.VITE_PARSE_API_BASE || "").toString().trim();
    return v ? v.replace(/\/$/, "") : "";
  } catch {
    return "";
  }
})();

const AI_ENDPOINT = (__BASE ? __BASE : "") + "/api/enhance";

export async function enhanceWithAI({ jd, resume }) {
  try {
    const resp = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd, resume }),
    });

    const data = await resp.json().catch(() => null);
    if (!data || data.ok !== true) return null;

    return data.ai || null;
  } catch {
    return null; // 네트워크/서버 문제면 null → 폴백
  }
}