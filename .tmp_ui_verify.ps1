$ErrorActionPreference = "Stop"

function Send-Cdp {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Ws,
    [ref]$Seq,
    [string]$Method,
    [object]$Params
  )
  $id = $Seq.Value
  $Seq.Value = $Seq.Value + 1
  $obj = @{ id = $id; method = $Method; params = $Params }
  $json = $obj | ConvertTo-Json -Depth 30 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  $Ws.SendAsync([ArraySegment[byte]]::new($bytes), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult()

  while ($true) {
    $buf = New-Object byte[] 262144
    $ms = New-Object System.IO.MemoryStream
    do {
      $res = $Ws.ReceiveAsync([ArraySegment[byte]]::new($buf), [Threading.CancellationToken]::None).GetAwaiter().GetResult()
      if ($res.Count -gt 0) { $ms.Write($buf, 0, $res.Count) }
    } while (-not $res.EndOfMessage)

    $txt = [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
    if ([string]::IsNullOrWhiteSpace($txt)) { continue }
    try { $msg = $txt | ConvertFrom-Json -Depth 50 } catch { continue }
    if ($null -ne $msg.id -and [int]$msg.id -eq $id) { return $msg }
  }
}

function Wait-HttpOk {
  param([string]$Url, [int]$Retry = 80)
  for ($i = 0; $i -lt $Retry; $i++) {
    try {
      $r = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
      if ($r.StatusCode -ge 200) { return $true }
    } catch {}
    Start-Sleep -Milliseconds 500
  }
  return $false
}

$dev = $null
$edge = $null
$ws = $null
$ud = Join-Path $PWD ".tmp_edge_profile_ui_verify"
$results = @()

try {
  $dev = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev -- --host 127.0.0.1 --port 4174 --strictPort --clearScreen false" -PassThru -WindowStyle Hidden
  if (-not (Wait-HttpOk -Url "http://127.0.0.1:4174")) { throw "dev_not_ready" }

  if (Test-Path $ud) { Remove-Item -Recurse -Force $ud }
  New-Item -ItemType Directory -Path $ud | Out-Null
  $edge = Start-Process -FilePath "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" -ArgumentList "--headless=new --disable-gpu --remote-debugging-port=9222 --user-data-dir=$ud http://127.0.0.1:4174" -PassThru

  $tabs = $null
  for ($i = 0; $i -lt 30; $i++) {
    try {
      $tabs = (Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:9222/json/list" -TimeoutSec 2).Content | ConvertFrom-Json
      if ($tabs -and $tabs.Count -gt 0) { break }
    } catch {}
    Start-Sleep -Milliseconds 300
  }
  if (-not $tabs) { throw "cdp_tabs_not_ready" }
  $tab = ($tabs | Where-Object { $_.url -like "*127.0.0.1:4174*" } | Select-Object -First 1)
  if (-not $tab) { $tab = $tabs | Select-Object -First 1 }
  if (-not $tab.webSocketDebuggerUrl) { throw "cdp_ws_not_found" }

  $ws = [System.Net.WebSockets.ClientWebSocket]::new()
  $ws.ConnectAsync([Uri]$tab.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
  $seq = [ref]1

  Send-Cdp -Ws $ws -Seq $seq -Method "Runtime.enable" -Params @{} | Out-Null
  Send-Cdp -Ws $ws -Seq $seq -Method "Page.enable" -Params @{} | Out-Null

  $cases = @(
    @{
      id = "A-1"
      jd = "서비스 기획 및 전략 부문 팀장/팀원 경력직 채용`n서비스 정책 수립 및 요구사항 정의`n로드맵 기반 개선 과제 도출"
      rs = "현장 인력 스케줄 관리`n일일 배치 운영 및 근태 확인`n현장 운영 이슈 대응"
    },
    @{
      id = "A-2"
      jd = "전략기획`n사업전략 수립`n경영기획 및 GTM 전략 지원"
      rs = "운영지원`n현장 운영관리`n스케줄 조정 및 운영 대응"
    },
    @{
      id = "B-1"
      jd = "서비스기획`n사용자 요구사항 정의`n서비스 로드맵 수립`n유관부서 협업 기반 정책 개선"
      rs = "PM으로 요구사항 정의 수행`n서비스 개선 로드맵 운영`n정책/기능 기획 경험"
    }
  )

  foreach ($c in $cases) {
    Send-Cdp -Ws $ws -Seq $seq -Method "Page.navigate" -Params @{ url = "http://127.0.0.1:4174" } | Out-Null
    Start-Sleep -Seconds 2

    $jd = ($c.jd | ConvertTo-Json -Compress)
    $rs = ($c.rs | ConvertTo-Json -Compress)
    $cid = ($c.id | ConvertTo-Json -Compress)
    $expr = @"
(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const jdText = $jd;
  const rsText = $rs;
  const cid = $cid;

  window.__E2E_ERRS__ = [];
  window.addEventListener('error', (e) => { try { window.__E2E_ERRS__.push(String(e.message||e.error||'error')); } catch {} });
  window.addEventListener('unhandledrejection', (e) => { try { window.__E2E_ERRS__.push(String(e.reason||'rejection')); } catch {} });

  const inputs = [...document.querySelectorAll('textarea, input[type="text"], input:not([type])')];
  const jdInput = inputs.find(el => /jd|채용공고|직무/.test(((el.previousElementSibling && el.previousElementSibling.innerText) || '') + ' ' + (el.placeholder || ''))) || inputs[0];
  const rsInput = inputs.find(el => /이력서|resume|지원용/.test(((el.previousElementSibling && el.previousElementSibling.innerText) || '') + ' ' + (el.placeholder || ''))) || inputs[1];
  const fire = (el, v) => {
    if (!el) return;
    el.focus();
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  };
  fire(jdInput, jdText);
  fire(rsInput, rsText);

  const y = [...document.querySelectorAll('input')].find(el => /예:\s*30|예:\s*3/.test(el.placeholder || ''));
  fire(y, '5');

  for (let i = 0; i < 8; i++) {
    const trig = [...document.querySelectorAll('button,[role="combobox"]')].find(el => /선택/.test((el.innerText || '').trim()));
    if (!trig) break;
    trig.click();
    await sleep(220);
    const opt = [...document.querySelectorAll('[role="option"], [data-radix-collection-item], [role="menuitem"]')]
      .find(el => { const t = (el.innerText || '').trim(); return t && !/선택/.test(t); });
    if (opt) opt.click();
    await sleep(260);
  }

  const btn = [...document.querySelectorAll('button')].find(b => /바로 분석|분석하기|분석 시작/.test((b.innerText || '').trim()));
  if (btn) btn.click();

  await sleep(15000);
  const a = window.__DBG_ANALYSIS__ || window.__DBG_ACTIVE__ || null;
  const sem = window.__DBG_SEMANTIC__ || window.__DBG_SEMANTIC_LAST__ || null;
  const cardEl = [...document.querySelectorAll('section,div')].find(x => (x.innerText || '').includes('의미 기반 JD-이력서 매칭'));
  const cardText = cardEl ? (cardEl.innerText || '') : '';

  const matches = Array.isArray(a?.semanticMatch?.matches) ? a.semanticMatch.matches : [];
  const flat = [];
  for (const m of matches) {
    if (m && m.best && typeof m.best === 'object') {
      flat.push({ jd: m.jd || '', text: m.best.text || '', score: Number(m.best.score || 0), candidates: Array.isArray(m.candidates)?m.candidates.length:0 });
    }
  }
  flat.sort((x,y)=>y.score-x.score);

  return {
    caseId: cid,
    hasSemanticCard: !!cardEl,
    matchesCount: matches.length,
    candidatesTotal: matches.reduce((acc,m)=>acc + (Array.isArray(m?.candidates)?m.candidates.length:0),0),
    bestAny: flat[0] || null,
    semanticPhase: sem?.phase || null,
    semanticError: sem?.error || null,
    semanticDevice: a?.semanticMatch?.device || null,
    semanticDtype: a?.semanticMatch?.dtype || null,
    cardPreview: cardText.slice(0, 260),
    jsErrors: window.__E2E_ERRS__ || []
  };
})()
"@

    $resp = Send-Cdp -Ws $ws -Seq $seq -Method "Runtime.evaluate" -Params @{ expression = $expr; awaitPromise = $true; returnByValue = $true }
    $results += $resp.result.result.value
  }

  [pscustomobject]@{ ok = $true; results = $results } | ConvertTo-Json -Depth 50
}
catch {
  [pscustomobject]@{ ok = $false; error = $_.Exception.Message } | ConvertTo-Json -Depth 10
}
finally {
  if ($ws) { try { $ws.Dispose() } catch {} }
  if ($edge) { try { Stop-Process -Id $edge.Id -Force } catch {} }
  if (Test-Path $ud) { try { Remove-Item -Recurse -Force $ud } catch {} }
  if ($dev) { try { Stop-Process -Id $dev.Id -Force } catch {} }
}
