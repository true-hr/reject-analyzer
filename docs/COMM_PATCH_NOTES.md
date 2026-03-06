# Communication Patch Notes

1) 수정 분류
- InputFlow 제출 안정성 보완 (async rejection 포함 예외 처리)
- 경력 연차 검증 보완 (raw value 기반 빈값/0년 구분)
- 지원 직무 검증 보완 (target role 우선)

2) 영향 파일
- src/components/input/InputFlow.jsx

3) 정확한 삽입/교체 위치
- `getSubmitValidationMessage(intent)` 교체: `src/components/input/InputFlow.jsx:131`
- `handleAnalyzeClick` 교체(비동기 예외 대응): `src/components/input/InputFlow.jsx:162`
- `handleGoDocClick` 교체(비동기 예외 대응): `src/components/input/InputFlow.jsx:191`

4) 붙여넣기 가능한 최종 코드
```jsx
const getSubmitValidationMessage = (intent) => {
  const targetRoleRaw = state?.targetRole ?? state?.roleTarget ?? "";
  const currentRoleRaw = state?.roleCurrent ?? state?.currentRole ?? "";
  const legacyRoleRaw = state?.role ?? "";
  const hasTargetRole =
    !!String(targetRoleRaw).trim() ||
    (!!String(legacyRoleRaw).trim() && !String(currentRoleRaw).trim());
  const hasIndustryCurrent = !!String(state?.industryCurrent || state?.currentIndustry || "").trim();
  const hasIndustryTarget = !!String(state?.industryTarget || state?.targetIndustry || "").trim();
  const hasCareerObject = !!(state?.career && typeof state.career === "object");

  // raw value 기준 검증: 빈 문자열/미입력은 통과 금지, 0은 유효 입력으로 허용
  const totalYearsRaw = state?.career?.totalYears;
  const hasCareerYearsInput =
    totalYearsRaw !== null &&
    totalYearsRaw !== undefined &&
    String(totalYearsRaw).trim() !== "";
  const totalYears = hasCareerYearsInput ? Number(totalYearsRaw) : NaN;
  const hasCareerYears = hasCareerYearsInput && Number.isFinite(totalYears) && totalYears >= 0;

  const hasJd = !!String(state?.jd || state?.jdText || "").trim();
  const hasResume = !!String(state?.resume || state?.resumeText || "").trim();

  // target role 누락은 통과 금지
  if (!hasTargetRole) return "지원 직무를 먼저 선택해주세요.";
  if (!hasIndustryCurrent || !hasIndustryTarget) return "현재 산업과 지원 산업을 먼저 선택해주세요.";
  if (!hasCareerObject || !hasCareerYears) {
    return "경력 정보가 비어 있어 분석 정확도가 크게 떨어질 수 있습니다. 총 경력을 먼저 입력해주세요.";
  }
  if (intent === "analyze" && mode === "deep" && !hasJd && !hasResume) {
    return "JD 또는 이력서를 붙여넣거나 첨부한 뒤 정밀 분석을 진행해주세요.";
  }
  return "";
};

const handleAnalyzeClick = async () => {
  const validationMessage = getSubmitValidationMessage("analyze");
  if (validationMessage) {
    setSubmitError(validationMessage);
    return;
  }
  setSubmitError("");
  if (typeof onAnalyze !== "function") {
    setSubmitError("분석 기능을 다시 불러온 뒤 시도해주세요.");
    return;
  }
  try {
    // sync throw + async rejection 모두 catch로 수렴
    await Promise.resolve(onAnalyze());
  } catch (err) {
    setSubmitError("분석 요청 중 오류가 발생했습니다. 입력값을 확인한 뒤 다시 시도해주세요.");
    // TMP_DEBUG: remove after confirm
    try {
      globalThis.__INPUTFLOW_SUBMIT_ERR__ = {
        at: Date.now(),
        where: "InputFlow.handleAnalyzeClick",
        message: err?.message || String(err),
        stack: err?.stack || null,
        flowStep,
        mode,
      };
    } catch {}
  }
};

const handleGoDocClick = async () => {
  const validationMessage = getSubmitValidationMessage("goDoc");
  if (validationMessage) {
    setSubmitError(validationMessage);
    return;
  }
  setSubmitError("");
  if (typeof onGoDoc !== "function") {
    setSubmitError("자가진단 기능을 다시 불러온 뒤 시도해주세요.");
    return;
  }
  try {
    // sync throw + async rejection 모두 catch로 수렴
    await Promise.resolve(onGoDoc());
  } catch (err) {
    setSubmitError("자가진단 화면 이동 중 오류가 발생했습니다. 다시 시도해주세요.");
    // TMP_DEBUG: remove after confirm
    try {
      globalThis.__INPUTFLOW_SUBMIT_ERR__ = {
        at: Date.now(),
        where: "InputFlow.handleGoDocClick",
        message: err?.message || String(err),
        stack: err?.stack || null,
        flowStep,
        mode,
      };
    } catch {}
  }
};
```

5) async rejection까지 실제로 잡히는 이유
- `await Promise.resolve(onAnalyze())` / `await Promise.resolve(onGoDoc())`를 사용했기 때문에:
  - `onAnalyze/onGoDoc`가 동기 함수에서 `throw`하면 `catch`로 이동
  - 비동기 함수가 반환한 Promise가 reject되어도 `await`가 예외로 변환하여 동일 `catch`로 이동
- 따라서 동기/비동기 경로 모두 `submitError` 처리 + `TMP_DEBUG` 기록으로 수렴됩니다.

6) TMP_DEBUG 삭제 여부
- 삭제하지 않음 (요청대로 유지)
- `// TMP_DEBUG: remove after confirm` + `globalThis.__INPUTFLOW_SUBMIT_ERR__` 유지
