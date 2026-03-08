import { semanticMatchJDResume } from "./src/lib/semantic/match.js";

const cases = [
  {
    id: "A-1",
    jd: `서비스 기획 및 전략 부문 팀장/팀원 경력직 채용
서비스 정책 수립 및 요구사항 정의
로드맵 기반 개선 과제 도출`,
    rs: `현장 인력 스케줄 관리
일일 배치 운영 및 근태 확인
현장 운영 이슈 대응`
  },
  {
    id: "A-2",
    jd: `전략기획
사업전략 수립
경영기획 및 GTM 전략 지원`,
    rs: `운영지원
현장 운영관리
스케줄 조정 및 운영 대응`
  },
  {
    id: "B-1",
    jd: `서비스기획
사용자 요구사항 정의
서비스 로드맵 수립
유관부서 협업 기반 정책 개선`,
    rs: `PM으로 요구사항 정의 수행
서비스 개선 로드맵 운영
정책/기능 기획 경험`
  }
];

const profiles = [
  { name: "auto_q8", opts: { device: "auto", dtype: "q8" } },
  { name: "cpu_fp32", opts: { device: "cpu", dtype: "fp32" } },
  { name: "wasm_q8", opts: { device: "wasm", dtype: "q8" } }
];

for (const p of profiles) {
  console.log(`\n### PROFILE ${p.name}`);
  for (const c of cases) {
    try {
      const out = await semanticMatchJDResume(c.jd, c.rs, {
        topK: 4,
        maxJdUnits: 40,
        maxResumeUnits: 120,
        concurrency: 1,
        useLocalStorageCache: false,
        ...p.opts,
      });
      const m0 = out?.matches?.[0] || null;
      const candCount = Array.isArray(m0?.candidates) ? m0.candidates.length : 0;
      console.log(JSON.stringify({
        id: c.id,
        ok: out?.ok,
        reason: out?.reason || null,
        firstJd: m0?.jd || null,
        best: m0?.best || null,
        candidatesCount: candCount,
        matchesCount: Array.isArray(out?.matches) ? out.matches.length : 0
      }, null, 2));
    } catch (e) {
      console.log(JSON.stringify({ id: c.id, error: e?.message || String(e) }, null, 2));
    }
  }
}
