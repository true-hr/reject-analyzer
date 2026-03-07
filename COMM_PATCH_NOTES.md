
## PASSMAP Decision Curve Calibration - PSEUDO_GATE__ROLE_SKILL__MUST_HAVE_MISSING 발화 조건 조사 (코드 수정 없음)

1) 조사 분류
- 안전 작업
- 코드 수정 없음
- 실행 결과(16 analyze 케이스) + 코드 경로 확인

2) 생성 위치/조건 요약
- 생성 경로 1 (원천 risk 생성)
  - 파일: `src/lib/decision/riskProfiles/roleSkillFit/mustHaveSkillMissingRisk.js`
  - 프로필: `ROLE_SKILL__MUST_HAVE_MISSING`
  - `priority: 95` (line 73)
  - `when(ctx)`:
    - `structural.flags`에 `MUST_HAVE_SKILL_MISSING` 있으면 true (line 82~83)
    - 또는 `metrics.requiredSkills` 존재 + `metrics.requiredCoverage < 0.5`이면 true (line 86~93)
  - `score(ctx)`:
    - flag score 우선 사용 (line 102~104)
    - fallback: coverage 기반 계산 (line 106~113)

- 생성 경로 2 (structural flag 공급)
  - 파일: `src/lib/decision/structuralPatterns.js`
  - `_extractMustHaveFromJD()`가 JD must/required 라인에서 `requiredSkills` 추출 (line 165~235)
  - `requiredCoverage = requiredCovered / requiredSkills` 계산 (line 516~518)
  - `MUST_HAVE_SKILL_MISSING` flag 생성 조건:
    - `requiredSkills.length > 0`
    - `requiredCoverage < THRESH.REQUIRED_COVERAGE_LOW(=0.5)` (line 775, 661)

- 왜 `maxGateP:95`가 되는가
  - 파일: `src/lib/decision/index.js`
  - `__gateArr`에서 실제 gate가 없으면 `id`에 `MUST_HAVE_MISSING` 포함 risk를 pseudo gate로 승격 (line 1630~1658)
  - `ROLE_SKILL__MUST_HAVE_MISSING` -> `PSEUDO_GATE__ROLE_SKILL__MUST_HAVE_MISSING`로 래핑
  - priority는 원 risk priority(95)를 그대로 사용 (line 1653~1657)
  - 따라서 `__maxGateP`가 95로 결정되고 cap 단계 진입 (line 1675~1683)

- must-have 판정 범위(무엇을 must로 보는지)
  - 이 pseudo gate 경로는 `skill/tool/coreTask/cert`를 분리 판단하지 않음.
  - JD의 must/required 문맥 라인에서 토큰화한 `requiredSkills` 전체를 대상으로 coverage 계산.
  - alias/부분충족 매칭은 이 경로에서 미적용(문자열 토큰 포함 여부 중심).
  - 참고: `evaluateEvidenceFit`는 `mustHave/preferred/tools/coreTasks` + alias/partial 로직을 갖지만, 본 7건에서는 `status: unavailable`로 사실상 보강에 기여하지 않음.

3) 7건 공통 패턴
- 공통 1: 모두 `maxGateId = PSEUDO_GATE__ROLE_SKILL__MUST_HAVE_MISSING`, `maxGateP = 95`.
- 공통 2: structural `requiredCoverage`가 0.00~0.33로 전부 0.5 미만.
- 공통 3: `requiredSkills`에 직무 키워드 외 일반 토큰이 다수 포함됨.
  - 7건 공통 상위 토큰: `지원(7)`, `직무(7)`
  - 누락 상위도 동일: `지원(7)`, `직무(7)`
- 공통 4: 7건 모두 `evidenceFit.status = "unavailable"`, `mustHaveTotal = 0`.
- 공통 5: 입력 JD/Resume가 매우 짧은 케이스 비중이 높음 (JD 38~85자, Resume 43~85자).

4) 샘플 추적 3건
- `TC_ANALYZE_BASELINE_STRONG_STRATEGY`
  - 입력: JD `전략기획 경력 3년 이상 ... KPI 설계`, Resume `전략기획 4년 ... 비용 12% 절감`
  - analyzer: `requiredSkills=18`, `requiredCovered=5`, `requiredCoverage=0.278`
  - must-have evidence: missing sample에 `지원`, `직무`, `3년`, `기반` 포함
  - gate 생성 근거: `ROLE_SKILL__MUST_HAVE_MISSING(priority 95)` -> pseudo gate 승격 -> `capReason gate_cap:62`, capped 55

- `TC_ANALYZE_BASELINE_STRONG_DATA`
  - 입력: JD `필수: SQL, 대시보드 구축, 지표 설계/분석 3년 이상`, Resume `데이터 분석 5년 ... 전환율 9% 개선`
  - analyzer: `requiredSkills=15`, `requiredCovered=5`, `requiredCoverage=0.333`
  - must-have evidence: missing sample에 `지원`, `직무`, `분석가.`, `설계/분석`, `3년`
  - gate 생성 근거: 동일 경로로 pseudo gate, capped 62 (이번 cap 62 상향의 유일한 borderline 유입 케이스)

- `TC_ANALYZE_COMPANYSIZE_JUMP_SMALLMID_TO_PUBLIC_PM`
  - 입력: JD `PM 필수: 다부서 협업/요구사항 조율/문서 기반 의사결정`, Resume `서비스 기획 4년, 로드맵 작성`
  - analyzer: `requiredSkills=10`, `requiredCovered=0`, `requiredCoverage=0.0`
  - must-have evidence: missing sample에 `지원`, `직무`, `pm.`, `다부서`, `협업과`, `조율`
  - gate 생성 근거: 동일 경로로 pseudo gate, capped 55

5) 1차 원인 판단(A/B/C 중 1개)
- **C. analyzer 쪽 must-have/evidence 공급이 빈약함**
- 근거:
  1) structural must-have 토큰 품질이 낮아(일반 토큰 다수 포함) coverage가 과소 추정됨
  2) 본 7건에서 evidenceFit이 모두 `unavailable`이라 보정 채널이 비활성
  3) 결과적으로 `ROLE_SKILL__MUST_HAVE_MISSING(priority 95)`가 과다 발화되어 pseudo gate로 cap 병목화

6) 다음 패치 1순위 권고
- 1순위: **cap 숫자 추가 상향보다, must-have 공급 품질(토큰/모델) 보정 조사·축소를 우선**.
- 최소 수정 관점: `PSEUDO` cap 숫자만 더 올리면 95 gate 발화 빈도 자체는 유지되어 재발 가능성이 큼.

---

## PASSMAP 패치 전달 - `_extractMustHaveFromJD()` 최소 수정

1) 수정 분류
- 1파일/1함수 최소 수정
- append-only 범위 내 함수 내부 로직 보정
- cap/gate/decision 및 coverage 계산식 미수정

2) 영향 파일
- `src/lib/decision/structuralPatterns.js`

3) 정확한 수정 위치
- 함수: `_extractMustHaveFromJD(jdText)` (해당 함수 전체 교체)

4) `_extractMustHaveFromJD()` 함수 전체 코드
```js
function _extractMustHaveFromJD(jdText) {
  const jd = _normText(jdText);
  if (!jd) return { requiredSkills: [], rawLines: [] };

  const lines = jd.split("\n").map((x) => x.trim()).filter(Boolean);

  const MUST_MARKER_RE = /(?:\uD544\uC218|required|\uC790\uACA9\uC694\uAC74|\uC694\uAD6C\uC0AC\uD56D|must|mandatory)/i;
  const PREFERRED_MARKER_RE = /(?:\uC6B0\uB300|preferred|plus|nice\s*to\s*have)/i;

  const buckets = [];
  let inMustSection = false;

  for (const line of lines) {
    const s = String(line || "").trim();
    if (!s) continue;

    const mustMatch = s.match(MUST_MARKER_RE);
    const prefMatch = s.match(PREFERRED_MARKER_RE);

    // Ignore lines where preferred marker appears before must marker.
    if (
      prefMatch &&
      Number.isFinite(prefMatch.index) &&
      mustMatch &&
      Number.isFinite(mustMatch.index) &&
      prefMatch.index <= mustMatch.index
    ) {
      inMustSection = false;
      continue;
    }

    let seg = "";

    if (mustMatch && Number.isFinite(mustMatch.index)) {
      inMustSection = true;
      const start = mustMatch.index + mustMatch[0].length;
      seg = s.slice(start).trim();
    } else if (inMustSection) {
      seg = s;
    } else {
      continue;
    }

    const segPrefMatch = seg.match(PREFERRED_MARKER_RE);
    if (segPrefMatch && Number.isFinite(segPrefMatch.index)) {
      seg = seg.slice(0, segPrefMatch.index).trim();
      inMustSection = false;
    } else if (prefMatch && Number.isFinite(prefMatch.index) && !mustMatch) {
      seg = s.slice(0, prefMatch.index).trim();
      inMustSection = false;
    }

    if (seg) buckets.push(seg);
  }

  const stop = new Set([
    "\uD544\uC218",
    "required",
    "\uC790\uACA9\uC694\uAC74",
    "\uC694\uAD6C\uC0AC\uD56D",
    "must",
    "mandatory",
    "\uC6B0\uB300",
    "preferred",
    "\uC0AC\uD56D",
    "\uACBD\uD5D8",
    "\uAC00\uB2A5",
    "\uB2A5\uB825",
    "\uC774\uC0C1",
    "\uC774\uD558",
    "\uC5C5\uBB34",
    "\uAD00\uB828",
    "\uC804\uACF5",
    "\uD559\uB825",
  ]);

  const BAD_TOKEN_RE = /^(?:\uC9C0\uC6D0|\uC9C1\uBB34|\uC790\uACA9\uC694\uAC74|\uC694\uAD6C\uC0AC\uD56D|\uD544\uC218|\uC6B0\uB300|\uC774\uC0C1|\uACBD\uB825|\uAE30\uBC18)$/i;
  const YEAR_TOKEN_RE = /^\d+\s*\uB144(?:\s*\uC774\uC0C1)?$/i;
  const PURE_NUM_TOKEN_RE = /^\d+$/;
  const PERCENT_TOKEN_RE = /^\d+(?:\.\d+)?%$/;

  const skills = [];
  for (const line of buckets) {
    const toks = _tokens(line);
    for (const t of toks) {
      if (stop.has(t)) continue;
      if (BAD_TOKEN_RE.test(t)) continue;
      if (YEAR_TOKEN_RE.test(t)) continue;
      if (PURE_NUM_TOKEN_RE.test(t)) continue;
      if (PERCENT_TOKEN_RE.test(t)) continue;
      skills.push(t);
    }
  }

  const commonBad = new Set([
    "\uCEE4\uBBE4\uB2C8\uCF00\uC774\uC158",
    "\uC791\uC5C5",
    "\uBB38\uC81C\uD574\uACB0",
    "\uC0C1\uB2F4",
    "\uCC45\uC784\uAC10",
    "\uC77C\uC815",
    "\uC548\uC804",
    "\uC131\uC7A5",
  ]);

  const requiredSkills = uniq(skills).filter((x) => x && !commonBad.has(x));
  return { requiredSkills, rawLines: buckets };
}
```

