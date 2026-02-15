// FINAL PATCHED FILE: src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Check,
  Clipboard,
  Download,
  FileText,
  Lock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ChevronDown,
  User,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

import { SECTION, ORDER, defaultState } from "@/lib/schema";
import { buildHypotheses, buildReport, buildKeywordSignals, buildCareerSignals } from "@/lib/analyzer";
import { usePersistedState } from "@/hooks/usePersistedState";
import HypothesisCard from "@/components/HypothesisCard";
import RadarSelfCheck from "@/components/RadarSelfCheck";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function scoreToLabel(n) {
  if (n <= 2) return "낮음";
  if (n === 3) return "보통";
  return "높음";
}

// ------------------------------
// Self-check UX helpers
// - Rubrics: 점수별 의미(의구심 해소)
// - Checklists: 질문형 체크리스트 -> 자동 점수(1~5)
// ------------------------------
const SELF_CHECK_RUBRICS = {
  coreFit: {
    1: "직무 관련 경험이 거의 없거나, JD 필수요건을 대부분 설명 못 함",
    2: "일부 요건은 닿지만, 핵심 요건에서 빠지는 구멍이 큼",
    3: "필수 요건은 충족하나 우대 사항/실전 경험은 부족함",
    4: "필수+우대 일부까지 충족, 즉시 전력으로 투입 가능",
    5: "JD 요건을 상회하고, 바로 성과를 만들 근거가 명확함",
  },
  proofStrength: {
    1: "성과가 전부 '했다' 수준(수치/전후/기여도/검증이 거의 없음)",
    2: "수치는 조금 있으나 맥락이 약함(왜/어떻게/결과가 흐림)",
    3: "핵심 경험 일부는 전후/기여도/결과가 보이지만 일관되진 않음",
    4: "대부분 경험이 수치+전후+내 기여로 설명되고 검증 가능함",
    5: "핵심 성과 2~3개가 '숫자+맥락+검증'으로 매우 탄탄함",
  },
  roleClarity: {
    1: "나는 뭘 잘하는지/어떤 역할인지 한 문장으로 말하기 어렵다",
    2: "방향은 있으나 직무 정체성이 흐리고 표현이 흔들린다",
    3: "내 역할/강점을 말할 수는 있으나 JD 언어로 연결이 약하다",
    4: "내 강점이 JD 핵심업무와 자연스럽게 이어진다",
    5: "포지셔닝이 아주 선명하고, '이 사람을 뽑아야 할 이유'가 바로 보인다",
  },
  storyConsistency: {
    1: "이직사유-지원사유-경험이 서로 따로 놀고, 질문에 막힌다",
    2: "큰 줄기는 있으나 세부에서 모순/구멍이 자주 보인다",
    3: "기본 논리는 성립하지만, 설득력 있는 '한 줄'이 약하다",
    4: "논리 흐름이 매끄럽고 반례 질문에도 흔들리지 않는다",
    5: "스토리가 간결·설득·검증 가능하고, 면접관이 의심할 지점이 적다",
  },
  riskSignals: {
    1: "공백/짧은 근속/잦은 이직을 설명할 구조가 없고 질문이 두렵다",
    2: "설명은 가능하지만, 사실 검증/일관성/대안이 약하다",
    3: "기본 방어는 가능하나, 꼬리 질문에서 흔들릴 수 있다",
    4: "사실-의도-행동-증거로 방어가 가능하고 리스크가 관리된다",
    5: "리스크가 거의 없거나, 리스크가 있어도 대응 논리가 매우 탄탄하다",
  },
};

const SELF_CHECK_CHECKLISTS = {
  coreFit: [
    "면접관이 '당신은 어떤 문제를 해결하는 사람인가요?'라고 물으면 10초 안에 답할 수 있다",
    "공고(JD)의 '주요 업무'를 보고 첫 출근 날 무엇을 해야 할지 구체적으로 그려진다",
    "내 강점 3가지가 이 회사 JD 핵심 키워드와 1:1로 맞물린다",
    "(경력 전환이면) 이전 직무의 능력이 이 포지션에서 어떻게 돈/성과가 되는지 설득할 수 있다",
  ],
  proofStrength: [
    "대표 성과 1~2개가 숫자(%, 원, 시간 등)로 말할 수 있다",
    "성과에 '내 기여도'가 분명하다(내가 무엇을 했는지 구분 가능)",
    "전후 비교(문제-행동-결과)가 한 문단으로 정리돼 있다",
    "성과를 증명할 자료/링크/산출물이 있다(문서/대시보드/포트폴리오 등)",
  ],
  roleClarity: [
    "내 직무 정체성을 한 문장으로 말할 수 있다(예: 'OO 문제를 OO로 해결하는 사람')",
    "지원 포지션에서 '내가 맡을 역할'이 구체적으로 그려진다",
    "내 강점이 JD 업무 문장 2~3개와 1:1로 연결된다",
    "경력 전환이면 '전이 가능한 능력'을 사례로 설득할 준비가 되어 있다",
  ],
  storyConsistency: [
    "이직 사유가 불만이 아니라 '확장/정렬'로 설명된다",
    "지원 사유가 회사/직무의 구체 요소(업무/제품/팀)와 연결된다",
    "내 경험이 그 지원 사유를 증명하는 순서로 배열되어 있다",
    "꼬리 질문(왜 지금? 왜 우리? 왜 이전 회사는?)에도 논리가 끊기지 않는다",
  ],
  riskSignals: [
    "공백/짧은 근속/잦은 이직 이슈를 '사실-의도-행동-증거'로 설명할 수 있다",
    "조건 제약(연봉/근무지/비자 등)이 있어도 해결책/우선순위가 정리되어 있다",
    "커뮤니케이션에서 과장/모순이 생길 여지가 적다(사실 검증이 가능하다)",
    "레퍼런스/평판에서 문제가 될 만한 포인트가 없다(또는 선제 대응이 준비됐다)",
  ],
};

function StepPill({ active, done, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        "group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition " +
        (active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background hover:bg-muted border-border text-foreground")
      }
    >
      <span
        className={
          "grid h-6 w-6 place-items-center rounded-full border transition " +
          (active
            ? "bg-primary-foreground/10 border-primary-foreground/20"
            : done
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-muted border-border")
        }
      >
        {done ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Icon className={"h-4 w-4 " + (active ? "text-primary-foreground" : "text-muted-foreground")} />
        )}
      </span>
      <span className={"font-medium " + (active ? "" : "text-muted-foreground group-hover:text-foreground")}>
        {label}
      </span>
    </button>
  );
}

function SliderRow({ label, value, onChange, hint, descriptions }) {
  const tone = value <= 2 ? "destructive" : value === 3 ? "secondary" : "default";
  const desc = descriptions ? descriptions[value] : null;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{label}</div>
          {hint ? <div className="text-xs text-muted-foreground mt-0.5">{hint}</div> : null}
        </div>
        <Badge variant={tone} className="shrink-0">
          {value} / 5 · {scoreToLabel(value)}
        </Badge>
      </div>

      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value), 1, 5))}
        className="w-full accent-foreground"
      />

      {desc ? (
        <div className="rounded-xl border bg-muted/30 p-3 text-xs leading-relaxed text-foreground/80">
          <span className="font-medium text-foreground">지금 점수 기준:</span> {desc}
        </div>
      ) : null}
    </div>
  );
}

function ChecklistRow({ label, value, onChange, hint, questions, rubric }) {
  const q = Array.isArray(questions) ? questions : [];
  const size = q.length || 4;

  const [checked, setChecked] = useState(() => {
    const count = clamp(Number(value ?? 1) - 1, 0, size);
    return Array.from({ length: size }, (_, i) => i < count);
  });

  React.useEffect(() => {
    setChecked((prev) => {
      const currentScore = clamp(prev.filter(Boolean).length + 1, 1, 5);
      if (currentScore === value) return prev;

      const desiredCount = clamp(Number(value ?? 1) - 1, 0, size);
      return Array.from({ length: size }, (_, i) => i < desiredCount);
    });
  }, [value, size]);

  const checkedCount = checked.filter(Boolean).length;
  const score = clamp(checkedCount + 1, 1, 5);

  React.useEffect(() => {
    if (score !== value) onChange(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedCount]);

  const tone = score <= 2 ? "destructive" : score === 3 ? "secondary" : "default";
  const desc = rubric ? rubric[score] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{label}</div>
          {hint ? <div className="text-xs text-muted-foreground mt-0.5">{hint}</div> : null}
        </div>
        <Badge variant={tone} className="shrink-0">
          {score} / 5 · {scoreToLabel(score)}
        </Badge>
      </div>

      <div className="space-y-2">
        {q.slice(0, size).map((text, i) => (
          <label
            key={i}
            className="flex items-start gap-2 rounded-xl border bg-muted/20 p-3 cursor-pointer hover:bg-muted/30"
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={Boolean(checked[i])}
              onChange={(e) => {
                const nextVal = e.target.checked;
                setChecked((prev) => {
                  const next = prev.slice();
                  next[i] = nextVal;
                  return next;
                });
              }}
            />
            <span className="text-xs leading-relaxed text-foreground/85">{text}</span>
          </label>
        ))}
      </div>

      {desc ? (
        <div className="rounded-xl border bg-muted/30 p-3 text-xs leading-relaxed text-foreground/80">
          <span className="font-medium text-foreground">현재 판단(면접관 시점):</span> {desc}
        </div>
      ) : null}
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-24 -right-40 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-10">{children}</div>
    </div>
  );
}

/**
 * Deep copy(structuredClone/JSON stringify) 제거
 * - path에 해당하는 "경로만" 얕게 복사하며 불변 업데이트
 * - 데이터가 커져도 타이핑 성능 저하가 훨씬 덜함
 */
function setIn(obj, keys, value) {
  if (keys.length === 0) return obj;
  const [head, ...rest] = keys;

  const isIndex = String(Number(head)) === head;

  if (rest.length === 0) {
    if (Array.isArray(obj)) {
      const nextArr = obj.slice();
      nextArr[isIndex ? Number(head) : head] = value;
      return nextArr;
    }
    return { ...obj, [head]: value };
  }

  const cur = obj?.[head];
  const nextChild = setIn(cur ?? {}, rest, value);

  if (Array.isArray(obj)) {
    const nextArr = obj.slice();
    nextArr[isIndex ? Number(head) : head] = nextChild;
    return nextArr;
  }

  return { ...obj, [head]: nextChild };
}

