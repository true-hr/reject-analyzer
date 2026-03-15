import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ALLOWED_HOSTS = new Set([
  "saramin.co.kr",
  "www.saramin.co.kr",
  "jobkorea.co.kr",
  "www.jobkorea.co.kr",
]);

const NOISE_LINES = new Set([
  "로그인",
  "회원가입",
  "채용공고",
  "로그아웃",
  "채용정보",
  "공채정보",
  "광고",
  "배너",
]);

const EXTRA_NOISE_HINTS = [
  "인재채용",
  "공고",
  "배너",
  "프로모션",
];

const JD_SIGNAL_KEYWORDS = [
  "주요업무",
  "자격요건",
  "우대사항",
  "지원자격",
  "근무조건",
  "복리후생",
  "전형절차",
  "접수방법",
  "근무형태",
  "모집부문",
  "담당업무",
  "필수조건",
  "우대조건",
  "채용절차",
  "근무지",
  "responsibilities",
  "requirements",
  "qualifications",
  "preferred",
  "benefits",
  "how to apply",
  "hiring process",
  "employment type",
  "job description",
];

const PORTAL_NOISE_KEYWORDS = [
  "로그인",
  "회원가입",
  "공채정보",
  "광고",
  "추천채용",
  "인재채용",
  "이력서",
  "인재풀",
  "공고리스트",
  "배너",
  "프로모션",
  "채용정보",
  "채용 공고",
  "검색",
  "login",
  "sign up",
  "signup",
  "search",
  "recommended jobs",
  "resume",
  "banner",
  "promotion",
  "career hub",
];

const LANDING_TITLE_HINTS = [
  "홈",
  "메인",
  "landing",
  "채용 플랫폼",
  "채용정보",
  "공채정보",
  "회원가입",
  "로그인",
  "광고",
  "home",
  "main",
  "portal",
  "career",
  "jobs",
];

function _setCors(req, res) {
  try {
    const origin = req?.headers?.origin ? String(req.headers.origin) : "";
    const allow = new Set([
      "http://localhost:5173",
      "https://true-hr.github.io",
      "https://reject-analyzer.vercel.app",
    ]);
    const ao = allow.has(origin) ? origin : "https://true-hr.github.io";
    res.setHeader("Access-Control-Allow-Origin", ao);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  } catch {}
}

function _decodeHtmlEntities(input) {
  const s = String(input || "");
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return s
    .replace(/&(#\d+);/g, (_, n) => {
      const v = Number(String(n).slice(1));
      return Number.isFinite(v) ? String.fromCharCode(v) : _;
    })
    .replace(/&(#x[0-9a-fA-F]+);/g, (_, n) => {
      const v = Number.parseInt(String(n).slice(2), 16);
      return Number.isFinite(v) ? String.fromCharCode(v) : _;
    })
    .replace(/&([a-zA-Z]+);/g, (m, name) => (Object.prototype.hasOwnProperty.call(named, name) ? named[name] : m));
}

function _extractTitle(html) {
  const m = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m?.[1]) return "";
  return _decodeHtmlEntities(m[1]).replace(/\s+/g, " ").trim();
}

function _extractPlainText(html) {
  let s = String(html || "");

  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ");
  s = s.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, " ");
  s = s.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ");
  s = s.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ");
  s = s.replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, " ");

  s = s.replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/section|\/article)\b[^>]*>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = _decodeHtmlEntities(s);

  s = s.replace(/\r\n/g, "\n");
  s = s.replace(/[ \t]+/g, " ");
  s = s
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (NOISE_LINES.has(line)) return false;
      const shortUiNoise = line.length <= 18 && [...NOISE_LINES].some((w) => line.includes(w));
      if (shortUiNoise) return false;
      const shortEtcNoise = line.length <= 18 && EXTRA_NOISE_HINTS.some((w) => line.includes(w));
      if (shortEtcNoise) return false;
      return true;
    })
    .join("\n");
  s = s.replace(/\n{3,}/g, "\n\n").trim();

  return s;
}

function _extractBySelectors(html, selectorHints) {
  const src = String(html || "");
  if (!src || !Array.isArray(selectorHints) || !selectorHints.length) return "";
  for (const hint of selectorHints) {
    if (!hint) continue;
    const esc = String(hint).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      `<(?:section|article|div)[^>]*(?:id|class)=["'][^"']*${esc}[^"']*["'][^>]*>[\\s\\S]{0,140000}?<\\/(?:section|article|div)>`,
      "i",
    );
    const m = src.match(re);
    if (m?.[0]) {
      const cleaned = _extractPlainText(m[0]);
      if (cleaned.length >= 120) return cleaned;
    }
  }
  return "";
}

function _extractByRegexBlocksWithDebug(html, regexEntries) {
  const src = String(html || "");
  const debug = {
    hitPattern: null,
    hitRawLength: 0,
    hitCleanedLength: 0,
  };
  if (!src || !Array.isArray(regexEntries) || !regexEntries.length) {
    return { text: "", debug };
  }
  for (const entry of regexEntries) {
    const name = String(entry?.name || "");
    const re = entry?.re;
    if (!(re instanceof RegExp)) continue;
    const m = src.match(re);
    if (m?.[0]) {
      const raw = String(m[0] || "");
      const cleaned = _extractPlainText(raw);
      debug.hitPattern = name || "unknown";
      debug.hitRawLength = raw.length;
      debug.hitCleanedLength = cleaned.length;
      if (cleaned.length >= 120) {
        return { text: cleaned, debug };
      }
    }
  }
  return { text: "", debug };
}

function _decodeEscapedText(raw) {
  return String(raw || "")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(Number.parseInt(h, 16)))
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\//g, "/");
}

function _normalizeSaraminDescription(raw) {
  let s = _decodeEscapedText(raw);
  s = _decodeHtmlEntities(s);
  s = s
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/?\s*(p|div|li|ul|ol)\b[^>]*>/gi, "\n")
    .replace(/\|\|/g, "\n")
    .replace(/[占쏙옙占쏙옙]\s*/g, "\n");
  return _extractPlainText(s);
}

function _readEscapedQuotedValue(src, startIdx) {
  let i = Number(startIdx || 0);
  let out = "";
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\" && i + 1 < src.length) {
      out += ch + src[i + 1];
      i += 2;
      continue;
    }
    if (ch === '"') {
      return { value: out, end: i };
    }
    out += ch;
    i += 1;
  }
  return null;
}

function _extractDescriptionFromLocalWindow(local) {
  const s = String(local || "");
  const key = '"description":"';
  const idx = s.indexOf(key);
  if (idx < 0) return { raw: "", decoded: "" };
  const start = idx + key.length;
  const parsed = _readEscapedQuotedValue(s, start);
  if (!parsed || !parsed.value) return { raw: "", decoded: "" };
  const raw = String(parsed.value || "");
  const decoded = _normalizeSaraminDescription(raw);
  return { raw, decoded };
}

function _extractDescriptionForRecIdxInBlock(block, recIdx) {
  const s = String(block || "");
  const target = String(recIdx || "");
  if (!s || !target) return { raw: "", decoded: "" };

  const targetNeedle = `"rec_idx":"${target}"`;
  const targetIdx = s.indexOf(targetNeedle);
  if (targetIdx < 0) return { raw: "", decoded: "" };

  const recKey = '"rec_idx":"';
  const descKey = '"description":"';
  const prevRecIdx = s.lastIndexOf(recKey, Math.max(0, targetIdx - 1));
  const descIdx = s.lastIndexOf(descKey, targetIdx);

  if (descIdx >= 0 && descIdx > prevRecIdx) {
    const parsed = _readEscapedQuotedValue(s, descIdx + descKey.length);
    if (parsed?.value) {
      const raw = String(parsed.value || "");
      const decoded = _normalizeSaraminDescription(raw);
      return { raw, decoded };
    }
  }

  const nextRecIdx = s.indexOf(recKey, targetIdx + targetNeedle.length);
  const localStart = Math.max(0, targetIdx - 16000);
  const localEnd = nextRecIdx > targetIdx ? nextRecIdx : Math.min(s.length, targetIdx + 28000);
  return _extractDescriptionFromLocalWindow(s.slice(localStart, localEnd));
}

function _findSaraminScriptBlocks(html) {
  const src = String(html || "");
  const out = [];
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(src))) {
    const full = String(m[0] || "");
    const body = String(m[1] || "");
    const fullStart = m.index;
    const fullEnd = m.index + full.length;
    const bodyStart = fullStart + full.indexOf(body);
    const bodyEnd = bodyStart + body.length;
    out.push({
      fullStart,
      fullEnd,
      bodyStart,
      bodyEnd,
      body,
    });
  }
  return out;
}

