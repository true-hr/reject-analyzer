import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ALLOWED_HOSTS = new Set([
  "saramin.co.kr",
  "www.saramin.co.kr",
  "jobkorea.co.kr",
  "www.jobkorea.co.kr",
  "wanted.co.kr",
  "www.wanted.co.kr",
]);

const NOISE_LINES = new Set([
  "占싸깍옙占쏙옙",
  "회占쏙옙占쏙옙占쏙옙",
  "占쏙옙占쏙옙占싹깍옙",
  "占쏙옙크占쏙옙",
  "占쏙옙占쏙옙占싹깍옙",
  "占쏙옙占쏙옙占쏙옙占?",
  "占쌨댐옙",
  "占쌥깍옙",
]);

const EXTRA_NOISE_HINTS = [
  "占쏙옙천占쏙옙占쏙옙",
  "占쏙옙占쏙옙",
  "占쏙옙占?",
  "占쏙옙占싸몌옙占?",
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
  "占싸깍옙占쏙옙",
  "회占쏙옙占쏙옙占쏙옙",
  "占쏙옙占쏙옙占쏙옙占?",
  "占싯삼옙",
  "占쌍울옙채占쏙옙",
  "占쏙옙천占쏙옙占쏙옙",
  "占싱력쇽옙",
  "占쏙옙채占쌈븝옙",
  "占쏙옙占쏙옙米占?",
  "占쏙옙占?",
  "占쏙옙占싸몌옙占?",
  "占쏙옙占쏙옙채占쏙옙",
  "占쏙옙占쏙옙 占쌀곤옙",
  "占쏙옙占쏙옙",
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
  "占쏙옙占쏙옙",
  "landing",
  "채占쏙옙 占시뤄옙占쏙옙",
  "占쏙옙占쏙옙占쏙옙占?",
  "占쏙옙占쏙옙占쏙옙占?",
  "회占쏙옙占쏙옙占쏙옙",
  "占싸깍옙占쏙옙",
  "占싯삼옙",
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
    const html = await r.text();
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
    const html = await r.text();
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
          if (extracted?.text && extracted.text.length > 0) {
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
          relayOverrides.saraminUserContentLength = Number(extracted?.userContentLength || 0);
        }
      }
    }
    const scriptedFallback = _extractSaraminDescriptionFromScriptWithDebug(html, targetRecIdx);
    return {
      text: String(scriptedFallback?.text || ""),
      debug: {
        ...baseDebug,
        ...(scriptedFallback?.debug || {}),
        ...relayOverrides,
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

function _extractWantedText(html) {
  return _extractBySelectors(html, [
    "JobDescription",
    "job-description",
    "jobDescription",
    "jdSection",
    "jd-section",
  ]);
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
    "wanted.co.kr/",
    "www.wanted.co.kr/",
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

  try {
    const rawUrl = String(req?.body?.url || "").trim();
    if (!rawUrl) {
      return res.status(400).json({ ok: false, error: "INVALID_URL" });
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
    try {
      const r = await fetch(parsed.toString(), {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 PASSMAP JD Extractor",
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        },
      });
      if (!r.ok) {
        return res.status(400).json({ ok: false, error: "FETCH_FAILED" });
      }
      html = await r.text();
    } catch {
      return res.status(400).json({ ok: false, error: "FETCH_FAILED" });
    }

    const hostNoWww = host.replace(/^www\./, "");
    let extractionMode = "site-specific";
    let text = "";

    if (hostNoWww === "saramin.co.kr") {
      const recIdx = parsed?.searchParams?.get("rec_idx") || "";
      const s = await _extractSaraminTextWithDebug(html, recIdx, parsed);
      text = String(s?.text || "");
      debugSnapshot.saramin = s?.debug || null;
    } else if (hostNoWww === "jobkorea.co.kr") {
      const j = _extractJobKoreaTextWithDebug(html);
      text = String(j?.text || "");
      debugSnapshot.jobkorea = j?.debug || null;
    } else {
      text = _extractWantedText(html);
    }

    if (!text || text.length < 120) {
      extractionMode = "generic";
      text = _extractPlainText(html);
    }

    debugSnapshot.extractionMode = extractionMode;
    debugSnapshot.preValidationTextLength = String(text || "").length;

    if (text.length < 120) {
      debugSnapshot.title = _extractTitle(html);
      debugSnapshot.textPreview = String(text || "").slice(0, 420);
      debugSnapshot.finalDecision = "TEXT_TOO_SHORT";
      if (isDebug) {
        try {
          console.log("[extract-job-posting.debug]", JSON.stringify(debugSnapshot));
        } catch {}
      }
      return res.status(400).json({ ok: false, error: "TEXT_TOO_SHORT" });
    }

    const title = _extractTitle(html);
    const jdSignalCount = _countJdSignals(`${title}\n${text}`);
    const portalNoiseCount = _countPortalNoiseSignals(`${title}\n${text}`);
    const passed = _isLikelyJobDescription(text, title, parsed.pathname);

    debugSnapshot.jdSignalCount = jdSignalCount;
    debugSnapshot.portalNoiseCount = portalNoiseCount;
    debugSnapshot.title = title;
    debugSnapshot.textPreview = String(text || "").slice(0, 420);
    debugSnapshot.validationPassed = passed;

    if (!passed) {
      debugSnapshot.finalDecision = "NOT_JOB_DESCRIPTION";
      if (isDebug) {
        try {
          console.log("[extract-job-posting.debug]", JSON.stringify(debugSnapshot));
        } catch {}
      }
      return res.status(400).json({ ok: false, error: "NOT_JOB_DESCRIPTION" });
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
      meta: {
        source: hostNoWww,
        sourceHost: hostNoWww,
        extractionMode,
        saraminContentSource: hostNoWww === "saramin.co.kr" ? String(debugSnapshot?.saramin?.saraminContentSource || "") || undefined : undefined,
        title: title || undefined,
      },
    });
  } catch {
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}

