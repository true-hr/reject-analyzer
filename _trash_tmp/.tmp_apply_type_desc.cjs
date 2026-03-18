const fs = require('fs');
const path = 'src/lib/passmap/typeDescriptions.js';
let text = fs.readFileSync(path, 'utf8');
const data = JSON.parse(fs.readFileSync('.tmp_type_desc_data.json', 'utf8'));
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const str = (indent, value) => `${indent}"${esc(value)}",`;
const arr = (indent, values) => `${indent}[\r\n${values.map((v) => `${indent}  "${esc(v)}",`).join('\r\n')}\r\n${indent}],`;
function replaceOrThrow(block, pattern, replacement, label, id) {
  if (!pattern.test(block)) throw new Error(`${id} ${label}`);
  return block.replace(pattern, replacement);
}
for (const [id, entry] of Object.entries(data)) {
  const blockRe = new RegExp(`${id}: \\{[\\s\\S]*?\\n  \\},\\r?\\n\\r?\\n  PM\\d{2}:|${id}: \\{[\\s\\S]*?\\n  \\},\\r?\\n\\};`, 'm');
  const match = text.match(blockRe);
  if (!match) throw new Error(`block ${id}`);
  let block = match[0];
  let suffix = '';
  const m1 = block.match(/\r?\n\r?\n  PM\d{2}:$/);
  const m2 = block.match(/\r?\n\};$/);
  if (m1) { suffix = m1[0]; block = block.slice(0, -suffix.length); }
  else if (m2) { suffix = m2[0]; block = block.slice(0, -suffix.length); }

  block = replaceOrThrow(block, /(description:\s*)([\s\S]*?)(,\r?\n\s*interviewerView:)/, `$1\r\n      ${str('', entry.description)}$3`, 'description', id);
  block = replaceOrThrow(block, /(interviewerView:\s*)([\s\S]*?)(,\r?\n\s*expandedDescription:)/, `$1\r\n      ${str('', entry.interviewerView)}$3`, 'interviewerView', id);
  block = replaceOrThrow(block, /(heroSummary:\s*)([\s\S]*?)(,\r?\n\s*toneTags:)/, `$1\r\n        ${str('', entry.heroSummary)}$3`, 'heroSummary', id);
  block = replaceOrThrow(block, /(toneTags:\s*)(\[[\s\S]*?\])(,\r?\n\s*firstImpression:)/, `$1${arr('      ', entry.toneTags).slice(0,-1)}$3`, 'toneTags', id);
  block = replaceOrThrow(block, /(firstImpression:\s*)(\[[\s\S]*?\])(,\r?\n\s*whenItAppears:)/, `$1${arr('      ', entry.firstImpression).slice(0,-1)}$3`, 'firstImpression', id);
  block = replaceOrThrow(block, /(strengths:\s*)(\[[\s\S]*?\])(,\r?\n\s*hesitationPoints:)/, `$1${arr('      ', entry.strengths).slice(0,-1)}$3`, 'strengths', id);
  block = replaceOrThrow(block, /(hesitationPoints:\s*)(\[[\s\S]*?\])(,\r?\n\s*persuasionTips:)/, `$1${arr('      ', entry.hesitationPoints).slice(0,-1)}$3`, 'hesitationPoints', id);
  block = replaceOrThrow(block, /(persuasionTips:\s*)(\[[\s\S]*?\])(,\r?\n\s*closingLine:)/, `$1${arr('      ', entry.persuasionTips).slice(0,-1)}$3`, 'persuasionTips', id);
  block = replaceOrThrow(block, /(closingLine:\s*)([\s\S]*?)(,\r?\n\s*\},)/, `$1\r\n        ${str('', entry.closingLine)}$3`, 'closingLine', id);

  text = text.replace(match[0], block + suffix);
}
fs.writeFileSync(path, text, 'utf8');