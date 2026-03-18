const endpoint = 'https://reject-analyzer.vercel.app/api/extract-job-posting';
const cases = [
  {
    id: 'target_relay',
    kind: 'target',
    url: 'https://www.saramin.co.kr/zf_user/jobs/relay/view?view_type=list&rec_idx=53309370&t_ref=jobcategory_recruit&t_ref_content=section_favor_002&t_ref_area=301#seq=0'
  },
  {
    id: 'saramin_table',
    kind: 'general_saramin',
    url: 'https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=38699014'
  },
  {
    id: 'saramin_normal',
    kind: 'general_saramin',
    url: 'https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=37919314'
  },
  {
    id: 'saramin_english_mixed',
    kind: 'english_mixed',
    url: 'https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=40015521'
  }
];
function parseResult(status, text) {
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (!json || typeof json !== 'object') {
    return { status, parseError: true, raw: text.slice(0, 500) };
  }
  const meta = json.meta || {};
  const finalText = String(json.finalText || '');
  return {
    status,
    ok: Boolean(json.ok),
    error: json.error || null,
    textLength: Number(meta.textLength || 0) || Number(meta.text_length || 0) || null,
    jdSignalCount: Number(meta?.jdSignals?.jdSignalCount || meta?.jdSignalCount || 0) || null,
    matchedKeywords: Array.isArray(meta?.jdSignals?.matchedKeywords) ? meta.jdSignals.matchedKeywords : [],
    validation: json.ok ? 'OK' : String(json.error || 'ERROR'),
    finalTextLength: finalText.length || 0,
    source: meta.source || null,
    saraminContentSource: meta.saraminContentSource || null,
  };
}
const results = [];
for (const entry of cases) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: entry.url })
    });
    const text = await res.text();
    results.push({ id: entry.id, kind: entry.kind, url: entry.url, ...parseResult(res.status, text) });
  } catch (err) {
    results.push({ id: entry.id, kind: entry.kind, url: entry.url, transportError: String(err?.message || err) });
  }
}
console.log(JSON.stringify(results, null, 2));