5) 왜 안전한지 (3줄)
- 수정 범위는 `_extractMustHaveFromJD()` 내부로 한정되어 있으며, cap/gate/decision 및 `requiredCoverage` 계산식은 건드리지 않았습니다.
- `safeToString` 의존 제거 후 `String(line || "")`를 사용해 함수 외부 의존 리스크를 제거했습니다.
- 숫자 필터는 `YEAR_TOKEN_RE`, `PURE_NUM_TOKEN_RE`, `PERCENT_TOKEN_RE`만 유지하여 `B2B`, `GA4` 같은 실제 스킬 토큰의 과삭제를 피했습니다.

## PASSMAP Decision Curve Calibration - must-have 추출 품질 개선 지점 조사 (코드 수정 없음)

1) 조사 분류
- 안전 작업
- 코드 수정 없음
- `src/lib/decision/structuralPatterns.js`의 `_extractMustHaveFromJD()` 중심 사실 확인

2) requiredSkills 생성 단계 요약
- 파일/함수: `src/lib/decision/structuralPatterns.js` / `_extractMustHaveFromJD(jdText)`
- 단계 순서
  1. JD 정규화: `_normText()` (line 65~69)
  2. 라인 분할: `split("\n")` (line 171)
  3. must 라인 탐지: 라인에 `필수|required|자격요건|요구사항|must|mandatory` 포함 시 `buckets`에 추가 (line 173~184)
  4. 토큰화: `_tokens(line)` (line 75~86)로 공백 분리 + 길이>=2 또는 숫자/퍼센트 허용
  5. 1차 stopword 제거: `stop` Set 일치 토큰만 제거 (line 187~213)
  6. 2차 필터: `commonBad` Set 일치 토큰만 제거 (line 220~234)
  7. 최종: `requiredSkills = uniq(skills).filter(...)` (line 234)
- 이후 커버리지 계산
  - `requiredCovered = requiredSkills.filter(sk => resumeTokens.includes(sk))`
  - `requiredCoverage = covered/requiredSkills` (line 516~518)

3) 일반 토큰 유입 원인
- 원인 1: must 라인 버킷이 "라인 전체"를 받음
  - 테스트 JD가 1줄에 `지원 직무 + 자격요건 + 우대`를 같이 쓰면, 한 줄 전체가 must 버킷으로 편입됨.
- 원인 2: `_tokens()`가 일반 명사/숫자 토큰을 폭넓게 허용
  - 길이>=2 또는 숫자면 통과하므로 `지원`, `직무`, `3년`, `기반` 등이 살아남음.
- 원인 3: stop/commonBad 목록이 제한적
  - 현재 리스트에 `지원`, `직무`, `기반`, `3년` 계열 제거 규칙이 없음.
- 결과
  - `requiredSkills` 분모가 비의도 토큰으로 커지고 `requiredCoverage`가 과소 계산되어 must-missing flag 발화를 키움.

4) 샘플 2건 토큰 흐름
- `TC_ANALYZE_BASELINE_STRONG_STRATEGY`
  - JD 원문: `지원 직무: 전략기획. 자격요건: 전략기획 경력 3년 이상, 데이터 기반 문제 해결, KPI 설계 및 성과 분석 경험. 우대: ...`
  - must-have 라인 추출(`requiredLines`): 위 한 줄 전체 1개
  - 최종 `requiredSkills` 예: `지원`, `직무`, `전략기획`, `3년`, `데이터`, `기반`, `문제`, `해결`, `kpi`, ...
  - 문제 토큰: `지원`, `직무`, `3년`, `기반`

- `TC_ANALYZE_BASELINE_STRONG_DATA`
  - JD 원문: `지원 직무: 데이터 분석가. 필수: SQL, 대시보드 구축, 지표 설계/분석 3년 이상. 우대: ...`
  - must-have 라인 추출(`requiredLines`): 위 한 줄 전체 1개
  - 최종 `requiredSkills` 예: `지원`, `직무`, `데이터`, `분석가.`, `sql`, `대시보드`, `구축`, `지표`, `설계/분석`, `3년`, ...
  - 문제 토큰: `지원`, `직무`, `3년`

5) 다음 패치 1순위 권고(A/B/C 중 1개)
- **A. `_extractMustHaveFromJD()` 토큰 필터 강화**

6) 왜 그게 최소 수정인지 (3줄)
- `requiredSkills` 오염의 시작점이 `_extractMustHaveFromJD()` 1함수에 집중되어 있음.
- 이 함수에서 정제하면 `requiredCoverage`와 downstream flag/risk/pseudo gate가 동시에 개선됨.
- `src/lib/decision/structuralPatterns.js` 1파일/1함수 수정으로 효과 범위를 최대화할 수 있음.

## PASSMAP must-have 추출 품질 개선 PATCH 1

1. 수정 분류
- 결정적 패치

2. 영향 파일
- src/lib/decision/structuralPatterns.js

