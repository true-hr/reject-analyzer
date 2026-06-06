import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildResumeImportMetadata } from "../src/lib/resume/buildResumeImportMetadata.js";
import { buildSaraminImportMetadataNoticeModel } from "../src/lib/resume/buildSaraminImportMetadataNoticeModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fixturePath = path.join(root, "tests", "fixtures", "extract", "saramin_text_resume_anonymized.txt");
const saraminText = fs.readFileSync(fixturePath, "utf8");

const emptyModel = buildSaraminImportMetadataNoticeModel({ ok: true });
assert.equal(emptyModel, null, "notice model should be hidden when metadata is absent");

const resumeImportMetadata = buildResumeImportMetadata(saraminText, { kind: "resume" });
const model = buildSaraminImportMetadataNoticeModel({ ok: true, resumeImportMetadata });

assert.ok(model, "notice model should be visible for saramin metadata");
assert.equal(model.title, "사람인 이력서 형식으로 감지되었습니다.");
assert.equal(model.description, "가져온 항목은 아직 검수 전 후보입니다.");
assert.equal(model.platformLabel, "사람인");
assert.equal(model.sourceDocumentRole, "resume_plus_cover_letter");
assert.equal(model.sourceDocumentRoleLabel, "이력서 + 자기소개서");
assert.equal(model.textExtractable, true);
assert.equal(model.ocrRequired, false);
assert.equal(model.reviewRequired, true);
assert.ok(model.sectionCount >= 5, "detected section count should be surfaced");
assert.ok(model.sectionLabels.includes("경력"), "experience section label should be surfaced");
assert.ok(model.sectionLabels.includes("자기소개서"), "cover letter section label should be surfaced");
assert.equal(model.hasCoverLetterSeparation, true, "resume_plus_cover_letter should surface separation guidance");
assert.equal(model.hasResumeProfileCandidate, true, "resume candidate presence should be surfaced");
assert.equal(model.hasEvidenceBankCandidate, true, "evidence candidate presence should be surfaced");

const allLabels = [
  model.title,
  model.description,
  model.sourceDocumentRoleLabel,
  ...model.sectionLabels,
  ...model.warningLabels,
  ...model.actionLabels,
].join(" ");

for (const forbidden of ["이력서에 저장", "확정 반영", "내보내기", "Career Intelligence", "바로 제출 가능", "이력서가 생성되었습니다"]) {
  assert.ok(!allLabels.includes(forbidden), `forbidden CTA/copy should not appear: ${forbidden}`);
}

assert.ok(model.actionLabels.includes("검수 필요"), "weak review CTA should appear");
assert.ok(model.actionLabels.includes("후보 확인"), "weak candidate CTA should appear");

console.log("PASS saramin import review UI notice deterministic checks");
