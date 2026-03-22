// src/components/ComparisonSummary.jsx
// 채용 공고 vs 내 이력서 비교 블록
// - 엔진/analyzer/simVM/bridge 무수정 전제
// - 표시값은 parsedJD / parsedResume / state / analysis 에서만 읽음
// - 새로운 점수 계산 없음, 기존 엔진 결과 해석 문구만 이용

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function safeStr(v) {
  const s = String(v ?? "").trim();
  if (!s || s.toLowerCase() === "unknown" || s === "null" || s === "undefined") return "";
  return s;
}

function pickFirst(...vals) {
  for (const v of vals) {
    const s = safeStr(v);
    if (s) return s;
  }
  return "";
}

function isSimilar(a, b) {
  if (!a || !b) return false;
  const na = a.toLowerCase().replace(/\s+/g, "");
  const nb = b.toLowerCase().replace(/\s+/g, "");
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const tokensA = a.toLowerCase().split(/[\s,\/·]+/).filter((t) => t.length >= 2);
  const tokensB = b.toLowerCase().split(/[\s,\/·]+/).filter((t) => t.length >= 2);
  return tokensA.some((t) => tokensB.includes(t));
}

function getVM(analysis) {
  return (
    analysis?.reportPack?.simulationViewModel ||
    analysis?.reportPack?.simVM ||
    analysis?.simulationViewModel ||
    analysis?.simVM ||
    null
  );
}

function getRoleFitLabel(analysis) {
  try {
    const vm = getVM(analysis);
    const fit =
      typeof vm?.interpretation?.signals?.fit === "number"
        ? vm.interpretation.signals.fit
        : null;
    if (fit === null) return null;
    if (fit >= 0.75) return "높음";
    if (fit >= 0.55) return "보통";
    return "낮음";
  } catch {
    return null;
  }
}

function getJDMatchLabel(analysis) {
  try {
    const vm = getVM(analysis);
    const score =
      typeof vm?.score === "number"
        ? vm.score
        : typeof vm?.fitScore === "number"
          ? vm.fitScore
          : null;
    if (score === null) return null;
    if (score >= 75) return "높음";
    if (score >= 55) return "보통";
    return "낮음";
  } catch {
    return null;
  }
}

function buildResumeText(parsedResume) {
  if (!parsedResume || typeof parsedResume !== "object") return "";
  const parts = [];
  if (parsedResume.summary) parts.push(parsedResume.summary);
  if (Array.isArray(parsedResume.timeline)) {
    for (const t of parsedResume.timeline) {
      if (t?.role) parts.push(t.role);
      if (t?.company) parts.push(t.company);
      if (t?.description) parts.push(t.description);
    }
  }
  if (Array.isArray(parsedResume.skills)) parts.push(...parsedResume.skills);
  if (Array.isArray(parsedResume.achievements)) parts.push(...parsedResume.achievements);
  if (Array.isArray(parsedResume.projects)) {
    for (const p of parsedResume.projects) {
      if (typeof p === "string") parts.push(p);
      else if (p?.name) parts.push(p.name);
      else if (p?.description) parts.push(p.description);
    }
  }
  return parts.join(" ").toLowerCase();
}

function checkKeywordInResume(item, resumeText) {
  const s = safeStr(item);
  if (!s) return false;
  if (resumeText.includes(s.toLowerCase())) return true;
  const tokens = s.split(/[\s,·\/]+/).filter((t) => t.length >= 2 && !/^\d+$/.test(t));
  return tokens.some((t) => resumeText.includes(t.toLowerCase()));
}

const LABEL_COLOR = {
  높음: "text-emerald-600",
  보통: "text-amber-600",
  낮음: "text-rose-600",
};

function CompRow({ label, jdVal, resumeVal, note }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)] gap-x-3 py-3 border-b border-border/50 last:border-0 items-start">
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pt-0.5 leading-tight">
        {label}
      </div>
      <div className="text-sm font-medium text-foreground leading-snug break-words">
        {jdVal || "-"}
      </div>
      <div className="text-sm font-medium text-foreground leading-snug break-words">
        {resumeVal || "-"}
      </div>
      <div className="text-[11px] text-muted-foreground leading-relaxed">
        {note || "-"}
      </div>
    </div>
  );
}

function StatusRow({ label, statusText, note }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,120px)_minmax(0,1fr)] gap-x-3 py-3 border-b border-border/50 last:border-0 items-start">
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pt-0.5 leading-tight">
        {label}
      </div>
      <div className="text-sm font-medium text-foreground leading-snug break-words">
        {statusText || "-"}
      </div>
      <div className="text-[11px] text-muted-foreground leading-relaxed">
        {note || "-"}
      </div>
    </div>
  );
}

function EvaluationRow({ label, value, note }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,120px)_minmax(0,1fr)] gap-x-3 py-3 border-b border-border/50 last:border-0 items-start">
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pt-0.5 leading-tight">
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground leading-snug break-words">
        {value || "-"}
      </div>
      <div className="text-[11px] text-muted-foreground leading-relaxed">
        {note || "-"}
      </div>
    </div>
  );
}

