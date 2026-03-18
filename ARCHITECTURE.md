# PASSMAP Architecture Notes

## Purpose
This document is a lightweight architecture map for AI coding agents.
Its goal is not full documentation.
Its goal is to reduce bad patches, naming drift, and unnecessary questions.

## Product Summary
PASSMAP analyzes JD + resume inputs and produces:
- fit/risk interpretation
- pass probability
- user/passmap type interpretation
- simulation-oriented result views
- actionable resume/career feedback

## Core Collaboration Rule
- ChatGPT = architecture, design, prioritization, risk judgment
- implementation agent = concrete patch generation and execution

## High-Level Flow
Primary runtime flow is conceptually:

Input/UI
 parsing / normalization
 analyzer
 decision logic
 simulation view model
 result UI

In repository terms, the common flow is:

`src/App.jsx`
 `src/lib/analyzer.js`
 `src/lib/decision/index.js`
 `src/lib/simulation/buildSimulationViewModel.js`
 `src/components/SimulatorLayout.jsx`

## Responsibilities by Layer

### 1. App Layer
Main file:
- `src/App.jsx`

Typical responsibilities:
- collect user inputs
- manage UI state
- trigger analyze flow
- hold parsed JD / parsed resume handoff
- route results into display/share flow

Rule:
- high-risk file
- local patch only
- do not perform broad reorganization unless explicitly requested

### 2. Analyzer Layer
Main file:
- `src/lib/analyzer.js`

Typical responsibilities:
- orchestrate analysis
- gather normalized inputs
- invoke scoring / decision-related logic
- bridge parsed structures into downstream simulation view model
- produce unified analysis pack

Rule:
- `analyze()` should remain orchestration-centered where possible
- avoid bloating with unrelated UI logic

### 3. Decision Layer
Main file:
- `src/lib/decision/index.js`

Typical responsibilities:
- evaluate rule outcomes
- compute risk/gate-related interpretations
- use role/domain/seniority/fit signals
- centralize decision-making logic where applicable

Rule:
- keep decision logic centralized
- avoid scattering equivalent rule logic into unrelated UI files

### 4. Simulation View Model Layer
Main file:
- `src/lib/simulation/buildSimulationViewModel.js`

Typical responsibilities:
- convert analysis outputs into UI-friendly interpretation objects
- build top risks, explanation text, candidate/passmap type sections, current flow interpretation
- prepare result display model consumed by UI

Rule:
- this is the main translation layer from engine output to presentation-ready content
- avoid moving raw business logic into the UI if it belongs here

### 5. Result UI Layer
Main file:
- `src/components/SimulatorLayout.jsx`

Typical responsibilities:
- render result sections
- show top risks, interpretation cards, comparison/explanation blocks
- display simulation/result content based on `simVM`

Rule:
- UI should render, not invent business logic
- if interpretation logic grows, prefer moving it into simulation view model layer

## Stable Working Principles
1. Operational stability is more important than feature speed.
2. Minimal local patch is preferred over broad cleanup.
3. Backward-compatible changes are preferred.
4. One task should have one clear purpose.
5. Avoid naming drift.
6. Avoid hidden duplicate logic across layers.
7. Preserve SSOT contracts.

## Naming / Context Rule
When discussing data flow, prefer these stable concepts:
- `#APP_STATE`
- `#ANALYSIS_PACK`
- `#EVAL_CTX`

Do not create unnecessary parallel naming unless required.

## Common Patch Heuristics

### Good Patch
- exact anchor known
- local bug fix
- helper added near relevant logic
- data passed one layer deeper without redesign
- UI condition corrected locally

### Bad Patch
- touching many unrelated files
- mixing refactor with bug fix
- renaming symbols for style only
- moving logic across layers without explicit approval
- rewriting entire file when local patch is enough

## High-Risk Change Types
The following require special caution:
- changes to analyze trigger timing
- changes to auth/pending action flow
- changes to parsed JD / parsed resume contract
- changes to simulation view model shape
- changes to result-section rendering conditions
- changes to shared payload / compact payload schema

## Debugging Rule
When debugging:
1. classify the issue first:
   - syntax
   - data-path
   - policy/UI
2. verify the final UI data path before changing logic
3. modify one file per round when possible
4. if try/catch may swallow meaningful runtime errors, expose one minimal debug snapshot temporarily

## Practical Interpretation Rule
PASSMAP should feel like:
- it understood my actual career context
not:
- it only matched keywords mechanically

Therefore, patches should prefer:
- context-aware interpretation
- conservative but human-readable explanation
- evidence-linked reasoning
- minimal false certainty

## Final Rule for Agents
If the patch is safe, local, and within repository rules:
apply it directly without asking permission questions.
