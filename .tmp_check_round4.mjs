import { extractSentenceDomain, isGenericSemanticSentence, shouldAllowUnknownSafePair } from './src/lib/semantic/match.js';
const jd='서비스 기획 및 전략 부문 팀장/팀원 경력직 채용';
const rs='현장 인력 스케줄 관리';
const j=extractSentenceDomain(jd);
const r=extractSentenceDomain(rs);
console.log(JSON.stringify({jd,jdDomain:j,jdGeneric:isGenericSemanticSentence(jd),rs,resumeDomain:r,resumeGeneric:isGenericSemanticSentence(rs),allow:shouldAllowUnknownSafePair(jd,rs,j,r)},null,2));
