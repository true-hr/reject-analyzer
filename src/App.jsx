// src/App.jsx
import React, { useMemo, useRef, useState } from "react";
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
// - Checklists: 질문형 체크리스트 → 자동 점수(1~5)
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
    1: "이직사유↔지원사유↔경험이 서로 따로 놀고, 질문에 막힌다",
    2: "큰 줄기는 있으나 세부에서 모순/구멍이 자주 보인다",
    3: "기본 논리는 성립하지만, 설득력 있는 '한 줄'이 약하다",
    4: "논리 흐름이 매끄럽고 반례 질문에도 흔들리지 않는다",
    5: "스토리가 간결·설득·검증 가능하고, 면접관이 의심할 지점이 적다",

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
  // 질문 4개 기준: 체크 개수(0~4) + 1 => 1~5
  const q = Array.isArray(questions) ? questions : [];
  const size = q.length || 4;

  const initChecked = useMemo(() => {
    const count = clamp((Number(value ?? 1) - 1), 0, size);
    return Array.from({ length: size }, (_, i) => i < count);
  }, [value, size]);

  const [checked, setChecked] = useState(initChecked);

  // value가 외부에서 바뀌는 경우(초기화/불러오기) 체크 상태를 동기화
  React.useEffect(() => {
    setChecked(initChecked);
  }, [initChecked]);

  const checkedCount = checked.filter(Boolean).length;
  const score = clamp(checkedCount + 1, 1, 5);

  React.useEffect(() => {
    if (score !== value) onChange(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedCount]); // onChange/value는 의도적으로 제외(무한루프 방지)

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
          <label key={i} className="flex items-start gap-2 rounded-xl border bg-muted/20 p-3 cursor-pointer hover:bg-muted/30">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4"
              checked={Boolean(checked[i])}
              onChange={(e) => {
                const next = checked.slice();
                next[i] = e.target.checked;
                setChecked(next);
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
    "공백/짧은 근속/잦은 이직 이슈를 '사실→의도→행동→증거'로 설명할 수 있다",
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

function SliderRow({ label, value, onChange, hint }) {
  const tone = value <= 2 ? "destructive" : value === 3 ? "secondary" : "default";
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
 * ✅ Deep copy(structuredClone/JSON stringify) 제거
 * - path에 해당하는 "경로만" 얕게 복사하며 불변 업데이트
 * - 데이터가 커져도 타이핑 성능 저하가 훨씬 덜함
 */
function setIn(obj, keys, value) {
  if (keys.length === 0) return obj;
  const [head, ...rest] = keys;

  // 배열 인덱스 형태는 현재 사용하지 않지만, 혹시 모를 안전장치
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

export default 

function buildExpertAdvice(state, analysis) {
  if (!analysis) return [];

  const msgs = [];
  const sc = state?.selfCheck || {};

  const norm5 = (v) => clamp((Number(v ?? 3) - 1) / 4, 0, 1);

  const selfFit = norm5(sc.coreFit);
  const selfRisk = norm5(sc.riskSignals); // 높을수록 위험

  const keywordMatch = Number(analysis.keywordSignals?.matchScore ?? 0);
  const careerRisk = Number(analysis.careerSignals?.careerRiskScore ?? 0);

  // 1) 자가진단(핏) vs 키워드 매칭
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

  // 2) 자가진단(리스크) vs 커리어 리스크
  const diffRisk = selfRisk - careerRisk; // -면 본인이 덜 위험하게 봄
  if (diffRisk <= -0.25) {
    msgs.push(
      "리스크를 낮게 보고 계신데, 커리어 신호(공백/짧은 근속/이직 빈도) 관점에선 경계 구간이에요. 리스크 설명 문장을 ‘사실→의도→행동→증거’로 고정해두면 방어력이 확 올라갑니다."
    );
  } else if (diffRisk >= 0.25) {
    msgs.push(
      "리스크를 꽤 높게 보고 계신데, 숫자상으로는 ‘치명적’까진 아닐 수 있어요. 과하게 위축되기보다, 질문 예상 5개만 정해서 답변 구조를 고정하는 쪽으로 가봅시다."
    );
  }

  // 3) 필수요건 누락 경고
  if (analysis.keywordSignals?.hasKnockoutMissing) {
    msgs.unshift(
      "지금 상태에선 ‘필수요건 누락’이 가장 위험해요. 평균점으로 커버가 안 되는 구간이라, 누락 키워드를 ‘경험 문장’에 사실 기반으로 넣거나, 없으면 짧은 결과물(미니 프로젝트)로 증거를 먼저 만들어야 해요."
    );
  }

  return msgs;
}


function App() {
  const { toast } = useToast();

  // 단계
  const [step, setStep] = useState(SECTION.JOB);
  const [selfCheckMode, setSelfCheckMode] = useState("checklist");


  // persisted state (v2->v3 migration 포함)
  const [state, setState, resetState] = usePersistedState(defaultState);

  // “분석하기” 버튼 기반 실행 (typing 중 실행 금지)
  const [analysis, setAnalysis] = useState(null);

  // ✅ 분석 로딩 상태(UX + 중복 클릭 방지)
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ✅ 필수값 검증(회사명/포지션/JD/이력서)
  const canAnalyze = useMemo(() => {
    const companyOk = Boolean(state.company?.trim());
    const roleOk = Boolean(state.role?.trim());
    const jdOk = Boolean(state.jd?.trim());
    const resumeOk = Boolean(state.resume?.trim());
    return companyOk && roleOk && jdOk && resumeOk;
  }, [state.company, state.role, state.jd, state.resume]);

  const progress = useMemo(() => {
    const idx = ORDER.indexOf(step);
    return ((idx + 1) / ORDER.length) * 100;
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
    setState((prev) => setIn(prev, keys, value));
  }

  function resetAll() {
    resetState();
    setStep(SECTION.JOB);
    setAnalysis(null);
    setIsAnalyzing(false);
    toast({ title: "초기화 완료", description: "입력값을 기본값으로 되돌렸습니다." });
  }

  // ✅ 분석 실행: 검증 + 로딩 + 의도적 딜레이
  function runAnalysis({ goResult = false } = {}) {
    if (isAnalyzing) return;

    if (!canAnalyze) {
      toast({
        title: "입력 부족",
        description: "회사명, 포지션, JD, 이력서를 모두 입력해 주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    // UX: “AI가 생각하는 느낌” (0.9~1.2초 권장)
    const delayMs = 1100;

    window.setTimeout(() => {
      try {
        const hypotheses = buildHypotheses(state);
        const report = buildReport(state);

        const keywordSignals = buildKeywordSignals(state.jd, state.resume);
        const careerSignals = buildCareerSignals(state.career, state.jd);

        setAnalysis({
          hypotheses,
          report,
          keywordSignals,
          careerSignals,
          at: new Date().toISOString(),
        });

        toast({ title: "분석 완료", description: "리포트를 생성했습니다." });

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
      if (!analysis?.report) throw new Error("no report");
      await navigator.clipboard.writeText(analysis.report);
      toast({ title: "복사 완료", description: "리포트가 클립보드에 복사됐습니다." });
    } catch {
      toast({ title: "복사 실패", description: "브라우저 권한을 확인해 주세요.", variant: "destructive" });
    }
  }

  function downloadReport() {
    try {
      if (!analysis?.report) throw new Error("no report");
      const blob = new Blob([analysis.report], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reject_report_${(state.company || "company").replaceAll(" ", "_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "다운로드 시작", description: "텍스트 파일로 저장됩니다." });
    } catch {
      toast({ title: "다운로드 실패", variant: "destructive" });
    }
  }

  function goTo(nextId) {
    setStep(nextId);
    if (nextId === SECTION.RESULT) {
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
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
              </p>
            </div>

            <div className="flex items-center gap-2">
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
                onClick={() => runAnalysis({ goResult: true })}
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
                  <CardTitle className="text-base">진행 상태</CardTitle>
                  <div className="text-xs text-muted-foreground">입력값이 많을수록 가설 품질이 올라갑니다</div>
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
                    active={step === n.id}
                    done={ORDER.indexOf(n.id) < idx}
                    icon={n.icon}
                    label={n.label}
                    onClick={() => setStep(n.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {/* JOB */}
                {step === SECTION.JOB && (
                  <motion.div key="job" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <Card className="bg-background/70 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="text-lg">기본 정보</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">회사명</div>
                            <Input value={state.company} onChange={(e) => set("company", e.target.value)} placeholder="예: 삼성전자" className="rounded-xl" />
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-medium">포지션</div>
                            <Input value={state.role} onChange={(e) => set("role", e.target.value)} placeholder="예: 구매 / PM / 데이터분석" className="rounded-xl" />
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-medium">탈락 단계</div>
                            <Select value={state.stage} onValueChange={(v) => set("stage", v)}>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {["서류", "1차 면접", "1차+2차 면접", "최종 면접", "오퍼 직전/협상", "기타"].map((o) => (
                                  <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-medium">지원일 (선택)</div>
                            <Input type="date" value={state.applyDate || ""} onChange={(e) => set("applyDate", e.target.value)} className="rounded-xl" />
                          </div>
                        </div>

                        {/* career inputs */}
                        <Card className="rounded-2xl bg-muted/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">경력 정보 (분석 핵심)</CardTitle>
                            <div className="text-xs text-muted-foreground">공백/이직/근속은 리스크 가설에 직접 반영됩니다</div>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="text-sm font-medium">총 경력 연차 (년)</div>
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
                              <div className="text-sm font-medium">직전 회사 근속 (개월)</div>
                              <Input
                                type="number"
                                min={0}
                                max={600}
                                value={state.career.lastTenureMonths}
                                onChange={(e) => set("career.lastTenureMonths", Number(e.target.value || 0))}
                                className="rounded-xl"
                              />
                            </div>
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">JD(채용공고) 핵심 문장</div>
                              <Badge variant="outline" className="text-xs">가능하면 그대로</Badge>
                            </div>
                            <Textarea value={state.jd} onChange={(e) => set("jd", e.target.value)} placeholder="필수/우대 요건과 주요 업무 문장을 붙여넣어 주세요" className="rounded-xl min-h-[180px]" />
                          </div>

                          <Card className="rounded-2xl bg-muted/30 border-dashed">
<CardHeader className="pb-3 space-y-3">
  <div className="flex items-start justify-between gap-3 flex-wrap">
    <div>
      <CardTitle className="text-base">자가진단</CardTitle>
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
        hint="JD 필수요건을 충족하는 정도"
        questions={SELF_CHECK_CHECKLISTS.coreFit}
        rubric={SELF_CHECK_RUBRICS.coreFit}
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
        label="역할 명확성"
        value={state.selfCheck.roleClarity}
        onChange={(v) => set("selfCheck.roleClarity", v)}
        hint="내가 어떤 문제를 잘 푸는지 선명한가"
        questions={SELF_CHECK_CHECKLISTS.roleClarity}
        rubric={SELF_CHECK_RUBRICS.roleClarity}
      />
      <ChecklistRow
        label="스토리 일관성"
        value={state.selfCheck.storyConsistency}
        onChange={(v) => set("selfCheck.storyConsistency", v)}
        hint="이직사유↔지원사유↔경험이 한 줄로 이어지는가"
        questions={SELF_CHECK_CHECKLISTS.storyConsistency}
        rubric={SELF_CHECK_RUBRICS.storyConsistency}
      />
      <ChecklistRow
        label="리스크 신호"
        value={state.selfCheck.riskSignals}
        onChange={(v) => set("selfCheck.riskSignals", v)}
        hint="공백/잦은 이직/조건 제약/커뮤니케이션 흔들림 등"
        questions={SELF_CHECK_CHECKLISTS.riskSignals}
        rubric={SELF_CHECK_RUBRICS.riskSignals}
      />
    </div>
  ) : (
    <div className="space-y-4">
      <SliderRow
        label="핵심요건 핏"
        value={state.selfCheck.coreFit}
        onChange={(v) => set("selfCheck.coreFit", v)}
        hint="JD 필수요건을 충족하는 정도"
        descriptions={SELF_CHECK_RUBRICS.coreFit}
      />
      <SliderRow
        label="증거 강도"
        value={state.selfCheck.proofStrength}
        onChange={(v) => set("selfCheck.proofStrength", v)}
        hint="수치/전후/검증/결과물이 있는 정도"
        descriptions={SELF_CHECK_RUBRICS.proofStrength}
      />
      <SliderRow
        label="역할 명확성"
        value={state.selfCheck.roleClarity}
        onChange={(v) => set("selfCheck.roleClarity", v)}
        hint="내가 어떤 문제를 잘 푸는지 선명한가"
        descriptions={SELF_CHECK_RUBRICS.roleClarity}
      />
      <SliderRow
        label="스토리 일관성"
        value={state.selfCheck.storyConsistency}
        onChange={(v) => set("selfCheck.storyConsistency", v)}
        hint="이직사유↔지원사유↔경험이 한 줄로 이어지는가"
        descriptions={SELF_CHECK_RUBRICS.storyConsistency}
      />
      <SliderRow
        label="리스크 신호"
        value={state.selfCheck.riskSignals}
        onChange={(v) => set("selfCheck.riskSignals", v)}
        hint="공백/잦은 이직/조건 제약/커뮤니케이션 흔들림 등"
        descriptions={SELF_CHECK_RUBRICS.riskSignals}
      />
    </div>
  )}

  <RadarSelfCheck selfCheck={state.selfCheck} />
</CardContent>
                   </Card>
                        </div>

                        <div className="flex items-center justify-between">
                          <Button variant="outline" className="rounded-full" disabled>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            이전
                          </Button>
                          <Button className="rounded-full" onClick={() => setStep(SECTION.RESUME)}>
                            다음
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* RESUME */}
                {step === SECTION.RESUME && (
                  <motion.div key="resume" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <Card className="bg-background/70 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="text-lg">서류 입력</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">이력서 핵심 문장(요약/경험 일부)</div>
                          <Textarea value={state.resume} onChange={(e) => set("resume", e.target.value)} placeholder="헤더/요약/대표 경험 2~3개 문장을 붙여 넣어 주세요" className="rounded-xl min-h-[220px]" />
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">포트폴리오/성과물(링크/설명)</div>
                          <Textarea value={state.portfolio} onChange={(e) => set("portfolio", e.target.value)} placeholder="링크 또는 무엇을 담았는지 요약 (없으면 비워도 됩니다)" className="rounded-xl min-h-[120px]" />
                        </div>

                        <div className="flex items-center justify-between">
                          <Button variant="outline" className="rounded-full" onClick={() => setStep(SECTION.JOB)}>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            이전
                          </Button>
                          <Button className="rounded-full" onClick={() => setStep(SECTION.INTERVIEW)}>
                            다음
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* INTERVIEW */}
                {step === SECTION.INTERVIEW && (
                  <motion.div key="interview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <Card className="bg-background/70 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="text-lg">면접 입력</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">면접 질문/답변 메모</div>
                          <Textarea value={state.interviewNotes} onChange={(e) => set("interviewNotes", e.target.value)} placeholder="기억나는 질문, 내가 한 답변의 핵심, 면접관 반응 등을 적어 주세요" className="rounded-xl min-h-[260px]" />
                        </div>

                        <div className="flex items-center justify-between">
                          <Button variant="outline" className="rounded-full" onClick={() => setStep(SECTION.RESUME)}>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            이전
                          </Button>
                          <Button
                            className="rounded-full"
                            onClick={() => runAnalysis({ goResult: true })}
                            disabled={!canAnalyze || isAnalyzing}
                          >
                            {isAnalyzing ? "분석 중..." : "분석하기"}
                            <Sparkles className={"h-4 w-4 ml-2 " + (isAnalyzing ? "animate-spin" : "")} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* RESULT */}
                {step === SECTION.RESULT && (
                  <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
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
                            <Button variant="outline" className="rounded-full" onClick={copyReport} disabled={!analysis?.report || isAnalyzing}>
                              <Clipboard className="h-4 w-4 mr-2" />
                              복사
                            </Button>
                            <Button className="rounded-full" onClick={downloadReport} disabled={!analysis?.report || isAnalyzing}>
                              <Download className="h-4 w-4 mr-2" />
                              다운로드
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">단정 금지</Badge>
                          <Badge variant="outline">객관 스코어 기반</Badge>
                          <Badge variant="outline">가설→근거→액션</Badge>
                          {isAnalyzing ? <Badge variant="secondary">분석 중…</Badge> : null}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        {isAnalyzing && !analysis ? (
                          <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 animate-spin" />
                            입력을 바탕으로 가설을 구성하는 중입니다…
                          </div>
                        ) : !analysis ? (
                          <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                            아직 분석이 실행되지 않았습니다. 상단 또는 면접 단계에서 <b>분석하기</b>를 눌러 주세요.
                          </div>
                        ) : (
                          <>
                            <Card className="rounded-2xl bg-muted/20">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">핵심 객관 신호</CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline">키워드 매칭 {Math.round((analysis.keywordSignals?.matchScore ?? 0) * 100)}/100</Badge>
                                  <Badge variant="outline">공백 {state.career.gapMonths}개월</Badge>
                                  <Badge variant="outline">이직 {state.career.jobChanges}회</Badge>
                                  <Badge variant="outline">직전근속 {state.career.lastTenureMonths}개월</Badge>
                                </div>
                                {analysis.keywordSignals?.missingKeywords?.length ? (
                                  <div className="text-xs text-muted-foreground">
                                    누락 키워드(상위): {analysis.keywordSignals.missingKeywords.slice(0, 8).join(", ")}
                                  </div>
                                ) : null}
                              </CardContent>
                            
<Card className="rounded-2xl bg-background/70 backdrop-blur">
  <CardHeader className="pb-3">
    <CardTitle className="text-base">전문가 제언</CardTitle>
    <div className="text-xs text-muted-foreground">
      자가진단(주관)과 객관 신호(텍스트 분석)를 <span className="text-foreground font-medium">교차 검증</span>해서, 다음 액션을 더 선명하게 잡아드립니다.
    </div>
  </CardHeader>
  <CardContent className="text-sm space-y-2">
    {buildExpertAdvice(state, analysis).length ? (
      <ul className="list-disc pl-5 space-y-1">
        {buildExpertAdvice(state, analysis).map((t, i) => (
          <li key={i} className="text-foreground/85 leading-relaxed">
            {t}
          </li>
        ))}
      </ul>
    ) : (
      <div className="text-muted-foreground text-sm">
        비교할 데이터가 부족합니다. JD/이력서 입력 후 다시 분석해 주세요.
      </div>
    )}
  </CardContent>
</Card>

</Card>

                            <div className="grid grid-cols-1 gap-4">
                              <AnimatePresence>
                                {analysis.hypotheses.map((h) => (
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
                                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-mono">
                                    {analysis.report}
                                  </pre>
                                </ScrollArea>
                              </CardContent>
                            </Card>
                          </>
                        )}

                        <div className="flex items-center justify-between">
                          <Button variant="outline" className="rounded-full" onClick={() => setStep(SECTION.INTERVIEW)}>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            이전
                          </Button>
                          <Button className="rounded-full" onClick={() => setStep(SECTION.JOB)}>
                            새 입력
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
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
                    <span className="text-muted-foreground">회사</span>
                    <span className="font-medium">{state.company || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">포지션</span>
                    <span className="font-medium">{state.role || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">단계</span>
                    <span className="font-medium">{state.stage}</span>
                  </div>

                  <Separator />

                  {!canAnalyze ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed flex gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      회사명/포지션/JD/이력서 입력이 모두 있어야 분석할 수 있습니다.
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

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-full w-full"
                      onClick={() => runAnalysis({ goResult: true })}
                      disabled={!canAnalyze || isAnalyzing}
                    >
                      <Sparkles className={"h-4 w-4 mr-2 " + (isAnalyzing ? "animate-spin" : "")} />
                      {isAnalyzing ? "분석 중..." : "분석하기"}
                    </Button>

                    <Button
                      className="rounded-full w-full"
                      onClick={() => {
                        const next = canNext ? ORDER[idx + 1] : SECTION.RESULT;
                        setStep(next);
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
                    <li>분석은 자동 실행하지 않고 “분석하기” 버튼으로만 실행됨(성능/UX 목적)</li>
                    <li>상태 업데이트는 deep copy 대신 경로만 얕게 복사(타이핑 성능 개선)</li>
                    <li>필수값(회사/포지션/JD/이력서) 없으면 분석 버튼 비활성화 + 토스트 안내</li>
                    <li>분석 시 1.1초 딜레이 + 로딩 배지/아이콘 회전(신뢰 UX)</li>
                    <li>signals/noticeDate/assessment 제거됨 → v2 로컬데이터는 마이그레이션됨</li>
                    <li>selfCheck는 confidence 보정만 함(객관 지표: 키워드/경력/증거/연차 적합도 중심)</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="pt-2 text-xs text-muted-foreground">
            ⓘ 구현 메모: 현재는 규칙 기반 추정입니다. 원하시면 업종/직무별 룰셋 확장, 키워드 사전/동의어, 점수 calibration, 상담 전환 퍼널까지 고도화 가능합니다.
          </div>
        </motion.div>
      </Shell>
    </TooltipProvider>
  );
}