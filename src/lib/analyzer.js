// FINAL PATCHED FILE: src/lib/analyzer.js
// NOTE: 공통 유틸은 coreUtils에서 import로만 사용 (중복 선언 금지)
import {
  clamp,
  normalizeScore01,
  scoreToLabel,
  safeToString,
  safeLower,
  uniq,
  escapeRegExp,
  clone,
} from "./coreUtils.js";
import { computeHiddenRisk } from "./hiddenRisk.js";
import { buildSimulationViewModel } from "./simulation/buildSimulationViewModel.js";
import { detectStructuralPatterns } from "./decision/structuralPatterns.js";
import { buildDecisionPack } from "./decision/index.js";
import { buildLeadershipGapSignals } from "./signals/leadershipGapSignals.js";
import { evaluateLeadershipRisk } from "./decision/leadership/leadershipRiskEvaluator.js";
import { evaluateEducationRequirement } from "./decision/education/educationRequirementEvaluator.js";
import { evaluateEvidenceFit } from "./decision/evidence/evaluateEvidenceFit.js";
import { buildJdResumeFit } from "./fit/jdResumeFit.js";
import { inferCanonicalFamily, computeRoleDistance } from "./decision/roleOntology/computeRoleDistance.js";
import { deriveActionCandidates, selectTopActions } from "./recommendations/actionCatalog.js";
import { buildHrViewModel } from "./hrviewModel.js";
import { buildCanonicalAnalysisInput } from "./analysis/buildCanonicalAnalysisInput.js";
import { rewriteExplain } from "./explain/explainRewrite.js";
const JD_REC_V1__LIMIT = 12;
const JD_REC_V1__MINLEN = 6;