3. 정확한 수정 위치
- 파일 경로: src/lib/decision/structuralPatterns.js
- 함수명: _extractMustHaveFromJD()
- 앵커 기준: unction _extractMustHaveFromJD(jdText) { 시작 ~ eturn { requiredSkills, rawLines: buckets }; 구간

4. 붙여넣기 가능한 최종 코드
`js
function _extractMustHaveFromJD(jdText) {
  // Extract must-have tokens from must/required context lines.
  const jd = _normText(jdText);
  if (!jd) return { requiredSkills: [], rawLines: [] };

  const lines = jd.split("\n").map((x) => x.trim()).filter(Boolean);

  const MUST_MARKER_RE = /(?:\uD544\uC218|required|\uC790\uACA9\uC694\uAC74|\uC694\uAD6C\uC0AC\uD56D|must|mandatory)/i;
  const PREFERRED_MARKER_RE = /(?:\uC6B0\uB300|preferred|plus|nice\s*to\s*have)/i;

  const _sliceMustSegment = (line) => {
    const s = safeToString(line || "");
    if (!s) return "";

    const mustMatch = s.match(MUST_MARKER_RE);
    if (!mustMatch || !Number.isFinite(mustMatch.index)) return "";

    // Keep only content after must marker.
    let seg = s.slice(mustMatch.index).trim();
    if (!seg) return "";

    // Exclude preferred section from must bucket.
    const prefMatch = seg.match(PREFERRED_MARKER_RE);
    if (prefMatch && Number.isFinite(prefMatch.index) && prefMatch.index > 0) {
      seg = seg.slice(0, prefMatch.index).trim();
    }

    return seg;
  };

  const buckets = [];
  for (const line of lines) {
    const seg = _sliceMustSegment(line);
    if (seg) buckets.push(seg);
  }

  const stop = new Set([
    "\uD544\uC218",
    "required",
    "\uC790\uACA9\uC694\uAC74",
    "\uC694\uAD6C\uC0AC\uD56D",
    "must",
    "mandatory",
    "\uC6B0\uB300",
    "preferred",
    "\uC0AC\uD56D",
    "\uACBD\uD5D8",
    "\uAC00\uB2A5",
    "\uB2A5\uB825",
    "\uC774\uC0C1",
    "\uC774\uD558",
    "\uC5C5\uBB34",
    "\uAD00\uB828",
    "\uC804\uACF5",
    "\uD559\uB825",
  ]);

  const BAD_TOKEN_RE = /^(?:\uC9C0\uC6D0|\uC9C1\uBB34|\uC790\uACA9\uC694\uAC74|\uC694\uAD6C\uC0AC\uD56D|\uD544\uC218|\uC6B0\uB300|\uC774\uC0C1|\uACBD\uB825|\uAE30\uBC18)$/i;
  const YEAR_TOKEN_RE = /^\d+\s*\uB144(?:\s*\uC774\uC0C1)?$/i;
  const PURE_NUM_TOKEN_RE = /^\d+$/;
  const PERCENT_TOKEN_RE = /^\d+(?:\.\d+)?%$/;
  const KEEP_ABBR_RE = /^[A-Z]{2,6}$/;

  const skills = [];
  for (const line of buckets) {
    const toks = _tokens(line);
    for (const t of toks) {
      if (stop.has(t)) continue;
      if (BAD_TOKEN_RE.test(t)) continue;
      if (YEAR_TOKEN_RE.test(t)) continue;
      if (PURE_NUM_TOKEN_RE.test(t)) continue;
      if (PERCENT_TOKEN_RE.test(t)) continue;
      if (/\d/.test(t) && !KEEP_ABBR_RE.test(t.toUpperCase())) continue;
      skills.push(t);
    }
  }

  const commonBad = new Set([
    "\uCEE4\uBBE4\uB2C8\uCF00\uC774\uC158",
    "\uC791\uC5C5",
    "\uBB38\uC81C\uD574\uACB0",
    "\uC0C1\uB2F4",
    "\uCC45\uC784\uAC10",
    "\uC77C\uC815",
    "\uC548\uC804",
    "\uC131\uC7A5",
    "\uAE30\uD68D",
    "\uC6B4\uC601",
  ]);

  const requiredSkills = uniq(skills).filter((x) => x && !commonBad.has(x));
  return { requiredSkills, rawLines: buckets };
}

// ------------------------------
const OWNERSHIP_WEAK_VERBS = [
  "李몄뿬",
  "吏??,
  "蹂댁“",
`

5. 왜 안전한지 3줄
- 수정 범위를 _extractMustHaveFromJD() 내부로만 제한해 다른 rule/score/cap 로직 영향 없이 적용했다.
- 전역 _tokens() 및 equiredCoverage 계산식은 변경하지 않아 기존 구조를 유지했다.
- must segment 절단과 후처리 필터만 추가해 오염 토큰 축소 목적에 직접 대응한다.

6. 적용 후 기대 변화 5줄
- equiredSkills 분모에서 일반 토큰(지원/직무/기반/연차 숫자) 비중이 줄어든다.
- 동일 입력에서 equiredCoverage가 상대적으로 개선될 가능성이 높다.
- MUST_HAVE_SKILL_MISSING flag 과발화 빈도 완화가 기대된다.
- PSEUDO_GATE__ROLE_SKILL__MUST_HAVE_MISSING 진입 케이스가 일부 감소할 수 있다.
- strong/borderline 케이스의 cap 병목(95 pseudo gate) 완화 여지가 생긴다.

추가(코드 수정 없이 예측)
- TC_ANALYZE_BASELINE_STRONG_STRATEGY: 먼저 줄어들 가능성이 큰 오염 토큰은 지원, 직무, 3년, 기반.
- TC_ANALYZE_BASELINE_STRONG_DATA: 먼저 줄어들 가능성이 큰 오염 토큰은 지원, 직무, 3년.

## PASSMAP must-have 추출 품질 개선 PATCH 1 (정정본)

1. 수정 분류
- 결정적 패치

2. 영향 파일
- src/lib/decision/structuralPatterns.js

3. 정확한 수정 위치
- 파일 경로: src/lib/decision/structuralPatterns.js
- 함수명: _extractMustHaveFromJD()
- 앵커 기준: function _extractMustHaveFromJD(jdText) 시작 ~ return { requiredSkills, rawLines: buckets };

4. 붙여넣기 가능한 최종 코드
~~~js
function _extractMustHaveFromJD(jdText) {
  // Extract must-have tokens from must/required context lines.
  const jd = _normText(jdText);
  if (!jd) return { requiredSkills: [], rawLines: [] };

  const lines = jd.split("\n").map((x) => x.trim()).filter(Boolean);

  const MUST_MARKER_RE = /(?:\uD544\uC218|required|\uC790\uACA9\uC694\uAC74|\uC694\uAD6C\uC0AC\uD56D|must|mandatory)/i;
  const PREFERRED_MARKER_RE = /(?:\uC6B0\uB300|preferred|plus|nice\s*to\s*have)/i;

  const _sliceMustSegment = (line) => {
    const s = safeToString(line || "");
    if (!s) return "";

    const mustMatch = s.match(MUST_MARKER_RE);
    if (!mustMatch || !Number.isFinite(mustMatch.index)) return "";

    // Keep only content after must marker.
    let seg = s.slice(mustMatch.index).trim();
    if (!seg) return "";

    // Exclude preferred section from must bucket.
    const prefMatch = seg.match(PREFERRED_MARKER_RE);
    if (prefMatch && Number.isFinite(prefMatch.index) && prefMatch.index > 0) {
      seg = seg.slice(0, prefMatch.index).trim();
    }

    return seg;
  };

  const buckets = [];
  for (const line of lines) {
    const seg = _sliceMustSegment(line);
    if (seg) buckets.push(seg);
  }

  const stop = new Set([
    "\uD544\uC218",
    "required",
    "\uC790\uACA9\uC694\uAC74",
    "\uC694\uAD6C\uC0AC\uD56D",
    "must",
    "mandatory",
    "\uC6B0\uB300",
    "preferred",
    "\uC0AC\uD56D",
    "\uACBD\uD5D8",
    "\uAC00\uB2A5",
    "\uB2A5\uB825",
    "\uC774\uC0C1",
    "\uC774\uD558",
    "\uC5C5\uBB34",
    "\uAD00\uB828",
    "\uC804\uACF5",
    "\uD559\uB825",
  ]);

  const BAD_TOKEN_RE = /^(?:\uC9C0\uC6D0|\uC9C1\uBB34|\uC790\uACA9\uC694\uAC74|\uC694\uAD6C\uC0AC\uD56D|\uD544\uC218|\uC6B0\uB300|\uC774\uC0C1|\uACBD\uB825|\uAE30\uBC18)$/i;
  const YEAR_TOKEN_RE = /^\d+\s*\uB144(?:\s*\uC774\uC0C1)?$/i;
  const PURE_NUM_TOKEN_RE = /^\d+$/;
  const PERCENT_TOKEN_RE = /^\d+(?:\.\d+)?%$/;
  const KEEP_ABBR_RE = /^[A-Z]{2,6}$/;

  const skills = [];
  for (const line of buckets) {
    const toks = _tokens(line);
    for (const t of toks) {
      if (stop.has(t)) continue;
      if (BAD_TOKEN_RE.test(t)) continue;
      if (YEAR_TOKEN_RE.test(t)) continue;
      if (PURE_NUM_TOKEN_RE.test(t)) continue;
      if (PERCENT_TOKEN_RE.test(t)) continue;
      if (/\d/.test(t) && !KEEP_ABBR_RE.test(t.toUpperCase())) continue;
      skills.push(t);
    }
  }

  const commonBad = new Set([
    "\uCEE4\uBBE4\uB2C8\uCF00\uC774\uC158",
    "\uC791\uC5C5",
    "\uBB38\uC81C\uD574\uACB0",
    "\uC0C1\uB2F4",
    "\uCC45\uC784\uAC10",
    "\uC77C\uC815",
    "\uC548\uC804",
    "\uC131\uC7A5",
    "\uAE30\uD68D",
    "\uC6B4\uC601",
  ]);

  const requiredSkills = uniq(skills).filter((x) => x && !commonBad.has(x));
  return { requiredSkills, rawLines: buckets };
}

// ------------------------------
const OWNERSHIP_WEAK_VERBS = [
  "李몄뿬",
  "吏??,
  "蹂댁“",
~~~

5. 왜 안전한지 3줄
- 수정 범위를 _extractMustHaveFromJD() 내부로만 제한해 다른 rule/score/cap 로직 영향 없이 적용했다.
- 전역 _tokens() 및 requiredCoverage 계산식은 변경하지 않아 기존 구조를 유지했다.
- must segment 절단과 후처리 필터만 추가해 오염 토큰 축소 목적에 직접 대응한다.

6. 적용 후 기대 변화 5줄
- requiredSkills 분모 축소
- requiredCoverage 개선 가능
- MUST_HAVE_SKILL_MISSING flag 과발화 완화
- PSEUDO_GATE__ROLE_SKILL__MUST_HAVE_MISSING 빈도 감소 기대
- strong/borderline 케이스 cap 병목 완화 기대

추가(코드 수정 없이 예측)
- TC_ANALYZE_BASELINE_STRONG_STRATEGY: 지원, 직무, 3년, 기반 토큰이 먼저 줄어들 가능성이 큼
- TC_ANALYZE_BASELINE_STRONG_DATA: 지원, 직무, 3년 토큰이 먼저 줄어들 가능성이 큼


## PASSMAP must-have ?? ?? ?? PATCH 1 (???? ??)

4. ???? ??? ?? ??
~~~js
function _extractMustHaveFromJD(jdText) {
  // Extract must-have tokens from must/required context lines.
  const jd = _normText(jdText);
  if (!jd) return { requiredSkills: [], rawLines: [] };

  const lines = jd.split("\n").map((x) => x.trim()).filter(Boolean);

  const MUST_MARKER_RE = /(?:\uD544\uC218|required|\uC790\uACA9\uC694\uAC74|\uC694\uAD6C\uC0AC\uD56D|must|mandatory)/i;
  const PREFERRED_MARKER_RE = /(?:\uC6B0\uB300|preferred|plus|nice\s*to\s*have)/i;

  const _sliceMustSegment = (line) => {
    const s = safeToString(line || "");
    if (!s) return "";

    const mustMatch = s.match(MUST_MARKER_RE);
    if (!mustMatch || !Number.isFinite(mustMatch.index)) return "";

    // Keep only content after must marker.
    let seg = s.slice(mustMatch.index).trim();
    if (!seg) return "";

    // Exclude preferred section from must bucket.
    const prefMatch = seg.match(PREFERRED_MARKER_RE);
    if (prefMatch && Number.isFinite(prefMatch.index) && prefMatch.index > 0) {
      seg = seg.slice(0, prefMatch.index).trim();
    }

    return seg;
  };

  const buckets = [];
  for (const line of lines) {
    const seg = _sliceMustSegment(line);
    if (seg) buckets.push(seg);
  }

  const stop = new Set([
    "\uD544\uC218",
    "required",
    "\uC790\uACA9\uC694\uAC74",
    "\uC694\uAD6C\uC0AC\uD56D",
    "must",
    "mandatory",
    "\uC6B0\uB300",
    "preferred",
    "\uC0AC\uD56D",
    "\uACBD\uD5D8",
    "\uAC00\uB2A5",
    "\uB2A5\uB825",
    "\uC774\uC0C1",
    "\uC774\uD558",
    "\uC5C5\uBB34",
    "\uAD00\uB828",
    "\uC804\uACF5",
    "\uD559\uB825",
  ]);

  const BAD_TOKEN_RE = /^(?:\uC9C0\uC6D0|\uC9C1\uBB34|\uC790\uACA9\uC694\uAC74|\uC694\uAD6C\uC0AC\uD56D|\uD544\uC218|\uC6B0\uB300|\uC774\uC0C1|\uACBD\uB825|\uAE30\uBC18)$/i;
  const YEAR_TOKEN_RE = /^\d+\s*\uB144(?:\s*\uC774\uC0C1)?$/i;
  const PURE_NUM_TOKEN_RE = /^\d+$/;
  const PERCENT_TOKEN_RE = /^\d+(?:\.\d+)?%$/;
  const KEEP_ABBR_RE = /^[A-Z]{2,6}$/;

  const skills = [];
  for (const line of buckets) {
    const toks = _tokens(line);
    for (const t of toks) {
      if (stop.has(t)) continue;
      if (BAD_TOKEN_RE.test(t)) continue;
      if (YEAR_TOKEN_RE.test(t)) continue;
      if (PURE_NUM_TOKEN_RE.test(t)) continue;
      if (PERCENT_TOKEN_RE.test(t)) continue;
      if (/\d/.test(t) && !KEEP_ABBR_RE.test(t.toUpperCase())) continue;
      skills.push(t);
    }
  }

  const commonBad = new Set([
    "\uCEE4\uBBE4\uB2C8\uCF00\uC774\uC158",
    "\uC791\uC5C5",
    "\uBB38\uC81C\uD574\uACB0",
    "\uC0C1\uB2F4",
    "\uCC45\uC784\uAC10",
    "\uC77C\uC815",
    "\uC548\uC804",
    "\uC131\uC7A5",
    "\uAE30\uD68D",
    "\uC6B4\uC601",
  ]);

  const requiredSkills = uniq(skills).filter((x) => x && !commonBad.has(x));
  return { requiredSkills, rawLines: buckets }
~~~

## PASSMAP must-have 추출 품질 개선 PATCH 1 (재제출 / 함수 단독)

1. 수정 분류
- 결정적 패치

2. 영향 파일
- src/lib/decision/structuralPatterns.js

3. 정확한 수정 위치
- 파일 경로: src/lib/decision/structuralPatterns.js
- 함수명: _extractMustHaveFromJD()
- 앵커 기준: `function _extractMustHaveFromJD(jdText) {` 시작 ~ 함수 닫힘 `}`

4. _extractMustHaveFromJD() 함수 전체 코드
```js
function _extractMustHaveFromJD(jdText) {
  // 목표: "필수/Required/자격요건" 문맥에서 스킬 토큰만 뽑아냄(정확도 100% 아님)
  const jd = _normText(jdText);
  if (!jd) return { requiredSkills: [], rawLines: [] };

  const lines = jd.split("\n").map((x) => x.trim()).filter(Boolean);

  const MUST_MARKER_RE = /(필수|required|자격요건|요구사항|must|mandatory)/i;
  const PREFERRED_MARKER_RE = /(우대|preferred|plus|nice\s*to\s*have)/i;

  const _sliceMustSegment = (line) => {
    const s = String(line || "");
    if (!s) return "";

    const mustMatch = s.match(MUST_MARKER_RE);
    if (!mustMatch || !Number.isFinite(mustMatch.index)) return "";

    // must marker 이후 구간만 사용
    let seg = s.slice(mustMatch.index).trim();
    if (!seg) return "";

    // preferred marker가 뒤에 있으면 그 이전까지만 must로 취급
    const prefMatch = seg.match(PREFERRED_MARKER_RE);
    if (prefMatch && Number.isFinite(prefMatch.index) && prefMatch.index > 0) {
      seg = seg.slice(0, prefMatch.index).trim();
    }

    return seg;
  };

  const buckets = [];
  for (const line of lines) {
    const seg = _sliceMustSegment(line);
    if (seg) buckets.push(seg);
  }

  // 라인에서 토큰화하고 너무 일반적인 단어 제거(간단)
  const stop = new Set([
    "필수",
    "required",
    "자격요건",
    "요구사항",
    "must",
    "mandatory",
    "우대",
    "preferred",
    "사항",
    "경험",
    "가능",
    "능력",
    "이상",
    "이하",
    "업무",
    "관련",
    "전공",
    "학력",
  ]);

  const BAD_TOKEN_RE = /^(지원|직무|자격요건|요구사항|필수|우대|이상|경력|기반)$/i;
  const YEAR_TOKEN_RE = /^\d+\s*년(?:\s*이상)?$/i; // 3년, 2년 이상
  const PURE_NUM_TOKEN_RE = /^\d+$/; // 3, 2024
  const PERCENT_TOKEN_RE = /^\d+(?:\.\d+)?%$/; // 10%, 2.5%

  const skills = [];
  for (const line of buckets) {
    const toks = _tokens(line);
    for (const t of toks) {
      if (stop.has(t)) continue;
      if (BAD_TOKEN_RE.test(t)) continue;
      // 이번 라운드: 숫자/연차/퍼센트만 보수적으로 제거 (B2B, GA4, SQL 등은 유지)
      if (YEAR_TOKEN_RE.test(t)) continue;
      if (PURE_NUM_TOKEN_RE.test(t)) continue;
      if (PERCENT_TOKEN_RE.test(t)) continue;
      skills.push(t);
    }
  }

  // 중복 제거 + 너무 흔한 일반어 추가 필터(최소)
  const commonBad = new Set([
    "커뮤니케이션",
    "작업",
    "문제해결",
    "상담",
    "책임감",
    "일정",
    "안전",
    "성장",
    "기획",
    "운영",
  ]);

  const requiredSkills = uniq(skills).filter((x) => x && !commonBad.has(x));
  return { requiredSkills, rawLines: buckets };
}
```

5. 왜 안전한지 3줄
- 수정 범위를 `_extractMustHaveFromJD()` 1함수로만 한정해 영향 범위를 최소화했다.
- `requiredCoverage` 계산식과 다른 risk/gate/cap 경로는 건드리지 않았다.
- must segment 절단 + 최소 토큰 필터만 적용해 오염 토큰 축소 목적에 직접 대응한다.


## PASSMAP must-have ?? ?? ?? PATCH 1 (commonBad ??)

1. ?? ??
- ??? ??

2. ?? ??
- src/lib/decision/structuralPatterns.js

3. ??? ?? ??
- ?? ??: src/lib/decision/structuralPatterns.js
- ???: _extractMustHaveFromJD()
- ?? ??: commonBad Set ?? ?? ??

4. _extractMustHaveFromJD() ?? ?? ??

```js
function _extractMustHaveFromJD(jdText) {
  // Extract must-have tokens from must/required context lines.
  const jd = _normText(jdText);
  if (!jd) return { requiredSkills: [], rawLines: [] };

  const lines = jd.split("\n").map((x) => x.trim()).filter(Boolean);

  const MUST_MARKER_RE = /(?:\uD544\uC218|required|\uC790\uACA9\uC694\uAC74|\uC694\uAD6C\uC0AC\uD56D|must|mandatory)/i;
  const PREFERRED_MARKER_RE = /(?:\uC6B0\uB300|preferred|plus|nice\s*to\s*have)/i;

  const _sliceMustSegment = (line) => {
    const s = safeToString(line || "");
    if (!s) return "";

    const mustMatch = s.match(MUST_MARKER_RE);
    if (!mustMatch || !Number.isFinite(mustMatch.index)) return "";

    // Keep only content after must marker.
    let seg = s.slice(mustMatch.index).trim();
    if (!seg) return "";

    // Exclude preferred section from must bucket.
    const prefMatch = seg.match(PREFERRED_MARKER_RE);
    if (prefMatch && Number.isFinite(prefMatch.index) && prefMatch.index > 0) {
      seg = seg.slice(0, prefMatch.index).trim();
    }

    return seg;
  };

  const buckets = [];
  for (const line of lines) {
    const seg = _sliceMustSegment(line);
    if (seg) buckets.push(seg);
  }

  const stop = new Set([
    "\uD544\uC218",
    "required",
    "\uC790\uACA9\uC694\uAC74",
    "\uC694\uAD6C\uC0AC\uD56D",
    "must",
    "mandatory",
    "\uC6B0\uB300",
    "preferred",
    "\uC0AC\uD56D",
    "\uACBD\uD5D8",
    "\uAC00\uB2A5",
    "\uB2A5\uB825",
    "\uC774\uC0C1",
    "\uC774\uD558",
    "\uC5C5\uBB34",
    "\uAD00\uB828",
    "\uC804\uACF5",
    "\uD559\uB825",
  ]);

  const BAD_TOKEN_RE = /^(?:\uC9C0\uC6D0|\uC9C1\uBB34|\uC790\uACA9\uC694\uAC74|\uC694\uAD6C\uC0AC\uD56D|\uD544\uC218|\uC6B0\uB300|\uC774\uC0C1|\uACBD\uB825|\uAE30\uBC18)$/i;
  const YEAR_TOKEN_RE = /^\d+\s*\uB144(?:\s*\uC774\uC0C1)?$/i;
  const PURE_NUM_TOKEN_RE = /^\d+$/;
  const PERCENT_TOKEN_RE = /^\d+(?:\.\d+)?%$/;
  const KEEP_ABBR_RE = /^[A-Z]{2,6}$/;

  const skills = [];
  for (const line of buckets) {
    const toks = _tokens(line);
    for (const t of toks) {
      if (stop.has(t)) continue;
      if (BAD_TOKEN_RE.test(t)) continue;
      if (YEAR_TOKEN_RE.test(t)) continue;
      if (PURE_NUM_TOKEN_RE.test(t)) continue;
      if (PERCENT_TOKEN_RE.test(t)) continue;
      if (/\d/.test(t) && !KEEP_ABBR_RE.test(t.toUpperCase())) continue;
      skills.push(t);
    }
  }

  const commonBad = new Set([
    "\uCEE4\uBBE4\uB2C8\uCF00\uC774\uC158",
    "\uC791\uC5C5",
    "\uBB38\uC81C\uD574\uACB0",
    "\uC0C1\uB2F4",
    "\uCC45\uC784\uAC10",
    "\uC77C\uC815",
    "\uC548\uC804",
    "\uC131\uC7A5",
  ]);

  const requiredSkills = uniq(skills).filter((x) => x && !commonBad.has(x));
  return { requiredSkills, rawLines: buckets }
```

5. ? ???? 3?
- ?? ??? commonBad ?? 2?(??/??) ???? ??? ?? ??? ?????.
- requiredCoverage ???, gate/cap/score ??? ???? ???.
- ?? ?? ???? ??? requiredSkills ??(????) ??? ???.

---

## PASSMAP PATCH FINAL (2026-03-07) - `_extractMustHaveFromJD()` 승인본

1. 수정 분류
- 1파일 / 1함수 최소 수정
- `_extractMustHaveFromJD()` 내부 로직만 수정
- cap/gate/decision 및 `requiredCoverage` 계산식 수정 없음

2. 영향 파일
- `src/lib/decision/structuralPatterns.js`

3. 정확한 수정 위치
- `src/lib/decision/structuralPatterns.js`
- 함수: `_extractMustHaveFromJD(jdText)` 전체

4. `_extractMustHaveFromJD()` 함수 전체 코드

```js
function _extractMustHaveFromJD(jdText) {
  const jd = _normText(jdText);
  if (!jd) return { requiredSkills: [], rawLines: [] };

  const lines = jd.split("\n").map((x) => x.trim()).filter(Boolean);

  const MUST_MARKER_RE = /(?:\uD544\uC218|required|\uC790\uACA9\uC694\uAC74|\uC694\uAD6C\uC0AC\uD56D|must|mandatory)/i;
  const PREFERRED_MARKER_RE = /(?:\uC6B0\uB300|preferred|plus|nice\s*to\s*have)/i;

  const buckets = [];
  let inMustSection = false;

  for (const line of lines) {
    const s = String(line || "").trim();
    if (!s) continue;

    const mustMatch = s.match(MUST_MARKER_RE);
    const prefMatch = s.match(PREFERRED_MARKER_RE);

    // Ignore lines where preferred marker appears before must marker.
    if (
      prefMatch &&
      Number.isFinite(prefMatch.index) &&
      mustMatch &&
      Number.isFinite(mustMatch.index) &&
      prefMatch.index <= mustMatch.index
    ) {
      inMustSection = false;
      continue;
    }

    let seg = "";

    if (mustMatch && Number.isFinite(mustMatch.index)) {
      inMustSection = true;
      const start = mustMatch.index + mustMatch[0].length;
      seg = s.slice(start).trim();
    } else if (inMustSection) {
      seg = s;
    } else {
      continue;
    }

    const segPrefMatch = seg.match(PREFERRED_MARKER_RE);
    if (segPrefMatch && Number.isFinite(segPrefMatch.index)) {
      seg = seg.slice(0, segPrefMatch.index).trim();
      inMustSection = false;
    } else if (prefMatch && Number.isFinite(prefMatch.index) && !mustMatch) {
      seg = s.slice(0, prefMatch.index).trim();
      inMustSection = false;
    }

    if (seg) buckets.push(seg);
  }

  const stop = new Set([
    "\uD544\uC218",
    "required",
    "\uC790\uACA9\uC694\uAC74",
    "\uC694\uAD6C\uC0AC\uD56D",
    "must",
    "mandatory",
    "\uC6B0\uB300",
    "preferred",
    "\uC0AC\uD56D",
    "\uACBD\uD5D8",
    "\uAC00\uB2A5",
    "\uB2A5\uB825",
    "\uC774\uC0C1",
    "\uC774\uD558",
    "\uC5C5\uBB34",
    "\uAD00\uB828",
    "\uC804\uACF5",
    "\uD559\uB825",
  ]);

  const BAD_TOKEN_RE = /^(?:\uC9C0\uC6D0|\uC9C1\uBB34|\uC790\uACA9\uC694\uAC74|\uC694\uAD6C\uC0AC\uD56D|\uD544\uC218|\uC6B0\uB300|\uC774\uC0C1|\uACBD\uB825|\uAE30\uBC18)$/i;
  const YEAR_TOKEN_RE = /^\d+\s*\uB144(?:\s*\uC774\uC0C1)?$/i;
  const PURE_NUM_TOKEN_RE = /^\d+$/;
  const PERCENT_TOKEN_RE = /^\d+(?:\.\d+)?%$/;

  const skills = [];
  for (const line of buckets) {
    const toks = _tokens(line);
    for (const t of toks) {
      if (stop.has(t)) continue;
      if (BAD_TOKEN_RE.test(t)) continue;
      if (YEAR_TOKEN_RE.test(t)) continue;
      if (PURE_NUM_TOKEN_RE.test(t)) continue;
      if (PERCENT_TOKEN_RE.test(t)) continue;
      skills.push(t);
    }
  }

  const commonBad = new Set([
    "\uCEE4\uBBE4\uB2C8\uCF00\uC774\uC158",
    "\uC791\uC5C5",
    "\uBB38\uC81C\uD574\uACB0",
    "\uC0C1\uB2F4",
    "\uCC45\uC784\uAC10",
    "\uC77C\uC815",
    "\uC548\uC804",
    "\uC131\uC7A5",
  ]);

  const requiredSkills = uniq(skills).filter((x) => x && !commonBad.has(x));
  return { requiredSkills, rawLines: buckets };
}
```

5. 왜 안전한지 3줄
- 수정 범위를 `_extractMustHaveFromJD()` 내부로만 제한해 다른 의사결정 경로 영향이 없다.
- `String(line || "")`를 사용해 `safeToString` 의존 없이 동일 목적을 달성한다.
- 숫자 필터는 `YEAR_TOKEN_RE`, `PURE_NUM_TOKEN_RE`, `PERCENT_TOKEN_RE`만 유지해 과삭제를 줄인다.

## 2026-03-08 OCR->JD textarea 브리지 로그 진단 패치 (append-only)

### 수정 분류
- 진단용 로그 추가 (append-only)
- 코드 경로/구조/리팩토링 변경 없음

### 영향 파일
- src/lib/extract/extractTextFromFile.js
- src/components/input/InputFlow.jsx
- src/App.jsx

### 정확한 삽입 위치(파일 / 함수 / 앵커)
- `src/lib/extract/extractTextFromFile.js`
  - 함수: `extractTextFromFile(file, kind)`
  - 앵커: `let source = "local";` 바로 아래, 그리고 각 `return` 직전
- `src/components/input/InputFlow.jsx`
  - 함수: `handleAttachJDFile`
  - 앵커: `onExtract("jd", res.text, res.meta);` 직전
- `src/App.jsx`
  - 위치 1: `InputFlow` prop `onExtract={(kind, text, meta) => { ... }}` 내부
  - 앵커: `if (k === "jd") { imeCommit("jd", v); ... }` 직전
  - 위치 2: App 내부 훅 영역
  - 앵커: `function imeCommit(key, value) { ... }` 바로 아래

### 붙여넣기 가능한 코드
1) `src/lib/extract/extractTextFromFile.js`
```js
const __logExtractResult = (result) => {
  console.log("[OCR->extract]", {
    ok: result?.ok,
    textLen: typeof result?.text === "string" ? result.text.length : null,
    textPreview: typeof result?.text === "string" ? result.text.slice(0, 120) : null,
    meta: result?.meta || null,
  });
};
```
```js
const result = { ok: true, text, meta };
__logExtractResult(result);
return result;
```
(동일 패턴으로 `extractTextFromFile`의 모든 반환 분기에 삽입)

2) `src/components/input/InputFlow.jsx`
```js
console.log("[OCR->InputFlow]", {
  ok: res?.ok,
  textLen: typeof res?.text === "string" ? res.text.length : null,
  textPreview: typeof res?.text === "string" ? res.text.slice(0, 120) : null,
  kind: "jd",
});
```

3) `src/App.jsx`
```js
console.log("[App.onExtract]", {
  k,
  valueLen: typeof v === "string" ? v.length : null,
  preview: typeof v === "string" ? v.slice(0, 120) : null,
});
console.log("[App.beforeImeCommit]", {
  target: "jd",
  valueLen: typeof v === "string" ? v.length : null,
});
```
```js
useEffect(() => {
  const stateJd = String(state?.jd ?? "");
  const viewJd = getImeValue("jd", stateJd);
  const draftJd = String(imeDraft?.jd ?? "");
  console.log("[App.JDTextareaBinding]", {
    stateLen: stateJd.length,
    draftLen: draftJd.length,
    viewLen: viewJd.length,
    stateEqView: stateJd === viewJd,
  });
}, [state?.jd, imeDraft?.jd]);
```

