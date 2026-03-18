# PASSMAP Agent Rules

## Mission
This repository uses AI coding agents in a controlled patch workflow.
The primary goal is operational stability, minimal-risk implementation, and precise patch execution.

## Agent Operating Mode
Default to DIRECT PATCH MODE.

That means:
- do not ask for permission if the change is clearly within the allowed scope
- make the safest minimal patch directly
- avoid unnecessary clarification
- optimize for execution speed without violating repository rules

## Repository Patch Policy
Agents may proceed without asking when all conditions below are satisfied:
- the change is limited in scope
- maximum 3 files are modified
- the patch is append-only or minimal in-place
- no file deletion is involved
- no broad refactor is involved
- no public contract/API is changed

## Allowed Actions
- helper addition
- guard/condition reinforcement
- local state/data propagation
- local UI rendering fixes
- local parser/extractor fixes
- exact-anchor insertion or replacement
- narrowly scoped bug fixes
- temporary debug instrumentation for swallowed runtime errors

## Disallowed Without Explicit Instruction
- deleting files
- moving files
- renaming functions/classes/modules
- changing external interfaces
- large refactors
- mixing unrelated fixes in one task
- rewriting entire files when a local patch is possible

## Preferred Patch Style
- exact-anchor based
- smallest viable delta
- preserve file structure
- preserve naming conventions
- preserve existing comments/order unless change is necessary
- backward compatible by default

## Escalation Rule
Ask only if one of the following is unavoidable:
- more than 3 files required
- structural redesign required
- interface/contract change required
- deletion required
- request is ambiguous at target-file level
- repository rule conflict exists

When escalation is necessary:
- ask once
- ask narrowly
- do not ask multiple optional questions

## Reporting Format
Preferred response format:

1. 수정 분류
2. 수정 파일
3. exact anchor
4. 변경 전 / 후 요약
5. 패치 코드
6. 검증 방법

## PASSMAP Collaboration Contract
- ChatGPT designs
- implementation agent executes
- do not challenge the design unless it is technically impossible or contradicts repository rules
- if multiple safe implementations are possible, choose the most conservative one

## High-Risk Files
Extra caution:
- `src/App.jsx`
- `src/lib/analyzer.js`
- `src/lib/decision/index.js`

In these files:
- patch locally
- do not reorganize broadly
- do not mix cleanup with bug fixing

## Debug Rule
If diagnosing a silent failure on a user-facing path:
- add a single minimal debug snapshot
- avoid log spam
- document whether removal is required afterward
