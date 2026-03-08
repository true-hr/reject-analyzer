import { isGenericSemanticSentence } from './src/lib/semantic/match.js';
const xs=[
 '서비스 기획 및 전략 부문 팀장/팀원 경력직 채용',
 'OO 부문 채용',
 '담당자 모집',
 '경력직 채용',
 '서비스 정책 수립 및 요구사항 정의',
 '로드맵 기반 개선 과제 도출',
 '사용자 데이터 분석 기반 기능 개선'
];
for(const x of xs){ console.log(JSON.stringify({text:x,generic:isGenericSemanticSentence(x)})); }
