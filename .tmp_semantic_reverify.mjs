import {
  splitToUnits,
  extractSentenceDomain,
  isDomainCompatible,
  shouldAllowUnknownSafePair,
  semanticMatchJDResume
} from "./src/lib/semantic/match.js";

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

for (const c of cases) {
  const jdUnits = splitToUnits(c.jd, { maxUnits: 40, isJd: true });
  const rsUnits = splitToUnits(c.rs, { maxUnits: 120, isJd: false });
  const jdDomains = jdUnits.map((text) => ({ text, domain: extractSentenceDomain(text) }));
  const rsDomains = rsUnits.map((text) => ({ text, domain: extractSentenceDomain(text) }));

  const matrix = [];
  for (const j of jdDomains) {
    for (const r of rsDomains) {
      matrix.push({
        jd: j.text,
        jdDomain: j.domain,
        resume: r.text,
        resumeDomain: r.domain,
        compatible: isDomainCompatible(j.domain, r.domain),
        unknownSafe: shouldAllowUnknownSafePair(j.text, r.text, j.domain, r.domain),
      });
    }
  }

  let runtime = null;
  let runtimeError = null;
  try {
    runtime = await semanticMatchJDResume(c.jd, c.rs, {
      topK: 4,
      maxJdUnits: 40,
      maxResumeUnits: 120,
      concurrency: 1,
      useLocalStorageCache: true,
      device: "auto",
      dtype: "q8",
    });
  } catch (e) {
    runtimeError = e?.message || String(e);
  }

  console.log(JSON.stringify({
    id: c.id,
    jdUnits,
    rsUnits,
    jdDomains,
    rsDomains,
    matrix,
    runtime,
    runtimeError,
  }, null, 2));
}
