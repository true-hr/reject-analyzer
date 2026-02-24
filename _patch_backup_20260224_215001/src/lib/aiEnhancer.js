// src/lib/aiEnhancer.js
const AI_ENDPOINT = "https://orange-shadow-95c1.qorrkdts12.workers.dev/api/enhance";

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
