// src/lib/decision/interactions/buildRiskInteractions.js
// Risk Interaction Layer v1 — explain-only / append-only
// score / gate / cap / pressure / riskResults 에 영향 없음

/**
 * riskResults 내 ID 집합을 반환하는 로컬 유틸
 */
function _idSet(riskResults) {
  const arr = Array.isArray(riskResults) ? riskResults : [];
  return new Set(arr.map((r) => String(r?.id || "")));
}

/**
 * 실제 매칭된 ID만 sourceIds로 수집하는 로컬 유틸
 * @param {Set<string>} ids - 현재 riskResults ID 집합
 * @param {string[]} candidates - 후보 ID 목록
 */
function _matchedIds(ids, candidates) {
  return candidates.filter((c) => ids.has(c));
}

// ──────────────────────────────────────────────────────────────────────
// [PATCH LABEL] 내부 signal ID → 사용자용 한국어 라벨 매핑 테이블
// 매핑 없는 값은 그대로 유지 / 기존 signals 순서 유지
// ──────────────────────────────────────────────────────────────────────

const _SIGNAL_LABEL = {
  "IMPACT__NO_QUANTIFIED_IMPACT": "정량 성과 부족",
  "IMPACT__LOW_IMPACT_VERBS":     "성과 표현이 추상적",
  "IMPACT__PROCESS_ONLY":         "프로세스 설명 위주",
};

// ──────────────────────────────────────────────────────────────────────
// [PATCH 6] 데이터 기반 explain builder helpers (append-only)
// score / gate / riskResults 원본 수정 없음
// ──────────────────────────────────────────────────────────────────────

/** riskResults 배열에서 특정 id 아이템 탐색 */
function _findById(arr, id) {
  return (Array.isArray(arr) ? arr : []).find(
    (r) => String(r?.id || "") === id
  ) || null;
}

