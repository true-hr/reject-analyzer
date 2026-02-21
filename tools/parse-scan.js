const fs = require("fs");
const path = require("path");

let acorn, jsx;
try {
  acorn = require("acorn");
  jsx = require("acorn-jsx");
} catch (e) {
  console.error("[ERR] acorn/acorn-jsx not found. Run: npm i -D acorn acorn-jsx");
  process.exit(1);
}

const Parser = acorn.Parser.extend(jsx());

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(ent.name) && !p.includes("node_modules") && !p.includes(`${path.sep}dist${path.sep}`)) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(path.resolve("src"));
const bad = [];

for (const f of files) {
  const code = fs.readFileSync(f, "utf8");
  try {
    Parser.parse(code, { ecmaVersion: "latest", sourceType: "module" });
  } catch (e) {
    const loc = e && e.loc ? e.loc : { line: null, column: null };
    bad.push({ file: f, line: loc.line, col: loc.column, msg: e.message });
  }
}

bad.sort((a, b) => a.file.localeCompare(b.file));

console.log("PARSE_FAIL_COUNT=", bad.length);
for (const b of bad) {
  console.log(b.file + ":" + b.line + ":" + b.col + " :: " + b.msg);
}