function _selectTargetScriptBlock(html, targetNeedle) {
  const blocks = _findSaraminScriptBlocks(html);
  const candidates = [];
  for (const b of blocks) {
    if (!String(b?.body || "").includes(targetNeedle)) continue;
    const body = String(b.body || "");
    const score =
      (body.includes("recruit_list") ? 500000 : 0) +
      (body.includes('"description":"') ? 150000 : 0) +
      (body.includes('"rec_idx":"') ? 90000 : 0) -
      body.length;
    candidates.push({
      ...b,
      score,
    });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

function _verifySaraminDescriptionOwnership(objectText, targetRecIdx, raw, decoded) {
  const o = String(objectText || "");
  const recIdx = String(targetRecIdx || "");
  const r = String(raw || "");
  const d = String(decoded || "");
  if (!o || !recIdx || !r || !d) return false;
  const targetNeedle = `"rec_idx":"${recIdx}"`;
  const targetPos = o.indexOf(targetNeedle);
  if (targetPos < 0) return false;
  const recFieldCount = _countSubstringOccurrences(o, '"rec_idx":"');
  if (recFieldCount !== 1) return false;

  const descKey = '"description":"';
  const descPos = o.indexOf(descKey);
  if (descPos < 0) return false;
  if (descPos > targetPos + 5000) return false;
  return true;
}

function _extractDivBlockByOpenIndex(html, openIdx) {
  const src = String(html || "");
  const start = Number(openIdx || -1);
  if (!src || start < 0 || start >= src.length) return "";
  const re = /<\/?div\b[^>]*>/gi;
  re.lastIndex = start;
  let depth = 0;
  let began = false;
  let m;
  while ((m = re.exec(src))) {
    const token = String(m[0] || "").toLowerCase();
    if (token.startsWith("<div")) {
      depth += 1;
      began = true;
    } else if (token.startsWith("</div")) {
      depth -= 1;
      if (began && depth === 0) {
        return src.slice(start, re.lastIndex);
      }
    }
  }
  return "";
}

function _extractFirstUserContentBlock(html, fromIdx = 0) {
  const src = String(html || "");
  const start = Math.max(0, Number(fromIdx || 0));
  const marker = 'class="user_content';
  const classIdx = src.indexOf(marker, start);
  if (classIdx < 0) return "";
  const openIdx = src.lastIndexOf("<div", classIdx);
  if (openIdx < 0) return "";
  return _extractDivBlockByOpenIndex(src, openIdx);
}

function _dedupeNonEmptyLines(input) {
  const out = [];
  const seen = new Set();
  const lines = String(input || "")
    .split("\n")
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  for (const line of lines) {
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out;
}

function _extractSaraminTableLines(blockHtml) {
  const src = String(blockHtml || "");
  if (!src) return [];
  const out = [];
  const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let tr;
  while ((tr = trRe.exec(src))) {
    const rowHtml = String(tr?.[1] || "");
    if (!rowHtml) continue;
    const cells = [];
    const cellRe = /<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi;
    let cell;
    while ((cell = cellRe.exec(rowHtml))) {
      const cellText = _extractPlainText(String(cell?.[1] || ""))
        .replace(/\s+/g, " ")
        .trim();
      if (cellText) cells.push(cellText);
    }
    if (!cells.length) continue;
    if (cells.length >= 2) {
      out.push(`${cells[0]}: ${cells.slice(1).join(" / ")}`);
    } else {
      out.push(cells[0]);
    }
  }
  return out;
}

function _extractSaraminImageAltLines(blockHtml) {
  const src = String(blockHtml || "");
  if (!src) return [];
  const out = [];
  const re = /<img\b[^>]*\balt\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/gi;
  let m;
  while ((m = re.exec(src))) {
    const alt = _decodeHtmlEntities(String(m?.[1] || m?.[2] || ""))
      .replace(/\s+/g, " ")
      .trim();
    if (!alt || alt.length < 6) continue;
    if (NOISE_LINES.has(alt)) continue;
    out.push(alt);
  }
  return out;
}

function _enhanceSaraminTemplateLines(lines) {
  const out = [];
  const src = Array.isArray(lines) ? lines : [];
  const hasRecruitSection = src.some((x) => x.includes("모집부문"));
  const hasWorkSection = src.some((x) => x.includes("근무조건"));

  for (const line of src) {
    if (!hasRecruitSection && /^직종(?:\s|$|:)/.test(line)) out.push("모집부문");
    if (!hasWorkSection && /^근무지(?:\s|$|:)/.test(line)) out.push("근무조건");
    out.push(line);
  }
  return _dedupeNonEmptyLines(out.join("\n"));
}

function _extractSaraminUserContentText(blockHtml) {
  const block = String(blockHtml || "");
  if (!block) return "";
  const baseText = _extractPlainText(block);
  const hasTable = /<table\b/i.test(block);
  if (!hasTable) return baseText;

  const tableLines = _extractSaraminTableLines(block);
  const altLines = _extractSaraminImageAltLines(block);
  const mergedLines = _dedupeNonEmptyLines([baseText, ...tableLines, ...altLines].join("\n"));
  const normalizedLines = _enhanceSaraminTemplateLines(mergedLines);
  return normalizedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function _extractSaraminDetailUserContent(html) {
  const block = _extractFirstUserContentBlock(html, 0);
  const text = _extractSaraminUserContentText(block || "");
  return {
    text,
    found: !!block,
    userContentLength: String(text || "").length,
  };
}

function _extractSaraminDirectViewDom(html, targetRecIdx) {
  const src = String(html || "");
  const rec = String(targetRecIdx || "");
  const detailIdx = src.indexOf("jv_cont jv_detail");
  const from = detailIdx >= 0 ? detailIdx : 0;

  if (rec) {
    const cls = `jobsViewDetail_${rec}`;
    const clsIdx = src.indexOf(cls, from);
    if (clsIdx >= 0) {
      const openIdx = src.lastIndexOf("<div", clsIdx);
      if (openIdx >= 0) {
        const block = _extractDivBlockByOpenIndex(src, openIdx);
        const text = _extractSaraminUserContentText(block || "");
        if (text) {
          return {
            text,
            found: true,
            userContentLength: text.length,
          };
        }
      }
    }
  }

  const fallbackBlock = _extractFirstUserContentBlock(src, from);
  const fallbackText = _extractSaraminUserContentText(fallbackBlock || "");
  return {
    text: fallbackText,
    found: !!fallbackBlock,
    userContentLength: String(fallbackText || "").length,
  };
}

function _extractSaraminRequestUrl(html) {
  const src = String(html || "");
  const m = src.match(/'requestUrl'\s*:\s*'([^']+)'/);
  return String(m?.[1] || "").trim();
}

function _extractSaraminRecruitIdxs(html) {
  const src = String(html || "");
  const m = src.match(/'recruit_idxs'\s*:\s*(\[[\s\S]*?\])\s*,\s*'isPerson'/);
  if (!m?.[1]) return [];
  try {
    const arr = JSON.parse(String(m[1]));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function _extractDeclaredCharsetFromAsciiHead(asciiHead) {
  const s = String(asciiHead || "").toLowerCase();
  const m1 = s.match(/<meta[^>]*charset\s*=\s*["']?\s*([a-z0-9_\-]+)/i);
  if (m1?.[1]) return String(m1[1]).toLowerCase();
  const m2 = s.match(/<meta[^>]*http-equiv\s*=\s*["']content-type["'][^>]*content\s*=\s*["'][^"']*charset\s*=\s*([a-z0-9_\-]+)/i);
  if (m2?.[1]) return String(m2[1]).toLowerCase();
  return "";
}

function _normalizeCharsetLabel(label) {
  const l = String(label || "").trim().toLowerCase();
  if (!l) return "";
  if (l === "ks_c_5601-1987" || l === "ksc5601" || l === "x-euc-kr" || l === "euc_kr") return "euc-kr";
  if (l === "cp949" || l === "ms949" || l === "windows949" || l === "x-windows-949") return "windows-949";
  return l;
}

function _decodeBufferWithCharsetCandidates(buf, candidates) {
  for (const rawLabel of candidates) {
    const label = _normalizeCharsetLabel(rawLabel);
    if (!label) continue;
    try {
      const out = new TextDecoder(label).decode(buf);
      if (out) return { text: out, usedCharset: label };
    } catch {}
  }
  try {
    return { text: new TextDecoder("utf-8").decode(buf), usedCharset: "utf-8" };
  } catch {}
  return { text: "", usedCharset: "" };
}

function _scoreDecodedHtmlQuality(text) {
  const s = String(text || "");
  if (!s) return -999999;
  const plain = _extractPlainText(s);
  const sample = String(plain || s).slice(0, 20000);
  const replacementCount = (sample.match(/\uFFFD/g) || []).length;
  const hangulCount = (sample.match(/[가-힣]/g) || []).length;
  const jdHintCount = _countSignals(sample, JD_SIGNAL_KEYWORDS);
  const noise = (sample.match(/[ÃÂÐÑØÞ]/g) || []).length;
  return (hangulCount * 3) + (jdHintCount * 50) - (replacementCount * 40) - (noise * 5);
}

// ✅ P0 (append-only): HTML charset 보정 helper — header/meta/candidate 품질 비교 후 최적 디코딩 선택
async function _readResponseHtml(response, hostHint) {
  try {
    const ct = String(response.headers?.get("content-type") || "").toLowerCase();
    const hostHintStr = String(hostHint || "").toLowerCase();
    const buf = await response.arrayBuffer();
    const headAscii = (() => {
      try {
        const b = Buffer.from(buf);
        return b.slice(0, Math.min(12000, b.length)).toString("latin1");
      } catch {
        return "";
      }
    })();
    const headerCharset = _normalizeCharsetLabel((ct.match(/charset\s*=\s*([a-z0-9_\-]+)/i)?.[1] || "").toLowerCase());
    const metaCharset = _normalizeCharsetLabel(_extractDeclaredCharsetFromAsciiHead(headAscii));
    if (headerCharset) {
      const direct = _decodeBufferWithCharsetCandidates(buf, [headerCharset]);
      if (direct?.text) {
        const sample = String(direct.text || "").slice(0, 12000);
        const replacementCount = (sample.match(/\uFFFD/g) || []).length;
        if (replacementCount <= 4) return direct.text;
      }
    }
    if (metaCharset) {
      const direct = _decodeBufferWithCharsetCandidates(buf, [metaCharset]);
      if (direct?.text) {
        const sample = String(direct.text || "").slice(0, 12000);
        const replacementCount = (sample.match(/\uFFFD/g) || []).length;
        if (replacementCount <= 4) return direct.text;
      }
    }
    const candidateList = [];
    if (headerCharset) candidateList.push(headerCharset);
    if (metaCharset) candidateList.push(metaCharset);
    candidateList.push("utf-8", "euc-kr", "windows-949");
    if (hostHintStr.includes("saramin") || hostHintStr.includes("jobkorea")) {
      candidateList.push("cp949", "ks_c_5601-1987");
    }
    const uniqueCandidates = [...new Set(candidateList.map(_normalizeCharsetLabel).filter(Boolean))];

    let best = { text: "", usedCharset: "", score: -999999 };
    for (const label of uniqueCandidates) {
      const decoded = _decodeBufferWithCharsetCandidates(buf, [label]);
      if (!decoded?.text) continue;
      const score = _scoreDecodedHtmlQuality(decoded.text);
      if (score > best.score) {
        best = { text: decoded.text, usedCharset: decoded.usedCharset, score };
      }
    }
    if (best.text) return best.text;
  } catch {
    // decode 실패 시 fallback
  }
  return response.text();
}

async function _fetchSaraminRelayAjaxHtml(viewHtml, parsedUrl, targetRecIdx) {
  const parsed = parsedUrl instanceof URL ? parsedUrl : null;
  if (!parsed) return { ok: false, html: "", ajaxUrl: "" };
  const reqPath = _extractSaraminRequestUrl(viewHtml) || "/zf_user/jobs/relay/view-ajax";
  const ajaxUrl = new URL(reqPath, parsed.origin);
  const params = new URLSearchParams();
  const sp = parsed.searchParams;
  const recruitIdxs = _extractSaraminRecruitIdxs(viewHtml);
  const target = String(targetRecIdx || sp.get("rec_idx") || "").trim();
  const recSeq = Math.max(
    0,
    recruitIdxs.findIndex((x) => String(x?.rec_idx || "") === target),
  );
  params.set("rec_idx", target);
  params.set("rec_seq", String(recSeq >= 0 ? recSeq : 0));
  params.set("view_type", sp.get("view_type") || "list");
  params.set("t_ref", sp.get("t_ref") || "");
  params.set("t_ref_content", sp.get("t_ref_content") || "");
  params.set("t_ref_scnid", sp.get("t_ref_scnid") || "");
  params.set("ref_dp", sp.get("ref_dp") || "SRI_050_VIEW_MIX_RCT_NONMEM");
  params.set("dpId", sp.get("dpId") || "");
  params.set("recommendRecIdx", sp.get("recommendRecIdx") || "");
  params.set("referNonce", sp.get("referNonce") || "");
  params.set("trainingStudentCode", sp.get("trainingStudentCode") || "");
  ajaxUrl.search = params.toString();
  try {
    const r = await fetch(ajaxUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 PASSMAP JD Extractor",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "X-Requested-With": "XMLHttpRequest",
        Referer: parsed.toString(),
      },
    });
    if (!r.ok) return { ok: false, html: "", ajaxUrl: ajaxUrl.toString() };
    const html = await _readResponseHtml(r, "saramin");
    return { ok: true, html, ajaxUrl: ajaxUrl.toString() };
  } catch {
    return { ok: false, html: "", ajaxUrl: ajaxUrl.toString() };
  }
}

function _extractSaraminRelayDetailSrc(relayAjaxHtml) {
  const src = String(relayAjaxHtml || "");
  const m = src.match(/<iframe\b[^>]*class="[^"]*iframe_content[^"]*"[^>]*src="([^"]+)"/i);
  if (!m?.[1]) return "";
  return _decodeHtmlEntities(String(m[1] || "").trim());
}

async function _fetchSaraminRelayDetailHtml(parsedUrl, detailSrc, refererUrl) {
  const parsed = parsedUrl instanceof URL ? parsedUrl : null;
  const src = String(detailSrc || "").trim();
  if (!parsed || !src) return { ok: false, html: "", detailUrl: "" };
  const detailUrl = new URL(src, parsed.origin);
  try {
    const r = await fetch(detailUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 PASSMAP JD Extractor",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        Referer: String(refererUrl || parsed.toString()),
      },
    });
    if (!r.ok) return { ok: false, html: "", detailUrl: detailUrl.toString() };
    const html = await _readResponseHtml(r, "saramin");
    return { ok: true, html, detailUrl: detailUrl.toString() };
  } catch {
    return { ok: false, html: "", detailUrl: detailUrl.toString() };
  }
}

function _countSubstringOccurrences(src, needle) {
  const s = String(src || "");
  const n = String(needle || "");
  if (!s || !n) return 0;
  let count = 0;
  let from = 0;
  while (from < s.length) {
    const i = s.indexOf(n, from);
    if (i < 0) break;
    count += 1;
    from = i + n.length;
  }
  return count;
}

function _findBalancedObjectEnd(src, startIdx, maxSpan = 220000) {
  const s = String(src || "");
  const start = Number(startIdx || 0);
  if (!s || start < 0 || start >= s.length || s[start] !== "{") return -1;

  let depth = 0;
  let inString = false;
  let escaped = false;
  const endLimit = Math.min(s.length, start + Math.max(1, Number(maxSpan || 0)));

  for (let i = start; i < endLimit; i += 1) {
    const ch = s[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      depth += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function _extractSaraminTargetObject(chunk, targetRecIdx, targetRecIdxPosInChunk) {
  const s = String(chunk || "");
  const recIdx = String(targetRecIdx || "");
  const pivot = Number(targetRecIdxPosInChunk || -1);
  if (!s || !recIdx || pivot < 0 || pivot >= s.length) {
    return { objectText: "", objectLength: 0, found: false };
  }

  const targetNeedle = `"rec_idx":"${recIdx}"`;
  const startCandidates = [];
  const maxBacktrack = 22000;
  let cursor = pivot;

  while (cursor >= 0 && startCandidates.length < 24) {
    const openIdx = s.lastIndexOf("{", cursor);
    if (openIdx < 0) break;
    if (pivot - openIdx > maxBacktrack) break;
    startCandidates.push(openIdx);
    cursor = openIdx - 1;
  }

  let best = null;
  for (const startIdx of startCandidates) {
    const endIdx = _findBalancedObjectEnd(s, startIdx);
    if (endIdx < 0 || endIdx <= pivot) continue;

    const objectText = s.slice(startIdx, endIdx + 1);
    if (!objectText.includes(targetNeedle)) continue;

    const recFieldCount = _countSubstringOccurrences(objectText, '"rec_idx":"');
    const hasDescription = objectText.includes('"description":"');
    const hasTitle = objectText.includes('"title":"');
    const hasCompany = objectText.includes('"company_nm":"');
    if (!hasDescription) continue;
    if (recFieldCount > 2) continue;
    const score =
      (hasDescription ? 1000000 : 0) +
      (hasTitle ? 20000 : 0) +
      (hasCompany ? 8000 : 0) +
      (recFieldCount === 1 ? 50000 : 0) -
      recFieldCount * 30000 -
      objectText.length;

    if (!best || score > best.score) {
      best = {
        score,
        objectText,
      };
    }
  }

  if (!best?.objectText) {
    return { objectText: "", objectLength: 0, found: false };
  }
  return {
    objectText: best.objectText,
    objectLength: best.objectText.length,
    found: true,
  };
}

function _extractSaraminDescriptionFromScriptWithDebug(html, targetRecIdx) {
  const src = String(html || "");
  const debug = {
    targetRecIdx: String(targetRecIdx || ""),
    anchorFound: false,
    chunkLength: 0,
    recIdxOccurrenceCount: 0,
    scriptCandidateCount: 0,
    matchedRecIdx: false,
    localWindowLength: 0,
    descriptionRawLength: 0,
    descriptionDecodedLength: 0,
    selectedRecIdx: "",
    selectedDescriptionLength: 0,
    targetRecIdxGlobalCount: 0,
    targetRecIdxChunkCount: 0,
    targetRecIdxFirstGlobalIndex: -1,
    targetRecIdxFirstChunkIndex: -1,
    targetObjectFound: false,
    targetObjectLength: 0,
    targetScriptBlockFound: false,
    targetScriptBlockLength: 0,
    targetRecIdxScriptBlockCount: 0,
    targetObjectRecIdxConfirmed: false,
    descriptionOwnershipVerified: false,
  };

  const targetNeedle = debug.targetRecIdx ? `"rec_idx":"${debug.targetRecIdx}"` : "";
  if (targetNeedle) {
    debug.targetRecIdxGlobalCount = _countSubstringOccurrences(src, targetNeedle);
    debug.targetRecIdxFirstGlobalIndex = src.indexOf(targetNeedle);
  }

  let chunk = "";
  if (targetNeedle) {
    const targetScriptBlock = _selectTargetScriptBlock(src, targetNeedle);
    if (targetScriptBlock?.body) {
      debug.targetScriptBlockFound = true;
      debug.targetScriptBlockLength = targetScriptBlock.body.length;
      debug.targetRecIdxScriptBlockCount = _countSubstringOccurrences(targetScriptBlock.body, targetNeedle);
      chunk = targetScriptBlock.body;
      debug.anchorFound = chunk.includes("recruit_list");
    }
  }
  if (!chunk) {
    const anchor = src.indexOf("recruit_list");
    if (anchor < 0) return { text: "", debug };
    debug.anchorFound = true;
    chunk = src.slice(anchor, Math.min(src.length, anchor + 420000));
  }
  debug.chunkLength = chunk.length;
  if (targetNeedle) {
    debug.targetRecIdxChunkCount = _countSubstringOccurrences(chunk, targetNeedle);
    debug.targetRecIdxFirstChunkIndex = chunk.indexOf(targetNeedle);
    if (!debug.targetRecIdxScriptBlockCount && debug.targetScriptBlockFound) {
      debug.targetRecIdxScriptBlockCount = debug.targetRecIdxChunkCount;
    }
  }

  const recRe = /"rec_idx":"(\d+)"/g;
  const recMatches = [];
  let m;
  while ((m = recRe.exec(chunk))) {
    recMatches.push({ idx: m.index, recIdx: String(m[1] || "") });
  }
  debug.recIdxOccurrenceCount = recMatches.length;

  const candidates = [];

  const pushCandidateFromLocal = (local, recIdx) => {
    const d = _extractDescriptionFromLocalWindow(local);
    if (!d.decoded) return;
    const isTarget = !!debug.targetRecIdx && recIdx === debug.targetRecIdx;
    candidates.push({
      recIdx,
      text: d.decoded,
      rawLen: d.raw.length,
      decodedLen: d.decoded.length,
      score: d.decoded.length + (isTarget ? 100000 : 0),
      isTarget,
    });
  };

  if (debug.targetRecIdx) {
    const targetPosInChunk = targetNeedle ? chunk.indexOf(targetNeedle) : -1;
    const targetMatch = recMatches.find((x) => x.recIdx === debug.targetRecIdx);
    const targetRef = targetMatch || (targetPosInChunk >= 0 ? { recIdx: debug.targetRecIdx, idx: targetPosInChunk } : null);
    if (targetRef) {
      const targetObj = _extractSaraminTargetObject(chunk, targetRef.recIdx, targetRef.idx);
      debug.targetObjectFound = Boolean(targetObj?.found);
      debug.targetObjectLength = Number(targetObj?.objectLength || 0);
      debug.targetObjectRecIdxConfirmed =
        Boolean(targetObj?.objectText) && String(targetObj.objectText).includes(`"rec_idx":"${debug.targetRecIdx}"`);

      if (targetObj?.found && targetObj?.objectText) {
        const d = _extractDescriptionForRecIdxInBlock(targetObj.objectText, targetRef.recIdx);
        debug.descriptionOwnershipVerified = _verifySaraminDescriptionOwnership(
          targetObj.objectText,
          targetRef.recIdx,
          d.raw,
          d.decoded,
        );
        if (d.decoded && debug.descriptionOwnershipVerified) {
          debug.matchedRecIdx = true;
          debug.selectedRecIdx = targetRef.recIdx;
          debug.descriptionRawLength = d.raw.length;
          debug.descriptionDecodedLength = d.decoded.length;
          debug.selectedDescriptionLength = d.decoded.length;
          return { text: d.decoded, debug };
        }
        if (d.decoded && debug.targetObjectRecIdxConfirmed) {
          debug.matchedRecIdx = true;
          debug.selectedRecIdx = targetRef.recIdx;
          debug.descriptionRawLength = d.raw.length;
          debug.descriptionDecodedLength = d.decoded.length;
          debug.selectedDescriptionLength = d.decoded.length;
          return { text: d.decoded, debug };
        }
      }

      const ls = Math.max(0, targetRef.idx - 1200);
      const le = Math.min(chunk.length, targetRef.idx + 16000);
      const local = chunk.slice(ls, le);
      debug.localWindowLength = local.length;
      pushCandidateFromLocal(local, targetRef.recIdx);
    }

    if (!debug.matchedRecIdx && debug.targetRecIdxFirstGlobalIndex >= 0) {
      const targetObjGlobal = _extractSaraminTargetObject(src, debug.targetRecIdx, debug.targetRecIdxFirstGlobalIndex);
      debug.targetObjectFound = Boolean(targetObjGlobal?.found) || debug.targetObjectFound;
      debug.targetObjectLength = Math.max(
        Number(debug.targetObjectLength || 0),
        Number(targetObjGlobal?.objectLength || 0),
      );
      if (targetObjGlobal?.found && targetObjGlobal?.objectText) {
        const d = _extractDescriptionForRecIdxInBlock(targetObjGlobal.objectText, debug.targetRecIdx);
        const ownership = _verifySaraminDescriptionOwnership(
          targetObjGlobal.objectText,
          debug.targetRecIdx,
          d.raw,
          d.decoded,
        );
        debug.descriptionOwnershipVerified = debug.descriptionOwnershipVerified || ownership;
        if (d.decoded && (ownership || String(targetObjGlobal.objectText).includes(`"rec_idx":"${debug.targetRecIdx}"`))) {
          debug.matchedRecIdx = true;
          debug.selectedRecIdx = debug.targetRecIdx;
          debug.descriptionRawLength = d.raw.length;
          debug.descriptionDecodedLength = d.decoded.length;
          debug.selectedDescriptionLength = d.decoded.length;
          debug.targetObjectRecIdxConfirmed = true;
          return { text: d.decoded, debug };
        }
      }
    }
  }

  for (const info of recMatches.slice(0, 40)) {
    const ls = Math.max(0, info.idx - 800);
    const le = Math.min(chunk.length, info.idx + 9000);
    const local = chunk.slice(ls, le);
    pushCandidateFromLocal(local, info.recIdx);
  }

  debug.scriptCandidateCount = candidates.length;

  if (!candidates.length) {
    return { text: "", debug };
  }

  candidates.sort((a, b) => b.score - a.score);
  const selected = candidates[0];

  debug.selectedRecIdx = String(selected?.recIdx || "");
  debug.selectedDescriptionLength = String(selected?.text || "").length;
  debug.descriptionRawLength = Number(selected?.rawLen || 0);
  debug.descriptionDecodedLength = Number(selected?.decodedLen || 0);

  return { text: String(selected?.text || ""), debug };
}

// [PATCH] /zf_user/jobs/view direct-dom 결과가 core-rich인지 판단
// meta-only(근무시간/근무지주소)와 구별하기 위해 core JD 섹션 키워드만 사용
const _DIRECT_VIEW_CORE_SIGNALS = [
  "담당업무", "주요업무", "자격요건", "지원자격",
  "우대사항", "필수요건", "포지션 및 자격요건",
];

function _directViewHasCoreSignal(text) {
  const t = String(text || "").toLowerCase();
  return _DIRECT_VIEW_CORE_SIGNALS.some((kw) => t.includes(kw));
}

async function _extractSaraminTextWithDebug(html, targetRecIdx, parsedUrl) {
  const baseDebug = {
    targetRecIdx: String(targetRecIdx || ""),
    anchorFound: false,
    chunkLength: 0,
    recIdxOccurrenceCount: 0,
    scriptCandidateCount: 0,
    matchedRecIdx: false,
    localWindowLength: 0,
    descriptionRawLength: 0,
    descriptionDecodedLength: 0,
    selectedRecIdx: "",
    selectedDescriptionLength: 0,
    targetRecIdxGlobalCount: 0,
    targetRecIdxChunkCount: 0,
    targetRecIdxFirstGlobalIndex: -1,
    targetRecIdxFirstChunkIndex: -1,
    targetObjectFound: false,
    targetObjectLength: 0,
    targetScriptBlockFound: false,
    targetScriptBlockLength: 0,
    targetRecIdxScriptBlockCount: 0,
    targetObjectRecIdxConfirmed: false,
    descriptionOwnershipVerified: false,
    saraminContentSource: "fallback",
    saraminDirectDomFound: false,
    saraminRelayAjaxFetched: false,
    saraminRelayIframeFound: false,
    saraminRelayDetailFetched: false,
    saraminUserContentLength: 0,
  };

  const parsed = parsedUrl instanceof URL ? parsedUrl : null;
  const pathname = String(parsed?.pathname || "");

  if (/\/zf_user\/jobs\/view$/i.test(pathname)) {
    const direct = _extractSaraminDirectViewDom(html, targetRecIdx);
    // [PATCH] core signal이 있을 때만 direct-dom 성공으로 간주
    // meta-only(근무시간/근무지주소)는 core signal 없음 → script 시도로 진행
    if (direct?.text && direct.text.length > 0 && _directViewHasCoreSignal(direct.text)) {
      return {
        text: direct.text,
        debug: {
          ...baseDebug,
          saraminContentSource: "direct-dom",
          saraminDirectDomFound: true,
          saraminUserContentLength: Number(direct.userContentLength || direct.text.length || 0),
          selectedRecIdx: String(targetRecIdx || ""),
          selectedDescriptionLength: direct.text.length,
        },
      };
    }
    // direct가 meta-only 또는 core signal 없음 → script description 시도
    const scriptedView = _extractSaraminDescriptionFromScriptWithDebug(html, targetRecIdx);
    if (scriptedView?.text && scriptedView.text.length > 0) {
      return {
        text: String(scriptedView.text),
        debug: {
          ...baseDebug,
          ...(scriptedView?.debug || {}),
          saraminContentSource: "direct-dom-script",
          saraminDirectDomFound: Boolean(direct?.text && direct.text.length > 0),
        },
      };
    }
    // script도 실패 → direct fallback (meta라도 반환)
    if (direct?.text && direct.text.length > 0) {
      return {
        text: direct.text,
        debug: {
          ...baseDebug,
          saraminContentSource: "direct-dom",
          saraminDirectDomFound: true,
          saraminUserContentLength: Number(direct.userContentLength || direct.text.length || 0),
          selectedRecIdx: String(targetRecIdx || ""),
          selectedDescriptionLength: direct.text.length,
        },
      };
    }
  }

  if (/\/zf_user\/jobs\/relay\/view$/i.test(pathname)) {
    let relayOverrides = {
      saraminContentSource: "relay-ajax",
      saraminRelayAjaxFetched: false,
      saraminRelayIframeFound: false,
      saraminRelayDetailFetched: false,
      saraminUserContentLength: 0,
    };
    // [PATCH] relay/detail meta-only 조기 return 방지: core signal 없으면 scripted fallback 계속 시도
    let relayDetailFallbackText = "";
    const ajax = await _fetchSaraminRelayAjaxHtml(html, parsed, targetRecIdx);
    if (ajax?.ok && ajax?.html) {
      relayOverrides.saraminRelayAjaxFetched = true;
      const detailSrc = _extractSaraminRelayDetailSrc(ajax.html);
      if (detailSrc) {
        relayOverrides.saraminRelayIframeFound = true;
        const detail = await _fetchSaraminRelayDetailHtml(parsed, detailSrc, parsed?.toString());
        if (detail?.ok && detail?.html) {
          relayOverrides.saraminRelayDetailFetched = true;
          const extracted = _extractSaraminDetailUserContent(detail.html);
          // [PATCH] core signal 있을 때만 즉시 return — meta-only면 scripted fallback으로 진행
          if (extracted?.text && extracted.text.length > 0 && _directViewHasCoreSignal(extracted.text)) {
            return {
              text: extracted.text,
              debug: {
                ...baseDebug,
                saraminContentSource: "relay-detail",
                saraminRelayAjaxFetched: true,
                saraminRelayIframeFound: true,
                saraminRelayDetailFetched: true,
                saraminUserContentLength: Number(extracted.userContentLength || extracted.text.length || 0),
                selectedRecIdx: String(targetRecIdx || ""),
                selectedDescriptionLength: extracted.text.length,
              },
            };
          }
          // core signal 없음(meta-only) → 보관 후 scripted fallback 시도
          if (extracted?.text && extracted.text.length > 0) {
            relayDetailFallbackText = extracted.text;
          }
          relayOverrides.saraminUserContentLength = Number(extracted?.userContentLength || 0);
        }
      }
    }
    const scriptedFallback = _extractSaraminDescriptionFromScriptWithDebug(html, targetRecIdx);
    if (scriptedFallback?.text && scriptedFallback.text.length > 0) {
      return {
        text: String(scriptedFallback.text),
        debug: {
          ...baseDebug,
          ...(scriptedFallback?.debug || {}),
          ...relayOverrides,
        },
      };
    }
    // scripted도 실패 → relay/detail meta fallback (있으면) — debug에 명시
    return {
      text: String(relayDetailFallbackText || ""),
      debug: {
        ...baseDebug,
        ...(scriptedFallback?.debug || {}),
        ...relayOverrides,
        saraminContentSource: relayDetailFallbackText ? "relay-detail-meta-fallback" : "relay-ajax",
      },
    };
  }

  const scripted = _extractSaraminDescriptionFromScriptWithDebug(html, targetRecIdx);
  const scriptedDebug = {
    ...baseDebug,
    ...(scripted?.debug || {}),
    saraminContentSource: "fallback",
    saraminUserContentLength: Number(String(scripted?.text || "").length || 0),
  };
  return {
    text: String(scripted?.text || ""),
    debug: scriptedDebug,
  };
}

function _extractJobKoreaMainLikeWithDebug(html) {
  const src = String(html || "");
  // append-only: 고용형태/접수기간 추가 — 잡코리아 GI_Read 페이지에 자주 등장하는 힌트
  const sectionHints = ["모집요강", "모집분야", "지원자격", "근무지주소", "상세요강", "고용형태", "접수기간"];
  const hintCount = (text) => sectionHints.filter((k) => String(text || "").includes(k)).length;
  const isUsable = (text) => {
    const cleaned = String(text || "");
    const len = cleaned.length;
    const jdSignals = _countJdSignals(cleaned);
    const hints = hintCount(cleaned);
    return len >= 220 && (jdSignals >= 2 || hints >= 2);
  };

  const mainMatch = src.match(/<main\b[^>]*>[\s\S]{0,450000}?<\/main>/i);
  if (mainMatch?.[0]) {
    const raw = String(mainMatch[0] || "");
    const cleaned = _extractPlainText(raw);
    if (isUsable(cleaned)) {
      return {
        text: cleaned,
        debug: {
          hitPattern: "main:ssr",
          hitRawLength: raw.length,
          hitCleanedLength: cleaned.length,
        },
      };
    }
  }

  const anchorCandidates = ["모집요강", "상세요강", "지원자격"];
  let anchorIdx = -1;
  for (const key of anchorCandidates) {
    anchorIdx = src.indexOf(key);
    if (anchorIdx >= 0) break;
  }
  if (anchorIdx >= 0) {
    const start = Math.max(0, anchorIdx - 4000);
    const end = Math.min(src.length, anchorIdx + 32000);
    const raw = src.slice(start, end);
    const cleaned = _extractPlainText(raw);
    if (isUsable(cleaned)) {
      return {
        text: cleaned,
        debug: {
          hitPattern: "keyword-window:recruit",
          hitRawLength: raw.length,
          hitCleanedLength: cleaned.length,
        },
      };
    }
  }

  return {
    text: "",
    debug: {
      hitPattern: null,
      hitRawLength: 0,
      hitCleanedLength: 0,
    },
  };
}

function _extractJobKoreaTextWithDebug(html) {
  const mainFirst = _extractJobKoreaMainLikeWithDebug(html);
  if (mainFirst?.text && mainFirst.text.length >= 120) {
    return mainFirst;
  }

  const legacy = _extractBySelectors(html, [
    "tplJobDescription",
    "job-description",
    "jobDesc",
    "artReadJobSum",
    "readSum",
    "detailSummary",
  ]);
  if (legacy && legacy.length >= 120) {
    return {
      text: legacy,
      debug: {
        hitPattern: "legacy-selectors",
        hitRawLength: legacy.length,
        hitCleanedLength: legacy.length,
      },
    };
  }

  const modern = _extractByRegexBlocksWithDebug(html, [
    {
      name: "id:details-section",
      re: /<(?:div|section|article)[^>]*id=["']details-section["'][^>]*>[\s\S]{0,220000}?<\/(?:div|section|article)>/i,
    },
    {
      name: "id:parent-frame",
      re: /<(?:div|section|article)[^>]*id=["']parent-frame["'][^>]*>[\s\S]{0,220000}?<\/(?:div|section|article)>/i,
    },
    {
      name: "data-sentry:RecruitmentGuidelines",
      re: /<(?:div|section|article)[^>]*data-sentry-component=["']RecruitmentGuidelines["'][^>]*>[\s\S]{0,220000}?<\/(?:div|section|article)>/i,
    },
    {
      name: "id-suffix:-content-details",
      re: /<(?:div|section|article)[^>]*id=["'][^"']*-content-details["'][^>]*>[\s\S]{0,220000}?<\/(?:div|section|article)>/i,
    },
  ]);
  return modern;
}

// ✅ P1 (append-only): 본문 이미지 후보 점수화 helper — 광고/배너/브랜딩 강하게 제외 + 본문 문맥 가점
function _extractBodyImageCandidates(html, baseUrl) {
  const src = String(html || "");
  const base = String(baseUrl || "");
  const baseLower = String(base || "").toLowerCase();
  const isSaramin = baseLower.includes("saramin.co.kr");
  const origin = (() => {
    try { return new URL(base).origin; } catch { return ""; }
  })();

  const EXCLUDE_EXT_RE = /\.(svg|ico|gif)(\?|#|$)/i;
  const HARD_EXCLUDE_RE = /(saraminbanner\.co\.kr|pixel|tracking|beacon|adserver|doubleclick|googlesyndication|analytics)/i;
  const HARD_UI_COMMON_RE = /(saraminimage\.co\.kr\/sri\/common\/|\/btn\/|btn_|button|close|icon-close|sprite|badge|favicon)/i;
  const SHARE_META_EXCLUDE_RE = /(saramin_share|share_default|\/m\/meta\/|\/meta\/|default|og-?image|twitter-?image|social|cover|brand)/i;
  const SOFT_NEG_TOKEN_RE = /(banner|promotion|promo|logo|brand|match|matching|floating|icon|btn|button|close|thumb|badge|sprite|favicon)/i;
  const AD_TOKEN_RE = /(^|[^a-z])(ad|ads)([^a-z]|$)/i;
  const NEG_CONTEXT_RE = /(banner|ad|aside|promotion|recommend|header|footer|logo|brand|icon|floating)/i;
  const POS_CONTEXT_RE = /(detail|content|recruit|view|position|description|job|posting|jv_?cont|jv_?detail)/i;
  const JD_CONTEXT_RE = /(담당업무|주요업무|자격요건|지원자격|우대사항|근무조건|복리후생|접수기간|근무지|채용|모집)/i;

  const candidates = [];
  const seen = new Set();
  let strongExcludeCount = 0;
  let negativeOnlyCount = 0;
  const imgRe = /<img\b[^>]*>/gi;
  let m;

  while ((m = imgRe.exec(src)) !== null) {
    const tag = m[0];
    const tagIdx = Number(m.index || 0);
    const contextRaw = src.slice(Math.max(0, tagIdx - 300), Math.min(src.length, tagIdx + tag.length + 300));
    const context = String(contextRaw || "").toLowerCase();

    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i);
    if (!srcMatch?.[1]) continue;
    let imgSrc = srcMatch[1].trim();
    if (!imgSrc || imgSrc.startsWith("data:")) continue;

    if (imgSrc.startsWith("//")) {
      imgSrc = "https:" + imgSrc;
    } else if (imgSrc.startsWith("/")) {
      imgSrc = origin + imgSrc;
    } else if (!/^https?:\/\//i.test(imgSrc)) {
      if (!origin) continue;
      imgSrc = origin + "/" + imgSrc;
    }

    if (EXCLUDE_EXT_RE.test(imgSrc)) continue;

    const lowerUrl = String(imgSrc || "").toLowerCase();
    const alt = String(tag.match(/\balt=["']([^"']*)["']/i)?.[1] || "");
    const title = String(tag.match(/\btitle=["']([^"']*)["']/i)?.[1] || "");
    const idClass = String(tag.match(/\b(?:id|class)=["']([^"']*)["']/i)?.[1] || "");
    const attrs = `${lowerUrl} ${alt} ${title} ${idClass} ${context}`.toLowerCase();

    const wMatch = tag.match(/\bwidth=["']?(\d+)["']?/i);
    const hMatch = tag.match(/\bheight=["']?(\d+)["']?/i);
    const styleW = tag.match(/\bstyle=["'][^"']*width\s*:\s*(\d+)px/i);
    const styleH = tag.match(/\bstyle=["'][^"']*height\s*:\s*(\d+)px/i);
    const width = Number(wMatch?.[1] || styleW?.[1] || 0);
    const height = Number(hMatch?.[1] || styleH?.[1] || 0);
    if (width > 0 && width < 80) continue;
    if (height > 0 && height < 80) continue;

    let score = 0;
    const reasons = [];
    let excluded = false;

    if (HARD_EXCLUDE_RE.test(attrs) || HARD_UI_COMMON_RE.test(lowerUrl) || AD_TOKEN_RE.test(lowerUrl)) {
      excluded = true;
      strongExcludeCount += 1;
      reasons.push("hard-exclude:ad-tracking");
      score -= 100;
    }
    if (!excluded && SOFT_NEG_TOKEN_RE.test(attrs)) {
      score -= 28;
      reasons.push("soft-negative-token");
    }
    if (/(광고|배너|추천|match|사람인)/i.test(`${alt} ${title} ${context}`)) {
      score -= 50;
      reasons.push("negative-text");
    }
    if (NEG_CONTEXT_RE.test(context)) {
      score -= 20;
      reasons.push("negative-context");
    }
    if (POS_CONTEXT_RE.test(context)) {
      score += 20;
      reasons.push("positive-context");
    }

    if (width > 0 && height > 0) {
      const ratio = width / Math.max(1, height);
      const area = width * height;
      if (ratio > 3.0) {
        score -= 35;
        reasons.push("wide-banner-ratio");
      } else if (ratio < 0.9) {
        score += 15;
        reasons.push("vertical-ratio");
      }
      if (height < 200) {
        score -= 15;
        reasons.push("small-height");
      } else if (height >= 320) {
        score += 18;
        reasons.push("tall-image");
      }
      if (Math.abs(ratio - 1.0) < 0.15) {
        score -= 12;
        reasons.push("near-square");
      }
      if (area >= 180000) {
        score += 18;
        reasons.push("large-area");
      }
    } else {
      score -= 8;
      reasons.push("unknown-dim");
    }

    if (!seen.has(imgSrc)) {
      seen.add(imgSrc);
      candidates.push({
        url: imgSrc,
        width,
        height,
        score,
        excluded,
        reasons: reasons.slice(0, 8),
      });
      if (!excluded && score < 0) negativeOnlyCount += 1;
    }
  }

  const strictSelected = candidates
    .filter((c) => !c.excluded && c.score > -40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  let selected = strictSelected;
  let bodyImageSelectionStage = "strict";
  let bodyImageRescueUsed = false;
  let bodyImageRescueRejectedCount = 0;
  let bodyImageRescueTopCandidates = [];
  let bodyImageShareMetaRejectedCount = 0;
  let bodyImageKeywordBoostUsed = false;

  if (selected.length === 0) {
    const relaxedSelected = candidates
      .filter((c) => !c.excluded && c.score > -70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    if (relaxedSelected.length > 0) {
      selected = relaxedSelected;
      bodyImageSelectionStage = "relaxed";
    }
  }

  if (selected.length === 0 && isSaramin) {
    const rescueCandidates = [];
    const rescueSeen = new Set();
    const rescueBlocks = [];
    const RESCUE_HARD_EXCLUDE_RE = /(saraminbanner\.co\.kr|saraminimage\.co\.kr\/sri\/common\/|\/btn\/|btn_|button|close|icon|common\/|sprite|badge|logo|favicon|pixel|tracking|beacon)/i;
    const RESCUE_UI_TOKEN_RE = /(btn|button|close|icon|common|sprite|badge|logo|favicon|thumb)/i;
    const blockPatterns = [
      /<(?:div|section)[^>]*(?:jv_cont|jv_detail|user_content|jobsviewdetail_)[^>]*>[\s\S]{0,240000}?<\/(?:div|section)>/gi,
      /<(?:div|section)[^>]*(?:recruit|detail|content)[^>]*>[\s\S]{0,220000}?<\/(?:div|section)>/gi,
    ];
    for (const re of blockPatterns) {
      const found = src.match(re) || [];
      for (const b of found.slice(0, 6)) rescueBlocks.push(String(b || ""));
      if (rescueBlocks.length >= 8) break;
    }
    for (const block of rescueBlocks) {
      const blockLower = String(block || "").toLowerCase();
      const hasJdContextInBlock = JD_CONTEXT_RE.test(block);
      const br = /<img\b[^>]*>/gi;
      let bm;
      while ((bm = br.exec(block)) !== null) {
        const tag = String(bm[0] || "");
        const rescueTagIdx = Number(bm.index || 0);
        const rescueContext = String(
          block.slice(Math.max(0, rescueTagIdx - 220), Math.min(block.length, rescueTagIdx + tag.length + 220)),
        ).toLowerCase();
        const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i);
        if (!srcMatch?.[1]) continue;
        let imgSrc = String(srcMatch[1] || "").trim();
        if (!imgSrc || imgSrc.startsWith("data:")) continue;
        if (imgSrc.startsWith("//")) imgSrc = "https:" + imgSrc;
        else if (imgSrc.startsWith("/")) imgSrc = origin + imgSrc;
        else if (!/^https?:\/\//i.test(imgSrc)) imgSrc = origin ? `${origin}/${imgSrc}` : "";
        if (!imgSrc) continue;
        const lower = imgSrc.toLowerCase();
        if (EXCLUDE_EXT_RE.test(lower)) continue;
        if (SHARE_META_EXCLUDE_RE.test(lower)) {
          bodyImageShareMetaRejectedCount += 1;
          bodyImageRescueRejectedCount += 1;
          continue;
        }
        if (HARD_EXCLUDE_RE.test(lower) || RESCUE_HARD_EXCLUDE_RE.test(lower)) {
          bodyImageRescueRejectedCount += 1;
          continue;
        }
        const wMatch = tag.match(/\bwidth=["']?(\d+)["']?/i);
        const hMatch = tag.match(/\bheight=["']?(\d+)["']?/i);
        const styleW = tag.match(/\bstyle=["'][^"']*width\s*:\s*(\d+)px/i);
        const styleH = tag.match(/\bstyle=["'][^"']*height\s*:\s*(\d+)px/i);
        const width = Number(wMatch?.[1] || styleW?.[1] || 0);
        const height = Number(hMatch?.[1] || styleH?.[1] || 0);
        const uiAttrs = `${lower} ${tag.toLowerCase()} ${rescueContext}`;
        const hasUiToken = RESCUE_UI_TOKEN_RE.test(uiAttrs);
        if ((width === 0 || height === 0) && hasUiToken) {
          bodyImageRescueRejectedCount += 1;
          continue;
        }
        let score = 20;
        const reasons = ["saramin-rescue-block"];
        if (POS_CONTEXT_RE.test(rescueContext)) {
          score += 18;
          reasons.push("rescue-positive-context");
        }
        if (NEG_CONTEXT_RE.test(rescueContext)) {
          score -= 16;
          reasons.push("rescue-negative-context");
        }
        if (JD_CONTEXT_RE.test(rescueContext) || hasJdContextInBlock) {
          score += 30;
          bodyImageKeywordBoostUsed = true;
          reasons.push("rescue-jd-keyword-boost");
        }
        if (SHARE_META_EXCLUDE_RE.test(uiAttrs)) {
          score -= 55;
          reasons.push("rescue-share-meta-token");
        }
        if (hasUiToken) {
          score -= 40;
          reasons.push("rescue-ui-token");
        }
        if (width > 0 && height > 0) {
          const ratio = width / Math.max(1, height);
          const area = width * height;
          if (ratio > 3.0) {
            score -= 35;
            reasons.push("rescue-wide-ratio");
          } else if (ratio < 0.9) {
            score += 16;
            reasons.push("rescue-vertical-ratio");
          }
          if (height < 160) {
            score -= 22;
            reasons.push("rescue-small-height");
          } else if (height >= 300) {
            score += 14;
            reasons.push("rescue-tall-image");
          }
          if (Math.abs(ratio - 1.0) < 0.2) {
            score -= 14;
            reasons.push("rescue-near-square");
          }
          if (area >= 140000) {
            score += 12;
            reasons.push("rescue-large-area");
          }
        } else {
          score -= 8;
          reasons.push("rescue-unknown-dim");
        }
        if (rescueSeen.has(lower)) continue;
        rescueSeen.add(lower);
        rescueCandidates.push({
          url: imgSrc,
          width,
          height,
          score,
          excluded: false,
          reasons,
        });
      }
    }
    if (rescueCandidates.length > 0) {
      const rankedRescue = rescueCandidates
        .filter((c) => c.score > -60)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
      bodyImageRescueTopCandidates = rankedRescue.slice(0, 5).map((c) => ({
        url: c.url,
        width: c.width || undefined,
        height: c.height || undefined,
        score: c.score,
        reasons: c.reasons,
      }));
      selected = rankedRescue;
      bodyImageSelectionStage = "saramin-rescue";
      bodyImageRescueUsed = true;
    }
    if (selected.length === 0) {
      const ogImage = String(
        src.match(/<meta[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']/i)?.[1] || "",
      ).trim();
      if (ogImage) {
        let ogUrl = ogImage;
        if (ogUrl.startsWith("//")) ogUrl = "https:" + ogUrl;
        else if (ogUrl.startsWith("/")) ogUrl = origin + ogUrl;
        else if (!/^https?:\/\//i.test(ogUrl)) ogUrl = origin ? `${origin}/${ogUrl}` : "";
        const lowerOg = String(ogUrl || "").toLowerCase();
        if (SHARE_META_EXCLUDE_RE.test(lowerOg)) {
          bodyImageShareMetaRejectedCount += 1;
        } else if (ogUrl && !EXCLUDE_EXT_RE.test(lowerOg) && !HARD_EXCLUDE_RE.test(lowerOg) && !HARD_UI_COMMON_RE.test(lowerOg)) {
          selected = [{
            url: ogUrl,
            width: 0,
            height: 0,
            score: -55,
            excluded: false,
            reasons: ["saramin-rescue-og-image"],
          }];
          bodyImageRescueTopCandidates = [{
            url: ogUrl,
            score: -55,
            reasons: ["saramin-rescue-og-image"],
          }];
          bodyImageSelectionStage = "saramin-rescue";
          bodyImageRescueUsed = true;
        }
      }
    }
    if (selected.length > 0 && selected.every((c) => SHARE_META_EXCLUDE_RE.test(String(c?.url || "").toLowerCase()))) {
      selected = [];
      bodyImageSelectionStage = "none";
      bodyImageRescueUsed = false;
    }
    if (selected.length === 0) {
      bodyImageSelectionStage = "none";
    }
  } else if (selected.length === 0) {
    bodyImageSelectionStage = "none";
  }

  return {
    urls: selected.map((c) => c.url),
    candidateCount: candidates.length,
    selectedCount: selected.length,
    bodyImageSelectionStage,
    bodyImageRescueUsed,
    bodyImageRescueRejectedCount,
    bodyImageShareMetaRejectedCount,
    bodyImageKeywordBoostUsed,
    bodyImageRescueTopCandidates,
    rejectedSummary: {
      strongExcludeCount,
      negativeOnlyCount,
    },
    topCandidates: selected.slice(0, 5).map((c) => ({
      url: c.url,
      width: c.width || undefined,
      height: c.height || undefined,
      score: c.score,
      reasons: c.reasons,
    })),
  };
}

// ✅ P0 유지: 기존 호출부 호환용 URL 리스트 helper
function _extractBodyImageUrls(html, baseUrl) {
  return _extractBodyImageCandidates(html, baseUrl).urls;
}

// ✅ P0 (append-only): 이미지 URL → base64 변환 helper
async function _fetchImageAsBase64(imageUrl) {
  try {
    const r = await fetch(String(imageUrl || ""), {
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0 PASSMAP JD Extractor" },
    });
    if (!r.ok) return { ok: false, base64: "", mimeType: "", error: `HTTP_${r.status}` };
    const mimeType = String(r.headers?.get("content-type") || "image/jpeg").split(";")[0].trim();
    const buf = await r.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    return { ok: true, base64, mimeType, error: null };
  } catch (e) {
    return { ok: false, base64: "", mimeType: "", error: String(e?.message || e || "fetch_error") };
  }
}

// ✅ P0 (append-only): Google Vision API 직접 호출 helper (api/ocr.js와 동일 구조)
async function _callVisionOcr(base64, visionKey) {
  try {
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(visionKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              imageContext: { languageHints: ["ko", "en"] },
            },
          ],
        }),
      }
    );
    const data = await visionRes.json().catch(() => null);
    if (!visionRes.ok) {
      return { ok: false, text: "", error: String(data?.error?.message || `vision_http_${visionRes.status}`) };
    }
    const one = Array.isArray(data?.responses) ? data.responses[0] : null;
    if (one?.error?.message) {
      return { ok: false, text: "", error: String(one.error.message) };
    }
    const text = String(one?.fullTextAnnotation?.text || one?.textAnnotations?.[0]?.description || "");
    return { ok: true, text, error: null };
  } catch (e) {
    return { ok: false, text: "", error: String(e?.message || e || "vision_error") };
  }
}

// ✅ P0 (append-only): bodyImageUrls OCR 실행 — 최대 3장, 부분 실패 허용
async function _runBodyImagesOcr(bodyImageUrls, visionKey) {
  const ocrBlocks = [];
  let ocrSuccessCount = 0;
  let ocrFailCount = 0;
  const errors = [];
  const targets = Array.isArray(bodyImageUrls) ? bodyImageUrls.slice(0, 3) : [];
  for (const url of targets) {
    const imgResult = await _fetchImageAsBase64(url);
    if (!imgResult.ok) {
      ocrFailCount += 1;
      errors.push({ url, error: imgResult.error });
      continue;
    }
    const ocrResult = await _callVisionOcr(imgResult.base64, visionKey);
    if (!ocrResult.ok || !ocrResult.text.trim()) {
      ocrFailCount += 1;
      errors.push({ url, error: ocrResult.error || "empty_text" });
      continue;
    }
    ocrSuccessCount += 1;
    ocrBlocks.push(ocrResult.text.trim());
  }
  const ocrText = ocrBlocks.join("\n\n");
  return { ocrText, ocrBlocks, ocrSuccessCount, ocrFailCount, errors };
}

// ✅ PATCH (append-only): portal UI noise line filter (conservative)
const PORTAL_UI_NOISE_EXACT = new Set([
  "접수기간",
  "기업정보",
  "추천공고",
  "채용관",
  "상세요강",
  "지원방법",
  "더보기",
  "공고원문보기",
  "공유하기",
  "스크랩",
  "문의해주세요",
]);

function _isLikelyPortalUiNoiseLine(line) {
  const src = String(line || "").trim();
  if (!src) return false;

  const compact = src.replace(/\s+/g, "");
  const compactLower = compact.toLowerCase();

  // exact short labels
  if (compact.length <= 24 && PORTAL_UI_NOISE_EXACT.has(compact)) return true;

  // very short UI CTA/navigation labels
  if (compact.length <= 24) {
    if (/(더보기|공유하기|스크랩|문의해주세요|추천공고|채용관|기업정보|공고원문보기)/.test(compact)) return true;
  }

  // avoid dropping likely JD content lines
  if (/(담당업무|주요업무|자격요건|우대사항|지원자격|필수요건|requirements|responsibilities|qualifications|preferred)/i.test(src)) {
    return false;
  }

  // short "section-like" portal labels with punctuation
  if (compact.length <= 26) {
    if (/^(접수기간|지원방법|상세요강|기업정보)\:?$/.test(compact)) return true;
  }

  // keep explicit schedule/detail lines if they contain enough context
  if (/(접수기간|지원방법)/.test(src) && src.length >= 28) return false;

  // generic share/scrap english variants (short only)
  if (compactLower.length <= 18 && /^(share|scrap|bookmark)$/.test(compactLower)) return true;

  return false;
}

// ─── Section-Aware Reorder (1차 패치) ────────────────────────────────────────
// 목적: finalText 내 핵심 섹션(담당업무/자격요건)을 앞으로,
//       메타/노이즈(근무시간/주소 등)를 뒤로 재배치
// 규칙: 삭제 아닌 재배치 우선. 기존 noise 필터와 독립.

const _SECTION_CORE_ANCHORS = [
  "포지션 및 자격요건",
  "담당업무",
  "주요업무",
  "자격요건",
  "필수요건",
  "필수 요건",
  "우대사항",
  "우대 사항",
  "지원자격",
  "지원 자격",
];

const _SECTION_META_ANCHORS = [
  "근무시간",
  "근무요일",
  "근무지주소",
  "근무지역",
  "근무지",
  "접수기간",
  "마감일",
  "급여",
  "연봉",
  "고용형태",
  "복리후생",
  "모집인원",
  "인근지하철",
];

// core block 종료를 유발하는 섹션 앵커 (meta와 분리)
const _SECTION_STOP_ANCHORS = [
  "전형절차",
  "유의사항",
  "기업정보",
  "접수방법",
];

const _SECTION_NOISE_EXACT = new Set(["top", "ad", "로그인", "추천공고"]);
const _SECTION_NOISE_STARTS = ["ai추천공고", "로그인 하고"];

// anchor 매칭 전 라인 정규화: trim + 앞뒤 괄호/불릿/기호 제거 + 뒤 콜론 제거
function _normalizeAnchorLine(line) {
  let s = String(line || "").trim();
  // 앞: 불릿/괄호/기호류 제거 (■ ● ▪ ▶ ▸ ◆ * - • · 【 [ ( 등)
  s = s.replace(/^[\s■●▪▶▸◆★☆*\-•·◇◈\[\]【】《》\(\)〔〕]+/, "");
  // 뒤: 콜론/괄호/공백 제거
  s = s.replace(/[\s:：\[\]【】\(\)]+$/, "");
  return s.trim().toLowerCase();
}

function _lineMatchesAnchors(ln, anchors) {
  for (const k of anchors) {
    const lk = k.toLowerCase();
    if (ln === lk || ln.startsWith(lk + ":") || ln.startsWith(lk + " ") || ln.startsWith(lk + "\t")) return true;
  }
  return false;
}

function _isReorderNoiseLine(ln) {
  if (_SECTION_NOISE_EXACT.has(ln)) return true;
  return _SECTION_NOISE_STARTS.some((k) => ln.startsWith(k));
}

function _lineHasVisibleContent(line) {
  return /[\p{L}\p{N}]/u.test(String(line || ""));
}

function _prioritizeSectionLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return lines;
  const coreBlocks = [];
  const metaLines = [];
  const noiseLines = [];
  const otherLines = [];
  let currentCoreBlock = null;

  for (const line of lines) {
    const ln = _normalizeAnchorLine(line);
    const isCoreAnchor = _lineMatchesAnchors(ln, _SECTION_CORE_ANCHORS);
    const isMetaAnchor = _lineMatchesAnchors(ln, _SECTION_META_ANCHORS);
    const isStopAnchor = _lineMatchesAnchors(ln, _SECTION_STOP_ANCHORS);
    const isNoise = _isReorderNoiseLine(ln);

    if (isCoreAnchor) {
      // 다른 core anchor: 현재 블록 닫고 새 블록 시작
      if (currentCoreBlock && currentCoreBlock.length > 0) coreBlocks.push(currentCoreBlock);
      currentCoreBlock = [line];
    } else if (currentCoreBlock) {
      // core block 종료 조건: stop anchor / meta anchor / noise line
      if (isStopAnchor || isMetaAnchor || isNoise) {
        if (currentCoreBlock.length > 0) coreBlocks.push(currentCoreBlock);
        currentCoreBlock = null;
        if (isNoise) noiseLines.push(line);
        else metaLines.push(line);
      } else {
        currentCoreBlock.push(line);
      }
    } else if (isStopAnchor || isMetaAnchor) {
      metaLines.push(line);
    } else if (isNoise) {
      noiseLines.push(line);
    } else {
      otherLines.push(line);
    }
  }

  if (currentCoreBlock && currentCoreBlock.length > 0) coreBlocks.push(currentCoreBlock);

  const result = [];
  for (const block of coreBlocks) result.push(...block);
  result.push(...otherLines);
  result.push(...metaLines);
  result.push(...noiseLines);
  return result;
}

// ✅ P0 (append-only): 텍스트 정제 + 병합 — 중복/공백/무의미 라인 제거
function _mergeAndCleanFinalText(baseText, ocrText) {
  const base = String(baseText || "").trim();
  const ocr = String(ocrText || "").trim();
  const combined = base && ocr ? `${base}\n\n${ocr}` : base || ocr;
  const lines = combined.split("\n");
  const seen = new Set();
  const cleaned = [];
  for (const raw of lines) {
    const line = raw.replace(/[ \t]+/g, " ").trim();
    if (!line) continue;
    if (line.length < 2) continue;
    if (!_lineHasVisibleContent(line)) continue;
    if (_isLikelyPortalUiNoiseLine(line)) continue;
    if (seen.has(line)) continue;
    seen.add(line);
    cleaned.push(line);
  }
  return _prioritizeSectionLines(cleaned).join("\n");
}

function _countSignals(text, keywords) {
  const src = String(text || "").toLowerCase();
  if (!src) return 0;
  let c = 0;
  for (const kw of keywords || []) {
    const needle = String(kw || "").toLowerCase();
    if (needle && src.includes(needle)) c += 1;
  }
  return c;
}

function _countJdSignals(text) {
  return _countSignals(text, JD_SIGNAL_KEYWORDS);
}

function _countPortalNoiseSignals(text) {
  return _countSignals(text, PORTAL_NOISE_KEYWORDS);
}

function _isLikelyJobDescription(text, title, pathname) {
  const body = String(text || "");
  const t = String(title || "");
  const p = String(pathname || "").toLowerCase();
  const merged = `${t}\n${body}`;

  const jdSignals = _countJdSignals(merged);
  const portalNoiseSignals = _countPortalNoiseSignals(merged);

  const titleLooksLanding = LANDING_TITLE_HINTS.some((kw) => t.toLowerCase().includes(String(kw).toLowerCase()));
  const pathLooksLanding = p === "/" || p === "" || /^\/(home|main|landing|index(?:\.html)?)\/?$/i.test(p);

  // append-only: 잡코리아 GI_Read 공고 경로는 판정 기준 완화 — 정상 공고 URL이면서 jdSignals >= 1이면 통과
  const isJobKoreaGIRead = /^\/recruit\/gi_read\//i.test(p);
  if (isJobKoreaGIRead && jdSignals >= 1 && body.length >= 120) return true;

  if (jdSignals < 2) return false;
  if (body.length < 180 && jdSignals < 3) return false;
  if (portalNoiseSignals >= 5 && jdSignals < 4) return false;
  if ((titleLooksLanding || pathLooksLanding) && jdSignals < 4) return false;

  return true;
}

function _normalizeCandidateUrl(rawUrl) {
  const s = String(rawUrl || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const lower = s.toLowerCase();
  const allowPrefixes = [
    "saramin.co.kr/",
    "www.saramin.co.kr/",
    "jobkorea.co.kr/",
    "www.jobkorea.co.kr/",
  ];
  if (allowPrefixes.some((p) => lower.startsWith(p))) {
    return `https://${s}`;
  }
  return s;
}

export default async function handler(req, res) {
  _setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const isDebug = process.env.NODE_ENV !== "production";
  const debugSnapshot = {
    host: "",
    pathname: "",
    extractionMode: "site-specific",
    preValidationTextLength: 0,
    jdSignalCount: 0,
    portalNoiseCount: 0,
    title: "",
    textPreview: "",
    validationPassed: false,
    finalDecision: "",
    saramin: null,
    jobkorea: null,
  };

  let currentStage = "request_validation";
  let extractionMode = "site-specific";
  let bodyImageCount = 0;
  let textLength = 0;
  let ocrTextLength = 0;
  let ocrAttempted = false;
  let contentType = "";
  let rawBodyLength = 0;
  let hasUrlField = false;
  let fetchStatus = 0;
  let finalUrl = "";
  let fetchedContentType = "";
  let htmlLength = 0;
  let htmlSnippet = "";

  const _internalError = (stage, err) => {
    const message = (() => {
      const raw = String(err?.message || err || "unknown_error");
      // avoid leaking tokens/secrets from upstream errors
      return raw
        .replace(/(api[_-]?key|authorization|bearer)\s*[=:]\s*[^,\s]+/gi, "$1=[redacted]")
        .slice(0, 500);
    })();
    return res.status(500).json({
      ok: false,
      error: "INTERNAL_ERROR",
      stage: stage || "unhandled",
      message,
      meta: {
        contentType,
        rawBodyLength: Number(rawBodyLength || 0),
        hasUrlField: !!hasUrlField,
        extractionMode,
        ocrAttempted: !!ocrAttempted,
        bodyImageCount: Number(bodyImageCount || 0),
        textLength: Number(textLength || 0),
        ocrTextLength: Number(ocrTextLength || 0),
      },
    });
  };

  const _requestValidationError = (error, message) => {
    return res.status(400).json({
      ok: false,
      error,
      stage: "request_validation",
      message: String(message || error || "request validation failed").slice(0, 500),
      meta: {
        contentType,
        rawBodyLength: Number(rawBodyLength || 0),
        hasUrlField: !!hasUrlField,
        extractionMode,
        ocrAttempted: !!ocrAttempted,
        bodyImageCount: Number(bodyImageCount || 0),
        textLength: Number(textLength || 0),
        ocrTextLength: Number(ocrTextLength || 0),
      },
    });
  };

  try {
    currentStage = "request_validation";
    contentType = String(req?.headers?.["content-type"] || "").toLowerCase();
    if (contentType && !contentType.includes("application/json")) {
      return _requestValidationError("UNSUPPORTED_CONTENT_TYPE", `Unsupported content-type: ${contentType}`);
    }

    let parsedBody = null;
    let rawBodyText = "";
    let bodyAccessError = null;
    let body = null;
    try {
      body = req?.body;
    } catch (e) {
      bodyAccessError = e;
    }

    const _parseJsonText = (s) => {
      const t = String(s || "");
      rawBodyText = t;
      rawBodyLength = Buffer.byteLength(t, "utf8");
      if (!t.trim()) return { ok: false, code: "EMPTY_BODY", message: "Request body is empty" };
      try {
        return { ok: true, value: JSON.parse(t) };
      } catch {
        return { ok: false, code: "INVALID_JSON", message: "Invalid JSON" };
      }
    };

    if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
      parsedBody = body;
      try {
        rawBodyLength = Buffer.byteLength(JSON.stringify(body), "utf8");
      } catch {
        rawBodyLength = 0;
      }
    } else if (typeof body === "string") {
      const parsed = _parseJsonText(body);
      if (!parsed.ok) return _requestValidationError(parsed.code, parsed.message);
      parsedBody = parsed.value;
    } else if (Buffer.isBuffer(body)) {
      const parsed = _parseJsonText(body.toString("utf8"));
      if (!parsed.ok) return _requestValidationError(parsed.code, parsed.message);
      parsedBody = parsed.value;
    }

    if (!parsedBody && req?.rawBody != null) {
      if (typeof req.rawBody === "string") {
        const parsed = _parseJsonText(req.rawBody);
        if (!parsed.ok) return _requestValidationError(parsed.code, parsed.message);
        parsedBody = parsed.value;
      } else if (Buffer.isBuffer(req.rawBody)) {
        const parsed = _parseJsonText(req.rawBody.toString("utf8"));
        if (!parsed.ok) return _requestValidationError(parsed.code, parsed.message);
        parsedBody = parsed.value;
      } else if (typeof req.rawBody === "object") {
        parsedBody = req.rawBody;
        try {
          rawBodyLength = Buffer.byteLength(JSON.stringify(req.rawBody), "utf8");
        } catch {
          rawBodyLength = 0;
        }
      }
    }

    if (!parsedBody && typeof req?.on === "function" && !req?.readableEnded) {
      const streamText = await new Promise((resolve, reject) => {
        const chunks = [];
        let settled = false;
        const done = (fn, value) => {
          if (settled) return;
          settled = true;
          fn(value);
        };
        req.on("data", (chunk) => {
          try {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), "utf8"));
          } catch {}
        });
        req.on("end", () => {
          const merged = chunks.length ? Buffer.concat(chunks).toString("utf8") : "";
          done(resolve, merged);
        });
        req.on("error", (err) => done(reject, err));
      });
      if (streamText && streamText.trim()) {
        const parsed = _parseJsonText(streamText);
        if (!parsed.ok) return _requestValidationError(parsed.code, parsed.message);
        parsedBody = parsed.value;
      }
    }

    if (!parsedBody) {
      if (bodyAccessError) {
        const msg = String(bodyAccessError?.message || "");
        if (msg.toLowerCase().includes("invalid json")) {
          return _requestValidationError("INVALID_JSON", msg || "Invalid JSON");
        }
        return _requestValidationError("INVALID_JSON", msg || "Failed to parse request body");
      }
      return _requestValidationError("EMPTY_BODY", "Request body is empty");
    }

    hasUrlField = !!(parsedBody && Object.prototype.hasOwnProperty.call(parsedBody, "url"));
    if (!hasUrlField) {
      return _requestValidationError("MISSING_URL", "url field is required");
    }

    const rawUrl = String(parsedBody?.url || "").trim();
    if (!rawUrl) {
      return _requestValidationError("MISSING_URL", "url field is empty");
    }
    const normalizedUrl = _normalizeCandidateUrl(rawUrl);

    let parsed = null;
    try {
      parsed = new URL(normalizedUrl);
    } catch {
      return res.status(400).json({ ok: false, error: "INVALID_URL" });
    }

    const host = String(parsed.hostname || "").toLowerCase();
    if (!ALLOWED_HOSTS.has(host)) {
      return res.status(400).json({ ok: false, error: "UNSUPPORTED_DOMAIN" });
    }

    debugSnapshot.host = host;
    debugSnapshot.pathname = String(parsed.pathname || "");

    let html = "";
    currentStage = "fetch_html";
    try {
      const r = await fetch(parsed.toString(), {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 PASSMAP JD Extractor",
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        },
      });
      fetchStatus = Number(r?.status || 0);
      finalUrl = String(r?.url || parsed.toString());
      fetchedContentType = String(r?.headers?.get("content-type") || "").toLowerCase();
      if (!r.ok) {
        return res.status(400).json({ ok: false, error: "FETCH_FAILED" });
      }
      html = await _readResponseHtml(r, host);
      htmlLength = String(html || "").length;
      htmlSnippet = String(_extractPlainText(html) || "").slice(0, 320);
    } catch {
      return res.status(400).json({ ok: false, error: "FETCH_FAILED" });
    }

    const hostNoWww = host.replace(/^www\./, "");
    extractionMode = "site-specific";
    let text = "";
    currentStage = "extract_body_images";
    const bodyImageSelection = _extractBodyImageCandidates(html, parsed.toString());
    const bodyImageUrls = bodyImageSelection.urls;
    bodyImageCount = Array.isArray(bodyImageUrls) ? bodyImageUrls.length : 0;
    // ✅ P0 (append-only): OCR 상태 변수
    currentStage = "ocr_prepare";
    const __visionKey = String(process.env.GOOGLE_CLOUD_VISION_API_KEY || "").trim();
    let ocrText = "";
    let ocrBlocks = [];
    let ocrSuccessCount = 0;
    let ocrFailCount = 0;

    if (hostNoWww === "saramin.co.kr") {
      currentStage = "extract_meta_text";
      const recIdx = parsed?.searchParams?.get("rec_idx") || "";
      const s = await _extractSaraminTextWithDebug(html, recIdx, parsed);
      text = String(s?.text || "");
      debugSnapshot.saramin = s?.debug || null;
    } else if (hostNoWww === "jobkorea.co.kr") {
      currentStage = "extract_meta_text";
      const j = _extractJobKoreaTextWithDebug(html);
      text = String(j?.text || "");
      debugSnapshot.jobkorea = j?.debug || null;
    }
    textLength = String(text || "").length;

    if (!text || text.length < 120) {
      extractionMode = "generic";
      currentStage = "extract_meta_text";
      text = _extractPlainText(html);
      textLength = String(text || "").length;
    }

    // ✅ P0 (append-only): OCR 파이프라인 실행 — bodyImageUrls가 있으면 Vision OCR 시도
    if (bodyImageUrls.length > 0 && __visionKey) {
      ocrAttempted = true;
      currentStage = "call_vision_ocr";
      const __ocrResult = await _runBodyImagesOcr(bodyImageUrls, __visionKey);
      ocrText = String(__ocrResult.ocrText || "");
      ocrBlocks = __ocrResult.ocrBlocks || [];
      ocrSuccessCount = __ocrResult.ocrSuccessCount || 0;
      ocrFailCount = __ocrResult.ocrFailCount || 0;
      debugSnapshot.ocrErrors = __ocrResult.errors || [];
    }
    ocrTextLength = String(ocrText || "").length;
    currentStage = "merge_final_text";
    const finalText = _mergeAndCleanFinalText(text, ocrText);

    debugSnapshot.extractionMode = extractionMode;
    debugSnapshot.preValidationTextLength = String(finalText || "").length;

    if (finalText.length < 120) {
      debugSnapshot.title = _extractTitle(html);
      debugSnapshot.textPreview = String(finalText || "").slice(0, 420);
      debugSnapshot.finalDecision = "TEXT_TOO_SHORT";
      if (isDebug) {
        try {
          console.log("[extract-job-posting.debug]", JSON.stringify(debugSnapshot));
        } catch {}
      }
      return res.status(400).json({ ok: false, error: "TEXT_TOO_SHORT", bodyImageUrls });
    }

    const title = _extractTitle(html);
    const jdSignalCount = _countJdSignals(`${title}\n${finalText}`);
    const portalNoiseCount = _countPortalNoiseSignals(`${title}\n${finalText}`);
    currentStage = "validate_job_description";
    const passed = _isLikelyJobDescription(finalText, title, parsed.pathname);

    debugSnapshot.jdSignalCount = jdSignalCount;
    debugSnapshot.portalNoiseCount = portalNoiseCount;
    debugSnapshot.title = title;
    debugSnapshot.textPreview = String(finalText || "").slice(0, 420);
    debugSnapshot.validationPassed = passed;

    if (!passed) {
      const merged = `${title}\n${finalText}`;
      const mergedLower = String(merged || "").toLowerCase();
      const p = String(parsed?.pathname || "").toLowerCase();
      const titleLooksLanding = LANDING_TITLE_HINTS.some((kw) => String(title || "").toLowerCase().includes(String(kw).toLowerCase()));
      const pathLooksLanding = p === "/" || p === "" || /^\/(home|main|landing|index(?:\.html)?)\/?$/i.test(p);
      const failedChecks = [];
      if (jdSignalCount < 2) failedChecks.push("JD_SIGNAL_LT_2");
      if (finalText.length < 180 && jdSignalCount < 3) failedChecks.push("BODY_LT_180_AND_JD_SIGNAL_LT_3");
      if (portalNoiseCount >= 5 && jdSignalCount < 4) failedChecks.push("PORTAL_NOISE_GTE_5_AND_JD_SIGNAL_LT_4");
      if ((titleLooksLanding || pathLooksLanding) && jdSignalCount < 4) failedChecks.push("LANDING_HINT_AND_JD_SIGNAL_LT_4");
      const matchedJdKeywords = JD_SIGNAL_KEYWORDS.filter((kw) => mergedLower.includes(String(kw).toLowerCase())).slice(0, 12);
      debugSnapshot.finalDecision = "NOT_JOB_DESCRIPTION";
      if (isDebug) {
        try {
          console.log("[extract-job-posting.debug]", JSON.stringify(debugSnapshot));
        } catch {}
      }
      return res.status(400).json({
        ok: false,
        error: "NOT_JOB_DESCRIPTION",
        stage: currentStage,
        message: "Job description validation failed",
        meta: {
          fetchStatus,
          finalUrl: finalUrl || parsed.toString(),
          contentType: fetchedContentType,
          htmlLength: Number(htmlLength || 0),
          title: title || "",
          htmlSnippet: String(htmlSnippet || "").slice(0, 400),
          failedChecks,
          detectionReason: failedChecks.length ? failedChecks.join(", ") : "Validation returned false",
          jdSignals: {
            jdSignalCount,
            portalNoiseCount,
            matchedKeywords: matchedJdKeywords,
          },
          extractionMode,
          textLength: Number(textLength || 0),
          ocrTextLength: Number(ocrTextLength || 0),
          ocrAttempted: !!ocrAttempted,
        },
      });
    }

    debugSnapshot.finalDecision = "OK";
    if (isDebug) {
      try {
        console.log("[extract-job-posting.debug]", JSON.stringify(debugSnapshot));
      } catch {}
    }

    return res.status(200).json({
      ok: true,
      text,
      bodyImageUrls,
      ocrText: ocrText || undefined,
      finalText,
      meta: {
        source: hostNoWww,
        sourceHost: hostNoWww,
        extractionMode,
        bodyImageCandidateCount: Number(bodyImageSelection?.candidateCount || 0),
        bodyImageSelectedCount: Number(bodyImageSelection?.selectedCount || 0),
        bodyImageSelectionStage: String(bodyImageSelection?.bodyImageSelectionStage || "none"),
        bodyImageRescueUsed: !!bodyImageSelection?.bodyImageRescueUsed,
        bodyImageRescueRejectedCount: Number(bodyImageSelection?.bodyImageRescueRejectedCount || 0),
        bodyImageShareMetaRejectedCount: Number(bodyImageSelection?.bodyImageShareMetaRejectedCount || 0),
        bodyImageKeywordBoostUsed: !!bodyImageSelection?.bodyImageKeywordBoostUsed,
        bodyImageRescueTopCandidates: Array.isArray(bodyImageSelection?.bodyImageRescueTopCandidates)
          ? bodyImageSelection.bodyImageRescueTopCandidates
          : [],
        bodyImageRejectedSummary: bodyImageSelection?.rejectedSummary || undefined,
        bodyImageTopCandidates: Array.isArray(bodyImageSelection?.topCandidates)
          ? bodyImageSelection.topCandidates
          : [],
        ocrKeyStatus: __visionKey ? "OK" : "ENV_MISSING",
        saraminContentSource: hostNoWww === "saramin.co.kr" ? String(debugSnapshot?.saramin?.saraminContentSource || "") || undefined : undefined,
        title: title || undefined,
        ocrAttempted,
        ocrSuccessCount,
        ocrFailCount,
      },
    });
  } catch (err) {
    return _internalError(currentStage || "unhandled", err);
  }
}

