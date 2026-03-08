import React, { useEffect, useMemo, useState } from "react";
import GlassHeroCard from "./ui/GlassHeroCard.jsx";

// append-only: passProbability SSOT 湲곕컲 ?占쎈꺼 ?占쎌닔 (?占쎌슜 湲덌옙?: bandLabel, pass.percent, pass.percentText, __posPct)
function getPassLabel(p) {
  if (p >= 90) return "강력 합격권";
  if (p >= 80) return "합격권";
  if (p >= 70) return "경계 합격권";
  if (p >= 60) return "경계";
  if (p >= 45) return "위험";
  if (p >= 30) return "낮음";
  return "매우 낮음";
}

// append-only: Layer 3 modifier ??passProbability band 湲곕컲 (base character? ?낅┰)
function getModifier(p) {
  const n = Number.isFinite(Number(p)) ? Number(p) : -1;
  if (n >= 85) return "완성형";
  if (n >= 70) return "강인형";
  if (n >= 55) return "탐색형";
  if (n >= 40) return "교정비형";
  if (n >= 0)  return "보강형";
  return "";
}

// append-only: Layer 2 ??由ъ뒪???쒓렇??湲곕컲 罹먮┃???꾩텧 (v2)
// ?곗꽑?쒖쐞 洹몃９: gate 2媛쒋넁 > 蹂댁셿??> ?먰봽??> 媛쒖쿃??> ?좎옱?ν삎 > ?뺢탳???ㅼ쟾媛 > 洹좏삎??
const __CHARACTER_PRIORITY = [
  {
    character: "보완형 도전자",
    keys: new Set(["MUST_HAVE_MISSING", "ROLE_SKILL__MUST_HAVE_MISSING", "TOOL_MISSING"]),
  },
  {
    character: "점프형 도전자",
    keys: new Set(["SENIORITY_UNDER_MIN_YEARS", "TITLE_SENIORITY_MISMATCH"]),
  },
  {
    character: "개척형 전환가",
    keys: new Set(["ROLE_DOMAIN_SHIFT", "DOMAIN_MISMATCH", "TITLE_DOMAIN_SHIFT"]),
  },
  {
    character: "잠재력형 후보",
    keys: new Set(["EVIDENCE_THIN"]),
  },
];

function __extractSignalKey(signal) {
  // ?곗꽑?쒖쐞: canonicalKey > rawRiskId > id
  return String(
    signal?.canonicalKey || signal?.rawRiskId || signal?.id || signal?.raw?.id || ""
  ).toUpperCase().trim();
}

function deriveCharacterFromSignals(topSignals, gateCount) {
  const signals = Array.isArray(topSignals) ? topSignals : [];
  const gc = Number.isFinite(Number(gateCount)) ? Number(gateCount) : 0;
  // gate 2媛??댁긽 ???꾨㈃ ?ъ꽕怨꾪삎
  if (gc >= 2) return "정면 보수형";
  // ?쒓렇???놁쓬 ???뺢탳???ㅼ쟾媛
  if (signals.length === 0) return "균형형 도전자";
  // 怨좎젙 ?곗꽑?쒖쐞 洹몃９ ?쒖꽌濡?留ㅼ묶 (top1 ?쒖꽌 臾닿?)
  for (const { character, keys } of __CHARACTER_PRIORITY) {
    for (const signal of signals) {
      const key = __extractSignalKey(signal);
      if (!key) continue;
      for (const k of keys) {
        if (key.includes(k)) return character;
      }
    }
  }
  // 留ㅼ묶 ?놁쓬 ??洹좏삎??吏?먯옄
  return "균형형 도전자";
}