### 테스트 후 판정표 (로그 기준)
- `[OCR->extract]` 미출력
  - 판정: `extractTextFromFile()` 진입 전(파일 선택/핸들러 연결) 문제
- `[OCR->extract]`는 출력되나 `ok:false` 또는 `textLen:0`
  - 판정: 추출 단계 실패 또는 계약 불만족(목표 1 실패)
- `[OCR->extract] ok:true,textLen>0`인데 `[OCR->InputFlow]` 미출력
  - 판정: `InputFlow.handleAttachJDFile`에서 조건 `res.ok && res.text?.trim()` 미통과 또는 핸들러 미진입(목표 2 실패)
- `[OCR->InputFlow]` 출력되나 `[App.onExtract]` 미출력
  - 판정: `onExtract` prop 전달/호출 경로 단절(목표 3 실패)
- `[App.onExtract]` 출력 + `k:"jd"`인데 `[App.beforeImeCommit]` 미출력
  - 판정: `k === "jd"` 분기 미진입(목표 4 일부 실패)
- `[App.beforeImeCommit]` 출력되나 `[App.JDTextareaBinding] stateLen`이 갱신되지 않음
  - 판정: `imeCommit("jd", v)` 이후 state 반영 경로 문제(목표 4 실패)
- `[App.JDTextareaBinding]`에서 `stateEqView:false`가 지속
  - 판정: 최종 textarea가 `imeCommit` 반영 state와 다른 값 소스(IME draft 우선 경로 포함)를 보고 있음(목표 5 실패)
