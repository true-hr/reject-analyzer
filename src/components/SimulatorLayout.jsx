import React, { useEffect, useMemo, useState } from "react";
import GlassHeroCard from "./ui/GlassHeroCard.jsx";
export default function SimulatorLayout({ simVM, hideNextStep = false }) {
  const vm = simVM || {};
  try { window.__LAST_SIM_VM__ = vm; } catch { }
  // ✅ PATCH (append-only): "더보기" 비밀 수첩 모달 상태/헬퍼 (반드시 return 이전, 함수 내부)
  // [CONTRACT] gate 판정 기준: 정규화된 layer === "gate" 단독.
  // raw.layer fallback 금지, group("gates") 기반 판정 금지.
  const __top3List = (Array.isArray(vm?.top3) && vm.top3.length ? vm.top3 : [])
    .filter((x) => String(x?.layer || "").toLowerCase() === "gate")
    .slice(0, 3);
  // ✅ PATCH (append-only): Report summary hero inputs (no engine changes)
  const __passPct =
    Number.isFinite(Number(vm?.passProbability))
      ? Math.round(Number(vm.passProbability))
      : (Number.isFinite(Number(vm?.pass?.pct)) ? Math.round(Number(vm.pass.pct)) : null);

  const __band =
    (vm?.pass?.bandLabel || vm?.interpretation?.label || vm?.bandLabel || "").toString();

  // ✅ PATCH (append-only): score cap reason (engine → UI safe bridge)
  // - 우선순위: simVM(vm) 안에 실려오면 그걸 우선
  // - 없으면 window.__DBG_ACTIVE__/__LAST_PACK__ 등 디버그 경로에서 최대한 회수
  const __capReasonText = useMemo(() => {
    try {
      const direct =
        vm?.capReason ||
        vm?.decisionScore?.capReason ||
        vm?.decisionScore?.meta?.capReason ||
        vm?.meta?.capReason ||
        vm?.pass?.capReason ||
        vm?.pass?.meta?.capReason ||
        "";

      const d = String(direct || "").trim();
      if (d) return d;

      const a =
        (typeof window !== "undefined" &&
          (window.__DBG_ACTIVE__ || window.__LAST_PACK__ || window.__DBG_ANALYSIS__ || null)) ||
        null;

      const dp = a?.decisionPack || a?.reportPack?.decisionPack || null;

      const cand =
        dp?.decisionScore?.capReason ||
        dp?.decisionScore?.meta?.capReason ||
        a?.decisionPack?.decisionScore?.capReason ||
        a?.decisionPack?.decisionScore?.meta?.capReason ||
        "";

      return String(cand || "").trim();
    } catch {
      return "";
    }
  }, [vm]);
  const __top3Keywords = (
    Array.isArray(vm?.top3) ? vm.top3
      : (Array.isArray(vm?.signalsTop3) ? vm.signalsTop3 : [])
  )
    .slice(0, 3)
    .map((x) => (typeof x === "string" ? x : (x?.label || x?.title || x?.id || "")))
    .map((s) => (s || "").toString().trim())
    .filter(Boolean);

  // optional: if you already carry any "potential" in vm (hover/preview etc.)
  const __potentialPct =
    Number.isFinite(Number(vm?.pass?.potentialPct))
      ? Math.round(Number(vm.pass.potentialPct))
      : (Number.isFinite(Number(vm?.potentialScore)) ? Math.round(Number(vm.potentialScore)) : null);

  const __delta =
    (__passPct != null && __potentialPct != null) ? (__potentialPct - __passPct) : null;
  const [detailOpen, setDetailOpen] = useState(false);
  // ✅ PATCH (append-only): Analyzer Issues "더보기" 모달 상태
  const [issuesOpen, setIssuesOpen] = useState(false);
  try {
    // 콘솔에서 window.__OPEN_DETAIL__("GATE__AGE") 같은 식으로 강제 호출 가능
    window.__OPEN_DETAIL__ = (id) => openDetail(String(id || "").trim());
  } catch { }
  const [detailId, setDetailId] = useState(__top3List?.[0]?.id || "");

  const openDetail = (id) => {
    const nextId = String(id || "").trim();
    setDetailId(nextId || String(((Array.isArray(__viewRisks) && __viewRisks.length && (__viewRisks[0]?.id || __viewRisks[0]?.raw?.id)) || (__top3List?.[0]?.id || __top3List?.[0]?.raw?.id) || "") || "").trim());
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
  // ✅ PATCH (append-only): 리스크별 비밀수첩 템플릿 사전 + 선택 헬퍼
  // - 기본값은 __flagsCtx(doc/int)로 폴백 (안정성 유지)
  // - 아래 맵에 rawId(=risk id)를 계속 추가해가면 "각 리스크별 전용 문구"가 됩니다.
  const __NOTE_TEMPLATES = useMemo(() => {
    return {
      // -----------------------
      // Gate (즉시 컷 계열)
      // -----------------------
      // ✅ 여기부터 추가
      SIMPLE__BASELINE_GUIDE: {
        codename: "(The ‘입력 부족’ 케이스)",
        mind: [
          "“재료가 부족해서 판단을 세게 못 하겠다.”",
          "“일단 확인 질문부터 늘어나겠다.”",
        ],
        reasons: [
          "JD/이력서 텍스트가 짧거나 구조가 약하면 ‘가설’ 수준에서만 판단됨",
          "핵심 요건/성과/역할이 빠져 있으면 평가가 ‘보수적’으로 쏠림",
        ],
        questions: [
          "“지원 직무에 맞는 대표 성과 1~2개를 숫자로 말해줄 수 있나요?”",
          "“JD 필수요건을 어디에서 충족했는지 한 줄씩 짚어줄 수 있나요?”",
        ],
        fixes: [
          "JD 필수요건 3개를 뽑아 ‘요건당 1~2개 bullet’로 근거를 붙이세요.",
          "성과는 Before/After(기준·기간·수치)를 최소 1개 포함해 주세요.",
        ],
      },
      // ✅ 여기까지 추가
      GATE__AGE: {
        codename: "(The ‘연령-직급 정합성’ 케이스)",
        mind: [
          "“연령/직급 구간에서 밴드가 맞는지부터 보고 있다.”",
          "“조건이 안 맞으면 역량이 좋아도 바로 컷이 날 수 있다.”",
        ],
        reasons: [
          "연령 구간은 ‘직급/밴드/성장 트랙’ 가정이 붙어서 보수적으로 평가될 수 있음",
          "서류 단계에서 빠르게 필터링되는 대표 게이트 신호 중 하나",
        ],
        questions: [
          "“현재 연차/직급 기준으로 맡았던 책임 수준이 어느 정도였나요?”",
          "“이 포지션 레벨에 맞는 ‘결정/리딩’ 경험이 있나요?”",
        ],
        fixes: [
          "‘내가 맡은 책임 레벨’(의사결정/예산/리딩)을 1~2개 bullet로 즉시 보이게 만드세요.",
          "직급/연차에 맞는 성과를 ‘규모(예산/매출/절감액/리딩 범위)’로 제시하세요.",
        ],
      },

      GATE__SALARY_MISMATCH: {
        codename: "(The ‘보상 밴드 불일치’ 케이스)",
        mind: [
          "“희망연봉이 밴드 밖이면, 진행 자체가 비효율이라 판단할 수 있다.”",
          "“연봉/레벨 정합성부터 확인해야겠다.”",
        ],
        reasons: [
          "보상 밴드는 서류/1차 단계에서 빠르게 컷되는 기준으로 쓰일 수 있음",
          "희망연봉이 높으면 ‘레벨 과대평가’로 해석될 수 있음",
        ],
        questions: [
          "“희망연봉이 이 밴드에서 가능한 근거(현 연봉/오퍼/시장가)를 설명해 주세요.”",
          "“이 직무 레벨에서 어떤 임팩트를 낼 수 있나요?”",
        ],
        fixes: [
          "희망연봉을 ‘협의 가능 범위’로 제시하고, 근거(현 연봉/시장가/성과)를 함께 붙이세요.",
          "레벨에 맞는 임팩트(매출/절감/리드 범위)를 먼저 보여 ‘가격 대비 가치’를 설득하세요.",
        ],
      },

      // -----------------------
      // 전환/적합성 (비게이트)
      // -----------------------
      SIMPLE__DOMAIN_SHIFT: {
        codename: "(The ‘산업 전환 검증’ 케이스)",
        mind: [
          "“산업이 바뀌면 전이 근거가 약해질 수 있다.”",
          "“검증 비용이 늘어나서 보수적으로 볼 가능성이 크다.”",
        ],
        reasons: [
          "도메인 지식/관행 차이가 커서 ‘바로 투입’ 가능성을 낮게 볼 수 있음",
          "전이 논리가 약하면 ‘학습 비용’ 리스크로 해석됨",
        ],
        questions: [
          "“이전 경험이 이 산업에서 그대로 통하는 이유를 한 문장으로 말해보세요.”",
          "“이 산업에서 성과가 나는 메커니즘을 어떻게 이해하고 있나요?”",
        ],
        fixes: [
          "이전 역량 1개 → 새 JD 핵심 과업 1개로 ‘1:1 연결 문장’을 만들고 최상단에 배치하세요.",
          "‘내가 익숙한 일’이 아니라 ‘회사에 돈/성과가 되는 메커니즘’으로 설명하세요.",
        ],
      },

      SIMPLE__ROLE_SHIFT: {
        codename: "(The ‘직무 전환 검증’ 케이스)",
        mind: [
          "“직무 핵심역량이 실제로 있는지부터 확인해야겠다.”",
          "“겉으로 비슷해 보여도 실무는 다를 수 있다.”",
        ],
        reasons: [
          "직무 전환은 ‘핵심 역량/툴/프로세스’ 적합성에서 빠르게 갈림",
          "직무 언어가 부족하면 ‘관련성 낮음’으로 읽힐 수 있음",
        ],
        questions: [
          "“이 직무의 핵심 KPI를 정의해보세요.”",
          "“이전 역할에서 그 KPI에 해당하는 성과를 만든 사례가 있나요?”",
        ],
        fixes: [
          "JD의 핵심 KPI/과업 3개를 뽑아 ‘과업당 1개 증거 bullet’로 맞춰 쓰세요.",
          "툴/프로세스 경험은 ‘업무 흐름(입력→처리→산출물)’로 설명하세요.",
        ],
      },
    };
  }, []);
  // ✅ PATCH (append-only): 템플릿 커버리지 점검용 "missing id" 자동 수집/노출
  // - Top3만이 아니라, 엔진이 만든 riskResults 전체에서 id 수집
  // - __NOTE_TEMPLATES에 없는 id만 missing으로 정리
  // - 결과: window.__DBG_NOTE_MISSING__.missing = ["SOME_ID", ...]
  const __DBG_NOTE_MISSING = useMemo(() => {
    const __idSet = new Set();

    const __addFromList = (list) => {
      const arr = Array.isArray(list) ? list : [];
      for (const r of arr) {
        const id = String(r?.id || r?.raw?.id || r?.code || r?.raw?.code || "").trim();
        if (id) __idSet.add(id);
      }
    };

    // 1) UI에서 보고 있는 Top3
    __addFromList(vm?.top3);

    // 2) 엔진/디버그 경로에서 가능한 riskResults 후보들(크래시-세이프)
    try {
      const a =
        (typeof window !== "undefined" &&
          (window.__DBG_ACTIVE__ || window.__DBG_ANALYSIS__ || window.__LAST_PACK__ || null)) ||
        null;

      // decisionPack 기반
      __addFromList(a?.decisionPack?.riskResults);
      __addFromList(a?.decisionPack?.riskLayer?.riskResults);

      // ✅ ADD (append-only): full risk feed (detail profiles)
      __addFromList(a?.decisionPack?.riskFeed);

      // reportPack 기반
      __addFromList(a?.reportPack?.riskLayer?.riskResults);
      __addFromList(a?.reportPack?.riskLayer?.results);
      __addFromList(a?.reportPack?.riskLayer?.risks);

      // ✅ ADD (append-only): reportPack decisionPack/riskFeed (경로 다양성 보강)
      __addFromList(a?.reportPack?.decisionPack?.riskFeed);
      __addFromList(a?.reportPack?.decisionPack?.riskResults);
      __addFromList(a?.reportPack?.riskFeed);

      // riskLayer 직접
      __addFromList(a?.riskLayer?.riskResults);
      __addFromList(a?.riskLayer?.results);
      __addFromList(a?.riskLayer?.risks);
    } catch {
      // ignore
    }

    const allIds = Array.from(__idSet);

    // "템플릿이 없는 id" = exact match 기준
    const missing = allIds.filter((id) => !(__NOTE_TEMPLATES && __NOTE_TEMPLATES[id]) && !(String(id).startsWith("DRIVER__DOCUMENT__") || String(id).startsWith("DRIVER__INTERVIEW__")));

    return {
      allIds,
      missing,
      counts: { all: allIds.length, missing: missing.length, templates: Object.keys(__NOTE_TEMPLATES || {}).length },
      updatedAt: Date.now(),
    };
  }, [vm?.top3, __NOTE_TEMPLATES]);

  // window에 노출 + 콘솔 한 줄 로그(원하면 나중에 삭제 가능)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.__DBG_NOTE_MISSING__ = __DBG_NOTE_MISSING;
        window.__DBG_NOTE_TEMPLATES__ = __NOTE_TEMPLATES;
      }
    } catch {
      // ignore
    }

    try {
      const m = __DBG_NOTE_MISSING?.missing || [];
      // console output removed
    } catch {
      // ignore
    }
  }, [__DBG_NOTE_MISSING, __NOTE_TEMPLATES]);
  // ✅ PATCH (append-only): missing ids → 템플릿 스켈레톤 코드 자동 생성기
  // - window.__DBG_NOTE_TEMPLATE_SKELETON__.code 를 복사해서 __NOTE_TEMPLATES 안에 붙이면 됨
  const __DBG_NOTE_TEMPLATE_SKELETON = useMemo(() => {
    const missing = Array.isArray(__DBG_NOTE_MISSING?.missing) ? __DBG_NOTE_MISSING.missing : [];

    const __mkStub = (id) => {
      const isGate = String(id).startsWith("GATE__");
      const isSimple = String(id).startsWith("SIMPLE__");
      const isDriverDoc = String(id).startsWith("DRIVER__DOCUMENT__");
      const isDriverInt = String(id).startsWith("DRIVER__INTERVIEW__");

      const codename =
        isGate ? "(The ‘조건 필터’ 케이스)" :
          isDriverInt ? "(The ‘책임/오너십 검증’ 케이스)" :
            isDriverDoc ? "(The ‘서류 근거 약함’ 케이스)" :
              isSimple ? "(The ‘1차 진단’ 케이스)" :
                "(The ‘추가 템플릿 필요’ 케이스)";

      const mind0 =
        isGate ? "“조건/게이트가 먼저 걸린다.”" :
          isDriverInt ? "“이 사람의 책임/결정 범위를 확인해야겠다.”" :
            "“근거가 약해서 확인 질문이 늘어날 것 같다.”";

      const mind1 =
        isGate ? "“이걸 넘기기 전엔 역량 평가가 잘 안 들어간다.”" :
          "“한두 개만 더 선명하면 판단이 바뀔 수 있다.”";

      const reasons0 =
        isGate ? "서류/1차에서 빠르게 필터링되는 조건 신호로 쓰일 수 있음" :
          isDriverInt ? "오너십/주도권 근거가 약하면 ‘구경만 한 사람’으로 오해될 수 있음" :
            "근거 문장이 얇으면 ‘검증 비용’이 올라가 보수적으로 평가될 수 있음";

      const q0 =
        isGate ? "“이 조건(밴드/레벨/요건)에 대해 정합성을 어떻게 맞출 건가요?”" :
          isDriverInt ? "“본인이 결정한 건 뭐고, 책임 범위는 어디까지였나요?”" :
            "“그래서 구체적으로 무엇을 했고, 수치로 뭐가 달라졌나요?”";

      const fix0 =
        isGate ? "조건 정합성 근거(레벨/책임/성과/시장가)를 먼저 제시해 ‘진행 가능’ 상태로 만드세요." :
          isDriverInt ? "각 프로젝트 bullet에 ‘내 권한/결정 1개’를 고정해 책임 범위를 선명하게 만드세요." :
            "JD 요건 1개당 1~2개 근거 bullet을 붙이고, Before/After 수치로 검증 가능하게 만드세요.";

      return `      ${JSON.stringify(id)}: {
        codename: ${JSON.stringify(codename)},
        mind: [
          ${JSON.stringify(mind0)},
          ${JSON.stringify(mind1)},
        ],
        reasons: [
          ${JSON.stringify(reasons0)},
        ],
        questions: [
          ${JSON.stringify(q0)},
        ],
        fixes: [
          ${JSON.stringify(fix0)},
        ],
      },`;
    };

    const code =
      missing.length === 0
        ? "// (missing 없음) 추가 템플릿이 필요하지 않습니다."
        : [
          "// -----------------------",
          "// ✅ AUTO-GENERATED: missing template stubs",
          "// - 아래 블록을 __NOTE_TEMPLATES return 객체 안에 그대로 붙여넣고, 문구만 다듬으면 됩니다.",
          "// -----------------------",
          ...missing.map(__mkStub),
        ].join("\n");

    return {
      missing,
      code,
      updatedAt: Date.now(),
    };
  }, [__DBG_NOTE_MISSING]);

  // window 노출 + 콘솔 출력(디버그용)
  // ✅ 필요 없으면 나중에 이 useEffect만 삭제해도 됨
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.__DBG_NOTE_TEMPLATE_SKELETON__ = __DBG_NOTE_TEMPLATE_SKELETON;
      }
    } catch {
      // ignore
    }

    try {
      const c = String(__DBG_NOTE_TEMPLATE_SKELETON?.code || "");
      // console output removed
    } catch {
      // ignore
    }
  }, [__DBG_NOTE_TEMPLATE_SKELETON]);
  const __pickNotebookTemplate = (rawId, layerGuess) => {
    const id = String(rawId || "").trim();
    const layer = String(layerGuess || "").trim().toLowerCase();

    // 1) exact match
    if (id && __NOTE_TEMPLATES[id]) return __NOTE_TEMPLATES[id];
    // 1.5) DRIVER (동적 전용 템플릿) - fallback 없이 id별로 생성
    // - analyzer.js: id = `DRIVER__${layer.toUpperCase()}__${idx}`
    // - layer: document / interview
    {
      const m = id.match(/^DRIVER__(DOCUMENT|INTERVIEW)__(\d+)$/);
      if (m) {
        const kind = String(m[1] || "").toUpperCase(); // DOCUMENT | INTERVIEW
        const idx = Number(m[2] || 0);

        // 원문 타이틀(가능하면) 찾아서 "진짜 면접관 메모" 느낌 강화
        let title = "";
        try {
          const a =
            (typeof window !== "undefined" &&
              (window.__DBG_ACTIVE__ || window.__DBG_ANALYSIS__ || window.__LAST_PACK__)) ||
            null;
          const __dp = a?.decisionPack || a?.reportPack?.decisionPack || null;

          const rr =
            (Array.isArray(__dp?.riskFeed) && __dp.riskFeed.length > 0 && __dp.riskFeed) ||
            (Array.isArray(__dp?.riskResults) ? __dp.riskResults : []);

          const hit = rr.find((x) => String(x?.id || "").trim() === id) || null;
          title = String(hit?.title || hit?.message || "").trim();
        } catch { }

        const label = kind === "DOCUMENT" ? "문서/서류" : "면접/대화";
        const codename = `(The ‘${label} 내부 드라이버’ #${idx + 1})`;

        return {
          codename,
          mind: [
            `이건 ${label}에서 '찜찜한 포인트'가 하나 걸린 케이스다.`,
            title ? `특히 "${title}" 이 문장이 방아쇠로 작동했다.` : "지금 보이는 단서가 뭔지 먼저 분해해야 한다.",
          ],
          reasons: [
            kind === "DOCUMENT"
              ? "문서에서 '근거 없이 주장만 있는 문장'이 있으면, 검증 비용이 급증해서 보수적으로 판단한다."
              : "면접에서 '논리 점프/일관성 붕괴'가 보이면, 실무에서도 설명 비용이 커질 위험으로 본다.",
            `DRIVER 계열은 idx가 커질수록 '부차적이지만 누적되면 치명적인' 신호로 쌓인다.`,
          ],
          questions: [
            kind === "DOCUMENT"
              ? "이 문장을 증명할 수 있는 자료/수치/전후 비교가 있나요? 없으면 왜 이렇게 썼나요?"
              : "지금 설명이 앞뒤가 맞나요? 기준/우선순위/의사결정이 어디서 바뀌었는지 말로 정리해보세요.",
            title
              ? `"${title}" 이 주장에 대해, 1)상황 2)행동 3)결과(숫자) 4)내 기여도를 30초로 말해보면?`
              : "가장 강한 근거 1개만 뽑아서, 30초 내로 설득 가능한 형태로 말해보면?",
          ],
          fixes: [
            kind === "DOCUMENT"
              ? "해당 문장을 '근거 문장(숫자/링크/산출물) → 해석(내 기여) → 결과' 순으로 재작성하세요."
              : "설명 구조를 '문제 → 내가 한 결정(이유) → 실행 → 결과 → 배운 점' 5문장으로 고정하세요.",
            title
              ? `지금부터는 "${title}" 같은 문장을 쓸 때, 반드시 바로 아래에 '증거 1줄'을 붙이세요.`
              : "추상어(열심히/성장/도전) 문장은 삭제하고, 사실+수치로 대체하세요.",
          ],
        };
      }
    }
    // 2) prefix / group fallbacks (append-only)
    if (id.startsWith("GATE__")) {
      return {
        codename: "(The ‘조건 필터’ 케이스)",
        mind: [
          "“조건/게이트가 먼저 걸린다.”",
          "“이걸 넘기기 전엔 역량 평가가 잘 안 들어간다.”",
        ],
        reasons: ["서류 단계에서 빠르게 필터링되는 ‘조건 신호’로 사용될 수 있음"],
        questions: ["“이 조건(밴드/레벨/요건)에 대해 어떻게 정합성을 맞출 건가요?”"],
        fixes: ["조건 정합성 근거(레벨/책임/성과/시장가)를 먼저 제시해 ‘진행 가능’ 상태로 만드세요."],
      };
    }

    if (id.startsWith("DRIVER__INTERVIEW__") || layer === "interview") {
      return {
        codename: "(The ‘병풍’ 지원자)",
        mind: __flagsCtx.intMind,
        reasons: __flagsCtx.reasonsInt,
        questions: __flagsCtx.qInt,
        fixes: __flagsCtx.fixInt,
      };
    }

    // default: document
    return {
      codename: "(The ‘열심히만 한’ 지원자)",
      mind: __flagsCtx.docMind,
      reasons: __flagsCtx.reasonsDoc,
      questions: __flagsCtx.qDoc,
      fixes: __flagsCtx.fixDoc,
    };
  };
  // ✅ PATCH (append-only): NOTE_TEMPLATES coverage report (debug only)
  // - 어떤 id가 "전용 템플릿"을 타는지 vs "prefix fallback" vs "default fallback"인지 확인
  // - UI/엔진 무영향. 콘솔 출력 + window.__DBG_NOTE_COVERAGE__ 스냅샷만 남김
  const __noteCoverage = useMemo(() => {
    try {
      const a =
        (typeof window !== "undefined" &&
          (window.__DBG_ACTIVE__ || window.__DBG_ANALYSIS__ || window.__LAST_PACK__)) ||
        null;

      const fromTop3 =
        (Array.isArray(vm?.top3) && vm.top3) ||
        (Array.isArray(vm?.signalsTop3) && vm.signalsTop3) ||
        [];

      const fromDecisionPack =
        (Array.isArray(a?.decisionPack?.riskFeed) && a.decisionPack.riskFeed) ||
        (Array.isArray(a?.decisionPack?.riskResults) && a.decisionPack.riskResults) ||
        (Array.isArray(a?.reportPack?.decisionPack?.riskFeed) && a.reportPack.decisionPack.riskFeed) ||
        (Array.isArray(a?.reportPack?.decisionPack?.riskResults) && a.reportPack.decisionPack.riskResults) ||
        [];

      const fromRiskLayer =
        (Array.isArray(a?.reportPack?.riskLayer?.riskResults) && a.reportPack.riskLayer.riskResults) ||
        (Array.isArray(a?.reportPack?.riskLayer?.results) && a.reportPack.riskLayer.results) ||
        [];

      const merged = [...fromTop3, ...fromDecisionPack, ...fromRiskLayer];

      const pickId = (r) => String(r?.id || r?.raw?.id || "").trim();
      const pickLayer = (r) => String(r?.layer || r?.raw?.layer || "").trim().toLowerCase();

      const seen = new Set();
      const rows = [];

      for (const r of merged) {
        const id = pickId(r);
        if (!id || seen.has(id)) continue;
        seen.add(id);

        const layer = pickLayer(r) || (id.startsWith("GATE__") ? "gate" : "");
        const hasExact = Boolean(__NOTE_TEMPLATES && __NOTE_TEMPLATES[id]);
        const hasDriverDynamic = id.startsWith("DRIVER__DOCUMENT__") || id.startsWith("DRIVER__INTERVIEW__");

        const matchType = (hasExact || hasDriverDynamic)
          ? "exact"
          : id.startsWith("GATE__")
            ? "fallback:gatePrefix"
            : "fallback:default";

        const templateKey = hasExact ? id : (id.startsWith("GATE__") ? "GATE__*" : "DEFAULT");

        rows.push({
          id,
          layer: layer || "(unknown)",
          matchType,
          templateKey,
        });
      }

      return rows;
    } catch {
      return [];
    }
  }, [vm?.top3, vm?.signalsTop3, vm?.meta?.primaryGroup, vm?.meta?.totalCount, __NOTE_TEMPLATES]);

  useEffect(() => {
    try {
      if (!Array.isArray(__noteCoverage)) return;

      // console output removed (NOTE_TEMPLATES coverage)

      if (typeof window !== "undefined") {
        window.__DBG_NOTE_COVERAGE__ = {
          at: Date.now(),
          count: __noteCoverage.length,
          rows: __noteCoverage,
        };
      }
    } catch { }
  }, [__noteCoverage]);
  // ✅ PATCH (append-only): viewRisks (detail modal source)
  // - prefer decisionPack.riskFeed (full detail titles) → fallback to riskResults / reportPack / riskLayer
  // - keep UI stable even when some packs are null
  const __viewRisks = useMemo(() => {
    try {
      const a =
        (typeof window !== "undefined" &&
          (window.__DBG_ACTIVE__ || window.__DBG_ANALYSIS__ || window.__LAST_PACK__ || null)) ||
        null;

      const pickList = (...cands) => {
        for (const x of cands) {
          if (Array.isArray(x) && x.length) return x;
        }
        return [];
      };

      const dp = a?.decisionPack || a?.reportPack?.decisionPack || null;

      const list = pickList(
        dp?.riskFeed,
        dp?.riskResults,
        a?.decisionPack?.riskFeed,
        a?.decisionPack?.riskResults,
        a?.reportPack?.decisionPack?.riskFeed,
        a?.reportPack?.decisionPack?.riskResults,
        a?.reportPack?.riskFeed,
        a?.reportPack?.riskLayer?.riskResults,
        a?.reportPack?.riskLayer?.results,
        a?.riskLayer?.riskResults,
        a?.riskLayer?.results,
        a?.riskLayer?.risks
      );

      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }, [vm?.top3, vm?.signalsTop3]);

  const __detail = useMemo(() => {
    const id = String(detailId || "").trim();

    const __pickId = (x) => String(x?.id || x?.raw?.id || "").trim();

    const viewList =
      (Array.isArray(__viewRisks) && __viewRisks.length ? __viewRisks : null);

    const picked =
      (viewList ? viewList.find((x) => __pickId(x) === id) : null) ||
      __top3List.find((x) => __pickId(x) === id) ||
      (viewList ? viewList[0] : null) ||
      __top3List[0] ||
      null;

    const rawId = __pickId(picked);
    const layerGuess =
      String(picked?.layer || picked?.raw?.layer || "").toLowerCase() ||
      (rawId.startsWith("DRIVER__INTERVIEW__") ? "interview" : "document");

    const title = String(picked?.title || picked?.message || rawId || "컷 신호 상세").trim();

    // ✅ 템플릿 우선 (없으면 기존 flagsCtx 폴백)
    const __tpl =
      (typeof __NOTE_TEMPLATES === "object" && __NOTE_TEMPLATES && rawId &&
        __NOTE_TEMPLATES[rawId])
        ? __NOTE_TEMPLATES[rawId]
        : null;

    // ✅ codename은 여기서 "한 번만" 선언 (중복 선언 방지)
    const codename = String(
      (__tpl && __tpl.codename) ||
      (layerGuess === "interview" ? "(The ‘병풍’ 지원자)" : "(The ‘열심히만 한’ 지원자)")
    ).trim();

    const mind =
      Array.isArray(__tpl?.mind) && __tpl.mind.length
        ? __tpl.mind
        : (layerGuess === "interview" ? __flagsCtx.intMind : __flagsCtx.docMind);

    const reasons =
      Array.isArray(__tpl?.reasons) && __tpl.reasons.length
        ? __tpl.reasons
        : (layerGuess === "interview" ? __flagsCtx.reasonsInt : __flagsCtx.reasonsDoc);

    const questions =
      Array.isArray(__tpl?.questions) && __tpl.questions.length
        ? __tpl.questions
        : (layerGuess === "interview" ? __flagsCtx.qInt : __flagsCtx.qDoc);

    const fixes =
      Array.isArray(__tpl?.fixes) && __tpl.fixes.length
        ? __tpl.fixes
        : (layerGuess === "interview" ? __flagsCtx.fixInt : __flagsCtx.fixDoc);

    return { id: rawId, layer: layerGuess, title, codename, mind, reasons, questions, fixes };
  }, [detailId, __top3List, __viewRisks, __flagsCtx]);
  return (
    // ✅ embed-friendly light theme (no full-page dark, no min-h-screen)
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50 via-slate-50 to-white text-slate-900">
      {/* ✅ UI-only: subtle premium backdrop (no engine impact) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* soft color bloom (very low saturation) */}
        <div className="absolute -inset-24 bg-[radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.10),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.08),transparent_55%),radial-gradient(circle_at_50%_90%,rgba(99,102,241,0.08),transparent_60%)]" />
        {/* gentle base tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
        {/* micro grain (texture, not color) */}
        <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(rgba(2,6,23,0.9)_0.5px,transparent_0.5px)] [background-size:3px_3px]" />
      </div>
      {/* page container */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
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
        {/* ✅ PATCH (append-only): Report summary hero (top) */}
        <section className="mb-5">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold tracking-wide text-slate-500">
                  리포트 한 줄 요약
                </div>

                <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {__passPct != null ? `${__passPct}%` : "—%"}
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    {__band || "판단 유형 미정"}
                  </div>
                  {__capReasonText ? (
                    <div className="mt-2 text-[11px] text-slate-500">
                      점수 상한 적용: <span className="font-mono">{__capReasonText}</span>
                    </div>
                  ) : null}
                  {__delta != null ? (
                    <div className="ml-1 rounded-full bg-slate-900/5 px-2 py-1 text-[11px] font-semibold text-slate-700">
                      변동폭 {__delta > 0 ? `+${__delta}` : `${__delta}`}p
                    </div>
                  ) : null}
                </div>

                {__top3Keywords.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {__top3Keywords.map((k, idx) => (
                      <span
                        key={`k-${idx}`}
                        className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                        title={k}
                      >
                        <span className="mr-1 text-slate-400">#{idx + 1}</span>
                        <span className="truncate">{k}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-500">
                    핵심 키워드가 아직 생성되지 않았어요. 입력을 조금만 더 채우면 정확도가 올라갑니다.
                  </div>
                )}
              </div>


            </div>
          </div>
        </section>
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


        {/* 3) Top3 signals */}
        <section className="-mt-1 sm:mt-0 mb-5">
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 sm:p-6 shadow-sm backdrop-blur">
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
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/60 bg-violet-50/60 px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm
    transition-[border-color,background-color,box-shadow] duration-200
    hover:bg-violet-100/60 hover:border-violet-300/70 hover:ring-1 hover:ring-violet-400/15"
              >
                상세 보기 <span className="text-violet-500/80">▾</span>
              </button>
            </div>

            {/* ✅ append-only: capReason 사용자 번역 노출 (crash-safe) */}
            {(() => {
              const __ds =
                (typeof decisionScore !== "undefined" ? decisionScore : null) ||
                vm?.decisionScore ||
                vm?.decisionPack?.decisionScore ||
                window.__DBG_ACTIVE__?.decisionPack?.decisionScore ||
                window.__LAST_PACK__?.decisionPack?.decisionScore ||
                null;

              const __cr = String(__ds?.capReason || __ds?.meta?.capReason || "").trim();
              if (!__cr) return null;

              let __msg = null;

              // v1: 연차 게이트 상한
              if (__cr.includes("SENIORITY__UNDER_MIN_YEARS")) {
                const __cap = Number(__ds?.cap ?? 0);
                const __capText = Number.isFinite(__cap) && __cap > 0 ? `${__cap}%` : "상한";
                __msg = `연차 최소요건이 약간 부족해서 상한이 적용됐어요 (현재 최대 ${__capText}). 이 부분만 보완해도 합격 확률이 의미 있게 올라갈 수 있어요.`;
              }

              if (!__msg) return null;

              return (
                <div className="mt-3 rounded-2xl border border-violet-200/70 bg-violet-50/70 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-violet-900">
                    📌 합격 확률을 올릴 수 있는 포인트
                  </div>
                  <div className="mt-1 text-sm text-violet-900/90">
                    {__msg}
                  </div>
                </div>
              );
            })()}
            {/* ✅ append-only: TOOL must probe warning (missing==1 & no gate) (crash-safe) */}
            {(() => {
              const __ds =
                (typeof decisionScore !== "undefined" ? decisionScore : null) ||
                vm?.decisionScore ||
                vm?.decisionPack?.decisionScore ||
                window.__DBG_ACTIVE__?.decisionPack?.decisionScore ||
                window.__LAST_PACK__?.decisionPack?.decisionScore ||
                null;

              const __probe = __ds?.meta?.toolMustProbe || null;
              const __missingCount = Number(__probe?.missingCount);
              const __shouldGate = !!__probe?.shouldGate;

              const __isWarn =
                Number.isFinite(__missingCount) &&
                __missingCount === 1 &&
                __shouldGate === false;

              if (!__isWarn) return null;

              const __missingTools = Array.isArray(__probe?.missingTools) ? __probe.missingTools : [];
              const __mustTools = Array.isArray(__probe?.mustTools) ? __probe.mustTools : [];
              const __tool = String(__missingTools?.[0] || __mustTools?.[0] || "").trim();

              return (
                <div className="mt-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-amber-900">
                    ⚠️ 필수 툴 1개 미표기
                  </div>

                  <div className="mt-1 text-sm text-amber-900/90">
                    {__tool ? (
                      <>
                        JD에서 <span className="font-semibold">{__tool}</span>이(가){" "}
                        <span className="font-semibold">필수</span>로 보이는데, 이력서에{" "}
                        <span className="font-semibold">명시가 안 보여요</span>.
                      </>
                    ) : (
                      <>
                        JD에서 <span className="font-semibold">필수</span>로 보이는 툴 1개가 이력서에{" "}
                        <span className="font-semibold">명시가 안 보여요</span>.
                      </>
                    )}
                    <span className="ml-1">
                      (게이트는 아니지만, “표기만 추가”해도 통과 확률이 개선될 수 있어요.)
                    </span>
                  </div>
                </div>
              );
            })()}

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
                  const __cleanSurfaceText = (v) => {
                    const t = String(v ?? "").replace(/\s+/g, " ").trim();
                    if (!t) return "";
                    const low = t.toLowerCase();
                    if (low === "unknown" || low === "undefined" || low === "null") return "";
                    if (low.includes("usedai") || low.includes("ai: skipped") || low.includes("skipped")) return "";
                    return t;
                  };
                  const __isPlaceholderSurfaceText = (v) => {
                    const t = __cleanSurfaceText(v);
                    if (!t) return true;
                    if (/\?{3,}/.test(t)) return true;
                    if (t.length < 8) return true;
                    return false;
                  };
                  const __pickMeaningfulSurfaceText = (...vals) => {
                    for (const v of vals) {
                      const t = __cleanSurfaceText(v);
                      if (!t) continue;
                      if (__isPlaceholderSurfaceText(t)) continue;
                      return t;
                    }
                    return "";
                  };
                  const __pickExplainNote = (r) => {
                    const why = Array.isArray(r?.explain?.why) ? r.explain.why : [];
                    const whyRaw = Array.isArray(r?.raw?.explain?.why) ? r.raw.explain.why : [];
                    return __pickMeaningfulSurfaceText(
                      why[0],
                      why[1],
                      whyRaw[0],
                      whyRaw[1],
                      r?.reasonShort,
                      r?.raw?.reasonShort,
                      r?.oneLiner,
                      r?.raw?.oneLiner
                    );
                  };
                  const __pickEvidenceNote = (r) => {
                    const explain = r?.explain || r?.raw?.explain || {};
                    const evidence = Array.isArray(explain?.evidence) ? explain.evidence : [];
                    const signals = Array.isArray(explain?.signals) ? explain.signals : [];
                    const jdEvidence = Array.isArray(explain?.jdEvidence) ? explain.jdEvidence : [];
                    const resumeEvidence = Array.isArray(explain?.resumeEvidence) ? explain.resumeEvidence : [];
                    const c0 = __pickMeaningfulSurfaceText(evidence[0], signals[0], jdEvidence[0], resumeEvidence[0]);
                    if (c0) return `근거: ${c0}`;
                    return "";
                  };
                  const __pickSummaryNote = (r) => {
                    return __pickMeaningfulSurfaceText(
                      r?.summary,
                      r?.raw?.summary,
                      r?.description,
                      r?.raw?.description,
                      r?.contextSummary,
                      r?.raw?.contextSummary,
                      r?.note,
                      r?.message,
                      r?.raw?.message
                    );
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
                    const explainNote = __pickExplainNote(r);
                    const evidenceNote = __pickEvidenceNote(r);
                    const summaryNote = __pickSummaryNote(r);
                    const templateNote = __pickMeaningfulSurfaceText(
                      natural,
                      id === "SIMPLE__DOMAIN_SHIFT" ? "??? ??????? ?????????????????? ???" : "",
                      id === "SIMPLE__ROLE_SHIFT" ? "??? ??????????? ??????????? ?????? ???" : ""
                    );
                    const note = explainNote || evidenceNote || summaryNote || templateNote || "";

                    const statusLabel = isGate(r)
                      ? "즉시 컷"
                      : pr >= 80
                        ? "많이 관찰"
                        : pr >= 60
                          ? "자주 관찰"
                          : "관찰 요소";

                    return { __id: id, title, note: note || "이 신호가 왜 문제인지(근거)를 1~2문장으로 요약해둘게요.", statusLabel };
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
                  onClick={() => openDetail(String(x?.__id || "").trim())}

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
        {null}
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
                {/* light premium wrapper */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 shadow-lg backdrop-blur
  transition-[border-color,box-shadow] duration-200
  hover:border-violet-300/60 hover:ring-1 hover:ring-violet-400/15 hover:shadow-lg
  focus-within:border-violet-300/60 focus-within:ring-1 focus-within:ring-violet-400/15">
                  {/* soft gradient tint (B2C) */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                  >
                    <div className="absolute -inset-24 bg-[radial-gradient(circle_at_18%_12%,rgba(124,58,237,0.10),transparent_55%),radial-gradient(circle_at_82%_22%,rgba(99,102,241,0.08),transparent_55%),radial-gradient(circle_at_50%_95%,rgba(124,58,237,0.05),transparent_60%)]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/60 to-white/80" />
                  </div>

                  <div className="relative px-4 py-3 sm:px-5 sm:py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="mt-1 text-base font-semibold text-slate-900">
                          의미 기반 JD↔이력서 매칭 {ok ? "" : (status || "pending")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-700">
                      {ok ? (
                        <span>
                          Top 매칭 {matches.length}개 생성됨 (첫 실행은 모델 로딩으로 느릴 수 있어요)
                        </span>
                      ) : status === "skipped:short_input" ? (
                        <span>
                          입력이 짧아 실행하지 않았어요 (JD/이력서 각각 최소 20문장 권장) · 현재: JD {jdLen} / 이력서 {resumeLen}
                        </span>
                      ) : (
                        <span>실행 실패: {String(meta?.error || status || "unknown")}</span>
                      )}
                    </div>

                    {ok && matches.length > 0 ? (
                      <div className="mt-4 space-y-3">
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
                            <div
                              key={idx}
                              className="rounded-3xl border border-slate-200/60 bg-white/70 p-5 shadow-lg backdrop-blur
  transition-[border-color,box-shadow] duration-200
  hover:border-violet-300/60 hover:ring-1 hover:ring-violet-400/15 hover:shadow-lg
  focus-within:border-violet-300/60 focus-within:ring-1 focus-within:ring-violet-400/15"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-baseline gap-2">
                                  <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                                    {Math.round(s * 100)}%
                                  </div>
                                  <div className="text-[11px] font-semibold text-slate-600">
                                    매칭률
                                  </div>
                                </div>

                                <div className="text-[11px] font-medium text-slate-500">
                                  유사 표현 {Array.isArray(m?.candidates) ? m.candidates.length : 0}개 감지
                                </div>
                              </div>

                              <div className="mt-4 space-y-4">

                                {/* JD 요구 */}
                                <div>
                                  <div className="text-[11px] font-medium text-slate-500">
                                    JD 요구
                                  </div>
                                  <div className="mt-1 rounded-xl bg-slate-100/70 p-3 text-[13px] leading-relaxed text-slate-900">
                                    {jdText.slice(0, 120)}
                                  </div>
                                </div>

                                {/* 연결 표시 */}
                                <div className="flex items-center justify-center">
                                  <span className="text-slate-400 text-sm">↓</span>
                                </div>

                                {/* 이력서 대응 */}
                                <div>
                                  <div className="text-[11px] font-medium text-slate-500">
                                    이력서 대응
                                  </div>
                                  <div className="mt-1 rounded-xl border border-violet-200/50 bg-violet-50/60 p-3 text-[13px] leading-relaxed text-slate-900">
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
                </div>
              </section>
            );
          } catch {
            return null;
          }
        })()}


        {/* 4) Pass position */}
        <section className="mb-5">
          <GlassHeroCard>
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
          </GlassHeroCard>
        </section>
        {/* 5.5) Coaching CTA (migrated from App.jsx) */}
        {!hideNextStep && (
          <section className="mb-6">
            <div className="overflow-hidden rounded-3xl bg-white/70 backdrop-blur shadow-[0_18px_55px_rgba(2,6,23,0.10)] ring-1 ring-black/5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/15 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-300/25">
                      🧩 다음 단계(선택)
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      원하시면 여기서 “상담/전략 설계”로 이어갈 수 있어요
                    </span>
                  </div>

                  <div className="mt-2 text-base font-semibold tracking-tight text-slate-900 sm:text-[17px]">
                    상세 전략은 전략 설계 세션에서 제공합니다.
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    리포트 톤(퍼플/인디고)과 맞춘 안내 카드입니다.
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center rounded-full bg-indigo-600/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-600/15">
                    Guide
                  </span>
                </div>
              </div>

              {/* Body (기존 내용 유지: 구조만 정갈하게) */}
              <div className="px-5 py-4 sm:px-6">
                <div className="rounded-2xl bg-slate-50/70 p-4 ring-1 ring-slate-200/70">
                  <div className="text-xs font-semibold text-slate-600">
                    아래 항목 중 해당되는 걸 골라주세요
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    (문장/구조를 어떻게 고칠지 “실행 플랜”으로 바꿔드립니다)
                  </div>

                  {/* ✅ 여기부터 아래는 원래 파일에 있던 내용(버튼/링크/문구/리스트)을 그대로 유지하세요.
                      아래 div 래퍼만 남기고, 기존의 본문 블록을 이 안에 붙여 넣으면 됩니다. */}
                  <div className="mt-3">
                    {/* ORIGINAL CTA BODY START */}
                    {/* 원래 있던 <div className="mt-4 rounded-xl border bg-slate-50/60 p-4"> ... </div>
                        내부 내용을 여기에 그대로 옮기세요. */}
                    {/* ORIGINAL CTA BODY END */}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(79,70,229,0.25)] hover:bg-indigo-700"
                    onClick={() => {
                      try { window.__DBG_CTA_CLICK__ = { at: Date.now(), kind: "strategy_session" }; } catch { }
                    }}
                  >
                    전략 설계 세션 알아보기 →
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-600/20 hover:bg-indigo-600/5"
                    onClick={() => {
                      try { window.__DBG_CTA_CLICK__ = { at: Date.now(), kind: "chat" }; } catch { }
                    }}
                  >
                    가볍게 문의하기
                  </button>
                  <span className="text-xs text-slate-500">
                    (원색/테두리 중첩 제거 → 톤앤매너 통일)
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ✅ PATCH (append-only): Top3 "더보기" 비밀 수첩 모달 */}
        {detailOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
              onClick={closeDetail}
            />
            <div className="relative mx-auto flex min-h-full w-full items-start justify-center px-4 pt-[82vh] pb-8 overflow-y-auto">
              <div className="mx-auto w-[min(720px,92vw)] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
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
      data-modal="detail"
      role="dialog"
      aria-modal="true"
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
