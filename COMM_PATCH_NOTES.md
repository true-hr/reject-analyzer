
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
