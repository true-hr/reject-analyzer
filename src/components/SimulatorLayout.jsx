import React from "react";

/**
 * Tailwind-only layout skeleton for:
 * Hero (type) -> Judge Log -> Top3 Signals -> Pass Position -> Fix CTA -> Paid (locked)
 *
 * props:
 *  - simVM: {
 *      userType: { title, subtitle, stageLabel, badgeLabel },
 *      logs: string[],
 *      top3: Array<{ title, statusLabel, note }>,
 *      pass: { bandLabel, percentText, upliftHint },
 *      fix: { title, bullets: string[], ctaText },
 *      paid: { title, items: string[], ctaText }
 *    }
 */
export default function SimulatorLayout({ simVM }) {
  const vm = simVM || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* page container */}
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
        {/* header */}
        <div className="mb-6">
          <div className="text-xs text-slate-400">면접관 판단 시뮬레이터</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">지금 이 순간, 면접관은 이렇게 해석합니다</h1>
          <p className="mt-2 text-sm text-slate-300">
            숫자 나열이 아니라 <span className="text-sky-300">판단 흐름</span>으로 보여드립니다.
          </p>
        </div>

        {/* 1) HERO */}
        <section className="mb-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400">🎯 당신의 현재 면접관 해석 유형</div>
                <div className="mt-2 text-3xl font-semibold leading-tight tracking-tight">
                  {vm?.userType?.title || "전환 스토리 보강형"}
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  {vm?.userType?.subtitle ||
                    "조직은 잠재력을 보지만, “이 경험이 여기서도 통할까?”를 궁금해하고 있습니다."}
                </div>
              </div>

              {/* stage badge */}
              <div className="shrink-0 text-right">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1 text-xs text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  {vm?.userType?.stageLabel || "보완 단계"}
                </div>
                <div className="mt-2 text-xs text-slate-400">{vm?.userType?.badgeLabel || "판단: 설득 포인트 탐색 중"}</div>
              </div>
            </div>
          </div>
        </section>

        {/* 2) Judge Log */}
        <section className="mb-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">🧠 면접관 내부 판단 로그</div>
                <div className="mt-1 text-base font-semibold">머릿속 메모(요약)</div>
              </div>
              <div className="text-xs text-slate-500">2~3줄 · 판단형 문장</div>
            </div>

            {/* log box (memo style) */}
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <ul className="space-y-2 text-sm text-slate-200">
                {(Array.isArray(vm?.logs) && vm.logs.length ? vm.logs : [
                  "산업은 다르지만, 경험은 흥미롭다.",
                  "다만, 직접 증명 사례가 더 필요해 보인다.",
                  "질문이 조금 늘어날 수 있겠다.",
                ]).map((t, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-slate-500" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              {/* optional: console vibe footer */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono">LOG · judgement_trace</span>
                <span className="font-mono">v0.1</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3) Top3 signals */}
        <section className="mb-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">🚨 지금 면접관이 가장 많이 보는 3가지</div>
                <div className="mt-1 text-base font-semibold">컷 신호 TOP3</div>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-700 bg-slate-950/30 px-3 py-1 text-xs text-slate-200 hover:bg-slate-950/50"
              >
                더보기
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {(Array.isArray(vm?.top3) && vm.top3.length ? vm.top3 : [
                { title: "전환 논리 설득력", statusLabel: "많이 보는 요소", note: "전이 근거가 한 번에 보이지 않음" },
                { title: "직접 경험 증명력", statusLabel: "자주 보는 요소", note: "실무 그림이 떠오르는 사례 부족" },
                { title: "직무 맥락 연결도", statusLabel: "관찰 요소", note: "성과가 직무 언어로 번역되지 않음" },
              ]).slice(0, 3).map((x, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-950/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{`[${idx + 1}] ${x?.title}`}</div>
                      <div className="mt-1 text-xs text-slate-400">{x?.note}</div>
                    </div>

                    <SignalBadge label={x?.statusLabel} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4) Pass position */}
        <section className="mb-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">📊 현재 통과 위치</div>
                <div className="mt-1 text-base font-semibold">서류 통과 가능성</div>
              </div>

              {/* optional discreet percent */}
              <div className="text-right">
                <div className="text-xs text-slate-500">세부 수치(선택 노출)</div>
                <div className="mt-1 text-sm text-slate-200">{vm?.pass?.percentText || "32%"}</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400">현재 위치</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-100">
                    {vm?.pass?.bandLabel || "하위 35% 구간"}
                  </div>
                  <div className="mt-2 text-sm text-slate-300">
                    {vm?.pass?.upliftHint || "전환 논리가 보완되면 ‘중간 구간’으로 이동할 여지가 있습니다."}
                  </div>
                </div>

                {/* simple bar */}
                <div className="w-32 shrink-0">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full w-[35%] rounded-full bg-sky-400" />
                  </div>
                  <div className="mt-2 text-right text-[11px] text-slate-500">position</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5) Fix CTA */}
        <section className="mb-5">
          <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-500/10 to-slate-900/40 p-5">
            <div className="text-xs text-sky-200">💡 판단이 바뀌는 포인트</div>
            <div className="mt-1 text-lg font-semibold">{vm?.fix?.title || "이 2가지만 보완하면 해석이 달라질 수 있어요"}</div>

            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              {(Array.isArray(vm?.fix?.bullets) && vm.fix.bullets.length ? vm.fix.bullets : [
                "전이 가능한 경험을 3줄로 구조화",
                "데이터 기반 의사결정 사례를 수치화",
              ]).map((t, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-sky-300" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-300"
              >
                {vm?.fix?.ctaText || "👉 이 논리 다시 설계하기"}
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-700 bg-slate-950/30 px-5 py-2 text-sm text-slate-200 hover:bg-slate-950/50"
              >
                예시 보기
              </button>
            </div>
          </div>
        </section>

        {/* 6) Paid (Locked) */}
        <section className="mb-2">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">🔒 유료 확장 영역</div>
                <div className="mt-1 text-base font-semibold">{vm?.paid?.title || "판단을 뒤집는 설계 패키지"}</div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/30 px-3 py-1 text-xs text-slate-200">
                <span className="h-2 w-2 rounded-full bg-rose-300" />
                LOCKED
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-slate-200">
              {(Array.isArray(vm?.paid?.items) && vm.paid.items.length ? vm.paid.items : [
                "JD 기준 리라이팅(핵심 문장 재구성)",
                "예상 검증 질문 5개 + 답변 프레임",
                "탈락 논리 반박 스크립트",
                "점수 재시뮬레이션",
              ]).map((t, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/20 p-3">
                  <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-slate-500" />
                  <div className="text-slate-200">{t}</div>
                </div>
              ))}
            </div>

            {/* blur overlay preview */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent" />

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                className="rounded-full bg-rose-300 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-rose-200"
              >
                {vm?.paid?.ctaText || "설계 시작하기"}
              </button>
              <div className="text-xs text-slate-400">무료는 ‘판단 체험’, 유료는 ‘판단 뒤집기’</div>
            </div>
          </div>
        </section>

        {/* footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          * 결과는 입력 정보에 따라 달라질 수 있으며, “판단 흐름” 중심으로 요약됩니다.
        </div>
      </div>
    </div>
  );
}

function SignalBadge({ label }) {
  const t = String(label || "").trim();

  // very light mapping (UI only)
  const cls =
    t.includes("많이") ? "border-sky-400/40 bg-sky-400/10 text-sky-200" :
    t.includes("자주") ? "border-amber-400/40 bg-amber-400/10 text-amber-200" :
    t.includes("관찰") ? "border-slate-600 bg-slate-800/30 text-slate-200" :
    "border-slate-700 bg-slate-950/20 text-slate-200";

  return (
    <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${cls}`}>
      {t || "관찰 요소"}
    </div>
  );
}