function buildExpertAdvice(state, analysis) {
  if (!analysis) return [];

  const msgs = [];
  const sc = state?.selfCheck || {};

  const norm5 = (v) => clamp((Number(v ?? 3) - 1) / 4, 0, 1);

  const selfFit = norm5(sc.coreFit);
  const selfRisk = norm5(sc.riskSignals);

  const keywordMatch = Number(analysis.keywordSignals?.matchScore ?? 0);
  const careerRisk = Number(analysis.careerSignals?.careerRiskScore ?? 0);

  const diffFit = selfFit - keywordMatch;
  if (diffFit >= 0.25) {
    msgs.push(
      "본인 평가는 ‘핏이 높다’ 쪽인데, 이력서 텍스트 기준 키워드 매칭은 낮은 편이에요. JD 문장에 맞춰 단어/표현을 먼저 맞추는 게 제일 빠른 개선 포인트예요."
    );
  } else if (diffFit <= -0.25) {
    msgs.push(
      "키워드 매칭은 나쁘지 않은데 본인 평가는 낮게 잡았네요. 스스로 강점을 과소평가했을 수도 있어요. ‘내가 한 일/기여도/결과’만 더 선명하게 정리해 보세요."
    );
  } else {
    msgs.push(
      "자가진단과 객관 지표(키워드 매칭)가 크게 어긋나진 않아요. 이제는 ‘증거 문장(숫자+맥락)’을 더 탄탄하게 만드는 쪽이 효율적입니다."
    );
  }

  const diffRisk = selfRisk - careerRisk;
  if (diffRisk <= -0.25) {
    msgs.push(
      "리스크를 낮게 보고 계신데, 커리어 신호(공백/짧은 근속/이직 빈도) 관점에선 경계 구간이에요. 리스크 설명 문장을 ‘사실-의도-행동-증거’로 고정해두면 방어력이 확 올라갑니다."
    );
  } else if (diffRisk >= 0.25) {
    msgs.push(
      "리스크를 꽤 높게 보고 계신데, 숫자상으로는 ‘치명적’까진 아닐 수 있어요. 과하게 위축되기보다, 질문 예상 5개만 정해서 답변 구조를 고정하는 쪽으로 가봅시다."
    );
  }

  if (analysis.keywordSignals?.hasKnockoutMissing) {
    msgs.unshift(
      "지금 상태에선 ‘필수요건 누락’이 가장 위험해요. 평균점으로 커버가 안 되는 구간이라, 누락 키워드를 ‘경험 문장’에 사실 기반으로 넣거나, 없으면 짧은 결과물(미니 프로젝트)로 증거를 먼저 만들어야 해요."
    );
  }

  return msgs;
}

// ------------------------------
// AI proxy call
// ------------------------------
async function fetchAiEnhance({ jd, resume, signal, ruleContext } = {}) {
  const base = import.meta.env.VITE_AI_PROXY_URL;

  if (!base) return { ok: false, error: "VITE_AI_PROXY_URL is missing (.env 확인 + dev 서버 재시작)" };

  const url = base.replace(/\/$/, "") + "/api/enhance";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  const onAbort = () => controller.abort();

  try {
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener("abort", onAbort, { once: true });
    }

    // ✅ 기존 payload에 ruleContext를 "추가" (없으면 기본값)
    const body = {
      jd: jd || "",
      resume: resume || "",

      ruleRole: ruleContext?.ruleRole ?? "unknown",
      ruleIndustry: ruleContext?.ruleIndustry ?? "unknown",
      roleSignals: Array.isArray(ruleContext?.roleSignals) ? ruleContext.roleSignals : [],
      industrySignals: Array.isArray(ruleContext?.industrySignals) ? ruleContext.industrySignals : [],

      ruleRoleConfidence:
        typeof ruleContext?.ruleRoleConfidence === "number" ? ruleContext.ruleRoleConfidence : null,
      ruleIndustryConfidence:
        typeof ruleContext?.ruleIndustryConfidence === "number" ? ruleContext.ruleIndustryConfidence : null,

      // (선택) 구조 정보도 같이 보낼 수 있게 훅만 열어둠
      structureAnalysis: ruleContext?.structureAnalysis ?? null,
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let data = null;
    try {
      data = await resp.json();
    } catch {
      data = null;
    }

    if (!resp.ok || !data) return { ok: false, error: data?.error || "bad response" };

    return data;
  } catch (e) {
    const msg = String(e || "");
    if (msg.includes("AbortError") || msg.includes("aborted")) return { ok: false, error: "aborted" };
    return { ok: false, error: "fetch_failed", detail: msg };
  } finally {
    clearTimeout(timeout);
    if (signal) {
      try {
        signal.removeEventListener("abort", onAbort);
      } catch {
        // ignore
      }
    }
  }
}

function buildAiCardsData(ai) {
  const summary = typeof ai?.summary === "string" ? ai.summary.trim() : "";
  const advice = Array.isArray(ai?.advice) ? ai.advice.filter(Boolean).map((x) => String(x).trim()).filter(Boolean) : [];

  const jdMustHave = Array.isArray(ai?.jdMustHave)
    ? ai.jdMustHave.filter(Boolean).map((x) => String(x).trim()).filter(Boolean)
    : [];

  const conflicts = Array.isArray(ai?.conflicts) ? ai.conflicts : [];
  const suggestedBullets = Array.isArray(ai?.suggestedBullets) ? ai.suggestedBullets : [];

  const semanticMatches = Array.isArray(ai?.semanticMatches) ? ai.semanticMatches : [];
  const mustHaveObjects = Array.isArray(ai?.mustHaveObjects) ? ai.mustHaveObjects : [];

  const keywordSynonyms = ai?.keywordSynonyms && typeof ai.keywordSynonyms === "object" ? ai.keywordSynonyms : null;
  const confidenceDeltaByHypothesis =
    ai?.confidenceDeltaByHypothesis && typeof ai?.confidenceDeltaByHypothesis === "object"
      ? ai.confidenceDeltaByHypothesis
      : null;

  return {
    summary,
    advice,
    jdMustHave,
    conflicts,
    suggestedBullets,
    semanticMatches,
    mustHaveObjects,
    keywordSynonyms,
    confidenceDeltaByHypothesis,
  };
}

function makeAiCacheKey(jd, resume) {
  const j = (jd ?? "").toString();
  const r = (resume ?? "").toString();
  const jHead = j.slice(0, 160);
  const jTail = j.slice(Math.max(0, j.length - 160));
  const rHead = r.slice(0, 160);
  const rTail = r.slice(Math.max(0, r.length - 160));
  // NOTE: 일부 환경/에디터 설정에서 템플릿 리터럴 파싱 이슈가 날 수 있어 문자열 결합 사용
  return (
    String(j.length) +
    ":" +
    jHead +
    ":" +
    jTail +
    "||" +
    String(r.length) +
    ":" +
    rHead +
    ":" +
    rTail
  );
}

// ------------------------------
// Login gate + sample mode (local only / GitHub Pages safe)
// - 실제 OAuth는 다음 단계: 지금은 "더미 로그인"만.
// - 기존 입력(localStorage/state) 절대 덮어쓰기 금지.
// ------------------------------
const LS_AUTH_KEY = "reject_analyzer_auth_v1";
const LS_PENDING_ACTION_KEY = "reject_analyzer_pending_action_v1";
const LS_SAMPLE_MODE_KEY = "reject_analyzer_sample_mode_v1";

// ✅ 앱 입력 상태 저장 키 (읽기는 1회, 쓰기는 변경 시)
// - "읽어서 setState로 덮어쓰기"를 반복하면 입력이 롤백될 수 있음
// - 따라서: 초기 1회 로드 + 이후는 저장만 수행
const LS_APP_STATE_KEY = "reject_analyzer_state_v3";

function safeParseLocal(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadAuthState() {
  if (typeof window === "undefined") return { loggedIn: false, user: null };
  const raw = window.localStorage.getItem(LS_AUTH_KEY);
  const parsed = safeParseLocal(raw);
  if (!parsed || typeof parsed !== "object") return { loggedIn: false, user: null };
  return {
    loggedIn: Boolean(parsed.loggedIn),
    user: parsed.user && typeof parsed.user === "object" ? parsed.user : null,
  };
}

function saveAuthState(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_AUTH_KEY, JSON.stringify(next || { loggedIn: false, user: null }));
  } catch {
    // ignore
  }
}

function loadPendingAction() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LS_PENDING_ACTION_KEY);
  const parsed = safeParseLocal(raw);
  if (!parsed || typeof parsed !== "object") return null;
  const type = (parsed.type || "").toString();
  if (!type) return null;
  return parsed;
}

function savePendingAction(next) {
  if (typeof window === "undefined") return;
  try {
    if (!next) window.localStorage.removeItem(LS_PENDING_ACTION_KEY);
    else window.localStorage.setItem(LS_PENDING_ACTION_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function loadSampleMode() {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(LS_SAMPLE_MODE_KEY);
  return raw === "1";
}

function saveSampleMode(on) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_SAMPLE_MODE_KEY, on ? "1" : "0");
  } catch {
    // ignore
  }
}

// ✅ 앱 입력 상태 로드(초기 1회) + 안전 병합
function loadAppStateOnce() {
  if (typeof window === "undefined") return defaultState;

  const raw = window.localStorage.getItem(LS_APP_STATE_KEY);
  const parsed = safeParseLocal(raw);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaultState;

  const next = { ...defaultState, ...parsed };

  // nested: career/selfCheck는 구조가 깨지면 입력/분석에서 오류가 날 수 있으니 안전 병합
  const dc = defaultState?.career && typeof defaultState.career === "object" ? defaultState.career : {};
  const ds = defaultState?.selfCheck && typeof defaultState.selfCheck === "object" ? defaultState.selfCheck : {};

  const pc = parsed?.career && typeof parsed.career === "object" ? parsed.career : null;
  const ps = parsed?.selfCheck && typeof parsed.selfCheck === "object" ? parsed.selfCheck : null;

  next.career = { ...dc, ...(pc || {}) };
  next.selfCheck = { ...ds, ...(ps || {}) };

  // 문자열 필드 안전화
  next.company = (next.company ?? "").toString();
  next.role = (next.role ?? "").toString();
  next.stage = (next.stage ?? defaultState.stage ?? "서류").toString();
  next.applyDate = (next.applyDate ?? "").toString();
  next.companySizeCandidate = (next.companySizeCandidate ?? "").toString();
  next.companySizeTarget = (next.companySizeTarget ?? "").toString();
  next.jd = (next.jd ?? "").toString();
  next.resume = (next.resume ?? "").toString();
  next.portfolio = (next.portfolio ?? "").toString();
  next.interviewNotes = (next.interviewNotes ?? "").toString();

  // 숫자 필드 안전화
  next.career.totalYears = Number(next.career.totalYears ?? defaultState.career?.totalYears ?? 0) || 0;
  next.career.gapMonths = Number(next.career.gapMonths ?? defaultState.career?.gapMonths ?? 0) || 0;
  next.career.jobChanges = Number(next.career.jobChanges ?? defaultState.career?.jobChanges ?? 0) || 0;
  next.career.lastTenureMonths = Number(next.career.lastTenureMonths ?? defaultState.career?.lastTenureMonths ?? 0) || 0;

  next.selfCheck.coreFit = clamp(Number(next.selfCheck.coreFit ?? 3) || 3, 1, 5);
  next.selfCheck.proofStrength = clamp(Number(next.selfCheck.proofStrength ?? 3) || 3, 1, 5);
  next.selfCheck.roleClarity = clamp(Number(next.selfCheck.roleClarity ?? 3) || 3, 1, 5);
  next.selfCheck.storyConsistency = clamp(Number(next.selfCheck.storyConsistency ?? 3) || 3, 1, 5);
  next.selfCheck.riskSignals = clamp(Number(next.selfCheck.riskSignals ?? 3) || 3, 1, 5);

  return next;
}

function saveAppState(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_APP_STATE_KEY, JSON.stringify(next || defaultState));
  } catch {
    // ignore
  }
}

function clearAppState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LS_APP_STATE_KEY);
  } catch {
    // ignore
  }
}

