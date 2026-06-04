import assert from "node:assert/strict";
import {
  classifyOwnershipSeniority,
  suggestOwnershipEvidenceImprovements,
} from "../src/lib/career-core/index.js";
import { ownershipSeniorityCases } from "../src/lib/career-core/__fixtures__/ownershipSeniorityCases.js";

function findCase(id) {
  const item = ownershipSeniorityCases.find((candidate) => candidate.id === id);
  assert.ok(item, `${id} fixture exists`);
  return item;
}

{
  const item = findCase("ownership_06_ambiguous_excel_only");
  const suggestion = suggestOwnershipEvidenceImprovements(item.resumeInput);

  assert.equal(suggestion.roleFamily, "unknown_admin_support", "ambiguous roleFamily");
  assert.equal(suggestion.evidenceLevel, "inferred_weak", "ambiguous evidenceLevel");
  assert.equal(suggestion.confidence, "low", "ambiguous confidence");
  assert.equal(suggestion.appliedToResume, false, "ambiguous appliedToResume");
  assert.equal(suggestion.appliedToCareerProfile, false, "ambiguous appliedToCareerProfile");
  assert.ok(suggestion.currentReading.includes("판단하기 어렵습니다"), "ambiguous current reading");
  assert.ok(suggestion.missingEvidence.some((item) => item.includes("목적")), "ambiguous missing purpose");
  assert.ok(suggestion.clarificationQuestions.some((item) => item.includes("정해진 양식")), "ambiguous clarification question");
  assert.ok(suggestion.rewriteFocus.some((item) => item.includes("목적")), "ambiguous rewrite focus");
  assert.ok(suggestion.shouldNotClaim.includes("accounting_finance"), "ambiguous should not claim accounting");
  assert.ok(suggestion.shouldNotClaim.includes("senior_ownership"), "ambiguous should not claim senior ownership");
}

{
  const item = findCase("ownership_01_accounting_admin_excel_entry");
  const suggestion = suggestOwnershipEvidenceImprovements(item.resumeInput);

  assert.equal(suggestion.roleFamily, "accounting_admin", "accounting admin roleFamily");
  assert.equal(suggestion.ownershipLevel, "support", "accounting admin ownershipLevel");
  assert.ok(suggestion.currentReading.includes("보조"), "accounting admin current reading");
  assert.ok(suggestion.missingEvidence.some((item) => item.includes("계정 대사")), "accounting admin missing reconciliation");
  assert.ok(suggestion.clarificationQuestions.some((item) => item.includes("입력만")), "accounting admin clarification");
  assert.ok(suggestion.shouldNotClaim.includes("senior_accounting_judgment"), "accounting admin should not claim senior accounting");
}

{
  const item = findCase("ownership_02_senior_accountant_excel_close_pack");
  const classification = classifyOwnershipSeniority(item.resumeInput);
  const suggestion = suggestOwnershipEvidenceImprovements({ classification });

  assert.equal(suggestion.roleFamily, "accounting_finance", "senior accountant roleFamily");
  assert.equal(suggestion.ownershipLevel, "lead", "senior accountant ownershipLevel");
  assert.equal(suggestion.judgmentLevel, "high", "senior accountant judgmentLevel");
  assert.ok(suggestion.currentReading.includes("주도"), "senior accountant current reading");
  assert.ok(suggestion.missingEvidence.some((item) => item.includes("담당 계정")), "senior accountant missing account scope");
  assert.ok(suggestion.rewriteFocus.some((item) => item.includes("계정 대사")), "senior accountant rewrite focus");
  assert.ok(suggestion.shouldNotClaim.includes("simple_admin_support"), "senior accountant should not claim simple admin");
}

{
  const item = findCase("ownership_05_product_ops_excel_funnel_report");
  const suggestion = suggestOwnershipEvidenceImprovements(item.resumeInput);

  assert.equal(suggestion.roleFamily, "product_operations", "product ops roleFamily");
  assert.equal(suggestion.ownershipLevel, "recommend_and_follow_up", "product ops ownershipLevel");
  assert.ok(suggestion.missingEvidence.some((item) => item.includes("퍼널")), "product ops missing funnel evidence");
  assert.ok(suggestion.clarificationQuestions.some((item) => item.includes("개선안")), "product ops clarification question");
  assert.ok(suggestion.rewriteFocus.some((item) => item.includes("문제 발견")), "product ops rewrite focus");
  assert.ok(suggestion.shouldNotClaim.includes("data_scientist"), "product ops should not claim data scientist");
}

console.log("PASS career-core ownership evidence improvement deterministic checks");
