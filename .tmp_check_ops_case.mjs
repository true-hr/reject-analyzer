import { isGenericSemanticSentence, shouldAllowUnknownSafePair, extractSentenceDomain } from './src/lib/semantic/match.js';
const cases=[
  ['서비스 기획 및 전략 부문 팀장/팀원 경력직 채용','현장 인력 스케줄 관리'],
  ['서비스 정책 수립 및 요구사항 정의','현장 인력 스케줄 관리'],
  ['로드맵 기반 개선 과제 도출','현장 인력 스케줄 관리']
];
for(const [jd,rs] of cases){
  const jdD=extractSentenceDomain(jd); const rsD=extractSentenceDomain(rs);
  console.log(JSON.stringify({jd,jdD,jdGeneric:isGenericSemanticSentence(jd),rs,rsD,rsGeneric:isGenericSemanticSentence(rs),allow:shouldAllowUnknownSafePair(jd,rs,jdD,rsD)},null,2));
}