export default function SimulatorLayout({ simVM, hideNextStep = false }) {
  const vm = simVM || {};
  try { window.__LAST_SIM_VM__ = vm; } catch { }
  // ??PATCH (append-only): "?占쎈낫占? 鍮꾬옙? ?占쎌꺽 紐⑤떖 ?占쏀깭/?占쏀띁 (諛섎뱶??return ?占쎌쟾, ?占쎌닔 ?↔?)
  // [CONTRACT] gate ?占쎌젙 湲곤옙?: ?占쎄퇋?占쎈맂 layer === "gate" ?占쎈룆.
  // raw.layer fallback 湲덌옙?, group("gates") 湲곕컲 ?占쎌젙 湲덌옙?.
  const __top3List = (Array.isArray(vm?.top3) && vm.top3.length ? vm.top3 : [])
    .filter((x) => String(x?.layer || "").toLowerCase() === "gate")
    .slice(0, 3);
  // ??PATCH (append-only): Report summary hero inputs (no engine changes)
  const __passPct =
    Number.isFinite(Number(vm?.passProbability))
      ? Math.round(Number(vm.passProbability))
      : (Number.isFinite(Number(vm?.pass?.pct)) ? Math.round(Number(vm.pass.pct)) : null);

  // append-only: passProbability SSOT 湲곕컲?占쎈줈 ?占쎌씪 (湲곗〈 bandLabel ?占쎌슜 湲덌옙?)
  const __band = (() => {
    const p = Number.isFinite(Number(vm?.passProbability)) ? Number(vm.passProbability) : null;
    if (p != null) return getPassLabel(p);
    return (vm?.pass?.bandLabel || vm?.interpretation?.label || vm?.bandLabel || "").toString();
  })();

  // append-only: Layer 2 ??gateCount??top3 諛곗뿴 湲몄씠媛 ?꾨땲??gateTriggered===true ?쒓렇????湲곕컲
  const __gateTriggeredCount = (Array.isArray(vm?.top3) ? vm.top3 : [])
    .filter((x) => x?.gateTriggered === true).length;
  const __character = deriveCharacterFromSignals(
    Array.isArray(vm?.top3) ? vm.top3 : [],
    __gateTriggeredCount
  );
  // append-only: modifier ??passProbability band 湲곕컲, base character? ?낅┰ SSOT
  const __modifier = getModifier(vm?.passProbability);

  // ??PATCH (append-only): score cap reason (engine ??UI safe bridge)
  // - ?占쎌꽑?占쎌쐞: simVM(vm) ?占쎌뿉 ?占쎈젮?占쎈㈃ 洹멸구 ?占쎌꽑
  // - ?占쎌쑝占?window.__DBG_ACTIVE__/__LAST_PACK__ ???占쎈쾭占?寃쎈줈?占쎌꽌 理쒙옙????占쎌닔
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
  // ??PATCH (append-only): Analyzer Issues "?占쎈낫占? 紐⑤떖 ?占쏀깭
  const [issuesOpen, setIssuesOpen] = useState(false);
  try {
    // 肄섏넄?占쎌꽌 window.__OPEN_DETAIL__("GATE__AGE") 媛숋옙? ?占쎌쑝占?媛뺤젣 ?占쎌텧 媛??
    window.__OPEN_DETAIL__ = (id) => openDetail(String(id || "").trim());
  } catch { }
  const [detailId, setDetailId] = useState(__top3List?.[0]?.id || "");

  const openDetail = (id) => {
    const nextId = String(id || "").trim();
    setDetailId(nextId || String(((Array.isArray(__viewRisks) && __viewRisks.length && (__viewRisks[0]?.id || __viewRisks[0]?.raw?.id)) || (__top3List?.[0]?.id || __top3List?.[0]?.raw?.id) || "") || "").trim());
    setDetailOpen(true);
  };

  const closeDetail = () => setDetailOpen(false);

  // ??PATCH (append-only): flags/summary 湲곕컲 ?占쎌뿰??而⑦뀓?占쏀듃
  const __flagsCtx = useMemo(() => {
    const flags = (window.__DBG_ANALYSIS__?.structuralPatterns?.flags || [])
      .map((x) => String(x?.id || x?.key || x?.code || "").trim())
      .filter(Boolean);

    const summaryForAI = String(window.__DBG_ANALYSIS__?.structureSummaryForAI || "").trim();
    const has = (id) => flags.includes(id);

    const reasonsDoc = [];
    if (has("MUST_HAVE_SKILL_MISSING")) reasonsDoc.push("JD 필수 요건이 이력서 bullet에서 바로 확인되지 않습니다.");
    if (has("JD_KEYWORD_ABSENCE_PATTERN")) reasonsDoc.push("JD 핵심 키워드가 이력서 문장과 충분히 연결되지 않습니다.");
    if (has("LOW_SEMANTIC_SIMILARITY_PATTERN")) reasonsDoc.push("JD와 이력서의 문장 유사도가 낮아 방향성이 다른 지원으로 해석될 수 있습니다.");
    if (has("LOW_CONTENT_DENSITY_PATTERN")) reasonsDoc.push("근거 문장 밀도가 낮아 주장형 서술로 보일 수 있습니다.");
    if (has("LOW_ROLE_SPECIFICITY_PATTERN")) reasonsDoc.push("역할/책임 범위가 구체적으로 드러나지 않습니다.");
    if (has("VENDOR_LOCK_PATTERN")) reasonsDoc.push("벤더/특정 환경 의존 신호로 확장성 검증 질문이 생길 수 있습니다.");

    const reasonsInt = [];
    if (summaryForAI.toLowerCase().includes("ownership evidence low")) reasonsInt.push("오너십/주도권 근거가 약합니다.");

    const sem = window.__DBG_ANALYSIS__?.structuralPatterns?.metrics?.semanticSimilarity;
    if (typeof sem === "number" && Number.isFinite(sem) && sem < 0.10) {
      reasonsDoc.unshift("JD와 이력서의 연결이 약해 적합성 의심을 받을 수 있습니다.");
    }

    return {
      flags,
      summaryForAI,
      docMind: [
        "지원자 이야기가 좋아 보여도, 검증 가능한 근거가 먼저 보이는지 확인해야 합니다.",
        "핵심을 확인하는 질문을 먼저 하겠습니다.",
      ],
      intMind: [
        "표현이 좋아 보여도 실제 권한과 결정 범위를 먼저 확인해야 합니다.",
        "책임 범위를 명확히 확인하겠습니다.",
      ],
      reasonsDoc: reasonsDoc.length ? reasonsDoc : ["근거 문장이 얕아 보여 확인 질문이 필요합니다."],
      reasonsInt: reasonsInt.length ? reasonsInt : ["의사결정/책임 범위가 모호하면 실무 검증 질문이 필요합니다."],
      qDoc: [
        "그래서 구체적으로 어떤 개선을 만들었나요?",
        "JD 필수 요건은 어디에서 어떻게 증명할 수 있나요?",
      ],
      qInt: [
        "본인이 직접 결정한 것은 무엇이었나요?",
        "리스크나 갈등 상황에서 어떤 판단을 했나요?",
      ],
      fixDoc: [
        "JD 핵심 요건 3개를 골라 각 요건당 1~2개 근거 bullet을 붙이세요.",
        "성과는 기간/수치가 포함된 Before/After로 제시하세요.",
      ],
      fixInt: [
        "각 프로젝트 첫 줄에 본인 권한과 결정 1개를 고정해 쓰세요.",
        "결과보다 판단과 실행 과정을 함께 설명하세요.",
      ],
    };
  }, [vm?.meta?.primaryGroup, vm?.meta?.totalCount]);
  // ??PATCH (append-only): 由ъ뒪?占쎈퀎 鍮꾬옙??占쎌꺽 ?占쏀뵆占??占쎌쟾 + ?占쏀깮 ?占쏀띁
  // - 湲곕낯媛믭옙? __flagsCtx(doc/int)占??占쎈갚 (?占쎌젙???↔?)
  // - ?占쎈옒 留듭뿉 rawId(=risk id)占?怨꾩냽 異뷂옙??↔?占?"占?由ъ뒪?占쎈퀎 ?占쎌슜 臾멸뎄"媛 ?占쎈땲??
  const __NOTE_TEMPLATES = useMemo(() => {
    return {
      SIMPLE__BASELINE_GUIDE: {
        codename: "(The baseline guide case)",
        mind: [
          "자료가 부족하면 판단이 보수적으로 흐를 수 있습니다.",
          "사실 확인 질문을 먼저 진행하겠습니다.",
        ],
        reasons: [
          "JD와 이력서의 직접 연결 근거가 약하면 서류 단계에서 보수적으로 해석됩니다.",
          "핵심 요구조건 대비 증빙이 약하면 평가가 쉽게 올라가지 않습니다.",
        ],
        questions: [
          "지원 직무와 맞는 대표 성과 1~2개를 숫자로 설명해 주실 수 있나요?",
          "JD 필수 요건을 어디에서 어떻게 증명할 수 있나요?",
        ],
        fixes: [
          "JD 필수 요건 3개를 골라 각 요건별 증거 bullet을 1~2개씩 추가하세요.",
          "성과는 Before/After(기간, 수치) 형태로 최소 1개 이상 제시하세요.",
        ],
      },
      GATE__AGE: {
        codename: "(The seniority-fit check case)",
        mind: [
          "연차와 직급 밴드의 정합성을 먼저 확인합니다.",
          "조건이 맞지 않으면 초기 단계에서 보수적으로 판단됩니다.",
        ],
        reasons: [
          "연차 구간 대비 기대 레벨 차이가 크면 리스크로 해석될 수 있습니다.",
          "서류 단계에서 빠르게 컷오프될 신호로 작동할 수 있습니다.",
        ],
        questions: [
          "현재 연차 기준으로 맡은 책임 수준을 설명해 주실 수 있나요?",
          "해당 레벨에 맞는 리드 경험이 있나요?",
        ],
        fixes: [
          "본인이 맡은 권한/의사결정/리딩 범위를 bullet로 명확히 쓰세요.",
          "직급 수준에 맞는 성과를 수치 중심으로 제시하세요.",
        ],
      },
      GATE__SALARY_MISMATCH: {
        codename: "(The compensation mismatch case)",
        mind: [
          "희망연봉이 밴드 밖이면 진행 자체가 어려워질 수 있습니다.",
          "연봉 적합성을 우선 확인합니다.",
        ],
        reasons: [
          "보상 밴드 불일치는 초기 단계의 주요 탈락 사유가 됩니다.",
          "밴드 근거가 약하면 레벨 과다요구로 해석될 수 있습니다.",
        ],
        questions: [
          "희망연봉의 근거(시장가, 성과, 현재 보상)를 설명해 주실 수 있나요?",
          "이 직무 수준에서 수용 가능한 보상 범위는 어떻게 보시나요?",
        ],
        fixes: [
          "희망연봉 범위를 제시하고 근거를 함께 명시하세요.",
          "레벨에 맞는 임팩트 사례를 먼저 제시해 보상 근거를 강화하세요.",
        ],
      },
      SIMPLE__DOMAIN_SHIFT: {
        codename: "(The domain transition check case)",
        mind: [
          "도메인이 다르면 전이 가능성 근거를 우선 확인합니다.",
          "추가 학습 비용을 보수적으로 반영할 수 있습니다.",
        ],
        reasons: [
          "도메인 차이가 크면 즉시전력성에 의문이 생길 수 있습니다.",
          "전이 논리가 약하면 적합성 리스크로 연결됩니다.",
        ],
        questions: [
          "기존 경험이 이 포지션 문제 해결에 어떻게 전이되는지 설명해 주세요.",
          "새 도메인에서 빠르게 성과를 내기 위한 접근을 설명해 주세요.",
        ],
        fixes: [
          "기존 경험 1개와 JD 핵심 과업 1개를 1:1로 연결해 작성하세요.",
          "도메인 지식보다 문제 해결 방식의 공통점을 강조하세요.",
        ],
      },
      SIMPLE__ROLE_SHIFT: {
        codename: "(The role transition check case)",
        mind: [
          "직무 전환의 실제 수행 가능성을 먼저 확인합니다.",
          "언어만 유사하고 실무가 다르면 리스크가 커집니다.",
        ],
        reasons: [
          "직무 전환은 과업/성과/프로세스 정합성에서 빠르게 판별됩니다.",
          "직무 언어가 부족하면 실행 가능성이 낮게 평가될 수 있습니다.",
        ],
        questions: [
          "이 직무의 핵심 KPI를 어떻게 정의하시나요?",
          "현재 역할에서 해당 KPI에 연결된 성과가 있나요?",
        ],
        fixes: [
          "JD 핵심 KPI 3개에 대해 본인 증거 bullet을 매칭해 작성하세요.",
          "프로세스 경험은 입력-처리-산출물 구조로 설명하세요.",
        ],
      },
    };
  }, []);
  // ??PATCH (append-only): ?占쏀뵆占?而ㅻ쾭由э옙? ?↔???"missing id" ?占쎈룞 ?占쎌쭛/?占쎌텧
  // - Top3留뚯씠 ?占쎈땲?? ?占쎌쭊??留뚮뱺 riskResults ?占쎌껜?占쎌꽌 id ?占쎌쭛
  // - __NOTE_TEMPLATES???占쎈뒗 id占?missing?占쎈줈 ?占쎈━
  // - 寃곌낵: window.__DBG_NOTE_MISSING__.missing = ["SOME_ID", ...]
  const __DBG_NOTE_MISSING = useMemo(() => {
    const __idSet = new Set();

    const __addFromList = (list) => {
      const arr = Array.isArray(list) ? list : [];
      for (const r of arr) {
        const id = String(r?.id || r?.raw?.id || r?.code || r?.raw?.code || "").trim();
        if (id) __idSet.add(id);
      }
    };

    // 1) UI?占쎌꽌 蹂닿퀬 ?占쎈뒗 Top3
    __addFromList(vm?.top3);

    // 2) ?占쎌쭊/?占쎈쾭占?寃쎈줈?占쎌꽌 媛?占쏀븳 riskResults ?占쎈낫???占쎈옒???占쎌씠??
    try {
      const a =
        (typeof window !== "undefined" &&
          (window.__DBG_ACTIVE__ || window.__DBG_ANALYSIS__ || window.__LAST_PACK__ || null)) ||
        null;

      // decisionPack 湲곕컲
      __addFromList(a?.decisionPack?.riskResults);
      __addFromList(a?.decisionPack?.riskLayer?.riskResults);

      // ??ADD (append-only): full risk feed (detail profiles)
      __addFromList(a?.decisionPack?.riskFeed);

      // reportPack 湲곕컲
      __addFromList(a?.reportPack?.riskLayer?.riskResults);
      __addFromList(a?.reportPack?.riskLayer?.results);
      __addFromList(a?.reportPack?.riskLayer?.risks);

      // ??ADD (append-only): reportPack decisionPack/riskFeed (寃쎈줈 ?占쎌뼇??蹂닿컯)
      __addFromList(a?.reportPack?.decisionPack?.riskFeed);
      __addFromList(a?.reportPack?.decisionPack?.riskResults);
      __addFromList(a?.reportPack?.riskFeed);

      // riskLayer 吏곸젒
      __addFromList(a?.riskLayer?.riskResults);
      __addFromList(a?.riskLayer?.results);
      __addFromList(a?.riskLayer?.risks);
    } catch {
      // ignore
    }

    const allIds = Array.from(__idSet);

    // "?占쏀뵆由우씠 ?占쎈뒗 id" = exact match 湲곤옙?
    const missing = allIds.filter((id) => !(__NOTE_TEMPLATES && __NOTE_TEMPLATES[id]) && !(String(id).startsWith("DRIVER__DOCUMENT__") || String(id).startsWith("DRIVER__INTERVIEW__")));

    return {
      allIds,
      missing,
      counts: { all: allIds.length, missing: missing.length, templates: Object.keys(__NOTE_TEMPLATES || {}).length },
      updatedAt: Date.now(),
    };
  }, [vm?.top3, __NOTE_TEMPLATES]);

  // window???占쎌텧 + 肄섏넄 ??占?濡쒓렇(?占쏀븯占??占쎌쨷????↔ 媛??
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
  // ??PATCH (append-only): missing ids ???占쏀뵆占??占쎌펷?占쏀넠 肄붾뱶 ?占쎈룞 ?占쎌꽦占?
  // - window.__DBG_NOTE_TEMPLATE_SKELETON__.code 占?蹂듭궗?占쎌꽌 __NOTE_TEMPLATES ?占쎌뿉 遺숈씠占???
  const __DBG_NOTE_TEMPLATE_SKELETON = useMemo(() => {
    const missing = Array.isArray(__DBG_NOTE_MISSING?.missing) ? __DBG_NOTE_MISSING.missing : [];

    const __mkStub = (id) => {
      const isGate = String(id).startsWith("GATE__");
      const isSimple = String(id).startsWith("SIMPLE__");
      const isDriverDoc = String(id).startsWith("DRIVER__DOCUMENT__");
      const isDriverInt = String(id).startsWith("DRIVER__INTERVIEW__");

      const codename =
        isGate ? "(The ?占쎌“占??占쏀꽣??耳?占쎌뒪)" :
          isDriverInt ? "(The ?占쎌콉???占쎈꼫??寃利앾옙?耳?占쎌뒪)" :
            isDriverDoc ? "(The ?占쎌꽌占?洹쇨굅 ?占쏀븿??耳?占쎌뒪)" :
              isSimple ? "(The ??占?吏꾨떒??耳?占쎌뒪)" :
                "(The ?占쎌텛媛 ?占쏀뵆占??占쎌슂??耳?占쎌뒪)";

      const mind0 =
        isGate ? "현재 구간트↔ ↔↔ 占심몌옙 ↔↔占쌉니댐옙." :
          isDriverInt ? "현재 구간/책↔/현재 구간占?↔↔ 확↔占쌔억옙 占쌌니댐옙." :
            "占쌕거몌옙 확↔占싹댐옙 ↔↔↔ 占쎌선占쌉니댐옙.";

      const mind1 =
        isGate ? "↔ ↔↔↔ 占쌔소듸옙↔ ↔↔占?↔↔ 占쏠가뤄옙 占싼어가↔ ↔틱↔求占?" :
          "占싼듸옙 현재 구간↔↔占싸댐옙 占실댐옙↔ 占쌕꾸깍옙 ↔틱↔求占?";

      const reasons0 =
        isGate ? "?占쎈쪟/1李⑥뿉??鍮좊Ⅴ占??占쏀꽣留곷릺??議곌굔 ?占쏀샇占??占쎌씪 ???占쎌쓬" :
          isDriverInt ? "?占쎈꼫??二쇰룄占?洹쇨굅媛 ?占쏀븯占??占쎄뎄寃쎈쭔 ???占쎈엺?占쎌쑝占??占쏀빐?????占쎌쓬" :
            "洹쇨굅 臾몄옣???占쎌쑝占??↔?占?鍮꾩슜?占쎌씠 ?占쎈씪媛 蹂댁닔?占쎌쑝占??↔??????占쎌쓬";

      const q0 =
        isGate ? "↔ ↔↔(↔占?↔↔/↔占?↔ 占쏘떻↔ ↔↔ ↔ 占쌍댐옙↔ ↔↔↔ 占쌍쇽옙↔." :
          isDriverInt ? "↔현재 구간 ↔↔↔ 占싶곤옙 책↔ ↔↔↔ ↔체↔현재 구간↔ 占쌍쇽옙↔." :
            "↔체↔현재 구간↔ 占쌩곤옙 占쏘떤 ↔↔占?占승댐옙↔ ↔↔↔ 占쌍쇽옙↔.";

      const fix0 =
        isGate ? "議곌굔 ?占쏀빀??洹쇨굅(?占쎈꺼/梨낆엫/?占쎄낵/?占쎌옣媛)占?癒쇽옙? ?占쎌떆???占쎌쭊??媛?↔??占쏀깭占?留뚮뱶?占쎌슂." :
          isDriverInt ? "占??占쎈줈?占쏀듃 bullet???占쎈궡 沅뚰븳/寃곗젙 1媛쒋숋옙? 怨좎젙??梨낆엫 踰붿쐞占??占쎈챸?占쎄쾶 留뚮뱶?占쎌슂." :
            "JD ?占쎄굔 1媛쒕떦 1~2占?洹쇨굅 bullet??遺숈씠占? Before/After ?占쎌튂占?寃占?媛?占쏀븯占?留뚮뱶?占쎌슂.";

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
        ? "// (missing ?占쎌쓬) 異뷂옙? ?占쏀뵆由우씠 ?占쎌슂?↔? ?占쎌뒿?占쎈떎."
        : [
          "// -----------------------",
          "// ??AUTO-GENERATED: missing template stubs",
          "// - ?占쎈옒 釉붾줉??__NOTE_TEMPLATES return 媛앹껜 ?占쎌뿉 洹몌옙?占?遺숈뿬?占쎄퀬, 臾멸뎄占??占쎈벉?占쎈㈃ ?占쎈땲??",
          "// -----------------------",
          ...missing.map(__mkStub),
        ].join("\n");

    return {
      missing,
      code,
      updatedAt: Date.now(),
    };
  }, [__DBG_NOTE_MISSING]);

  // window ?占쎌텧 + 肄섏넄 異쒕젰(?占쎈쾭洹몄슜)
  // ???占쎌슂 ?占쎌쑝占??占쎌쨷????useEffect占???↔?占쎈룄 ??
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
    // 1.5) DRIVER (?占쎌쟻 ?占쎌슜 ?占쏀뵆占? - fallback ?占쎌씠 id蹂꾨줈 ?占쎌꽦
    // - analyzer.js: id = `DRIVER__${layer.toUpperCase()}__${idx}`
    // - layer: document / interview
    {
      const m = id.match(/^DRIVER__(DOCUMENT|INTERVIEW)__(\d+)$/);
      if (m) {
        const kind = String(m[1] || "").toUpperCase(); // DOCUMENT | INTERVIEW
        const idx = Number(m[2] || 0);

        // ?占쎈Ц ?占?↔?(媛?占쏀븯占? 李얠븘??"吏꾩쭨 硫댁젒愿 硫붾え" ?占쎈굦 媛뺥솕
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

        const label = kind === "DOCUMENT" ? "문서/근거" : "질문/답변";
        const codename = `(The ${label} 리스크 드라이버 #${idx + 1})`;

        return {
          codename,
          mind: [
            `이번 ${label}에서 '찜찜한 원인'이 하나 걸린 케이스입니다.`,
            title ? `특히 "${title}" 이 문장이 방아쇠로 작동했습니다.` : "지금 보이는 단서가 무엇인지 먼저 분해해야 합니다.",
          ],
          reasons: [
            kind === "DOCUMENT"
              ? "문서에서 '근거 없이 주장만 있는 문장'이 보이면 검증 비용이 급증해 보수적으로 판단됩니다."
              : "면접에서 논리 점프/답변 붕괴가 보이면 실무에서 설명 비용이 커질 위험으로 봅니다.",
            `DRIVER 계열은 idx가 클수록 '부차적이지만 누적되면 치명적인' 신호로 봅니다.`,
          ],
          questions: [
            kind === "DOCUMENT"
              ? "이 문장을 증명해주는 재료/수치/전후 비교가 하나라도 있나요?"
              : "지금 설명의 앞뒤가 맞나요? 기준/우선순위/의사결정이 어디서 바뀌었는지 말로 정리해보세요.",
            title
              ? `"${title}" 주장에 대해 1)상황 2)행동 3)결과(수치) 4)내 기여를 30초로 말해보면?`
              : "가장 강한 근거 1개만 뽑아 30초 안에 설득 가능한 형태로 말해보면?",
          ],
          fixes: [
            kind === "DOCUMENT"
              ? "해당 문장을 '근거 문장(수치/링크/산출물) + 해석(내 기여) + 결과' 구조로 재작성하세요."
              : "설명 구조를 '문제 -> 맥락 -> 결정(이유) -> 실행 -> 결과 -> 배운 점' 6문장으로 고정하세요.",
            title
              ? `지금 쓰는 "${title}" 같은 문장에는 반드시 바로 아래에 '증거 1줄'을 붙이세요.`
              : "추상적 슬로건 문장(혁신/전략) 대신 사실+수치로 구체화하세요.",
          ],
        };
      }
    }
    // 2) prefix / group fallbacks (append-only)
    if (id.startsWith("GATE__")) {
      return {
        codename: "(The 조건 필터 케이스)",
        mind: [
          "현재 구간에서 먼저 보는 조건 신호입니다.",
          "이 조건이 충족되어야 다음 구간 판단으로 넘어갈 수 있습니다.",
        ],
        reasons: ["서류 단계에서 빠르게 필터링될 조건 신호로 작동할 수 있습니다."],
        questions: ["이 조건(연차/레벨/연봉)을 어떻게 맞췄는지 근거를 설명해 주세요."],
        fixes: ["조건 정합성 근거(레벨/책임/성과/시장가)를 먼저 제시해 엔진이 판단 가능한 상태를 만드세요."],
      };
    }

    if (id.startsWith("DRIVER__INTERVIEW__") || layer === "interview") {
      return {
        codename: "(The 질문 검증 지원자)",
        mind: __flagsCtx.intMind,
        reasons: __flagsCtx.reasonsInt,
        questions: __flagsCtx.qInt,
        fixes: __flagsCtx.fixInt,
      };
    }

    // default: document
    return {
      codename: "(The 문서 중심 지원자)",
      mind: __flagsCtx.docMind,
      reasons: __flagsCtx.reasonsDoc,
      questions: __flagsCtx.qDoc,
      fixes: __flagsCtx.fixDoc,
    };
  };
  // ??PATCH (append-only): NOTE_TEMPLATES coverage report (debug only)
  // - ?占쎈뼡 id媛 "?占쎌슜 ?占쏀뵆占????占?↔? vs "prefix fallback" vs "default fallback"?↔? ?占쎌씤
  // - UI/?占쎌쭊 臾댁쁺?? 肄섏넄 異쒕젰 + window.__DBG_NOTE_COVERAGE__ ?占쎈깄?占쎈쭔 ?↔?
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
  // ??PATCH (append-only): viewRisks (detail modal source)
  // - prefer decisionPack.riskFeed (full detail titles) ??fallback to riskResults / reportPack / riskLayer
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

    const title = String(picked?.title || picked?.message || rawId || "리스크 신호 보기").trim();

    // ???占쏀뵆占??占쎌꽑 (?占쎌쑝占?湲곗〈 flagsCtx ?占쎈갚)
    const __tpl =
      (typeof __NOTE_TEMPLATES === "object" && __NOTE_TEMPLATES && rawId &&
        __NOTE_TEMPLATES[rawId])
        ? __NOTE_TEMPLATES[rawId]
        : null;

    // ??codename?占??占쎄린??"??踰덈쭔" ?占쎌뼵 (以묐났 ?占쎌뼵 諛⑼옙?)
    const codename = String(
      (__tpl && __tpl.codename) ||
      (layerGuess === "interview" ? "(The 질문 검증 지원자)" : "(The 문서 중심 지원자)")
    ).trim();

    // interviewerNote???占쎌쭏 寃뚯씠?↔? ?占쎄낵???占쎈쭔 ?占쎌꽑 ?占쎌슜?占쎄퀬,
    // 占??占쎌뿉??湲곗〈 ?占쏀뵆占?flags fallback??洹몌옙?占??↔??占쎈떎.
    const __explainObj =
      (picked?.explain && typeof picked.explain === "object")
        ? picked.explain
        : ((picked?.raw?.explain && typeof picked.raw.explain === "object") ? picked.raw.explain : null);
    const __ivNote =
      (__explainObj?.interviewerNote && typeof __explainObj.interviewerNote === "object")
        ? __explainObj.interviewerNote
        : null;
    const __ivConcerns = Array.isArray(__ivNote?.concerns)
      ? __ivNote.concerns.map((x) => String(x || "").trim()).filter(Boolean)
      : [];
    const __ivEvidenceLine = String(__ivNote?.evidenceLine || "").trim();
    const __ivUsable = (__ivConcerns.length >= 1) || !!__ivEvidenceLine;

    const __mindFromIv =
      __ivUsable && String(__ivNote?.oneLiner || "").trim()
        ? [String(__ivNote.oneLiner).trim(), "면접관 판단 메모(리스크 엔진 기반)"]
        : [];
    const __reasonsFromIv = (() => {
      if (!__ivUsable) return [];
      const out = __ivConcerns.slice(0, 2);
      if (__ivEvidenceLine) out.push(`근거: ${__ivEvidenceLine}`);
      return out;
    })();

    const mind =
      __mindFromIv.length
        ? __mindFromIv
        : (Array.isArray(__tpl?.mind) && __tpl.mind.length
            ? __tpl.mind
            : (layerGuess === "interview" ? __flagsCtx.intMind : __flagsCtx.docMind));

    const reasons =
      __reasonsFromIv.length
        ? __reasonsFromIv
        : (Array.isArray(__tpl?.reasons) && __tpl.reasons.length
            ? __tpl.reasons
            : (layerGuess === "interview" ? __flagsCtx.reasonsInt : __flagsCtx.reasonsDoc));

    const questions =
      Array.isArray(__tpl?.questions) && __tpl.questions.length
        ? __tpl.questions
        : (layerGuess === "interview" ? __flagsCtx.qInt : __flagsCtx.qDoc);

    const __directFixes = (() => {
      const __cands = [
        picked?.explain?.action,
        picked?.raw?.explain?.action,
      ];
      const __seen = new Set();
      const __out = [];
      for (const arr of __cands) {
        if (!Array.isArray(arr)) continue;
        for (const x of arr) {
          const t = String(x || "").trim();
          if (!t) continue;
          if (__seen.has(t)) continue;
          __seen.add(t);
          __out.push(t);
          if (__out.length >= 3) return __out;
        }
      }
      return __out;
    })();

    const fixes =
      __directFixes.length
        ? __directFixes
        : (Array.isArray(__tpl?.fixes) && __tpl.fixes.length
        ? __tpl.fixes
        : (layerGuess === "interview" ? __flagsCtx.fixInt : __flagsCtx.fixDoc));

    const signalLabel = (() => {
      const t = String(title || "").trim();
      if (t) return t;
      const rid = String(rawId || "").trim();
      if (!rid) return "";
      const readable = rid
        .replace(/^.*__/, "")
        .replace(/_/g, " ")
        .trim();
      return readable || rid;
    })();

    const signalSummary = (() => {
      const __seen = new Set();
      const __out = [];
      const __pushLine = (v) => {
        const t = String(v || "").replace(/\s+/g, " ").trim();
        if (!t) return;
        if (__seen.has(t)) return;
        __seen.add(t);
        __out.push(t.length > 160 ? `${t.slice(0, 159)}...` : t);
      };
      const __pushList = (arr) => {
        if (!Array.isArray(arr)) return;
        for (const x of arr) __pushLine(x);
      };
      const __pushEvidence = (ev) => {
        if (!ev) return;
        if (Array.isArray(ev)) {
          __pushList(ev);
          return;
        }
        if (typeof ev === "string") {
          __pushLine(ev);
          return;
        }
        if (typeof ev === "object") {
          for (const v of Object.values(ev)) {
            if (Array.isArray(v)) __pushList(v);
            else __pushLine(v);
          }
        }
      };

      __pushList(picked?.explain?.why);
      __pushList(picked?.raw?.explain?.why);
      __pushEvidence(picked?.raw?.evidence);
      __pushList(picked?.raw?.explain?.jdEvidence);
      __pushList(picked?.raw?.explain?.resumeEvidence);
      __pushList(picked?.explain?.jdEvidence);
      __pushList(picked?.explain?.resumeEvidence);
      __pushList(picked?.explain?.evidence);
      __pushList(picked?.raw?.explain?.evidence);

      return __out.slice(0, 2);
    })();

    const __pickEvidenceLine = (() => {
      const __collect = (src, out) => {
        if (!src) return;
        if (Array.isArray(src)) {
          for (const v of src) __collect(v, out);
          return;
        }
        if (typeof src === "object") {
          for (const v of Object.values(src)) __collect(v, out);
          return;
        }
        const t = String(src || "").replace(/\s+/g, " ").trim();
        if (!t) return;
        out.push(t.length > 120 ? `${t.slice(0, 119)}...` : t);
      };
      return (sources, avoid = new Set()) => {
        const list = [];
        for (const s of sources) __collect(s, list);
        const seen = new Set();
        for (const t of list) {
          if (!t || seen.has(t) || avoid.has(t)) continue;
          seen.add(t);
          return t;
        }
        return "";
      };
    })();

    const jdNeedLine = __pickEvidenceLine([
      picked?.raw?.explain?.jdEvidence,
      picked?.explain?.jdEvidence,
      picked?.raw?.explain?.why,
      picked?.explain?.why,
      picked?.raw?.evidence,
      picked?.raw?.explain?.evidence,
      picked?.explain?.evidence,
    ]);

    const resumeGapLine = __pickEvidenceLine([
      picked?.raw?.explain?.resumeEvidence,
      picked?.explain?.resumeEvidence,
      picked?.raw?.explain?.why,
      picked?.explain?.why,
      picked?.raw?.evidence,
      picked?.raw?.explain?.evidence,
      picked?.explain?.evidence,
    ], new Set(jdNeedLine ? [jdNeedLine] : []));

    return { id: rawId, layer: layerGuess, title, codename, mind, reasons, questions, fixes, signalLabel, signalSummary, jdNeedLine, resumeGapLine };
  }, [detailId, __top3List, __viewRisks, __flagsCtx]);
  return (
    // ??embed-friendly light theme (no full-page dark, no min-h-screen)
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50 via-slate-50 to-white text-slate-900">
      {/* ??UI-only: subtle premium backdrop (no engine impact) */}
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
          <div className="text-xs text-slate-500">분석 시뮬레이션</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            🎯 지금 면접관이 보는 신호를 정리해드립니다
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            현재 구간의 판단은
            <span className="text-indigo-600">정량 근거</span>를 중심으로 보이게 됩니다.
          </p>
        </div>
        {/* ??PATCH (append-only): Report summary hero (top) */}
        <section className="mb-5">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold tracking-wide text-slate-500">
                  리포트 요약
                </div>

                {/* append-only: 2-layer naming ??[modifier baseCharacter] */}
                <div className="mt-1 text-xs font-semibold tracking-wide text-indigo-500">
                  [{__modifier ? `${__modifier} ${__character}` : __character}]
                </div>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {__band || "판단 유형 미정"}
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    {__passPct != null ? `${__passPct}%` : ""}
                  </div>
                  {__capReasonText ? (
                    <div className="mt-2 text-[11px] text-slate-500">
                      현재 구간 근거: <span className="font-mono">{__capReasonText}</span>
                    </div>
                  ) : null}
                  {__delta != null ? (
                    <div className="ml-1 rounded-full bg-slate-900/5 px-2 py-1 text-[11px] font-semibold text-slate-700">
                      변화 추정 {__delta > 0 ? `+${__delta}` : `${__delta}`}p
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
                    핵심 키워드가 현재 구간에 표시되지 않았습니다. 신호는 아래 카드에서 확인할 수 있습니다.
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
                  {vm?.userType?.title || "전환 설득 준비형"}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {vm?.userType?.subtitle ||
                    "조직은 잠재력을 보지만 이 경험을 지금 역할로 연결할 수 있는지 확인하고 있습니다."}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  {vm?.userType?.stageLabel || "탐색 구간"}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {vm?.userType?.badgeLabel || "판단: 현재 구간 탐색 중"}
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
                  지금 면접관들이 가장 많이 보는 3가지
                </div>
                <div className="mt-1 text-base font-semibold">
                  신호 TOP3
                </div>
              </div>
              <button
                type="button"
                onClick={() => openDetail(__top3List?.[0]?.id || "")}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/60 bg-violet-50/60 px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm
    transition-[border-color,background-color,box-shadow] duration-200
    hover:bg-violet-100/60 hover:border-violet-300/70 hover:ring-1 hover:ring-violet-400/15"
              >
                더 보기 <span className="text-violet-500/80">+</span>
              </button>
            </div>

            {/* ??append-only: capReason ?占쎌슜??踰덉뿭 ?占쎌텧 (crash-safe) */}
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

              // v1: ?占쎌감 寃뚯씠???占쏀븳
              if (__cr.includes("SENIORITY__UNDER_MIN_YEARS")) {
                const __cap = Number(__ds?.cap ?? 0);
                const __capText = Number.isFinite(__cap) && __cap > 0 ? `${__cap}%` : "상한";
                __msg = `연차 최소요건이 일부 부족해 상한이 적용되었어요(현재 최대 ${__capText}). 이 부분만 보완해도 합격 확률이 다시 올라갈 수 있어요.`;
              }

              if (!__msg) return null;

              return (
                <div className="mt-3 rounded-2xl border border-violet-200/70 bg-violet-50/70 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-violet-900">
                    보수적 확률 상한이 적용된 이유
                  </div>
                  <div className="mt-1 text-sm text-violet-900/90">
                    {__msg}
                  </div>
                </div>
              );
            })()}
            {/* ??append-only: TOOL must probe warning (missing==1 & no gate) (crash-safe) */}
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
                    주의: 필수 신호 1개 누락
                  </div>

                  <div className="mt-1 text-sm text-amber-900/90">
                    {__tool ? (
                      <>
                        JD에서 <span className="font-semibold">{__tool}</span>(이)가{" "}
                        <span className="font-semibold">필수</span>로 보이는데, 이력서에{" "}
                        <span className="font-semibold">직접 근거가 없습니다</span>.
                      </>
                    ) : (
                      <>
                        JD에서 <span className="font-semibold">필수</span>로 보이는 항목 1개가 이력서에{" "}
                        <span className="font-semibold">직접 근거가 없습니다</span>.
                      </>
                    )}
                    <span className="ml-1">
                      (게이트는 아니지만 표기만 추가해도 통과 확률이 개선될 수 있어요)
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="mt-4 grid gap-3">
              {(() => {
                // ??PATCH: prefer engine-derived top3 (gate-first) when signals are not provided (append-only)
                const top3 = Array.isArray(vm?.top3) && vm.top3.length ? vm.top3 : null;
                if (top3) {
                  const pickText = (...vals) => {
                    const sanitize = (v) => {
                      const t = String(v ?? "").trim();
                      if (!t) return "";
                      const low = t.toLowerCase();

                      // 媛쒕컻???占쎌뒪???占쎌쟻 ?占쎄굅
                      if (
                        low.includes("usedai") ||
                        low.includes("ai: skipped") ||
                        low.includes("skipped") ||
                        low.includes("v0.")
                      ) {
                        return "";
                      }

                      // unknown/undefined/null ?占쎄굅
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
                      return { title: "연차 컷 신호", note: "연차 구간에서 서류 컷 가능성이 높게 관찰됩니다.", statusLabel: "즉시 컷" };
                    }
                    if (id === "GATE__SALARY_MISMATCH") {
                      return {
                        title: "연봉 컷 신호",
                        note: "희망연봉과 밴드 정합성에서 리스크가 높게 관찰됩니다.",
                        statusLabel: "즉시 컷",
                      };
                    }

                    const title =
                      pickText(r?.title, r?.name, r?.label) ||
                      (id === "SIMPLE__DOMAIN_SHIFT" ? "도메인 전환 리스크" : "") ||
                      (id === "SIMPLE__ROLE_SHIFT" ? "직무 전환 리스크" : "") ||
                      (id ? id : "리스크 신호");


                    // (Top3 signals ?占쎌뀡 ?↔?) ?占쎌뿰??洹쇨굅 ?占쎌꽦占?
                    const __getNaturalEvidence = (r) => {
                      // flags id 紐⑸줉
                      const flagIds = (
                        window.__DBG_ANALYSIS__?.structuralPatterns?.flags || []
                      )
                        .map((x) => String(x?.id || x?.key || x?.code || "").trim())
                        .filter(Boolean);

                      const has = (id) => flagIds.includes(id);

                      // ?占쎈컲 ?占쎌빟(?占쎈Ц) - ?占쏀꽣占??占쎈꼫??占?洹쇨굅占??占쎌슜
                      const sum = String(window.__DBG_ANALYSIS__?.structureSummaryForAI || "").trim();

                      const layer = String(r?.layer || r?.raw?.layer || "").toLowerCase();
                      const id = String(r?.id || r?.raw?.id || "").trim();

                      // 1) 臾몄꽌 湲곕컲 DRIVER ?占쎌뿰??洹쇨굅
                      if (id.startsWith("DRIVER__DOCUMENT__") || layer === "document") {
                        if (has("MUST_HAVE_SKILL_MISSING")) {
                          return "JD 필수 요건이 이력서에서 바로 확인되지 않아 서류 단계에서 불리하게 해석될 수 있습니다.";
                        }
                        if (has("JD_KEYWORD_ABSENCE_PATTERN")) {
                          return "JD 핵심 키워드가 이력서 문장과 충분히 연결되지 않아 요구조건 매칭 근거가 약하게 보일 수 있습니다.";
                        }
                        if (has("LOW_SEMANTIC_SIMILARITY_PATTERN")) {
                          return "JD와 이력서의 문장 유사도가 낮아 방향성이 다른 지원으로 해석될 가능성이 있습니다.";
                        }
                        if (has("LOW_CONTENT_DENSITY_PATTERN")) {
                          return "불릿/근거 문장 밀도가 낮아 면접관 확인 질문이 많아질 수 있습니다.";
                        }
                        if (has("LOW_ROLE_SPECIFICITY_PATTERN")) {
                          return "역할·책임 범위가 구체적으로 드러나지 않아 기존 직무 대비 적합성이 낮게 보일 수 있습니다.";
                        }
                        return ""; // fallback?占??占쎈옒?占쎌꽌 泥섎━
                      }

                      // 2) ?占쏀꽣占?湲곕컲 DRIVER ?占쎌뿰??洹쇨굅 (?占쎈꼫??梨낆엫 ?占쎈꺼)
                      if (id.startsWith("DRIVER__INTERVIEW__") || layer === "interview") {
                        // structureSummaryForAI??'Ownership evidence LOW'媛 ?占쎌젣占??占쎌쓬
                        if (sum.toLowerCase().includes("ownership evidence low")) {
                           return "주도권과 오너십을 증명하는 근거가 약해 면접에서 책임 범위를 직접 검증받을 수 있습니다.";
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
                       id === "SIMPLE__DOMAIN_SHIFT" ? "도메인 전환 근거를 문장으로 명확히 보여줘야 합니다." : "",
                       id === "SIMPLE__ROLE_SHIFT" ? "직무 핵심 과업과 성과의 연결고리를 설명해야 합니다." : ""
                    );
                    const note = explainNote || evidenceNote || summaryNote || templateNote || "";

                                        const statusLabel = isGate(r)
                      ? "즉시 컷"
                      : pr >= 80
                        ? "많이 관찰"
                        : pr >= 60
                          ? "자주 관찰"
                          : "관찰 요소";

                    return { __id: id, title, note: note || "신호가 왜 문제인지(근거)를 1~2문장으로 요약해 둘게요.", statusLabel };
                  });
                }
                const s = Array.isArray(vm?.signals) && vm.signals.length ? vm.signals : null;
                if (s) return s;
                return [
                  { title: "직접 증명 부족", note: "성과 수치와 전환 설명 보완 필요", statusLabel: "자주 관찰" },
                  { title: "맥락 연결 부족", note: "이전 경험과 JD 연결 보완", statusLabel: "많이 관찰" },
                  { title: "리스크 설명 부족", note: "공백·전환 리스크의 통제 설명 필요", statusLabel: "관찰 요소" },
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
                          의미 기반 JD-이력서 매칭 {ok ? "" : (status || "pending")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-700">
                      {ok ? (
                        <span>
                           Top 매칭 {matches.length}쌍 생성됨 (로컬 실행 모델 로딩으로 일부 지연될 수 있어요)
                        </span>
                      ) : status === "skipped:short_input" ? (
                        <span>
                           입력이 짧아 실행이 어려워요 (JD/이력서 각각 최소 20문장 권장) · 현재: JD {jdLen} / 이력서 {resumeLen}
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
                                  유사 후보 {Array.isArray(m?.candidates) ? m.candidates.length : 0}개
                                </div>
                              </div>

                              <div className="mt-4 space-y-4">

                                {/* JD 문구 */}
                                <div>
                                  <div className="text-[11px] font-medium text-slate-500">
                                    JD 문구
                                  </div>
                                  <div className="mt-1 rounded-xl bg-slate-100/70 p-3 text-[13px] leading-relaxed text-slate-900">
                                    {jdText.slice(0, 120)}
                                  </div>
                                </div>

                                {/* 연결 표시 */}
                                <div className="flex items-center justify-center">
                                  <span className="text-slate-400 text-sm">↔</span>
                                </div>

                                {/* 이력서 문구 */}
                                <div>
                                  <div className="text-[11px] font-medium text-slate-500">
                                    이력서 문구
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
                  <div className="text-xs text-slate-500">합격 사분위</div>
                  <div className="mt-1 text-base font-semibold">
                    현재 구간
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">
                    예상 위치(동적 산출)
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
                      {getPassLabel(Number.isFinite(Number(vm?.passProbability)) ? Number(vm.passProbability) : 35)}
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      {vm?.pass?.upliftHint ||
                        "전환 논리가 보완되면 상위 구간으로 이동할 여지가 있습니다."}
                    </div>
                  </div>

                  <div className="w-32 shrink-0">
                    {/* ??PATCH (append-only): 寃뚯씠吏 ?占쎌쟻 width ???占쎈떒 ?占쎌꽱?↔? ?占쎌씪 SSOT */}
                    {(() => {
                      const __gp =
                        Number.isFinite(Number(vm?.passProbability)) ? Number(vm.passProbability)
                        : Number.isFinite(Number(vm?.pass?.percent)) ? Number(vm.pass.percent)
                        : (() => { const n = parseInt(String(vm?.pass?.percentText || ""), 10); return Number.isFinite(n) ? n : 35; })();
                      const __gpClamped = Math.max(0, Math.min(100, Math.round(__gp)));
                      return (
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${__gpClamped}%` }} />
                        </div>
                      );
                    })()}
                    <div className="mt-2 text-right text-[11px] text-slate-500">
                      상위 % 위치
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
                      선택 다음 단계(옵션)
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      원하시면 여기에서 바로 다음 단계로 이어갈 수 있습니다.
                    </span>
                  </div>

                  <div className="mt-2 text-base font-semibold tracking-tight text-slate-900 sm:text-[17px]">
                    상세 보완과 실전 단계 액션으로 이동합니다
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    리포트의 취약/강점에 맞춘 안내 카드입니다.
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center rounded-full bg-indigo-600/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-600/15">
                    Guide
                  </span>
                </div>
              </div>

              {/* Body (湲곗〈 ?占쎌슜 ?↔?: 援ъ“占??占쎄컝?占쎄쾶) */}
              <div className="px-5 py-4 sm:px-6">
                <div className="rounded-2xl bg-slate-50/70 p-4 ring-1 ring-slate-200/70">
                  <div className="text-xs font-semibold text-slate-600">
                    아래 항목 중 해당되는 것을 골라주세요
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    (문장/구조를 어떻게 고칠지 제안 중심으로 바뀝니다)
                  </div>

                  {/* ???占쎄린遺???占쎈옒???占쎈옒 ?占쎌씪???占쎈뜕 ?占쎌슜(踰꾪듉/留곹겕/臾멸뎄/由ъ뒪????洹몌옙?占??↔?占쌥깍옙??
                      ?占쎈옒 div ?占쏀띁占??占쎄린占? 湲곗〈??蹂몃Ц 釉붾줉?????占쎌뿉 遺숈뿬 ?占쎌쑝占??占쎈땲?? */}
                  <div className="mt-3">
                    {/* ORIGINAL CTA BODY START */}
                    {/* ?占쎈옒 ?占쎈뜕 <div className="mt-4 rounded-xl border bg-slate-50/60 p-4"> ... </div>
                        ?↔? ?占쎌슜???占쎄린??洹몌옙?占???↔?占쎌슂. */}
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
                    다음 단계 액션 알아보기
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
                    (선택/입력 정보 중심 근거 기반 안내)
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ??PATCH (append-only): Top3 "?占쎈낫占? 鍮꾬옙? ?占쎌꺽 紐⑤떖 */}
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
                    subtitle="왜 그렇게 보였는지와 어떤 부분을 바꾸면 달라지는지를 면접관 관점으로 정리했습니다."
                    metaRight="Top3 · private"
                    mind={__detail.mind}
                    reasons={__detail.reasons}
                    questions={__detail.questions}
                    fixes={__detail.fixes}
                    signalLabel={__detail.signalLabel}
                    signalSummary={__detail.signalSummary}
                    jdNeedLine={__detail.jdNeedLine}
                    resumeGapLine={__detail.resumeGapLine}
                    onClose={closeDetail}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-slate-500">
          * 결과는 입력 정보에 따라 달라질 수 있으며, 정량 근거 중심으로 요약됩니다.
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
        : t.includes("즉시")
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
  signalLabel,
  signalSummary,
  jdNeedLine,
  resumeGapLine,
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
              {title || "리스크 신호 보기"}
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
              <div className="text-sm font-semibold text-slate-900">면접관 코멘트</div>
              <div className="text-[11px] text-slate-500">1~2줄</div>
            </div>
            <div className="px-4 py-4">
              <div className="rounded-xl border border-slate-200 bg-[#fff8e6] px-4 py-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]">
                <div className="text-[15px] leading-relaxed text-slate-900 font-medium">
                  {Array.isArray(mind) && mind.length ? mind[0] : "지원자 강점은 보이지만 검증 질문이 먼저 필요해 보입니다."}
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  {Array.isArray(mind) && mind.length > 1 ? mind[1] : "정량 근거 중심으로 확인 질문을 이어가겠습니다."}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/60 shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/70">
              <div className="text-sm font-semibold text-slate-900">왜 리스크로 보였는가</div>
              <div className="text-[11px] text-slate-500">신호/근거</div>
            </div>
            <div className="px-4 py-4">
              <ul className="space-y-2">
                {(Array.isArray(reasons) && reasons.length ? reasons : ["근거 문장이 얕아 보여 확인 질문이 필요합니다."]).map((t, i) => (
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
              <div className="text-sm font-semibold text-slate-900">실제 면접 질문으로 번역</div>
              <div className="text-[11px] text-slate-500">Q</div>
            </div>
            <div className="px-4 py-4">
              <ul className="space-y-2">
                {(Array.isArray(questions) && questions.length ? questions : ["이 신호를 구체적으로 얼마나 개선했는지 설명해 주세요."]).map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-500/60" />
                    <span className="text-sm text-slate-700 leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-4">
            {Array.isArray(signalSummary) && signalSummary.length ? (
              <div className="mb-3 rounded-lg border border-slate-200 bg-white/70 px-3 py-3">
                <div className="text-[11px] font-semibold text-slate-500">핵심 신호</div>
                {signalLabel ? (
                  <div className="mt-1 text-sm font-medium text-slate-800">{signalLabel}</div>
                ) : null}
                <div className="mt-2 space-y-1">
                  {signalSummary.map((t, i) => (
                    <div key={i} className="text-xs text-slate-600 leading-relaxed">{t}</div>
                  ))}
                </div>
              </div>
            ) : null}
            {(jdNeedLine || resumeGapLine) ? (
              <div className="mb-3 space-y-1 rounded-lg border border-slate-200/80 bg-white/60 px-3 py-2">
                {jdNeedLine ? (
                  <div className="text-xs leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-700">JD</span> {jdNeedLine}
                  </div>
                ) : null}
                {resumeGapLine ? (
                  <div className="text-xs leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-700">Resume</span> {resumeGapLine}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="text-xs font-semibold text-indigo-700 tracking-wide">
              바로 보완할 방법
            </div>
            <div className="mt-2 space-y-2">
              {(Array.isArray(fixes) && fixes.length ? fixes : ["JD 요구와 맞춘 bullet을 바로 추가해 보세요."]).map((t, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-500/70" />
                  <span className="text-sm text-slate-700 leading-relaxed">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500">내부 메모를 면접 실전에 바로 쓸 수 있는 문장으로 요약했습니다.</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-[0.99] transition"
            >
              다음 시뮬레이션 다시 돌리기
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