// 샘플 리포트는 "입력 덮어쓰기"가 아니라, 별도 state로만 생성/표시.
const SAMPLE_STATE = {
  ...defaultState,
  company: "영풍정밀",
  role: "기획팀 (6년차)",
  stage: "서류",
  applyDate: "",
  career: {
    totalYears: 6,
    gapMonths: 0,
    jobChanges: 2,
    lastTenureMonths: 18,
  },
  jd:
    "주요업무: 연간 사업계획/예산 수립, KPI 관리, 손익(P/L) 분석, 시장/경쟁사 리서치, 경영진 보고자료 작성\n" +
    "자격요건(필수): 제조업 또는 B2B 산업재 사업기획/전략기획 경력 5년+, Excel 고급(피벗/함수), 데이터 기반 의사결정, 유관부서 협업\n" +
    "우대사항: ERP/원가/공급망(SCM) 이해, 프로젝트 리딩 경험, 영어 커뮤니케이션",
  resume:
    "경력요약: B2B 제조업 유관 부서에서 기획/운영 6년. 연간 KPI 대시보드 운영 및 개선, 신규 프로젝트 기획 지원 경험 보유.\n" +
    "핵심경험: (1) 월간 KPI 리포트 자동화(Excel)로 보고 리드타임 단축. (2) 제품군별 판매 데이터 정리 및 인사이트 공유로 현업 의사결정 지원.\n" +
    "강점: 데이터 정리/분석 기반 커뮤니케이션, 유관부서 협업, 문서화/보고 역량.\n" +
    "보완: P/L 직접 운영 경험은 제한적이며, 제조 원가/SCM 도메인 경험은 일부 학습 수준.",
  portfolio:
    "성과물: KPI 리포트 템플릿(샘플), 회의록/보고서 목차 예시, 데이터 정리 방식 문서화",
  interviewNotes: "",
  selfCheck: {
    coreFit: 3,
    proofStrength: 3,
    roleClarity: 3,
    storyConsistency: 3,
    riskSignals: 3,
  },
};

