import { extractSentenceDomain, isGenericSemanticSentence, shouldAllowUnknownSafePair, isDomainCompatible } from './src/lib/semantic/match.js';
const tests = [
  { id:'A-1', jd:'서비스 기획 및 전략 부문 팀장/팀원 경력직 채용', rs:'현장 인력 스케줄 관리' },
  { id:'A-2', jd:'경영기획 및 GTM 전략 지원', rs:'스케줄 조정 및 운영 대응' },
  { id:'B-1', jd:'서비스 로드맵 수립', rs:'서비스 개선 로드맵 운영' }
];
for (const t of tests){
 const jdDomain=extractSentenceDomain(t.jd); const rsDomain=extractSentenceDomain(t.rs);
 const jdGeneric=isGenericSemanticSentence(t.jd); const rsGeneric=isGenericSemanticSentence(t.rs);
 const compatible=isDomainCompatible(jdDomain,rsDomain);
 const unknownSafe=shouldAllowUnknownSafePair(t.jd,t.rs,jdDomain,rsDomain);
 console.log(JSON.stringify({id:t.id,jd:t.jd,jdDomain,jdGeneric,rs:t.rs,rsDomain,rsGeneric,compatible,unknownSafe},null,2));
}
