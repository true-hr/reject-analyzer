# Communication Patch Notes

1) 수정 분류
- 안전 패치

2) 영향 파일
- src/components/input/InputFlow.jsx

3) 조사 결과
- target company size 관련 기존 키 존재 여부
  - 존재함: `state.companySizeTarget`
  - 근거: `src/App.jsx`에서 `companySizeTargetValue`, `normalizeCompanySizeValue(state.companySizeTarget || "unknown")`, 레거시 Select(`set("companySizeTarget", ...)`) 사용 확인.
- 레거시 UI 존재 여부
  - 존재함: `src/App.jsx` 레거시 "연봉/직급/나이" 구간에 `지원 회사 기업규모` Select가 이미 있음.
- options 재사용 가능 여부
  - 가능함: `InputFlow.jsx` 6/8 페이지의 `현재 기업 규모` Select 옵션(`unknown/startup/small_mid/mid_large/large/public`)을 동일하게 재사용.

4) 정확한 수정 위치
- 파일: `src/components/input/InputFlow.jsx`
- 컴포넌트/함수: `InputFlow` (보상 입력 페이지 렌더 블록)
- 앵커:
  - `flowStep === FLOW.COMPENSATION`
  - 기존 `value={state?.companySizeCandidate || "unknown"}` Select 바로 아래
- 수정 내용:
  - `지원 회사 기업 규모` Select 1개 추가
  - state 연결: `companySizeTarget`
  - 기존 salary IME/commit 로직, step 이동 로직, deep/fast 분기 로직은 미변경

5) 붙여넣기 가능한 최종 코드
```jsx
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">?꾩옱 湲곗뾽 洹쒕え</span>
              <select
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 bg-white"
                value={state?.companySizeCandidate || "unknown"}
                onChange={(e) => setState((prev) => ({ ...prev, companySizeCandidate: e.target.value }))}
              >
                <option value="unknown">?좏깮 ????/option>
                <option value="startup">?ㅽ??몄뾽</option>
                <option value="small_mid">以묒냼/媛뺤냼湲곗뾽</option>
                <option value="mid_large">以묎껄湲곗뾽</option>
                <option value="large">?湲곗뾽</option>
                <option value="public">怨듦났/湲곌?</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">지원 회사 기업 규모</span>
              <select
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 bg-white"
                value={state?.companySizeTarget || "unknown"}
                onChange={(e) => setState((prev) => ({ ...prev, companySizeTarget: e.target.value }))}
              >
                <option value="unknown">선택 안 함</option>
                <option value="startup">스타트업</option>
                <option value="small_mid">중소/강소기업</option>
                <option value="mid_large">중견기업</option>
                <option value="large">대기업</option>
                <option value="public">공공/기관</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">?꾩옱 ?곕큺(留뚯썝)</span>
              <input
                inputMode="numeric"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                placeholder="?? 4500"
                value={getSalaryValue("salaryCurrent")}
                onChange={(e) => {
                  const v = e.target.value;
                  setSalaryImeBuffer((prev) => ({ ...prev, salaryCurrent: v }));
                  if (!salaryComposing.salaryCurrent) {
                    setState((prev) => ({ ...prev, salaryCurrent: v }));
                  }
                }}
                onCompositionStart={() => setSalaryComposing((prev) => ({ ...prev, salaryCurrent: true }))}
                onCompositionEnd={(e) => {
                  setSalaryComposing((prev) => ({ ...prev, salaryCurrent: false }));
                  commitSalary("salaryCurrent", e.currentTarget.value);
                }}
                onBlur={(e) => commitSalary("salaryCurrent", e.currentTarget.value)}
              />
            </label>
```

6) 수동 테스트 체크리스트
- 6/8 페이지에서 `지원 회사 기업 규모` Select가 표시된다.
- `현재 기업 규모(companySizeCandidate)`와 `지원 회사 기업 규모(companySizeTarget)`가 서로 독립적으로 저장된다.
- 이전/다음 이동 후 두 값이 각각 유지된다.
- 모바일 폭에서 6/8 입력이 세로 스택(`flex-col`)로 유지되어 레이아웃이 깨지지 않는다.
- deep/fast 흐름 영향 없음:
  - deep: `5/8(경력) -> 6/8(정밀입력) -> 7/8(JD)` 유지
  - fast: `5/6(경력) -> 6/6(정밀입력) -> 분석` 유지