export default function App() {
  const { toast } = useToast();

  const [step, setStep] = useState(SECTION.JOB);
  const [activeTab, setActiveTab] = useState(SECTION.JOB);
  const [selfCheckMode, setSelfCheckMode] = useState("checklist");

  // ✅ state는 "초기 1회 로드"만 수행 (이후 로컬에서 읽어서 덮어쓰기 금지)
  const [state, setState] = useState(() => loadAppStateOnce());
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ✅ state 저장(쓰기만)
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  function resetState() {
    clearAppState();
    setState(defaultState);
  }

  // ------------------------------
  // IME(한글 입력) guard (global)
  // - 조합(composition) 중에는 "현재 입력중인 path" 외의 set을 차단
  // - 외부(effect/자동추론/기타 set)이 입력 중 value를 덮어써 IME가 깨지는 현상을 방지
  // ------------------------------
  const composingRef = useRef({ on: false, path: "" });

  function beginComposing(path) {
    composingRef.current = { on: true, path: String(path || "") };
  }

  function endComposing(path) {
    const p = String(path || "");
    if (composingRef.current?.path === p) {
      composingRef.current = { on: false, path: "" };
    } else {
      composingRef.current = { on: false, path: "" };
    }
  }

  function isBlockedByComposing(path) {
    const cur = composingRef.current;
    if (!cur?.on) return false;
    const p = String(path || "");
    // 조합 중에는 "현재 조합중인 필드"만 업데이트 허용
    return cur.path !== p;
  }

  useEffect(() => {
    console.log(
      "[watch] interviewNotes =",
      state?.interviewNotes,
      "len=",
      (state?.interviewNotes ?? "").length,
      "type=",
      typeof state?.interviewNotes
    );
  }, [state?.interviewNotes]);

  // ------------------------------
  // AI state (UX merge only)
  // - 룰 엔진 결과는 즉시 렌더
  // - AI는 "뒤에서 보강"만(merge)
  // ------------------------------
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiMeta, setAiMeta] = useState(null);

  const [aiCardOpen, setAiCardOpen] = useState(false);
  const [aiAdvancedOpen, setAiAdvancedOpen] = useState(false);

  const aiAbortRef = useRef(null);
  const aiInFlightRef = useRef({ key: "", controller: null });
  const aiCacheRef = useRef(new Map());
  const aiLastCallRef = useRef({ key: "", at: 0 });
  const analysisKeyRef = useRef("");

  // ------------------------------
  // Login gate + sample mode states
  // ------------------------------
  const [auth, setAuth] = useState(() => loadAuthState());
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(() => loadPendingAction());
  const [sampleMode, setSampleMode] = useState(() => loadSampleMode());
  const [sampleAnalysis, setSampleAnalysis] = useState(null);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const canAnalyze = useMemo(() => {
    const companyOk = Boolean(state.company?.trim());
    const roleOk = Boolean(state.role?.trim());
    const jdOk = Boolean(state.jd?.trim());
    const resumeOk = Boolean(state.resume?.trim());
    return companyOk && roleOk && jdOk && resumeOk;
  }, [state.company, state.role, state.jd, state.resume]);

  const progress = useMemo(() => {
    const idx0 = ORDER.indexOf(step);
    return ((idx0 + 1) / ORDER.length) * 100;
  }, [step]);

  const reportRef = useRef(null);

  const nav = [
    { id: SECTION.JOB, label: "기본정보", icon: FileText },
    { id: SECTION.RESUME, label: "서류", icon: FileText },
    { id: SECTION.INTERVIEW, label: "면접", icon: FileText },
    { id: SECTION.RESULT, label: "리포트", icon: Sparkles },
  ];

  const idx = ORDER.indexOf(step);
  const canNext = idx < ORDER.length - 1;

  function set(path, value) {
    const keys = path.split(".");
    const vLen =
      typeof value === "string"
        ? value.length
        : Array.isArray(value)
          ? value.length
          : value && typeof value === "object"
            ? Object.keys(value).length
            : 0;

    if (isBlockedByComposing(path)) {
      console.log("[SET BLOCKED: composing]", path, value, vLen);
      return;
    }

    console.log("[SET CALLED]", path, value, vLen);

    setState((prev) => {
      const next = setIn(prev, keys, value);
      return next;
    });
  }

  function resetAll() {
    resetState();
    setStep(SECTION.JOB);
    setActiveTab(SECTION.JOB);
    setAnalysis(null);
    setIsAnalyzing(false);

    // AI 관련 상태도 초기화(안전)
    try {
      aiAbortRef.current?.abort?.();
    } catch {
      // ignore
    }
    aiAbortRef.current = null;

    // in-flight 추적도 초기화
    aiInFlightRef.current = { key: "", controller: null };

    setAiResult(null);
    setAiLoading(false);
    setAiError(null);
    setAiMeta(null);

    setAiCardOpen(false);
    setAiAdvancedOpen(false);

    aiCacheRef.current = new Map();
    aiLastCallRef.current = { key: "", at: 0 };
    analysisKeyRef.current = "";

    // 샘플 모드/샘플 분석은 "입력 덮어쓰기"가 아니라 표시만이므로, 초기화 시에는 표시도 초기화
    setSampleMode(false);
    setSampleAnalysis(null);
    saveSampleMode(false);

    toast({ title: "초기화 완료", description: "입력값을 기본값으로 되돌렸습니다." });
  }

  // ------------------------------
  // Login gate persistence (localStorage)
  // ------------------------------
  useEffect(() => {
    saveAuthState(auth);
  }, [auth]);

  useEffect(() => {
    savePendingAction(pendingAction);
  }, [pendingAction]);

  useEffect(() => {
    saveSampleMode(sampleMode);
  }, [sampleMode]);

  // 로그인 성공 후 "펜딩 액션" 자동 이어가기
  useEffect(() => {
    if (!auth?.loggedIn) return;
    if (!pendingAction || !pendingAction.type) return;

    const t = (pendingAction.type || "").toString();

    if (t === "go_report") {
      setPendingAction(null);
      setLoginOpen(false);
      setTimeout(() => {
        goTo(SECTION.RESULT);
      }, 0);
      return;
    }

    if (t === "run_analysis_go_result") {
      setPendingAction(null);
      setLoginOpen(false);
      setTimeout(() => {
        runAnalysis({ goResult: true });
      }, 0);
      return;
    }

    if (t === "open_sample_report") {
      setPendingAction(null);
      setLoginOpen(false);
      setTimeout(() => {
        openSampleReport({ goResult: true });
      }, 0);
      return;
    }
  }, [auth?.loggedIn, pendingAction]); // eslint-disable-line react-hooks/exhaustive-deps

  function openLoginGate(next) {
    // next: { type: "...", meta?: {...} }
    setUserMenuOpen(false);
    setPendingAction(next || null);
    setLoginOpen(true);
  }

  function doLogout() {
    setUserMenuOpen(false);
    setAuth({ loggedIn: false, user: null });
    setLoginOpen(false);
    setPendingAction(null);
    toast({ title: "로그아웃", description: "로컬 로그인 상태를 해제했습니다." });
  }

  function doDummyLogin() {
    // 더미 로그인: 실제 OAuth는 다음 단계에서 교체 가능한 구조
    const user = { provider: "google", name: "Google 사용자", email: "user@example.com" };
    setAuth({ loggedIn: true, user });
    toast({ title: "로그인 완료(더미)", description: "지금 단계에선 로컬 로그인만 사용합니다." });
  }

  function ensureReportGate({ actionType }) {
    if (auth?.loggedIn) return true;
    openLoginGate({ type: actionType || "go_report" });
    return false;
  }

  function openSampleReport({ goResult = false } = {}) {
    // 샘플 모드: 기존 사용자 입력(state/localStorage) 절대 덮어쓰기 금지
    // => SAMPLE_STATE로만 분석 생성, UI는 sampleAnalysis로만 표시
    try {
      const hypotheses = buildHypotheses(SAMPLE_STATE, null);
      let report = buildReport(SAMPLE_STATE, null);

      const keywordSignals = buildKeywordSignals(SAMPLE_STATE.jd, SAMPLE_STATE.resume, null);
      const careerSignals = buildCareerSignals(SAMPLE_STATE.career, SAMPLE_STATE.jd);

      setSampleAnalysis({
        hypotheses,
        report,
        keywordSignals,
        careerSignals,
        ai: null,
        aiMeta: null,
        aiCards: null,
        at: new Date().toISOString(),
        key: makeAiCacheKey(SAMPLE_STATE.jd, SAMPLE_STATE.resume),
      });

      setSampleMode(true);

      // 샘플은 AI 호출/표시를 하지 않음
      setAiResult(null);
      setAiLoading(false);
      setAiError(null);
      setAiMeta(null);
      setAiCardOpen(false);
      setAiAdvancedOpen(false);

      toast({ title: "샘플 리포트 준비 완료", description: "샘플 모드로 안전하게 표시합니다." });

      if (goResult) {
        goTo(SECTION.RESULT);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "샘플 생성 실패", description: "콘솔 로그를 확인해 주세요.", variant: "destructive" });
    }
  }

  function clearSampleMode() {
    setSampleMode(false);
    setSampleAnalysis(null);
  }

  function shouldSkipAiCall({ jd, resume, key }) {
    const j = (jd || "").toString().trim();
    const r = (resume || "").toString().trim();

    // 샘플 모드에서는 AI 호출 스킵
    if (sampleMode) return { skip: true, reason: "sample_mode" };

    // 너무 짧으면 스킵
    if (j.length < 200 || r.length < 200) return { skip: true, reason: "too_short" };

    // 30초 내 동일 입력이면 스킵(중복 호출 방지)
    const last = aiLastCallRef.current || { key: "", at: 0 };
    const now = Date.now();
    if (last.key === key && now - Number(last.at || 0) < 30000) return { skip: true, reason: "dedup_30s" };

    return { skip: false, reason: null };
  }

  async function requestAiEnhance({ jd, resume, key, manual = false } = {}) {
    const inFlight = aiInFlightRef.current;

    // 같은 key로 이미 AI 요청이 진행 중이면 중복 호출 방지 (절대 abort 금지)
    if (inFlight?.controller && inFlight.key === key) {
      return { ok: true, inFlight: true, manual };
    }

    // Abort: 다른 요청이 진행 중이면 취소 (key가 바뀐 경우에만)
    try {
      if (aiAbortRef.current && (!inFlight?.controller || inFlight.key !== key)) {
        aiAbortRef.current?.abort?.();
      }
    } catch {
      // ignore
    }
    aiAbortRef.current = null;

    // 캐시: in-memory Map
    const cached = aiCacheRef.current?.get?.(key);
    if (cached && cached.ai && typeof cached.ai === "object") {
      setAiResult(cached.ai);
      setAiMeta(cached.meta || null);
      setAiError(null);
      setAiLoading(false);

      // 현재 분석 키와 일치하면 merge
      if (analysisKeyRef.current === key) {
        setAnalysis((prev) => {
          if (!prev || prev.key !== key) return prev;
          const aiCards = buildAiCardsData(cached.ai);
          return { ...prev, ai: cached.ai, aiMeta: cached.meta || null, aiCards };
        });
      }

      return { ok: true, fromCache: true };
    }

    const controller = new AbortController();
    aiAbortRef.current = controller;
    aiInFlightRef.current = { key, controller };

    setAiLoading(true);
    setAiError(null);

    // meta 상태를 UI에 그대로 보여주기 위해 초기값도 넣어둠
    setAiMeta((prev) => prev || { usedAI: false, status: "loading" });

    try {
      aiLastCallRef.current = { key, at: Date.now() };

      // ✅ 현재 분석(activeAnalysis)에서 룰 기반 힌트를 뽑아 ruleContext로 구성
      // - 구조가 프로젝트마다 조금씩 달라서, 후보 경로를 넓게 잡고 모두 안전하게 optional 처리
      const a = activeAnalysis && activeAnalysis.key === key ? activeAnalysis : null;

      const fit =
        a?.fitExtract ||
        a?.base?.fitExtract ||
        a?.result?.fitExtract ||
        a?.analysis?.fitExtract ||
        null;

      const ruleContext = {
        ruleRole: (fit?.role || fit?.detectedRole || "unknown").toString(),
        ruleIndustry: (fit?.industry || fit?.detectedIndustry || "unknown").toString(),

        roleSignals: Array.isArray(fit?.roleSignals)
          ? fit.roleSignals
          : Array.isArray(fit?.roleKeywords)
            ? fit.roleKeywords
            : [],

        industrySignals: Array.isArray(fit?.industrySignals)
          ? fit.industrySignals
          : Array.isArray(fit?.industryKeywords)
            ? fit.industryKeywords
            : [],

        ruleRoleConfidence:
          typeof fit?.roleConfidence === "number" ? fit.roleConfidence : null,
        ruleIndustryConfidence:
          typeof fit?.industryConfidence === "number" ? fit.industryConfidence : null,

        // (선택) analyzer 결과에 구조분석이 있으면 같이 전달
        structureAnalysis: a?.structureAnalysis ?? null,
      };

      // ✅ 여기만 변경: ruleContext를 함께 전달
      const aiResp = await fetchAiEnhance({
        jd,
        resume,
        signal: controller.signal,
        ruleContext,
      });

      if (aiResp?.ok && aiResp.ai && typeof aiResp.ai === "object") {
        const meta = aiResp.meta && typeof aiResp.meta === "object" ? aiResp.meta : null;

        // 캐시 저장
        try {
          aiCacheRef.current.set(key, { ai: aiResp.ai, meta });
        } catch {
          // ignore
        }

        setAiResult(aiResp.ai);
        setAiMeta(meta || { usedAI: false, status: "success" });
        setAiError(null);

        // 현재 분석과 일치하면 ai 섹션만 merge
        if (analysisKeyRef.current === key) {
          setAnalysis((prev) => {
            if (!prev || prev.key !== key) return prev;
            const aiCards = buildAiCardsData(aiResp.ai);
            return { ...prev, ai: aiResp.ai, aiMeta: meta || null, aiCards };
          });
        }

        return { ok: true, manual };
      }

      // 실패도 meta/status로 보여주기
      const meta = aiResp?.meta && typeof aiResp.meta === "object" ? aiResp.meta : null;
      const err = aiResp?.error || "ai_bad_response";

      setAiResult(null);
      setAiMeta(meta || { usedAI: false, status: err });
      setAiError(err);

      // 분석과 일치하면, ai 섹션은 비우되 meta만 반영
      if (analysisKeyRef.current === key) {
        setAnalysis((prev) => {
          if (!prev || prev.key !== key) return prev;
          return { ...prev, ai: null, aiMeta: meta || { usedAI: false, status: err }, aiCards: null };
        });
      }

      return { ok: false, manual, error: err };
    } catch (e) {
      const err = String(e || "");
      const reason = err.includes("AbortError") || err.includes("aborted") ? "aborted" : "ai_fetch_failed";

      if (reason !== "aborted") {
        setAiResult(null);
        setAiMeta({ usedAI: false, status: reason });
        setAiError(reason);

        if (analysisKeyRef.current === key) {
          setAnalysis((prev) => {
            if (!prev || prev.key !== key) return prev;
            return { ...prev, ai: null, aiMeta: { usedAI: false, status: reason }, aiCards: null };
          });
        }
      }

      return { ok: false, manual, error: reason };
    } finally {
      setAiLoading(false);

      if (aiAbortRef.current === controller) {
        aiAbortRef.current = null;
      }

      if (aiInFlightRef.current?.controller === controller) {
        aiInFlightRef.current = { key: "", controller: null };
      }
    }
  }

  function runAnalysis({ goResult = false } = {}) {
    if (isAnalyzing) return;

    if (!canAnalyze) {
      toast({
        title: "입력 부족",
        description: "지원 회사, 지원 포지션, JD, 이력서를 모두 입력해 주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    const delayMs = 350;
    window.setTimeout(() => {
      try {
        // 1) 룰 엔진(로컬 analyzer) 즉시 생성 → 즉시 렌더
        const hypotheses = buildHypotheses(state, null);
        let report = buildReport(state, null);

        const keywordSignals = buildKeywordSignals(state.jd, state.resume, null);
        const careerSignals = buildCareerSignals(state.career, state.jd);

        const key = makeAiCacheKey(state.jd, state.resume);
        analysisKeyRef.current = key;

        setAnalysis({
          hypotheses,
          report,
          keywordSignals,
          careerSignals,
          ai: null,
          aiMeta: null,
          aiCards: null,
          at: new Date().toISOString(),
          key,
        });

        // 샘플 모드가 켜져 있었다면, "내 분석"을 실행하는 순간 샘플 모드 표시만 해제(입력은 건드리지 않음)
        if (sampleMode) {
          clearSampleMode();
        }

        // 2) AI는 뒤에서 보강(merge)
        // - 호출 정책: 짧은 입력/30초 중복/샘플 모드면 스킵
        const sk = shouldSkipAiCall({ jd: state.jd, resume: state.resume, key });
        if (!sk.skip) {
          requestAiEnhance({ jd: state.jd, resume: state.resume, key, manual: false });
        } else {
          // 스킵 사유도 meta/status로 노출(디버깅/체감)
          const meta = { usedAI: false, status: "skipped:" + String(sk.reason || "") };
          setAiMeta(meta);
          setAiError(null);
          setAiResult(null);

          setAnalysis((prev) => {
            if (!prev || prev.key !== key) return prev;
            return { ...prev, ai: null, aiMeta: meta, aiCards: null };
          });
        }

        toast({ title: "분석 완료", description: "리포트를 생성했습니다. (AI는 뒤에서 보강됩니다)" });

        if (goResult) {
          goTo(SECTION.RESULT);
        }
      } catch (e) {
        console.error(e);
        toast({ title: "분석 실패", description: "콘솔 로그를 확인해 주세요.", variant: "destructive" });
      } finally {
        setIsAnalyzing(false);
      }
    }, delayMs);
  }

  async function copyReport() {
    try {
      const active = sampleMode ? sampleAnalysis : analysis;
      if (!active?.report) throw new Error("no report");
      await navigator.clipboard.writeText(active.report);
      toast({ title: "복사 완료", description: "리포트가 클립보드에 복사됐습니다." });
    } catch {
      toast({ title: "복사 실패", description: "브라우저 권한을 확인해 주세요.", variant: "destructive" });
    }
  }

  function downloadReport() {
    try {
      const active = sampleMode ? sampleAnalysis : analysis;
      const activeState = sampleMode ? SAMPLE_STATE : state;
      if (!active?.report) throw new Error("no report");
      const blob = new Blob([active.report], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reject_report_" + String(activeState.company || "company").split(" ").join("_") + ".txt";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "다운로드 시작", description: "텍스트 파일로 저장됩니다." });
    } catch {
      toast({ title: "다운로드 실패", variant: "destructive" });
    }
  }

  function goTo(nextId) {
    // 리포트 화면 진입은 로그인 게이트 통과 필요
    if (nextId === SECTION.RESULT) {
      const ok = ensureReportGate({ actionType: "go_report" });
      if (!ok) return;
    }

    setStep(nextId);
    setActiveTab(nextId);
    if (nextId === SECTION.RESULT) {
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  const activeAnalysis = sampleMode ? sampleAnalysis : analysis;
  const activeCareer = sampleMode ? SAMPLE_STATE.career : state.career;
  const expertAdvice = useMemo(() => {
    const activeState = sampleMode ? SAMPLE_STATE : state;
    return buildExpertAdvice(activeState, activeAnalysis);
  }, [sampleMode, state, activeAnalysis]);

  const activeAiMeta = useMemo(() => {
    const m = activeAnalysis?.aiMeta || aiMeta;
    if (!m || typeof m !== "object") return null;
    return {
      usedAI: typeof m.usedAI === "boolean" ? m.usedAI : Boolean(m.usedAI),
      status: (m.status || "").toString() || "",
    };
  }, [activeAnalysis?.aiMeta, aiMeta]);

  const aiStatusLabel = useMemo(() => {
    if (!activeAiMeta) return "";
    const s = (activeAiMeta.status || "").toString();
    if (!s) return "";
    return s;
  }, [activeAiMeta]);

  const aiConnected = useMemo(() => {
    if (!activeAiMeta) return false;
    if (activeAiMeta.usedAI) return true;
    const s = (activeAiMeta.status || "").toString();
    return s === "success" || s.includes("success");
  }, [activeAiMeta]);

  function AiDisclosureCard({ title, subtitle, open, onToggle, children }) {
    return (
      <Card className="rounded-2xl border bg-background/70 backdrop-blur">
        <CardHeader className="pb-3">
          <button type="button" onClick={onToggle} className="w-full flex items-start justify-between gap-3 text-left">
            <div className="space-y-1">
              <CardTitle className="text-base">{title}</CardTitle>
              {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
            </div>
            <ChevronDown className={"h-5 w-5 text-muted-foreground transition " + (open ? "rotate-180" : "")} />
          </button>
        </CardHeader>
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="ai-card-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0">{children}</CardContent>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Card>
    );
  }

  function normalizeCompanySizeValue(v) {
    const s = (v || "").toString().trim();
    if (!s) return "unknown";
    if (s === "스타트업" || s === "중소/강소기업" || s === "중견기업" || s === "대기업" || s === "unknown") return s;
    return "unknown";
  }

  function sanitizeStructureDetail(input) {
    const seen = new WeakSet();

    function walk(x, depth) {
      if (depth > 4) return "[…]";
      if (x === null || x === undefined) return null;

      const t = typeof x;
      if (t === "string") {
        const s = x.toString();
        if (s.length > 600) return s.slice(0, 600) + "…";
        return s;
      }
      if (t === "number") return "[num]";
      if (t === "boolean") return x;
      if (t === "function") return "[fn]";
      if (t === "bigint") return "[bigint]";
      if (t === "symbol") return "[symbol]";

      if (Array.isArray(x)) {
        const arr = x.slice(0, 12).map((v) => walk(v, depth + 1));
        if (x.length > 12) arr.push("…+" + String(x.length - 12));
        return arr;
      }

      if (t === "object") {
        try {
          if (seen.has(x)) return "[circular]";
          seen.add(x);
        } catch {
          // ignore
        }
        const out = {};
        const keys = Object.keys(x).slice(0, 20);
        keys.forEach((k) => {
          const v = x[k];
          out[k] = walk(v, depth + 1);
        });
        if (Object.keys(x).length > 20) out.__more = "…+" + String(Object.keys(x).length - 20);
        return out;
      }

      return "[unknown]";
    }

    return walk(input, 0);
  }

  const [structureOpen, setStructureOpen] = useState(false);

  const structureInfo = useMemo(() => {
    const a = activeAnalysis;
    const ai = a?.ai && typeof a.ai === "object" ? a.ai : null;

    const s1 = ai?.structureExplanation ?? null;
    const s2 = ai?.structureAnalysis ?? null;
    const s3 = ai?.structure ?? null;
    const s4 = ai?.fitExtract?.structureExplanation ?? null;

    const raw = s1 ?? s2 ?? s3 ?? s4 ?? null;

    let oneLine = "";
    if (typeof raw === "string" && raw.trim()) {
      oneLine = raw.trim().split("\n").slice(0, 1).join(" ");
      if (oneLine.length > 140) oneLine = oneLine.slice(0, 140) + "…";
    } else if (raw && typeof raw === "object") {
      const keys = Object.keys(raw);
      oneLine = keys.length ? "구조분석 요약: " + keys.slice(0, 6).join(", ") + (keys.length > 6 ? "…" : "") : "구조분석 요약: 데이터 있음";
    } else {
      oneLine = "구조분석 요약: 데이터 없음";
    }

    const detail = raw ? sanitizeStructureDetail(raw) : null;

    return { oneLine, detail, raw };
  }, [activeAnalysis]);

  function setTab(nextId) {
    if (nextId === SECTION.RESULT) {
      const ok = ensureReportGate({ actionType: "go_report" });
      if (!ok) return;
    }
    setActiveTab(nextId);
    setStep(nextId);
    if (nextId === SECTION.RESULT) {
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  const companySizeCandidateValue = normalizeCompanySizeValue(state.companySizeCandidate || "unknown");
  const companySizeTargetValue = normalizeCompanySizeValue(state.companySizeTarget || "unknown");

  function BasicInfoSection() {
    return (
      <Card className="bg-background/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">지원 회사(채용 회사)</div>
              <div className="text-xs text-muted-foreground -mt-1">
                지금 근무중인 회사가 아니라, <span className="text-foreground font-medium">이번에 지원한 회사</span>를 적어주세요
              </div>
              <Input
                value={state.company}
                onCompositionStart={() => beginComposing("company")}
                onCompositionEnd={(e) => {
                  endComposing("company");
                  set("company", e.target.value);
                }}
                onChange={(e) => set("company", e.target.value)}
                placeholder="예: 삼성전자(지원 회사)"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">지원 포지션(JD 기준)</div>
              <div className="text-xs text-muted-foreground -mt-1">
                현재 직무명이 아니라,{" "}
                <span className="text-foreground font-medium">채용공고(JD)에 적힌 포지션/직무</span>를 기준으로 적어주세요
              </div>
              <Input
                value={state.role}
                onCompositionStart={() => beginComposing("role")}
                onCompositionEnd={(e) => {
                  endComposing("role");
                  set("role", e.target.value);
                }}
                onChange={(e) => set("role", e.target.value)}
                placeholder="예: 구매 / PM / 데이터분석(지원 포지션)"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">이번 지원 탈락 단계</div>
              <Select value={state.stage} onValueChange={(v) => set("stage", v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {["서류", "1차 면접", "1차+2차 면접", "최종 면접", "오퍼 직전/협상", "기타"].map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">내 회사 규모 (선택)</div>
              <div className="text-xs text-muted-foreground -mt-1">현재/직전 회사 기준(모르면 모름으로 두세요)</div>
              <Select
                value={companySizeCandidateValue}
                onValueChange={(v) => set("companySizeCandidate", normalizeCompanySizeValue(v))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="스타트업">스타트업</SelectItem>
                  <SelectItem value="중소/강소기업">중소/강소기업</SelectItem>
                  <SelectItem value="중견기업">중견기업</SelectItem>
                  <SelectItem value="대기업">대기업</SelectItem>
                  <SelectItem value="unknown">모름</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="text-sm font-medium">지원 회사 규모 (선택)</div>
              <div className="text-xs text-muted-foreground -mt-1">지원한 회사 기준(모르면 모름으로 두세요)</div>
              <Select
                value={companySizeTargetValue}
                onValueChange={(v) => set("companySizeTarget", normalizeCompanySizeValue(v))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="스타트업">스타트업</SelectItem>
                  <SelectItem value="중소/강소기업">중소/강소기업</SelectItem>
                  <SelectItem value="중견기업">중견기업</SelectItem>
                  <SelectItem value="대기업">대기업</SelectItem>
                  <SelectItem value="unknown">모름</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">JD(채용공고) 핵심 문장</div>
                <Badge variant="outline" className="text-xs">
                  가능하면 그대로
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground -mt-1">
                주요업무/필수/우대 문장을 그대로 붙여넣을수록 정확해집니다
              </div>
              <Textarea
                value={state.jd}
                onCompositionStart={() => beginComposing("jd")}
                onCompositionEnd={(e) => {
                  endComposing("jd");
                  set("jd", e.target.value);
                }}
                onChange={(e) => set("jd", e.target.value)}
                placeholder="필수/우대 요건과 주요 업무 문장을 붙여넣어 주세요"
                className="rounded-xl min-h-[360px]"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">이력서 핵심 문장(지원용 요약/경험 일부)</div>
              <div className="text-xs text-muted-foreground -mt-1">
                <span className="text-foreground font-medium">이번 지원에 제출한 이력서</span> 기준으로 요약/대표 경험 2~3개를 붙여넣어 주세요
              </div>
              <Textarea
                value={state.resume}
                onCompositionStart={() => beginComposing("resume")}
                onCompositionEnd={(e) => {
                  endComposing("resume");
                  set("resume", e.target.value);
                }}
                onChange={(e) => set("resume", e.target.value)}
                placeholder="헤더/요약/대표 경험 2~3개 문장을 붙여 넣어 주세요"
                className="rounded-xl min-h-[360px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" className="rounded-full" disabled>
              <ChevronLeft className="h-4 w-4 mr-2" />
              이전
            </Button>
            <Button className="rounded-full" onClick={() => setTab(SECTION.RESUME)}>
              다음
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  function DocSection() {
    return (
      <Card className="bg-background/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">서류</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* career inputs */}
          <Card className="rounded-2xl bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">경력 정보 (분석 핵심)</CardTitle>
              <div className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">지원 시점 기준</span>의 전체 커리어(공백/이직/근속)입니다 · 리스크 가설에 직접 반영됩니다
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">총 경력 연차 (년)</div>
                <div className="text-xs text-muted-foreground -mt-1">전체 커리어 누적(정규직/계약직 포함, 본인 기준으로 합산)</div>
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={state.career.totalYears}
                  onChange={(e) => set("career.totalYears", Number(e.target.value || 0))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">최근 공백기 (개월)</div>
                <div className="text-xs text-muted-foreground -mt-1">최근 이직 전후에 생긴 공백(무직/준비 기간)을 월 기준으로 입력</div>
                <Input
                  type="number"
                  min={0}
                  max={240}
                  value={state.career.gapMonths}
                  onChange={(e) => set("career.gapMonths", Number(e.target.value || 0))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">총 이직 횟수</div>
                <div className="text-xs text-muted-foreground -mt-1">회사 변경 횟수(동일 회사 내 부서 이동은 보통 제외)</div>
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={state.career.jobChanges}
                  onChange={(e) => set("career.jobChanges", Number(e.target.value || 0))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">직전/현재 회사 근속 (개월)</div>
                <div className="text-xs text-muted-foreground -mt-1">
                  지금 근무중이면 <span className="text-foreground font-medium">현재 회사</span>, 퇴사했으면{" "}
                  <span className="text-foreground font-medium">가장 최근 회사</span> 기준
                </div>
                <Input
                  type="number"
                  min={0}
                  max={600}
                  value={state.career.lastTenureMonths}
                  onChange={(e) => set("career.lastTenureMonths", Number(e.target.value || 0))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <div className="text-sm font-medium">지원서 제출일 (선택)</div>
                <div className="text-xs text-muted-foreground -mt-1">
                  합불 통보일이 아니라, <span className="text-foreground font-medium">지원서 제출(또는 지원 완료) 날짜</span>를 의미합니다
                </div>
                <Input
                  type="date"
                  value={state.applyDate || ""}
                  onChange={(e) => set("applyDate", e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <div className="text-sm font-medium">포트폴리오/성과물(링크/설명)</div>
            <div className="text-xs text-muted-foreground -mt-1">링크가 없으면 무엇을 담았는지 요약만 적어도 됩니다(없으면 비워도 OK)</div>
            <Textarea
              value={state.portfolio}
              onCompositionStart={() => beginComposing("portfolio")}
              onCompositionEnd={(e) => {
                endComposing("portfolio");
                set("portfolio", e.target.value);
              }}
              onChange={(e) => set("portfolio", e.target.value)}
              placeholder="링크 또는 무엇을 담았는지 요약 (없으면 비워도 됩니다)"
              className="rounded-xl min-h-[120px]"
            />
          </div>

          <Card className="rounded-2xl bg-muted/30 border-dashed">
            <CardHeader className="pb-3 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-base">자가진단(서류) · 최소 항목</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    분석은 객관 지표 중심. 자가진단은 <span className="text-foreground font-medium">보조 신호</span>로만 씁니다.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={selfCheckMode === "checklist" ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setSelfCheckMode("checklist")}
                  >
                    체크리스트
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={selfCheckMode === "slider" ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setSelfCheckMode("slider")}
                  >
                    슬라이더
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {selfCheckMode === "checklist" ? (
                <div className="space-y-4">
                  <ChecklistRow
                    label="핵심요건 핏"
                    value={state.selfCheck.coreFit}
                    onChange={(v) => set("selfCheck.coreFit", v)}
                    hint="지원 포지션(JD) 필수요건을 충족하는 정도"
                    questions={SELF_CHECK_CHECKLISTS.coreFit}
                    rubric={SELF_CHECK_RUBRICS.coreFit}
                  />
                  <ChecklistRow
                    label="역할 명확성"
                    value={state.selfCheck.roleClarity}
                    onChange={(v) => set("selfCheck.roleClarity", v)}
                    hint="지원 포지션에서 내가 어떤 문제를 잘 푸는지 선명한가"
                    questions={SELF_CHECK_CHECKLISTS.roleClarity}
                    rubric={SELF_CHECK_RUBRICS.roleClarity}
                  />
                  <ChecklistRow
                    label="증거 강도"
                    value={state.selfCheck.proofStrength}
                    onChange={(v) => set("selfCheck.proofStrength", v)}
                    hint="수치/전후/검증/결과물이 있는 정도"
                    questions={SELF_CHECK_CHECKLISTS.proofStrength}
                    rubric={SELF_CHECK_RUBRICS.proofStrength}
                  />
                  <ChecklistRow
                    label="스토리 일관성"
                    value={state.selfCheck.storyConsistency}
                    onChange={(v) => set("selfCheck.storyConsistency", v)}
                    hint="이직사유-지원사유-경험이 한 줄로 이어지는가"
                    questions={SELF_CHECK_CHECKLISTS.storyConsistency}
                    rubric={SELF_CHECK_RUBRICS.storyConsistency}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <SliderRow
                    label="핵심요건 핏"
                    value={state.selfCheck.coreFit}
                    onChange={(v) => set("selfCheck.coreFit", v)}
                    hint="지원 포지션(JD) 필수요건을 충족하는 정도"
                    descriptions={SELF_CHECK_RUBRICS.coreFit}
                  />
                  <SliderRow
                    label="역할 명확성"
                    value={state.selfCheck.roleClarity}
                    onChange={(v) => set("selfCheck.roleClarity", v)}
                    hint="지원 포지션에서 내가 어떤 문제를 잘 푸는지 선명한가"
                    descriptions={SELF_CHECK_RUBRICS.roleClarity}
                  />
                  <SliderRow
                    label="증거 강도"
                    value={state.selfCheck.proofStrength}
                    onChange={(v) => set("selfCheck.proofStrength", v)}
                    hint="수치/전후/검증/결과물이 있는 정도"
                    descriptions={SELF_CHECK_RUBRICS.proofStrength}
                  />
                  <SliderRow
                    label="스토리 일관성"
                    value={state.selfCheck.storyConsistency}
                    onChange={(v) => set("selfCheck.storyConsistency", v)}
                    hint="이직사유-지원사유-경험이 한 줄로 이어지는가"
                    descriptions={SELF_CHECK_RUBRICS.storyConsistency}
                  />
                </div>
              )}

              <RadarSelfCheck selfCheck={state.selfCheck} />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" className="rounded-full" onClick={() => setTab(SECTION.JOB)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              이전
            </Button>
            <Button className="rounded-full" onClick={() => setTab(SECTION.INTERVIEW)}>
              다음
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  function InterviewSection() {
    return (
      <Card className="bg-background/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">면접</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* 먼저: 면접 질문/답변 메모 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">면접 질문/답변 메모</div>
            <div className="text-xs text-muted-foreground -mt-1">
              기억나는 질문, 내가 한 답변의 핵심, 면접관 반응(표정/꼬리질문/딜레이) 등을 적어주세요
            </div>
            <Textarea
              value={state.interviewNotes}
              onCompositionStart={() => beginComposing("interviewNotes")}
              onCompositionEnd={(e) => {
                endComposing("interviewNotes");
                console.log("[typed]", e.target.value, e.target.value.length);
                set("interviewNotes", e.target.value);
              }}
              onChange={(e) => {
                console.log("[typed]", e.target.value, e.target.value.length);
                set("interviewNotes", e.target.value);
              }}
              placeholder="기억나는 질문..."
              className="rounded-xl min-h-[260px]"
            />
          </div>

          {/* 다음: 자가진단(면접) */}
          <Card className="rounded-2xl bg-muted/30 border-dashed">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-base">자가진단(면접) · 최소 항목</CardTitle>
              <div className="text-xs text-muted-foreground">
                면접관이 걸어볼 만한 리스크 신호를{" "}
                <span className="text-foreground font-medium">내 기준으로만</span> 빠르게 체크합니다.
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selfCheckMode === "checklist" ? (
                <ChecklistRow
                  label="리스크 신호"
                  value={state.selfCheck.riskSignals}
                  onChange={(v) => set("selfCheck.riskSignals", v)}
                  hint="공백/잦은 이직/조건 제약/커뮤니케이션 흔들림 등"
                  questions={SELF_CHECK_CHECKLISTS.riskSignals}
                  rubric={SELF_CHECK_RUBRICS.riskSignals}
                />
              ) : (
                <SliderRow
                  label="리스크 신호"
                  value={state.selfCheck.riskSignals}
                  onChange={(v) => set("selfCheck.riskSignals", v)}
                  hint="공백/잦은 이직/조건 제약/커뮤니케이션 흔들림 등"
                  descriptions={SELF_CHECK_RUBRICS.riskSignals}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" className="rounded-full" onClick={() => setTab(SECTION.RESUME)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              이전
            </Button>
            <Button
              className="rounded-full"
              onClick={() => {
                // 리포트 진입(결과 화면)은 로그인 게이트 필요
                if (!auth?.loggedIn) {
                  openLoginGate({ type: "run_analysis_go_result" });
                  return;
                }
                runAnalysis({ goResult: true });
              }}
              disabled={!canAnalyze || isAnalyzing}
            >
              {isAnalyzing ? "분석 중..." : "분석하기"}
              <Sparkles className={"h-4 w-4 ml-2 " + (isAnalyzing ? "animate-spin" : "")} />
            </Button>
          </div>

        </CardContent>
      </Card>
    );
  }

  function ReportSection() {
    return (
      <Card ref={reportRef} className="bg-background/70 backdrop-blur">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg">분석 리포트</CardTitle>
              <div className="text-xs text-muted-foreground mt-1">
                이 결과는 <span className="text-foreground font-medium">가설</span>입니다. 내부 기준/경쟁자/예산/타이밍으로 달라질 수 있어요.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-full" onClick={copyReport} disabled={!activeAnalysis?.report || isAnalyzing}>
                <Clipboard className="h-4 w-4 mr-2" />
                복사
              </Button>
              <Button className="rounded-full" onClick={downloadReport} disabled={!activeAnalysis?.report || isAnalyzing}>
                <Download className="h-4 w-4 mr-2" />
                다운로드
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">단정 금지</Badge>
            <Badge variant="outline">객관 스코어 기반</Badge>
            <Badge variant="outline">가설-근거-액션</Badge>
            {sampleMode ? <Badge variant="outline">샘플 모드</Badge> : null}
            {isAnalyzing ? <Badge variant="secondary">분석 중…</Badge> : null}
            {aiLoading ? <Badge variant="secondary">AI 준비 중…</Badge> : null}
            {!aiLoading && aiConnected ? <Badge variant="outline">AI 연결됨</Badge> : null}
            {aiError ? <Badge variant="destructive">AI 오류</Badge> : null}
            {activeAiMeta?.status ? <Badge variant="outline">AI: {String(activeAiMeta.status)}</Badge> : null}
            {typeof activeAiMeta?.usedAI === "boolean" ? (
              <Badge variant="outline">usedAI: {activeAiMeta.usedAI ? "true" : "false"}</Badge>
            ) : null}
          </div>

          {aiError ? (
            <div className="text-xs text-muted-foreground">AI 보강이 실패해도 분석은 정상 동작합니다. (사유: {String(aiError)})</div>
          ) : null}

          {sampleMode ? (
            <div className="text-xs text-muted-foreground">
              샘플 리포트는 사용자 입력(state/localStorage)을 덮어쓰지 않습니다. (표시만 샘플로 전환)
              <Button
                variant="outline"
                size="sm"
                className="rounded-full ml-2"
                onClick={() => {
                  clearSampleMode();
                  toast({ title: "샘플 모드 해제", description: "내 입력 기반 화면으로 돌아갑니다." });
                }}
              >
                샘플 모드 해제
              </Button>
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-6">
          {isAnalyzing && !activeAnalysis ? (
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin" />
              입력을 바탕으로 가설을 구성하는 중입니다…
            </div>
          ) : !activeAnalysis ? (
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              아직 분석이 실행되지 않았습니다. 상단 또는 면접 단계에서 <b>분석하기</b>를 눌러 주세요.
            </div>
          ) : (
            <>
              <Card className="rounded-2xl bg-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">objective 요약</CardTitle>
                  <div className="text-xs text-muted-foreground">가장 먼저 보는 객관 신호(요약)입니다</div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">키워드 매칭 {Math.round((activeAnalysis.keywordSignals?.matchScore ?? 0) * 100)}/100</Badge>
                    <Badge variant="outline">공백 {activeCareer.gapMonths}개월</Badge>
                    <Badge variant="outline">이직 {activeCareer.jobChanges}회</Badge>
                    <Badge variant="outline">직전근속 {activeCareer.lastTenureMonths}개월</Badge>
                    <Badge variant="outline">내회사규모 {normalizeCompanySizeValue(state.companySizeCandidate || "unknown")}</Badge>
                    <Badge variant="outline">지원회사규모 {normalizeCompanySizeValue(state.companySizeTarget || "unknown")}</Badge>
                  </div>
                  {activeAnalysis.keywordSignals?.missingKeywords?.length ? (
                    <div className="text-xs text-muted-foreground">
                      누락 키워드(상위): {activeAnalysis.keywordSignals.missingKeywords.slice(0, 8).join(", ")}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* structureAnalysis summary (one line + disclosure) */}
              <Card className="rounded-2xl border bg-background/70 backdrop-blur">
                <CardHeader className="pb-3">
                  <button
                    type="button"
                    onClick={() => setStructureOpen((v) => !v)}
                    className="w-full flex items-start justify-between gap-3 text-left"
                  >
                    <div className="space-y-1">
                      <CardTitle className="text-base">structureAnalysis 요약</CardTitle>
                      <div className="text-xs text-muted-foreground">{structureInfo.oneLine}</div>
                    </div>
                    <ChevronDown className={"h-5 w-5 text-muted-foreground transition " + (structureOpen ? "rotate-180" : "")} />
                  </button>
                </CardHeader>
                <AnimatePresence initial={false}>
                  {structureOpen ? (
                    <motion.div
                      key="structure-body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <CardContent className="pt-0">
                        {structureInfo.detail ? (
                          <ScrollArea className="h-[220px] rounded-xl border bg-muted/30 p-3">
                            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/85 font-mono">
                              {JSON.stringify(structureInfo.detail, null, 2)}
                            </pre>
                          </ScrollArea>
                        ) : (
                          <div className="text-xs text-muted-foreground">표시할 구조분석 상세가 없습니다.</div>
                        )}
                      </CardContent>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </Card>

              {/* AI Cards (collapsed by default) */}
              <AiDisclosureCard
                title="AI 한 줄 요약 + 행동 3개 (베타)"
                subtitle={
                  aiLoading
                    ? "AI가 뒤에서 보강 중입니다. (룰 엔진 결과는 이미 반영됨)"
                    : activeAiMeta?.status
                      ? "상태: " + String(activeAiMeta.status)
                      : "AI 결과는 보조 제안이며, 사실/경험과 일치하는지 반드시 검증하세요."
                }
                open={aiCardOpen}
                onToggle={() => setAiCardOpen((v) => !v)}
              >
                {sampleMode ? (
                  <div className="text-xs text-muted-foreground leading-relaxed">샘플 모드에서는 AI 호출/표시를 하지 않습니다.</div>
                ) : aiLoading ? (
                  <div className="space-y-2">
                    <div className="h-3 w-4/5 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-3/5 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                    <div className="mt-3 rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
                      AI 인사이트(도착 전): 로딩 스켈레톤을 표시 중입니다.
                    </div>
                  </div>
                ) : activeAnalysis?.aiCards ? (
                  <div className="space-y-3">
                    {activeAnalysis.aiCards.summary ? (
                      <div className="rounded-xl border bg-muted/30 p-3 text-sm leading-relaxed text-foreground/90">
                        {activeAnalysis.aiCards.summary}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">요약이 없습니다. (AI 응답 스키마/파싱 상태를 확인해 주세요)</div>
                    )}

                    {activeAnalysis.aiCards.advice?.length ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-foreground">행동 3개</div>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/85">
                          {activeAnalysis.aiCards.advice.slice(0, 3).map((t, i) => (
                            <li key={i} className="leading-relaxed">
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {!activeAnalysis?.aiCards?.summary && !activeAnalysis?.aiCards?.advice?.length ? (
                      <div className="text-xs text-muted-foreground">AI 결과가 비어 있습니다. (AI: {aiStatusLabel || "unknown"})</div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground leading-relaxed">아직 AI 인사이트가 붙지 않았습니다.</div>

                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        if (!activeAnalysis?.key) return;
                        const key = activeAnalysis.key;
                        const sk = shouldSkipAiCall({ jd: state.jd, resume: state.resume, key });
                        if (sk.skip) {
                          toast({
                            title: "AI 인사이트 스킵",
                            description: "지금은 AI를 부르지 않아요. (사유: " + String(sk.reason) + ")",
                            variant: "destructive",
                          });
                          return;
                        }
                        requestAiEnhance({ jd: state.jd, resume: state.resume, key, manual: true });
                        toast({ title: "AI 인사이트 요청", description: "AI 보강을 다시 요청했습니다." });
                      }}
                      disabled={aiLoading || isAnalyzing}
                    >
                      <Sparkles className={"h-4 w-4 mr-2 " + (aiLoading ? "animate-spin" : "")} />
                      AI 인사이트 추가
                    </Button>

                    {activeAiMeta?.status ? (
                      <div className="text-[11px] text-muted-foreground">
                        debug: usedAI={String(activeAiMeta.usedAI)} · status={String(activeAiMeta.status)}
                      </div>
                    ) : null}
                  </div>
                )}
              </AiDisclosureCard>

              <AiDisclosureCard
                title="AI 근거 확장(고급) · Must-Have/의심 포인트/표현 확장"
                subtitle="필요한 사람만 펼쳐서 확인하세요. (기본은 가볍게)"
                open={aiAdvancedOpen}
                onToggle={() => setAiAdvancedOpen((v) => !v)}
              >
                {sampleMode ? (
                  <div className="text-xs text-muted-foreground leading-relaxed">샘플 모드에서는 AI 호출/표시를 하지 않습니다.</div>
                ) : aiLoading ? (
                  <div className="space-y-2">
                    <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-4/6 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-3/6 rounded bg-muted animate-pulse" />
                    <div className="mt-3 text-xs text-muted-foreground">고급 근거/매칭/충돌 데이터를 불러오는 중입니다…</div>
                  </div>
                ) : activeAnalysis?.aiCards ? (
                  <div className="space-y-4 text-sm">
                    {activeAnalysis.aiCards.jdMustHave?.length ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-foreground">JD Must-Have</div>
                        <div className="flex flex-wrap gap-2">
                          {activeAnalysis.aiCards.jdMustHave.slice(0, 12).map((t, i) => (
                            <Badge key={i} variant="outline" className="rounded-full">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {activeAnalysis.aiCards.keywordSynonyms ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-foreground">동의어/표현 확장</div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {Object.keys(activeAnalysis.aiCards.keywordSynonyms || {})
                            .slice(0, 10)
                            .map((k) => {
                              const arr = Array.isArray(activeAnalysis.aiCards.keywordSynonyms[k])
                                ? activeAnalysis.aiCards.keywordSynonyms[k]
                                : [];
                              const v = arr
                                .filter(Boolean)
                                .map((x) => String(x).trim())
                                .filter(Boolean)
                                .slice(0, 6);
                              if (!String(k || "").trim() || !v.length) return null;
                              return (
                                <div key={k} className="leading-relaxed">
                                  <span className="text-foreground font-medium">{String(k).trim()}:</span> {v.join(", ")}
                                </div>
                              );
                            })
                            .filter(Boolean)}
                        </div>
                      </div>
                    ) : null}

                    {activeAnalysis.aiCards.confidenceDeltaByHypothesis ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-foreground">가설 신뢰도 보정(delta)</div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {Object.keys(activeAnalysis.aiCards.confidenceDeltaByHypothesis || {})
                            .slice(0, 12)
                            .map((k) => {
                              const v = Number(activeAnalysis.aiCards.confidenceDeltaByHypothesis[k]);
                              if (!Number.isFinite(v)) return null;
                              return (
                                <div key={k}>
                                  <span className="text-foreground font-medium">{k}</span>: {v >= 0 ? "+" : ""}
                                  {v.toFixed(2)}
                                </div>
                              );
                            })
                            .filter(Boolean)}
                        </div>
                      </div>
                    ) : null}

                    {activeAnalysis.aiCards.suggestedBullets?.length ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-foreground">이력서 문장 개선(예시)</div>
                        <div className="space-y-2">
                          {activeAnalysis.aiCards.suggestedBullets.slice(0, 3).map((b, i) => {
                            if (!b) return null;
                            const before = (b.before || "").toString().trim();
                            const after = (b.after || "").toString().trim();
                            const why = (b.why || "").toString().trim();
                            return (
                              <div key={i} className="rounded-xl border bg-muted/30 p-3 text-xs">
                                <div className="text-muted-foreground">BEFORE</div>
                                <div className="mt-0.5 text-foreground/90 whitespace-pre-wrap">{before || "-"}</div>
                                <div className="mt-2 text-muted-foreground">AFTER</div>
                                <div className="mt-0.5 text-foreground/90 whitespace-pre-wrap">{after || "-"}</div>
                                {why ? (
                                  <>
                                    <div className="mt-2 text-muted-foreground">WHY</div>
                                    <div className="mt-0.5 text-foreground/85 whitespace-pre-wrap">{why}</div>
                                  </>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {activeAnalysis.aiCards.conflicts?.length ? (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-foreground">의심 포인트(면접관 관점)</div>
                        <div className="space-y-2">
                          {activeAnalysis.aiCards.conflicts.slice(0, 5).map((c, i) => {
                            if (!c) return null;
                            const type = (c.type || "issue").toString().trim();
                            const ev = (c.evidence || "").toString().trim();
                            const ex = (c.explanation || "").toString().trim();
                            const fix = (c.fix || "").toString().trim();
                            return (
                              <div key={i} className="rounded-xl border bg-muted/30 p-3 text-xs">
                                <div className="text-foreground font-semibold">{type}</div>
                                {ev ? <div className="mt-1 text-muted-foreground">· 근거: {ev}</div> : null}
                                {ex ? <div className="mt-1 text-muted-foreground">· 해석: {ex}</div> : null}
                                {fix ? <div className="mt-1 text-muted-foreground">· 대응: {fix}</div> : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {!activeAnalysis.aiCards.jdMustHave?.length &&
                      !activeAnalysis.aiCards.conflicts?.length &&
                      !activeAnalysis.aiCards.suggestedBullets?.length &&
                      !activeAnalysis.aiCards.keywordSynonyms &&
                      !activeAnalysis.aiCards.confidenceDeltaByHypothesis ? (
                      <div className="text-xs text-muted-foreground">고급 데이터가 비어 있습니다. (AI: {aiStatusLabel || "unknown"})</div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground leading-relaxed">아직 AI 근거 확장 데이터가 없습니다.</div>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        if (!activeAnalysis?.key) return;
                        const key = activeAnalysis.key;
                        const sk = shouldSkipAiCall({ jd: state.jd, resume: state.resume, key });
                        if (sk.skip) {
                          toast({
                            title: "AI 근거 확장 스킵",
                            description: "지금은 AI를 부르지 않아요. (사유: " + String(sk.reason) + ")",
                            variant: "destructive",
                          });
                          return;
                        }
                        requestAiEnhance({ jd: state.jd, resume: state.resume, key, manual: true });
                        toast({ title: "AI 근거 확장 요청", description: "AI 보강을 다시 요청했습니다." });
                      }}
                      disabled={aiLoading || isAnalyzing}
                    >
                      <Sparkles className={"h-4 w-4 mr-2 " + (aiLoading ? "animate-spin" : "")} />
                      AI 근거 확장 불러오기
                    </Button>
                  </div>
                )}
              </AiDisclosureCard>

              <Card className="rounded-2xl bg-background/70 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">전문가 제언</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    자가진단(주관)과 객관 신호(텍스트 분석)를 <span className="text-foreground font-medium">교차 검증</span>해서, 다음 액션을 더 선명하게 잡아드립니다.
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {expertAdvice.length ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {expertAdvice.map((t, i) => (
                        <li key={i} className="text-foreground/85 leading-relaxed">
                          {t}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-muted-foreground text-sm">비교할 데이터가 부족합니다. JD/이력서 입력 후 다시 분석해 주세요.</div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                  {activeAnalysis.hypotheses.map((h) => (
                    <HypothesisCard key={h.id} h={h} />
                  ))}
                </AnimatePresence>
              </div>

              <Separator />

              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">텍스트 리포트</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[320px] rounded-xl border bg-muted/30 p-4">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-mono">{activeAnalysis.report}</pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-background/70 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">다음 단계 제안</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="text-muted-foreground leading-relaxed">
                    이 분석은 입력 기반 가설 모델입니다.
                    <br />
                    정밀한 탈락 원인 진단 및 합격 전략 설계가 필요하다면 전문가 상담을 권장합니다.
                  </div>

                  <div className="space-y-2">
                    <Button asChild variant="default" className="w-full">
                      <a href="https://coachingezig.mycafe24.com/contact/" target="_blank" rel="noreferrer">
                        이력서/커리어 정밀 상담 신청
                      </a>
                    </Button>

                    <Button asChild variant="default" className="w-full">
                      <a
                        href="https://m.expert.naver.com/mobile/expert/product/detail?storeId=100049372&productId=100149761"
                        target="_blank"
                        rel="noreferrer"
                      >
                        면접 컨설팅 신청하기
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <div className="flex items-center justify-between">
            <Button variant="outline" className="rounded-full" onClick={() => setTab(SECTION.INTERVIEW)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              이전
            </Button>
            <Button className="rounded-full" onClick={() => setTab(SECTION.JOB)}>
              새 입력
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={120}>
      <Shell>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
                <Lock className="h-4 w-4" />
                기본값: 입력 데이터는 브라우저(로컬)에만 저장됩니다
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                탈락 원인 분석기 <span className="text-muted-foreground">(v3)</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                단정하지 않고, <span className="text-foreground font-medium">가설을 우선순위</span>로 정리해 실행 액션까지 뽑습니다.
                <span className="block">분석은 typing 중 자동 실행하지 않고, 버튼 클릭 시에만 실행됩니다.</span>
                <span className="block">AI 분석은 보통 10초 정도 걸릴 수 있어요. (룰 엔진 결과는 즉시 표시)</span>
              </p>

              {/* Landing Hero CTA buttons (insertion) */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  variant="default"
                  className="rounded-full"
                  onClick={() => {
                    clearSampleMode();
                    setTab(SECTION.JOB);
                  }}
                >
                  무료 시작하기
                </Button>

                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    if (!ensureReportGate({ actionType: "open_sample_report" })) return;
                    openSampleReport({ goResult: true });
                  }}
                >
                  샘플 리포트 보기
                </Button>

                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    if (auth?.loggedIn) {
                      toast({ title: "로그인 상태", description: "이미 로그인되어 있습니다." });
                      return;
                    }
                    openLoginGate({ type: "go_report" });
                  }}
                >
                  구글로 계속
                </Button>

                {sampleMode ? (
                  <Badge variant="outline" className="rounded-full">
                    샘플 모드
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Navbar auth UI (insertion) */}
              <div className="relative flex items-center gap-2 mr-1">
                {auth?.loggedIn ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className="group inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-2 text-xs shadow-sm backdrop-blur hover:bg-muted/40 transition"
                      aria-label="계정 메뉴"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-foreground/80 border">
                        <User className="h-4 w-4" />
                      </span>
                      <span className="text-foreground font-medium leading-none">{auth?.user?.name || "로그인 사용자"}</span>
                      <span className="text-muted-foreground leading-none">
                        {auth?.user?.provider ? "(" + String(auth.user.provider) + ")" : ""}
                      </span>
                      <ChevronDown className={"h-4 w-4 text-muted-foreground transition " + (userMenuOpen ? "rotate-180" : "")} />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen ? (
                        <>
                          <motion.button
                            key="user-menu-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            type="button"
                            className="fixed inset-0 z-40 cursor-default"
                            onMouseDown={() => setUserMenuOpen(false)}
                            aria-label="닫기"
                          />
                          <motion.div
                            key="user-menu"
                            initial={{ opacity: 0, y: 6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            className="absolute right-0 top-12 z-50 w-64"
                          >
                            <Card className="bg-background/95 backdrop-blur shadow-lg">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">계정</CardTitle>
                                <div className="text-xs text-muted-foreground leading-relaxed">
                                  로그인 상태는 이 기기(브라우저)에만 저장됩니다.
                                  <span className="block">현재는 더미 로그인(베타)입니다.</span>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="rounded-xl border bg-muted/30 p-3 text-xs">
                                  <div className="text-foreground font-medium">{auth?.user?.name || "로그인 사용자"}</div>
                                  <div className="text-muted-foreground mt-0.5">
                                    {auth?.user?.email || "email 미설정"} {auth?.user?.provider ? "· " + String(auth.user.provider) : ""}
                                  </div>
                                </div>

                                <Button
                                  variant="outline"
                                  className="rounded-full w-full"
                                  onClick={() => {
                                    setUserMenuOpen(false);
                                    doLogout();
                                  }}
                                  disabled={isAnalyzing}
                                >
                                  로그아웃
                                </Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </>
                      ) : null}
                    </AnimatePresence>
                  </>
                ) : (
                  <Button variant="outline" className="rounded-full" onClick={() => openLoginGate({ type: "go_report" })} disabled={isAnalyzing}>
                    <Lock className="h-4 w-4 mr-2" />
                    로그인
                  </Button>
                )}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={resetAll} className="rounded-full" disabled={isAnalyzing}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    초기화
                  </Button>
                </TooltipTrigger>
                <TooltipContent>로컬 저장값도 덮어씁니다</TooltipContent>
              </Tooltip>

              <Button
                onClick={() => {
                  // 리포트 진입(결과 화면)은 로그인 게이트 필요: 로그인 안 되어 있으면 로그인 후 자동으로 이어짐
                  if (!auth?.loggedIn) {
                    openLoginGate({ type: "run_analysis_go_result" });
                    return;
                  }
                  runAnalysis({ goResult: true });
                }}
                className="rounded-full shadow-sm"
                disabled={!canAnalyze || isAnalyzing}
              >
                <Sparkles className={"h-4 w-4 mr-2 " + (isAnalyzing ? "animate-spin" : "")} />
                {isAnalyzing ? "분석 중..." : "분석하기"}
              </Button>
            </div>
          </div>

          {/* Stepper */}
          <Card className="overflow-hidden bg-background/70 backdrop-blur">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <CardTitle className="text-base">탭</CardTitle>
                  <div className="text-xs text-muted-foreground">입력은 최소로, 리포트는 분리해서 가볍게</div>
                </div>
                <div className="w-full md:w-[360px]">
                  <Progress value={progress} className="h-2" />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.round(progress)}%</span>
                    <span>
                      {idx + 1} / {ORDER.length}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {nav.map((n) => (
                  <StepPill
                    key={n.id}
                    active={activeTab === n.id}
                    done={ORDER.indexOf(n.id) < idx}
                    icon={n.icon}
                    label={n.label}
                    onClick={() => {
                      // 리포트 탭은 로그인 게이트 통과 필요
                      setTab(n.id);
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Login modal (dummy / local) */}
          <AnimatePresence>
            {loginOpen ? (
              <motion.div
                key="login-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) setLoginOpen(false);
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  className="w-full max-w-md"
                >
                  <Card className="bg-background/95 backdrop-blur">
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-base">구글로 계속 · 베타</CardTitle>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        지금 단계에서는 <span className="text-foreground font-medium">더미 로그인(로컬)</span>만 제공합니다. (UI만 개선)
                        <span className="block">로그인 전에도 입력한 JD/이력서/자가진단은 절대 날아가지 않습니다.</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
                        <div className="flex items-center gap-2 text-foreground font-semibold">
                          <Lock className="h-4 w-4" />
                          안내
                        </div>
                        <div className="mt-1">
                          실제 Google OAuth/서버/DB/과금/보안은 다음 단계에서 연결됩니다.
                          <br />
                          지금은 <b>로그인 상태 UI + 게이트 UX</b>만 구현합니다.
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="rounded-full w-full" onClick={() => setLoginOpen(false)}>
                          취소
                        </Button>
                        <Button
                          className="rounded-full w-full"
                          onClick={() => {
                            doDummyLogin();
                          }}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          구글로 계속하기
                        </Button>
                      </div>

                      <div className="text-[11px] text-muted-foreground leading-relaxed">
                        ※ 로그인 성공 직후, 방금 누른 액션(리포트 보기/샘플 보기/분석 후 리포트)을 자동으로 이어갑니다.
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Main layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {/* BASICINFO */}
                {activeTab === SECTION.JOB && (
                  <motion.div key="basicinfo" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <BasicInfoSection />
                  </motion.div>
                )}

                {/* DOC */}
                {activeTab === SECTION.RESUME && (
                  <motion.div key="doc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <DocSection />
                  </motion.div>
                )}

                {/* INTERVIEW */}
                {activeTab === SECTION.INTERVIEW && (
                  <motion.div key="interview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <InterviewSection />
                  </motion.div>
                )}

                {/* REPORT */}
                {activeTab === SECTION.RESULT && (
                  <motion.div key="report" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <ReportSection />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right sticky summary */}
            <div className="space-y-6">
              <Card className="bg-background/70 backdrop-blur lg:sticky lg:top-6">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">현재 입력 요약</CardTitle>
                  <div className="text-xs text-muted-foreground">필요한 만큼만 채워도 됩니다</div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">지원회사</span>
                    <span className="font-medium">{state.company || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">지원포지션</span>
                    <span className="font-medium">{state.role || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">탈락단계</span>
                    <span className="font-medium">{state.stage}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">내회사규모</span>
                    <span className="font-medium">{normalizeCompanySizeValue(state.companySizeCandidate || "unknown")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">지원회사규모</span>
                    <span className="font-medium">{normalizeCompanySizeValue(state.companySizeTarget || "unknown")}</span>
                  </div>

                  <Separator />

                  {!canAnalyze ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed flex gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      지원 회사/지원 포지션/JD/이력서 입력이 모두 있어야 분석할 수 있습니다.
                    </div>
                  ) : null}

                  <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Lock className="h-4 w-4" />
                      개인정보/법적 주의
                    </div>
                    <div className="mt-1">
                      기본값은 로컬 저장만 사용합니다. 실제 배포 시에는 개인정보처리방침/이용약관/수집항목 최소화/보관기간·파기 등은 별도 정리하세요.
                    </div>
                  </div>

                  {aiLoading ? (
                    <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed flex gap-2">
                      <Sparkles className="h-4 w-4 mt-0.5 shrink-0 animate-spin" />
                      AI 보강을 준비 중입니다. (룰 엔진 결과는 이미 반영됨)
                    </div>
                  ) : null}

                  {aiError ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed flex gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      AI 보강에 실패했어요. 그래도 분석은 정상 동작합니다. (사유: {String(aiError)})
                    </div>
                  ) : null}

                  {activeAiMeta?.status ? (
                    <div className="rounded-xl border bg-muted/30 p-3 text-[11px] text-muted-foreground leading-relaxed">
                      debug: usedAI={String(activeAiMeta.usedAI)} · status={String(activeAiMeta.status)}
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-full w-full"
                      onClick={() => {
                        // 리포트 진입(결과 화면)은 로그인 게이트 필요
                        if (!auth?.loggedIn) {
                          openLoginGate({ type: "run_analysis_go_result" });
                          return;
                        }
                        runAnalysis({ goResult: true });
                      }}
                      disabled={!canAnalyze || isAnalyzing}
                    >
                      <Sparkles className={"h-4 w-4 mr-2 " + (isAnalyzing ? "animate-spin" : "")} />
                      {isAnalyzing ? "분석 중..." : "분석하기"}
                    </Button>

                    <Button
                      className="rounded-full w-full"
                      onClick={() => {
                        const next = canNext ? ORDER[idx + 1] : SECTION.RESULT;
                        // 리포트로 넘어가는 경우는 로그인 게이트
                        if (next === SECTION.RESULT) {
                          if (!ensureReportGate({ actionType: "go_report" })) return;
                        }
                        setTab(next);
                      }}
                      disabled={isAnalyzing}
                    >
                      다음
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-base">기록 메모</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>면접관의 사고 프레임을 시스템으로 만들었습니다.</li>
                    <li>JD·이력서·커리어 리스크를 교차 분석합니다.</li>
                    <li>왜 떨어졌는지, 구조로 보여드립니다.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="pt-2 text-xs text-muted-foreground">i 문의&디버그 요청: 010-3368-4823 | qorrkdtks12@naver.com</div>

          <footer className="pt-12 pb-8 border-t text-xs text-muted-foreground text-center">
            <div>(c) 2026 Baek Gangsan / All rights reserved.</div>
            <div>본 서비스의 분석 알고리즘 및 리포트 구조는 저작권 보호를 받습니다.</div>
          </footer>
        </motion.div>
      </Shell>
    </TooltipProvider>
  );
}