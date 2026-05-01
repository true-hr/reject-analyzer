import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SectionCard({ title, children }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyNote({ text }) {
  return <p className="text-sm italic text-slate-400">{text}</p>;
}

function BulletList({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SignalPills({ items, tone = "slate" }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full border px-2.5 py-0.5 text-xs ${toneClass}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function TodayCards({ result }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="이번 주 기록 해석">
        <p className="text-sm leading-relaxed text-slate-700">{result.summary}</p>
      </SectionCard>

      <SectionCard title="이번 주 기록에서 읽힌 신호 1~3개">
        {result.visibleSignals.length > 0 ? (
          <SignalPills items={result.visibleSignals} tone="emerald" />
        ) : (
          <EmptyNote text="아직 분명하게 읽힌 PM 신호가 없습니다." />
        )}
      </SectionCard>

      <SectionCard title="자산 후보 문장 1개">
        {result.assetLine ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
            {result.assetLine}
          </p>
        ) : (
          <EmptyNote text="기록이 조금 더 구체적이면 자산 후보 문장을 만들 수 있습니다." />
        )}
      </SectionCard>

      <SectionCard title="이번 주 묶음으로 넘길지 여부">
        <p className="text-sm leading-relaxed text-slate-700">{result.handoffDecision}</p>
      </SectionCard>
    </div>
  );
}

function WeeklyCards({ result }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="이력서 문장">
        {result.resumeLine ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
            {result.resumeLine}
          </p>
        ) : (
          <EmptyNote text="주간 묶음이 더 구체적이면 이력서 문장을 만들 수 있습니다." />
        )}
      </SectionCard>

      <SectionCard title="강점 요약">
        <BulletList items={result.strengthSummary} />
      </SectionCard>

      <SectionCard title="누적 자산 반영 가능 메모">
        <p className="text-sm leading-relaxed text-slate-700">{result.assetMemo}</p>
      </SectionCard>

      <SectionCard title="준비도 변화 반영 가능성">
        <p className="text-sm leading-relaxed text-slate-700">{result.readinessChange}</p>
      </SectionCard>
    </div>
  );
}

function JdCards({ result }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="JD에서 먼저 읽히는 핵심 요구 신호">
        {result.requiredSignals.length > 0 ? (
          <SignalPills items={result.requiredSignals} tone="slate" />
        ) : (
          <EmptyNote text="Starter 버전에서는 JD에서 분명한 PM 핵심 신호를 아직 읽지 못했습니다." />
        )}
      </SectionCard>

      <SectionCard title="현재 보이는 신호">
        {result.presentSignals.length > 0 ? (
          <SignalPills items={result.presentSignals} tone="emerald" />
        ) : (
          <EmptyNote text="현재 세션에서 직접 겹쳐 보이는 신호는 아직 없습니다." />
        )}
      </SectionCard>

      <SectionCard title="부족 신호">
        {result.missingSignals.length > 0 ? (
          <SignalPills items={result.missingSignals} tone="amber" />
        ) : (
          <EmptyNote text="이번 starter 비교에서는 눈에 띄는 부족 신호가 크지 않습니다." />
        )}
      </SectionCard>

      <SectionCard title="남은 간극 요약">
        <div className="flex flex-col gap-2">
          <p className="text-sm leading-relaxed text-slate-700">{result.gapSummary}</p>
          <p className="text-xs leading-relaxed text-slate-500">{result.helperNote}</p>
        </div>
      </SectionCard>

      <SectionCard title="우선 보완 항목">
        <BulletList items={result.nextPriority} />
      </SectionCard>
    </div>
  );
}

export default function PmResultCards({ track, result }) {
  if (!result) return null;

  if (track === "weekly") {
    return <WeeklyCards result={result} />;
  }

  if (track === "jd") {
    return <JdCards result={result} />;
  }

  return <TodayCards result={result} />;
}