export default function ComparisonSummary({ parsedJD, parsedResume, state, analysis }) {
  const pJD = parsedJD && typeof parsedJD === "object" ? parsedJD : {};
  const pRes = parsedResume && typeof parsedResume === "object" ? parsedResume : {};
  const s = state && typeof state === "object" ? state : {};

  const jdRole = pickFirst(pJD.jobTitle, s.targetRole);
  const resumeRole = pickFirst(
    s.currentRole,
    s.roleCurrent,
    Array.isArray(pRes.timeline) && pRes.timeline[0]?.role ? pRes.timeline[0].role : ""
  );
  const roleNote =
    jdRole && resumeRole
      ? isSimilar(jdRole, resumeRole)
        ? "직무 방향은 전반적으로 잘 맞습니다."
        : "직무 방향은 일부 차이가 있습니다."
      : "정보가 충분하지 않아 비교가 어렵습니다.";

  const jdIndustry = pickFirst(
    s.targetIndustry,
    s.industryTarget,
    Array.isArray(pJD.domainKeywords) && pJD.domainKeywords.length > 0
      ? pJD.domainKeywords[0]
      : ""
  );
  const resumeIndustry = pickFirst(s.currentIndustry, s.industryCurrent);
  const industryNote =
    jdIndustry && resumeIndustry
      ? isSimilar(jdIndustry, resumeIndustry)
        ? "산업 배경은 대체로 일치합니다."
        : "산업 배경은 다소 차이가 있습니다."
      : "정보가 충분하지 않아 비교가 어렵습니다.";

  const roleFitLabel = getRoleFitLabel(analysis);
  const roleFitNote =
    {
      높음: "직무 경험의 방향은 채용 포지션과 전반적으로 잘 맞습니다.",
      보통: "직무 방향은 가깝지만 일부 경험은 차이가 있을 수 있습니다.",
      낮음: "직무 경험 방향과 채용 포지션 간 차이가 있을 수 있습니다.",
    }[roleFitLabel] || "분석 데이터가 없어 확인이 어렵습니다.";

  const jdMatchLabel = getJDMatchLabel(analysis);
  const jdMatchNote =
    {
      높음: "채용공고 요구사항과 이력서 경험은 전반적으로 잘 연결됩니다.",
      보통: "전체 방향은 맞지만 일부 요구사항은 이력서에서 약하게 보일 수 있습니다.",
      낮음: "채용공고 요구사항과 현재 이력서 내용 사이에 차이가 있을 수 있습니다.",
    }[jdMatchLabel] || "분석 데이터가 없어 확인이 어렵습니다.";

  const mustHaveRaw = Array.isArray(pJD.mustHave) ? pJD.mustHave.slice(0, 3) : [];
  const resumeText = buildResumeText(pRes);
  const mustHaveChecks = mustHaveRaw
    .map((item) => {
      const keyword = safeStr(item);
      if (!keyword) return null;
      return { keyword, found: checkKeywordInResume(keyword, resumeText) };
    })
    .filter(Boolean);

  const mustHaveJD =
    mustHaveChecks.length > 0
      ? mustHaveChecks.map((c) => c.keyword).join(" / ")
      : "";
  const mustHaveResume =
    mustHaveChecks.length > 0
      ? mustHaveChecks
          .map((c) => (c.found ? `${c.keyword} 있음` : `${c.keyword} 확인 어려움`))
          .join(" / ")
      : "";
  const mustHaveNote =
    mustHaveChecks.length > 0
      ? "핵심 요구사항 중 일부는 이력서에서 직접 확인하기 어렵습니다."
      : "핵심 요구사항 정보를 확인할 수 없습니다.";

  const compareRows = [
    { type: "compare", label: "직무", jdVal: jdRole, resumeVal: resumeRole, note: roleNote },
    { type: "compare", label: "산업", jdVal: jdIndustry, resumeVal: resumeIndustry, note: industryNote },
  ];

  if (mustHaveJD || mustHaveResume) {
    compareRows.push({
      type: "compare",
      label: "핵심 요건",
      jdVal: mustHaveJD,
      resumeVal: mustHaveResume,
      note: mustHaveNote,
    });
  }

  const statusRows =
    mustHaveJD || mustHaveResume
      ? []
      : [
          {
            type: "status",
            label: "핵심 요건",
            statusText: "비교 불가",
            note: mustHaveNote,
          },
        ];

  const evaluationRows = [
    {
      type: "evaluation",
      label: "직무 매칭도",
      value: roleFitLabel ? <span className={LABEL_COLOR[roleFitLabel]}>{roleFitLabel}</span> : null,
      note: roleFitNote,
    },
    {
      type: "evaluation",
      label: "JD 매칭도",
      value: jdMatchLabel ? <span className={LABEL_COLOR[jdMatchLabel]}>{jdMatchLabel}</span> : null,
      note: jdMatchNote,
    },
  ];

  return (
    <Card className="rounded-2xl border bg-background/70 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">채용 공고 vs 내 이력서 비교</CardTitle>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          공고 기준과 이력서 내용을 항목별로 비교한 결과입니다.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-5">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              비교 항목
            </div>
            <div className="grid grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)] gap-x-3 border-b border-border pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <div>항목</div>
              <div>공고 기준</div>
              <div>내 이력서</div>
              <div>해석</div>
            </div>
            <div>
              {compareRows.map((row) => (
                <CompRow
                  key={row.label}
                  label={row.label}
                  jdVal={row.jdVal}
                  resumeVal={row.resumeVal}
                  note={row.note}
                />
              ))}
              {statusRows.map((row) => (
                <StatusRow
                  key={row.label}
                  label={row.label}
                  statusText={row.statusText}
                  note={row.note}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              종합 판정
            </div>
            <div className="rounded-xl border border-border/60 bg-background/40 px-4">
              {evaluationRows.map((row) => (
                <EvaluationRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  note={row.note}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