- `[App.JDTextareaBinding]`에서 `stateEqView:true` + `stateLen/viewLen` 동시 증가
  - 판정: 최종 textarea 바인딩 정상(목표 5 통과)

### 로그 제거 여부
- 이 로그는 진단 완료 후 **삭제 필요**.
- 이유: 운영 콘솔 노이즈 증가 + 텍스트 프리뷰 노출 가능성.

## 2026-03-08 OCR 브리지 진단 로그 적용 결과 (재기록)

1. 수정 분류
- 진단용 append-only 로그 추가
- 구조/리팩토링/동작 로직 변경 없음

2. 영향 파일
- src/lib/extract/extractTextFromFile.js
- src/components/input/InputFlow.jsx
- src/App.jsx

3. 정확한 삽입 위치
- extractTextFromFile.js
  - 함수: extractTextFromFile(file, kind)
  - 위치: `let source = "local";` 아래에 `__logExtractResult` 선언
  - 위치: 해당 함수의 각 `result return` 직전 `__logExtractResult(result)` 호출
- InputFlow.jsx
  - 함수: handleAttachJDFile
  - 위치: `onExtract("jd", res.text, res.meta)` 바로 위
- App.jsx
  - 위치: InputFlow prop의 `onExtract` 내부
  - 위치: `k===\"jd\"` 분기에서 `imeCommit("jd", v)` 직전
  - 위치: App hook 영역, `imeCommit` 함수 바로 아래 `useEffect` 추가

