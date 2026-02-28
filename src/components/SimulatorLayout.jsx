import React, { useMemo, useState } from "react";

export default function SimulatorLayout({ simVM }) {
  const vm = simVM || {};
  try { window.__LAST_SIM_VM__ = vm; } catch { }
  // ✅ PATCH (append-only): "더보기" 비밀 수첩 모달 상태/헬퍼 (반드시 return 이전, 함수 내부)
  const __top3List = (Array.isArray(vm?.top3) && vm.top3.length ? vm.top3 : []).slice(0, 3);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState(__top3List?.[0]?.id || "");

  const openDetail = (id) => {
    console.log("[Top3] openDetail called:", { id, hasTop3: Array.isArray(__top3List), len: __top3List?.length, detailOpenBefore: detailOpen });
    const nextId = String(id || "").trim();
    setDetailId(nextId || String(__top3List?.[0]?.id || ""));
    setDetailOpen(true);
  };

  const closeDetail = () => setDetailOpen(false);

  // ✅ PATCH (append-only): flags/summary 기반 자연어 컨텍스트
  const __flagsCtx = useMemo(() => {
    const flags = (window.__DBG_ANALYSIS__?.structuralPatterns?.flags || [])
      .map((x) => String(x?.id || x?.key || x?.code || "").trim())
      .filter(Boolean);

    const summaryForAI = String(window.__DBG_ANALYSIS__?.structureSummaryForAI || "").trim();
    const has = (id) => flags.includes(id);

    const reasonsDoc = [];
    if (has("MUST_HAVE_SKILL_MISSING")) reasonsDoc.push("JD ‘필수 요건’이 이력서 bullet에서 바로 확인되지 않음");
    if (has("JD_KEYWORD_ABSENCE_PATTERN")) reasonsDoc.push("JD 핵심 키워드가 이력서 문장에 충분히 연결되지 않음");
    if (has("LOW_SEMANTIC_SIMILARITY_PATTERN")) reasonsDoc.push("JD ↔ 이력서 의미 유사도가 낮게 잡힘(관련성 의심 질문 증가)");
    if (has("LOW_CONTENT_DENSITY_PATTERN")) reasonsDoc.push("근거 문장 밀도가 낮아 ‘주장형’으로 읽힐 수 있음");
    if (has("LOW_ROLE_SPECIFICITY_PATTERN")) reasonsDoc.push("역할/책임 범위가 구체적으로 드러나지 않음");
    if (has("VENDOR_LOCK_PATTERN")) reasonsDoc.push("벤더/특정 환경 의존 신호로 확장성 검증 질문이 늘 수 있음");

    const reasonsInt = [];
    if (summaryForAI.toLowerCase().includes("ownership evidence low")) reasonsInt.push("오너십(주도권) 근거가 약하게 잡힘");

    const sem = window.__DBG_ANALYSIS__?.structuralPatterns?.metrics?.semanticSimilarity;
    if (typeof sem === "number" && Number.isFinite(sem) && sem < 0.10) {
      reasonsDoc.unshift("JD와 이력서 연결이 약해 ‘관련성’을 의심받을 수 있음");
    }

    return {
      flags,
      summaryForAI,
      docMind: [
        "“이 지원자는 일을 한 것 같긴 한데, 검증 가능한 근거가 안 보인다.”",
        "“확인 질문이 늘어나겠다.”",
      ],
      intMind: [
        "“팀은 잘한 것 같은데, 이 사람의 권한/결정은 어디까지였지?”",
        "“책임 범위를 확인해야겠다.”",
      ],
      reasonsDoc: reasonsDoc.length ? reasonsDoc : ["근거 문장이 얇아 보여 확인 질문이 늘어날 수 있음"],
      reasonsInt: reasonsInt.length ? reasonsInt : ["의사결정/책임 범위가 모호하면 ‘구경만 한 사람’으로 읽힐 수 있음"],
      qDoc: [
        "“그래서 구체적으로 얼마나 개선했나요?”",
        "“JD에 나온 필수 요건은 어디에서/어떻게 증명했죠?”",
      ],
      qInt: [
        "“본인이 결정한 건 뭐죠?”",
        "“리스크/갈등 상황에서 어떤 판단을 했나요?”",
      ],
      fixDoc: [
        "JD 핵심 요건 3개를 골라 ‘요건당 1~2개 bullet’로 근거를 붙이세요.",
        "‘개선’은 기준/기간/수치를 포함해 Before/After로 쓰면 설득력이 급상승합니다.",
      ],
      fixInt: [
        "각 프로젝트 bullet 첫 줄에 ‘내 역할(권한) + 결정 1개’를 고정하세요.",
        "성과는 ‘내 판단 → 실행 → 결과’ 흐름으로 정리하세요.",
      ],
    };
  }, [vm?.meta?.primaryGroup, vm?.meta?.totalCount]);

  const __detail = useMemo(() => {
    const id = String(detailId || "").trim();
    const picked =
      __top3List.find((x) => String(x?.id || x?.raw?.id || "").trim() === id) ||
      __top3List[0] ||
      null;

    const rawId = String(picked?.id || picked?.raw?.id || "").trim();
    const layerGuess =
      String(picked?.layer || picked?.raw?.layer || "").toLowerCase() ||
      (rawId.startsWith("DRIVER__INTERVIEW__") ? "interview" : "document");

    const title = String(picked?.title || picked?.message || rawId || "컷 신호 상세").trim();

    const codename =
      layerGuess === "interview" ? "(The ‘병풍’ 지원자)" : "(The ‘열심히만 한’ 지원자)";

    const mind = layerGuess === "interview" ? __flagsCtx.intMind : __flagsCtx.docMind;
    const reasons = layerGuess === "interview" ? __flagsCtx.reasonsInt : __flagsCtx.reasonsDoc;
    const questions = layerGuess === "interview" ? __flagsCtx.qInt : __flagsCtx.qDoc;
    const fixes = layerGuess === "interview" ? __flagsCtx.fixInt : __flagsCtx.fixDoc;

    return { id: rawId, layer: layerGuess, title, codename, mind, reasons, questions, fixes };
  }, [detailId, __top3List, __flagsCtx]);
  return (
    // ✅ embed-friendly light theme (no full-page dark, no min-h-screen)
    <div className="w-full text-slate-900">
      {/* page container */}
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
        {/* header */}
        <div className="mb-6">
          <div className="text-xs text-slate-500">면접관 판단 시뮬레이터</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            지금 이 순간, 면접관은 이렇게 해석합니다
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            숫자 나열이 아니라{" "}
            <span className="text-indigo-600">판단 흐름</span>으로 보여드립니다.
          </p>
        </div>

        {/* 1) HERO */}
        <section className="mb-5">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-500">
                  🎯 당신의 현재 면접관 해석 유형
                </div>
                <div className="mt-2 text-3xl font-semibold leading-tight tracking-tight">
                  {vm?.userType?.title || "전환 스토리 보강형"}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {vm?.userType?.subtitle ||
                    "조직은 잠재력을 보지만, “이 경험이 여기서도 통할까?”를 궁금해하고 있습니다."}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  {vm?.userType?.stageLabel || "보완 단계"}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {vm?.userType?.badgeLabel || "판단: 설득 포인트 탐색 중"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2) Judge Log */}
        <section className="mb-5">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">
                  🧠 면접관 내부 판단 로그
                </div>
                <div className="mt-1 text-base font-semibold">
                  머릿속 메모(요약)
                </div>
              </div>
              <div className="text-xs text-slate-500">
                2~3줄 · 판단형 문장
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ul className="space-y-2 text-sm text-slate-800">
                {(Array.isArray(vm?.logs) && vm.logs.length
                  ? vm.logs
                  : [
                    "산업은 다르지만, 경험은 흥미롭다.",
                    "다만, 직접 증명 사례가 더 필요해 보인다.",
                    "질문이 조금 늘어날 수 있겠다.",
                  ]
                ).map((t, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>


              {/*
<div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
  <span className="font-mono">v0.1</span>
</div>
*/}
            </div>
          </div>
        </section>

        {/* 3) Top3 signals */}
        <section className="mb-5">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">
                  🚨 지금 면접관이 가장 많이 보는 3가지
                </div>
                <div className="mt-1 text-base font-semibold">
                  컷 신호 TOP3
                </div>
              </div>
              <button
                type="button"
                onClick={() => openDetail(__top3List?.[0]?.id || "")}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                더보기
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {(() => {
                // ✅ PATCH: prefer engine-derived top3 (gate-first) when signals are not provided (append-only)
                const top3 = Array.isArray(vm?.top3) && vm.top3.length ? vm.top3 : null;
                if (top3) {
                  const pickText = (...vals) => {
                    const sanitize = (v) => {
                      const t = String(v ?? "").trim();
                      if (!t) return "";
                      const low = t.toLowerCase();

                      // 개발자/시스템 흔적 제거
                      if (
                        low.includes("usedai") ||
                        low.includes("ai: skipped") ||
                        low.includes("skipped") ||
                        low.includes("v0.")
                      ) {
                        return "";
                      }

                      // unknown/undefined/null 제거
                      if (low === "unknown" || low === "undefined" || low === "null") return "";
                      if (low.includes(" unknown")) return "";
                      return t;
                    };

                    for (const v of vals) {
                      const t = sanitize(v);
                      if (t) return t;
                    }
                    return "";
                  };
                  const __getIdSafe = (r) =>
                    String(r?.id || r?.raw?.id || r?.code || r?.raw?.code || "").trim();

                  const __getLayerSafe = (r) =>
                    String(r?.layer || r?.raw?.layer || "").toLowerCase().trim();

                  const __getPrioritySafe = (r) => {
                    const cand = [
                      r?.priority,
                      r?.raw?.priority,
                      r?.priorityScore,
                      r?.raw?.priorityScore,
                      r?.score,
                      r?.raw?.score,
                    ];
                    for (const v of cand) {
                      const n = typeof v === "number" ? v : Number(v);
                      if (Number.isFinite(n)) return n;
                    }
                    return 0;
                  };

                  const isGate = (r) => {
                    const id = __getIdSafe(r);
                    const layer = __getLayerSafe(r);
                    return layer === "gate" || id.startsWith("GATE__");
                  };

                  return top3.slice(0, 3).map((r) => {
                    const id = __getIdSafe(r);
                    const pr = __getPrioritySafe(r);

                    if (id === "GATE__AGE") {
                      return { title: "나이 컷 신호", note: "연령 구간에서 서류 컷 가능성이 있어요", statusLabel: "즉시 컷" };
                    }
                    if (id === "GATE__SALARY_MISMATCH") {
                      return {
                        title: "연봉 역전 신호",
                        note: "희망연봉·밴드 정합성에서 리스크로 해석될 수 있어요",
                        statusLabel: "즉시 컷",
                      };
                    }

                    const title =
                      pickText(r?.title, r?.name, r?.label) ||
                      (id === "SIMPLE__DOMAIN_SHIFT" ? "도메인 전환 리스크" : "") ||
                      (id === "SIMPLE__ROLE_SHIFT" ? "직무 전환 리스크" : "") ||
                      (id ? id : "리스크 신호");


                    // (Top3 signals 섹션 내부) 자연어 근거 생성기
                    const __getNaturalEvidence = (r) => {
                      // flags id 목록
                      const flagIds = (
                        window.__DBG_ANALYSIS__?.structuralPatterns?.flags || []
                      )
                        .map((x) => String(x?.id || x?.key || x?.code || "").trim())
                        .filter(Boolean);

                      const has = (id) => flagIds.includes(id);

                      // 전반 요약(영문) - 인터뷰/오너십 쪽 근거로 활용
                      const sum = String(window.__DBG_ANALYSIS__?.structureSummaryForAI || "").trim();

                      const layer = String(r?.layer || r?.raw?.layer || "").toLowerCase();
                      const id = String(r?.id || r?.raw?.id || "").trim();

                      // 1) 문서 기반 DRIVER 자연어 근거
                      if (id.startsWith("DRIVER__DOCUMENT__") || layer === "document") {
                        if (has("MUST_HAVE_SKILL_MISSING")) {
                          return "JD의 ‘필수 요건’이 이력서에서 바로 확인되지 않아, 서류 단계에서 불리하게 해석될 수 있어요.";
                        }
                        if (has("JD_KEYWORD_ABSENCE_PATTERN")) {
                          return "JD 핵심 키워드가 이력서 문장에 충분히 연결되지 않아, ‘요건 매칭 근거가 약하다’고 읽힐 수 있어요.";
                        }
                        if (has("LOW_SEMANTIC_SIMILARITY_PATTERN")) {
                          return "JD와 이력서의 문장 의미 유사도가 낮게 잡혀, ‘방향이 다른 지원’으로 오해될 가능성이 있어요.";
                        }
                        if (has("LOW_CONTENT_DENSITY_PATTERN")) {
                          return "불릿/근거 문장이 얇아 보여, 면접관이 ‘확인할 게 많다’고 판단할 수 있어요.";
                        }
                        if (has("LOW_ROLE_SPECIFICITY_PATTERN")) {
                          return "역할·책임 범위가 구체적으로 드러나지 않아, 기대 직무 수준 대비 약하게 읽힐 수 있어요.";
                        }
                        return ""; // fallback은 아래에서 처리
                      }

                      // 2) 인터뷰 기반 DRIVER 자연어 근거 (오너십/책임 레벨)
                      if (id.startsWith("DRIVER__INTERVIEW__") || layer === "interview") {
                        // structureSummaryForAI에 'Ownership evidence LOW'가 실제로 있음
                        if (sum.toLowerCase().includes("ownership evidence low")) {
                          return "주도권/오너십을 증명하는 근거가 약하게 잡혀, 면접에서 ‘책임 범위’를 집중 검증받을 수 있어요.";
                        }
                        return "";
                      }

                      return "";
                    };
                    const natural = __getNaturalEvidence(r);

                    const note =
                      pickText(
                        natural,
                        r?.note,
                        r?.message,
                        r?.raw?.message,
                        r?.summary,
                        r?.description,
                        r?.contextSummary
                      ) ||
                      (id === "SIMPLE__DOMAIN_SHIFT" ? "전환 근거·전이 논리를 더 명확히 보여줘야 해요" : "") ||
                      (id === "SIMPLE__ROLE_SHIFT" ? "직무 핵심역량의 연결 고리를 선명하게 만들어야 해요" : "");

                    const statusLabel = isGate(r)
                      ? "즉시 컷"
                      : pr >= 80
                        ? "많이 관찰"
                        : pr >= 60
                          ? "자주 관찰"
                          : "관찰 요소";

                    return { title, note: note || "핵심 근거를 한 줄로 더 보강해 주세요", statusLabel };
                  });
                }
                const s = Array.isArray(vm?.signals) && vm.signals.length ? vm.signals : null;
                if (s) return s;
                return [
                  { title: "직접 증명 부족", note: "성과 수치·전환 사례 필요", statusLabel: "자주 관찰" },
                  { title: "맥락 연결 약함", note: "이전 경험과 JD 연결 보완", statusLabel: "많이 관찰" },
                  { title: "리스크 설명 부족", note: "공백·전환 리스크 선제 대응", statusLabel: "관찰 요소" },
                ];
              })().map((x, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">
                        {x?.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {x?.note}
                      </div>
                    </div>

                    <SignalBadge label={x?.statusLabel} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3.5) Semantic Match (moved from App.jsx) */}
        {(() => {
          try {
            const a =
              (typeof window !== "undefined" && (window.__DBG_ACTIVE__ || window.__DBG_ANALYSIS__)) || null;

            const meta = a?.semanticMeta || a?.semantic?.meta || null;
            const match = a?.semanticMatch || a?.semantic?.match || null;

            const status = String(meta?.status || "").trim();
            const ok = meta?.ok === true;
            const matches = Array.isArray(match?.matches) ? match.matches : [];
            const show = Boolean(meta) || Boolean(match);
            if (!show) return null;

            const jdLen = Number((typeof window !== "undefined" && window.__DBG_SEMANTIC_LAST__?.jdLen) || 0);
            const resumeLen = Number((typeof window !== "undefined" && window.__DBG_SEMANTIC_LAST__?.resumeLen) || 0);

            return (
              <section className="mb-5">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">의미 기반 JD↔이력서 매칭</div>
                      <div className="mt-1 text-base font-semibold">
                        Semantic Match {ok ? "" : (status || "pending")}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {ok ? (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20">
                          OK
                        </span>
                      ) : status.startsWith("skipped") ? (
                        <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-500/15">
                          SKIPPED
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-500/20">
                          ERROR
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-600">
                    {ok ? (
                      <span>Top 매칭 {matches.length}개 생성됨 (첫 실행은 모델 로딩으로 느릴 수 있어요)</span>
                    ) : status === "skipped:short_input" ? (
                      <span>
                        입력이 짧아 실행하지 않았어요 (JD/이력서 각각 최소 20문장 권장) · 현재: JD {jdLen} / 이력서 {resumeLen}
                      </span>
                    ) : (
                      <span>실행 실패: {String(meta?.error || status || "unknown")}</span>
                    )}
                  </div>

                  {ok && matches.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {matches.slice(0, 3).map((m, idx) => {
                        const s = Number(m?.best?.score ?? m?.score ?? 0);
                        const jdText = String(m?.jdText ?? m?.jd ?? "");
                        const resumeText = String(
                          m?.best?.text ??
                          m?.best?.resumeText ??
                          m?.resumeText ??
                          m?.resume ??
                          ""
                        );

                        return (
                          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-baseline gap-2">
                                <div className="text-lg font-semibold text-slate-900 tracking-tight">
                                  {Math.round(s * 100)}%
                                </div>
                                <div className="text-[11px] text-slate-500">매칭률</div>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                candidates: {Array.isArray(m?.candidates) ? m.candidates.length : 0}
                              </div>
                            </div>

                            <div className="mt-2 grid gap-2">
                              <div className="rounded-lg bg-slate-50/70 p-2">
                                <div className="text-[11px] font-medium text-slate-600">JD</div>
                                <div className="mt-0.5 text-[13px] leading-relaxed text-slate-900">
                                  {jdText.slice(0, 120)}
                                </div>
                              </div>

                              <div className="rounded-lg bg-slate-50/70 p-2">
                                <div className="text-[11px] font-medium text-slate-600">이력서</div>
                                <div className="mt-0.5 text-[13px] leading-relaxed text-slate-900">
                                  {resumeText.slice(0, 120)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </section>
            );
          } catch {
            return null;
          }
        })()}


        {/* 4) Pass position */}
        <section className="mb-5">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 backdrop-blur">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-500">합격 포지션</div>
                <div className="mt-1 text-base font-semibold">
                  현재 구간
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">
                  세부 수치(선택 노출)
                </div>
                <div className="mt-1 text-sm text-slate-800">
                  {vm?.pass?.percentText || "32%"}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500">현재 위치</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {vm?.pass?.bandLabel || "하위 35% 구간"}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {vm?.pass?.upliftHint ||
                      "전환 논리가 보완되면 ‘중간 구간’으로 이동할 여지가 있습니다."}
                  </div>
                </div>

                <div className="w-32 shrink-0">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[35%] rounded-full bg-indigo-500" />
                  </div>
                  <div className="mt-2 text-right text-[11px] text-slate-500">
                    position
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* 5.5) Coaching CTA (migrated from App.jsx) */}
        <section className="mb-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              🧩 다음 단계(선택)
            </div>

            <div className="mt-1 text-lg font-semibold text-slate-900">
              상세 전략은 전략 설계 세션에서 제공합니다.
            </div>

            <div className="mt-4 rounded-xl border bg-slate-50/60 p-4">
              <div className="text-xs text-slate-500">
                (예시) 면접에서 판단을 바꾸는 작업
              </div>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li>• JD 기준으로 재정렬된 이력서 문장 구조</li>
                <li>• 탈락 논리를 차단하는 답변 프레임</li>
              </ul>
            </div>

            <div className="mt-4 space-y-2">
              <a
                className="block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                href="https://coachingezig.mycafe24.com/contact/"
                target="_blank"
                rel="noreferrer"
              >
                🔵 내 통과 전략 설계받기 (30분)
              </a>

              <a
                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                href="https://m.expert.naver.com/mobile/expert/product/detail?storeId=100049372&productId=100149761"
                target="_blank"
                rel="noreferrer"
              >
                면접 전략만 점검하기
              </a>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              * 지금 결과를 바탕으로, “어디를 어떻게 바꿔야 판단이 바뀌는지”만 다룹니다.
            </div>
          </div>
        </section>

        {/* ✅ PATCH (append-only): Top3 "더보기" 비밀 수첩 모달 */}
        {detailOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
              onClick={closeDetail}
            />
            <div className="relative mx-auto flex min-h-full w-full items-center justify-center px-4 py-6">
              <div className="mx-auto w-[min(720px,92vw)] rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
                <div className="p-5 sm:p-6">
                  <SecretNotebookSheet
                    stamp="면접관 내부 메모"
                    title={`${__detail.title} ${__detail.codename}`}
                    subtitle="‘왜 그렇게 읽히는지’와 ‘어떻게 바꾸면 달라지는지’를 수첩 형태로 정리합니다."
                    metaRight="Top3 · private"
                    mind={__detail.mind}
                    reasons={__detail.reasons}
                    questions={__detail.questions}
                    fixes={__detail.fixes}
                    onClose={closeDetail}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-slate-500">
          * 결과는 입력 정보에 따라 달라질 수 있으며, “판단 흐름” 중심으로 요약됩니다.
        </div>
      </div>
    </div>
  );
}

function SignalBadge({ label }) {
  const t = String(label || "").trim();

  const cls =
    t.includes("많이")
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : t.includes("자주")
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : t.includes("관찰")
          ? "border-slate-200 bg-slate-50 text-slate-700"
          : "border-slate-200 bg-white text-slate-700";

  return (
    <div
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${cls}`}
    >
      {t || "관찰 요소"}
    </div>
  );
}


function SecretNotebookSheet({
  stamp,
  title,
  subtitle,
  metaRight,
  mind,
  reasons,
  questions,
  fixes,
  onClose,
}) {
  return (
    <div
      className="
        relative overflow-hidden rounded-2xl border border-slate-200 bg-[#fffdf7]
        shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]
        bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_26px,rgba(59,130,246,0.10)_27px,transparent_28px)]
        after:pointer-events-none after:absolute after:inset-0
        after:bg-[radial-gradient(circle_at_10%_10%,rgba(0,0,0,0.035),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(0,0,0,0.03),transparent_50%),radial-gradient(circle_at_30%_80%,rgba(0,0,0,0.02),transparent_55%)]
        after:opacity-80
        before:absolute before:inset-y-0 before:left-10 before:w-px before:bg-rose-300/70
      "
    >
      <div className="relative pl-14 pr-5 py-5 sm:pl-16 sm:pr-6 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-rose-700">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500/80" />
              {stamp || "면접관 내부 메모"}
            </div>

            <h3 className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
              {title || "컷 신호 상세"}
            </h3>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              {subtitle || ""}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[11px] text-slate-500 font-mono">{metaRight || "private"}</div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              닫기
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white/60 shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/70">
              <div className="text-sm font-semibold text-slate-900">📌 면접관 속마음</div>
              <div className="text-[11px] text-slate-500">1~2줄</div>
            </div>
            <div className="px-4 py-4">
              <div className="rounded-xl border border-slate-200 bg-[#fff8e6] px-4 py-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]">
                <div className="text-[15px] leading-relaxed text-slate-900 font-medium">
                  {Array.isArray(mind) && mind.length ? mind[0] : "“검증 가능한 근거가 안 보인다.”"}
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  {Array.isArray(mind) && mind.length > 1 ? mind[1] : "※ 판단은 ‘근거 문장’의 유무에 크게 좌우됩니다."}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/60 shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/70">
              <div className="text-sm font-semibold text-slate-900">📉 왜 이렇게 읽히는가</div>
              <div className="text-[11px] text-slate-500">신호/근거</div>
            </div>
            <div className="px-4 py-4">
              <ul className="space-y-2">
                {(Array.isArray(reasons) && reasons.length ? reasons : ["근거 문장이 얇아 보여 확인 질문이 늘어날 수 있음"]).map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-500/60" />
                    <span className="text-sm text-slate-700 leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/60 shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/70">
              <div className="text-sm font-semibold text-slate-900">🎯 실제 면접 질문으로 번역</div>
              <div className="text-[11px] text-slate-500">Q</div>
            </div>
            <div className="px-4 py-4">
              <ul className="space-y-2">
                {(Array.isArray(questions) && questions.length ? questions : ["“그래서 구체적으로 얼마나 개선했나요?”"]).map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-500/60" />
                    <span className="text-sm text-slate-700 leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-4">
            <div className="text-xs font-semibold text-indigo-700 tracking-wide">
              🛠 해석을 바꾸는 방법
            </div>
            <div className="mt-2 space-y-2">
              {(Array.isArray(fixes) && fixes.length ? fixes : ["JD 요건에 맞춰 bullet을 재구성하세요."]).map((t, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-500/70" />
                  <span className="text-sm text-slate-700 leading-relaxed">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500">※ 이 메모는 “판단 흐름” 중심으로 요약됩니다.</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-[0.99] transition"
            >
              👉 이 논리 다시 설계하기
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
