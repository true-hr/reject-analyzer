// Pure function. No API calls. No Supabase. No React. No DOM.

const SIGNAL_RULES = [
  {
    signalType: "problem_solving",
    label: "문제 해결",
    keywords: ["문제", "오류", "버그", "장애", "이슈", "해결", "대응", "수정", "재현"],
    suggestedResumeAngle: "반복 이슈를 파악하고 해결 흐름을 정리한 경험",
  },
  {
    signalType: "documentation",
    label: "문서화",
    keywords: ["문서", "정리", "가이드", "보고서", "제안서", "자료", "작성", "FAQ", "기준"],
    suggestedResumeAngle: "업무 기준을 문서화해 재사용 가능한 형태로 정리한 경험",
  },
  {
    signalType: "collaboration",
    label: "협업 조율",
    keywords: ["협업", "조율", "미팅", "공유", "개발팀", "디자인팀", "파트너", "담당자", "부서", "유관"],
    suggestedResumeAngle: "관련 이해관계자와 논의 범위와 후속 액션을 조율한 경험",
  },
  {
    signalType: "operation",
    label: "운영 개선",
    keywords: ["운영", "관리", "일정", "점검", "모니터링", "누락", "프로세스", "흐름", "파이프라인"],
    suggestedResumeAngle: "운영 흐름을 점검하고 누락이나 반복 업무를 줄이려 한 경험",
  },
  {
    signalType: "analysis",
    label: "분석",
    keywords: ["분석", "데이터", "지표", "리포트", "인사이트", "전환율", "성과"],
    suggestedResumeAngle: "자료와 지표를 바탕으로 판단 근거를 정리한 경험",
  },
  {
    signalType: "customer",
    label: "고객 대응",
    keywords: ["고객", "사용자", "문의", "응대", "클레임", "CS"],
    suggestedResumeAngle: "고객/사용자 문의를 분류하고 대응 기준을 정리한 경험",
  },
  {
    signalType: "planning",
    label: "기획",
    keywords: ["리드", "주도", "총괄", "우선순위", "방향", "로드맵", "전략", "계획"],
    suggestedResumeAngle: "방향성과 우선순위를 정리해 실행 계획을 구체화한 경험",
  },
  {
    signalType: "execution",
    label: "실행",
    keywords: ["구현", "개발", "제작", "추가", "연동", "배포", "진행", "처리"],
    suggestedResumeAngle: "계획된 작업을 실행하고 완료한 경험",
  },
  {
    signalType: "quality",
    label: "품질 검증",
    keywords: ["검수", "QA", "테스트", "품질", "검증", "결함"],
    suggestedResumeAngle: "기능이나 산출물의 품질을 점검하고 기준에 맞게 확인한 경험",
  },
  {
    signalType: "research",
    label: "리서치",
    keywords: ["조사", "리서치", "경쟁사", "시장", "벤치마킹", "발굴"],
    suggestedResumeAngle: "시장이나 상황을 조사해 판단 근거나 기회를 정리한 경험",
  },
  {
    signalType: "sales_negotiation",
    label: "조건 협의",
    keywords: ["계약", "견적", "협상", "조건", "비용", "파트너십"],
    suggestedResumeAngle: "외부 조건을 검토하고 협의 범위를 정리한 경험",
  },
];

function _safeStr(v) {
  return String(v ?? "").trim();
}

function _safeArr(v) {
  return Array.isArray(v) ? v.map(_safeStr).filter(Boolean) : [];
}

function _safeRawPayload(v) {
  if (v && typeof v === "object" && !Array.isArray(v)) return v;
  if (typeof v === "string") { try { return JSON.parse(v); } catch { return {}; } }
  return {};
}

function _extractSources(recordOrCandidate) {
  if (!recordOrCandidate || typeof recordOrCandidate !== "object") {
    return { textContent: "", tags: [] };
  }

  // Candidate shape: has workRecordDraft (from buildResumeUpdateCandidateFromRecord)
  if (recordOrCandidate.workRecordDraft) {
    const draft = recordOrCandidate.workRecordDraft;
    return {
      textContent: [
        recordOrCandidate.sourceText,
        draft.text,
        draft.projectActions,
        draft.projectResult,
        draft.projectGoal,
        draft.projectContext,
      ].map(_safeStr).filter(Boolean).join(" "),
      tags: _safeArr([
        ..._safeArr(draft.roleTags),
        ..._safeArr(draft.resultTags),
        ..._safeArr(draft.collaborationTags),
      ]),
    };
  }

  // Raw Supabase row shape
  const raw = _safeRawPayload(recordOrCandidate.raw_payload);
  return {
    textContent: [
      raw.text,
      raw.projectActions,
      raw.projectResult,
      raw.projectGoal,
      raw.projectContext,
      recordOrCandidate.description,
      recordOrCandidate.result,
      recordOrCandidate.title,
    ].map(_safeStr).filter(Boolean).join(" "),
    tags: _safeArr([
      ..._safeArr(raw.roleTags),
      ..._safeArr(raw.resultTags),
      ..._safeArr(raw.collaborationTags),
      ..._safeArr(recordOrCandidate.strength_tags),
      ..._safeArr(recordOrCandidate.skill_tags),
    ]),
  };
}

function _matchesText(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function _matchesTags(tags, keywords) {
  const joined = tags.join(" ").toLowerCase();
  return keywords.some((kw) => joined.includes(kw.toLowerCase()));
}

function _extractEvidencePhrase(text, keywords) {
  if (!text) return "";
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    const idx = lower.indexOf(kw.toLowerCase());
    if (idx === -1) continue;
    const start = Math.max(0, idx - 8);
    const end = Math.min(text.length, idx + kw.length + 28);
    const phrase = text.slice(start, end).trim();
    return phrase.length > 60 ? phrase.slice(0, 60).trim() + "…" : phrase;
  }
  // fallback: truncate text
  const trimmed = text.trim();
  return trimmed.length > 60 ? trimmed.slice(0, 60).trim() + "…" : trimmed;
}

/**
 * Deterministic experience signal extraction from a stored work record or candidate.
 * No AI call. Safe for synchronous use.
 *
 * @param {object} recordOrCandidate - Supabase work_records row or ResumeUpdateCandidate
 * @returns {Array<{signalType, label, evidenceText, suggestedResumeAngle, confidence, source, userDecision}>}
 */
export function buildExperienceSignalsFromRecord(recordOrCandidate) {
  const { textContent, tags } = _extractSources(recordOrCandidate);
  if (!textContent && tags.length === 0) return [];

  const results = [];
  const seenTypes = new Set();

  for (const rule of SIGNAL_RULES) {
    if (results.length >= 4) break;
    if (seenTypes.has(rule.signalType)) continue;

    const textMatch = textContent ? _matchesText(textContent, rule.keywords) : false;
    const tagMatch = tags.length > 0 ? _matchesTags(tags, rule.keywords) : false;

    if (!textMatch && !tagMatch) continue;

    const evidenceText = _extractEvidencePhrase(textContent, rule.keywords);
    if (!evidenceText) continue;

    const confidence = (textMatch && tagMatch) ? "high" : "medium";

    results.push({
      signalType: rule.signalType,
      label: rule.label,
      evidenceText,
      suggestedResumeAngle: rule.suggestedResumeAngle,
      confidence,
      source: "deterministic",
      userDecision: "pending",
    });
    seenTypes.add(rule.signalType);
  }

  return results;
}
