const endpoint = 'https://reject-analyzer.vercel.app/api/extract-job-posting';
const cases = [
  { id: 'target_relay', kind: 'target', url: 'https://www.saramin.co.kr/zf_user/jobs/relay/view?view_type=list&rec_idx=53309370&t_ref=jobcategory_recruit&t_ref_content=section_favor_002&t_ref_area=301#seq=0' },
  { id: 'saramin_table', kind: 'general_saramin', url: 'https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=38699014' },
  { id: 'saramin_normal', kind: 'general_saramin', url: 'https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=37919314' },
  { id: 'saramin_english_mixed', kind: 'english_mixed', url: 'https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=40015521' }
];
const signalKeywords = ['담당업무','주요업무','업무내용','자격요건','지원자격','우대사항','필수요건','requirements','responsibilities'];
const noisePatterns = [/로그인/,/회원가입/,/공유하기/,/지원하기/,/추천공고/,/기업정보$/, /더보기$/, /스크랩/, /지도 보기/, /길찾기/, /스카이뷰/];
function countJdSignals(text) { const s = String(text || '').toLowerCase(); return signalKeywords.filter((k) => s.includes(String(k).toLowerCase())).length; }
function getNoiseCount(text) { return String(text || '').split(/\r?\n/).map((x)=>x.trim()).filter(Boolean).filter((line)=>noisePatterns.some((re)=>re.test(line))).length; }
const results = [];
for (const entry of cases) {
  try {
    const res = await fetch(endpoint, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ url: entry.url }) });
    const raw = await res.text();
    let json = null;
    try { json = JSON.parse(raw); } catch {}
    const finalText = String(json?.finalText || '');
    results.push({
      id: entry.id,
      kind: entry.kind,
      status: res.status,
      validation: json?.ok ? 'OK' : String(json?.error || 'ERROR'),
      textLength: Number(json?.meta?.textLength || 0) || null,
      jdSignalCount: json?.ok ? countJdSignals(finalText) : Number(json?.meta?.jdSignals?.jdSignalCount || 0) || null,
      matchedKeywords: Array.isArray(json?.meta?.jdSignals?.matchedKeywords) ? json.meta.jdSignals.matchedKeywords : [],
      finalTextLength: finalText.length,
      noiseLineCount: getNoiseCount(finalText),
      top8: finalText.split(/\r?\n/).slice(0,8)
    });
  } catch (err) {
    results.push({ id: entry.id, kind: entry.kind, transportError: String(err?.message || err) });
  }
}
console.log(JSON.stringify(results, null, 2));
