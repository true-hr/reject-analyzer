import assert from "node:assert/strict";
import fs from "node:fs";
import { buildCareerProfileFromWorkRecords } from "../src/lib/career-core/index.js";

const source = fs.readFileSync("src/components/experience/AiExperienceInboxPanel.jsx", "utf8");

function toStringArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  const text = String(value || "").trim();
  return text ? [text] : [];
}

function buildWorkRecordLikeFromInboxItem(item) {
  return {
    id: item?.workRecordId || item?.id || "ai-inbox-item",
    title: item?.title,
    description: item?.situation || item?.summary,
    task: item?.task,
    result: item?.suggestedResumeBullet || item?.resultCandidate,
    record_date: item?.recordDate || null,
    strength_tags: toStringArray(item?.skills),
    skill_tags: toStringArray(item?.jobTags || item?.job_tags),
    raw_payload: {
      summary: item?.summary,
      sourceMode: item?.isPassmapAiConversation ? "ai_conversation" : "ai_inbox",
      sourceLabel: item?.sourceLabel,
      acceptedCandidates: [
        {
          title: item?.title,
          situation: item?.situation,
          task: item?.task,
          actions: toStringArray(item?.actions),
          result: toStringArray(item?.result),
          resultCandidate: item?.resultCandidate,
          skills: toStringArray(item?.skills),
          jobTags: toStringArray(item?.jobTags || item?.job_tags),
          industryTags: toStringArray(item?.industryTags || item?.industry_tags),
          suggestedResumeBullet: item?.suggestedResumeBullet,
          evidenceTexts: toStringArray(item?.evidenceTexts),
          riskNotes: toStringArray(item?.riskNotes),
          missingInfoQuestions: toStringArray(item?.missingInfoQuestions),
          confidenceLevel: item?.confidenceLevel,
          resumePotential: item?.resumePotential,
        },
      ],
    },
  };
}

function hasCareerCoreInput(item) {
  if (!item || typeof item !== "object") return false;
  return [
    item.title,
    item.summary,
    item.situation,
    item.task,
    item.suggestedResumeBullet,
    item.resultCandidate,
    item.skills,
    item.jobTags,
    item.industryTags,
    item.evidenceTexts,
  ].some((value) => toStringArray(value).length > 0);
}

function signalCount(profile) {
  return [
    profile?.signals?.roleFamilies,
    profile?.signals?.industryDomains,
    profile?.signals?.strengthSignals,
  ].reduce((sum, signals) => sum + (Array.isArray(signals) ? signals.length : 0), 0);
}

function blockSource() {
  const start = source.indexOf("function CareerCoreSignalBlock");
  const end = source.indexOf("function InboxCard", start);
  assert.ok(start > 0, "CareerCoreSignalBlock should exist");
  assert.ok(end > start, "CareerCoreSignalBlock should appear before InboxCard");
  return source.slice(start, end);
}

const richItem = {
  id: "card-rich",
  title: "Product Manager roadmap for SaaS onboarding",
  situation: "AI Inbox candidate without raw source text",
  task: "Owned requirements and product roadmap",
  suggestedResumeBullet: "Improved SaaS onboarding with product roadmap and activation dashboard metrics.",
  skills: ["planning", "stakeholder coordination"],
  jobTags: ["product manager", "data analytics"],
  industryTags: ["B2B SaaS"],
  evidenceTexts: ["Owned requirements and product roadmap"],
  riskNotes: ["Needs confirmation before resume use"],
  recordDate: "2026-05-31",
};

const emptyItem = {
  id: "card-empty",
  sourcePlatform: "chatgpt",
};

const richProfile = buildCareerProfileFromWorkRecords([buildWorkRecordLikeFromInboxItem(richItem)]);
const uiBlock = blockSource();

assert.ok(source.includes("buildCareerProfileFromWorkRecords"), "UI should import/use Work Records adapter");
assert.ok(source.includes("buildAiInboxCareerCoreSignal"), "UI should build a read-only signal");
assert.ok(source.includes("hasCareerCoreInput"), "UI should gate empty items before adapter display");
assert.ok(source.includes("data-career-core-readonly-signal"), "UI should mark the read-only block");
assert.ok(source.includes("Career Core v0 참고 신호"), "UI title should be present");
assert.ok(source.includes("저장된 후보의 직무/산업/강점 단서를 바탕으로 만든 참고 신호입니다."), "reference copy should be present");
assert.ok(source.includes("경력 기간이나 적합도 확정 판단이 아닙니다."), "caution copy should be present");

assert.ok(signalCount(richProfile) > 0, "Synthetic rich item should produce Career Core signals");
assert.equal(hasCareerCoreInput(emptyItem), false, "Synthetic empty item should not pass UI display gate");
assert.equal(richProfile.summary.totalExperienceMonths, 0, "record_date should not inflate duration");

assert.doesNotMatch(uiBlock, /개월|monthBuckets|durationMonths|totalClassifiedMonths|directlyRelevantMonths/i);
assert.doesNotMatch(uiBlock, /정확한 유관 경력|합격 가능성|탈락 원인|최종 적격성|확실히 맞음|N개월 유관 경력/);

assert.ok(uiBlock.includes("flex flex-wrap"), "Signal pills should wrap");
assert.ok(uiBlock.includes("max-w-full"), "Signal pills should stay within card width");
assert.ok(uiBlock.includes("break-words"), "Long signal labels should wrap");
assert.ok(source.includes('onUpdateStatus?.(item, "archived")'), "Archive action should remain wired");
assert.ok(source.includes('onUpdateStatus?.(item, "converted")'), "Convert action should remain wired");

assert.doesNotMatch(source, /fetch\(|openai|chat\/completions|select\([^)]*raw_text/i);
assert.doesNotMatch(source, /raw_payload\.careerCoreSignal|careerCoreSignal.*metadata|updateWorkRecord|createWorkRecord/i);

console.log("PASS ai-inbox career-core read-only UI QA checks");