4. 적용된 코드
- [OCR->extract] / [OCR->InputFlow] / [App.onExtract] / [App.beforeImeCommit] / [App.JDTextareaBinding] 로그 적용 완료
- 로그 포맷은 요청 본문과 동일 키(`ok`, `textLen`, `textPreview`, `meta`, `k`, `valueLen`, `stateEqView` 등) 사용

5. 정상 로그 순서(테스트 시)
- 정상 경로 기준:
  1) `[OCR->extract]` (ok:true, textLen>0)
  2) `[OCR->InputFlow]` (ok:true, textLen>0, kind:"jd")
  3) `[App.onExtract]` (k:"jd", valueLen>0)
  4) `[App.beforeImeCommit]` (target:"jd", valueLen>0)
  5) `[App.JDTextareaBinding]` (stateLen/viewLen 증가, stateEqView:true)
- 위 순서 중 특정 로그가 빠진 지점이 곧 브리지 단절 지점

중요
- 본 로그는 진단용이므로 문제 확인 후 삭제 필요.

## 2026-03-08 OCR 호출/응답 계약 진단 로그 추가 (append-only)

1. 수정 분류
- 진단용 append-only 로그 추가
- 구조 변경/리팩토링/동작 로직 변경 없음

2. 영향 파일
- src/lib/extract/extractTextFromFile.js
- api/ocr.js

3. 삽입 위치
- src/lib/extract/extractTextFromFile.js
  - 함수: _extractImageByOCR(file)
  - 위치: `/api/ocr` fetch 직후
  - 위치: json 파싱 직후
- api/ocr.js
  - 함수: default async function handler(req, res)
  - 위치: Google Vision 응답 파싱 직후(`one`에서 text 추출 직전)
  - 위치: 최종 응답 직전(200/400/500 반환 경로)

4. 붙여넣기 가능한 코드
- extractTextFromFile.js
```js
console.log("[OCR.fetch.response]", {
  status: response?.status,
  ok: response?.ok,
  url: response?.url || "/api/ocr",
});
```
```js
console.log("[OCR.fetch.body]", {
  ok: data?.ok,
  textLen: typeof data?.text === "string" ? data.text.length : null,
  textPreview: typeof data?.text === "string" ? data.text.slice(0, 120) : null,
  error: data?.error || null,
  meta: data?.meta || null,
});
```

- api/ocr.js
```js
console.log("[api/ocr.raw]", {
  hasFullText: Boolean(result?.fullTextAnnotation?.text),
  fullTextLen: typeof result?.fullTextAnnotation?.text === "string"
    ? result.fullTextAnnotation.text.length
    : 0,
  firstTextLen: typeof result?.textAnnotations?.[0]?.description === "string"
    ? result.textAnnotations[0].description.length
    : 0,
});
```
```js
console.log("[api/ocr.return]", {
  ok,
  textLen: typeof text === "string" ? text.length : 0,
  textPreview: typeof text === "string" ? text.slice(0, 120) : null,
  error: error || null,
});
```

5. 로그별 판정표
- `[OCR.fetch.response]` 없음
  - 판정: 브라우저 단 fetch 이전 단계(엔드포인트 계산/요청 진입) 문제
- `[OCR.fetch.response]` 있고 `ok:false`
  - 판정: API 라우트 응답 실패(HTTP 레벨)
- `[OCR.fetch.body]`에서 `ok:false`, `error` 존재
  - 판정: API 계약상 OCR 실패 응답
- `[api/ocr.raw]`에서 `hasFullText:false`, `firstTextLen:0`
  - 판정: Vision 원응답에서 텍스트 미검출
- `[api/ocr.raw]`에서 길이는 있는데 `[api/ocr.return] ok:false`
  - 판정: 서버 후처리/검증 조건에서 실패 처리
- `[api/ocr.return] ok:true` + `textLen>0`인데 클라이언트 `[OCR.fetch.body]`가 빈 값
  - 판정: 클라이언트 파싱/전달 계약 불일치 가능성

중요
- 본 로그는 진단용이므로 원인 확인 후 삭제 필요.

## 2026-03-08 OCR 진단 원칙 재확인

- 목적: 브리지 수정이 아니라 OCR 호출/응답 계약의 실제 실패 지점 확인
- 금지: 성공 처리 우회, 강제 ok:true, 빈 text 보정, fallback로 정상처럼 보이게 처리
- 허용: append-only 로그로 `ok:false` 또는 `textLen:0`가 발생하는 정확한 단계만 기록

