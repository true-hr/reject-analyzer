import React, { useMemo, useState } from "react";
import { buildCareerProfileFromResumeProfile } from "../../lib/career-core/index.js";
import { applyTargetResumeVersion } from "../../lib/resume/applyTargetResumeVersion.js";
import { buildCareerCoreTargetFromJdFit } from "../../lib/resume/buildCareerCoreTargetFromJdFit.js";
import { buildResumeJdFit } from "../../lib/resume/buildResumeJdFit.js";
import { buildTargetResumeVersion } from "../../lib/resume/buildTargetResumeVersion.js";
import { sampleJdText, sampleTargetCompany, sampleTargetRole } from "../../lib/resume/sampleJdTailoring.js";

function BulletList({ title, items }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-sm font-semibold text-slate-950">{title}</div>
      <div className="mt-2 space-y-2">
        {list.length ? list.slice(0, 5).map((item) => (
          <div key={item.bulletId || item.keyword} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {"text" in item ? item.text : item.message}
            {"score" in item ? <div className="mt-1 text-xs text-slate-500">score {item.score} · {item.matchedKeywords.join(", ") || "no keyword"}</div> : null}
          </div>
        )) : <div className="text-sm text-slate-400">아직 항목이 없습니다.</div>}
      </div>
    </div>
  );
}

function CareerCoreFitSummary({ target, fit }) {
  const summary = fit?.summary;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-950">Career Core v0 추정</div>
          <div className="mt-1 text-xs text-slate-500">직무/산업 신호 기준의 참고용 분류입니다.</div>
        </div>
        <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {summary?.primaryFitLevel || "판정 불가"}
        </div>
      </div>

      {target && summary ? (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            <div><div className="text-xs text-slate-500">직접 유관</div><div className="font-semibold text-slate-950">{summary.directlyRelevantMonths}</div></div>
            <div><div className="text-xs text-slate-500">인접</div><div className="font-semibold text-slate-950">{summary.adjacentRelevantMonths}</div></div>
            <div><div className="text-xs text-slate-500">전환 가능</div><div className="font-semibold text-slate-950">{summary.transferableMonths}</div></div>
            <div><div className="text-xs text-slate-500">비유관</div><div className="font-semibold text-slate-950">{summary.unrelatedMonths}</div></div>
            <div><div className="text-xs text-slate-500">판단 보류</div><div className="font-semibold text-slate-950">{summary.unknownMonths}</div></div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            target: {target.roleFamily || "unknown"} / {target.industryDomain || "unknown"}
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
          JD에서 Career Core target을 보수적으로 추정할 수 없어 참고 분류를 생략했습니다.
        </div>
      )}
    </div>
  );
}

export default function ResumeJdTailoringPanel({ profile }) {
  const [jdText, setJdText] = useState(sampleJdText);
  const fit = useMemo(() => profile ? buildResumeJdFit({ profile, jdText }) : null, [profile, jdText]);
  const careerCoreTarget = useMemo(() => fit ? buildCareerCoreTargetFromJdFit({
    fit,
    jdText,
  }) : null, [fit, jdText]);
  const careerCoreFit = useMemo(() => {
    if (!profile || !careerCoreTarget) return null;
    return buildCareerProfileFromResumeProfile(profile, { target: careerCoreTarget }).fit;
  }, [profile, careerCoreTarget]);
  const targetVersion = useMemo(() => fit ? buildTargetResumeVersion({
    fit,
    targetRole: sampleTargetRole,
    targetCompany: sampleTargetCompany,
  }) : null, [fit]);
  const exportView = useMemo(() => profile && targetVersion ? applyTargetResumeVersion(profile, targetVersion) : null, [profile, targetVersion]);
  const promoted = fit?.bulletMatches?.filter((item) => item.recommendation === "promote") || [];
  const deprioritized = fit?.bulletMatches?.filter((item) => item.recommendation === "deprioritize") || [];

  if (!profile) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
        <h2 className="text-base font-semibold text-slate-950">JD 맞춤 이력서</h2>
        <p className="mt-2 text-sm text-slate-500">분석할 이력서 데이터가 아직 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <header>
        <h2 className="text-xl font-semibold text-slate-950">JD 맞춤 이력서</h2>
        <p className="mt-1 text-sm text-slate-500">지원 공고에 맞춰 강조할 경험과 부족한 요건을 확인하세요.</p>
      </header>

      <textarea
        value={jdText}
        onChange={(event) => setJdText(event.target.value)}
        className="min-h-44 w-full rounded-lg border border-slate-300 p-3 text-sm leading-6 text-slate-800"
        placeholder="JD 텍스트를 붙여넣으세요."
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Fit score</div>
          <div className="mt-1 text-2xl font-semibold text-slate-950">{fit?.summary?.fitScore || 0}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Must-have match</div>
          <div className="mt-1 text-2xl font-semibold text-slate-950">{fit?.summary?.matchedMustHaveCount || 0}/{fit?.summary?.totalMustHaveCount || 0}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Promoted</div>
          <div className="mt-1 text-2xl font-semibold text-slate-950">{promoted.length}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Gap</div>
          <div className="mt-1 text-2xl font-semibold text-slate-950">{fit?.summary?.gapCount || 0}</div>
        </div>
      </div>

      <CareerCoreFitSummary target={careerCoreTarget} fit={careerCoreFit} />

      <div className="grid gap-3 lg:grid-cols-3">
        <BulletList title="강조 후보" items={promoted} />
        <BulletList title="우선순위 낮춤" items={deprioritized} />
        <BulletList title="Must-have gap" items={fit?.gaps || []} />
      </div>

      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        <div className="font-semibold text-slate-950">Target version summary</div>
        <div className="mt-1">selected {targetVersion?.selectedBulletIds?.length || 0} · promoted {targetVersion?.promotedBulletIds?.length || 0} · hidden {targetVersion?.hiddenBulletIds?.length || 0}</div>
        <div className="mt-1">export view experiences: {exportView?.experiences?.length || 0}</div>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        이 결과는 deterministic preview이며, 실제 AI 맞춤 재작성은 다음 단계에서 연결됩니다.
      </div>
    </section>
  );
}