function JD_REC_V1__safeStr(x) {
  return (x === null || x === undefined) ? "" : String(x);
}
function JD_REC_V1__clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
function JD_REC_V1__normLine(s) {
  return JD_REC_V1__safeStr(s)
    .replace(/\u00A0/g, " ")
    .replace(/[•\-\*\u2022]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
function JD_REC_V1__splitLines(text) {
  const t = JD_REC_V1__safeStr(text).replace(/\r\n/g, "\n");
  return t.split("\n").map((x) => JD_REC_V1__safeStr(x).trim()).filter(Boolean);
}
function JD_REC_V1__splitBullets(line) {
  const s = JD_REC_V1__safeStr(line).trim();
  if (!s) return [];
  // 1) "1." "1)" "- " "• " "* " 형태 분리
  // - 줄 내부에 불릿이 여러 개면 분해
  const parts = s
    .split(/\s*(?:^|[\n])(?:\d+\.\s+|\d+\)\s+|[-•*]\s+)\s*/g)
    .map((p) => JD_REC_V1__safeStr(p).trim())
    .filter(Boolean);
  // split이 잘 안 먹는 케이스(그냥 한 줄) 대비
  if (parts.length === 0) return [s];
  return parts;
}

function JD_REC_V1__isHeader(line) {
  const l = JD_REC_V1__normLine(line);
  // 최소 헤더 후보 세트(변경 금지 설계 그대로)
  return /^(필수|자격요건|requirements|must|우대|preferred|plus|담당|업무|주요|responsibilities|what you['’]?ll do|스킬|기술|tool|stack|skill|경험)\b/.test(l);
}

function JD_REC_V1__routeSection(headerLine) {
  const l = JD_REC_V1__normLine(headerLine);
  if (/(필수|자격요건|requirements|must)\b/.test(l)) return "mustHave";
  if (/(우대|preferred|plus)\b/.test(l)) return "preferred";
  if (/(담당|업무|주요|responsibilities|what you['’]?ll do)\b/.test(l)) return "coreTasks";
  if (/(스킬|기술|tool|stack|skill|경험)\b/.test(l)) return "tools";
  return null;
}

function JD_REC_V1__looksLikeToolsLine(line) {
  const l = JD_REC_V1__normLine(line);
  // tools 키워드 포함 라인은 tools에도 포함(폴백 규칙 준수)
  // "경험"은 길이/키워드 필터 적용
  if (/(tool|stack|skill|스킬|기술)\b/.test(l)) return true;
  if (/경험/.test(l)) {
    // 길이/키워드 필터(너무 짧은 '경험' 한 단어/의미없는 문구 방지)
    if (l.length < 14) return false;
    if (/(년|yrs|years|사용|활용|운영|개발|분석|설계|구축|프로젝트|업무)/.test(l)) return true;
    return false;
  }
  return false;
}
// ------------------------------
// JD_REC_V1 - candidate filter (rule-based, conservative)
// - 목적: 추천 후보에서 "잡문/전형/안내/문의/형식 문장" 제거
// - 원칙: 애매하면 KEEP (과필터 금지)
// - 적용 위치: JD_REC_V1__selectTopSignals 내부에서만 사용 (설계 유지)
// ------------------------------
function JD_REC_V1__isNoiseCandidate(line, section) {
  const raw = JD_REC_V1__safeStr(line).trim();
  // ------------------------------------------------------------
  // v3.x hotfix: bracket headers / section titles must be removed
  // - 보수적: "헤더로 확실한 것"만 컷
  // - 애매하면 KEEP
  // ------------------------------------------------------------
  // 예: "[자격요건 / Requirements / Must]", "[우대사항 / Preferred / Plus]"
  if (/^\[[^\]]{2,120}\]$/.test(raw)) {
    const h = raw
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .trim()
      .toLowerCase();

    // 섹션 헤더로 확실한 키워드만 컷
    if (
      /(자격요건|지원자격|requirements|must|필수|우대사항|preferred|plus|nice to have|qualification|qualifications|responsibilities|job description|about the role|role)/i.test(
        h
      )
    ) {
      return true;
    }

    // 대괄호 단독 + 너무 짧거나 구분자 위주면 헤더/구분선으로 간주
    if (h.length <= 2) return true;
    if (/^[\s\-_/|:]+$/.test(h)) return true;
  }

  // 콜론만 남은 섹션 타이틀(예: "Requirements:" 같은 라인)
  if (/^[^:]{2,40}:\s*$/.test(raw)) {
    const t = raw.replace(/:\s*$/, "").trim().toLowerCase();
    if (
      /(requirements|preferred|responsibilities|qualification|qualifications|must|nice to have|자격요건|우대사항|담당업무|주요업무|지원자격|필수)/i.test(
        t
      )
    ) {
      return true;
    }
  }
  if (!raw) return true;

  const t = JD_REC_V1__normLine(raw);
  if (!t) return true;

  // 0) 너무 일반적인 "형식/서두" 문구 (대표 노이즈)
  // 0-B) 대괄호 헤더형 라인 제거
  // - 예: "[자격요건 / Requirements / Must]" "[우대사항 / Preferred / Plus]"
  // - 원칙: 헤더만 담긴 라인은 신호 가치가 없고 과추천 유발 → 제거
  const tNoBrackets = t.replace(/^[\[\(\{]\s*/g, "").replace(/\s*[\]\)\}]\s*$/g, "").trim();

  // 대괄호 포함 + 헤더 키워드가 강하게 있으면 컷
  if ((/[\[\]\(\)\{\}]/.test(raw) || /[\[\]\(\)\{\}]/.test(line)) &&
    /^(자격\s*요건|자격요건|필수\s*요건|필수요건|우대\s*사항|우대사항|requirements|must|preferred|plus|responsibilities|what you['’]?ll do)\b/.test(tNoBrackets)) {
    return true;
  }

  // (Q2=Y인 경우) 대괄호가 없어도 헤더 자체는 컷
  if (/^(자격\s*요건|자격요건|필수\s*요건|필수요건|우대\s*사항|우대사항|requirements|must|preferred|plus|responsibilities|what you['’]?ll do)\b/.test(t)) {
    return true;
  }
  // - 예: "주요 업무는 다음과 같습니다."
  if (/^(주요\s*업무는\s*다음과\s*같습니다|업무는\s*다음과\s*같습니다|다음과\s*같습니다)\b/.test(t)) return true;

  // 1) 채용/전형/지원 안내류 (노이즈)
  // - 예: "전형 절차", "지원 방법", "제출 서류", "문의"
  if (/(전형\s*절차|채용\s*절차|지원\s*방법|지원\s*안내|지원\s*기간|접수|제출\s*서류|제출\s*방법|문의|연락|이메일|메일|전화|홈페이지|웹사이트|링크|url|apply|application|how to apply|recruit(ment)? process|hiring process|selection process)\b/.test(t)) {
    // 단, mustHave/tools에 "이메일/전화" 같은 게 진짜 요건일 가능성은 낮으므로 그대로 제거
    return true;
  }

  // 2) 근무조건/복지/장소/시간/급여 등 "공고 일반" (노이즈)
  // - 단, 연봉/처우는 gate(연봉) 트리거와 섞일 수 있지만 여기서는 "JD 추천 후보"이므로 보수적으로 제외
  if (/(근무\s*조건|근무\s*형태|근무지|근무\s*시간|근무\s*요일|급여|연봉|처우|복지|benefit|location|work(ing)? hours|schedule|compensation|salary|pay|welfare)\b/.test(t)) {
    // 섹션이 mustHave/coreTasks라도 대개 JD 추천 후보로는 가치 낮음
    return true;
  }

  // 3) “우대/필수/자격요건/담당업무” 같은 헤더성 문장
  // - extractSignals 단계에서 헤더는 이미 continue 처리되지만, 변형 케이스 방어
  if (/^(자격\s*요건|자격요건|필수\s*요건|우대\s*사항|담당\s*업무|주요\s*업무|requirements|preferred|responsibilities|what you['’]?ll do)\b/.test(t)) {
    // 헤더 자체는 신호로 쓰지 않는 정책과 동일
    return true;
  }

  // 4) 너무 포괄적/의미 빈약한 문장 (보수적으로 “짧은 일반문”만 컷)
  // - 단, 숫자/기술키워드/동사(분석/설계/구축 등)가 있으면 KEEP
  const hasStrongToken =
    /(\d+|년|yrs|years|python|sql|r\b|tableau|power\s*bi|excel|aws|gcp|azure|spark|hadoop|ml|ai|통계|분석|모델|설계|구축|개발|운영|정제|시각화|리포트|보고|프레젠테이션|협업|프로젝트)/.test(t);

  if (!hasStrongToken) {
    // "소개/모집/채용/담당자" 류의 포괄 문구 컷
    if (/(모집|채용|공고|포지션|직무|담당자|조직|부서|팀|회사|기관|소개|개요|purpose|overview|about us)\b/.test(t)) return true;

    // 매우 짧은 일반문(이미 MINLEN=6은 통과했더라도) 보수 컷
    if (t.length <= 18 && /^(우대|필수|자격|경험|업무|기술|스킬|역량|요건)\b/.test(t)) return true;
  }

  return false;
}

function JD_REC_V1__filterSignalsByRules(signals) {
  const arr = Array.isArray(signals) ? signals : [];
  const out = [];

  for (const s of arr) {
    if (!s) continue;
    const text = JD_REC_V1__safeStr(s?.text).trim();
    if (!text) continue;

    const sec = JD_REC_V1__safeStr(s?.section).trim() || "";
    // ✅ 보수적 필터: 노이즈로 “확실”할 때만 제거
    if (JD_REC_V1__isNoiseCandidate(text, sec)) continue;

    out.push(s);
  }

  return out;
}
function JD_REC_V1__extractSignals(jdText) {
  const debug = { hasHeaders: false, fallbackUsed: false, linesTotal: 0, bulletsTotal: 0, errors: [] };
  const sections = { mustHave: [], preferred: [], coreTasks: [], tools: [] };

  try {
    const lines = JD_REC_V1__splitLines(jdText);
    debug.linesTotal = lines.length;

    let current = null;
    for (const raw of lines) {
      const line = JD_REC_V1__safeStr(raw).trim();
      if (!line) continue;

      // 헤더 감지
      if (JD_REC_V1__isHeader(line)) {
        const sec = JD_REC_V1__routeSection(line);
        if (sec) {
          current = sec;
          debug.hasHeaders = true;
          continue; // 헤더 라인 자체는 신호로 쓰지 않음
        }
      }

      const bullets = JD_REC_V1__splitBullets(line);
      debug.bulletsTotal += bullets.length;

      // 헤더가 없다면: 모든 라인을 coreTasks로 우선 분류 (폴백 규칙)
      if (!debug.hasHeaders) {
        debug.fallbackUsed = true;
        for (const b of bullets) {
          if (!b) continue;
          sections.coreTasks.push(b);
          if (JD_REC_V1__looksLikeToolsLine(b)) sections.tools.push(b);
        }
        continue;
      }

      // 헤더가 있으면: current 섹션 기준으로 분류 (없으면 coreTasks로 보수적 폴백)
      const sec = current || "coreTasks";
      for (const b of bullets) {
        if (!b) continue;
        sections[sec] = sections[sec] || [];
        sections[sec].push(b);

        // tools 키워드 포함 라인은 tools에도 포함(요구사항)
        if (JD_REC_V1__looksLikeToolsLine(b) && sec !== "tools") {
          sections.tools.push(b);
        }
      }
    }
  } catch (e) {
    debug.errors.push(JD_REC_V1__safeStr(e?.message || e || "jd_parse_error"));
  }

  // weight 높은 섹션 우선(변경 금지 설계): mustHave/coreTasks/tools/preferred
  const weights = { mustHave: 1.0, coreTasks: 0.9, tools: 0.8, preferred: 0.5 };

  const mk = (sec, idx, text) => ({
    key: `JD__${sec}__${String(idx + 1).padStart(3, "0")}`,
    section: sec,
    weight: Number(weights[sec] ?? 0.5),
    text: JD_REC_V1__safeStr(text).trim(),
  });

  // 원문 유지 + 중복 제거/6자 이하 제거는 "선정 단계"에서 수행
  const signals = [];
  for (const sec of ["mustHave", "coreTasks", "tools", "preferred"]) {
    const arr = Array.isArray(sections[sec]) ? sections[sec] : [];
    for (let i = 0; i < arr.length; i++) signals.push(mk(sec, i, arr[i]));
  }

  return { version: 1, sections, signals, debug };
}

function JD_REC_V1__selectTopSignals(jdSignals, limit = JD_REC_V1__LIMIT) {
  const arr0 = Array.isArray(jdSignals?.signals) ? jdSignals.signals : [];
  const arr = JD_REC_V1__filterSignalsByRules(arr0);
  const seen = new Set();
  const out = [];

  // 이미 signals가 weight 우선 순으로 push되지만, 안전하게 weight 내림차순 정렬
  const sorted = arr.slice().sort((a, b) => (Number(b?.weight || 0) - Number(a?.weight || 0)));

  for (const s of sorted) {
    const text = JD_REC_V1__safeStr(s?.text).trim();
    if (!text) continue;
    if (text.length <= JD_REC_V1__MINLEN) continue; // 6자 이하 제외(변경 금지)
    const k = JD_REC_V1__normLine(text);
    if (!k) continue;
    if (seen.has(k)) continue; // 중복 제거(변경 금지)
    seen.add(k);
    out.push({ ...s, text });
    if (out.length >= limit) break; // 상위 12개(변경 금지)
  }
  return out;
}

function JD_REC_V1__detectCertMention(text) {
  const t = JD_REC_V1__normLine(text);
  // "JD에 자격증 명시" 최소 패턴 (확장 금지, 보수적)
  return /(자격증|자격|certification|certified|license|cpsm|cpim|pmp|cfa|frm|sqld|sqlde|정보처리기사)\b/.test(t);
}

function JD_REC_V1__computeGap({ selectedSignals, resumeText, semanticFn }) {
  const debug = { usedSemantic: false, errors: [] };
  const items = [];

  try {
    const fn = typeof semanticFn === "function" ? semanticFn : null;
    debug.usedSemantic = !!fn;

    for (const s of (Array.isArray(selectedSignals) ? selectedSignals : [])) {
      const text = JD_REC_V1__safeStr(s?.text).trim();
      if (!text) continue;

      let sim = null;
      try {
        if (fn) {
          // fn(signature)은 프로젝트에 따라 다를 수 있어 "try 2가지"로 방어 (append-only)
          // 1) fn(jdLine, resumeText) -> number
          // 2) fn({ a: jdLine, b: resumeText }) -> number
          const v1 = fn(text, resumeText);
          if (typeof v1 === "number") sim = v1;
          else {
            const v2 = fn({ a: text, b: resumeText });
            if (typeof v2 === "number") sim = v2;
          }
        }
      } catch { /* noop */ }

      const similarity = (typeof sim === "number" && Number.isFinite(sim)) ? sim : null;

      let band = null;
      if (similarity === null) band = null;
      else if (similarity >= 0.75) band = "met";
      else if (similarity >= 0.5) band = "weak";
      else band = "gap";

      items.push({
        signalKey: s.key,
        section: s.section,
        weight: Number(s.weight ?? 0) || 0,
        text,
        similarity,
        band,
        meta: {
          certMentionedInJD: JD_REC_V1__detectCertMention(text),
        },
      });
    }
  } catch (e) {
    debug.errors.push(JD_REC_V1__safeStr(e?.message || e || "jd_gap_error"));
  }

  const stats = { computed: items.length, met: 0, weak: 0, gap: 0, unknown: 0 };
  for (const it of items) {
    if (it.band === "met") stats.met++;
    else if (it.band === "weak") stats.weak++;
    else if (it.band === "gap") stats.gap++;
    else stats.unknown++;
  }

  return { version: 1, items, stats, debug };
}

function JD_REC_V1__getTop3RiskIds(decisionPack) {
  const rr = Array.isArray(decisionPack?.riskResults) ? decisionPack.riskResults : [];
  const scored = rr
    .map((r) => {
      const p = Number(r?.priority ?? r?.p ?? r?.score ?? 0) || 0;
      const id = JD_REC_V1__safeStr(r?.id).trim();
      return { id, p };
    })
    .filter((x) => x.id);
  scored.sort((a, b) => b.p - a.p);
  return scored.slice(0, 3).map((x) => x.id);
}

function JD_REC_V1__riskPressureForSignalText(top3RiskIds, signalText) {
  // Top3 관련이면 1.0, 아니면 0.7 (변경 금지)
  // 연관성은 "보수적 키워드 맵" 기반 (과매칭 방지)
  const t = JD_REC_V1__normLine(signalText);
  if (!t) return 0.7;

  const ids = Array.isArray(top3RiskIds) ? top3RiskIds : [];
  const map = [
    { id: "SIMPLE__DOMAIN_SHIFT", re: /(산업|도메인|동종|전환|업계|업종)/ },
    { id: "SIMPLE__ROLE_SHIFT", re: /(직무|포지션|전환|업무변경|역할)/ },
    { id: "GATE__SALARY_MISMATCH", re: /(연봉|compensation|salary|pay|처우)/ },
    { id: "GATE__AGE", re: /(나이|연차|years|경력연수)/ },
    // 필요 시 "append-only"로만 추가 (확장 금지 / 최소만)
  ];

  for (const x of map) {
    if (!ids.includes(x.id)) continue;
    if (x.re.test(t)) return 1.0;
  }
  return 0.7;
}

function JD_REC_V1__strengthFromScore(score) {
  // (요구사항에 "S/A/B" 명시 + 구간은 이미 합의된 값 사용)
  if (score >= 0.55) return "S";
  if (score >= 0.35) return "A";
  return "B";
}

const JD_REC_V1__CERT_TOKENS_GENERAL = [
  // 데이터/DB (국내)
  "ADSP", "ADP", "SQLD", "SQLP",
  // 프로젝트/프로세스 (글로벌)
  "PMP", "CAPM", "ITIL", "PRINCE2",
  "CSM", "PSM",
  // 보안/클라우드/재무(대표)
  "CISSP", "CISM", "CEH", "OSCP",
  "CFA", "CPA", "CMA", "FRM",
  // 구매/조달/SCM (대표)
  "CPSM", "CPIM", "CSCP",
];

const JD_REC_V1__CERT_KEYWORDS_KO = [
  // 회계/재무/ERP (국내 빈도)
  "전산회계", "전산세무", "재경관리사", "회계관리",
  "FAT", "TAT", "ERP정보관리사", "ERP 정보관리사",
  // 물류/유통/무역
  "물류관리사", "유통관리사", "무역영어",
];

const JD_REC_V1__OFFICE_CERT_KEYWORDS = [
  // 사무/컴퓨터 (범용)
  "컴활", "컴퓨터활용능력", "MOS", "ITQ", "워드", "한글", "엑셀",
];

const JD_REC_V1__LANG_TEST_TOKENS = [
  "TOEIC", "TOEFL", "IELTS", "OPIC", "OPICK", "TEPS",
];
// ✅ v3.x (append-only): gate-like priority boost for JD lines (sorting only)
function JD_REC_V1__gateBoostForLine(line) {
  try {
    const t = JD_REC_V1__normLine(line);
    if (!t) return 0;

    let s = 0;

    // 1) must/required/필수 계열
    if (/(필수|자격요건|required|requirement|mandatory)/i.test(t)) s += 0.25;

    // 1.2) 우대/보유자/가능자 계열 (준-게이트: 약하게만)
    // - "우대", "보유자", "소지자", "가능자"는 컷 기준이라기보단 경쟁/조건 신호 → 과추천 방지 위해 낮게
    if (/(우대|보유자|소지자|가능자|유경험자|prefer|preferred|nice\s*to\s*have|plus)/i.test(t)) s += 0.08;

    // 2) 최소 경력/년수 계열: "3년 이상", "n+ years", "at least 5 years"
    if (/(\d+)\s*(년|years?)\s*(이상|over|\+|plus)/i.test(t)) s += 0.22;
    if (/(at\s*least)\s*\d+\s*years?/i.test(t)) s += 0.22;

    // 2.2) "3년 경력", "5 years experience" (이상/plus 없이도 최소요건일 수 있음 → 중간)
    if (/(\d+)\s*(년|years?)\s*(경력|experience)?/i.test(t)) s += 0.12;

    // 3) 자격증/면허/어학 점수 계열
    if (/(자격증|자격\s*요건|면허|license|certificat)/i.test(t)) s += 0.18;

    // 3.2) 자격증 토큰(약어) 매칭: JD에 특정 자격이 박혀있으면 사실상 조건 신호
    // - 과도한 쏠림 방지 위해 중간 정도로만
    if (/\b(CPSM|CPIM|PMP|ADsP|SQLD|SQLP|CFA|CPA|CMA|CSCP|FRM)\b/i.test(t)) s += 0.14;

    // 3.3) 어학/영어: "가능"만으로는 애매 → 낮게, 점수/시험명은 조금 높게
    if (/(toeic|toefl|ielts|opick|opic|어학)/i.test(t)) s += 0.12;
    if (/(영어|english)\s*(필수|능통|우대|가능)?/i.test(t)) s += 0.08;
    if (/(toeic|toefl|ielts|opic)\s*\d{2,4}/i.test(t)) s += 0.06;
    //
    // 3.4) 범용(일반) 자격증/사무자격/어학 점수형 보강 (append-only)
    // - "전부 다"가 아니라, JD에서 자주 튀는 범용군만
    //
    try {
      const __u = String(t || "");
      const __U = __u.toUpperCase();

      // 일반 자격증 토큰(약어) 감지
      // ex) ADsP/SQLD/PMP/CPSM...
      for (const tok of JD_REC_V1__CERT_TOKENS_GENERAL) {
        if (!tok) continue;
        if (__U.includes(String(tok).toUpperCase())) { s += 0.14; break; }
      }

      // 국내 일반 자격증 키워드 감지 (물류/회계 등)
      for (const kw of JD_REC_V1__CERT_KEYWORDS_KO) {
        if (!kw) continue;
        if (__u.includes(String(kw).toLowerCase())) { s += 0.12; break; }
      }

      // 사무/컴퓨터 자격증(컴활/MOS/ITQ 등): 게이트라기보단 "기초역량" → 낮게만
      for (const ok of JD_REC_V1__OFFICE_CERT_KEYWORDS) {
        if (!ok) continue;
        if (__u.includes(String(ok).toLowerCase())) { s += 0.08; break; }
      }

      // 어학시험 + 점수(숫자) 패턴: gate성 강함
      // ex) TOEIC 800 / IELTS 6.5 / OPIC IM2
      // - 숫자 점수면 +0.10
      // - "이상/over/≥"면 추가 +0.08
      const __hasLang = JD_REC_V1__LANG_TEST_TOKENS.some((x) => __U.includes(String(x).toUpperCase()));
      if (__hasLang) {
        if (/(toeic|toefl|ielts|teps)\s*\d{2,4}(\.\d)?/i.test(__u)) s += 0.10;
        if (/(opic|opick)\s*(im\d|ih|al|am|il|nm)/i.test(__u)) s += 0.08;
        if (/(\d{2,4}(\.\d)?)\s*(점|score)?\s*(이상|over|\+|plus|≥|이상)\b/i.test(__u)) s += 0.08;
      }
    } catch { }

    // 4) 학력/전공/근무조건(제약) 계열
    if (/(학력|전공|졸업|4년제|석사|박사|근무지|지역|출근|상주|교대|shift|주말)/i.test(t)) s += 0.10;

    // clamp 0..0.35 (정렬 영향만, 과도한 쏠림 방지)
    if (s < 0) s = 0;
    if (s > 0.35) s = 0.35;
    return s;
  } catch {
    return 0;
  }
}
function JD_REC_V1__typeFromSection(section, isCertCandidate) {
  // 갭이 "경험/업무(coreTasks)"면 project, "도구/스킬(tools)"면 learning, 자격증은 조건부 certification
  if (isCertCandidate) return "certification";
  if (section === "coreTasks") return "project";
  if (section === "tools") return "learning";
  // mustHave/preferred는 보수적으로 learning (실제 프로젝트 추천은 coreTasks에서만)
  return "learning";
}

function JD_REC_V1__generateRecommendations({ decisionPack, jdSignals, jdGap }) {
  const rec = { version: 1, items: [], cap: { maxItems: 5 } };

  try {
    const top3 = JD_REC_V1__getTop3RiskIds(decisionPack);
    const gaps = Array.isArray(jdGap?.items) ? jdGap.items : [];
    const thresholdSA = 2; // "S/A가 이미 2개 이상이면 자격증은 무조건 B"

    // 후보: weak/gap만 (met 제외)
    const candidates = gaps
      .filter((g) => g && (g.band === "weak" || g.band === "gap"))
      .map((g) => {
        const sim = (typeof g.similarity === "number" && Number.isFinite(g.similarity)) ? g.similarity : null;
        const riskPressure = JD_REC_V1__riskPressureForSignalText(top3, g.text);
        const gateBoost = JD_REC_V1__gateBoostForLine(g.text);
        // gapSeverity = clamp((0.75 - similarity) / 0.75, 0..1)
        const gapSeverity = (sim === null) ? 0 : JD_REC_V1__clamp01((0.75 - sim) / 0.75);

        const baseScore = (Number(g.weight ?? 0) || 0) * gapSeverity * riskPressure;

        return {
          ...g,
          _riskPressure: riskPressure,
          _gapSeverity: gapSeverity,
          _gateBoost: gateBoost,
          _recScore: baseScore,
        };
      })
      // "JD 갭이 커도 Top3와 무관하면 과추천 금지" → riskPressure 0.7인 것들은 뒤로 밀리게 점수 구조로 해결
      .sort((a, b) => (Number(b._recScore || 0) - Number(a._recScore || 0)));
    // ✅ v3.x: 안정성 강화 정렬 (append-only, score 무영향)
    candidates.sort((a, b) => {

      // 1️⃣ band 우선
      const bandRank = { gap: 0, weak: 1 };
      const bandDiff =
        (bandRank[a.band] ?? 9) - (bandRank[b.band] ?? 9);
      if (bandDiff !== 0) return bandDiff;
      // 1.5️⃣ gateBoost 높은 순 (게이트성 문장 우선)
      const gbDiff =
        (Number(b._gateBoost || 0)) -
        (Number(a._gateBoost || 0));
      if (gbDiff !== 0) return gbDiff;
      // 2️⃣ riskPressure 높은 순
      const rpDiff =
        (Number(b._riskPressure || 0)) -
        (Number(a._riskPressure || 0));
      if (rpDiff !== 0) return rpDiff;

      // 3️⃣ weight 높은 순
      const weightDiff =
        (Number(b.weight || 0)) -
        (Number(a.weight || 0));
      if (weightDiff !== 0) return weightDiff;

      // 4️⃣ 기존 점수
      return (Number(b._recScore || 0)) -
        (Number(a._recScore || 0));
    });
    // ✅ v3.x (append-only): "met인데 gateBoost 높은 항목"을 소량만 후보 풀에 추가
    // - band 우선( gap/weak )은 절대 유지
    // - met은 추천이 부족할 때만 뒤쪽에 채우는 용도
    try {
      // gateBoost는 line(text) 기준으로 계산 (기존 함수 재사용)
      const __metStrong = gaps
        .filter((g) => g && g.band === "met")
        .map((g) => {
          const sim =
            (typeof g.similarity === "number" && Number.isFinite(g.similarity))
              ? g.similarity
              : null;

          const gb = JD_REC_V1__gateBoostForLine(g.text);

          return {
            ...g,
            _gateBoost: gb,
            _riskPressure: 0, // met는 "과추천 방지" 위해 기본 낮게 (정렬/표시용)
            _gapSeverity: (sim === null) ? 0 : JD_REC_V1__clamp01((0.75 - sim) / 0.75),
            _recScore: 0,     // 기존 점수 체계 영향 X (후보 풀 채움용)
          };
        })
        // 강한 게이트만: years/must/cert 등에 걸린 케이스 위주
        .filter((g) => Number(g?._gateBoost || 0) >= 0.22)
        // gateBoost 높은 순 → similarity 낮은 순(더 부족한 것 먼저)
        .sort((a, b) => {
          const d1 = Number(b?._gateBoost || 0) - Number(a?._gateBoost || 0);
          if (d1 !== 0) return d1;
          const sa = Number.isFinite(a?.similarity) ? a.similarity : 1;
          const sb = Number.isFinite(b?.similarity) ? b.similarity : 1;
          if (sa !== sb) return sa - sb;
          return 0;
        })
        // 너무 많이 섞지 않기: 최대 2개만 (보수 옵션)
        .slice(0, 2);

      if (__metStrong && __metStrong.length) {
        // 후보 부족할 때만 추가하는 게 더 안전
        // (rec은 최대 5개라 후보 풀만 늘려도 loop에서 자연스럽게 채워짐)
        candidates.push(...__metStrong);
        candidates.sort((a, b) => {
          const bandRank = { gap: 0, weak: 1, met: 2 };
          const bandDiff = (bandRank[a.band] ?? 9) - (bandRank[b.band] ?? 9);
          if (bandDiff !== 0) return bandDiff;
          const gbDiff = (Number(b._gateBoost || 0)) - (Number(a._gateBoost || 0));
          if (gbDiff !== 0) return gbDiff;
          const rpDiff = (Number(b._riskPressure || 0)) - (Number(a._riskPressure || 0));
          if (rpDiff !== 0) return rpDiff;
          const weightDiff = (Number(b.weight || 0)) - (Number(a.weight || 0));
          if (weightDiff !== 0) return weightDiff;
          return (Number(b._recScore || 0)) - (Number(a._recScore || 0));
        });
      }
    } catch { }
    let saCount = 0;
    const usedSignalKey = new Set();

    for (const c of candidates) {
      if (!c || rec.items.length >= 5) break; // 최대 5개 상한(변경 금지)
      if (usedSignalKey.has(c.signalKey)) continue; // 동일 signalKey 중복 제거
      usedSignalKey.add(c.signalKey);

      const sim = (typeof c.similarity === "number" && Number.isFinite(c.similarity)) ? c.similarity : null;
      const isCertMentioned = Boolean(c?.meta?.certMentionedInJD);
      const isCertCandidate = isCertMentioned && sim !== null && sim < 0.4; // 조건: JD 명시 + similarity < 0.40

      let strength = JD_REC_V1__strengthFromScore(Number(c._recScore || 0));
      if (strength === "S" || strength === "A") saCount++;

      // 자격증 추천 안전장치: S/A가 이미 2개 이상이면 자격증은 무조건 B
      let type = JD_REC_V1__typeFromSection(c.section, isCertCandidate);
      // v3.x: tool/system mentions should be "learning" even if section is coreTasks (append-only)
      try {
        const tt = JD_REC_V1__normLine(c.text);
        if (tt && /\b(sap|erp|oracle|netsuite|srm|ariba|coupa|wms|tms)\b/i.test(tt)) {
          if (type !== "certification") type = "learning";
        }
      } catch { }
      // ✅ v3.x (append-only): general cert / office cert / language score type hints
      // - 룰은 최소: "범주 감지"만 하고, 나머지는 AI/parsedJD가 해결
      try {
        const __tt = JD_REC_V1__normLine(c.text);
        const __U = String(__tt || "").toUpperCase();

        // 1) 어학시험/점수형은 보통 "학습/정리" 액션이 자연스러움
        // ex) TOEIC 800 이상, OPIc IM2 이상
        const __hasLang = JD_REC_V1__LANG_TEST_TOKENS.some((x) => __U.includes(String(x).toUpperCase()));
        if (__hasLang) {
          type = "learning";
        }

        // 2) 사무/컴퓨터 자격증(컴활/MOS/ITQ 등)도 learning이 자연스러움
        for (const ok of JD_REC_V1__OFFICE_CERT_KEYWORDS) {
          if (!ok) continue;
          if (String(__tt || "").includes(String(ok).toLowerCase())) { type = "learning"; break; }
        }

        // 3) 일반 자격증(회계/물류/데이터 등)은 certification이 자연스러움
        // - 약어 토큰
        for (const tok of JD_REC_V1__CERT_TOKENS_GENERAL) {
          if (!tok) continue;
          if (__U.includes(String(tok).toUpperCase())) { type = "certification"; break; }
        }
        // - 한글 키워드
        if (type !== "certification") {
          for (const kw of JD_REC_V1__CERT_KEYWORDS_KO) {
            if (!kw) continue;
            if (String(__tt || "").includes(String(kw).toLowerCase())) { type = "certification"; break; }
          }
        }
      } catch { }

      if (type === "certification") {
        if (saCount >= thresholdSA) strength = "B";
        // "자격증 밀어주기 구조 금지" → 이유 문구에 '조건부' 명시
      }

      // title/reason 생성(보수적, 반드시 포함)
      const pct = (sim === null) ? "?" : String(Math.round(sim * 100));
      const sectionLabel =
        c.section === "mustHave" ? "필수요건" :
          c.section === "preferred" ? "우대사항" :
            c.section === "tools" ? "기술/툴" :
              "주요업무";

      const riskNote = (c._riskPressure >= 1.0)
        ? "현재 TOP3 탈락 트리거와 연관"
        : "현재 TOP3와 직접 연관은 약함(과추천 방지로 우선순위 낮춤)";

      let title = "";
      if (type === "project") title = `미니 프로젝트로 '${c.text}' 증거 만들기`;
      else if (type === "learning") title = `'${c.text}' 보완 학습/정리`;
      else title = `조건부 자격증 검토: '${c.text}'`;

      let reason = `JD ${sectionLabel}에서 '${c.text}' 요구가 약하게 감지됨(유사도 ${pct}%). ${riskNote}.`;
      if (type === "certification") {
        reason = `JD에 자격/자격증 명시가 있고 '${c.text}'가 크게 부족함(유사도 ${pct}%). S/A 과다 추천 방지를 위해 B등급(조건부)로만 제안.`;
      }
      // ✅ v3.x: HR 압력 기반 reason 강화 (append-only, 엔진 무영향)
      const pressureLevel =
        c._riskPressure >= 0.9 ? "상위 핵심 리스크와 직접 연결된 신호입니다." :
          c._riskPressure >= 0.8 ? "상위 리스크와 밀접하게 연결된 신호입니다." :
            c._riskPressure >= 0.7 ? "경쟁 압력에 영향을 주는 신호입니다." :
              "경쟁력 보완이 필요한 신호입니다.";

      const gapLevel =
        c._gapSeverity >= 0.7 ? "이력서에서 거의 확인되지 않습니다." :
          c._gapSeverity >= 0.4 ? "언급은 있으나 설득력이 약합니다." :
            "보완 시 경쟁력이 올라갈 수 있습니다.";

      const simText =
        (typeof sim === "number" && Number.isFinite(sim))
          ? `${Math.round(sim * 100)}%`
          : "확인 불가";

      const bandText =
        c.band === "gap" ? "구조적 갭으로 분류됩니다." :
          c.band === "weak" ? "약한 충족으로 분류됩니다." :
            "";

      reason =
        `${c.band === "gap"
          ? "현재 이 항목은 JD 요구 대비 충족 근거가 부족한 상태입니다. "
          : "현재 언급은 있으나 JD 기준에서 충분히 강조되지 않았습니다. "}` +
        `유사도는 ${simText} 수준입니다. ` +
        `${c._riskPressure >= 0.8
          ? "상위 리스크와 연결된 영역이므로 우선 보완이 필요합니다. "
          : "경쟁력 강화를 위해 보완을 고려해볼 수 있습니다. "}` +
        `실무 적용 사례·성과 수치·프로젝트 경험 중 하나라도 구체화하면 체감 평가가 크게 개선될 수 있습니다.`;
      // ✅ v3.x (append-only): type limit guard (practical)
      // - project는 2개까지만 (현 케이스처럼 rec이 3개여도 발동)
      // - 단, 추천이 너무 비는 걸 막기 위해 rec이 2개 미만일 때는 제한을 완화
      try {
        const __t = type || "learning";
        const __lim = (Object.prototype.hasOwnProperty.call(__typeLimit, __t))
          ? Number(__typeLimit[__t] || 0)
          : 0;

        if (__lim > 0) {
          const __cnt = Number(__typeCount[__t] || 0);

          // 너무 비면 UX가 깨지니 예외: 2개 미만일 때는 제한 완화
          if (__t === "project") {
            if (__cnt >= __lim) continue;
          } else {
            if (rec.items.length >= 2 && __cnt >= __lim) continue;
          }
        }
      } catch { }

      rec.items.push({
        id: `REC__JDGAP__${String(rec.items.length + 1).padStart(3, "0")}`,
        source: "jd_gap",
        type,
        strength,
        title,
        reason,
        top3Link: {
          connected: c._riskPressure >= 0.8,
          pressure: c._riskPressure,
        },
        // v3.x: UI/공유/로그 경로 안정화용 (append-only)
        signalText: c.text,
        jdText: c.text,

        related: {
          signalKey: c.signalKey,
          section: c.section,
          weight: Number(c.weight ?? 0) || 0,
          similarity: sim,
          band: c.band,
          riskPressure: Number(c._riskPressure || 0) || 0.7,

          // v3.x: related에도 텍스트 남겨서 백워드 호환 (append-only)
          signalText: c.text,
          jdText: c.text,
        },
      });
      try {
        const __t2 = type || "learning";
        __typeCount[__t2] = Number(__typeCount[__t2] || 0) + 1;
      } catch { }
    }
  } catch {
    // noop: 운영 안정성
  }
  // ✅ PATCH (append-only): JD_REC_V1 AI rewrite helpers + cache (v1)
  // - 안정성: AI 실패/부재/파싱 실패 시 기존 템플릿 유지
  // - AI 역할: 해석/문장 생성만 (정렬/게이트/점수/band 판단 금지)
  // - 캐시: memory(Map) + sessionStorage(선택적)
  // ------------------------------------------------------------

  const JD_REC_V1__AI_CACHE__MEM = new Map();
  const JD_REC_V1__AI_CACHE__SS_KEY = "__RA_JDREC_AI_CACHE_V1__";

  function JD_REC_V1__safeNum(n, fallback = 0) {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
  }

  function JD_REC_V1__round2(n) {
    const x = JD_REC_V1__safeNum(n, 0);
    return Math.round(x * 100) / 100;
  }

  function JD_REC_V1__clampStr(s, maxLen) {
    try {
      const t = String(s ?? "");
      if (!maxLen || maxLen <= 0) return t;
      return t.length > maxLen ? t.slice(0, maxLen - 1) + "…" : t;
    } catch {
      return "";
    }
  }

  function JD_REC_V1__isNonEmptyStr(s) {
    return typeof s === "string" && s.trim().length > 0;
  }

  function JD_REC_V1__readSessionCache() {
    try {
      const raw = sessionStorage.getItem(JD_REC_V1__AI_CACHE__SS_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? obj : null;
    } catch {
      return null;
    }
  }

  function JD_REC_V1__writeSessionCache(cacheObj) {
    try {
      sessionStorage.setItem(JD_REC_V1__AI_CACHE__SS_KEY, JSON.stringify(cacheObj || {}));
    } catch {
      // ignore
    }
  }

  function JD_REC_V1__aiCacheGet(key) {
    try {
      if (JD_REC_V1__AI_CACHE__MEM.has(key)) return JD_REC_V1__AI_CACHE__MEM.get(key);

      const ss = JD_REC_V1__readSessionCache();
      if (ss && Object.prototype.hasOwnProperty.call(ss, key)) {
        const v = ss[key];
        JD_REC_V1__AI_CACHE__MEM.set(key, v);
        return v;
      }
    } catch {
      // ignore
    }
    return null;
  }

  function JD_REC_V1__aiCacheSet(key, value) {
    try {
      JD_REC_V1__AI_CACHE__MEM.set(key, value);
      const ss = JD_REC_V1__readSessionCache() || {};
      ss[key] = value;
      JD_REC_V1__writeSessionCache(ss);
    } catch {
      // ignore
    }
  }

  function JD_REC_V1__makeAiCacheKey(ctx) {
    // AI 출력에 영향을 주는 최소 키만 포함 (적중률/정확도 균형)
    try {
      const jdLine = String(ctx?.evidence?.jdLine ?? "");
      const riskType = String(ctx?.risk?.riskType ?? "");
      const band = String(ctx?.risk?.band ?? "");
      const gateBoost = JD_REC_V1__round2(ctx?.risk?.gateBoost ?? 0);
      const riskPressure = JD_REC_V1__round2(ctx?.risk?.riskPressure ?? 0);
      const sim = JD_REC_V1__round2(ctx?.evidence?.similarity ?? 0);
      const top3Linked = ctx?.risk?.top3Linked ? "1" : "0";
      const uiType = String(ctx?.ui?.type ?? "");
      // 너무 길어지지 않도록 jdLine은 일부만
      const jdLineShort = jdLine.length > 140 ? jdLine.slice(0, 140) : jdLine;
      return [
        "v1",
        uiType,
        band,
        riskType,
        "gb" + gateBoost,
        "rp" + riskPressure,
        "sim" + sim,
        "t3" + top3Linked,
        jdLineShort,
      ].join("|");
    } catch {
      return "v1|invalid";
    }
  }

  function JD_REC_V1__deriveHrFrameFromLine(jdLine, uiType) {
    // "자격증이 주어"가 되지 않도록, 가능한 한 '판단 기준(역량)'을 주어로 만들기
    const line = String(jdLine ?? "");
    const l = line.toLowerCase();

    // tool/erp
    if (/(sap|erp)/i.test(line)) {
      return {
        intent: "즉시투입",
        criterion: "실무 도구(SAP/ERP)로 프로세스를 굴려본 경험",
        whyNow: "온보딩 비용/리스크를 줄이려는 필터링입니다.",
      };
    }

    // years
    if (/(년\s*이상|years?\s*\+?|minimum\s*\d+)/i.test(line)) {
      return {
        intent: "필터링",
        criterion: "동일 범위에서 즉시 투입 가능한 실전 경험",
        whyNow: "경험치로 리스크를 컷하는 패턴입니다.",
      };
    }

    // certification / language
    if (uiType === "certification" || /(cpsm|cpim|pmp|toeic|opic|toefl|ielts|자격|어학)/i.test(line)) {
      // 인증/자격은 '표준 프레임/검증' 의도
      let certHint = "";
      if (/(cpsm)/i.test(line)) certHint = " (CPSM)";
      else if (/(cpim)/i.test(line)) certHint = " (CPIM)";
      return {
        intent: "경쟁비교",
        criterion: "표준 프레임으로 구매/공급망 판단을 증명하는 신호" + certHint,
        whyNow: "동급 지원자 비교에서 ‘검증 가능한 신호’를 확보하려는 의도입니다.",
      };
    }

    // project-ish default
    if (uiType === "project" || /(절감|원가|소싱|협상|sourcing|cost)/i.test(line)) {
      return {
        intent: "즉시투입",
        criterion: "전략소싱/협상으로 원가절감 성과를 만든 경험",
        whyNow: "실제 성과로 판단 역량을 검증하려는 패턴입니다.",
      };
    }

    // fallback
    return {
      intent: "필터링",
      criterion: "JD 핵심 요구를 ‘이력서 문장’으로 증명하는 능력",
      whyNow: "요구조건을 충족시키는 신호가 약하면 컷이 발생합니다.",
    };
  }

  function JD_REC_V1__buildRecommendationContextV1({ item, decisionPack, top3RiskIds }) {
    // item: 기존 추천 item (type/strength/signalText/title/reason 등)
    // decisionPack: riskResults/jdGap 등
    const jdLine = String(item?.signalText ?? item?.jdText ?? "");
    const band = String(item?.strength ?? item?.band ?? "B");
    const uiType = String(item?.type ?? "rewrite");
    const gateBoost = JD_REC_V1__safeNum(item?.gateBoost, null);
    const riskPressure = JD_REC_V1__safeNum(item?.riskPressure, null);
    const similarity = JD_REC_V1__safeNum(item?.similarity, null);

    // riskType 추정(엔진 내부 키가 있으면 그대로 사용)
    const riskType =
      String(item?.riskType ?? item?.riskCode ?? item?.riskId ?? "").trim() || "JD_REC_V1";

    // top3 연결 여부(있으면 true)
    const top3Arr = Array.isArray(top3RiskIds) ? top3RiskIds : [];
    const top3Linked =
      !!(item?.top3Linked) ||
      (JD_REC_V1__isNonEmptyStr(riskType) && top3Arr.includes(riskType));

    const hrFrame = JD_REC_V1__deriveHrFrameFromLine(jdLine, uiType);

    const ctx = {
      recId: String(item?.id ?? item?.recId ?? ""),
      source: item?.source && typeof item.source === "object" ? item.source : null,

      hrFrame,

      risk: {
        riskType,
        band,
        gateBoost: gateBoost === null ? null : JD_REC_V1__round2(gateBoost),
        riskPressure: riskPressure === null ? null : JD_REC_V1__round2(riskPressure),
        top3Linked: !!top3Linked,
        top3Signals: Array.isArray(top3Arr) ? top3Arr.slice(0, 3) : [],
      },

      evidence: {
        jdLine,
        jdLineType: String(item?.jdLineType ?? item?.jdType ?? ""),
        similarity: similarity === null ? null : JD_REC_V1__round2(similarity),
        resumeSnippets: Array.isArray(item?.resumeSnippets) ? item.resumeSnippets.slice(0, 2) : [],
        gaps: Array.isArray(item?.gaps) ? item.gaps.slice(0, 2) : [],
      },

      outputSpec: {
        language: "ko",
        tone: "면접관 내부 메모 같은 단정한 HR 톤",
        length: { titleMax: 26, bodyMax: 160 },
        structure: ["title", "oneLiner", "rewriteHint", "evidenceHint"],
        mustAvoid: ["자격증이 주어인 문장", "과추천", "모호한 위로/동기부여"],
      },

      ui: {
        type: uiType,
        priority: JD_REC_V1__safeNum(item?.priority, null),
      },
    };

    return ctx;
  }

  function JD_REC_V1__validateAiJson(out) {
    // out: {title, oneLiner, rewriteHint, evidenceHint}
    try {
      if (!out || typeof out !== "object") return null;
      const title = String(out.title ?? "");
      const oneLiner = String(out.oneLiner ?? "");
      const rewriteHint = String(out.rewriteHint ?? "");
      const evidenceHint = String(out.evidenceHint ?? "");

      if (!title.trim() || !oneLiner.trim() || !rewriteHint.trim()) return null;

      // 길이 제한(초과하면 truncate로 보정)
      const tMax = JD_REC_V1__safeNum(out?._spec?.titleMax, 26) || 26;
      const bMax = JD_REC_V1__safeNum(out?._spec?.bodyMax, 160) || 160;

      const fixed = {
        title: JD_REC_V1__clampStr(title, tMax),
        oneLiner: JD_REC_V1__clampStr(oneLiner, bMax),
        rewriteHint: JD_REC_V1__clampStr(rewriteHint, bMax),
        evidenceHint: JD_REC_V1__clampStr(evidenceHint, bMax),
      };

      // 금지패턴(너무 강하면 null 처리해서 fallback)
      // "자격증이 주어" 형태를 강하게 유도하는 문장 감지(단순 휴리스틱)
      const bad =
        /^(cpsm|cpim|toeic|opic|자격증|어학)/i.test(fixed.title.trim()) ||
        /^(cpsm|cpim|toeic|opic|자격증|어학)/i.test(fixed.oneLiner.trim());

      if (bad) return null;

      return fixed;
    } catch {
      return null;
    }
  }

  async function JD_REC_V1__aiGenerateRecommendationJson({ ai, ctx, timeoutMs = 1200 }) {
    // ai는 외부 주입/환경에 따라 다를 수 있으니 매우 방어적으로 호출
    // 기대 함수 우선순위:
    // 1) ai.generateJdRecJson(ctx)
    // 2) ai.generateRecommendationJson(ctx)
    // 3) ai.completeJson({schema, prompt, data}) 류 (있으면)
    try {
      if (!ai) return null;

      const spec = ctx?.outputSpec?.length || { titleMax: 26, bodyMax: 160 };

      const p = (async () => {
        if (typeof ai?.generateJdRecJson === "function") {
          return await ai.generateJdRecJson({ ctx });
        }
        if (typeof ai?.generateRecommendationJson === "function") {
          return await ai.generateRecommendationJson({ ctx });
        }
        if (typeof ai?.completeJson === "function") {
          // 가장 범용: schema + ctx 기반
          const schema = {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              oneLiner: { type: "string" },
              rewriteHint: { type: "string" },
              evidenceHint: { type: "string" },
            },
            required: ["title", "oneLiner", "rewriteHint", "evidenceHint"],
          };
          const prompt =
            "너는 채용 담당자/면접관의 내부 메모처럼 단정한 HR 톤으로 추천 문장을 만든다. " +
            "정렬/점수/게이트 판단은 하지 말고, 제공된 context로만 해석/문장화 한다. " +
            "자격증이 주어가 되지 않게, '판단 기준(역량/의도)'이 주어가 되게 써라. " +
            "출력은 JSON만.";
          return await ai.completeJson({ schema, prompt, data: { ctx } });
        }
        return null;
      })();

      const t = new Promise((resolve) => setTimeout(() => resolve(null), Math.max(200, timeoutMs)));
      const out = await Promise.race([p, t]);

      if (!out) return null;

      // 일부 구현체는 string(JSON)으로 줄 수 있음
      let obj = out;
      if (typeof out === "string") {
        try {
          obj = JSON.parse(out);
        } catch {
          return null;
        }
      }

      // validate + clamp
      const validated = JD_REC_V1__validateAiJson({
        ...obj,
        _spec: { titleMax: spec.titleMax, bodyMax: spec.bodyMax },
      });

      return validated;
    } catch {
      return null;
    }
  }
  // ✅ PATCH (append-only): AI rewrite post-process (v1)
  // - 기존 템플릿 추천 유지 + context/aiText만 추가
  try {
    const __items = Array.isArray(rec?.items) ? rec.items : [];
    if (__items.length) {
      const __top3 = Array.isArray(top3) ? top3 : JD_REC_V1__getTop3RiskIds(decisionPack);
      // ai 주입은 환경별로 다를 수 있어 방어적으로 탐색 (없으면 AI 단계 스킵)
      const __ai =
        (decisionPack && typeof decisionPack === "object" && (decisionPack.ai || decisionPack.__ai)) ||
        (typeof globalThis !== "undefined" && globalThis.__RA_AI__) ||
        null;

      for (let i = 0; i < __items.length; i++) {
        const it = __items[i];
        if (!it || typeof it !== "object") continue;

        // 1) context 부착 (항상)
        const ctx = JD_REC_V1__buildRecommendationContextV1({
          item: it,
          decisionPack,
          top3RiskIds: __top3,
        });
        it.context = ctx;

        // 2) AI JSON 생성 + 캐시 (가능할 때만)
        // - aiText는 append-only로만 추가, 기존 title/reason 건드리지 않음
        if (!it.aiText && __ai) {
          const key = JD_REC_V1__makeAiCacheKey(ctx);
          const cached = JD_REC_V1__aiCacheGet(key);
          if (cached && typeof cached === "object") {
            it.aiText = cached;
            it.aiMeta = { source: "cache", key };
          } else {
            // NOTE: sync 함수 내부에서 await를 직접 못 쓰는 경우가 있어,
            //       여기서는 "defer" 방식으로 넣지 않고, 가능한 경우에만 즉시 생성하도록 설계.
            //       generateRecommendations가 async가 아니라면, AI 호출은 아래처럼 "best-effort"로 스킵될 수 있음.
            //       (추후 generateRecommendations를 async로 바꾸지 않기 위해 안전하게 유지)
            const __maybePromise = JD_REC_V1__aiGenerateRecommendationJson({
              ai: __ai,
              ctx,
              timeoutMs: 1200,
            });

            // Promise면 then으로 처리(비동기 후처리). 실패해도 기존 템플릿은 이미 있음.
            if (__maybePromise && typeof __maybePromise.then === "function") {
              __maybePromise
                .then((out) => {
                  if (out && typeof out === "object") {
                    try {
                      it.aiText = out;
                      it.aiMeta = { source: "ai", key };
                      JD_REC_V1__aiCacheSet(key, out);
                    } catch {
                      // ignore
                    }
                  }
                })
                .catch(() => { });
            } else if (__maybePromise && typeof __maybePromise === "object") {
              // 혹시 동기 객체로 오는 구현체 방어
              it.aiText = __maybePromise;
              it.aiMeta = { source: "ai", key };
              JD_REC_V1__aiCacheSet(key, __maybePromise);
            }
          }
        }
      }
    }
  } catch {
    // ignore: 안정성 우선 (추천 결과는 원래 템플릿으로 유지)
  }
  return rec;
}

/* =========================
[STEP B] 아래 "오케스트레이션 부착 블록"을 analyzer.js에서
decisionPack이 성공적으로 만들어진 직후(현재 라인 3044 근처) + simulationViewModel 생성 try/catch 이후
즉, 아래 앵커 블록 바로 다음 줄에 삽입하세요.

앵커(현재 코드):
    // 2) build simulation VM (view-only, safe even when decisionPack is null)
    try {
      const __rr = ...
      simulationViewModel = ...
    } catch (e) {
      simulationViewModel = null;
    }

이 블록 다음에 그대로 붙여넣기.
========================= */

// ✅ feature flag (append-only)
const ENABLE_SEMANTIC = true;
// ------------------------------
// FALLBACK HELPERS (crash-safe insurance)
// ------------------------------
// -----------------------------------------
// hireability score picker (crash-safe)
// - buildInterviewRiskLayer 등에서 사용
// - 정의 누락 시 전체 analyze가 죽는 걸 방지
// -----------------------------------------
function pickHireabilityScore100(input) {
  try {
    const obj = input && typeof input === "object" ? input : {};

    // 1) 가장 우선: hireabilityLayer.score100 / hireability.score100
    const a =
      obj?.hireabilityLayer?.score100 ??
      obj?.hireability?.score100 ??
      obj?.report?.hireabilityLayer?.score100 ??
      obj?.report?.hireability?.score100;

    if (Number.isFinite(a)) {
      return Math.max(0, Math.min(100, a));
    }

    // 2) objective.score100 기반 fallback
    const b = obj?.objective?.score100;
    if (Number.isFinite(b)) {
      return Math.max(0, Math.min(100, b));
    }

    // 3) objective.score01 기반 fallback
    const c = obj?.objective?.score01;
    if (Number.isFinite(c)) {
      return Math.max(0, Math.min(100, Math.round(c * 100)));
    }

    // 4) 최후 fallback (안전 기본값)
    return 50;
  } catch {
    return 50;
  }
}

function _normalizeDetectedIndustryRoleFallback({
  resumeText,
  jdText,
  detectedIndustry,
  detectedRole,
}) {
  const safe = (v) => (v || "").toString().trim().toLowerCase();

  return {
    resumeIndustry: safe(detectedIndustry),
    jdIndustry: safe(detectedIndustry),
    role: safe(detectedRole),
  };
}

function _resolveCompanySizesFallback({
  resumeText,
  jdText,
  detectedCompanySizeCandidate,
  detectedCompanySizeTarget,
}) {
  return {
    candidateSize: detectedCompanySizeCandidate || "",
    targetSize: detectedCompanySizeTarget || "",
  };
}

// ------------------------------
// SAFE BINDINGS (no-ReferenceError guarantees)
// - 절대 "존재하지 않는 식별자"를 직접 참조하지 않는다.
// - 외부(전역/다른 번들)에서 동일 함수가 주입되어도 안전하게 사용 가능
// ------------------------------
const normalizeDetectedIndustryRoleSafe =
  (typeof globalThis !== "undefined" &&
    globalThis &&
    typeof globalThis.normalizeDetectedIndustryRole === "function")
    ? globalThis.normalizeDetectedIndustryRole
    : _normalizeDetectedIndustryRoleFallback;

const resolveCompanySizesSafe =
  (typeof globalThis !== "undefined" &&
    globalThis &&
    typeof globalThis.resolveCompanySizes === "function")
    ? globalThis.resolveCompanySizes
    : _resolveCompanySizesFallback;

const countOwnershipEvidenceSafe =
  (typeof globalThis !== "undefined" &&
    globalThis &&
    typeof globalThis.countOwnershipEvidence === "function")
    ? globalThis.countOwnershipEvidence
    : _countOwnershipEvidenceImpl;

// ------------------------------
// AI helpers (optional / safe)
// ------------------------------
function normalizeStringArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((s) => safeLower(s).trim()).filter(Boolean);
}

function getAiSynonymsMap(ai) {
  const raw = ai?.keywordSynonyms;
  if (!raw || typeof raw !== "object") return null;

  // key/values 모두 소문자 정규화
  const map = new Map();
  for (const [k, v] of Object.entries(raw)) {
    const key = safeLower(k).trim();
    if (!key) continue;
    const list = normalizeStringArray(v);
    if (list.length) map.set(key, list);
  }
  return map.size ? map : null;
}

// candidates를 "alias처럼" 확장: (기존 매칭 로직 유지) + AI 동의어만 추가
function expandCandidatesWithAiSynonyms(candidates, aiSynMap) {
  if (!aiSynMap) return candidates;

  const out = [];
  const seen = new Set();

  const push = (x) => {
    const s = safeLower(x).trim();
    if (!s) return;
    if (seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };

  for (const c of candidates) {
    push(c);
    const key = safeLower(c).trim();
    const syns = aiSynMap.get(key);
    if (syns && syns.length) {
      for (const s of syns) push(s);
    }
  }

  return out;
}

// ------------------------------
// Tokenize (Intl.Segmenter KO support)
// ------------------------------
function tokenize(text) {
  const t = safeLower(text);

  // Intl.Segmenter가 있으면 한국어 word segmentation 사용
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    try {
      const seg = new Intl.Segmenter("ko", { granularity: "word" });
      return Array.from(seg.segment(t))
        .filter((s) => s.isWordLike)
        .map((s) => s.segment.trim())
        .filter(Boolean);
    } catch {
      // ignore and fallback
    }
  }

  // fallback: 기존 정규식
  return t
    .replace(/[^a-z0-9가-힣+./#-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// 단어 경계 기반 + 토큰 기반 매칭
function hasWord(tokensOrText, kw) {
  const k = safeLower(kw).trim();
  if (!k) return false;

  if (Array.isArray(tokensOrText)) {
    const tokens = tokensOrText;
    if (k.includes(" ")) {
      const joined = tokens.join(" ");
      return joined.includes(k);
    }
    return tokens.includes(k);
  }

  const t = safeLower(tokensOrText);

  // 영문/숫자 키워드는 boundary로 오탐 방지
  if (/^[a-z0-9.+/#-]+$/.test(k)) {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(k)}([^a-z0-9]|$)`, "i");
    return re.test(t);
  }
  return t.includes(k);
}

// ------------------------------
// Must-have smarter checks (AI jdMustHave)
// - 문장 그대로 포함 여부가 아니라, "면접관식 해석"으로 충족 판정
// - 기존 구조/리포트는 유지하면서 hasKnockoutMissing 오탐을 줄인다.
// ------------------------------
function parseMinYearsFromText(s) {
  const t = (s || "").toString();
  // "5년 이상", "5년+", "5+ years"
  let m = t.match(/(\d+)\s*년\s*(이상|\+|\s*plus)?/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) return n;
  }
  m = t.match(/(\d+)\s*\+\s*years?/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) return n;
  }
  // "~년 경력" 같은 표현
  m = t.match(/(\d+)\s*년\s*경력/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

// 이력서 텍스트에서 총 경력(년)을 대략 합산
// - "4년", "2년 2개월" 등을 합산
// - 완벽하지 않아도 "문장 미일치로 경력 0 처리"되는 오탐을 줄이는 목적
function estimateTotalYearsFromResumeText(resumeText) {
  const t = (resumeText || "").toString();
  if (!t.trim()) return 0;

  // "2년 2개월"
  const ym = [...t.matchAll(/(\d+)\s*년\s*(\d+)\s*개월/g)].map((m) => ({
    y: Number(m[1]),
    mo: Number(m[2]),
  }));

  // "4년" (단독)
  // - 이미 "x년 y개월"에서 잡힌 y는 제외하기 위해 간단히 스팬 제거는 하지 않고,
  //   대신 '년' 단독 매치는 "년\s*\d+\s*개월" 패턴을 피해 잡히도록 약하게 제한
  const yOnly = [...t.matchAll(/(\d+)\s*년(?!\s*\d+\s*개월)/g)].map((m) => Number(m[1]));

  let months = 0;
  for (const a of ym) {
    if (Number.isFinite(a.y)) months += a.y * 12;
    if (Number.isFinite(a.mo)) months += a.mo;
  }
  for (const y of yOnly) {
    if (Number.isFinite(y)) months += y * 12;
  }

  // 너무 과대합산 방지(이력서에 중복 표기될 수 있으니 상한)
  // 현실적으로 40년 넘는 합산은 거의 오류로 보고 컷
  months = clamp(months, 0, 40 * 12);

  return months / 12;
}

function makeCandidateList(seed, aiSynMap) {
  const base = Array.isArray(seed) ? seed : [seed];
  const expanded = expandCandidatesWithAiSynonyms(base, aiSynMap);
  return uniq(expanded.map((s) => safeLower(s).trim()).filter(Boolean));
}

function anyMatch(tokens, text, candidates) {
  return candidates.some((c) => hasWord(tokens, c) || hasWord(text, c));
}

// must-have 항목을 "충족"으로 볼지 판정
function isMustHaveSatisfied(mustHave, resumeTokens, resumeText, aiSynMap) {
  const raw = (mustHave || "").toString().trim();
  if (!raw) return { ok: true, reason: "empty" };

  const mh = safeLower(raw);

  // 1) 연차 요구: "~년 이상" → 이력서 텍스트에서 총 연차 추정으로 판정
  const minYears = parseMinYearsFromText(raw);
  if (minYears !== null && /(경력|years?|experience)/i.test(mh)) {
    const estYears = estimateTotalYearsFromResumeText(resumeText);
    if (estYears >= minYears) {
      return { ok: true, reason: `years_ok(${estYears.toFixed(1)}>=${minYears})` };
    }
    // 연차 자체가 부족하면 진짜 누락으로 둔다
    return { ok: false, reason: `years_missing(${estYears.toFixed(1)}<${minYears})` };
  }

  // 2) 역할/직무류: "사업기획/전략기획"은 해석이 주관적이라
  //    - "전략", "기획", "사업운영", "마케팅 전략", "KPI", "사업계획" 등의 전이 시그널로 완화 판정
  if (/(사업기획|전략기획|사업\s*전략|strategy\s*planning)/i.test(mh)) {
    const roleCandidates = makeCandidateList(
      [
        "사업기획",
        "전략기획",
        "사업전략",
        "전략",
        "기획",
        "사업 운영",
        "사업운영",
        "운영",
        "마케팅 전략",
        "go-to-market",
        "gtm",
        "kpi",
        "사업계획",
        "연간 사업계획",
        "계획 수립",
        "전략 수립",
      ],
      aiSynMap
    );

    // 강한 매치(정확 표현)
    const strong = makeCandidateList(["사업기획", "전략기획", "사업전략"], aiSynMap);
    if (anyMatch(resumeTokens, resumeText, strong)) {
      return { ok: true, reason: "role_strong" };
    }

    // 전이 시그널 2개 이상이면 "완전 누락"으로 보지 않음
    const weakSignals = roleCandidates.filter((c) => anyMatch(resumeTokens, resumeText, [c]));
    if (weakSignals.length >= 2) {
      return { ok: true, reason: `role_transferrable(${weakSignals.slice(0, 4).join(",")})` };
    }

    // 전혀 힌트가 없으면 누락
    return { ok: false, reason: "role_missing" };
  }

  // 3) 손익(P/L) 분석: 표현 다양 → 동의어로 판정
  if (/(손익|p\/l|pl\s*분석|영업손익|profit\s*loss)/i.test(mh)) {
    const plCandidates = makeCandidateList(
      [
        "손익",
        "p/l",
        "pl",
        "손익 분석",
        "p/l 분석",
        "영업손익",
        "사업부 손익",
        "매출",
        "이익",
        "마진",
        "profit",
        "loss",
        "p&l",
      ],
      aiSynMap
    );

    // "매출 18% 증가" 같은 문장이 있으면 손익 그 자체는 아니지만,
    // 최소한 재무/성과 지표 기반 운영 감각이 있다는 신호로 약하게 인정.
    // 단, "손익/P&L" 직접 표현이 있으면 강하게 인정.
    const strong = makeCandidateList(["손익", "p/l", "p&l", "영업손익", "사업부 손익"], aiSynMap);
    if (anyMatch(resumeTokens, resumeText, strong)) {
      return { ok: true, reason: "pl_strong" };
    }

    const weak = plCandidates.filter((c) => anyMatch(resumeTokens, resumeText, [c]));
    if (weak.length >= 2) {
      return { ok: true, reason: `pl_weak(${weak.slice(0, 4).join(",")})` };
    }

    return { ok: false, reason: "pl_missing" };
  }

  // 4) 제조업/산업재 도메인: 도메인 힌트로 판정
  if (/(제조업|산업재|manufactur|factory|production|공장)/i.test(mh)) {
    const domainCandidates = makeCandidateList(
      [
        "제조",
        "제조업",
        "생산",
        "공장",
        "품질",
        "납기",
        "리드타임",
        "공정",
        "설비",
        "원가",
        "재고",
        "공급망",
        "scm",
        "supply chain",
        "산업재",
        "b2b",
      ],
      aiSynMap
    );

    if (anyMatch(resumeTokens, resumeText, domainCandidates)) {
      return { ok: true, reason: "domain_hint" };
    }
    return { ok: false, reason: "domain_missing" };
  }

  // 5) 그 외: 기존처럼 "표현 포함"으로 판정하되 AI 동의어를 보조로 사용
  // - mustHave 문장 자체가 길면, 핵심 키워드만 뽑아서 매칭(오탐 방지)
  const compact = mh
    .replace(/\([^)]*\)/g, " ")
    .replace(/[\[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = tokenize(compact).slice(0, 8); // 너무 길면 앞부분만
  const candidates = makeCandidateList([raw, ...tokens], aiSynMap);

  const ok = anyMatch(resumeTokens, resumeText, candidates);
  return { ok, reason: ok ? "generic_ok" : "generic_missing" };
}

// ------------------------------
// Major/Education signals (optional / safe)
// - 목적: 전공이 중요한 JD에서는 유사 전공을 소폭 가산(A) + 가설 우선순위(B) 반영
// - 원칙: JD가 중요 신호를 줄 때만 영향이 커짐 / 정보 부족 시 추측하지 않음(0 처리)
// ------------------------------
function getCandidateMajorFromStateOrAi(state, ai) {
  const sMajor = state?.profile?.major ?? state?.education?.major ?? state?.candidate?.major;
  const aMajor = ai?.profileExtract?.major ?? ai?.candidateProfile?.major;
  const major = (sMajor ?? aMajor ?? "").toString().trim();
  return major;
}

function parseMajorImportanceFromJD(jd) {
  const t = safeLower(jd);

  let imp = 0.15;

  // (A) 전공/학위 명시 요구
  const hasMajorWord = /(전공|관련\s*학과|관련학과|학과|major)/i.test(t);
  const hasDegreeWord = /(학사|석사|박사|학위|degree|master|ph\.?d|bachelor)/i.test(t);

  const explicitRequired = /(전공\s*(필수|required)|관련\s*학과\s*(필수|required)|학위\s*(필수|required)|석사\s*이상|박사\s*우대|박사\s*이상|required\s*degree)/i.test(t);
  const explicitPreferred = /(전공\s*(우대|선호|preferred)|관련\s*학과\s*(우대|선호)|학위\s*(우대|선호)|석사\s*우대|학사\s*이상)/i.test(t);

  if (explicitRequired) imp += 0.55;
  else if (explicitPreferred) imp += 0.35;
  else if (hasMajorWord || hasDegreeWord) imp += 0.22;

  // (B) 직무 성격상 전공 게이트가 자주 존재하는 영역
  const hasRndStrong = /(연구|r&d|rnd|개발|설계|회로|공정|소자|실험|시험|검증|모델링|알고리즘|논문|특허|전산유체|finite element|fea|cfd)/i.test(t);
  const hasDataResearch = /(데이터|data|분석|analytics|리서치|research|통계|statistics|모델|model|머신러닝|machine learning|ml|딥러닝|deep learning)/i.test(t);

  if (hasRndStrong) imp += 0.35;
  else if (hasDataResearch) imp += 0.25;

  // (C) 전공 영향이 낮은 직무군(명시 요구가 없을 때만 완화)
  const hasLowMajorFamily = /(영업|sales|bd|bizdev|마케팅|marketing|브랜딩|brand|cs|cx|고객|커뮤니티|community)/i.test(t);
  if (!explicitRequired && !explicitPreferred && hasLowMajorFamily) {
    imp -= 0.2;
  }

  return clamp(imp, 0, 1);
}

function inferJobFamilyFromJD(jd) {
  const t = safeLower(jd);

  const isRnd =
    /(연구|r&d|rnd|개발|설계|회로|공정|소자|실험|시험|검증|모델링|알고리즘|embedded|firmware|기구설계|hw|hardware|sw|software)/i.test(t);

  const isData =
    /(데이터|data|분석|analytics|리서치|research|통계|statistics|모델|model|머신러닝|machine learning|ml|딥러닝|deep learning|ai\b)/i.test(t);

  const isOps =
    /(생산|품질|공정관리|scm|supply chain|구매|자재|납기|리드타임|물류|ops|operation|manufactur|factory|설비)/i.test(t);

  const isBiz =
    /(전략|사업기획|기획|pm\b|product manager|서비스기획|사업개발|go-to-market|gtm|kpi|okr|market|시장분석)/i.test(t);

  const isSales =
    /(영업|sales|bd|bizdev|마케팅|marketing|crm|퍼포먼스|growth|브랜딩|brand)/i.test(t);

  if (isRnd) return "RND_ENGINEERING";
  if (isData) return "DATA_RESEARCH";
  if (isOps) return "OPS_MANUFACTURING";
  if (isSales) return "SALES_MARKETING";
  if (isBiz) return "BIZ_STRATEGY";
  return "UNKNOWN";
}

function mapMajorTextToCluster(majorText) {
  const m = safeLower(majorText);

  if (!m.trim()) return "";

  // 공학/IT
  if (/(전기|전자|정보통신|통신공학|반도체|제어|로봇(공학)?|전장|electrical|electronics|ee)/i.test(m)) return "EE";
  if (/(컴퓨터|소프트웨어|전산|정보(공학)?|ai|인공지능|데이터|data science|cs\b|computer science|software)/i.test(m)) return "CS";
  if (/(기계|조선|해양|항공|자동차|산업공학|생산공학|systems?|mechanical|me\b)/i.test(m)) return "ME";
  if (/(화학|화공|재료|신소재|고분자|ceramic|materials?|chemical)/i.test(m)) return "CHE";
  if (/(토목|건축|도시|환경(공학)?|civil|architecture)/i.test(m)) return "CE";

  // 경영/사회/인문
  if (/(경영|회계|재무|경영정보|mba|business|accounting|finance)/i.test(m)) return "BIZ";
  if (/(경제|통계|수학|금융공학|퀀트|economics|statistics|math|quant)/i.test(m)) return "QUANT";
  if (/(디자인|산업디자인|시각디자인|ux|ui|hci|design)/i.test(m)) return "DESIGN";
  if (/(생명|바이오|약학|의학|간호|biolog|bio|pharm|medical|nursing)/i.test(m)) return "BIO";

  return "";
}

function extractRequiredMajorHintsFromJD(jd) {
  const t = (jd || "").toString();
  if (!t.trim()) return [];

  const hints = [];

  // "전공: OOO", "전공 OO 우대" 같은 케이스
  const m1 = t.match(/전공\s*[:：]\s*([^\n\r,;/]{2,40})/);
  if (m1?.[1]) hints.push(m1[1]);

  // "관련학과: OOO", "관련 학과 OOO" 같은 케이스
  const m2 = t.match(/관련\s*학과\s*[:：]?\s*([^\n\r,;/]{2,40})/);
  if (m2?.[1]) hints.push(m2[1]);

  // "OO 전공" 근처 단어를 보조로 잡기(과한 추측 방지: 짧은 토큰만)
  const near = [...t.matchAll(/([가-힣A-Za-z&· ]{2,30})\s*(전공|학과)/g)].map((m) => m[1]);
  for (const x of near) hints.push(x);

  return uniq(hints.map((s) => s.toString().trim()).filter(Boolean)).slice(0, 6);
}

function isMajorExplicitRequiredInJD(jd) {
  const t = safeLower(jd);
  return /(전공\s*(필수|required)|관련\s*학과\s*(필수|required)|학위\s*(필수|required)|석사\s*이상|박사\s*이상|required\s*degree)/i.test(t);
}

function inferRequiredMajorClusters({ jd, ai }) {
  // AI 보조 힌트(있으면 사용하되, 없으면 JD 룰 기반만 사용)
  const aiHints = normalizeStringArray(ai?.requiredMajorHints);
  const jdHints = extractRequiredMajorHintsFromJD(jd);
  const merged = uniq([
    ...aiHints,
    ...jdHints.map((x) => safeLower(x)),
  ]).slice(0, 8);

  const clusters = [];
  for (const h of merged) {
    const c = mapMajorTextToCluster(h);
    if (c) clusters.push(c);
  }
  return uniq(clusters);
}

function calcMajorSimilarityByFamily(candidateCluster, requiredClusters, jobFamily) {
  if (!candidateCluster || !Array.isArray(requiredClusters) || requiredClusters.length === 0) return 0;

  // exact match
  if (requiredClusters.includes(candidateCluster)) return 1;

  // adjacency by job family (유동)
  const adj = {
    RND_ENGINEERING: {
      EE: ["CHE", "CS"],
      CHE: ["EE"],
      CS: ["EE"],
      ME: ["CE", "EE"], // 제한적 인접
      CE: ["ME"],
      BIZ: [],
      QUANT: ["CS"],
      DESIGN: [],
      BIO: ["CHE"],
    },
    DATA_RESEARCH: {
      CS: ["QUANT", "BIZ", "EE"],
      QUANT: ["CS", "BIZ"],
      BIZ: ["QUANT", "CS"],
      EE: ["CS"],
      ME: ["CS"],
      CHE: ["CS"],
      CE: ["CS"],
      DESIGN: ["CS"],
      BIO: ["CS", "CHE"],
    },
    OPS_MANUFACTURING: {
      ME: ["BIZ", "CE", "CHE"],
      BIZ: ["ME", "QUANT"],
      CE: ["ME"],
      CHE: ["ME"],
      EE: ["ME"],
      CS: ["ME"],
      QUANT: ["BIZ"],
      DESIGN: [],
      BIO: ["CHE"],
    },
    BIZ_STRATEGY: {
      BIZ: ["QUANT", "CS"],
      QUANT: ["BIZ", "CS"],
      CS: ["BIZ", "QUANT"],
      EE: ["CS"],
      ME: ["BIZ"],
      CHE: ["BIZ"],
      CE: ["BIZ"],
      DESIGN: ["BIZ"],
      BIO: ["BIZ"],
    },
    SALES_MARKETING: {
      // 전공 자체 영향이 낮은 편이라 adjacency는 의미가 적음(유사도는 낮게 유지)
      BIZ: ["DESIGN", "QUANT", "CS"],
      DESIGN: ["BIZ"],
      QUANT: ["BIZ"],
      CS: ["BIZ"],
      EE: [],
      ME: [],
      CHE: [],
      CE: [],
      BIO: [],
    },
    UNKNOWN: {},
  };

  const table = adj[jobFamily] || adj.UNKNOWN || {};
  const neighbors = table[candidateCluster] || [];

  // if any required cluster is neighbor => 0.6, else 0
  for (const r of requiredClusters) {
    if (neighbors.includes(r)) return 0.6;
  }
  return 0;
}

function buildMajorSignals({ jd, resume, state, ai, keywordSignals, resumeSignals }) {
  const candidateMajor = getCandidateMajorFromStateOrAi(state, ai);
  const candidateCluster = mapMajorTextToCluster(candidateMajor);

  const majorImportance = parseMajorImportanceFromJD(jd);
  const jobFamily = inferJobFamilyFromJD(jd);

  const requiredClusters = inferRequiredMajorClusters({ jd, ai });
  const majorSimilarity = calcMajorSimilarityByFamily(candidateCluster, requiredClusters, jobFamily);

  const explicitRequired = isMajorExplicitRequiredInJD(jd);

  // objectiveScore에 소폭 반영(A)
  // - 전공이 중요하지 않으면 사실상 0에 가깝게
  // - 전공이 매우 중요해도 cap은 작게 유지(설명가능성 우선)
  const majorBonusCap = majorImportance >= 0.75 ? 0.07 : 0.05;
  let majorBonus = majorSimilarity * majorImportance * majorBonusCap;

  // 필수요건(knockout)이 이미 있는 경우, 전공 보너스가 체감상 역전하지 않도록 약화
  if (keywordSignals?.hasKnockoutMissing) {
    majorBonus *= 0.3;
  }

  majorBonus = normalizeScore01(majorBonus); // 0~1 범위 보장(실제론 0~0.07)

  const noteParts = [];
  if (candidateMajor && !candidateCluster) noteParts.push("전공 텍스트는 있으나 전공군 분류가 어려움");
  if (!candidateMajor) noteParts.push("이력서/입력에서 전공 정보를 찾지 못함");
  if (requiredClusters.length === 0 && majorImportance >= 0.55) noteParts.push("JD에서 요구 전공 힌트를 안정적으로 추출하지 못함");

  // (B) 가설 판단에 사용할 “브릿지 가능성” 힌트(과신 방지용)
  // - 전공은 다르지만, JD 키워드 매칭/성과증거가 강하면 bridge로 해석 가능
  const kwStrong = (keywordSignals?.matchScore ?? 0) >= 0.6;
  const proofStrong = (resumeSignals?.resumeSignalScore ?? 0) >= 0.7;
  const bridgeHint = kwStrong || proofStrong;

  return {
    majorImportance,
    jobFamily,
    explicitMajorRequired: explicitRequired,
    candidateMajor,
    candidateCluster,
    requiredClusters,
    majorSimilarity,
    majorBonus, // 0~0.07 수준
    bridgeHint,
    note: noteParts.length ? noteParts.join(" / ") : null,
  };
}

// ------------------------------
// Keyword dictionary (with critical)
// - critical: true = "없으면 서류 컷" 성격의 must-have
// ------------------------------
const SKILL_DICTIONARY = [
  // dev / data (예시)
  { kw: "javascript", alias: ["js"], critical: false },
  { kw: "typescript", alias: ["ts"], critical: false },
  { kw: "react", alias: [], critical: true }, // ✅ must-have 후보
  { kw: "node", alias: ["node.js"], critical: false },
  { kw: "next.js", alias: ["nextjs", "next"], critical: false },
  { kw: "python", alias: [], critical: true }, // ✅ must-have 후보
  { kw: "java", alias: [], critical: false },
  { kw: "sql", alias: [], critical: true }, // ✅ must-have 후보

  // infra
  { kw: "aws", alias: ["amazon web services"], critical: false },
  { kw: "gcp", alias: ["google cloud"], critical: false },
  { kw: "azure", alias: ["microsoft azure"], critical: false },
  { kw: "docker", alias: [], critical: false },
  { kw: "kubernetes", alias: ["k8s"], critical: false },

  // biz / ops
  { kw: "excel", alias: [], critical: false },
  { kw: "sap", alias: [], critical: false },
  { kw: "erp", alias: [], critical: false },
  { kw: "procurement", alias: ["purchasing"], critical: false },
  { kw: "purchasing", alias: ["buyer"], critical: false },
  { kw: "sourcing", alias: [], critical: false },
  { kw: "negotiation", alias: ["negotiate"], critical: false },
  { kw: "supply chain", alias: ["supply-chain", "scm"], critical: false },
  { kw: "scm", alias: ["supply chain"], critical: false },

  // signals
  { kw: "portfolio", alias: [], critical: false },
  { kw: "case study", alias: ["casestudy"], critical: false },
  { kw: "metrics", alias: ["metric"], critical: false },
  { kw: "conversion", alias: ["cvr"], critical: false },
];

// JD에서 등장한 키워드만 뽑고, Resume에 있는지 검사
export function buildKeywordSignals(jd, resume, ai = null, jdModel = null) {
  const jdText = safeLower(jd);
  const resumeText = safeLower(resume);

  const jdTokens = tokenize(jdText);
  const resumeTokens = tokenize(resumeText);

  const aiSynMap = getAiSynonymsMap(ai);

  // JD에 등장한 키워드 탐지
  const hitsInJD = [];
  for (const item of SKILL_DICTIONARY) {
    // 기존 candidates 유지 + AI synonym을 alias처럼 확장
    const baseCandidates = [item.kw, ...(item.alias || [])];
    const candidates = expandCandidatesWithAiSynonyms(baseCandidates, aiSynMap);

    const found = candidates.some((c) => hasWord(jdTokens, c) || hasWord(jdText, c));
    if (found) hitsInJD.push(item.kw);
  }
  const jdKeywords = uniq(hitsInJD);

  // JD 신뢰도(빈약한 JD면 해석 약화)
  const jdLen = jdTokens.length;
  const keywordCount = jdKeywords.length;
  const reliability = normalizeScore01(
    (Math.min(keywordCount, 8) / 8) * 0.7 + (Math.min(jdLen, 250) / 250) * 0.3
  );

  // 매칭 계산
  const matched = [];
  const missing = [];
  for (const kw of jdKeywords) {
    const dict = SKILL_DICTIONARY.find((x) => x.kw === kw);

    // 기존 candidates 유지 + AI synonym을 alias처럼 확장
    const baseCandidates = [kw, ...((dict && dict.alias) || [])];
    const candidates = expandCandidatesWithAiSynonyms(baseCandidates, aiSynMap);

    const ok = candidates.some((c) => hasWord(resumeTokens, c) || hasWord(resumeText, c));
    if (ok) matched.push(kw);
    else missing.push(kw);
  }

  // ✅ Knockout(critical) 누락 탐지
  const jdCritical = jdKeywords.filter((kw) => {
    const dict = SKILL_DICTIONARY.find((x) => x.kw === kw);
    return Boolean(dict?.critical);
  });

  // ✅ AI 보조: JD must-have를 "critical 후보"로 추가 (기존 dictionary 로직은 그대로 유지)
  // - matchScore 계산/기존 매칭 로직은 건드리지 않고,
  //   "필수요건 누락(hasKnockoutMissing)" 판단만 보강한다.
  const aiMustHave = normalizeStringArray(ai?.jdMustHave);

  // 🔥 변경 핵심:
  // 기존: mustHave 문자열이 resume에 "그대로" 없으면 누락 처리 → 오탐 많음
  // 개선: mustHave 타입(연차/직무/손익/도메인)을 해석해서 충족 판정
  const missingAiMustHave = [];
  for (const mh of aiMustHave) {
    const r = isMustHaveSatisfied(mh, resumeTokens, resumeText, aiSynMap);
    if (!r.ok) missingAiMustHave.push(mh);
  }

  // ✅ PATCH ROUND 4 (append-only): jdModel.mustHave 보강 신호 — aiMustHave와 동일 패턴
  // - 완전 대체 금지: jdCritical(SKILL_DICTIONARY), aiMustHave 경로 유지
  // - jdModel.mustHave를 병렬 신호로만 추가
  const jdModelMustHaveRaw = normalizeStringArray(
    Array.isArray(jdModel?.mustHave) ? jdModel.mustHave : []
  );
  // ✅ PATCH ROUND 11 (append-only): mustHaveDecisionMap — 항목별 ok/missing, 표시층 SSOT용
  // - 기존 missingJdModelMustHave 계산과 동일한 isMustHaveSatisfied 결과를 재사용
  // - 점수/hasKnockoutMissing/missingCritical 계산에 영향 없음
  const __mustHaveDecisionMap = {};
  const missingJdModelMustHave = [];
  for (const mh of jdModelMustHaveRaw) {
    const r = isMustHaveSatisfied(mh, resumeTokens, resumeText, aiSynMap);
    if (!r.ok) missingJdModelMustHave.push(mh);
    __mustHaveDecisionMap[mh] = r.ok ? "ok" : "missing";
  }

  const missingCritical = uniq([
    ...jdCritical.filter((kw) => !matched.includes(kw)),
    ...missingAiMustHave,
    ...missingJdModelMustHave,
  ]);

  const jdCriticalFinal = uniq([...jdCritical, ...aiMustHave, ...jdModelMustHaveRaw]);
  const hasKnockoutMissing = missingCritical.length > 0;

  // ✅ PATCH ROUND 6 (append-only): provenance 분리 — 디버그/설명용, 점수 계산에 연결 금지
  const missingFromJdCritical = jdCritical.filter((kw) => !matched.includes(kw));
  const missingFromAiMustHave = missingAiMustHave.slice();
  const missingFromJdModelMustHave = missingJdModelMustHave.slice();
  const missingCriticalBySource = {
    jdCritical: missingFromJdCritical,
    aiMustHave: missingFromAiMustHave,
    jdModelMustHave: missingFromJdModelMustHave,
  };

  if (jdKeywords.length === 0) {
    return {
      matchScore: 0.35,
      matchedKeywords: [],
      missingKeywords: [],
      jdKeywords: [],
      reliability,
      jdCritical: jdCriticalFinal,
      missingCritical,
      hasKnockoutMissing,
      note:
        "JD에서 사전 키워드를 거의 찾지 못했습니다. JD ‘필수/우대/업무’ 문장을 더 붙여 넣으면 정확도가 올라갑니다.",
      missingCriticalBySource,
      mustHaveDecisionMap: __mustHaveDecisionMap,
    };
  }

  const raw = matched.length / jdKeywords.length;
  // reliability로 약한 보정(과신 방지)
  let matchScore = normalizeScore01(raw * (0.85 + 0.15 * reliability));

  // ✅ knockout이 있으면 matchScore를 강하게 깎는다(서류 컷 반영)
  if (hasKnockoutMissing) {
    matchScore = normalizeScore01(matchScore * 0.55);
  }

  return {
    matchScore,
    matchedKeywords: matched,
    missingKeywords: missing,
    jdKeywords,
    reliability,
    jdCritical: jdCriticalFinal,
    missingCritical,
    hasKnockoutMissing,
    note: null,
    missingCriticalBySource,
    mustHaveDecisionMap: __mustHaveDecisionMap,
  };
}

// ------------------------------
// JD years + policy
// ------------------------------
function parseExperiencePolicyFromJD(jd) {
  const t = safeLower(jd);
  // 한국 JD 흔한 표현
  if (/(신입|인턴|new grad|newgrad)/i.test(t)) return "newgrad";
  if (/(경력\s*무관|무관|경력무관|experience\s*not\s*required)/i.test(t)) return "any";
  if (/(경력|experienced|years? of experience)/i.test(t)) return "experienced";
  return "unknown";
}

function parseRequiredYearsFromJD(jd) {
  const t = (jd || "").toString();

  // "3~5년" / "3-5년"
  let m = t.match(/(\d+)\s*[-~]\s*(\d+)\s*년/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }
  }

  // "3년 이상" / "3년+"
  m = t.match(/(\d+)\s*년\s*(이상|\+|\s*plus)?/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) return { min: n, max: null };
  }

  // "5+ years"
  m = t.match(/(\d+)\s*\+\s*years?/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) return { min: n, max: null };
  }

  // "0년" / "0 years" 같은 경우(신입)
  m = t.match(/(^|[^0-9])0\s*년/);
  if (m) return { min: 0, max: 0 };

  return null;
}

// ------------------------------
// Numeric proof: context-aware scoring
// ------------------------------
const IMPACT_VERBS = [
  "개선", "상승", "절감", "달성", "성장", "구축", "단축", "감소", "증가", "최적화", "향상", "확대", "개편",
  "improve", "increase", "decrease", "reduce", "grow", "achieve", "optimize", "boost", "deliver",
];

const IMPACT_NOUNS = [
  "매출", "이익", "원가", "비용", "전환율", "cvr", "클릭률", "ctr", "리드타임", "납기", "불량률",
  "재고", "kpi", "okr", "sla", "roi", "고객", "유지율", "retention",
  "revenue", "profit", "cost", "conversion", "lead time", "defect", "inventory", "margin",
];

// 날짜/연락처/식별자 등 오탐 패턴(완벽하진 않지만 실용적으로 컷)
const NON_PROOF_PATTERNS = [
  /\b(19|20)\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2}\b/g, // 2024-01-01
  /\b(19|20)\d{2}\b/g,                           // 연도만 단독
  /\b0\d{1,2}-\d{3,4}-\d{4}\b/g,                 // 전화번호
  /\b010-\d{4}-\d{4}\b/g,
  /\b\d{2}:\d{2}\b/g,                            // 시간
  /\b\d{6}-\d{7}\b/g,                            // 주민번호 형태(데이터에 있을 수 있어 방지)
];

function countNumericProofSignalsContextAware(text) {
  const t = (text || "").toString();
  if (!t.trim()) return { raw: 0, qualified: 0, notes: [] };

  // 1) 숫자 패턴들(기존 유지)
  const numberPatterns = [
    /\d{1,3}(,\d{3})+/g,        // 1,200
    /\d+(\.\d+)?\s*%/g,         // 12%
    /\d+(\.\d+)?\s*(배|x)\b/gi, // 3배, 2x
    /\d+\s*(억|만|천)\b/g,      // 10억, 20만
    /\d+\s*(개월|주|일)\b/g,    // 3개월
  ];

  // 2) 비성과 패턴 위치 마킹
  const nonProofSpans = [];
  for (const re of NON_PROOF_PATTERNS) {
    let m;
    while ((m = re.exec(t)) !== null) {
      nonProofSpans.push([m.index, m.index + m[0].length]);
    }
  }
  const inNonProof = (idx) => nonProofSpans.some(([a, b]) => idx >= a && idx <= b);

  // 3) 숫자 히트의 "문맥" 확인
  const lower = safeLower(t);
  const notes = [];
  let rawCount = 0;
  let qualifiedCount = 0;

  const window = 40; // 좌우 40자 정도

  for (const re of numberPatterns) {
    let m;
    while ((m = re.exec(t)) !== null) {
      const idx = m.index;
      rawCount += 1;

      // 날짜/전화번호 등 비성과 영역이면 제외
      if (inNonProof(idx)) continue;

      const start = Math.max(0, idx - window);
      const end = Math.min(lower.length, idx + m[0].length + window);
      const ctx = lower.slice(start, end);

      const hasVerb = IMPACT_VERBS.some((w) => ctx.includes(safeLower(w)));
      const hasNoun = IMPACT_NOUNS.some((w) => ctx.includes(safeLower(w)));

      // 최소 조건: 성과 동사 or 성과 명사 중 하나는 붙어 있어야 인정
      if (hasVerb || hasNoun) {
        qualifiedCount += 1;
      } else {
        // 디버깅 메모(필요하면 UI에 노출)
        notes.push(`숫자 '${m[0]}'는 성과 문맥이 약해 제외됨`);
      }
    }
  }

  return { raw: rawCount, qualified: qualifiedCount, notes };
}

function buildResumeSignals(resume, portfolio) {
  const a = countNumericProofSignalsContextAware(resume);
  const b = countNumericProofSignalsContextAware(portfolio);

  const rawCount = a.raw + b.raw;
  const qualified = a.qualified + b.qualified;

  // qualified 기준으로 점수 산정(오탐 억제)
  // 0개: 0.35, 1~2개: 0.5, 3~5개: 0.7, 6개+: 0.85
  let resumeSignalScore = 0.35;
  if (qualified >= 6) resumeSignalScore = 0.85;
  else if (qualified >= 3) resumeSignalScore = 0.7;
  else if (qualified >= 1) resumeSignalScore = 0.5;

  return {
    proofCount: qualified,         // UI/리포트용은 “인정된” 개수
    proofCountRaw: rawCount,       // 참고용
    resumeSignalScore,
    proofNotes: [...a.notes, ...b.notes].slice(0, 5),
  };
}

// ------------------------------
// Career signals
// ------------------------------
export function buildCareerSignals(career, jd) {
  const policy = parseExperiencePolicyFromJD(jd);
  const req = parseRequiredYearsFromJD(jd);

  const totalYears = Number(career?.totalYears ?? 0);
  const gapMonths = Number(career?.gapMonths ?? 0);
  const jobChanges = Number(career?.jobChanges ?? 0);
  const lastTenureMonths = Number(career?.lastTenureMonths ?? 0);

  // risk (0~1)
  let risk = 0;
  if (gapMonths >= 12) risk += 0.4;
  else if (gapMonths >= 6) risk += 0.32;
  else if (gapMonths >= 3) risk += 0.2;

  if (lastTenureMonths > 0 && lastTenureMonths <= 6) risk += 0.3;
  else if (lastTenureMonths > 0 && lastTenureMonths <= 12) risk += 0.18;

  if (jobChanges >= 5) risk += 0.25;
  else if (jobChanges >= 3) risk += 0.15;

  const careerRiskScore = normalizeScore01(risk);

  // experienceLevelScore (0~1)
  let experienceLevelScore = 0.6; // unknown default
  let experienceGap = null;

  // 신입/경력무관이면 연차를 강하게 평가하지 않음(완화)
  if (policy === "newgrad" || policy === "any") {
    experienceLevelScore = 0.7;
    experienceGap = null;
  } else if (req) {
    const requiredMin = req.min ?? 0;
    experienceGap = totalYears - requiredMin;

    if (experienceGap < 0) {
      experienceLevelScore = normalizeScore01(0.55 + experienceGap * 0.1);
    } else {
      experienceLevelScore = normalizeScore01(0.62 - Math.min(experienceGap, 12) * 0.02);
    }
  }

  return {
    experiencePolicy: policy, // newgrad | any | experienced | unknown
    requiredYears: req,       // {min,max|null} | null
    experienceGap,
    careerRiskScore,
    experienceLevelScore,
  };
}

// ------------------------------
// objectiveScore composition
// - knockout penalty 반영
// - majorBonus (optional) 소폭 반영
// ------------------------------
function buildObjectiveScore({ keywordSignals, careerSignals, resumeSignals, majorSignals = null }) {
  const keywordMatchScore = keywordSignals.matchScore; // 0~1
  const careerRiskScore = careerSignals.careerRiskScore; // 0~1 (risk)
  const resumeSignalScore = resumeSignals.resumeSignalScore; // 0~1
  const experienceLevelScore = careerSignals.experienceLevelScore; // 0~1
  const jdReliability = keywordSignals.reliability ?? 0.5;

  const invertedCareerRisk = 1 - careerRiskScore;

  const kwW = 0.35 * (0.75 + 0.25 * jdReliability);
  const restScale = (1 - kwW) / (0.2 + 0.25 + 0.2);

  let objectiveScore =
    kwW * keywordMatchScore +
    (0.2 * restScale) * invertedCareerRisk +
    (0.25 * restScale) * resumeSignalScore +
    (0.2 * restScale) * experienceLevelScore;

  objectiveScore = normalizeScore01(objectiveScore);

  // ✅ knockout missing이면 objectiveScore 자체에 강한 페널티
  // (채용 현실: 필수요건 결여는 평균으로 커버가 안 됨)
  const knockoutPenalty = keywordSignals.hasKnockoutMissing ? 0.72 : 1;
  objectiveScore = normalizeScore01(objectiveScore * knockoutPenalty);

  // ✅ major bonus (A): JD가 전공을 중요하게 보며, 유사 전공이면 "소폭" 가산
  // - 과신 방지: cap은 매우 작게 유지(최대 0.07 수준)
  const majorBonus = Number(majorSignals?.majorBonus ?? 0) || 0;
  if (majorBonus > 0) {
    objectiveScore = normalizeScore01(objectiveScore + majorBonus);
  }

  return {
    objectiveScore,
    parts: {
      keywordMatchScore,
      careerRiskScore,
      resumeSignalScore,
      experienceLevelScore,
      jdReliability,
      knockoutPenalty,
      hasKnockoutMissing: Boolean(keywordSignals.hasKnockoutMissing),
      // major parts (optional)
      majorBonus,
      majorSimilarity: Number(majorSignals?.majorSimilarity ?? 0) || 0,
      majorImportance: Number(majorSignals?.majorImportance ?? 0) || 0,
      jobFamily: (majorSignals?.jobFamily || "").toString(),
      majorNote: majorSignals?.note ?? null,
    },
  };
}

// ------------------------------
// correlation + conflict
// ------------------------------
const correlationMatrix = {
  "fit-mismatch": {
    down: [{ id: "unclear-positioning", factor: 0.85 }],
  },
  "gap-risk": {
    up: [{ id: "risk-signals", factor: 1.15 }],
  },
  // knockout이 발생하면 fit-mismatch를 더 올리는 효과를 주고 싶지만,
  // 여기서는 "가설 자체를 추가"하는 방식으로 처리(설명가능성↑).
};

function applyCorrelationBoost(hypotheses, scoresById) {
  const next = hypotheses.map((h) => ({ ...h, correlationBoost: 1 }));
  const index = new Map(next.map((h, i) => [h.id, i]));

  for (const [srcId, rules] of Object.entries(correlationMatrix)) {
    const srcScore = scoresById[srcId] ?? 0;
    const active = srcScore >= 0.55;
    if (!active) continue;

    if (rules.up) {
      for (const r of rules.up) {
        const j = index.get(r.id);
        if (j === undefined) continue;
        const bump = 1 + ((srcScore - 0.55) / 0.45) * (r.factor - 1);
        next[j].correlationBoost *= bump;
      }
    }

    if (rules.down) {
      for (const r of rules.down) {
        const j = index.get(r.id);
        if (j === undefined) continue;
        const damp = 1 - ((srcScore - 0.55) / 0.45) * (1 - r.factor);
        next[j].correlationBoost *= damp;
      }
    }
  }

  for (const h of next) {
    h.correlationBoost = clamp(h.correlationBoost, 0.75, 1.25);
  }
  return next;
}

function calcConflictPenalty({ keywordSignals, careerSignals, selfCheck }) {
  let penalty = 1;

  const coreFitHigh = (selfCheck?.coreFit ?? 3) >= 4;
  const keywordLow = keywordSignals.matchScore <= 0.35;
  if (coreFitHigh && keywordLow) penalty *= 0.85;

  const riskSelfLow = (selfCheck?.riskSignals ?? 3) <= 2;
  const careerRiskHigh = careerSignals.careerRiskScore >= 0.65;
  if (riskSelfLow && careerRiskHigh) penalty *= 0.88;

  return clamp(penalty, 0.75, 1);
}

function confidenceFromSelfCheck(hId, selfCheck) {
  const sc = selfCheck || {};
  const coreFit = sc.coreFit ?? 3;
  const proof = sc.proofStrength ?? 3;
  const clarity = sc.roleClarity ?? 3;
  const story = sc.storyConsistency ?? 3;
  const risk = sc.riskSignals ?? 3;

  const mild = (x) => clamp(0.85 + (x - 1) * 0.075, 0.85, 1.15);

  switch (hId) {
    case "fit-mismatch":
      return mild(6 - coreFit);
    case "weak-proof":
    case "weak-interview-proof":
      return mild(6 - proof);
    case "unclear-positioning":
      return (mild(6 - clarity) + mild(6 - story)) / 2;
    case "risk-signals":
      return mild(risk);
    default:
      return 1;
  }
}

// ------------------------------
// Hypothesis factory
// ------------------------------
function makeHypothesis(base) {
  return {
    id: base.id,
    title: base.title,
    why: base.why,
    signals: base.signals || [],
    actions: base.actions || [],
    counter: base.counter || "",
    impact: clamp(base.impact ?? 0.7, 0, 1),
    confidence: clamp(base.confidence ?? 0.5, 0, 1),
    evidenceBoost: clamp(base.evidenceBoost ?? 0, 0, 0.25),
  };
}

// ------------------------------
// MAIN: buildHypotheses
// ------------------------------
export function buildHypotheses(state, ai = null) {
  // ✅ SAFE PATCH: ensure _structurePack is always defined in this scope
  let _structurePack = null;
  try {
    _structurePack = buildStructureAnalysis({
      resumeText: state?.resume || "",
      jdText: state?.jd || "",
      detectedIndustry: (ai?.detectedIndustry ?? ai?.industry ?? state?.industry ?? "").toString(),
      detectedRole: (ai?.detectedRole ?? ai?.role ?? state?.role ?? "").toString(),
      detectedCompanySizeCandidate: (ai?.detectedCompanySizeCandidate ?? ai?.companySizeCandidate ?? state?.companySizeCandidate ?? "").toString(),
      detectedCompanySizeTarget: (ai?.detectedCompanySizeTarget ?? ai?.companySizeTarget ?? state?.companySizeTarget ?? "").toString(),

      // ✅ append-only: KSCO hints (may be undefined, OK)
      roleKscoMajor: state?.roleKscoMajor,
      roleKscoOfficeSub: state?.roleKscoOfficeSub,
    });
  } catch { }
  const stage = (state?.stage || "서류").toString();

  // ✅ PATCH ROUND 4 (append-only): buildKeywordSignals에 jdModel 보강 신호 전달
  // ✅ PATCH (append-only, SSOT통합): 단일 buildJdResumeFit() 계산 — A/B 경로 공통 사용
  let __jdFit = null;
  let __jdModel = null;
  try {
    __jdFit = buildJdResumeFit({
      jdText: state?.jd || "",
      resumeText: state?.resume || "",
    });
    __jdModel = __jdFit?.jdModel || null;
  } catch { }
  const __jdModelForKeywordSignals = __jdModel;

  const keywordSignals = buildKeywordSignals(state?.jd || "", state?.resume || "", ai, __jdModelForKeywordSignals);
  const careerSignals = buildCareerSignals(state?.career || {}, state?.jd || "");
  const resumeSignals = buildResumeSignals(state?.resume || "", state?.portfolio || "");

  const majorSignals = buildMajorSignals({
    jd: state?.jd || "",
    resume: state?.resume || "",
    state,
    ai,
    keywordSignals,
    resumeSignals,
  });

  const { objectiveScore, parts } = buildObjectiveScore({
    keywordSignals,
    careerSignals,
    resumeSignals,
    majorSignals,
  });

  const conflictPenalty = calcConflictPenalty({
    keywordSignals,
    careerSignals,
    selfCheck: state?.selfCheck,
  });

  // ------------------------------
  // Structure analysis (append-only)
  // - 기존 score/priority 로직 훼손 금지: 추가 필드만 생성
  // ------------------------------
  // buildStructureAnalysis({
  //   resumeText: state?.resume || "",
  //   jdText: state?.jd || "",
  //   detectedIndustry: ...,
  //   detectedRole: ...,
  //   detectedCompanySizeCandidate: ...,
  //   detectedCompanySizeTarget: ...,
  //
  //   // ✅ append-only: KSCO hints
  //   roleKscoMajor: state?.roleKscoMajor,
  //   roleKscoOfficeSub: state?.roleKscoOfficeSub,
  // });

  const structureAnalysis = _structurePack.structureAnalysis;
  const structureSummaryForAI = _structurePack.structureSummaryForAI;

  const hyps = [];

  // ✅ 0) knockout 가설(서류/면접 모두 강력)
  if (keywordSignals.hasKnockoutMissing) {
    hyps.push(
      makeHypothesis({
        id: "knockout-missing",
        title: "필수요건(Must-have) 누락으로 즉시 탈락 가능성",
        why:
          "채용은 평균점이 아니라 ‘필수요건 충족 여부’가 먼저 걸러지는 구조입니다. JD에서 필수로 읽히는 기술/요건이 이력서에 없으면, 다른 장점이 있어도 초기 컷될 수 있습니다.",
        signals: [
          `누락된 필수 키워드: ${keywordSignals.missingCritical.join(", ")}`,
          `키워드 매칭(페널티 반영): ${Math.round(keywordSignals.matchScore * 100)}/100`,
        ],
        impact: 0.98,
        confidence: 0.82,
        evidenceBoost: 0.1,
        actions: [
          "누락된 필수 키워드를 ‘경험/프로젝트/업무’ 문장에 사실 기반으로 명시(단순 나열 금지)",
          "없다면: (1) 학습/실습 결과물(작은 프로젝트)로 ‘증거’를 만들고 링크/스크린샷으로 첨부",
          "지원 전략: 필수요건을 충족하는 포지션으로 파이프라인을 넓히거나, 필수요건이 낮은 JD도 병행 지원",
        ],
        counter:
          "일부 회사는 필수요건을 완화하거나 내부 전환/학습을 전제로 채용하기도 하지만, 일반적인 공개채용에서는 예외가 드뭅니다.",
      })
    );
  }

  // 1) 서류 단계
  if (stage.includes("서류")) {
    const kwLow = keywordSignals.matchScore <= 0.45;

    hyps.push(
      makeHypothesis({
        id: "fit-mismatch",
        title: "JD 대비 핵심 요건 핏 부족",
        why:
          "서류 단계에선 JD 필수요건(툴/경력/도메인/역할)을 먼저 확인합니다. 이력서 문장에 JD 언어가 충분히 매칭되지 않으면 ‘읽히기 전에’ 탈락할 확률이 올라갑니다.",
        signals: [
          `키워드 매칭: ${Math.round(keywordSignals.matchScore * 100)}/100`,
          keywordSignals.missingKeywords?.length
            ? `누락 키워드 예: ${keywordSignals.missingKeywords.slice(0, 5).join(", ")}`
            : null,
          `JD 신뢰도(키워드/길이): ${Math.round((keywordSignals.reliability ?? 0) * 100)}/100`,
        ].filter(Boolean),
        impact: 0.9,
        confidence: kwLow ? 0.72 : 0.52,
        evidenceBoost: kwLow ? 0.08 : 0.0,
        actions: [
          "JD ‘필수/우대’ 문장을 체크리스트로 만들고, 이력서 문장에 1:1로 대응되게 재작성",
          "누락 키워드 상위 5개를 헤더/요약/핵심 프로젝트에 분산 배치(동의어 말고 JD 표현 우선)",
          "경력 전환이면 ‘전이 가능한 능력’을 JD 업무 문장 단위로 번역해 넣기",
        ],
        counter:
          "JD가 매우 포괄적이거나(키워드가 과다), 채용팀이 포텐셜 위주로 보는 경우엔 키워드 매칭만으로 결론을 내리기 어렵습니다.",
      })
    );

    // ✅ 전공/유사 전공 가설(B): JD가 전공을 중요하게 볼 때만 우선순위에 반영
    // - 단정 금지: 정보 부족이면 confidence를 낮추고, "확인/보강" 액션으로 유도
    const majorImp = majorSignals.majorImportance ?? 0;
    const majorSim = majorSignals.majorSimilarity ?? 0;
    const explicitMajorRequired = Boolean(majorSignals.explicitMajorRequired);
    const hasCandidateMajor = Boolean((majorSignals.candidateMajor || "").toString().trim());
    const hasRequiredMajorHints = Array.isArray(majorSignals.requiredClusters) && majorSignals.requiredClusters.length > 0;

    if (majorImp >= 0.55) {
      const mismatchLike = (!hasCandidateMajor && explicitMajorRequired) || (hasCandidateMajor && hasRequiredMajorHints && majorSim <= 0.3);
      const bridgeLike =
        hasCandidateMajor &&
        hasRequiredMajorHints &&
        majorSim > 0.3 &&
        majorSim < 0.8 &&
        Boolean(majorSignals.bridgeHint);

      if (mismatchLike) {
        const conf =
          explicitMajorRequired
            ? (hasCandidateMajor && hasRequiredMajorHints ? 0.72 : 0.55)
            : (hasCandidateMajor && hasRequiredMajorHints ? 0.58 : 0.45);

        const candMajorText = hasCandidateMajor ? majorSignals.candidateMajor : "(미탐지)";
        const reqClustersText = hasRequiredMajorHints ? majorSignals.requiredClusters.join(", ") : "(탐지 실패)";

        hyps.push(
          makeHypothesis({
            id: "major-mismatch",
            title: "전공/학력 요건 게이트 가능성(전공 정합성 리스크)",
            why:
              "일부 직무/산업(연구·개발·공정·설계·리서치 등)은 전공/학위가 ‘최초 게이트’로 작동하는 경우가 있습니다. JD에서 전공/학위 신호가 강한데 전공 정합성이 낮거나(또는 정보가 불충분하면), 서류 초반에 리스크로 해석될 수 있습니다.",
            signals: [
              `전공 중요도(추정): ${Math.round(majorImp * 100)}/100 · 직무군: ${majorSignals.jobFamily}`,
              `지원자 전공: ${candMajorText}`,
              `JD 요구 전공군(추정): ${reqClustersText}`,
              hasCandidateMajor && hasRequiredMajorHints ? `전공 유사도(전공군 기준): ${Math.round(majorSim * 100)}/100` : "전공 비교 정보가 부족함(추측하지 않음)",
              majorSignals.note ? `메모: ${majorSignals.note}` : null,
            ].filter(Boolean),
            impact: clamp(0.75 + 0.2 * majorImp, 0, 0.95),
            confidence: conf,
            evidenceBoost: explicitMajorRequired ? 0.08 : 0.04,
            actions: [
              "전공이 다르다면 ‘대체 증거’로 상쇄: 관련 프로젝트/과제/실험/설계/리서치 산출물을 1~2개로 압축해 링크/요약 첨부",
              "JD가 전공/학위를 명시(필수)했다면: 이력서 상단 요약에 ‘관련 과목/도메인 경험’ 1줄로 게이트를 먼저 방어",
              "전공 정보가 이력서에서 추출되지 않았다면: 학력/전공 라인을 명확히 표기(또는 텍스트 붙여넣기/추가 입력)해서 오해 가능성을 줄이기",
            ],
            counter:
              "일부 팀은 전공보다 실무 성과/포텐셜을 우선하는 경우도 있습니다. 다만 JD에서 전공/학위 요구가 강하게 드러나면, 초기 스크리닝에서 리스크로 작동할 확률이 올라갑니다.",
          })
        );
      } else if (bridgeLike) {
        const candMajorText = hasCandidateMajor ? majorSignals.candidateMajor : "(미탐지)";
        const reqClustersText = hasRequiredMajorHints ? majorSignals.requiredClusters.join(", ") : "(탐지 실패)";

        hyps.push(
          makeHypothesis({
            id: "major-bridge",
            title: "유사 전공/전이 역량으로 전공 리스크를 상쇄할 여지",
            why:
              "전공이 100% 일치하지 않더라도, 유사 전공이거나(또는 실무 증거가 강하면) 전공 리스크는 상쇄될 수 있습니다. 중요한 건 ‘전공이 다르다’가 아니라 ‘이 JD 업무를 해낼 증거가 있냐’로 설득 구조를 만드는 것입니다.",
            signals: [
              `전공 중요도(추정): ${Math.round(majorImp * 100)}/100 · 직무군: ${majorSignals.jobFamily}`,
              `지원자 전공: ${candMajorText}`,
              `JD 요구 전공군(추정): ${reqClustersText}`,
              `전공 유사도(전공군 기준): ${Math.round(majorSim * 100)}/100`,
              `키워드 매칭: ${Math.round(keywordSignals.matchScore * 100)}/100 · 증거 강도: ${Math.round(resumeSignals.resumeSignalScore * 100)}/100`,
            ],
            impact: clamp(0.55 + 0.25 * majorImp, 0, 0.85),
            confidence: 0.62,
            evidenceBoost: 0.06,
            actions: [
              "‘전공은 X지만, Y 역량/프로젝트로 Z 업무를 수행했다’ 문장을 요약 1줄로 고정",
              "JD 핵심 업무 2개를 골라 ‘전공과 무관하게 재현 가능한 결과물’(케이스/포트폴리오/미니 프로젝트)로 제시",
              "면접 대비: 전공 질문이 나올 걸 가정하고 ‘전공 불일치 → 왜 문제 아님 → 증거’ 순서로 30초 답변 준비",
            ],
            counter:
              "전공/학위를 강하게 명시한 JD(특히 연구/공정/설계)는 예외가 적을 수 있어, 지원 전략에서 ‘전공 요구가 낮은 JD 병행’이 실용적입니다.",
          })
        );
      }
    }

    // 성과 증거 부족(문맥 기반 proofCount)
    const proofLow = resumeSignals.resumeSignalScore <= 0.5;

    hyps.push(
      makeHypothesis({
        id: "weak-proof",
        title: "성과 증거(수치/전후/기여도) 부족",
        why:
          "‘무엇을 했다’보다 ‘어떤 문제를 어떻게 풀었고 결과가 무엇인지’가 서류 신뢰를 만듭니다. 숫자가 있어도 성과 문맥이 붙지 않으면 설득력이 약해집니다.",
        signals: [
          `정량 근거(문맥 인정): ${resumeSignals.proofCount}개 (raw ${resumeSignals.proofCountRaw}개)`,
          `증거 강도(프록시): ${Math.round(resumeSignals.resumeSignalScore * 100)}/100`,
          resumeSignals.proofNotes?.length ? `제외 메모: ${resumeSignals.proofNotes.join(" / ")}` : null,
        ].filter(Boolean),
        impact: 0.85,
        confidence: proofLow ? 0.68 : 0.52,
        evidenceBoost: proofLow ? 0.08 : 0.0,
        actions: [
          "각 경험을 ‘문제-제약-내 행동-결과-검증’ 구조로 재작성",
          "숫자는 ‘성과 단어(절감/개선/성장/달성)’와 붙여 쓰기(예: 원가 12% 절감, 리드타임 3일 단축)",
          "수치 공개가 어렵다면 범위/전후비교/대리지표로 설득 구조 만들기",
        ],
        counter:
          "신입/초경력 포지션이거나, 회사가 포텐셜/문화적합을 크게 보는 경우 영향은 일부 완화됩니다.",
      })
    );

    // 포지셔닝
    const unclearObj = keywordSignals.matchScore <= 0.5;

    hyps.push(
      makeHypothesis({
        id: "unclear-positioning",
        title: "포지셔닝/이직 스토리의 일관성 부족",
        why:
          "지원자가 ‘왜 이 직무/회사인지’가 흐리면 채용팀은 리스크(조기 퇴사/적응 실패)로 해석합니다. 특히 JD 언어와 나의 강점이 연결되지 않으면 설득력이 급격히 떨어집니다.",
        signals: [
          unclearObj ? "JD 언어 ↔ 이력서 언어 연결이 약함" : null,
          `자가진단(역할 명확성): ${(state?.selfCheck?.roleClarity ?? 3)}/5 · ${scoreToLabel(state?.selfCheck?.roleClarity ?? 3)}`,
          `자가진단(스토리 일관성): ${(state?.selfCheck?.storyConsistency ?? 3)}/5 · ${scoreToLabel(state?.selfCheck?.storyConsistency ?? 3)}`,
        ].filter(Boolean),
        impact: 0.75,
        confidence: unclearObj ? 0.62 : 0.52,
        evidenceBoost: unclearObj ? 0.06 : 0.0,
        actions: [
          "헤더 2줄 고정: (직무 정체성) + (강점 1~2개) + (증거 1개)",
          "이직사유는 ‘불만’이 아니라 ‘확장/정렬’로 말하고, JD 핵심 업무 문장에 직접 연결",
          "면접 대비: ‘탈락 논리(의심)’ 10개를 먼저 만들고 반례/근거를 준비",
        ],
        counter:
          "회사 자체가 다양한 배경 전환을 적극적으로 뽑는 곳이면 이 가설의 비중은 낮아질 수 있습니다.",
      })
    );
  }

  // 면접 단계
  if (stage.includes("면접")) {
    const riskHighObj = careerSignals.careerRiskScore >= 0.65;

    hyps.push(
      makeHypothesis({
        id: "risk-signals",
        title: "리스크 신호(커뮤니케이션/정합성/신뢰) 감지",
        why:
          "면접은 역량뿐 아니라 ‘같이 일해도 되는가’를 검증합니다. 답변의 일관성, 과장 여부, 사실 검증 가능성에서 신뢰가 흔들리면 탈락으로 이어질 수 있습니다.",
        signals: [
          `커리어 리스크(프록시): ${Math.round(careerSignals.careerRiskScore * 100)}/100`,
          `자가진단(리스크 신호): ${(state?.selfCheck?.riskSignals ?? 3)}/5 · ${scoreToLabel(state?.selfCheck?.riskSignals ?? 3)}`,
        ],
        impact: 0.9,
        confidence: riskHighObj ? 0.72 : 0.58,
        evidenceBoost: riskHighObj ? 0.08 : 0.0,
        actions: [
          "답변을 ‘전제→판단기준→행동→결과→학습’으로 고정(말 흔들림 최소화)",
          "모르는 건 모른다고 말하고, 확인 방법/다음 액션을 제시(과장 금지)",
          "검증 질문 대비: 숫자/문서/결과물(가능 범위)을 미리 준비",
        ],
        counter:
          "같은 답변도 면접관/팀 문화에 따라 평가가 달라질 수 있어, 단일 신호로 확정할 수는 없습니다.",
      })
    );

    const proofLow = resumeSignals.resumeSignalScore <= 0.5;

    hyps.push(
      makeHypothesis({
        id: "weak-interview-proof",
        title: "면접에서 증거 제시가 약함(구체성 부족)",
        why:
          "면접은 서류의 주장(성과/역할)을 검증하는 자리입니다. 역할 범위와 숫자, 검증 가능성을 명확히 못 하면 신뢰가 낮아집니다.",
        signals: [
          `정량 근거(문맥 인정): ${resumeSignals.proofCount}개`,
        ],
        impact: 0.8,
        confidence: proofLow ? 0.64 : 0.52,
        evidenceBoost: proofLow ? 0.06 : 0.0,
        actions: [
          "핵심 사례 3개를 ‘30초 요약’과 ‘2분 딥다이브’ 두 버전으로 준비",
          "내 기여도(내가 한 일/팀이 한 일)를 선명하게 분리해서 말하기",
          "보안 이슈가 있으면 ‘범위/비교/대리지표’로 설득 구조를 만들기",
        ],
        counter:
          "수치 공개가 어려워도 전후 비교/범위/검증 방법을 제시하면 설득 가능합니다.",
      })
    );
  }

  // career 기반 가설(기존 유지)
  const c = state?.career || {};
  const gapMonths = Number(c.gapMonths ?? 0);
  const jobChanges = Number(c.jobChanges ?? 0);
  const lastTenureMonths = Number(c.lastTenureMonths ?? 0);

  if (gapMonths >= 3) {
    const conf = gapMonths >= 12 ? 0.78 : gapMonths >= 6 ? 0.7 : 0.6;
    hyps.push(
      makeHypothesis({
        id: "gap-risk",
        title: "공백기 리스크(설명/정합성 부족)",
        why:
          "공백이 길수록 채용팀은 ‘업무 감 유지 여부’와 ‘공백 사유의 납득 가능성’을 확인하려고 합니다. 공백 자체가 문제라기보다, 설명 구조가 빈약하면 리스크로 해석됩니다.",
        signals: [`최근 공백: ${gapMonths}개월`],
        impact: 0.75,
        confidence: conf,
        evidenceBoost: gapMonths >= 6 ? 0.08 : 0.04,
        actions: [
          "공백을 ‘사실→의도→행동→결과(증거)’ 4문장으로 고정",
          "공백 기간의 학습/프로젝트/루틴을 결과물로 연결",
          "공백 관련 검증 질문(왜/무엇을/지금은 해결됐나) 반례 준비",
        ],
        counter:
          "설명과 증거가 명확하면 공백 자체는 치명적이지 않습니다.",
      })
    );
  }

  if ((lastTenureMonths > 0 && lastTenureMonths <= 12) || jobChanges >= 3) {
    const tenureShort = lastTenureMonths > 0 && lastTenureMonths <= 6;
    const conf = tenureShort ? 0.76 : 0.62;

    hyps.push(
      makeHypothesis({
        id: "short-tenure-risk",
        title: "짧은 근속/잦은 이직으로 인한 신뢰 하락",
        why:
          "회사 입장에선 채용 비용이 크기 때문에 ‘이번에도 빨리 나갈까?’를 민감하게 봅니다. 이동의 논리와 성과 축적이 보이지 않으면 리스크로 해석됩니다.",
        signals: [
          lastTenureMonths ? `직전 근속: ${lastTenureMonths}개월` : null,
          `이직 횟수: ${jobChanges}회`,
        ].filter(Boolean),
        impact: 0.8,
        confidence: conf,
        evidenceBoost: tenureShort ? 0.08 : 0.05,
        actions: [
          "이직 사유를 ‘정렬/확장’으로 재구성(일관된 기준 1개 고정)",
          "짧았던 자리에서도 ‘완료 성과/결과물’ 중심으로 서술",
          "면접에서 ‘잔류 의사’와 ‘조건’을 구체화해 제시",
        ],
        counter:
          "업계 특성상 이동이 잦아도 성과 축적이 명확하면 상쇄됩니다.",
      })
    );
  }

  // ------------------------------
  // scoring
  // ------------------------------
  const scored = hyps.map((h) => {
    const selfMod = confidenceFromSelfCheck(h.id, state?.selfCheck);
    let confidence = clamp(h.confidence * selfMod + h.evidenceBoost, 0, 1);

    // ✅ AI 보조: 가설별 confidence만 미세 보정 (priority 공식은 그대로 유지)
    // 요구사항: 이 로직 라인은 유지
    const deltaRaw = ai?.confidenceDeltaByHypothesis?.[h.id] ?? 0;
    const delta = clamp(Number(deltaRaw) || 0, -0.15, 0.15);
    confidence = clamp(confidence + delta, 0, 1);

    const basePriority = h.impact * confidence * objectiveScore;

    return {
      ...h,
      confidence,
      objectiveScore,
      objectiveParts: parts,
      conflictPenalty,
      correlationBoost: 1,
      priority: basePriority,
      // append-only fields for AI/use-cases
      structureAnalysis,
      structureSummaryForAI,
    };
  });

  const maxP = Math.max(0.00001, ...scored.map((h) => h.priority));
  const scoresById = Object.fromEntries(
    scored.map((h) => [h.id, normalizeScore01(h.priority / maxP)])
  );

  const withCorr = applyCorrelationBoost(scored, scoresById).map((h) => {
    const priority =
      h.impact *
      h.confidence *
      objectiveScore *
      h.correlationBoost *
      conflictPenalty;

    return { ...h, priority };
  });

  return withCorr.sort((a, b) => b.priority - a.priority).slice(0, 6);
}

// ------------------------------
// buildReport
// ------------------------------
export function buildReport(state, ai = null) {
  const keywordSignals = buildKeywordSignals(state?.jd || "", state?.resume || "", ai);
  const careerSignals = buildCareerSignals(state?.career || {}, state?.jd || "");
  const resumeSignals = buildResumeSignals(state?.resume || "", state?.portfolio || "");

  const majorSignals = buildMajorSignals({
    jd: state?.jd || "",
    resume: state?.resume || "",
    state,
    ai,
    keywordSignals,
    resumeSignals,
  });

  const hyps = buildHypotheses(state, ai);

  const objective = buildObjectiveScore({ keywordSignals, careerSignals, resumeSignals, majorSignals });

  const header =
    `탈락 원인 분석 리포트 (추정)

- 회사: ${state?.company || "(미입력)"}
- 포지션: ${state?.role || "(미입력)"}
- 단계: ${state?.stage || "서류"}
- 지원일: ${state?.applyDate || "-"}

`;

  const reqYearsText = careerSignals.requiredYears
    ? `${careerSignals.requiredYears.min}년${careerSignals.requiredYears.max ? `~${careerSignals.requiredYears.max}년` : "+"}`
    : "탐지 실패";

  const majorBlock =
    `[전공/학력(추정)]
- 전공 중요도(추정): ${Math.round((majorSignals.majorImportance ?? 0) * 100)}/100 · 직무군: ${majorSignals.jobFamily}
- 지원자 전공: ${(majorSignals.candidateMajor || "").toString().trim() ? majorSignals.candidateMajor : "(미탐지)"}
- JD 요구 전공군(추정): ${Array.isArray(majorSignals.requiredClusters) && majorSignals.requiredClusters.length ? majorSignals.requiredClusters.join(", ") : "(탐지 실패)"}
- 전공 유사도(전공군 기준): ${Math.round((majorSignals.majorSimilarity ?? 0) * 100)}/100
- 전공 보너스(소폭, 합성 반영): ${Math.round((majorSignals.majorBonus ?? 0) * 100)}/100
${majorSignals.note ? `- 메모: ${majorSignals.note}\n` : ""}
`;

  const objectiveBlock =
    `[객관 지표]
- 키워드 매칭: ${Math.round(keywordSignals.matchScore * 100)}/100
- JD 신뢰도(키워드/길이): ${Math.round((keywordSignals.reliability ?? 0) * 100)}/100
- 필수요건 누락 여부: ${keywordSignals.hasKnockoutMissing ? "있음" : "없음"}${keywordSignals.hasKnockoutMissing ? ` (${keywordSignals.missingCritical.join(", ")})` : ""}
- 커리어 리스크(프록시): ${Math.round(careerSignals.careerRiskScore * 100)}/100
- 증거 강도(문맥 기반): ${Math.round(resumeSignals.resumeSignalScore * 100)}/100 (인정 ${resumeSignals.proofCount}개 / raw ${resumeSignals.proofCountRaw}개)
- 경험 레벨 적합도: ${Math.round(careerSignals.experienceLevelScore * 100)}/100
- JD 경험 정책(추정): ${careerSignals.experiencePolicy}
- JD 요구 연차(추정): ${reqYearsText}
- ObjectiveScore(합성): ${Math.round(objective.objectiveScore * 100)}/100

`;

  const keywordBlock =
    `[키워드 상세]
${keywordSignals.note ? `- 메모: ${keywordSignals.note}\n` : ""}- JD 키워드: ${keywordSignals.jdKeywords?.length ? keywordSignals.jdKeywords.join(", ") : "(탐지 실패)"}
- 매칭: ${keywordSignals.matchedKeywords?.length ? keywordSignals.matchedKeywords.join(", ") : "-"}
- 누락: ${keywordSignals.missingKeywords?.length ? keywordSignals.missingKeywords.join(", ") : "-"}
- 필수요건(critical) 탐지: ${keywordSignals.jdCritical?.length ? keywordSignals.jdCritical.join(", ") : "-"}
- 필수요건 누락: ${keywordSignals.missingCritical?.length ? keywordSignals.missingCritical.join(", ") : "-"}

`;

  const disclaimer =
    `※ 이 리포트는 입력 기반의 ‘가설’이며 단정하지 않습니다.
※ 실제 탈락 사유는 내부 기준/경쟁자/예산/타이밍 등 외부 변수로 달라질 수 있습니다.

`;

  const body = hyps
    .map((h, idx) => {
      const pr = Math.round(h.priority * 100);
      return (
        `${idx + 1}. ${h.title} (우선순위 ${pr}/100)
- 왜 그럴 수 있나: ${h.why}
- 근거/신호: ${h.signals?.length ? h.signals.join(" / ") : "입력 신호 부족"}
- 다음 액션:
${h.actions.map((a) => `  - ${a}`).join("\n")}
- 반례/예외: ${h.counter}
`
      );
    })
    .join("\n");

  const next =
    `
[추천 체크리스트]
- JD 필수/우대 문장을 이력서 문장에 1:1 매칭했나?
- 필수요건(critical)이 누락되지 않았나?
- 숫자에 ‘성과 문맥(절감/개선/성장/달성)’이 붙어 있나?
- 공백/짧은 근속은 ‘사실→의도→행동→증거’ 4문장으로 고정했나?
- 면접 답변은 ‘전제→판단기준→행동→결과→학습’ 구조로 고정했나?
`;

  // ------------------------------
  // AI append-only sections (optional)
  // - 기존 report 구조 변경 금지: 마지막에만 덧붙임
  // ------------------------------
  let aiAppend = "";

  const bullets = ai?.suggestedBullets;
  if (Array.isArray(bullets) && bullets.length) {
    aiAppend += "\n[추천 이력서 문장 개선]\n";
    aiAppend += bullets
      .slice(0, 8)
      .map((b, i) => {
        const before = (b?.before || "").toString().trim();
        const after = (b?.after || "").toString().trim();
        const why = (b?.why || "").toString().trim();

        return (
          `${i + 1})\n` +
          `- Before: ${before || "(없음)"}\n` +
          `- After: ${after || "(없음)"}\n` +
          `- Why: ${why || "-"}\n`
        );
      })
      .join("\n");
  }

  const conflicts = ai?.conflicts;
  if (Array.isArray(conflicts) && conflicts.length) {
    aiAppend += "\n[논리 충돌 / 위험 신호]\n";
    aiAppend += conflicts
      .slice(0, 8)
      .map((c, i) => {
        const type = (c?.type || "").toString().trim();
        const evidence = (c?.evidence || "").toString().trim();
        const explanation = (c?.explanation || "").toString().trim();
        const fix = (c?.fix || "").toString().trim();

        return (
          `${i + 1}) ${type || "(유형 미상)"}\n` +
          `- 근거: ${evidence || "-"}\n` +
          `- 설명: ${explanation || "-"}\n` +
          `- 수정/대응: ${fix || "-"}\n`
        );
      })
      .join("\n");
  }

  return header + objectiveBlock + majorBlock + keywordBlock + disclaimer + "[핵심 가설]\n\n" + body + next + aiAppend;
}

// ------------------------------
// Structure analysis (rule engine)
// - 기업 규모 적합성 + 벤더/협력사 경력 가치 + ownership 수준 + 산업 구조 적합성
// - 룰: 기준선(score+flags) / AI: 예외 판단 + 설명 담당
// ------------------------------
function normalizeStructureFlagList(flags) {
  return uniq((flags || []).map((x) => (x || "").toString().trim()).filter(Boolean));
}

function score100(n) {
  return clamp(Math.round(Number(n) || 0), 0, 100);
}

function labelFrom100(n) {
  const x = Number(n) || 0;
  if (x >= 75) return "HIGH";
  if (x >= 45) return "MEDIUM";
  return "LOW";
}

function inferIndustryFromText(text, fallback = "") {
  const t = safeLower(text);

  // 반도체
  if (/(반도체|semiconductor|fab|foundry|hbm|dram|nand|패키징|package|wafer|웨이퍼|공정|소자)/i.test(t)) return "semiconductor";
  // 자동차
  if (/(자동차|automotive|oem|tier\s*1|tier1|전장|ivs|adas|powertrain|car\b)/i.test(t)) return "automotive";
  // 이커머스/리테일
  if (/(이커머스|e-?commerce|커머스|리테일|retail|마켓플레이스|marketplace)/i.test(t)) return "commerce";
  // 금융
  if (/(금융|bank|banking|보험|insurance|핀테크|fintech|증권|securities)/i.test(t)) return "finance";
  // 게임
  if (/(게임|game|gaming|unity|unreal|mmorpg|모바일\s*게임)/i.test(t)) return "game";
  // SaaS/IT
  if (/(saas|b2b\s*saas|클라우드|cloud|platform|플랫폼|api|devops)/i.test(t)) return "saas";
  // 제조/산업재
  if (/(제조|manufactur|factory|생산|공장|산업재|industrial)/i.test(t)) return "manufacturing";

  return (fallback || "").toString().trim();
}

function normalizeCompanySizeText(s) {
  const t = safeLower(s).trim();
  if (!t) return "";

  if (/(startup|스타트업|seed|series\s*a|series\s*b|초기|scale-?up|스케일업)/i.test(t)) return "startup";
  if (/(smb|small|중소|벤처|small\s*business)/i.test(t)) return "smb";
  if (/(mid|중견|middle|중견기업)/i.test(t)) return "mid";
  if (/(large|enterprise|대기업|그룹사|상장\s*대기업|대형)/i.test(t)) return "large";

  // 숫자/인원/매출 기반 단순 힌트(대략)
  // "직원 50명" / "200명" / "1000명"
  const m = t.match(/(\d{2,6})\s*(명|people|employees)/i);
  if (m?.[1]) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) {
      if (n < 80) return "startup";
      if (n < 300) return "smb";
      if (n < 2000) return "mid";
      return "large";
    }
  }

  return t;
}

function inferCompanySizeFromText(text) {
  const t = safeLower(text);

  if (/(대기업|그룹사|enterprise|large company|대형\s*기업|상장\s*대기업)/i.test(t)) return "large";
  if (/(중견|mid-?size|mid size|middle\s*size|중견기업)/i.test(t)) return "mid";
  if (/(중소|sme|smb|small\s*business|벤처(기업)?)/i.test(t)) return "smb";
  if (/(스타트업|startup|seed|series\s*a|series\s*b|early-?stage|초기|스케일업|scale-?up)/i.test(t)) return "startup";

  // 직원수 힌트
  const m = t.match(/(직원|임직원|headcount|employees)\s*[:：]?\s*(\d{2,6})/i);
  if (m?.[2]) {
    const n = Number(m[2]);
    if (Number.isFinite(n)) {
      if (n < 80) return "startup";
      if (n < 300) return "smb";
      if (n < 2000) return "mid";
      return "large";
    }
  }

  // "xx명 규모" 힌트
  const m2 = t.match(/(\d{2,6})\s*명\s*(규모|scale)/i);
  if (m2?.[1]) {
    const n = Number(m2[1]);
    if (Number.isFinite(n)) {
      if (n < 80) return "startup";
      if (n < 300) return "smb";
      if (n < 2000) return "mid";
      return "large";
    }
  }

  return "";
}

function companySizeRank(size) {
  const s = normalizeCompanySizeText(size);
  if (s === "startup") return 1;
  if (s === "smb") return 2;
  if (s === "mid") return 3;
  if (s === "large") return 4;
  return 0;
}

function companySizeLabel(size) {
  const s = normalizeCompanySizeText(size);
  if (s === "startup") return "STARTUP";
  if (s === "smb") return "SMB";
  if (s === "mid") return "MID";
  if (s === "large") return "LARGE";
  return "UNKNOWN";
}

const OWNERSHIP_KEYWORDS = [
  "리드",
  "주도",
  "설계",
  "구축",
  "런칭",
  "0에서",
  "end-to-end",
  "총괄",
  "책임",
];

function _countOwnershipEvidenceImpl(text) {
  const t = safeLower(text);
  if (!t.trim()) return { count: 0, hits: [] };

  const hits = [];
  for (const kw of OWNERSHIP_KEYWORDS) {
    const k = safeLower(kw);
    if (!k.trim()) continue;
    if (t.includes(k)) hits.push(kw);
  }

  return { count: uniq(hits).length, hits: uniq(hits) };
}

import { ROLE_RULES } from "./roleDictionary.js";

/**
 * 역할 추론(세분 role + family 동시 지원)
 * - roleDictionary의 각 rule은 { role, strong, weak, negative } 기본을 유지
 * - 추가로 { family }가 있으면 "familyRole"로 저장
 * - 기존 사용처 안전을 위해 inferRoleFromText()는 문자열을 반환(기본: family -> 없으면 role)
 */
function inferRoleFromText(text, fallback) {
  const d = inferRoleFromTextDetailed(text, fallback);

  // ✅ 기존 구조/사용처 안전: 문자열 반환 유지
  // - roleDictionary가 세분화되더라도, analyzer 내부의 /engineering|strategy|.../ 같은 정규식이
  //   계속 동작하도록 family가 있으면 family를 우선 반환한다.
  return (d.familyRole || d.fineRole || (fallback || "").toString()).toString();
}

function inferRoleFromTextDetailed(text, fallback) {
  const t = safeLower(text || "");

  let bestRule = null;
  let bestScore = 0;

  for (const r of ROLE_RULES) {
    let score = 0;

    // strong: +3, weak: +1
    for (const k of r.strong || []) if (t.includes(k)) score += 3;
    for (const k of r.weak || []) if (t.includes(k)) score += 1;

    // negative: -2
    for (const k of r.negative || []) if (t.includes(k)) score -= 2;

    if (score > bestScore) {
      bestScore = score;
      bestRule = r;
    }
  }

  // 확신 없으면 unknown (틀리게 찍는 것 방지)
  const ok = bestScore >= 3 && bestRule && bestRule.role;

  const fineRole = ok ? (bestRule.role || "").toString() : (fallback || "").toString();
  const familyRole = ok ? (bestRule.family || "").toString() : "";

  return {
    fineRole,
    familyRole,
    score: bestScore,
  };
}

function applyStructureRuleEngine({
  state,
  resumeText,
  jdText,
  detectedIndustry,
  detectedRole,
  detectedCompanySizeCandidate,
  detectedCompanySizeTarget,
  roleKscoMajor,
  roleKscoOfficeSub,
}) {
  const flags = [];
  const addFlag = (f) => {
    const s = (f || "").toString().trim();
    if (!s) return;
    flags.push(s);
  };

  const { resumeIndustry, jdIndustry, role } = normalizeDetectedIndustryRoleSafe({
    resumeText,
    jdText,
    detectedIndustry,
    detectedRole,
  });

  const { candidateSize, targetSize } = resolveCompanySizesSafe({
    resumeText,
    jdText,
    detectedCompanySizeCandidate,
    detectedCompanySizeTarget,
  });

  const ownership = countOwnershipEvidenceSafe(resumeText);

  const ownershipStrong = ownership.count >= 5;
  const ownershipLow = ownership.count <= 1;

  // base scores (0~100)
  let companySizeFitScore = 50;
  let vendorExperienceScore = 50;
  let ownershipLevelScore = 55;
  let industryStructureFitScore = 50;

  // ------------------------------
  // Ownership 판단 룰 (required)
  // ------------------------------
  if (ownershipStrong) {
    ownershipLevelScore = 85;
    addFlag("HIGH_OWNERSHIP");
  } else if (ownershipLow) {
    ownershipLevelScore = 25;
    addFlag("LOW_OWNERSHIP");
  } else {
    // 중간 영역: 2~4개
    ownershipLevelScore = 55;
  }

  // ------------------------------
  // 기업 규모 관련 룰 (required)
  // ------------------------------
  const candRank = companySizeRank(candidateSize);
  const targRank = companySizeRank(targetSize);

  // Rule 1
  // candidate large → target startup AND ownership evidence 없음 → companySizeFitScore -= 35 → add flag SIZE_DOWNSHIFT_RISK
  if (candidateSize === "large" && targetSize === "startup" && !ownershipStrong) {
    companySizeFitScore -= 35;
    addFlag("SIZE_DOWNSHIFT_RISK");
  }

  // Rule 2
  // candidate startup → target large → companySizeFitScore -= 20 → add flag SIZE_UPSHIFT_RISK
  if (candidateSize === "startup" && targetSize === "large") {
    companySizeFitScore -= 20;
    addFlag("SIZE_UPSHIFT_RISK");
  }

  // Rule 3
  // candidate size == target size → companySizeFitScore += 15
  if (candidateSize && targetSize && candidateSize === targetSize) {
    companySizeFitScore += 15;
  }

  // Rule 4
  // ownership evidence strong → companySizeFitScore += 15 → add flag HIGH_OWNERSHIP
  if (ownershipStrong) {
    companySizeFitScore += 15;
    addFlag("HIGH_OWNERSHIP");
  }

  // ------------------------------
  // 기업 규모 관련 추가 룰(append-only, 20~30개 수준 확장)
  // ------------------------------
  // (A) 큰 폭 이동은 리스크(단, ownership strong이면 완화)
  // large -> smb/mid
  if (candidateSize === "large" && (targetSize === "smb" || targetSize === "mid") && !ownershipStrong) {
    companySizeFitScore -= 12;
    addFlag("SIZE_DOWNSHIFT_RISK");
  }
  // mid -> startup
  if (candidateSize === "mid" && targetSize === "startup" && !ownershipStrong) {
    companySizeFitScore -= 18;
    addFlag("SIZE_DOWNSHIFT_RISK");
  }
  // smb -> startup
  if (candidateSize === "smb" && targetSize === "startup" && !ownershipStrong) {
    companySizeFitScore -= 10;
    addFlag("SIZE_DOWNSHIFT_RISK");
  }

  // (B) 업스케일 이동은 프로세스/레벨링 리스크(단, 이력서에 프로세스/협업 증거 있으면 완화)
  const procEvidence =
    /(협업|cross[-\s]?functional|stakeholder|프로세스|process|규정|compliance|문서화|거버넌스|governance|보고|reporting|조직|matrix)/i.test(safeLower(resumeText));
  if (candidateSize === "startup" && (targetSize === "mid" || targetSize === "smb") && !procEvidence) {
    companySizeFitScore -= 8;
    addFlag("SIZE_UPSHIFT_RISK");
  }
  if ((candidateSize === "smb" || candidateSize === "mid") && targetSize === "large" && !procEvidence) {
    companySizeFitScore -= 10;
    addFlag("SIZE_UPSHIFT_RISK");
  }

  // (C) 타겟이 startup인데 ownershipLow면 추가 패널티(실무 현실: "스스로 굴리는가"가 핵심)
  if (targetSize === "startup" && ownershipLow) {
    companySizeFitScore -= 10;
    addFlag("LOW_OWNERSHIP");
  }

  // (D) 타겟이 large인데 ownershipStrong이면 레벨링 리스크 완화(+)
  if (targetSize === "large" && ownershipStrong) {
    companySizeFitScore += 6;
    addFlag("HIGH_OWNERSHIP");
  }

  // (E) size 미탐지/불확실: 과신 방지(중립)
  if (!candidateSize || !targetSize || candRank === 0 || targRank === 0) {
    companySizeFitScore += 0;
  } else {
    // 랭크 갭 기반 미세 조정(설명가능성 유지)
    const gap = Math.abs(candRank - targRank);
    if (gap >= 3 && !ownershipStrong) companySizeFitScore -= 8;
    else if (gap === 2 && !ownershipStrong) companySizeFitScore -= 4;
    else if (gap === 1) companySizeFitScore -= 1;
  }

  // ------------------------------
  // 벤더/협력사 가치 룰 (required)
  // ------------------------------
  const ind = (resumeIndustry || jdIndustry || (detectedIndustry || "")).toString().trim();

  // ✅ roleNorm을 세분 role에서도 안전하게 동작하도록 "family role" 우선으로 정규화
  // - role가 비어있으면 resume/jd 텍스트에서 룰 기반 추론으로 보완
  const roleHintText = `${(role || "").toString()} ${(detectedRole || "").toString()} ${(roleKscoMajor || "").toString()} ${(roleKscoOfficeSub || "").toString()} ${(jdText || "").toString()}`;
  const roleInferred = inferRoleFromTextDetailed(roleHintText, (role || detectedRole || "").toString());

  const roleNorm = (
    roleInferred.familyRole ||
    (role || (detectedRole || "")).toString().trim() ||
    ""
  ).toString().trim();

  if (/semiconductor/i.test(ind)) {
    vendorExperienceScore += 30;
    addFlag("VENDOR_CORE_VALUE");
  }

  if (/automotive/i.test(ind)) {
    vendorExperienceScore += 25;
  }

  if (/engineering/i.test(roleNorm)) {
    vendorExperienceScore += 20;
  }

  if (/strategy/i.test(roleNorm)) {
    vendorExperienceScore -= 20;
    addFlag("VENDOR_LIMITED_VALUE");
  }

  if (/marketing/i.test(roleNorm)) {
    vendorExperienceScore -= 15;
  }

  // ------------------------------
  // 벤더/협력사 가치 추가 룰(append-only)
  // ------------------------------
  const vendorKeywords = /(협력사|vendor|supplier|고객사|oem|tier\s*1|tier1|납품|양산|ppap|apqp|품질\s*이슈|customer\s*issue|field|라인|라인셋업)/i;
  const hasVendorContext = vendorKeywords.test((resumeText || "").toString()) || vendorKeywords.test((jdText || "").toString());

  // semiconductor인데 vendor context가 있으면 추가 가산
  if (/semiconductor/i.test(ind) && hasVendorContext) {
    vendorExperienceScore += 8;
    addFlag("VENDOR_CORE_VALUE");
  }

  // automotive인데 vendor context가 있으면 추가 가산
  if (/automotive/i.test(ind) && hasVendorContext) {
    vendorExperienceScore += 6;
  }

  // role이 ops이면 vendor/협력사 가치가 상대적으로 커질 수 있음
  if (/ops/i.test(roleNorm)) {
    vendorExperienceScore += 8;
  }

  // role이 sales이면 vendor 경험이 "가치"로 변환될 수 있으나, 본 룰엔 중립(+2)
  if (/sales/i.test(roleNorm) && hasVendorContext) {
    vendorExperienceScore += 2;
  }

  // role이 product이면 vendor 경험이 약간 도움(+3)
  if (/product/i.test(roleNorm) && hasVendorContext) {
    vendorExperienceScore += 3;
  }

  // strategy/marketing인데 vendor context가 없으면 추가 감점(제한적 가치)
  if ((/strategy/i.test(roleNorm) || /marketing/i.test(roleNorm)) && !hasVendorContext) {
    vendorExperienceScore -= 6;
    addFlag("VENDOR_LIMITED_VALUE");
  }

  // ------------------------------
  // 산업 적합성 룰 (required)
  // ------------------------------
  const resumeInd = (resumeIndustry || "").toString().trim();
  const jdInd = (jdIndustry || "").toString().trim();

  if (resumeInd && jdInd && resumeInd === jdInd) {
    industryStructureFitScore += 30;
    addFlag("INDUSTRY_STRONG_MATCH");
  }

  // industry mismatch
  if (resumeInd && jdInd && resumeInd !== jdInd) {
    industryStructureFitScore -= 30;
    addFlag("INDUSTRY_MISMATCH");
  }

  // ------------------------------
  // 산업 적합성 추가 룰(append-only)
  // ------------------------------
  // 산업이 한쪽만 탐지되면 과신 방지: 중립(0)
  if ((!resumeInd && jdInd) || (resumeInd && !jdInd)) {
    industryStructureFitScore += 0;
  }

  // "플랫폼/saas" ↔ "commerce"는 인접 산업으로 일부 완화
  const adjacentPairs = new Set([
    "saas|commerce",
    "commerce|saas",
    "saas|finance",
    "finance|saas",
  ]);
  if (resumeInd && jdInd && resumeInd !== jdInd) {
    const key = `${resumeInd}|${jdInd}`;
    if (adjacentPairs.has(key)) {
      industryStructureFitScore += 10; // -30의 일부 상쇄
    }
  }

  // manufacturing ↔ semiconductor는 부분 인접(공정/제조 오퍼레이션)
  if (resumeInd && jdInd && resumeInd !== jdInd) {
    const key2 = `${resumeInd}|${jdInd}`;
    if (key2 === "manufacturing|semiconductor" || key2 === "semiconductor|manufacturing") {
      industryStructureFitScore += 8;
    }
  }

  // ------------------------------
  // clamp + assemble
  // ------------------------------
  companySizeFitScore = score100(companySizeFitScore);
  vendorExperienceScore = score100(vendorExperienceScore);
  ownershipLevelScore = score100(ownershipLevelScore);
  industryStructureFitScore = score100(industryStructureFitScore);

  const structureFlags = normalizeStructureFlagList(flags);

  const structureAnalysis = {
    companySizeFitScore,
    vendorExperienceScore,
    ownershipLevelScore,
    industryStructureFitScore,
    structureFlags,
    // append-only: role inference detail (세분 role 도입 대비)
    roleInference: {
      fineRole: (roleInferred?.fineRole || "").toString(),
      familyRole: (roleInferred?.familyRole || "").toString(),
      score: Number(roleInferred?.score ?? 0) || 0,
    },
  };

  // ------------------------------
  // structureSummaryForAI (required)
  // ------------------------------
  const sizeCandLabel = companySizeLabel(candidateSize);
  const sizeTargLabel = companySizeLabel(targetSize);

  const ownershipLabel = labelFrom100(ownershipLevelScore);
  const vendorLabel = labelFrom100(vendorExperienceScore);
  const industryLabel = labelFrom100(industryStructureFitScore);

  const sizeSentence =
    (sizeCandLabel !== "UNKNOWN" || sizeTargLabel !== "UNKNOWN")
      ? `Candidate from ${sizeCandLabel} company applying to ${sizeTargLabel}.`
      : "Company size signals uncertain.";

  const ownershipSentence =
    `Ownership evidence ${ownershipLabel}${ownership.hits?.length ? ` (${ownership.hits.slice(0, 6).join(", ")})` : ""}.`;

  const vendorSentence =
    `Vendor experience relevance ${vendorLabel}.`;

  const industrySentence =
    (resumeInd && jdInd)
      ? `Industry match ${industryLabel} (resume: ${resumeInd}, jd: ${jdInd}).`
      : `Industry match ${industryLabel}.`;

  const structureSummaryForAI =
    `${sizeSentence} ${ownershipSentence} ${vendorSentence} ${industrySentence}`.trim();

  return { structureAnalysis, structureSummaryForAI };
}

// ------------------------------
// Exported helpers (append-only)
// - 기존 사용처 호환: buildHypotheses/buildReport는 그대로 유지
// - 신규 output 구조가 필요할 때만 사용
// ------------------------------
export function buildStructureAnalysis({
  resumeText,
  jdText,
  detectedIndustry,
  detectedRole,
  detectedCompanySizeCandidate,
  detectedCompanySizeTarget,

  // ✅ append-only: KSCO hints (do NOT reference `state` here)
  roleKscoMajor,
  roleKscoOfficeSub,
}) {
  return applyStructureRuleEngine({
    resumeText,
    jdText,
    detectedIndustry,
    detectedRole,
    detectedCompanySizeCandidate,
    detectedCompanySizeTarget,

    // ✅ use injected args (safe even if undefined)
    roleKscoMajor,
    roleKscoOfficeSub,
  });
}

// ------------------------------
// Hireability (append-only)
// - 신규 평가 프레임 추가: 기존 점수/가설/리포트/알고리즘은 그대로 유지
// - AI는 ‘판단’이 아니라 ‘추출’만: 불확실하면 null/unknown 전제
// ------------------------------
function neutral55(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 55;
  return clamp(Math.round(n), 0, 100);
}

function normalizeEnum(x, allowed, fallback = "unknown") {
  const s = (x || "").toString().trim();
  if (!s) return fallback;
  const k = safeLower(s);
  if (allowed.includes(k)) return k;
  return fallback;
}

function normalizeLevel04(x) {
  if (x === null || x === undefined) return null;
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  return clamp(r, 0, 4);
}

function responsibilityLevelFit(candidateResponsibility, targetResponsibility) {
  if (candidateResponsibility === null || candidateResponsibility === undefined) return "LOW";
  if (targetResponsibility === null || targetResponsibility === undefined) return "LOW";
  const c = Number(candidateResponsibility);
  const t = Number(targetResponsibility);
  if (!Number.isFinite(c) || !Number.isFinite(t)) return "LOW";
  if (c >= t) return "HIGH";
  if (c === t - 1) return "MEDIUM";
  return "LOW";
}

function responsibilityLevelFitScoreFromLabel(label) {
  const l = (label || "").toString().trim();
  if (l === "HIGH") return 90;
  if (l === "MEDIUM") return 70;
  return 35;
}

function executionCoordinationFitScore(candidateRoleType, targetRoleType) {
  const c = normalizeEnum(candidateRoleType, ["execution", "coordination", "unknown"], "unknown");
  const t = normalizeEnum(targetRoleType, ["execution", "coordination", "unknown"], "unknown");

  if (c === "unknown" || t === "unknown") return 55;

  if (c === "execution" && t === "coordination") return 30;
  if (c === "coordination" && t === "coordination") return 80;
  if (c === "execution" && t === "execution") return 75;
  if (c === "coordination" && t === "execution") return 65;

  return 55;
}

function executionCoordinationRiskLabel(candidateRoleType, targetRoleType) {
  const c = normalizeEnum(candidateRoleType, ["execution", "coordination", "unknown"], "unknown");
  const t = normalizeEnum(targetRoleType, ["execution", "coordination", "unknown"], "unknown");
  if (c === "execution" && t === "coordination") return "HIGH";
  if (c === "unknown" || t === "unknown") return "MEDIUM";
  if (c === t) return "LOW";
  return "MEDIUM";
}

function decisionExposureScore(candidateDecisionExposureLevel) {
  const lv = normalizeLevel04(candidateDecisionExposureLevel);
  if (lv === null) return 55;
  return clamp(Math.round((lv / 4) * 100), 0, 100);
}

function businessModelFitScore(candidateBusinessModel, targetBusinessModel) {
  const allowed = ["platform", "manufacturing", "marketplace", "inventory", "saas", "subscription", "ads", "unknown"];
  const c = normalizeEnum(candidateBusinessModel, allowed, "unknown");
  const t = normalizeEnum(targetBusinessModel, allowed, "unknown");

  if (c === "unknown" || t === "unknown") return 55;
  if (c === t) return 85;

  // 유사 판정 테이블(있으면 65)
  const similar = new Set([
    "saas|subscription",
    "subscription|saas",
    "marketplace|platform",
    "platform|marketplace",
    "inventory|manufacturing",
    "manufacturing|inventory",
    "platform|ads",
    "ads|platform",
  ]);
  if (similar.has(`${c}|${t}`)) return 65;

  return 35;
}

function pickComparableRatio(candidateImpact, targetImpact) {
  const c = candidateImpact || {};
  const t = targetImpact || {};

  const pairs = [
    ["revenue", c.revenue, t.revenue],
    ["users", c.users, t.users],
    ["projectSize", c.projectSize, t.projectSize],
  ];

  const ratios = [];
  for (const [key, cv, tv] of pairs) {
    const a = Number(cv);
    const b = Number(tv);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (b <= 0) continue;
    ratios.push({ key, ratio: a / b });
  }

  if (!ratios.length) return null;

  // 여러 값이 있으면 "가장 보수적인(최소 ratio)"로 평가
  ratios.sort((x, y) => x.ratio - y.ratio);
  return ratios[0];
}

function impactScaleFitScore(candidateImpact, targetImpact) {
  const r = pickComparableRatio(candidateImpact, targetImpact);
  if (!r) return 55;

  const ratio = r.ratio;
  if (ratio >= 1.0) return 90;
  if (ratio >= 0.5) return 70;
  if (ratio >= 0.2) return 45;
  return 25;
}

function reportingLineRank(x) {
  const v = (x || "").toString().trim();
  const k = safeLower(v);
  if (k === "teamlead") return 1;
  if (k === "director") return 2;
  if (k === "cxo") return 3;
  if (k === "ceo") return 4;
  return 0;
}

function reportingLineFitScore(candidateReportingLine, targetReportingLine) {
  const c = normalizeEnum(candidateReportingLine, ["teamlead", "director", "cxo", "ceo", "unknown"], "unknown");
  const t = normalizeEnum(targetReportingLine, ["teamlead", "director", "cxo", "ceo", "unknown"], "unknown");
  if (c === "unknown" || t === "unknown") return 55;

  const cr = reportingLineRank(c);
  const tr = reportingLineRank(t);
  if (!cr || !tr) return 55;

  const diff = Math.abs(cr - tr);
  if (diff === 0) return 85;
  if (diff === 1) return 65;
  return 40;
}

function orgComplexityRank(x) {
  const v = (x || "").toString().trim();
  const k = safeLower(v);
  if (k === "low") return 1;
  if (k === "mid") return 2;
  if (k === "high") return 3;
  return 0;
}

function orgComplexityFitScore(candidateOrgComplexity, targetOrgComplexity) {
  const c = normalizeEnum(candidateOrgComplexity, ["low", "mid", "high", "unknown"], "unknown");
  const t = normalizeEnum(targetOrgComplexity, ["low", "mid", "high", "unknown"], "unknown");
  if (c === "unknown" || t === "unknown") return 55;

  const cr = orgComplexityRank(c);
  const tr = orgComplexityRank(t);
  if (!cr || !tr) return 55;

  const diff = Math.abs(cr - tr);
  if (diff === 0) return 80;
  if (diff === 1) return 60;
  return 40;
}

function careerConsistencyScoreFromSignals({ ai }) {
  // 규칙: risk=HIGH면 35, 아니면 70, 불확실 55
  // AI가 추출하는 값이 없으면 추측하지 않고 55
  const fit = ai?.fitExtract || ai?.extracted?.fitExtract || null;

  const r1 = fit?.careerShiftRisk;
  const r2 = fit?.noClearBridgeExperience;

  const s1 = (r1 || "").toString().trim();
  const s2 = (r2 || "").toString().trim();

  const riskText = safeLower(s1);
  const noBridgeText = safeLower(s2);

  if (riskText === "high") return 35;
  if (riskText === "low") return 70;

  if (noBridgeText === "true") return 35;
  if (noBridgeText === "false") return 70;

  return 55;
}

function hireabilityScore(payload) {
  const scores = payload?.scores || {};
  const weights = payload?.weights || {};

  const sumW =
    (weights.responsibility || 0) +
    (weights.ownership || 0) +
    (weights.decisionExposure || 0) +
    (weights.industryFit || 0) +
    (weights.businessModelFit || 0) +
    (weights.executionFit || 0) +
    (weights.companySizeFit || 0) +
    (weights.signalStrength || 0);

  const W = sumW > 0 ? sumW : 1;

  const s = {
    responsibility: neutral55(scores.responsibilityLevelFitScore),
    ownership: neutral55(scores.ownershipLevelScore),
    decisionExposure: neutral55(scores.decisionExposureScore),
    industryFit: neutral55(scores.industryFitScore),
    businessModelFit: neutral55(scores.businessModelFitScore),
    executionFit: neutral55(scores.executionCoordinationFitScore),
    companySizeFit: neutral55(scores.companySizeFitScore),
    signalStrength: neutral55(scores.signalStrengthScore),
  };

  const out =
    (weights.responsibility || 0) * s.responsibility +
    (weights.ownership || 0) * s.ownership +
    (weights.decisionExposure || 0) * s.decisionExposure +
    (weights.industryFit || 0) * s.industryFit +
    (weights.businessModelFit || 0) * s.businessModelFit +
    (weights.executionFit || 0) * s.executionFit +
    (weights.companySizeFit || 0) * s.companySizeFit +
    (weights.signalStrength || 0) * s.signalStrength;

  return clamp(Math.round(out / W), 0, 100);
}

function buildHireabilityLayer({ ai, structureAnalysis, resumeSignals }) {
  const fitExtract = (ai?.fitExtract || ai?.extracted?.fitExtract || ai?.fit || null) || {};

  const candResp = normalizeLevel04(fitExtract.candidateResponsibilityLevel);
  const targResp = normalizeLevel04(fitExtract.targetResponsibilityLevel);
  const respLabel = responsibilityLevelFit(candResp, targResp);
  const responsibilityLevelFitScore = responsibilityLevelFitScoreFromLabel(respLabel);

  const candidateRoleType = normalizeEnum(fitExtract.candidateRoleType, ["execution", "coordination", "unknown"], "unknown");
  const targetRoleType = normalizeEnum(fitExtract.targetRoleType, ["execution", "coordination", "unknown"], "unknown");
  const executionCoordinationFitScoreVal = executionCoordinationFitScore(candidateRoleType, targetRoleType);
  const executionCoordinationRisk = executionCoordinationRiskLabel(candidateRoleType, targetRoleType);

  const decisionExposureScoreVal = decisionExposureScore(fitExtract.candidateDecisionExposureLevel);

  const businessModelFitScoreVal = businessModelFitScore(fitExtract.candidateBusinessModel, fitExtract.targetBusinessModel);

  const impactScaleFitScoreVal = impactScaleFitScore(fitExtract.candidateImpact, fitExtract.targetImpact);

  const reportingLineFitScoreVal = reportingLineFitScore(fitExtract.candidateReportingLine, fitExtract.targetReportingLine);

  const orgComplexityFitScoreVal = orgComplexityFitScore(fitExtract.candidateOrgComplexity, fitExtract.targetOrgComplexity);

  const careerConsistencyScoreVal = careerConsistencyScoreFromSignals({ ai });

  const signalStrengthScoreVal = clamp(Math.round((resumeSignals?.resumeSignalScore ?? 0) * 100), 0, 100);

  const ownershipLevelScoreVal = score100(structureAnalysis?.ownershipLevelScore ?? 55);

  const companySizeFitScoreVal = score100(structureAnalysis?.companySizeFitScore ?? 55);

  const industryFitScoreVal = score100(structureAnalysis?.industryStructureFitScore ?? 55);

  const vendorExperienceScoreVal =
    structureAnalysis && Object.prototype.hasOwnProperty.call(structureAnalysis, "vendorExperienceScore")
      ? score100(structureAnalysis.vendorExperienceScore)
      : 55;

  const weights = {
    responsibility: 0.22,
    ownership: 0.18,
    decisionExposure: 0.16,
    industryFit: 0.14,
    businessModelFit: 0.10,
    executionFit: 0.08,
    companySizeFit: 0.00,
    signalStrength: 0.06,
  };

  const scores = {
    companySizeFitScore: companySizeFitScoreVal,
    ownershipLevelScore: ownershipLevelScoreVal,
    responsibilityLevelFitScore,
    decisionExposureScore: decisionExposureScoreVal,
    executionCoordinationFitScore: executionCoordinationFitScoreVal,
    businessModelFitScore: businessModelFitScoreVal,
    impactScaleFitScore: impactScaleFitScoreVal,
    careerConsistencyScore: careerConsistencyScoreVal,
    signalStrengthScore: signalStrengthScoreVal,
    reportingLineFitScore: reportingLineFitScoreVal,
    orgComplexityFitScore: orgComplexityFitScoreVal,
    industryFitScore: industryFitScoreVal,
    vendorExperienceScore: vendorExperienceScoreVal,
  };

  const hireabilityScoreVal = hireabilityScore({ scores, weights });

  return {
    scores,
    final: {
      hireabilityScore: hireabilityScoreVal,
      weights,
    },
    labels: {
      responsibilityLevelFit: respLabel,
      executionCoordinationRisk,
    },
    extracted: {
      fitExtract,
    },
  };
}

// ------------------------------
// riskLayer (append-only)
// - documentRisk vs interviewRisk
// - 기존 로직/점수/리포트는 유지, analyze() 반환값에만 추가
// ------------------------------
function riskLevelFromScore(score100Val) {
  const s = clamp(Math.round(Number(score100Val) || 0), 0, 100);
  if (s >= 70) return "HIGH";
  if (s >= 40) return "MEDIUM";
  return "LOW";
}

function safeNumberOrNull(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  return n;
}

function extractMatchRate01FromKnownSources({ state, ai, keywordSignals, objective, keywordMatchV2 }) {
  // 우선순위(있는 것만): keywordMatchV2.matchRate -> state/ai의 keywordMatchV2 -> keywordSignals.matchScore(0~1) -> objective.parts.keywordMatchScore(0~1)
  const direct =
    safeNumberOrNull(keywordMatchV2?.matchRate) ??
    safeNumberOrNull(state?.keywordMatchV2?.matchRate) ??
    safeNumberOrNull(ai?.keywordMatchV2?.matchRate) ??
    safeNumberOrNull(ai?.semanticMatches?.matchRate) ??
    safeNumberOrNull(ai?.matchRate) ??
    safeNumberOrNull(keywordSignals?.matchRate) ??
    safeNumberOrNull(keywordSignals?.matchScore) ??
    safeNumberOrNull(objective?.parts?.keywordMatchScore);

  if (direct === null) return null;

  // 0~1로 들어온 경우
  if (direct >= 0 && direct <= 1.001) return clamp(direct, 0, 1);

  // 0~100으로 들어온 경우를 0~1로 변환
  if (direct >= 0 && direct <= 100.001) return clamp(direct / 100, 0, 1);

  return null;
}

function extractHardMustMissingCount({ state, ai, keywordSignals }) {
  // 우선순위(있는 것만): hardMustMissingCount / mustHaveMissingCount / missingCritical.length
  const n1 = safeNumberOrNull(state?.hardMustMissingCount);
  if (n1 !== null) return Math.max(0, Math.round(n1));

  const n2 = safeNumberOrNull(ai?.hardMustMissingCount);
  if (n2 !== null) return Math.max(0, Math.round(n2));

  const n3 = safeNumberOrNull(state?.mustHaveMissingCount);
  if (n3 !== null) return Math.max(0, Math.round(n3));

  const n4 = safeNumberOrNull(ai?.mustHaveMissingCount);
  if (n4 !== null) return Math.max(0, Math.round(n4));

  if (Array.isArray(keywordSignals?.missingCritical)) {
    return keywordSignals.missingCritical.length;
  }

  return null;
}

function buildDocumentRiskLayer({
  state,
  ai,
  keywordSignals,
  objective,
  keywordMatchV2 = null,
}) {
  const drivers = [];

  const matchRate01 = extractMatchRate01FromKnownSources({
    state,
    ai,
    keywordSignals,
    objective,
    keywordMatchV2,
  });

  const docRiskFromMatch =
    matchRate01 === null
      ? 55
      : (1 - clamp(matchRate01, 0, 1)) * 100;

  if (matchRate01 !== null && matchRate01 < 0.55) {
    drivers.push("JD 핵심요건 매칭률이 낮음");
  }

  let adjust = 0;

  const hardMissing = extractHardMustMissingCount({ state, ai, keywordSignals });
  if (hardMissing !== null && hardMissing > 0) {
    adjust += Math.min(30, hardMissing * 10);
    drivers.push("필수요건 누락 가능성");
  }

  if (!drivers.length) {
    drivers.push("근거 데이터 부족(요건 리스트/이력서 bullet 권장)");
  }

  const score = clamp(Math.round(docRiskFromMatch + adjust), 0, 100);

  return {
    score,
    level: riskLevelFromScore(score),
    drivers: uniq(drivers),
  };
} ~

  function pickHireabilityScore100(hireability) {
    const h = safeNumberOrNull(hireability?.final?.hireabilityScore);
    if (h === null) return null;
    return clamp(Math.round(h), 0, 100);
  }

function buildInterviewRiskLayer({ hireability }) {
  const drivers = [];

  const hireabilityScore100Val = pickHireabilityScore100(hireability);
  const interviewRiskBase =
    hireabilityScore100Val === null
      ? 55
      : 100 - clamp(hireabilityScore100Val, 0, 100);

  let adjust = 0;
  let adjustCount = 0;

  const resp = safeNumberOrNull(hireability?.scores?.responsibilityLevelFitScore);
  const own = safeNumberOrNull(hireability?.scores?.ownershipLevelScore);
  const dec = safeNumberOrNull(hireability?.scores?.decisionExposureScore);
  const imp = safeNumberOrNull(hireability?.scores?.impactScaleFitScore);
  const exe = safeNumberOrNull(hireability?.scores?.executionCoordinationFitScore);

  // TOP3(책임/오너십/의사결정) 보정: <50이면 +10, 총 25 cap
  const bumpIfLow = (v) => {
    if (v === null) return 0;
    if (v < 50) return 10;
    return 0;
  };

  const bumps = [
    bumpIfLow(resp),
    bumpIfLow(own),
    bumpIfLow(dec),
  ];

  for (const b of bumps) {
    if (b > 0 && adjust < 25) {
      const add = Math.min(b, 25 - adjust);
      adjust += add;
      adjustCount += 1;
    }
  }

  // drivers (값 있을 때만)
  if (resp !== null && resp < 50) drivers.push("책임 레벨이 목표 포지션보다 낮을 가능성");
  if (own !== null && own < 50) drivers.push("프로젝트 오너십/성과 책임 신호가 약함");
  if (dec !== null && dec < 50) drivers.push("의사결정에 가까운 경험 근거가 약함");
  if (imp !== null && imp < 50) drivers.push("다뤄본 임팩트 규모가 목표 대비 작을 가능성");
  if (exe !== null && exe < 50) drivers.push("실행형→조정형 전환 리스크");

  // 데이터 부족 처리
  const hasAnySignal =
    hireabilityScore100Val !== null ||
    resp !== null ||
    own !== null ||
    dec !== null ||
    imp !== null ||
    exe !== null;

  if (!hasAnySignal) {
    drivers.push("근거 데이터 부족(책임/오너십/의사결정 입력 권장)");
  } else if (!drivers.length) {
    // 값은 있으나 리스크 드라이버가 하나도 안 잡힌 경우: 중립 드라이버 최소 1개
    drivers.push("근거 데이터 부족(책임/오너십/의사결정 입력 권장)");
  }

  const score = clamp(Math.round(interviewRiskBase + adjust), 0, 100);

  return {
    score,
    level: riskLevelFromScore(score),
    drivers: uniq(drivers),
  };
}
// ==============================
// [PATCH] Gate -> decisionPressure ceiling/penalty (append-only)
// - decisionPack.riskResults의 gate 최대 priority 기반으로
//   analyzer.js의 decisionPressure 결과(0~1 지표)에 강한 페널티를 반영
// ==============================
function __clamp01_gate(x, d = 0) {
  const n = Number(x);
  if (!Number.isFinite(n)) return d;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
function __getGateMaxPriorityFromDecisionPack(decisionPack) {
  const arr = Array.isArray(decisionPack?.riskResults) ? decisionPack.riskResults : [];
  let maxP = 0;
  for (const r of arr) {
    if (!r) continue;
    if (String(r?.layer || "") !== "gate") continue;
    const p = Number(r?.priority ?? 0);
    if (Number.isFinite(p) && p > maxP) maxP = p;
  }
  return maxP;
}
function __gatePenalty01_fromPriority(maxP) {
  // 현실형: gate 하나 걸리면 강하게 불리
  // (지금 decision/index.js의 gateBoost(0.04~0.35)보다 “최종 판단용”은 더 세게)
  let k = 0;
  if (maxP >= 95) k = 0.60;
  else if (maxP >= 85) k = 0.45;
  else if (maxP >= 70) k = 0.30;
  else if (maxP >= 60) k = 0.20;
  else if (maxP >= 50) k = 0.12;
  return __clamp01_gate(k, 0);
}
function __applyGatePenaltyToDecisionPressure(decisionPressure, decisionPack) {
  const dp = decisionPressure && typeof decisionPressure === "object" ? decisionPressure : null;
  if (!dp) return dp;

  const maxP = __getGateMaxPriorityFromDecisionPack(decisionPack);
  const k = __gatePenalty01_fromPriority(maxP);
  if (!k || k <= 0) return dp;

  // dp는 { replaceabilityRisk, differentiationLevel, internalCompetitionRisk, narrativeCoherence, promotionFeasibility }
  // - risk 계열은 상승
  // - positive(가능성) 계열은 하락
  const out = {
    ...dp,
    replaceabilityRisk: __clamp01_gate((dp.replaceabilityRisk ?? 0) + 0.70 * k),
    internalCompetitionRisk: __clamp01_gate((dp.internalCompetitionRisk ?? 0) + 0.85 * k),
    differentiationLevel: __clamp01_gate((dp.differentiationLevel ?? 0) * (1 - 0.70 * k)),
    narrativeCoherence: __clamp01_gate((dp.narrativeCoherence ?? 0) * (1 - 0.55 * k)),
    promotionFeasibility: __clamp01_gate((dp.promotionFeasibility ?? 0) * (1 - 0.80 * k)),
    // 설명/디버깅용 메타(기존 소비에 영향 거의 없음)
    gatePenalty: {
      maxPriority: maxP,
      penalty01: k,
      applied: true,
    },
  };

  return out;
}
// ------------------------------
// decisionPressureLayer (append-only)
// - AI가 아니라 "로컬 analyzer"에서 계산 (운영 안정성/일관성)
// - 0~1 스케일로만 반환 (UI에서 해석/설명)
// ------------------------------
function buildDecisionPressure({ state, keywordSignals, careerSignals, resumeSignals, structureAnalysis, objective }) {
  const ownScore = Number(structureAnalysis?.ownershipLevelScore ?? 55) || 55; // 0~100
  const ownership01 = normalizeScore01(ownScore / 100);

  const kw01 = normalizeScore01(Number(keywordSignals?.matchScore ?? 0) || 0);
  const proof01 = normalizeScore01(Number(resumeSignals?.resumeSignalScore ?? 0) || 0);
  const exp01 = normalizeScore01(Number(careerSignals?.experienceLevelScore ?? 0) || 0);

  const careerRisk01 = normalizeScore01(Number(careerSignals?.careerRiskScore ?? 0) || 0); // risk (0~1)
  const objective01 = normalizeScore01(Number(objective?.objectiveScore ?? 0) || 0);

  // selfCheck 기반(없으면 중립)
  const sc = state?.selfCheck || {};
  const story01 = normalizeScore01(((Number(sc?.storyConsistency ?? 3) || 3) - 1) / 4); // 1~5 -> 0~1
  const clarity01 = normalizeScore01(((Number(sc?.roleClarity ?? 3) || 3) - 1) / 4); // 1~5 -> 0~1

  // 경험 갭(연차 부족) 가산
  const expGap = Number(careerSignals?.experienceGap ?? 0);
  const expShort01 = expGap < 0 ? normalizeScore01(Math.min(1, Math.abs(expGap) / 5)) : 0;

  // 1) differentiationLevel: "대체 불가능 포인트" (ownership + 수치근거 + 키워드 정합)
  const differentiationLevel = normalizeScore01(0.45 * ownership01 + 0.3 * proof01 + 0.25 * kw01);

  // 2) replaceabilityRisk: "굳이 뽑을 이유 부족" (차별성 낮음 + 리스크 높음)
  const replaceabilityRisk = normalizeScore01(
    (1 - differentiationLevel) * 0.65 + careerRisk01 * 0.2 + (1 - objective01) * 0.15
  );

  // 3) internalCompetitionRisk: "내부/상위 경쟁자 가정 시 밀리는 위험"
  // - must-have(kw), 증거(proof), ownership 중 하나라도 낮으면 리스크↑
  const internalCompetitionRisk = normalizeScore01(
    (1 - kw01) * 0.35 + (1 - proof01) * 0.25 + (1 - ownership01) * 0.25 + expShort01 * 0.15
  );

  // 4) narrativeCoherence: "이 사람을 뽑아야 하는 스토리/일관성"
  // - story/clarity 기반 + 잦은 이직/공백 리스크는 간접적으로 careerRisk로 반영
  const narrativeCoherence = normalizeScore01(0.55 * story01 + 0.35 * clarity01 + (1 - careerRisk01) * 0.1);

  // 5) promotionFeasibility: "들어와서 레벨업/승진 그림이 그려지는가"
  // - 연차 적합(exp), ownership(리드 경험), 키워드 정합(역할 fit)
  let promotionFeasibility = normalizeScore01(0.5 * exp01 + 0.35 * ownership01 + 0.15 * kw01);
  if (expGap < 0) promotionFeasibility = normalizeScore01(promotionFeasibility - 0.15 * expShort01);

  return {
    replaceabilityRisk,
    differentiationLevel,
    internalCompetitionRisk,
    narrativeCoherence,
    promotionFeasibility,
  };
}
// (필수 import 추가 필요 - 파일 상단에 append-only로 추가하세요)
// import { detectStructuralPatterns } from "./structuralPatterns";
// import { buildDecisionPack } from "./decision";
// ------------------------------
// [DBG] analyzer module loaded marker (append-only)
// - 삭제/주석처리 가능 (문제 해결 후)
// ------------------------------
try {
  const __g = typeof globalThis !== "undefined" ? globalThis : null;
  if (__g) __g.__ANALYZER_MODULE_LOADED__ = Number(__g.__ANALYZER_MODULE_LOADED__ || 0) + 1;
} catch { }
// 신규 메인 출력(append-only): 구조 분석 필드를 최종 output에 포함 + hireability 레이어 추가
// 신규 메인 출력(append-only): 구조 분석 필드를 최종 output에 포함 + hireability 레이어 추가
export function analyze(state, ai = null) {
  // ✅ 3-B (append-only): map keywordMatchV2.matchRate -> ai.semanticMatches.matchRate
  // - 목적: UI/리포트가 analysis.ai.semanticMatches.matchRate 경로로 안정적으로 접근 가능하게
  // - 안전장치: try/catch + 기존 값 덮어쓰기 금지
  const ENABLE_SEMANTIC = true;
  if (ENABLE_SEMANTIC) {
    try {
      // ai 객체 보정(외부에서 null/원시값이 들어와도 앱이 안 터지게)
      if (!ai || typeof ai !== "object") ai = {};

      const kw =
        (ai?.keywordMatchV2 && typeof ai.keywordMatchV2 === "object" ? ai.keywordMatchV2 : null) ??
        (state?.keywordMatchV2 && typeof state.keywordMatchV2 === "object" ? state.keywordMatchV2 : null);

      const avg = typeof kw?.matchRate === "number" ? kw.matchRate : null;

      if (avg !== null) {
        ai.semanticMatches = ai.semanticMatches || {};
        if (typeof ai.semanticMatches.matchRate !== "number") {
          ai.semanticMatches.matchRate = avg;
        }
      }
    } catch {
      // noop: 운영 안정성(실패해도 analyze 전체는 계속 동작)
    }
  }
  // ------------------------------
  // [DBG] analyze entered marker (append-only)
  // ------------------------------
  try {
    const __g = typeof globalThis !== "undefined" ? globalThis : null;
    if (__g) __g.__ANALYZE_ENTERED__ = Number(__g.__ANALYZE_ENTERED__ || 0) + 1;
  } catch { }
  // ✅ PATCH(append-only): default modeLocal to "local" if falsy/blank
  // - 기존에는 modeLocal이 ""/undefined일 수 있음 → 이후 분기(추가될 경우)에서 애매해질 수 있으므로 기본값 고정
  try {
    if (state && !String(state?.modeLocal || "").trim()) state.modeLocal = "local";
  } catch { }
  // Canonical analysis payload (raw UI state is kept as-is outside this function)
  const stateCanonical = buildCanonicalAnalysisInput(state || {});
    // ✅ SAFE PATCH (append-only): structurePack must exist in analyze scope
  // - 목적: buildHireabilityLayer/buildDecisionPressure/return payload에서 structurePack.structureAnalysis 참조 안정화
  // - 안전장치: try/catch + 실패 시 null pack 반환
  const structurePack = (() => {
    try {
      return buildStructureAnalysis({
        resumeText: stateCanonical?.resume || "",
        jdText: stateCanonical?.jd || "",
        detectedIndustry: (ai?.detectedIndustry ?? ai?.industry ?? stateCanonical?.industry ?? "").toString(),
        detectedRole: (
          ai?.detectedRole ??
          ai?.role ??
          stateCanonical?.canonical?.role?.target?.value ??
          stateCanonical?.roleTarget ??
          ""
        ).toString(),
        detectedCompanySizeCandidate: (ai?.detectedCompanySizeCandidate ?? ai?.companySizeCandidate ?? stateCanonical?.companySizeCandidate ?? "").toString(),
        detectedCompanySizeTarget: (ai?.detectedCompanySizeTarget ?? ai?.companySizeTarget ?? stateCanonical?.companySizeTarget ?? "").toString(),

        // ✅ KSCO hints (append-only)
        roleKscoMajor: stateCanonical?.roleKscoMajor,
        roleKscoOfficeSub: stateCanonical?.roleKscoOfficeSub,
      });
    } catch {
      return { structureAnalysis: null, structureSummaryForAI: "" };
    }
  })();
  const keywordSignals = buildKeywordSignals(state?.jd || "", state?.resume || "", ai);
  const careerSignals = buildCareerSignals(state?.career || {}, state?.jd || "");
  const resumeSignals = buildResumeSignals(state?.resume || "", state?.portfolio || "");

  const majorSignals = buildMajorSignals({
    jd: state?.jd || "",
    resume: state?.resume || "",
    state,
    ai,
    keywordSignals,
    resumeSignals,
  });

  const objective = buildObjectiveScore({ keywordSignals, careerSignals, resumeSignals, majorSignals });
  // ------------------------------
  // SSOT Phase1 (append-only): canonical role/domain fields
  // - 기존 로직/점수/흐름은 변경하지 않고 objective에만 append
  // ------------------------------
  const __pickFirstNonEmpty = (list) => {
    const arr = Array.isArray(list) ? list : [];
    for (const v of arr) {
      if (v === undefined || v === null) continue;
      if (typeof v === "string") {
        const s = v.trim();
        if (s) return s;
        continue;
      }
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      if (typeof v === "object") {
        // roleInference object 등을 문자열 후보로 축약
        const cands = [
          v.targetRole,
          v.currentRole,
          v.familyRole,
          v.fineRole,
          v.role,
          v.domain,
          v.name,
          v.label,
          v.text,
          v.value,
        ];
        for (const c of cands) {
          if (typeof c !== "string") continue;
          const cs = c.trim();
          if (cs) return cs;
        }
      }
    }
    return undefined;
  };

  const __inferFamilyFromRoleSSOT = (roleText) => {
    const t = String(roleText || "").toLowerCase().trim();
    if (!t) return undefined;

    if (/(data|분석|bi|analytics|sql|python|ml|ai)/.test(t)) return "data";
    if (/(product|pm|po|기획|서비스 기획|프로덕트)/.test(t)) return "pm";
    if (/(marketing|마케팅|브랜드|퍼포먼스|crm|그로스)/.test(t)) return "marketing";
    if (/(sales|영업|bd|business development|account)/.test(t)) return "sales";
    if (/(hr|채용|인사|hrbp|hrd|조직문화)/.test(t)) return "hr";
    if (/(finance|회계|재무|fp&a|세무)/.test(t)) return "finance";
    if (/(procurement|구매|소싱|조달|scm|operations|운영|ops|물류)/.test(t)) return "ops";
    if (/(backend|frontend|fullstack|개발|engineer|software|react|node|java)/.test(t)) return "dev";

    return undefined;
  };

  const __jdTextForSSOT = state?.jd || state?.jdText || "";
  const __jdModelForSSOT =
    objective?.jdModel ||
    ai?.jdModel ||
    state?.__parsedJD ||
    state?.parsedJD ||
    null;

  const normalizedCurrentRole = __pickFirstNonEmpty([
    state?.currentRole,
    state?.roleCurrent,
    state?.role,
    objective?.role,
    ai?.role,
  ]);

  const normalizedTargetRole = __pickFirstNonEmpty([
    state?.roleTarget,
    state?.targetRole,
    objective?.roleInference,
    ai?.roleInference,
    state?.role,
  ]);

  const normalizedCurrentDomain = __pickFirstNonEmpty([
    state?.industryCurrent,
    objective?.resumeIndustry,
    ai?.resumeIndustry,
  ]);

  const normalizedTargetDomain = __pickFirstNonEmpty([
    objective?.jdIndustry,
    __jdModelForSSOT?.domain,
    state?.industryTarget,
    ai?.jdIndustry,
  ]);

  const normalizedJobFamily = __pickFirstNonEmpty([
    inferJobFamilyFromJD(__jdTextForSSOT),
    __inferFamilyFromRoleSSOT(__pickFirstNonEmpty([objective?.roleInference])),
    __inferFamilyFromRoleSSOT(normalizedTargetRole),
  ]);

  objective.normalizedCurrentRole = normalizedCurrentRole;
  objective.normalizedTargetRole = normalizedTargetRole;
  objective.normalizedCurrentDomain = normalizedCurrentDomain;
  objective.normalizedTargetDomain = normalizedTargetDomain;
  objective.normalizedJobFamily = normalizedJobFamily;
  // ------------------------------
  // SSOT Phase1 Hotfix (append-only): priority + unknown defaults + jobFamily meta
  // - 기존 canonical 계산을 유지하되, 승인된 우선순위로 최종값을 다시 확정
  // ------------------------------
  const __roleInferenceObj =
    objective?.roleInference && typeof objective.roleInference === "object"
      ? objective.roleInference
      : null;
  const __jdFamilyFromJD = inferJobFamilyFromJD(__jdTextForSSOT);

  const __normalizedCurrentRoleFinal =
    __pickFirstNonEmpty([
      state?.currentRole,
      state?.roleCurrent,
      state?.role,
      __roleInferenceObj?.currentRole,
      objective?.role,
      ai?.role,
    ]) || "unknown";

  const __normalizedTargetRoleFinal =
    __pickFirstNonEmpty([
      state?.roleTarget,
      state?.targetRole,
      __roleInferenceObj?.targetRole,
      __roleInferenceObj?.familyRole,
      __roleInferenceObj?.fineRole,
      ai?.roleInference,
      state?.role,
    ]) || "unknown";

  const __normalizedCurrentDomainFinal =
    __pickFirstNonEmpty([
      state?.industryCurrent,
      state?.currentIndustry,
      objective?.resumeIndustry,
      ai?.resumeIndustry,
    ]) || "unknown";

  const __normalizedTargetDomainFinal =
    __pickFirstNonEmpty([
      objective?.jdIndustry,
      __jdModelForSSOT?.domain,
      state?.industryTarget,
      state?.targetIndustry,
      ai?.jdIndustry,
    ]) || "unknown";

  let __normalizedJobFamilyFinal = "UNKNOWN";
  let __normalizedJobFamilySource = "unknown";
  let __normalizedJobFamilyConfidence = 0;

  const __jobFamilyFromJD = __pickFirstNonEmpty([__jdFamilyFromJD]);
  const __jobFamilyFromInference = __inferFamilyFromRoleSSOT(
    __pickFirstNonEmpty([__roleInferenceObj?.familyRole])
  );
  const __jobFamilyFromTargetRole = __inferFamilyFromRoleSSOT(__normalizedTargetRoleFinal);

  if (__jobFamilyFromJD) {
    __normalizedJobFamilyFinal = String(__jobFamilyFromJD).trim().toUpperCase();
    __normalizedJobFamilySource = "jd_infer";
    __normalizedJobFamilyConfidence = 0.9;
  } else if (__jobFamilyFromInference) {
    __normalizedJobFamilyFinal = String(__jobFamilyFromInference).trim().toUpperCase();
    __normalizedJobFamilySource = "role_inference_family";
    __normalizedJobFamilyConfidence = 0.7;
  } else if (__jobFamilyFromTargetRole) {
    __normalizedJobFamilyFinal = String(__jobFamilyFromTargetRole).trim().toUpperCase();
    __normalizedJobFamilySource = "target_role_map";
    __normalizedJobFamilyConfidence = 0.5;
  }

  objective.normalizedCurrentRole = __normalizedCurrentRoleFinal;
  objective.normalizedTargetRole = __normalizedTargetRoleFinal;
  objective.normalizedCurrentDomain = __normalizedCurrentDomainFinal;
  objective.normalizedTargetDomain = __normalizedTargetDomainFinal;
  objective.normalizedJobFamily = __normalizedJobFamilyFinal;
  objective.normalizedJobFamilySource = __normalizedJobFamilySource;
  objective.normalizedJobFamilyConfidence = __normalizedJobFamilyConfidence;

  // [append-only] Role Ontology v1 — canonical family + role distance
  try {
    const __canonicalCurrent = inferCanonicalFamily(
      objective.normalizedCurrentRole || state?.currentRole || ""
    );
    const __canonicalTarget = inferCanonicalFamily(
      objective.normalizedTargetRole || __jdTextForSSOT
    );
    const __roleOntologyDomain =
      objective.normalizedCurrentDomain || objective.normalizedTargetDomain || null;
    objective.canonicalCurrentFamily = __canonicalCurrent;
    objective.canonicalTargetFamily  = __canonicalTarget;
    objective.roleDistance = computeRoleDistance(
      __canonicalCurrent, __canonicalTarget, __roleOntologyDomain
    );
  } catch (e) {
    // debug snapshot — user-facing silent swallow 방지
    try {
      globalThis.__DBG_ROLE_ONTOLOGY_ERR__ = { err: String(e?.message || e), at: Date.now() };
    } catch {}
    // fallback: UNKNOWN으로 명시적 세팅 (undefined 방치 금지)
    objective.canonicalCurrentFamily = "UNKNOWN";
    objective.canonicalTargetFamily  = "UNKNOWN";
    objective.roleDistance = { tier: "unknown", from: "UNKNOWN", to: "UNKNOWN", override: false };
  }

  const __jdTextForEvidenceFit = state?.jd || state?.jdText || "";
  const __resumeTextForEvidenceFit = state?.resume || state?.resumeText || "";

  // ✅ PATCH ROUND 3 (append-only): evaluateEvidenceFit jdModel source priority에 SSOT 연결
  // - buildJdResumeFit() 기존 호출 위치(detectStructuralPatterns 직전)는 이동 금지
  // - priority: objective.jdModel > ai.jdModel > buildJdResumeFit().jdModel > state.__parsedJD
  let __jdModelFromFit = null;
  try {
    const __evFit = buildJdResumeFit({
      jdText: state?.jd || "",
      resumeText: state?.resume || "",
    });
    __jdModelFromFit = __evFit?.jdModel || null;
  } catch { }

  const __jdModelForEvidenceFitRaw =
    objective?.jdModel ||
    ai?.jdModel ||
    __jdModelFromFit ||
    state?.__parsedJD ||
    state?.parsedJD ||
    null;

  const __hasEvidenceTargets = (model) => {
    if (!model || typeof model !== "object") return false;
    const mustN = Array.isArray(model.mustHave) ? model.mustHave.length : 0;
    const prefN = Array.isArray(model.preferred) ? model.preferred.length : 0;
    const toolN = Array.isArray(model.tools) ? model.tools.length : 0;
    const taskN = Array.isArray(model.coreTasks) ? model.coreTasks.length : 0;
    return (mustN + prefN + toolN + taskN) > 0;
  };

  const __buildEvidenceFitFallbackModel = (jdText) => {
    const jd = JD_REC_V1__safeStr(jdText).trim();
    if (!jd) return null;

    const __dedupeTexts = (arr, maxN) => {
      const out = [];
      const seen = new Set();
      for (const x of (Array.isArray(arr) ? arr : [])) {
        const t = JD_REC_V1__safeStr(x).trim();
        if (!t) continue;
        if (t.length < 2) continue;
        const k = JD_REC_V1__normLine(t);
        if (!k || seen.has(k)) continue;
        seen.add(k);
        out.push(t);
        if (out.length >= maxN) break;
      }
      return out;
    };

    try {
      const parsed = JD_REC_V1__extractSignals(jd);
      const selected = JD_REC_V1__selectTopSignals(parsed, JD_REC_V1__LIMIT);

      const mustHave = __dedupeTexts(
        selected.filter((s) => JD_REC_V1__safeStr(s?.section) === "mustHave").map((s) => s?.text),
        8
      );
      const preferred = __dedupeTexts(
        selected.filter((s) => JD_REC_V1__safeStr(s?.section) === "preferred").map((s) => s?.text),
        6
      );
      const tools = __dedupeTexts(
        selected.filter((s) => JD_REC_V1__safeStr(s?.section) === "tools").map((s) => s?.text),
        8
      );
      const coreTasks = __dedupeTexts(
        selected.filter((s) => JD_REC_V1__safeStr(s?.section) === "coreTasks").map((s) => s?.text),
        8
      );

      if (mustHave.length || preferred.length || tools.length || coreTasks.length) {
        return { mustHave, preferred, tools, coreTasks };
      }
    } catch { }

    // Last-resort minimal fallback: keep one line to avoid totalTargets===0 hard-unavailable.
    const line = jd.split(/\r?\n/).map((x) => JD_REC_V1__safeStr(x).trim()).find((x) => x && x.length >= 6);
    if (!line) return null;
    return { mustHave: [], preferred: [], tools: [], coreTasks: [line] };
  };

  const __jdModelForEvidenceFitHasRawTargets = __hasEvidenceTargets(__jdModelForEvidenceFitRaw);
  const __jdModelForEvidenceFitFallback =
    __jdModelForEvidenceFitHasRawTargets
      ? null
      : __buildEvidenceFitFallbackModel(__jdTextForEvidenceFit);
  const __usingEvidenceFitFallbackModel =
    !__jdModelForEvidenceFitHasRawTargets &&
    !!__jdModelForEvidenceFitFallback;
  const __jdModelForEvidenceFit =
    __jdModelForEvidenceFitHasRawTargets
      ? __jdModelForEvidenceFitRaw
      : (__jdModelForEvidenceFitFallback || __jdModelForEvidenceFitRaw);

  const __evidenceFitRaw = evaluateEvidenceFit({
    jdText: __jdTextForEvidenceFit,
    resumeText: __resumeTextForEvidenceFit,
    jdModel: __jdModelForEvidenceFit,
    ai,
  });
  const evidenceFit =
    (__evidenceFitRaw && typeof __evidenceFitRaw === "object")
      ? (
        __usingEvidenceFitFallbackModel
          ? {
            ...__evidenceFitRaw,
            penalty: 0,
            modelOrigin: "fallback_text_minimal",
            meta: {
              ...(__evidenceFitRaw.meta && typeof __evidenceFitRaw.meta === "object" ? __evidenceFitRaw.meta : {}),
              modelOrigin: "fallback_text_minimal",
              scorePenaltyNeutralized: true,
            },
          }
          : __evidenceFitRaw
      )
      : __evidenceFitRaw;
  // ✅ PATCH (append-only): ensure analyze-scope jdModel alias exists for downstream consumers.
  const __jdModel = __jdModelForEvidenceFitRaw || null;
  const hypotheses = buildHypotheses(stateCanonical, ai);
  let report = buildReport(stateCanonical, ai);

  // buildStructureAnalysis({
  //   resumeText: state?.resume || "",
  //   jdText: state?.jd || "",
  //   detectedIndustry: ...,
  //   detectedRole: ...,
  //   detectedCompanySizeCandidate: (... state?.companySizeCandidate ?? "" ).toString(),
  //   detectedCompanySizeTarget: (... state?.companySizeTarget ?? "" ).toString(),
  //
  //   // ✅ append-only: KSCO hints
  //   roleKscoMajor: state?.roleKscoMajor,
  //   roleKscoOfficeSub: state?.roleKscoOfficeSub,
  // });


  // ✅ 신규(append-only): 검증 가능한 구조 패턴 감지(텍스트 기반 + 일부 타임라인 기반)
  // - 결과는 최종 return에 포함시키기 쉬우라고 별도 pack으로 보관
  // - IMPORTANT: detectStructuralPatterns는 "한 번만" 계산하고, decisionPack에도 동일 결과를 사용
  // ✅ PATCH (append-only): jdModel SSOT bridge — mustHave 우선 주입 (단일 __jdModel 재사용)
  const structural = detectStructuralPatterns({
    state,
    ai,
    jdText: state?.jd || "",
    resumeText: state?.resume || "",
    portfolioText: state?.portfolio || "",
    jdModel: __jdModel,
  });

  const structuralPatternsPack = {
    summary: structural?.summary || null,
    flags: structural?.flags || [],
    metrics: structural?.metrics || null,
  };
  // ✅ PATCH (append-only): Competency Expectation Layer v1
  // - 목적: ownership/leadership 현상의 대표 surfaced risk 1개 생성에 필요한 컨텍스트 전달
  const competencyExpectation = (() => {
    const __toStr = (v) => (v == null ? "" : String(v));
    const __lower = (v) => __toStr(v).trim().toLowerCase();
    const __containsAny = (text, regs) => {
      const t = __toStr(text);
      for (const re of regs || []) {
        if (re.test(t)) return true;
      }
      return false;
    };
    const __countHits = (text, regs) => {
      const t = __toStr(text);
      let n = 0;
      for (const re of regs || []) {
        const m = t.match(re);
        if (Array.isArray(m)) n += m.length;
      }
      return n;
    };
    const __hasFlag = (flags, id) => {
      const arr = Array.isArray(flags) ? flags : [];
      const key = __toStr(id);
      return arr.some((f) => {
        if (typeof f === "string") return f === key;
        return __toStr(f?.id) === key;
      });
    };

    const st = (stateCanonical && typeof stateCanonical === "object") ? stateCanonical : (state || {});
    const flags = Array.isArray(structural?.flags) ? structural.flags : [];
    const metrics = (structural?.metrics && typeof structural.metrics === "object")
      ? structural.metrics
      : {};
    const minNumbers = Number.isFinite(Number(metrics?.minNumbersCount)) ? Number(metrics.minNumbersCount) : 1;
    const minImpactVerbs = Number.isFinite(Number(metrics?.minImpactVerbs)) ? Number(metrics.minImpactVerbs) : 2;

    const leadershipLevel = __lower(st?.career?.leadershipLevel || st?.leadershipLevel || state?.career?.leadershipLevel || state?.leadershipLevel);
    const targetLevelText = __toStr(
      st?.levelTarget ||
      st?.targetRoleLevel ||
      st?.roleTargetLevel ||
      st?.career?.targetRole ||
      st?.targetRole ||
      st?.roleTarget ||
      state?.levelTarget ||
      state?.targetRoleLevel ||
      state?.roleTargetLevel ||
      state?.career?.targetRole ||
      state?.targetRole ||
      state?.roleTarget ||
      ""
    );
    const jdRoleText = __toStr(
      st?.jd ||
      state?.jd ||
      ""
    ) + " " + __toStr(
      st?.roleTarget ||
      st?.targetRole ||
      st?.role ||
      state?.roleTarget ||
      state?.targetRole ||
      state?.role ||
      ""
    );

    const condA = leadershipLevel === "manager" || leadershipLevel === "executive";
    const condB = __containsAny(targetLevelText, [/\blead\b/i, /\bmanager\b/i, /\bhead\b/i, /\bdirector\b/i]);
    // [PATCH] condC: JD 전문이 아닌 role 계열 텍스트만 검사 (JD 동사 "lead" 오탐 차단)
    const roleOnlyText = __toStr(
      st?.roleTarget || st?.targetRole || st?.role ||
      state?.roleTarget || state?.targetRole || state?.role || ""
    );
    const condC = __containsAny(roleOnlyText, [/\bpm\b/i, /product\s*manager/i, /project\s*manager/i, /\bowner\b/i, /\blead\b/i]);
    const ownershipExpected = Boolean(condA || condB || condC);
    const executionSignalText = __toStr(st?.jd || state?.jd || "") + " " + __toStr(st?.roleTarget || st?.targetRole || st?.role || state?.roleTarget || state?.targetRole || state?.role || "");
    const executionKwHit = __containsAny(executionSignalText, [
      /\bexecution\b/i,
      /\bimpact\b/i,
      /\bresult\b/i,
      /\bmetric\b/i,
      /\bkpi\b/i,
      /\bperformance\b/i,
      /\bgrowth\b/i,
      /\bimprove\b/i,
      /\boptimi[sz]e\b/i,
      /\bincrease\b/i,
      /\breduce\b/i,
      /\blaunch\b/i,
      /\bdeliver\b/i,
      /\b성과\b/g,
      /\b결과\b/g,
      /\b지표\b/g,
      /\b개선\b/g,
      /\b최적화\b/g,
      /\b증가\b/g,
      /\b감소\b/g,
    ]);
    const roleFamilyText = __toStr(
      st?.roleTarget ||
      st?.targetRole ||
      st?.role ||
      st?.canonical?.role?.target?.value ||
      st?.canonical?.role?.target?.family ||
      state?.roleTarget ||
      state?.targetRole ||
      state?.role ||
      ""
    );
    const executionRoleHit = __containsAny(roleFamilyText, [
      /\bpm\b/i,
      /\bproduct\b/i,
      /\bstrategy\b/i,
      /\bmarketing\b/i,
      /\bgrowth\b/i,
      /\bbizops\b/i,
      /\bbiz\s*ops\b/i,
      /\bdata\b/i,
      /\b기획\b/g,
      /\b마케팅\b/g,
      /\b그로스\b/g,
      /\b데이터\b/g,
    ]);
    const executionMetricHint =
      Number(structural?.metrics?.numbersCount || 0) > 0 ||
      Number(structural?.metrics?.impactVerbCount || 0) > 0 ||
      (Array.isArray(structural?.metrics?.processOnlySignals) && structural.metrics.processOnlySignals.length >= 2);
    const executionExpected = Boolean(executionKwHit || executionRoleHit || executionMetricHint);
    const dominantLane = ownershipExpected ? "ownership" : (executionExpected ? "rigor" : "unknown");

    const resumeText = __toStr(st?.resume || state?.resume || "");
    const leadRegs = [
      /\b(lead|leading|led|owner|ownership|own|manage|managed|mentor)\w*\b/gi,
      /\b(pm|po|tech lead|team lead)\b/gi,
      /\b(주도|리드|총괄|오너십|책임|의사결정|조율|코칭|멘토)\b/g,
    ];
    const leadHits = __countHits(resumeText, leadRegs);

    let leadershipRiskFlag = false;
    try {
      const lr = evaluateLeadershipRisk({
        state: st,
        objective: {
          targetRole: st?.career?.targetRole ?? st?.targetRole ?? st?.roleTarget ?? null,
          companyScaleCurrent: st?.career?.companyScaleCurrent ?? null,
          companyScaleTarget: st?.career?.companyScaleTarget ?? null,
        },
      });
      leadershipRiskFlag = String(lr?.riskLevel || "none").toLowerCase() !== "none";
    } catch {
      leadershipRiskFlag = false;
    }

    const leadershipGapFlag =
      /(?:^|[^a-z])(individual|ic)(?:$|[^a-z])/i.test(leadershipLevel) &&
      __containsAny(targetLevelText, [/\blead\b/i, /\bmanager\b/i, /\bhead\b/i, /\bdirector\b/i]);

    return {
      dominantLane,
      ownershipExpected,
      executionExpected,
      evidence: {
        OWNERSHIP__NO_PROJECT_INITIATION_SIGNAL: __hasFlag(flags, "NO_PROJECT_INITIATION_PATTERN"),
        OWNERSHIP__LOW_OWNERSHIP_VERB_RATIO: __hasFlag(flags, "LOW_OWNERSHIP_VERB_RATIO"),
        OWNERSHIP__NO_DECISION_AUTHORITY_SIGNAL: __hasFlag(flags, "NO_DECISION_AUTHORITY_PATTERN"),
        EXP__LEADERSHIP__MISSING: leadHits === 0,
        leadershipGap: leadershipGapFlag,
        leadershipRisk: leadershipRiskFlag,
        IMPACT__NO_QUANTIFIED_IMPACT: __hasFlag(flags, "NO_QUANTIFIED_IMPACT") || Number(metrics?.numbersCount || 0) < minNumbers,
        IMPACT__LOW_IMPACT_VERBS: __hasFlag(flags, "LOW_IMPACT_VERB_PATTERN") || Number(metrics?.impactVerbCount || 0) < minImpactVerbs,
        IMPACT__PROCESS_ONLY: __hasFlag(flags, "PROCESS_ONLY_PATTERN") || (Array.isArray(structural?.metrics?.processOnlySignals) && structural.metrics.processOnlySignals.length >= 2),
      },
    };
  })();
  // ✅ PATCH (append-only): evaluate education requirement once and bridge to structural.metrics
  const educationRequirement = (() => {
    try {
      return evaluateEducationRequirement({
        state: stateCanonical,
        objective: { jdText: stateCanonical?.jd ?? state?.jd ?? null },
      });
    } catch {
      return {
        requirementType: "none",
        minimumDegree: null,
        evidence: null,
        candidateDegree: null,
        satisfied: null,
        gateFail: false,
      };
    }
  })();
  try {
    if (structural && typeof structural === "object") {
      if (!structural.metrics || typeof structural.metrics !== "object") {
        structural.metrics = {};
      }
      structural.metrics.educationGateFail = Boolean(educationRequirement?.gateFail);
      if (structuralPatternsPack && typeof structuralPatternsPack === "object") {
        structuralPatternsPack.metrics = structural.metrics;
      }

      if (Boolean(educationRequirement?.gateFail)) {
        const flags = Array.isArray(structural.flags) ? structural.flags : [];
        const hasEduFlag = flags.some((f) => {
          if (typeof f === "string") return f === "EDUCATION_GATE_FAIL";
          return String(f?.id || "") === "EDUCATION_GATE_FAIL";
        });
        if (!hasEduFlag) flags.push("EDUCATION_GATE_FAIL");
        structural.flags = flags;
      }
    }
  } catch { }

  // ✅ 신규(append-only, 선택): decision layer(pressure)까지 합산하고 싶을 때
  // - buildDecisionPack이 없는 상태에서도 앱이 죽지 않게 방어
  let decisionPack = null;
  let simulationViewModel = null;

  // ✅ PATCH (append-only): capture decisionPack build error (debug only)
  let __dp_error = null;

  try {
    // 1) build decisionPack (single attempt)
    if (typeof buildDecisionPack === "function") {
      // [PATCH][P1-1] resolve careerSignals for decisionPack (append-only, crash-safe)
      const __cs_for_decision =
        (typeof careerSignals !== "undefined" &&
          careerSignals &&
          typeof careerSignals === "object")
          ? careerSignals
          : (typeof analysis !== "undefined" &&
            analysis &&
            typeof analysis === "object" &&
            analysis.careerSignals &&
            typeof analysis.careerSignals === "object")
            ? analysis.careerSignals
            : (typeof result !== "undefined" &&
              result &&
              typeof result === "object" &&
              result.careerSignals &&
              typeof result.careerSignals === "object")
              ? result.careerSignals
              : (typeof out !== "undefined" &&
                out &&
                typeof out === "object" &&
                out.careerSignals &&
                typeof out.careerSignals === "object")
                ? out.careerSignals
                : null;
      // ✅ PATCH (append-only): 안정적인 ai merge for decisionPack (matchRate drop 방지)
      // - ai가 1-pass/2-pass/DBG_ACTIVE 등 여러 경로로 들어오는 경우를 흡수
      // - semanticMatches.matchRate가 있으면 항상 buildDecisionPack에 전달되게 보장
      const __ai_for_decision = (() => {
        const base = (ai && typeof ai === "object") ? ai : null;

        // state.analysis.ai (App.jsx setAnalysis로 들어온 meta가 보관될 가능성)
        const stAi =
          (state && state.analysis && state.analysis.ai && typeof state.analysis.ai === "object")
            ? state.analysis.ai
            : null;

        // DBG_ACTIVE.ai (런타임 디버그 미러링 경로)
        const dbgAi =
          (typeof globalThis !== "undefined" &&
            globalThis.__DBG_ACTIVE__ &&
            globalThis.__DBG_ACTIVE__.ai &&
            typeof globalThis.__DBG_ACTIVE__.ai === "object")
            ? globalThis.__DBG_ACTIVE__.ai
            : null;

        // shallow merge: base <- stAi <- dbgAi (뒤가 최신일 가능성 높음)
        // - source가 모두 비어도 fallback bridge를 위해 object를 유지
        const merged = { ...(base || {}), ...(stAi || {}), ...(dbgAi || {}) };

        // semanticMatches도 얕게 합쳐서 matchRate를 최대한 살림
        try {
          const smBase = base && base.semanticMatches && typeof base.semanticMatches === "object" ? base.semanticMatches : null;
          const smSt = stAi && stAi.semanticMatches && typeof stAi.semanticMatches === "object" ? stAi.semanticMatches : null;
          const smDbg = dbgAi && dbgAi.semanticMatches && typeof dbgAi.semanticMatches === "object" ? dbgAi.semanticMatches : null;

          if (smBase || smSt || smDbg) {
            merged.semanticMatches = { ...(smBase || {}), ...(smSt || {}), ...(smDbg || {}) };
          }
        } catch { }
        // ✅ PATCH (append-only): analyzer match -> decision semantic bridge (fallback only)
        // - 기존 semanticMatches.matchRate가 유효하면 절대 덮어쓰지 않음
        // - 비어 있을 때만 keywordSignals의 기존 match 정보를 보강
        try {
          const __toMatch01 = (v) => {
            const n = (typeof v === "number") ? v : Number(v);
            if (!Number.isFinite(n)) return null;
            if (n >= 0 && n <= 1.001) return Math.max(0, Math.min(1, n));
            if (n > 1 && n <= 100) return Math.max(0, Math.min(1, n / 100));
            return null;
          };
          const __existing =
            __toMatch01(merged?.semanticMatches?.matchRate) ??
            __toMatch01(merged?.semanticMatches?.jdResume?.avg);
          if (__existing === null) {
            const __fallbackMatch =
              __toMatch01(keywordSignals?.matchScore) ??
              __toMatch01(keywordSignals?.matchRate);
            if (__fallbackMatch !== null) {
              const __sm =
                (merged.semanticMatches && typeof merged.semanticMatches === "object")
                  ? merged.semanticMatches
                  : {};
              merged.semanticMatches = {
                ...__sm,
                matchRate: __fallbackMatch,
              };
            }
          }
        } catch { }

        return merged;
      })();
      decisionPack = buildDecisionPack({
        state: stateCanonical,
        ai: __ai_for_decision,
        structural,
        competencyExpectation,
        evidenceFit,
        // (하위호환) 기존 경로 + (디버그 보험) __DBG_ACTIVE__
        careerSignals: __cs_for_decision,
        roleDistance: objective?.roleDistance || null, // [append-only] Role Ontology v1
      });
    } else {
      decisionPack = null;
    }

    // ✅ PATCH (append-only): Explain Rewrite Layer — 채용담당자 스타일 문장 override
    // 엔진 로직/scoring 무영향. riskResults explain 텍스트만 교체.
    try {
      if (decisionPack && Array.isArray(decisionPack.riskResults)) {
        decisionPack.riskResults = decisionPack.riskResults.map((risk) => {
          if (!risk || !risk.id) return risk;
          return { ...risk, explain: rewriteExplain(risk.id, risk.explain) };
        });
      }
    } catch { }

    // 2) build simulation VM (view-only, safe even when decisionPack is null)
    try {
      const __rr =
        (Array.isArray(decisionPack?.riskResults) && decisionPack.riskResults) || [];
      simulationViewModel =
        typeof buildSimulationViewModel === "function"
          ? buildSimulationViewModel(__rr)
          : null;
    } catch (e) {
      simulationViewModel = null;
    }
    // ✅ PATCH (append-only): JD 기반 동적 추천 v1 (jdSignals/jdGap/recommendations)
    // - 설계 변경 금지 준수: resumeModel 새로 만들지 않음 (merged resume 텍스트 경로 우선, 없으면 state.resume 폴백)
    // - JD 파서는 최소 파서(헤더/불릿/폴백) + 실패해도 analyze 전체는 계속 동작
    // - semanticFn이 없으면 유사도 null로 저장(시스템 안정성 최우선) → jdSignals/jdGap는 생성됨
    try {
      if (decisionPack && typeof decisionPack === "object") {
        const jdText = JD_REC_V1__safeStr(state?.jd || "");
        const resumeMergedText =
          JD_REC_V1__safeStr(
            state?.resumeMergedText ??
            state?.mergedResumeText ??
            ai?.mergedResumeText ??
            ai?.resumeMergedText ??
            state?.resume ??
            ""
          );
        // ✅ P1.5 (append-only): parsedJD/parsedResume local refs (do NOT break baseline when null)
        const __parsedJD =
          (state && typeof state === "object" && state.__parsedJD && typeof state.__parsedJD === "object")
            ? state.__parsedJD
            : null;

        const __parsedResume =
          (state && typeof state === "object" && state.__parsedResume && typeof state.__parsedResume === "object")
            ? state.__parsedResume
            : null;

        // ✅ P1.5 (append-only): parsed keyword pool (conservative)
        let __parsedKeywords = [];
        try {
          if (__parsedJD && typeof __parsedJD === "object") {
            const __raw = [];

            // common buckets (keys confirmed: mustHave/preferred/coreTasks/tools/constraints/domainKeywords/jobTitle)
            if (Array.isArray(__parsedJD.mustHave)) __raw.push(...__parsedJD.mustHave);
            if (Array.isArray(__parsedJD.preferred)) __raw.push(...__parsedJD.preferred);
            if (Array.isArray(__parsedJD.coreTasks)) __raw.push(...__parsedJD.coreTasks);
            if (Array.isArray(__parsedJD.tools)) __raw.push(...__parsedJD.tools);
            if (Array.isArray(__parsedJD.domainKeywords)) __raw.push(...__parsedJD.domainKeywords);

            if (typeof __parsedJD.jobTitle === "string") __raw.push(__parsedJD.jobTitle);

            // optional: constraints can contain useful terms (but keep conservative)
            if (Array.isArray(__parsedJD.constraints)) __raw.push(...__parsedJD.constraints);

            const __seen = new Set();
            const __out = [];

            for (const it of __raw) {
              const s0 = (typeof it === "string" ? it : (it && typeof it === "object" ? (it.text || it.title || it.label || "") : ""));
              const s1 = (typeof s0 === "string" ? s0 : "").trim();
              if (!s1) continue;

              // split into chunks conservatively
              const parts = s1
                .split(/[\n\r,;|/·•\u2022\u00B7]+/g)
                .map((x) => x.trim())
                .filter(Boolean);

              for (const p of parts) {
                const n = JD_REC_V1__normLine(p);
                if (!n) continue;
                // avoid ultra-short noise
                if (n.length < 2) continue;
                if (__seen.has(n)) continue;
                __seen.add(n);
                __out.push(n);
              }
            }

            // cap to avoid heavy sort work
            __parsedKeywords = __out.slice(0, 60);
          }
        } catch {
          __parsedKeywords = [];
        }

        if (jdText.trim() && resumeMergedText.trim()) {
          const jdSignals = JD_REC_V1__extractSignals(jdText);
          const selected = JD_REC_V1__selectTopSignals(jdSignals, JD_REC_V1__LIMIT);

          // analyzer.js에는 현재 'matchRate'만 있고, per-line similarity 함수는 아직 노출 경로가 없음
          // -> 있으면 사용 / 없으면 null로 안전하게 저장
          const semanticFn =
            (typeof ai?.semanticSimilarity === "function" ? ai.semanticSimilarity : null) ??
            (typeof ai?.semanticMatches?.similarity === "function" ? ai.semanticMatches.similarity : null) ??
            null;

          const gap = JD_REC_V1__computeGap({
            selectedSignals: selected,
            resumeText: resumeMergedText,
            semanticFn,
          });
          // ✅ v3.x (append-only): gate-priority sort for jdGap items (ordering only)
          try {
            const __items0 = Array.isArray(gap?.items) ? gap.items : [];
            const __items1 = __items0.map((it) => {
              const txt = it?.text || it?.signalText || it?.raw || "";
              const gb = JD_REC_V1__gateBoostForLine(txt);
              return { ...it, _gateBoost: gb };
            });

            __items1.sort((a, b) => {
              // band 우선(gap > weak > met)
              const bandRank = { gap: 0, weak: 1, met: 2 };
              const bd = (bandRank[a?.band] ?? 9) - (bandRank[b?.band] ?? 9);
              if (bd !== 0) return bd;

              // gateBoost 우선
              const gd = (Number(b?._gateBoost || 0)) - (Number(a?._gateBoost || 0));
              if (gd !== 0) return gd;

              // similarity 낮은 순(더 부족한 것 먼저)
              const sa = Number.isFinite(a?.similarity) ? a.similarity : 1;
              const sb = Number.isFinite(b?.similarity) ? b.similarity : 1;
              if (sa !== sb) return sa - sb;

              return 0;
            });

            gap.items = __items1;

            // debug append-only
            gap.debug = gap.debug && typeof gap.debug === "object" ? gap.debug : {};
            gap.debug.usedGateHeuristic = true;
            gap.debug.gateHitCount = __items1.filter((x) => Number(x?._gateBoost || 0) > 0).length;
          } catch { }
          // ✅ P1.5 (append-only): jdGap items reorder/filter using parsedJD keywords (ONLY when parsed exists)
          let __gapItemsFinal = gap.items;
          try {
            if (__parsedKeywords && __parsedKeywords.length && Array.isArray(gap?.items)) {
              const __noiseHeadRe = /^\s*(\[[^\]]+\]|\(?\s*(자격요건|우대사항|필수요건|요구사항|responsibilities|requirements|qualification|qualifications|preferred|must|nice to have|about)\s*\)?\s*)$/i;

              // 1) very conservative noise removal (ONLY when parsed is present)
              const __filtered = [];
              for (const gi of gap.items) {
                const t0 = (gi && (gi.text || gi.signalText || gi.raw)) ? String(gi.text || gi.signalText || gi.raw) : "";
                const t1 = t0.trim();
                const tn = JD_REC_V1__normLine(t1);

                // drop super-short pure headers like "[Requirements]" or "우대사항"
                if (t1 && t1.length <= 40 && __noiseHeadRe.test(t1)) continue;
                if (tn && tn.length <= 20 && __noiseHeadRe.test(tn)) continue;

                __filtered.push(gi);
              }

              // 2) parsed hit scoring + stable sort (ONLY reorder)
              const __scored = __filtered.map((gi, idx) => {
                const t0 = (gi && (gi.text || gi.signalText || gi.raw)) ? String(gi.text || gi.signalText || gi.raw) : "";
                const tn = JD_REC_V1__normLine(t0);

                let hit = 0;
                if (tn) {
                  for (const kw of __parsedKeywords) {
                    if (!kw) continue;
                    // simple contains; keep conservative
                    if (tn.includes(kw)) hit++;
                    if (hit >= 3) break; // cap
                  }
                }

                return { gi, idx, hit };
              });

              __scored.sort((a, b) => {
                // higher hit first
                const d1 = (b.hit || 0) - (a.hit || 0);
                if (d1 !== 0) return d1;
                // stable: keep original order
                return (a.idx || 0) - (b.idx || 0);
              });

              __gapItemsFinal = __scored.map((x) => x.gi);

              // mark debug (append-only)
              try {
                gap.debug = (gap.debug && typeof gap.debug === "object") ? gap.debug : {};
                gap.debug.usedParsedJD = true;
                gap.debug.parsedKeywordCount = Number(__parsedKeywords.length || 0) || 0;
              } catch { }
            }
          } catch {
            __gapItemsFinal = gap.items;
          }

          // append-only 저장
          if (!decisionPack.jdSignals) {
            decisionPack.jdSignals = jdSignals;
          }
          if (!decisionPack.jdGap) {
            decisionPack.jdGap = {
              version: 1,
              resumeTextSource: "merged_resume_text",
              limit: JD_REC_V1__LIMIT,
              threshold: { met: 0.75, weak: 0.5 },
              items: __gapItemsFinal,
              stats: gap.stats,
              debug: gap.debug,
            };
          }

          // recommendations도 append-only (최대 5개, reason 포함)
          if (!decisionPack.recommendations) {
            decisionPack.recommendations = JD_REC_V1__generateRecommendations({
              decisionPack,
              jdSignals: decisionPack.jdSignals,
              jdGap: decisionPack.jdGap,
            });
          }
          // ✅ NEW (append-only): actionCatalog-based recommendations (v1)
          // ✅ P1.5 (append-only): recommendations reorder using parsedJD keywords (ONLY reorder, no field changes)
          try {
            if (__parsedKeywords && __parsedKeywords.length && decisionPack?.recommendations && typeof decisionPack.recommendations === "object") {
              const __r = decisionPack.recommendations;
              const __items = Array.isArray(__r.items) ? __r.items : null;
              if (__items && __items.length) {
                const __sc = __items.map((ri, idx) => {
                  const s0 =
                    (ri && (ri.signalText || ri.jdText || ri.title)) ? String(ri.signalText || ri.jdText || ri.title) : "";
                  const sn = JD_REC_V1__normLine(s0);

                  let hit = 0;
                  if (sn) {
                    for (const kw of __parsedKeywords) {
                      if (!kw) continue;
                      if (sn.includes(kw)) hit++;
                      if (hit >= 3) break;
                    }
                  }
                  return { ri, idx, hit };
                });

                __sc.sort((a, b) => {
                  const d1 = (b.hit || 0) - (a.hit || 0);
                  if (d1 !== 0) return d1;
                  return (a.idx || 0) - (b.idx || 0);
                });

                __r.items = __sc.map((x) => x.ri);

                // debug flag (append-only)
                __r.debug = (__r.debug && typeof __r.debug === "object") ? __r.debug : {};
                __r.debug.usedParsedJD = true;
                __r.debug.parsedKeywordCount = Number(__parsedKeywords.length || 0) || 0;
              }
            }
          } catch { }
          // - 기존 JD_REC_V1__generateRecommendations 결과는 유지
          // - actionCatalog 결과는 decisionPack.recommendations.actionCatalogV1 로 추가 저장
          try {
            if (decisionPack && typeof decisionPack === "object") {
              const __riskCodes =
                Array.isArray(decisionPack?.riskResults)
                  ? decisionPack.riskResults
                    .map((r) => r?.id || r?.code || r?.riskId || r?.key || null)
                    .filter(Boolean)
                  : [];

              const __jdText = typeof jdText === "string" ? jdText : "";
              const __resumeText = typeof resumeMergedText === "string" ? resumeMergedText : "";

              // ✅ flags (가벼운 휴리스틱; append-only, 실패해도 무관)
              const __flags = [];
              try {
                const __numCnt = (__resumeText.match(/\d/g) || []).length;
                if (__numCnt < 6) __flags.push("HAS_LOW_NUMERIC_DENSITY");
              } catch { }
              try {
                if (!/https?:\/\/|www\./i.test(__resumeText)) __flags.push("HAS_NO_EVIDENCE_LINKS");
              } catch { }
              try {
                const __helpCnt = (__resumeText.match(/지원|보조|참여/gi) || []).length;
                const __meCnt = (__resumeText.match(/제가|나는|저는/gi) || []).length;
                if (__helpCnt >= 3 && __meCnt === 0) __flags.push("HAS_LOW_SUBJECT_CLARITY");
              } catch { }
              try {
                if (/전사|총괄|전부|완전/gi.test(__resumeText)) __flags.push("HAS_SCOPE_OVERCLAIM_SIGNALS");
              } catch { }

              const __gapItems = Array.isArray(decisionPack?.jdGap?.items) ? decisionPack.jdGap.items : [];
              const __candPool = [];

              // 너무 무거워지지 않게 상위 일부만 사용
              const __seedItems = __gapItems.slice(0, 12);

              for (const gi of __seedItems) {
                const __ctx = {
                  jdGapItem: {
                    type: gi?.type || gi?.bucket || gi?.group || gi?.kind || null,
                    text: gi?.text || gi?.signalText || gi?.raw || "",
                    similarity: gi?.similarity ?? gi?.sim ?? null,
                    strength: gi?.strength || null,
                  },
                  riskCodes: __riskCodes,
                  flags: __flags,
                  rawText: (__jdText || "") + "\n" + (__resumeText || ""),
                };

                const __cands = deriveActionCandidates(__ctx);
                if (Array.isArray(__cands) && __cands.length) __candPool.push(...__cands);
              }

              const __picked = selectTopActions(__candPool, { n: 3, minAxes: 2, maxEffortL: 1 });

              // append-only attach
              decisionPack.recommendations = decisionPack.recommendations || {};
              // ✅ NEW (append-only): personalized "because/targetSnippet" helpers
              const __fmtSim = (v) => {
                const n = Number(v);
                return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
              };

              const __pickGapTarget = (actionType) => {
                try {
                  const list = Array.isArray(__gapItems) ? __gapItems : [];
                  const pick = (pred) => list.find((gi) => { try { return !!pred(gi); } catch { return false; } });

                  if (actionType === "tool_exposure") {
                    const gi =
                      pick((g) => g?.type === "tools") ||
                      pick((g) => /SAP|ERP|SRM|MRO/i.test(String(g?.text || g?.signalText || ""))) ||
                      null;
                    if (gi) return gi;
                  }

                  if (actionType === "gate_mitigation") {
                    // gate는 gap item보다 risk code가 핵심이라 target은 비워도 됨
                    return null;
                  }

                  if (actionType === "quantify_impact") {
                    // 정량화는 "성과/절감/개선" 텍스트가 있는 갭을 우선
                    const gi =
                      pick((g) => /성과|절감|개선|증대|리드타임|불량/i.test(String(g?.text || g?.signalText || ""))) ||
                      list[0] ||
                      null;
                    if (gi) return gi;
                  }

                  // default: 첫 갭 하나
                  return list[0] || null;
                } catch {
                  return null;
                }
              };

              const __becauseFor = (actionType) => {
                try {
                  const flags = Array.isArray(__flags) ? __flags : [];
                  const riskCodes = Array.isArray(__riskCodes) ? __riskCodes : [];

                  if (actionType === "quantify_impact") {
                    if (flags.includes("HAS_LOW_NUMERIC_DENSITY")) return "근거: 이력서에 숫자/수치 근거가 적습니다.";
                    return "근거: 성과가 정량 기준으로 해석되기 어렵습니다.";
                  }

                  if (actionType === "gate_mitigation") {
                    const gate = riskCodes.find((c) => String(c || "").startsWith("GATE__")) || null;
                    if (gate) return `근거: Top3에서 게이트 신호(${gate})가 감지되었습니다.`;
                    return "근거: 게이트/조건 리스크 완화 문장이 필요합니다.";
                  }

                  if (actionType === "tool_exposure") {
                    const t = __pickGapTarget("tool_exposure");
                    const sim = __fmtSim(t?.similarity ?? t?.sim);

                    // ✅ thresholded wording (avoid contradiction)
                    if (t && sim !== null) {
                      if (sim < 0.60) {
                        return `근거: JD 툴 요구 대비 유사도가 낮습니다(유사도 ${sim}).`;
                      }
                      if (sim < 0.75) {
                        return `근거: 유사도는 중간 수준입니다(유사도 ${sim}). ‘업무 흐름/산출물’ 증빙을 붙이면 판단이 바뀔 수 있습니다.`;
                      }
                      return `근거: 유사도는 높습니다(유사도 ${sim}). 다만 ‘써봤다’가 아니라 ‘업무 흐름에서 쓴 증거(화면/리포트)’가 필요합니다.`;
                    }

                    return "근거: JD 툴 요구 대비 ‘업무 흐름/산출물’ 증빙이 약합니다.";
                  }

                  return "근거: JD/리스크 흐름과 연결된 우선 보완 항목입니다.";
                } catch {
                  return "";
                }
              };

              const __targetSnippetFor = (actionType) => {
                const t = __pickGapTarget(actionType);
                if (!t) return "";
                const txt = String(t?.text || t?.signalText || "").trim();
                const sim = __fmtSim(t?.similarity ?? t?.sim);
                if (!txt) return "";
                if (sim !== null) return `대상: ${txt} (유사도 ${sim})`;
                return `대상: ${txt}`;
              };
              // ==============================
              // ✅ PATCH (append-only): rewritePreview (1-line actionable preview)
              // - No fake numbers: only use detected numeric tokens from resume text
              // - UI can render: item.rewritePreview?.line
              // ==============================
              const __detectMetricToken = (s) => {
                try {
                  const t = String(s || "");
                  if (!t) return null;

                  // Try range first: "10~15%", "10-15%", "10 ~ 15 %"
                  const mRange =
                    t.match(/(\d+(?:\.\d+)?)\s*(?:~|-)\s*(\d+(?:\.\d+)?)\s*(%|퍼센트|원|만원|천원|억|건|회|시간|일|주|개월|년)?/);
                  if (mRange) {
                    const unit = mRange[3] ? String(mRange[3]) : "";
                    // 🚫 date-range guard: treat "2021.12~2022.06" 같은 기간 표기는 metric으로 보지 않음
                    try {
                      const a = String(mRange[1] || "");
                      const b = String(mRange[2] || "");
                      const unitRaw = mRange[3] ? String(mRange[3]) : "";

                      // 단위가 없고, 값이 YYYYMM / YYYY.MM / YYYY-MM처럼 보이면 기간으로 간주
                      const looksLikeYm = (v) => {
                        const x = String(v || "").trim();
                        if (!x) return false;
                        if (/^\d{4}[.\-]?\d{1,2}$/.test(x)) return true; // 2021.12 / 2021-12 / 202112
                        return false;
                      };

                      if (!unitRaw && looksLikeYm(a) && looksLikeYm(b)) return null;
                    } catch { }
                    return `${mRange[1]}~${mRange[2]}${unit ? unit : ""}`.trim();
                  }

                  // Then single token: "12%", "3억", "5건", "40시간"
                  const mOne =
                    t.match(/(\d+(?:\.\d+)?)\s*(%|퍼센트|원|만원|천원|억|건|회|시간|일|주|개월|년)\b/);
                  if (mOne) return `${mOne[1]}${mOne[2]}`.trim();

                  // Finally any number (lowest quality)
                  const mNum = t.match(/(\d+(?:\.\d+)?)/);
                  if (mNum) return `${mNum[1]}`.trim();

                  return null;
                } catch {
                  return null;
                }
              };

              const __targetTextFor = (actionType) => {
                try {
                  const t = __pickGapTarget(actionType);
                  const txt = String(t?.text || t?.signalText || "").trim();
                  return txt || "";
                } catch {
                  return "";
                }
              };

              const __rewritePreviewFor = (actionType) => {
                try {
                  const flags = Array.isArray(__flags) ? __flags : [];
                  const riskCodes = Array.isArray(__riskCodes) ? __riskCodes : [];

                  const targetTxt = __targetTextFor(actionType);
                  const metric = __detectMetricToken(__resumeText);
                  const hasLowNumeric = flags.includes("HAS_LOW_NUMERIC_DENSITY");

                  // default wrapper
                  const mk = (line, templateId, confidence, placeholders, safetyNotes) => ({
                    line: String(line || "").trim(),
                    templateId: String(templateId || "GEN_V1"),
                    confidence: confidence || "B",
                    placeholders: placeholders && typeof placeholders === "object" ? placeholders : {},
                    safetyNotes: Array.isArray(safetyNotes) ? safetyNotes : [],
                  });

                  if (actionType === "quantify_impact") {
                    const baseTarget = targetTxt ? `(${targetTxt}) ` : "";
                    if (hasLowNumeric || !metric) {
                      return mk(
                        `${baseTarget}기간·측정단위·기준선(전/후)을 1줄에 묶어 성과를 ‘정량 근거’로 설명했습니다.`,
                        "QI_V1_STRUCT",
                        "A",
                        { target: targetTxt || "", metricHint: "기간/단위/기준선" },
                        ["NO_FAKE_NUMBERS"]
                      );
                    }
                    return mk(
                      `${baseTarget}성과를 ${metric}로 정량 제시했고, 기간/표본/기준선으로 근거를 함께 남겼습니다.`,
                      "QI_V1_METRIC",
                      "B",
                      { target: targetTxt || "", metric: metric },
                      ["NO_FAKE_NUMBERS"]
                    );
                  }

                  if (actionType === "tool_exposure") {
                    const tool = targetTxt || "핵심 툴";
                    // keep it evidence-oriented, not claiming mastery
                    return mk(
                      `${tool}을(를) 업무 흐름(입력→처리→산출물) 안에서 사용했고, 화면/리포트 등 증빙을 남겼습니다.`,
                      "TOOL_V1_FLOW",
                      "B",
                      { target: tool },
                      ["NO_FAKE_NUMBERS"]
                    );
                  }

                  if (actionType === "gate_mitigation") {
                    const gate = riskCodes.find((c) => String(c || "").startsWith("GATE__")) || null;
                    const g = gate ? `(${gate}) ` : "";
                    return mk(
                      `조건/게이트 리스크${g ? g + "를" : "를"} 먼저 해소하는 1문장을 상단에 추가해, ‘컷’ 판단을 늦췄습니다.`,
                      "GATE_V1",
                      "B",
                      { gate: gate || "" },
                      ["NO_FAKE_NUMBERS"]
                    );
                  }

                  // generic fallback
                  const t = targetTxt ? `(${targetTxt}) ` : "";
                  return mk(
                    `${t}JD 요구와 직접 연결되는 1문장을 먼저 고쳐, 해석이 ‘증거 있음’ 쪽으로 바뀌게 만들었습니다.`,
                    "GEN_V1",
                    "C",
                    { target: targetTxt || "" },
                    ["NO_FAKE_NUMBERS"]
                  );
                } catch {
                  return {
                    line: "",
                    templateId: "GEN_V1",
                    confidence: "C",
                    placeholders: {},
                    safetyNotes: ["NO_FAKE_NUMBERS"],
                  };
                }
              };

              decisionPack.recommendations.actionCatalogV1 = {
                items: (__picked?.items || []).map((x) => ({
                  actionType: x.id,
                  title: x.label,
                  score: x.score,
                  category: x.category,
                  effort: x.effort,
                  roi: x.roi,
                  why: x.templates?.why || "",
                  how: x.templates?.how || [],
                  evidenceChecklist: x.templates?.evidenceChecklist || [],
                  // ✅ NEW: personalization crumbs (1~2 lines)
                  because: __becauseFor(x.id),
                  targetSnippet: __targetSnippetFor(x.id),
                  rewritePreview: __rewritePreviewFor(x.id),
                })),
                meta: __picked?.meta || null,
              };
            }
          } catch {
            // noop (운영 안정성 우선)
          }
        }
      }
    } catch {
      // noop: 운영 안정성(실패해도 analyze 전체는 계속 동작)
    }
  } catch (e) {
    // ✅ store error instead of swallowing (keep analyze alive)
    try {
      const msg = String(e?.message || e || "unknown_decisionPack_error");
      const st = e?.stack ? String(e.stack) : "";
      __dp_error = st ? (msg + "\n" + st) : msg;
    } catch {
      __dp_error = "unknown_decisionPack_error";
    }
    decisionPack = null;
    simulationViewModel = null;
  }
  const hireability = buildHireabilityLayer({
    ai,
    structureAnalysis: structurePack.structureAnalysis,
    resumeSignals,
  });

  // ------------------------------
  // riskLayer (append-only)
  // - 운영 안정성: 실패해도 전체 analyze는 계속 동작
  // ------------------------------
  const riskLayer = {
    documentRisk: buildDocumentRiskLayer({
      state,
      ai,
      keywordSignals,
      objective,
      keywordMatchV2: state?.keywordMatchV2 ?? ai?.keywordMatchV2 ?? null,
    }),
    interviewRisk: buildInterviewRiskLayer({
      hireability,
    }),
  };

  // ------------------------------
  // decisionPressureLayer (append-only)
  // - 운영 안정성: 실패해도 전체 analyze는 계속 동작
  // ------------------------------
  let decisionPressure = null;
  try {
    decisionPressure = buildDecisionPressure({
      state,
      keywordSignals,
      careerSignals,
      resumeSignals,
      structureAnalysis: structurePack.structureAnalysis,
      objective,
    });
  } catch {
    decisionPressure = null;
  }
  // [PATCH] gate -> decisionPressure ceiling/penalty (append-only)
  // - decisionPack이 존재할 때만 적용
  decisionPressure = __applyGatePenaltyToDecisionPressure(decisionPressure, decisionPack);
  // ------------------------------
  // hiddenRisk (append-only)
  // - 운영 안정성: 실패해도 전체 analyze는 계속 동작
  // ------------------------------
  let hiddenRisk = null;
  try {
    hiddenRisk = computeHiddenRisk({
      state,
      structureAnalysis: structurePack.structureAnalysis,
      hireability,
      majorSignals,
      hypotheses,
    });
  } catch {
    hiddenRisk = null;
  }
  // ✅ PATCH (append-only): ensure decisionPack.hiddenRisk is attached (order-safe, works with frozen/sealed packs)
  // - view-only: no scoring impact
  try {
    if (decisionPack && typeof decisionPack === "object") {
      const __needAttach =
        typeof decisionPack.hiddenRisk === "undefined" || decisionPack.hiddenRisk === null;

      if (__needAttach) {
        // 1) try direct attach
        try {
          decisionPack.hiddenRisk = hiddenRisk || null;
        } catch { }

        // 2) if still missing (silent failure / non-extensible), clone & reassign
        try {
          if (typeof decisionPack.hiddenRisk === "undefined" || decisionPack.hiddenRisk === null) {
            decisionPack = { ...decisionPack, hiddenRisk: hiddenRisk || null };
          }
        } catch { }
      }
    }
  } catch { }
  // ✅ UI 호환/반영 보장: report는 "문자열"로 고정 유지 (copy/download 안정)
  const reportText = typeof report === "string" ? report : String(report ?? "");
  let leadershipGap = null;
  try {
    leadershipGap = buildLeadershipGapSignals({
      jdText: state?.jd || "",
      resumeText: state?.resume || "",
    });
  } catch {
    leadershipGap = null;
  }

  // 폴백: undefined면 구조 깨지지 않게 고정
  if (typeof leadershipGap === "undefined") leadershipGap = null;
  // ✅ PATCH: attach input snapshot to reportPack (append-only, safe)
  // - reportPack.input이 없어서 selfCheck가 누락되는 문제 보완
  // - 점수/게이트/리스크 구조에는 영향 없음 (순수 보관용)
  const __rpStateCandidate =
    (typeof input !== "undefined" && input && typeof input === "object" && input.state) ? input.state :
      (typeof state !== "undefined" && state && typeof state === "object") ? state :
        (objective && typeof objective === "object" && objective.state) ? objective.state :
          {};

  const __rpSelfCheckCandidate =
    (__rpStateCandidate && typeof __rpStateCandidate === "object") ? __rpStateCandidate.selfCheck : undefined;

  // ------------------------------
  // simulationViewModel (append-only) - final compute with fallbacks
  // - decisionPack이 null이어도 riskLayer 기반으로 Top3를 만들 수 있게
  // - score/gate/riskProfiles 무영향 (표시용 VM only)
  // ------------------------------
  try {
    const __rrForSimVM =
      (Array.isArray(decisionPack?.riskResults) && decisionPack.riskResults) ||
      (Array.isArray(riskLayer?.riskResults) && riskLayer.riskResults) ||
      (Array.isArray(riskLayer?.results) && riskLayer.results) ||
      (Array.isArray(riskLayer?.risks) && riskLayer.risks) ||
      [];
    simulationViewModel =
      typeof buildSimulationViewModel === "function"
        ? buildSimulationViewModel(__rrForSimVM)
        : simulationViewModel;
  } catch (e) {
    // keep previous simulationViewModel as-is
  }
  // ✅ 객체 결과들은 reportPack으로 분리(문자열 report 유지)
  // ------------------------------
  // simulationViewModel (append-only) - final compute with drivers fallback
  // - decisionPack이 없거나 riskResults가 비면 riskLayer.*.drivers로 Top3 생성 (표시용 only)
  // - score/gate/riskProfiles/engine 무영향
  // ------------------------------
  try {
    const __rrFromDecision =
      Array.isArray(decisionPack?.riskResults) && decisionPack.riskResults.length > 0
        ? decisionPack.riskResults
        : null;

    const __docDriversRaw = riskLayer?.documentRisk?.drivers;
    const __intDriversRaw = riskLayer?.interviewRisk?.drivers;

    const __docDrivers = Array.isArray(__docDriversRaw) ? __docDriversRaw : [];
    const __intDrivers = Array.isArray(__intDriversRaw) ? __intDriversRaw : [];

    const __driversAll = __docDrivers.concat(__intDrivers);

    const __rrFromDrivers =
      __driversAll.length > 0
        ? __driversAll.map((t, idx) => {
          const isDoc = idx < __docDrivers.length;
          const layer = isDoc ? "document" : "interview";
          const priority = 60 - idx; // view-only heuristic
          const id = `DRIVER__${layer.toUpperCase()}__${idx}`;
          return {
            id,
            layer,
            priority,
            group: "DRIVER",
            title: String(t || ""),
            message: String(t || ""),
            raw: { id, layer, priority, group: "DRIVER" },
          };
        })
        : [];

    const __rrForSimVM = __rrFromDecision || __rrFromDrivers;

    simulationViewModel =
      typeof buildSimulationViewModel === "function"
        ? buildSimulationViewModel(__rrForSimVM)
        : simulationViewModel;
  } catch (e) {
    // keep previous simulationViewModel as-is
  }
  // ✅ PATCH (append-only): hrViewModel for report UI (riskFeed aware)
  let hrViewModel = null;
  try {
    hrViewModel =
      typeof buildHrViewModel === "function"
        ? buildHrViewModel(decisionPack || null)
        : null;
  } catch {
    hrViewModel = null;
  }
  // ✅ PATCH (append-only): riskLayer array fallbacks for "Analyzer issues" UI
  // - 일부 UI는 reportPack.riskLayer.riskResults/results/risks 배열을 참조
  // - 현재 riskLayer가 { documentRisk, interviewRisk }만 가지고 있어 이슈 섹션이 비는 문제 방지
  // - 엔진/score/pressure 무영향 (표시용 데이터만 주입)
  const __riskLayerForUI = (function () {
    try {
      const rl = (riskLayer && typeof riskLayer === "object") ? riskLayer : {};

      const __dp = (decisionPack && typeof decisionPack === "object") ? decisionPack : {};
      const __feed = Array.isArray(__dp?.riskFeed) ? __dp.riskFeed : null;
      const __rr = Array.isArray(__dp?.riskResults) ? __dp.riskResults : null;

      const __baseList = (__feed && __feed.length) ? __feed : (__rr && __rr.length ? __rr : []);

      // 이미 배열이 있으면 존중, 없으면 baseList로 채움
      const riskResultsArr = Array.isArray(rl?.riskResults) ? rl.riskResults : __baseList;
      const resultsArr = Array.isArray(rl?.results) ? rl.results : riskResultsArr;
      const risksArr = Array.isArray(rl?.risks) ? rl.risks : riskResultsArr;

      return {
        ...rl,
        riskResults: riskResultsArr,
        results: resultsArr,
        risks: risksArr,
      };
    } catch {
      return riskLayer;
    }
  })();
  const reportPack = {
    input: {
      state: __rpStateCandidate,
      selfCheck: __rpSelfCheckCandidate,
    },
    objective,
    riskLayer: __riskLayerForUI,
    decisionPressure,
    gatePenalty: decisionPressure?.gatePenalty ?? null,
    hiddenRisk,
    hireability,
    structureAnalysis: structurePack.structureAnalysis,
    structureSummaryForAI: structurePack.structureSummaryForAI,
    structural,
    structuralPatterns: structuralPatternsPack,
    decisionPack,
    evidenceFit,
    hrViewModel,
    simulationViewModel,

    internalSignals: {
      leadershipGap,
      latent: {
        companySizeFitScore:
          (structurePack?.structureAnalysis && typeof structurePack.structureAnalysis === "object")
            ? (structurePack.structureAnalysis.companySizeFitScore ?? null)
            : null,
      },
    },
  };
  // [PATCH] debug snapshot for console inspection (append-only)
  // (원하면 유지) 디버그
  // console.log("decisionPack:", decisionPack);
  // [PATCH] debug snapshot for console inspection (append-only)
  try {
    if (typeof window !== "undefined") {
      window.__LAST_PACK__ = {
        decisionPack,
        evidenceFit,
        reportPack,
        decisionPressure,
        educationRequirement,
        leadershipRisk: (() => {
          try {
            return evaluateLeadershipRisk({
              state,
              objective: {
                targetRole: state?.career?.targetRole ?? null,
                companyScaleCurrent: state?.career?.companyScaleCurrent ?? null,
                companyScaleTarget: state?.career?.companyScaleTarget ?? null,
              },
            });
          } catch {
            return { riskLevel: "none", type: null, scaleDirection: "similar" };
          }
        })(),
        // TMP_DEBUG: remove after confirm
        riskLayer: __riskLayerForUI,
        docRisk: riskLayer?.documentRisk || null,
        interviewRisk: riskLayer?.interviewRisk || null,
      };
    }
  } catch { }
  // ✅ 최종 출력(단일 return로 정리: 이후 코드가 죽지 않게)
  // ------------------------------
  // [PATCH] expose last analysis pack for UI/debug (append-only)
  // - 브라우저 콘솔에서 window.__LAST_PACK__로 확인 가능
  // - Worker/SSR 환경에서는 안전하게 무시
  // ------------------------------
  try {
    const __g = typeof globalThis !== "undefined" ? globalThis : null;
    if (__g) {
      __g.__LAST_PACK__ = {
        ts: Date.now(),
        objective,
        reportPack,
        decisionPack,
        evidenceFit,
        decisionPressure,
        educationRequirement,
        leadershipRisk: (() => {
          try {
            return evaluateLeadershipRisk({
              state,
              objective: {
                targetRole: state?.career?.targetRole ?? null,
                companyScaleCurrent: state?.career?.companyScaleCurrent ?? null,
                companyScaleTarget: state?.career?.companyScaleTarget ?? null,
              },
            });
          } catch {
            return { riskLevel: "none", type: null, scaleDirection: "similar" };
          }
        })(),
        riskLayer: __riskLayerForUI,
        hireability,
        hiddenRisk,
        structural,
        structuralPatterns: structuralPatternsPack,
      };
    }
  } catch { }
  // ------------------------------
  // [DBG] analyze exit marker (append-only)
  // ------------------------------
  try {
    const __g = typeof globalThis !== "undefined" ? globalThis : null;
    if (__g) __g.__ANALYZE_EXITED__ = Number(__g.__ANALYZE_EXITED__ || 0) + 1;
  } catch { }
  // ------------------------------
  // [PATCH] unify gatePenalty path (append-only)
  // - goal: decisionPack.decisionPressure.gatePenalty always exists when gatePenalty exists
  // - do NOT change scoring logic; inject a copy only for UI path stability
  // ------------------------------
  try {
    const __gp =
      (decisionPressure && decisionPressure.gatePenalty) ||
      (reportPack && reportPack.gatePenalty) ||
      null;

    if (decisionPack && __gp) {
      if (!decisionPack.decisionPressure || typeof decisionPack.decisionPressure !== "object") {
        decisionPack.decisionPressure = {};
      }
      if (!decisionPack.decisionPressure.gatePenalty) {
        decisionPack.decisionPressure.gatePenalty = __gp;
      }
    }
  } catch { }

  // ✅ PATCH (append-only): ensure decisionPack.hiddenRisk is synced (order-safe)
  try {
    if (decisionPack && typeof decisionPack === "object") {
      if (typeof decisionPack.hiddenRisk === "undefined" || decisionPack.hiddenRisk === null) {
        decisionPack.hiddenRisk = hiddenRisk || null;
      }
    }
  } catch { }

  return {
    objective,
    hypotheses,
    report: reportText, // ✅ 텍스트 리포트는 문자열로 고정
    reportPack, // ✅ 객체들은 여기로

    keywordSignals,
    careerSignals,
    resumeSignals,
    majorSignals,

    structureAnalysis: structurePack.structureAnalysis,
    structureSummaryForAI: structurePack.structureSummaryForAI,

    hireability,
    riskLayer: __riskLayerForUI,
    decisionPressure,
    hiddenRisk,
    evidenceFit,

    // ✅ 요청 핵심: decisionPack 포함
    decisionPack,
    __dp_dbg: {
      hasFn: typeof buildDecisionPack,
      dpType: decisionPack === null ? "null" : typeof decisionPack,
      error: __dp_error || null,

    },
    // ✅ 구조/패턴 포함
    structural,
    structuralPatterns: structuralPatternsPack,

    // ✅ education requirement signal (append-only)
    educationRequirement,

    // ✅ leadership scope mismatch signal (append-only)
    leadershipRisk: (() => {
      try {
        return evaluateLeadershipRisk({
          state,
          objective: {
            targetRole: state?.career?.targetRole ?? null,
            companyScaleCurrent: state?.career?.companyScaleCurrent ?? null,
            companyScaleTarget: state?.career?.companyScaleTarget ?? null,
          },
        });
      } catch { return { riskLevel: "none", type: null, scaleDirection: "similar" }; }
    })(),
  };
}

