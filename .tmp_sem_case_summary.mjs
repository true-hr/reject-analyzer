import { semanticMatchJDResume } from './src/lib/semantic/match.js';
const cases=[
  { id:'A-1', jd:`서비스 기획 및 전략 부문 팀장/팀원 경력직 채용\n서비스 정책 수립 및 요구사항 정의\n로드맵 기반 개선 과제 도출`, rs:`현장 인력 스케줄 관리\n일일 배치 운영 및 근태 확인\n현장 운영 이슈 대응` },
  { id:'A-2', jd:`전략기획\n사업전략 수립\n경영기획 및 GTM 전략 지원`, rs:`운영지원\n현장 운영관리\n스케줄 조정 및 운영 대응` },
  { id:'B-1', jd:`서비스기획\n사용자 요구사항 정의\n서비스 로드맵 수립\n유관부서 협업 기반 정책 개선`, rs:`PM으로 요구사항 정의 수행\n서비스 개선 로드맵 운영\n정책/기능 기획 경험` }
];
for (const c of cases){
  const out = await semanticMatchJDResume(c.jd,c.rs,{topK:4,maxJdUnits:40,maxResumeUnits:120,concurrency:1,useLocalStorageCache:false,device:'cpu',dtype:'q8'});
  const all=[];
  for(const m of out.matches||[]){ for(const cand of m.candidates||[]){ all.push({jd:m.jd,...cand}); } }
  all.sort((a,b)=>b.score-a.score);
  console.log(JSON.stringify({id:c.id, ok:out.ok, matches:(out.matches||[]).length, totalCandidates:all.length, best:all[0]||null},null,2));
}
