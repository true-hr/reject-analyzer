/**
 * generate-extract-fixtures.js
 *
 * DOCX / PDF fixture 파일 생성기.
 * 외부 의존성 없이 Node.js 내장 모듈만 사용.
 *
 * 생성 대상:
 *   tests/fixtures/extract/resume_sample_01.docx
 *   tests/fixtures/extract/jd_sample_01.docx
 *   tests/fixtures/extract/resume_sample_01.pdf
 *   tests/fixtures/extract/jd_sample_01.pdf
 *
 * 실행:
 *   node ./scripts/generate-extract-fixtures.js
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.resolve(__dirname, "../tests/fixtures/extract");

// ═══════════════════════════════════════════════════════════════════════
// CRC-32 (ZIP 체크섬용)
// ═══════════════════════════════════════════════════════════════════════

function makeCrcTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
}
const CRC_TABLE = makeCrcTable();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ═══════════════════════════════════════════════════════════════════════
// ZIP 빌더 (DOCX 컨테이너)
// ═══════════════════════════════════════════════════════════════════════

function u16(v) { const b = Buffer.alloc(2); b.writeUInt16LE(v >>> 0, 0); return b; }
function u32(v) { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0, 0); return b; }

function buildZip(files) {
  const locals = [];
  const cdEntries = [];
  let localOffset = 0;

  for (const { name, data } of files) {
    const nb = Buffer.from(name, "utf-8");
    const crc = crc32(data);

    const local = Buffer.concat([
      Buffer.from([0x50, 0x4B, 0x03, 0x04]),        // Local file header sig
      u16(20), u16(0), u16(0), u16(0), u16(0),       // version, flags, method, time, date
      u32(crc), u32(data.length), u32(data.length),  // crc, comp-size, uncomp-size
      u16(nb.length), u16(0),                         // name-len, extra-len
      nb, data,
    ]);

    const cd = Buffer.concat([
      Buffer.from([0x50, 0x4B, 0x01, 0x02]),        // Central dir sig
      u16(20), u16(20),                              // version made-by, version needed
      u16(0), u16(0), u16(0), u16(0),               // flags, method, time, date
      u32(crc), u32(data.length), u32(data.length), // crc, comp-size, uncomp-size
      u16(nb.length), u16(0), u16(0),               // name-len, extra-len, comment-len
      u16(0), u16(0), u32(0),                       // disk-start, int-attrs, ext-attrs
      u32(localOffset), nb,                          // local header offset, name
    ]);

    locals.push(local);
    cdEntries.push(cd);
    localOffset += local.length;
  }

  const cdBuf = Buffer.concat(cdEntries);
  const eocd = Buffer.concat([
    Buffer.from([0x50, 0x4B, 0x05, 0x06]), // EOCD sig
    u16(0), u16(0),                         // disk#, disk with CD
    u16(files.length), u16(files.length),   // entries on disk, total entries
    u32(cdBuf.length), u32(localOffset),    // CD size, CD offset
    u16(0),                                 // comment length
  ]);

  return Buffer.concat([...locals, cdBuf, eocd]);
}

// ═══════════════════════════════════════════════════════════════════════
// DOCX 빌더
// ═══════════════════════════════════════════════════════════════════════

function escXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildDocx(paragraphs) {
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const CT_NS = 'xmlns="http://schemas.openxmlformats.org/package/2006/content-types"';
  const RL_NS = 'xmlns="http://schemas.openxmlformats.org/package/2006/relationships"';
  const W_NS  = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const OFF_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument";

  const ct = X + `<Types ${CT_NS}>`
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/word/document.xml"'
    + ' ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '</Types>';

  const rels = X + `<Relationships ${RL_NS}>`
    + `<Relationship Id="rId1" Type="${OFF_TYPE}" Target="word/document.xml"/>`
    + '</Relationships>';

  const wordRels = X + `<Relationships ${RL_NS}></Relationships>`;

  const paras = paragraphs
    .map((p) => `<w:p><w:r><w:t xml:space="preserve">${escXml(p)}</w:t></w:r></w:p>`)
    .join("");

  const doc = X + `<w:document ${W_NS}><w:body>${paras}<w:sectPr/></w:body></w:document>`;

  return buildZip([
    { name: "[Content_Types].xml",         data: Buffer.from(ct,       "utf-8") },
    { name: "_rels/.rels",                 data: Buffer.from(rels,     "utf-8") },
    { name: "word/_rels/document.xml.rels",data: Buffer.from(wordRels, "utf-8") },
    { name: "word/document.xml",           data: Buffer.from(doc,      "utf-8") },
  ]);
}

// ═══════════════════════════════════════════════════════════════════════
// PDF 빌더 (Type0 + ToUnicode CMap — 한국어 포함 Unicode 지원)
//
// 방식:
//   모든 문자에 고유 GID(2바이트) 부여 → ToUnicode CMap으로 Unicode 매핑
//   content stream: <GID...> Tj 형식으로 텍스트 인코딩
//   pdfjs는 ToUnicode CMap을 통해 str을 복원함
// ═══════════════════════════════════════════════════════════════════════

function buildPdf(lines) {
  const allText = lines.join("");
  // 고유 문자 목록 + GID 맵핑 (1-based)
  const uniqueChars = [...new Set([...allText])];
  const charToGID = new Map(uniqueChars.map((c, i) => [c, i + 1]));
  const gidMax = uniqueChars.length;

  function hex4(n) { return n.toString(16).toUpperCase().padStart(4, "0"); }

  // Unicode 코드포인트 → ToUnicode hex string (BMP: 4자, SMP: surrogate pair 8자)
  function cpHex(c) {
    const cp = c.codePointAt(0);
    if (cp <= 0xFFFF) return hex4(cp);
    const hi = Math.floor((cp - 0x10000) / 0x400) + 0xD800;
    const lo = (cp - 0x10000) % 0x400 + 0xDC00;
    return hex4(hi) + hex4(lo);
  }

  // ToUnicode CMap 스트림
  const bfChars = uniqueChars.map((c) => `<${hex4(charToGID.get(c))}> <${cpHex(c)}>`).join("\n");
  const cmap = [
    "/CIDInit /ProcSet findresource begin",
    "12 dict begin",
    "begincmap",
    "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
    "/CMapName /Adobe-Identity-UCS def",
    "/CMapType 2 def",
    "1 begincodespacerange",
    `<0001> <${hex4(gidMax)}>`,
    "endcodespacerange",
    `${gidMax} beginbfchar`,
    bfChars,
    "endbfchar",
    "endcmap",
    "CMapName currentdict /CMap defineresource pop",
    "end",
    "end",
  ].join("\n");

  // 한 줄을 GID hex 시퀀스로 인코딩
  function encodeHex(text) {
    let h = "";
    for (const c of text) {
      const gid = charToGID.get(c);
      if (gid !== undefined) h += hex4(gid);
    }
    return h;
  }

  // content stream: 각 줄을 Tm(절대 위치) + Tj(텍스트)로 배치
  const cs = ["BT", "/F1 12 Tf"];
  let yPos = 780;
  for (const line of lines) {
    const h = encodeHex(line);
    if (h) {
      cs.push(`1 0 0 1 50 ${yPos} Tm`);
      cs.push(`<${h}> Tj`);
    }
    yPos -= 18;
  }
  cs.push("ET");
  const contentStream = cs.join("\n");

  // ── PDF 조립 (바이트 오프셋 추적) ──────────────────────────────────
  const bufs = [];
  const objOffsets = {};
  let pos = 0;

  function w(s) {
    const b = Buffer.isBuffer(s) ? s : Buffer.from(s, "utf-8");
    bufs.push(b);
    pos += b.length;
  }

  function startObj(n) { objOffsets[n] = pos; w(`${n} 0 obj\n`); }
  function endObj()    { w("endobj\n"); }

  function writeStreamObj(n, content) {
    const cb = Buffer.from(content, "utf-8");
    startObj(n);
    w(`<< /Length ${cb.length} >>\nstream\n`);
    w(cb);
    w("\nendstream\n");
    endObj();
  }

  // Header
  w("%PDF-1.4\n");
  w(Buffer.from([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A])); // binary comment

  // 1: Catalog
  startObj(1);
  w("<< /Type /Catalog /Pages 2 0 R >>\n");
  endObj();

  // 2: Pages
  startObj(2);
  w("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n");
  endObj();

  // 3: Page
  startObj(3);
  w("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]\n");
  w("   /Contents 4 0 R\n");
  w("   /Resources << /Font << /F1 5 0 R >> >> >>\n");
  endObj();

  // 4: Content stream
  writeStreamObj(4, contentStream);

  // 5: Font (Type0)
  startObj(5);
  w("<< /Type /Font /Subtype /Type0\n");
  w("   /BaseFont /MyFont\n");
  w("   /Encoding /Identity-H\n");
  w("   /DescendantFonts [6 0 R]\n");
  w("   /ToUnicode 7 0 R >>\n");
  endObj();

  // 6: CIDFont (DescendantFont)
  startObj(6);
  w("<< /Type /Font /Subtype /CIDFontType2\n");
  w("   /BaseFont /MyFont\n");
  w("   /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >>\n");
  w("   /DW 1000 >>\n");
  endObj();

  // 7: ToUnicode CMap stream
  writeStreamObj(7, cmap);

  // xref + trailer
  const xrefPos = pos;
  const nObjs = Object.keys(objOffsets).length + 1; // obj 0 (free) + real objs
  w("xref\n");
  w(`0 ${nObjs}\n`);
  w("0000000000 65535 f\r\n");                              // obj 0 (free)
  for (let i = 1; i < nObjs; i++) {
    w(`${String(objOffsets[i]).padStart(10, "0")} 00000 n\r\n`);
  }
  w("trailer\n");
  w(`<< /Size ${nObjs} /Root 1 0 R >>\n`);
  w("startxref\n");
  w(`${xrefPos}\n`);
  w("%%EOF\n");

  return Buffer.concat(bufs);
}

// ═══════════════════════════════════════════════════════════════════════
// Fixture 내용 정의
// ═══════════════════════════════════════════════════════════════════════

const RESUME_LINES = [
  "홍길동",
  "서울특별시 강남구 | 010-1234-5678 | gildong@email.com",
  "",
  "경력 사항",
  "(주)테크솔루션 | 백엔드 개발자 | 2021.03 ~ 현재",
  "- Python/FastAPI 기반 REST API 설계 및 구현",
  "- PostgreSQL 쿼리 최적화로 조회 속도 40% 개선",
  "- AWS EC2/S3 인프라 운영 및 배포 자동화",
  "",
  "(주)스타트업A | 웹 개발자 | 2019.07 ~ 2021.02",
  "- React + Node.js 기반 서비스 개발",
  "- SQL 기반 데이터 분석 및 보고서 작성",
  "",
  "기술 스택",
  "- 언어: Python, JavaScript, TypeScript",
  "- DB: PostgreSQL, MySQL, Redis",
  "- 인프라: AWS, Docker",
  "",
  "학력",
  "한국대학교 컴퓨터공학과 | 2015.03 ~ 2019.02",
];

const JD_LINES = [
  "[채용공고] 백엔드 엔지니어 (Python)",
  "",
  "회사: (주)테크플랫폼",
  "직무: 백엔드 엔지니어",
  "",
  "주요 업무",
  "- Python 기반 API 서버 개발 및 운영",
  "- 대용량 데이터 처리 파이프라인 설계",
  "- 서비스 성능 모니터링 및 장애 대응",
  "",
  "자격 요건",
  "- Python 실무 경력 3년 이상",
  "- REST API 설계 및 구현 경험",
  "- RDB (PostgreSQL 또는 MySQL) 운영 경험",
  "- Excel 및 SQL 데이터 분석 능력",
  "",
  "우대 사항",
  "- AWS 또는 GCP 클라우드 운영 경험",
  "- FastAPI, Django 프레임워크 사용 경험",
  "",
  "근무 조건",
  "- 고용 형태: 정규직",
  "- 근무지: 서울 강남구 (주 3일 재택 가능)",
];

// ═══════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  console.log("Generating extract fixtures...\n");

  const fixtures = [
    { name: "resume_sample_01.docx", data: buildDocx(RESUME_LINES) },
    { name: "jd_sample_01.docx",     data: buildDocx(JD_LINES) },
    { name: "resume_sample_01.pdf",  data: buildPdf(RESUME_LINES) },
    { name: "jd_sample_01.pdf",      data: buildPdf(JD_LINES) },
  ];

  for (const { name, data } of fixtures) {
    const dest = path.join(FIXTURE_DIR, name);
    await fs.writeFile(dest, data);
    console.log(`  ✓ ${name}  (${data.length} bytes)`);
  }

  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