진단 체인(변경 없음)
1) `[OCR.fetch.response]`
2) `[OCR.fetch.body]`
3) `[api/ocr.raw]`
4) `[api/ocr.return]`

판정 원칙
- 첫 번째로 `ok:false` 또는 `textLen:0`가 확정되는 로그 지점을 실패 단계로 본다.
- 그 이전 단계는 정상 통과로 본다.

## 2026-03-08 Google Vision 호출 실패 원인 진단 로그 (api/ocr.js only)

- 수정 분류
  - 진단용 append-only 로그 추가
  - 성공 우회/ok:true 강제/빈 text 보정 없음
  - 민감정보(API key 원문) 출력 없음 (존재 여부 Boolean만 출력)

- 영향 파일
  - api/ocr.js

- 삽입 위치
  1) handler 시작부 (`_setCors(req, res);` 직후)
     - `[api/ocr.env]`
  2) Vision fetch 직전
     - `[api/ocr.request]`
  3) Vision fetch 응답 직후
     - `[api/ocr.visionResponse]`
  4) catch(e) 블록 시작부
     - `[api/ocr.catch]`
  5) 기존 `[api/ocr.raw]`, `[api/ocr.return]` 로그 유지

- 붙여넣기 가능한 코드
```js
console.log("[api/ocr.env]", {
  hasVisionKey: Boolean(process.env.GOOGLE_CLOUD_VISION_API_KEY),
});
```
```js
console.log("[api/ocr.request]", {
  hasBase64: typeof imageBase64 === "string" && imageBase64.length > 0,
  imageLen: typeof imageBase64 === "string" ? imageBase64.length : 0,
  mimeType: mimeType || null,
});
```
```js
console.log("[api/ocr.visionResponse]", {
  status: visionRes?.status,
  ok: visionRes?.ok,
});
```
```js
console.log("[api/ocr.catch]", {
  message: e?.message || String(e),
  name: e?.name || null,
});
```

- vercel dev 터미널에서 확인할 로그 순서
  - 정상 요청 진입 시 기본 순서
    1) `[api/ocr.env]`
    2) `[api/ocr.request]`
    3) `[api/ocr.visionResponse]`
    4) (성공/실패 분기)
       - 성공 경로: `[api/ocr.raw]` -> `[api/ocr.return]` (ok:true)
       - Vision 응답 오류 경로: `[api/ocr.return]` (ok:false, OCR_REQUEST_FAILED)
       - 예외 경로: `[api/ocr.catch]` -> `[api/ocr.return]` (ok:false, OCR_REQUEST_FAILED)

- 진단 후 처리
  - 본 로그는 진단용이므로 원인 확인 후 삭제 필요

## 2026-03-08 /api/ocr 내부 실패 원인 로그 적용 확인

1) 수정 분류
- 코드 변경 없음 (적용 여부 점검)
- append-only 진단 로그 존재 확인

2) 영향 파일
- api/ocr.js

3) 정확한 삽입 위치
- `[api/ocr.env]`: handler 시작부, `_setCors(req, res);` 직후
- `[api/ocr.request]`: Google Vision fetch 직전
- `[api/ocr.visionResponse]`: Google Vision fetch 응답 직후
- `[api/ocr.raw]`: Vision 응답 파싱 후 text 추출 직전
- `[api/ocr.return]`: 응답 반환 직전(200/400/500 분기)
- `[api/ocr.catch]`: catch(e) 블록 시작부

4) 적용된 로그 목록
- [api/ocr.env]
- [api/ocr.request]
- [api/ocr.visionResponse]
- [api/ocr.raw]
- [api/ocr.return]
- [api/ocr.catch]

5) vercel dev 재시작 필요 여부
- 필요함. 서버 코드(`api/ocr.js`) 변경/확인 반영을 위해 `vercel dev`를 재시작해야 최신 로그가 터미널에 출력됨.

원칙 확인
- 성공 처리 우회 없음
- ok:true 강제 없음
- 빈 text 보정 없음

## 2026-03-08 .env.local 프론트 VITE_* 복구 (append-only)

1. 수정 분류
- 환경설정 복구 (코드 수정 없음)
- `.env.local`에 append-only로 누락된 프론트 변수 템플릿 추가
- 성공 처리 우회/동작 로직 변경 없음

2. 영향 파일
- .env.local

3. `.env.local` 추가된 변수 목록
- VITE_SUPABASE_URL=
- VITE_SUPABASE_ANON_KEY=
- VITE_AI_PROXY_URL=
- VITE_PARSE_API_BASE=

4. 입력 방법 설명
- `VITE_SUPABASE_URL`
  - Supabase 콘솔 -> Settings -> API -> Project URL
- `VITE_SUPABASE_ANON_KEY`
  - Supabase 콘솔 -> Settings -> API -> anon public key
- `VITE_AI_PROXY_URL`
  - 기존 프로젝트에서 사용하던 AI proxy endpoint
- `VITE_PARSE_API_BASE`
  - JD parsing API base URL

5. 서버 재시작 안내
- 값 입력 후 아래 순서로 재시작
```bash
Ctrl + C
vercel dev
```
- 재시작 후 브라우저에서 `SupabaseUrl is required` 오류 해소 여부 확인
- 오류 해소 후 OCR 진단 로그 재확인
  - `[api/ocr.env]`
  - `[api/ocr.visionResponse]`
  - `[api/ocr.return]`
  - `[api/ocr.catch]`

## 2026-03-08 실행 컨텍스트 점검 및 최소 수정 판단 (OCR env)

요약 판단
- 현재 구조에서 가장 맞는 로컬 실행 조합:
  1) `vercel dev` (API runtime, 3000)
  2) `vite dev` (frontend, 5173)
- 프론트는 `/api/ocr`를 `http://localhost:3000`으로 호출하도록 `VITE_PARSE_API_BASE`를 사용
- `npm run dev`(vite 단독)만으로는 API 런타임 컨텍스트를 재현하지 못함

검증 사실
- `.env.local`에 `GOOGLE_CLOUD_VISION_API_KEY` 라인 존재 및 비어있지 않음(값 미출력 원칙 준수)
- `api/ocr.js`는 `process.env.GOOGLE_CLOUD_VISION_API_KEY`를 직접 읽음
- 런타임 로그 `hasVisionKey:false`면 파일 누락보다 "해당 런타임이 env를 로드하지 못한 상태" 가능성이 높음

권장 실행 순서
1) 터미널 A: `vercel dev --listen 3000`
2) 터미널 B: `npm run dev -- --host 127.0.0.1 --port 5173`
3) 브라우저에서 5173 접속 후 OCR 재시도
4) `vercel dev` 터미널에서 아래 로그 순서 확인
   - `[api/ocr.env]`
   - `[api/ocr.request]`
   - `[api/ocr.visionResponse]`
   - `[api/ocr.raw]` / `[api/ocr.return]` / `[api/ocr.catch]`

그래도 `hasVisionKey:false`일 때 최소 수정 판단
- `vercel dev` 컨텍스트가 정상이라면 `dotenv` 설치/로드는 원칙적으로 불필요
- 그래도 동일 증상이 지속될 때의 최소 수정안(1파일 기준 코드):
```js
import "dotenv/config";
```
- 삽입 위치: `api/ocr.js` 최상단(첫 줄)
- 주의: 위 코드를 사용하려면 `dotenv` 패키지 설치가 선행되어야 함

원칙 재확인
- 성공 처리 우회 금지
- ok:true 강제 금지
- 빈 text 보정 금지

## 2026-03-08 OCR endpoint 로컬 개발 고정 패치 (안전)

1. 수정 분류
- 안전 패치

2. 영향 파일
- src/lib/extract/extractTextFromFile.js

3. 문제 원인
- endpoint가 `(__base ? __base : "") + "/api/ocr"`로 계산되어
  `localhost:5173/reject-analyzer/` 실행 시 상대경로로 잘못 향할 수 있음

4. 작업 목표 반영
- 개발 환경에서 `localhost:5173` 실행 시에만 `http://localhost:3000/api/ocr` 사용
- 그 외(배포/동일 오리진)는 기존 `/api/ocr` 계산식 유지

5. 붙여넣기 가능한 최종 코드
```js
const __base =
  (import.meta?.env?.VITE_PARSE_API_BASE || import.meta?.env?.VITE_AI_PROXY_URL || "")
    .toString()
    .trim()
    .replace(/\/$/, "");
const isLocalDevOn5173 =
  Boolean(import.meta?.env?.DEV) &&
  typeof window !== "undefined" &&
  window.location?.hostname === "localhost" &&
  String(window.location?.port || "") === "5173";
const endpoint = isLocalDevOn5173 ? "http://localhost:3000/api/ocr" : (__base ? __base : "") + "/api/ocr";
```

## 2026-03-08 PASSMAP JD URL 입력 MVP 추가

1. 수정 분류
- 결정적 패치
- append-only / 최소 수정

2. 영향 파일
- src/components/input/InputFlow.jsx
- api/extract-job-posting.js (신규)

