// src/components/parse/ParsedFieldsPanel.jsx
import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function uniqList(arr) {
  const seen = new Set();
  const out = [];
  (Array.isArray(arr) ? arr : []).forEach((x) => {
    const t = String(x || "").trim();
    if (!t) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  });
  return out;
}

function FieldChips({ title, items, onChange }) {
  const [draft, setDraft] = useState("");

  const list = useMemo(() => uniqList(items), [items]);

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-[11px] text-slate-500">{list.length}개</div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {list.length ? (
          list.map((x, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer"
              onClick={() => {
                const next = list.filter((v) => v !== x);
                onChange(next);
              }}
              title="클릭하면 삭제"
            >
              {x} <span className="ml-1 text-slate-500">×</span>
            </Badge>
          ))
        ) : (
          <div className="text-xs text-slate-500">아직 없음</div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="추가할 항목 입력"
          className="h-9 rounded-xl"
        />
        <Button
          type="button"
          className="h-9 rounded-xl"
          onClick={() => {
            const t = String(draft || "").trim();
            if (!t) return;
            onChange([...list, t]);
            setDraft("");
          }}
        >
          + 추가
        </Button>
      </div>

      <div className="mt-2 text-[11px] text-slate-500">
        칩을 <span className="font-semibold">클릭</span>하면 삭제됩니다.
      </div>
    </div>
  );
}

export default function ParsedFieldsPanel({
  kind, // "jd" | "resume"
  parsed,
  onChange,
  className = "",
}) {
  const p = parsed || {};

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">
          {kind === "jd" ? "JD 핵심 필드(정정 가능)" : "이력서 핵심 필드(정정 가능)"}
        </div>
      </div>

      {kind === "jd" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FieldChips
            title="Must-have(필수)"
            items={p.mustHave}
            onChange={(v) => onChange({ ...p, mustHave: v })}
          />
          <FieldChips
            title="Preferred(우대)"
            items={p.preferred}
            onChange={(v) => onChange({ ...p, preferred: v })}
          />
          <FieldChips
            title="Core Tasks(주요업무)"
            items={p.coreTasks}
            onChange={(v) => onChange({ ...p, coreTasks: v })}
          />
          <FieldChips
            title="Tools/Stack(도구)"
            items={p.tools}
            onChange={(v) => onChange({ ...p, tools: v })}
          />
          <FieldChips
            title="Constraints(조건)"
            items={p.constraints}
            onChange={(v) => onChange({ ...p, constraints: v })}
          />
          <FieldChips
            title="Domain Keywords(도메인)"
            items={p.domainKeywords}
            onChange={(v) => onChange({ ...p, domainKeywords: v })}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FieldChips
            title="Skills(스킬/툴)"
            items={p.skills}
            onChange={(v) => onChange({ ...p, skills: v })}
          />
          <FieldChips
            title="Achievements(성과)"
            items={p.achievements}
            onChange={(v) => onChange({ ...p, achievements: v })}
          />
          <FieldChips
            title="Projects(프로젝트)"
            items={p.projects}
            onChange={(v) => onChange({ ...p, projects: v })}
          />
          <FieldChips
            title="Gaps(공백/리스크)"
            items={p.gaps}
            onChange={(v) => onChange({ ...p, gaps: v })}
          />
          <FieldChips
            title="Transition Narrative(전환 설득 문장)"
            items={p.transitionNarrative}
            onChange={(v) => onChange({ ...p, transitionNarrative: v })}
          />
        </div>
      )}
    </div>
  );
}