/** 안전한 숫자 변환 (null 반환) */
function _safeN(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 배열에서 첫 번째 비어있지 않은 문자열 반환 */
function _firstStr(arr) {
  return (Array.isArray(arr) ? arr : []).map((v) => String(v ?? "").trim()).find(Boolean) || null;
}

/**
 * sourceIds에 해당하는 source risk들의 signals / evidence를 수집
 * - explain.signals (string[]) → signals 우선 수집
 * - evidence (string[]) → evidence 수집 (object 형태는 스킵)
 * - signals가 없으면 explain.why[0] 를 signals fallback으로 1개 사용
 * - 중복 제거 + 각 최대 3개
 */
function _collectEvidenceFromSources(riskResults, sourceIds) {
  const rawSignals = [];
  const rawEvidence = [];

  for (const id of (Array.isArray(sourceIds) ? sourceIds : [])) {
    const item = _findById(riskResults, id);
    if (!item) continue;

    // explain.signals 수집
    const itemSignals = Array.isArray(item?.explain?.signals) ? item.explain.signals : [];
    for (const s of itemSignals) {
      const str = String(s ?? "").trim();
      if (str) rawSignals.push(str);
    }

    // evidence 수집 (배열만 처리 — object 형태는 _buildExplain* 에서 이미 why로 표면화)
    const itemEvidence = item?.evidence;
    if (Array.isArray(itemEvidence)) {
      for (const e of itemEvidence) {
        const str = String(e ?? "").trim();
        if (str) rawEvidence.push(str);
      }
    }
  }

  // signals가 여전히 없으면 sourceIds 중 첫 번째 why[0] fallback 사용
  if (rawSignals.length === 0) {
    for (const id of (Array.isArray(sourceIds) ? sourceIds : [])) {
      const item = _findById(riskResults, id);
      const why0 = _firstStr(item?.explain?.why ? [item.explain.why[0]] : []);
      if (why0) { rawSignals.push(why0); break; }
    }
  }

  // 중복 제거 + 최대 3개
  const _dedup3 = (arr) => [...new Set(arr.filter(Boolean))].slice(0, 3);
  return {
    signals: _dedup3(rawSignals),
    evidence: _dedup3(rawEvidence),
  };
}

// ──────────────────────────────────────────────────────────────────────
// [PATCH SPLIT] source risk signals/evidence에서 jdEvidence / resumeEvidence 분리
// - 우선순위 1: evidence object 직접 접근 (jdMinYears → jd, resumeYears → resume)
// - 우선순위 1: key=value 문자열 (currentLevel=... → resume, targetLevel=... → jd)
// - 우선순위 2: 화살표 패턴 "X -> Y" / "X → Y" (좌=resume, 우=jd)
// - E/F는 내부 flag ID signals 문제로 이번 라운드 분리 불가 → 빈 배열 허용
// ──────────────────────────────────────────────────────────────────────

/**
 * sourceIds에 해당하는 source risk에서 jdEvidence / resumeEvidence 분리
 * @param {any[]} riskResults
 * @param {string[]} sourceIds
 * @returns {{ jdEvidence: string[], resumeEvidence: string[] }}
 */
function _collectSplitEvidence(riskResults, sourceIds) {
  const rawJd = [];
  const rawResume = [];

  for (const id of (Array.isArray(sourceIds) ? sourceIds : [])) {
    const item = _findById(riskResults, id);
    if (!item) continue;

    // ── 우선순위 1-A: evidence object 직접 접근 (SENIORITY 계열) ────
    if (item.evidence && typeof item.evidence === "object" && !Array.isArray(item.evidence)) {
      const jdMinYears = _safeN(item.evidence.jdMinYears);
      const resumeYears = _safeN(item.evidence.resumeYears);
      if (jdMinYears !== null) rawJd.push(`jdMinYears=${jdMinYears}`);
      if (resumeYears !== null) rawResume.push(`resumeYears=${resumeYears}`);
    }

    // ── 우선순위 1-B & 2: signals 문자열 파싱 ───────────────────────
    const signals = Array.isArray(item?.explain?.signals) ? item.explain.signals : [];
    for (const s of signals) {
      const str = String(s ?? "").trim();
      if (!str) continue;

      // key=value 패턴: currentLevel → resumeEvidence, targetLevel → jdEvidence
      const kvMatch = str.match(/^(\w+)=(.+)$/);
      if (kvMatch) {
        const key = kvMatch[1];
        if (key === "currentLevel") { rawResume.push(str); continue; }
        if (key === "targetLevel")  { rawJd.push(str);     continue; }
      }

      // 화살표 패턴: "X -> Y" 또는 "X → Y" (좌=resume, 우=jd)
      const arrowMatch = str.match(/^(.+?)\s*(?:->|→)\s*(.+)$/);
      if (arrowMatch) {
        const left  = arrowMatch[1].trim();
        const right = arrowMatch[2].trim();
        if (left)  rawResume.push(left);
        if (right) rawJd.push(right);
        continue;
      }
    }
  }

  const _dedup3 = (arr) => [...new Set(arr.filter(Boolean))].slice(0, 3);
  return {
    jdEvidence:     _dedup3(rawJd),
    resumeEvidence: _dedup3(rawResume),
  };
}

/**
 * A explain builder — 경험 부족 + 잦은 이직
 * SENIORITY__UNDER_MIN_YEARS evidence에서 gap/jdMinYears 추출 시도
 */
function _buildExplainA(riskResults, expCandidates) {
  const expItem =
    expCandidates
      .map((id) => _findById(riskResults, id))
      .find(Boolean) || null;

  const gapMonths = _safeN(expItem?.evidence?.gapMonthsAbs);
  const jdMinYears = _safeN(expItem?.evidence?.jdMinYears);

  let why;
  if (gapMonths !== null && jdMinYears !== null) {
    why = `JD 요구 ${jdMinYears}년 대비 약 ${gapMonths}개월 부족이 감지된 상태에서 이직 패턴까지 겹쳐, 커리어 안정성을 보수적으로 판단할 수 있습니다.`;
  } else if (gapMonths !== null) {
    why = `연차 약 ${gapMonths}개월 부족이 감지된 상태에서 이직 패턴까지 겹쳐, 커리어 안정성을 보수적으로 판단할 수 있습니다.`;
  } else {
    why = "JD 요구연차 대비 경험 부족과 최근 이직 패턴이 동시에 나타나 커리어 안정성을 보수적으로 판단할 수 있습니다.";
  }

  return {
    why: [why],
    action: ["짧은 재직의 배경과 이직 맥락을 명확히 설명하고, 빠르게 적응해 성과를 냈던 근거를 함께 제시하세요."],
    counter: [],
    signals: [],
  };
}

/**
 * B explain builder — 연봉 미스매치 + 기업규모 점프
 * 연봉 risk explain.why[0] + 기업규모 risk explain.signals[0] 에서 컨텍스트 추출
 */
function _buildExplainB(riskResults, jumpCandidates) {
  const salaryItem = _findById(riskResults, "GATE__SALARY_MISMATCH");
  const jumpItem =
    jumpCandidates
      .map((id) => _findById(riskResults, id))
      .find(Boolean) || null;

  // 기업규모 signals[0]: "company_size: X -> Y (gap=N)" 형태
  const sizeSignal = _firstStr(jumpItem?.explain?.signals);
  // 연봉 why[0]: 연봉 구체 텍스트 포함 가능
  const salaryWhy = _firstStr(salaryItem?.explain?.why);

  const contextParts = [sizeSignal, salaryWhy].filter(Boolean);
  const contextHint = contextParts.length > 0
    ? ` (${contextParts.join(" / ")})`
    : "";

  const why = contextHint
    ? `연봉 기대치와 기업규모 상향 이동이 동시에 나타나 지원 현실성을 보수적으로 판단할 수 있습니다.${contextHint}`
    : "연봉 기대치와 기업규모 상향 이동이 동시에 나타나면 채용담당자가 지원 현실성을 보수적으로 판단할 수 있습니다.";

  return {
    why: [why],
    action: ["연봉 기대 기준과 기업규모 상향 지원의 논리를 분리해서 설명하지 말고, 왜 지금 단계에서 가능한 이동인지 하나의 스토리로 연결해 제시하세요."],
    counter: [],
    signals: [],
  };
}

/**
 * C explain builder — 도메인 전환 + 필수 스킬 누락
 * must-have missing의 explain.why[1]에서 누락 키워드 목록 추출 시도
 */
function _buildExplainC(riskResults) {
  const mustItem = _findById(riskResults, "ROLE_SKILL__MUST_HAVE_MISSING");

  // explain.why[1]에 "누락 후보(일부): XX, YY" 형태의 텍스트가 들어오는 경우
  const missingLine = (mustItem?.explain?.why ?? [])
    .map((v) => String(v ?? ""))
    .find((s) => s.includes("누락") || s.includes("missing") || s.includes("Missing")) || null;

  const why = missingLine
    ? `도메인 전환과 필수 스킬 누락이 겹쳐 즉시 투입 가능성에 의문이 제기될 수 있습니다. (${missingLine})`
    : "도메인 전환과 필수 스킬 누락이 겹치면 채용담당자가 즉시 투입 가능성에 큰 의문을 가질 수 있습니다.";

  return {
    why: [why],
    action: ["전환 근거와 스킬 보완 계획을 하나의 흐름으로 연결해, '이미 준비된 전환'임을 보여주세요."],
    counter: [],
    signals: [],
  };
}

/**
 * D explain builder — 역할 레벨 불일치 + 기업규모 점프
 * 기업규모 risk explain.signals[0]에서 사이즈 정보 추출
 */
function _buildExplainD(riskResults) {
  const jumpItem =
    _findById(riskResults, "RISK__COMPANY_SIZE_JUMP") ||
    _findById(riskResults, "HIGH_RISK__COMPANY_SIZE_JUMP_COMPOSITE");

  const sizeSignal = _firstStr(jumpItem?.explain?.signals);

  const why = sizeSignal
    ? `역할 레벨 불일치와 기업규모 상향 이동이 동시에 감지되어 포지션 적합성을 보수적으로 판단할 수 있습니다. (${sizeSignal})`
    : "역할 레벨 불일치와 기업규모 상향 이동이 동시에 감지되면 채용담당자가 포지션 적합성을 보수적으로 판단할 수 있습니다.";

  return {
    why: [why],
    action: ["현재 레벨에서 쌓은 성과가 더 큰 조직 스케일에서도 유효함을 구체적인 수치와 맥락으로 입증하세요."],
    counter: [],
    signals: [],
  };
}

/**
 * F explain builder — 경험 부족(게이트) + 실행 임팩트 갭
 * SENIORITY__UNDER_MIN_YEARS evidence에서 gap 추출 시도
 */
function _buildExplainF(riskResults) {
  const senItem = _findById(riskResults, "SENIORITY__UNDER_MIN_YEARS");
  const gapMonths = _safeN(senItem?.evidence?.gapMonthsAbs);
  const jdMinYears = _safeN(senItem?.evidence?.jdMinYears);

  let why;
  if (gapMonths !== null && jdMinYears !== null) {
    why = `JD 요구 ${jdMinYears}년 대비 약 ${gapMonths}개월 부족인 상태에서 실행 임팩트 공백까지 겹쳐, 실질적인 기여 가능성을 낮게 평가할 수 있습니다.`;
  } else if (gapMonths !== null) {
    why = `연차 약 ${gapMonths}개월 부족인 상태에서 실행 임팩트 공백까지 겹쳐, 실질적인 기여 가능성을 낮게 평가할 수 있습니다.`;
  } else {
    why = "경험 연차 부족과 실행 임팩트 공백이 동시에 나타나면 채용담당자가 실질적인 기여 가능성을 낮게 평가할 수 있습니다.";
  }

  return {
    why: [why],
    action: ["연차가 짧더라도 실제로 결과를 만들어낸 경험을 중심으로 재구성해, 양보다 밀도로 설득하세요."],
    counter: [],
    signals: [],
  };
}

/**
 * Risk Interaction Layer v1
 *
 * @param {{ riskResults: any[], riskFeed: any[] | null, mode: string | null }} params
 * @returns {Array<{
 *   id: string,
 *   type: "compound",
 *   priority: number,
 *   sourceIds: string[],
 *   explain: { why: string[], action: string[], counter: string[], signals: string[] },
 *   meta: { cluster: string, severity: string }
 * }>}
 */
export function buildRiskInteractions({ riskResults, riskFeed, mode } = {}) {
  const ids = _idSet(riskResults);
  const interactions = [];
  const seen = new Set(); // 중복 interaction 생성 방지

  // ──────────────────────────────────────────────────────────────────────
  // A. 경험 부족 + 잦은 이직
  // 조건: (GATE__CRITICAL_EXPERIENCE_GAP | SENIORITY__UNDER_MIN_YEARS)
  //        && TIMELINE_INSTABILITY_RISK
  // ──────────────────────────────────────────────────────────────────────
  const IX_A_ID = "IX__EXP_GAP_x_JOB_HOPPING";
  if (!seen.has(IX_A_ID)) {
    const expCandidates = ["GATE__CRITICAL_EXPERIENCE_GAP", "SENIORITY__UNDER_MIN_YEARS"];
    const hasExpGap = expCandidates.some((c) => ids.has(c));
    const hasTimeline = ids.has("TIMELINE_INSTABILITY_RISK");

    if (hasExpGap && hasTimeline) {
      const sourceIds = [
        ..._matchedIds(ids, expCandidates),
        ..._matchedIds(ids, ["TIMELINE_INSTABILITY_RISK"]),
      ];

      interactions.push({
        id: IX_A_ID,
        type: "compound",
        priority: 88,
        sourceIds,
        explain: _buildExplainA(riskResults, expCandidates),
        meta: {
          cluster: "career_stability",
          severity: "high",
        },
      });
      seen.add(IX_A_ID);
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // B. 연봉 미스매치 + 기업규모 점프
  // 조건: GATE__SALARY_MISMATCH
  //        && (RISK__COMPANY_SIZE_JUMP | HIGH_RISK__COMPANY_SIZE_JUMP_COMPOSITE)
  // ──────────────────────────────────────────────────────────────────────
  const IX_B_ID = "IX__SALARY_MISMATCH_x_COMPANY_JUMP";
  if (!seen.has(IX_B_ID)) {
    const jumpCandidates = [
      "RISK__COMPANY_SIZE_JUMP",
      "HIGH_RISK__COMPANY_SIZE_JUMP_COMPOSITE",
    ];
    const hasSalary = ids.has("GATE__SALARY_MISMATCH");
    const hasJump = jumpCandidates.some((c) => ids.has(c));

    if (hasSalary && hasJump) {
      const sourceIds = [
        ..._matchedIds(ids, ["GATE__SALARY_MISMATCH"]),
        ..._matchedIds(ids, jumpCandidates),
      ];

      interactions.push({
        id: IX_B_ID,
        type: "compound",
        priority: 85,
        sourceIds,
        explain: _buildExplainB(riskResults, jumpCandidates),
        meta: {
          cluster: "compensation_realism",
          severity: "high",
        },
      });
      seen.add(IX_B_ID);
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // C. 도메인 전환 + 필수 스킬 누락
  // 조건: domainShiftRisk && ROLE_SKILL__MUST_HAVE_MISSING
  // ──────────────────────────────────────────────────────────────────────
  const IX_C_ID = "IX__DOMAIN_SHIFT_x_MUST_HAVE_MISSING";
  if (!seen.has(IX_C_ID)) {
    const hasDomainShift = ids.has("domainShiftRisk");
    const hasMustHave = ids.has("ROLE_SKILL__MUST_HAVE_MISSING");

    if (hasDomainShift && hasMustHave) {
      interactions.push({
        id: IX_C_ID,
        type: "compound",
        priority: 87,
        sourceIds: _matchedIds(ids, ["domainShiftRisk", "ROLE_SKILL__MUST_HAVE_MISSING"]),
        explain: _buildExplainC(riskResults),
        meta: {
          cluster: "domain_readiness",
          severity: "high",
        },
      });
      seen.add(IX_C_ID);
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // D. 역할 레벨 불일치 + 기업규모 점프
  // 조건: RISK__ROLE_LEVEL_MISMATCH && RISK__COMPANY_SIZE_JUMP
  // ──────────────────────────────────────────────────────────────────────
  const IX_D_ID = "IX__ROLE_LEVEL_x_COMPANY_JUMP";
  if (!seen.has(IX_D_ID)) {
    const hasRoleLevel = ids.has("RISK__ROLE_LEVEL_MISMATCH");
    const hasCompanyJump = ids.has("RISK__COMPANY_SIZE_JUMP");

    if (hasRoleLevel && hasCompanyJump) {
      interactions.push({
        id: IX_D_ID,
        type: "compound",
        priority: 82,
        sourceIds: _matchedIds(ids, ["RISK__ROLE_LEVEL_MISMATCH", "RISK__COMPANY_SIZE_JUMP"]),
        explain: _buildExplainD(riskResults),
        meta: {
          cluster: "role_fit_realism",
          severity: "high",
        },
      });
      seen.add(IX_D_ID);
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // E. 실행 임팩트 갭 + 임팩트 동사 부족
  // 조건: RISK__EXECUTION_IMPACT_GAP && IMPACT__LOW_IMPACT_VERBS
  // ──────────────────────────────────────────────────────────────────────
  const IX_E_ID = "IX__EXECUTION_GAP_x_IMPACT_GAP";
  if (!seen.has(IX_E_ID)) {
    const hasExecutionGap = ids.has("RISK__EXECUTION_IMPACT_GAP");
    const hasImpactVerbs = ids.has("IMPACT__LOW_IMPACT_VERBS");

    if (hasExecutionGap && hasImpactVerbs) {
      interactions.push({
        id: IX_E_ID,
        type: "compound",
        priority: 78,
        sourceIds: _matchedIds(ids, ["RISK__EXECUTION_IMPACT_GAP", "IMPACT__LOW_IMPACT_VERBS"]),
        explain: {
          why: [
            "실행 임팩트 공백과 약한 동사 표현이 함께 나타나면 성과 자체가 없는 것으로 오해될 수 있습니다.",
          ],
          action: [
            "수행한 행동을 강한 동사로 시작하고, 결과를 수치나 변화로 직접 연결해서 기술하세요.",
          ],
          counter: [],
          signals: [],
        },
        meta: {
          cluster: "impact_evidence",
          severity: "medium",
        },
      });
      seen.add(IX_E_ID);
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // F. 경험 부족(게이트) + 실행 임팩트 갭
  // 조건: GATE__CRITICAL_EXPERIENCE_GAP && RISK__EXECUTION_IMPACT_GAP
  // ──────────────────────────────────────────────────────────────────────
  const IX_F_ID = "IX__EXP_GAP_x_EXECUTION_GAP";
  if (!seen.has(IX_F_ID)) {
    const hasCriticalExpGap = ids.has("GATE__CRITICAL_EXPERIENCE_GAP");
    const hasExecGap = ids.has("RISK__EXECUTION_IMPACT_GAP");

    if (hasCriticalExpGap && hasExecGap) {
      interactions.push({
        id: IX_F_ID,
        type: "compound",
        priority: 86,
        sourceIds: _matchedIds(ids, ["GATE__CRITICAL_EXPERIENCE_GAP", "RISK__EXECUTION_IMPACT_GAP"]),
        explain: _buildExplainF(riskResults),
        meta: {
          cluster: "career_stability",
          severity: "high",
        },
      });
      seen.add(IX_F_ID);
    }
  }

  // [PATCH 8] Post-process: source risk에서 signals / evidence 수집 후 explain에 append
  // - why / action / counter / title 등 기존 explain 필드는 절대 덮어쓰지 않음
  // - signals가 이미 비어있는 경우에만 채움 (빌더가 이미 값을 넣었으면 유지)
  const __rr = Array.isArray(riskResults) ? riskResults : [];
  for (const ix of interactions) {
    if (!ix || typeof ix.explain !== "object") continue;
    try {
      const collected = _collectEvidenceFromSources(__rr, ix.sourceIds);

      // signals: 기존이 [] 이면 수집된 값으로 교체, 이미 값이 있으면 유지
      if (Array.isArray(ix.explain.signals) && ix.explain.signals.length === 0) {
        ix.explain.signals = collected.signals;
      } else if (!Array.isArray(ix.explain.signals)) {
        ix.explain.signals = collected.signals;
      }

      // evidence: 필드 자체가 없거나 [] 이면 수집된 값으로 설정
      if (!Array.isArray(ix.explain.evidence) || ix.explain.evidence.length === 0) {
        ix.explain.evidence = collected.evidence;
      }

      // [PATCH SPLIT] jdEvidence / resumeEvidence append-only
      const split = _collectSplitEvidence(__rr, ix.sourceIds);
      ix.explain.jdEvidence     = split.jdEvidence;
      ix.explain.resumeEvidence = split.resumeEvidence;

      // [PATCH LABEL] signals 내부 ID → 사용자용 라벨 치환 (순서 유지, dedupe)
      if (Array.isArray(ix.explain.signals)) {
        const __seen = new Set();
        ix.explain.signals = ix.explain.signals
          .map((s) => {
            if (typeof s !== "string") return null;
            return _SIGNAL_LABEL[s] ?? s;
          })
          .filter((s) => {
            if (!s) return false;
            if (__seen.has(s)) return false;
            __seen.add(s);
            return true;
          });
      }

      // [PATCH SUPPLEMENT v2] E/F interaction 한정 — supplement 문장을 why[1]로 분리
      // signals는 짧은 라벨만 유지 / A/B/C/D 완전 무영향
      const _SUPPLEMENT_MAP = {
        "IX__EXECUTION_GAP_x_IMPACT_GAP":  "IMPACT__LOW_IMPACT_VERBS",
        "IX__EXP_GAP_x_EXECUTION_GAP":     "GATE__CRITICAL_EXPERIENCE_GAP",
      };
      const __suppSourceId = _SUPPLEMENT_MAP[ix.id];
      if (__suppSourceId) {
        const __suppItem = _findById(__rr, __suppSourceId);
        const __suppWhy0 = typeof __suppItem?.explain?.why?.[0] === "string"
          ? __suppItem.explain.why[0].trim()
          : null;
        if (__suppWhy0) {
          if (!Array.isArray(ix.explain.why)) ix.explain.why = [];
          if (!ix.explain.why.includes(__suppWhy0)) {
            ix.explain.why.push(__suppWhy0);
          }
        }
      }
    } catch {
      // crash-safe: 실패해도 interaction 자체는 반환
    }
  }

  return interactions;
}