3. 구현 요약
- InputFlow(JD 단계)에 URL 입력 + 불러오기 버튼 + 도메인 힌트 링크(사람인/잡코리아/원티드) 추가
- URL 검증(형식/허용 도메인) 후 `/api/extract-job-posting` POST 호출
- 성공 시 JD SSOT 경로(`setState(... jd: text)`)로 기존 textarea 자동 채움
- 실패 시 짧은 에러 문구 노출, 수동 입력/파일 첨부 fallback 유지
- 신규 API에서 whitelist 도메인만 허용하여 HTML fetch 후 script/style/noscript/svg/header/nav/footer/aside 제거 + plain text 정제
- 최소 HTML entity decode + 줄바꿈/공백 정리 + 너무 짧으면 `TEXT_TOO_SHORT` 반환

4. API 에러 코드
- INVALID_URL
- UNSUPPORTED_DOMAIN
- FETCH_FAILED
- TEXT_TOO_SHORT
- INTERNAL_ERROR

5. 주의
- analyzer/decision/App.jsx/기존 첨부 및 OCR 흐름은 수정하지 않음

## 2026-03-08 PASSMAP JD URL extraction ROUND 7 (saramin rec_idx exact matching)

1. 수정 분류
- 안전 패치
- append-only / 최소 수정

2. 영향 파일
- api/extract-job-posting.js

3. 정확한 수정 위치
- `_extractDescriptionFromLocalWindow` 바로 아래 helper 추가
  - `_extractDescriptionForRecIdxInBlock`
  - `_countSubstringOccurrences`
  - `_findBalancedObjectEnd`
  - `_extractSaraminTargetObject`
- `_extractSaraminDescriptionFromScriptWithDebug` debug 필드 확장
  - `targetRecIdxGlobalCount`
  - `targetRecIdxChunkCount`
  - `targetRecIdxFirstGlobalIndex`
  - `targetRecIdxFirstChunkIndex`
  - `targetObjectFound`
  - `targetObjectLength`
- 같은 함수 내부 target 처리 분기 강화
  - target object 우선 추출 시도
  - 실패 시 global fallback 후 기존 candidate fallback
- `_extractSaraminTextWithDebug`의 DOM fallback debug 기본값에도 신규 필드 추가

4. 왜 안전한지
- 수정 범위는 `api/extract-job-posting.js` 1파일 한정
- `TEXT_TOO_SHORT`, `NOT_JOB_DESCRIPTION` 판정식 불변
- 응답 contract(`ok/text/meta`) 불변
- jobkorea/wanted 경로 미수정
- analyzer/decision/App/InputFlow/OCR/첨부 흐름 미수정

5. 붙여넣기 가능한 최종 코드 전체
- 파일: `api/extract-job-posting.js` 최신본 기준(워크스페이스 파일 그대로)

6. saramin 실URL 재검증 결과 요약

대상 URL
- https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=53221675
- https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=53176500
- https://www.saramin.co.kr/zf_user/jobs/relay/view?view_type=list&rec_idx=53176500&t_ref=subway_recruit&t_ref_content=metro_plus&t_ref_area=103

URL 1
- extractionMode: site-specific
- preValidationTextLength: 332
- jdSignalCount: 0
- title: [(주)포스코와이드] [포스코와이드] 광주 지역 행정지원직(육아휴직 대체) 사원 모집(D-7) - 사람인
- preview 요약: 포르쉐/법인행정 등 혼합 추천형 문구
- saramin debug
  - targetRecIdxGlobalCount: 1
  - targetRecIdxChunkCount: 0
  - matchedRecIdx: false
  - selectedRecIdx: 53188840
  - targetObjectFound: true
  - targetObjectLength: 117522
  - descriptionRawLength: 1433
  - descriptionDecodedLength: 332
- 최종 판정: NOT_JOB_DESCRIPTION

URL 2
- extractionMode: site-specific
- preValidationTextLength: 218
- jdSignalCount: 0
- title: [(주)알리오즈애드] 병원 블로그 마케팅 담당자 모집(원고 작성 경험자 우대)(D-19) - 사람인
- preview 요약: 뷰티/마케팅 추천형 문구
- saramin debug
  - targetRecIdxGlobalCount: 1
  - targetRecIdxChunkCount: 0
  - matchedRecIdx: false
  - selectedRecIdx: 53202197
  - targetObjectFound: true
  - targetObjectLength: 117308
  - descriptionRawLength: 1003
  - descriptionDecodedLength: 218
- 최종 판정: NOT_JOB_DESCRIPTION

URL 3
- extractionMode: site-specific
- preValidationTextLength: 218
- jdSignalCount: 0
- title: [(주)알리오즈애드] 병원 블로그 마케팅 담당자 모집(원고 작성 경험자 우대)(D-19) - 사람인
- preview 요약: 뷰티/마케팅 추천형 문구
- saramin debug
  - targetRecIdxGlobalCount: 1
  - targetRecIdxChunkCount: 0
  - matchedRecIdx: false
  - selectedRecIdx: 53202197
  - targetObjectFound: true
  - targetObjectLength: 122341
  - descriptionRawLength: 1003
  - descriptionDecodedLength: 218
- 최종 판정: NOT_JOB_DESCRIPTION

7. 결론
- 이번 패치로 target rec_idx 매칭은 계측/우선순위 구조를 강화했지만, 실URL 3건에서 `selectedRecIdx === targetRecIdx`는 달성하지 못함.
- 병목 분류:
  1) target source 부재: 부분적으로 해당됨 (`targetRecIdxGlobalCount=1`, `targetRecIdxChunkCount=0`)
  2) object boundary: 해당됨 (global object가 과대 블록으로 잡혀 타 rec description이 선택됨)
  3) description 파싱: 2차적 병목 (target object의 description key/value를 rec_idx와 1:1로 못 고정)

### ROUND 7 결론 상세 (추가 기록)

이번 ROUND 7 패치의 핵심 목적은 `saramin`에서 `target rec_idx` 기준으로 공고 object를 우선 선택하고, 그 object 내부의 `description`만 추출하도록 만드는 것이었다.

실검증 결과(실URL 3건 공통 관찰)
- `targetRecIdxGlobalCount=1`은 모두 확인되었다.
- 반면 `targetRecIdxChunkCount=0`이 모두 반복되었다.
- 즉, target rec_idx 문자열 자체는 HTML 전체에는 존재하지만, 현재 `recruit_list` anchor 기반 chunk에는 포함되지 않는 케이스가 반복됨.
- 이 때문에 chunk 중심 추출 경로는 본질적으로 target을 직접 집지 못하고, fallback 후보에서 타 rec_idx가 선택되는 구조로 다시 밀려난다.

ROUND 7에서 실제로 개선된 점
- 기존의 단순 local window slicing보다 한 단계 강화된 object-aware 경로가 도입되었다.
  - brace balance 기반 object end 탐색
  - target 존재 계측(global/chunk/firstIndex)
  - target-first 우선 시도(성공 시 즉시 return)
- debug 상으로 `targetObjectFound`/`targetObjectLength`가 관측되어, target 주변 object slicing 시도 여부를 분리 확인할 수 있게 되었다.

하지만 성공 기준 대비 미달한 점
- 성공 기준의 핵심인 `selectedRecIdx === targetRecIdx`를 실URL 3건에서 달성하지 못했다.
- `matchedRecIdx=true`가 안정적으로 나오지 못했고, 결과적으로 `NOT_JOB_DESCRIPTION`를 벗어나지 못했다.
- 따라서 ROUND 7은 "계측 정확도 상승 + 경로 우선순위 구조화"까지는 달성했지만, "target exact match 실선택"은 미달이다.

병목 최종 분류(요청 기준에 맞춘 확정)
1) target rec_idx source 부재
- 완전 부재는 아님 (`global=1`)
- 다만 extraction의 주 경로(chunk) 안에는 부재(`chunk=0`)여서 실질적 source 부재와 유사한 제약이 발생

2) object boundary 추출 실패
- 핵심 병목
- target 포함 object로 판정된 블록이 과대 범위로 잡히며, 다수 rec가 섞인 상태에서 description이 타 rec로 연결됨
- 즉 "target을 포함하는 블록"과 "target 단일 recruit object"를 구분하지 못함

3) description key/value 파싱 실패
- 2차 병목
- description key는 읽히지만 target rec_idx와 1:1로 안정 결합되지 못함
- 결과적으로 description 파싱 자체보다 "어느 object의 description인지 귀속" 실패가 더 큼

ROUND 7 결론 문장(판정)
- 이번 패치로 target rec_idx 매칭은 **부분 개선(계측/우선순위 구조)** 되었으나, **실선택 exact matching은 아직 해결되지 않음**.
- 현 단계의 주병목은 validation이 아니라 extraction이며, 그중에서도 **chunk source 부재 + object boundary 분리 실패**가 결정적이다.

다음 라운드로 넘겨야 할 기술 부채(명시)
- `recruit_list` anchor 고정 가정 완화 없이도 target rec_idx가 있는 실제 스크립트 블록을 먼저 찾는 source selection 단계 필요
- target을 포함하는 "대블록"이 아니라 target rec_idx가 단일로 귀속되는 "소블록" 경계 확정 로직 필요
- description 파싱은 기존 경로를 유지하되, 파싱 결과에 대한 rec_idx 귀속 검증(동일 object 내)을 강제해야 함

요약
- ROUND 7의 본질적 성과: 디버그 가시성 및 target-first 구조 틀 확보
- ROUND 7의 미해결 핵심: `selectedRecIdx != targetRecIdx` 지속
- 실패 분류 최종: (1) source 제약 + (2) boundary 실패가 주원인, (3) description 파싱은 부원인
