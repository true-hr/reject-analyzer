import assert from "node:assert/strict";
import {
  calculateInclusiveMonths,
  normalizeCareerMonthToken,
  parseCareerPeriod,
} from "../src/lib/career-core/index.js";
import { expectedDateParseResults } from "../src/lib/career-core/__fixtures__/expectedDateParseResults.js";

const testReferenceDate = "2026-06-04";

const supportedCases = [
  ["date_01_dot_full_year", "2021.07 ~ 2023.07"],
  ["date_02_slash_full_year", "2021/07 ~ 2023/07"],
  ["date_03_dash_full_year", "2021-07 ~ 2023-07"],
  ["date_04_dot_single_month", "2021.7 ~ 2023.7"],
  ["date_05_inclusive_24_month_anchor", "2021.07 ~ 2023.06"],
  ["date_06_short_dot_year", "21.07 ~ 23.07"],
  ["date_07_short_slash_year", "21/07 ~ 23/07"],
  ["date_08_short_korean_single_month", "21년 7월 ~ 23년 7월"],
  ["date_09_short_korean_padded_month", "21년 07월 ~ 23년 07월"],
  ["date_10_korean_year_month", "2021년 7월 ~ 2023년 7월"],
  ["date_11_korean_from_to", "2021년 07월부터 2023년 07월까지"],
  ["date_12_korean_hire_leave", "2021년 7월 입사 / 2023년 7월 퇴사"],
  ["date_13_no_space_hyphen", "2021.07-2023.07"],
  ["date_14_en_dash", "2021.07 – 2023.07"],
  ["date_15_em_dash", "2021.07 — 2023.07"],
  ["date_17_wave_dash", "2021.07 ∼ 2023.07"],
  ["present_01_korean_current", "2021.07 ~ 현재"],
  ["present_02_korean_employed_compact", "2021.07 ~ 재직중"],
  ["present_03_korean_employed_spaced", "2021.07 ~ 재직 중"],
  ["present_04_english_present", "2021.07 ~ Present"],
  ["present_05_english_now", "2021.07 ~ now"],
  ["present_06_korean_current_employed", "2021.07 ~ 현재 재직"],
  ["present_07_hire_to_current", "2021.07 입사 ~ 현재"],
  ["present_08_open_ended", "2021.07 ~"],
  ["gap_01_explicit_gap", "2019.08 ~ 2023.09 공백"],
  ["gap_03_personal_reason", "2019.08-2023.09 개인 사유"],
];

for (const [id, input] of supportedCases) {
  const expected = expectedDateParseResults[id];
  const actual = parseCareerPeriod(input, { testReferenceDate });

  assert.equal(actual.normalizedStart, expected.normalizedStart, `${id} normalizedStart`);
  assert.equal(actual.normalizedEnd, expected.normalizedEnd, `${id} normalizedEnd`);
  assert.equal(actual.isCurrent, expected.isCurrent, `${id} isCurrent`);
  assert.equal(actual.datePrecision, expected.datePrecision, `${id} datePrecision`);
  assert.equal(actual.durationMonthsInclusive, expected.durationMonthsInclusive, `${id} duration`);
  assert.deepEqual(actual.parseWarnings, expected.parseWarnings, `${id} parseWarnings`);
  if (expected.timelineKind) {
    assert.equal(actual.timelineKind, expected.timelineKind, `${id} timelineKind`);
  }
}

assert.deepEqual(normalizeCareerMonthToken("21년 7월"), {
  raw: "21년 7월",
  normalized: "2021-07",
  year: 2021,
  month: 7,
  warning: null,
});
assert.equal(
  calculateInclusiveMonths({ year: 2021, month: 7 }, { year: 2023, month: 7 }),
  25
);
assert.equal(
  calculateInclusiveMonths({ year: 2021, month: 7 }, { year: 2023, month: 6 }),
  24
);

for (const input of [
  "2021 ~ 2023",
  "2021년 ~ 2023년",
  "2021 - 2023",
  "2021 입사 / 2023 퇴사",
  "2021.07 ~ 2023",
  "2021 ~ 2023.07",
  "2021년 7월 ~ 2023년",
  "2021년 ~ 2023년 7월",
  "2019년 하반기 ~ 2023년 9월 진로탐색",
]) {
  const actual = parseCareerPeriod(input, { testReferenceDate });
  assert.equal(actual.datePrecision, "unsupported", `${input} stays unsupported`);
  assert.ok(actual.parseWarnings.length > 0, `${input} reports warning`);
}

console.log("PASS career-core raw period parser deterministic checks");
