# Communication Patch Notes

## SSOT Phase1 코드 발췌 검수본 (No Code Change)

요청하신 4개 발췌를 `src/lib/analyzer.js` 기준으로 라인번호와 함께 기록합니다.

---

### 1) objective 생성/정리 구간

```js
  4260:   const keywordSignals = buildKeywordSignals(state?.jd || "", state?.resume || "", ai);
  4261:   const careerSignals = buildCareerSignals(state?.career || {}, state?.jd || "");
  4262:   const resumeSignals = buildResumeSignals(state?.resume || "", state?.portfolio || "");
  4263: 
  4264:   const majorSignals = buildMajorSignals({
  4265:     jd: state?.jd || "",
  4266:     resume: state?.resume || "",
  4267:     state,
  4268:     ai,
  4269:     keywordSignals,
  4270:     resumeSignals,
  4271:   });
  4272: 
  4273:   const objective = buildObjectiveScore({ keywordSignals, careerSignals, resumeSignals, majorSignals });
  4274:   // ------------------------------
  4275:   // SSOT Phase1 (append-only): canonical role/domain fields
```

---

### 2) SSOT Phase1 Hotfix 삽입 위치 전후 (40~60줄)

```js
  4371:   objective.normalizedCurrentRole = normalizedCurrentRole;
  4372:   objective.normalizedTargetRole = normalizedTargetRole;
  4373:   objective.normalizedCurrentDomain = normalizedCurrentDomain;
  4374:   objective.normalizedTargetDomain = normalizedTargetDomain;
  4375:   objective.normalizedJobFamily = normalizedJobFamily;
  4376:   // ------------------------------
  4377:   // SSOT Phase1 Hotfix (append-only): priority + unknown defaults + jobFamily meta
  4378:   // - 기존 canonical 계산을 유지하되, 승인된 우선순위로 최종값을 다시 확정
  4379:   // ------------------------------
  4380:   const __roleInferenceObj =
  4381:     objective?.roleInference && typeof objective.roleInference === "object"
  4382:       ? objective.roleInference
  4383:       : null;
  4384:   const __jdFamilyFromJD = inferJobFamilyFromJD(__jdTextForSSOT);
  4385: 
  4386:   const __normalizedCurrentRoleFinal =
  4387:     __pickFirstNonEmpty([
  4388:       state?.currentRole,
  4389:       state?.roleCurrent,
  4390:       state?.role,
  4391:       __roleInferenceObj?.currentRole,
  4392:       objective?.role,
  4393:       ai?.role,
  4394:     ]) || "unknown";
  4395: 
  4396:   const __normalizedTargetRoleFinal =
  4397:     __pickFirstNonEmpty([
  4398:       state?.roleTarget,
  4399:       state?.targetRole,
  4400:       __roleInferenceObj?.targetRole,
  4401:       __roleInferenceObj?.familyRole,
  4402:       __roleInferenceObj?.fineRole,
  4403:       ai?.roleInference,
  4404:       state?.role,
  4405:     ]) || "unknown";
  4406: 
  4407:   const __normalizedCurrentDomainFinal =
  4408:     __pickFirstNonEmpty([
  4409:       state?.industryCurrent,
  4410:       state?.currentIndustry,
  4411:       objective?.resumeIndustry,
  4412:       ai?.resumeIndustry,
  4413:     ]) || "unknown";
  4414: 
  4415:   const __normalizedTargetDomainFinal =
  4416:     __pickFirstNonEmpty([
  4417:       objective?.jdIndustry,
  4418:       __jdModelForSSOT?.domain,
  4419:       state?.industryTarget,
  4420:       state?.targetIndustry,
  4421:       ai?.jdIndustry,
  4422:     ]) || "unknown";
  4423: 
  4424:   let __normalizedJobFamilyFinal = "UNKNOWN";
  4425:   let __normalizedJobFamilySource = "unknown";
  4426:   let __normalizedJobFamilyConfidence = 0;
  4427: 
  4428:   const __jobFamilyFromJD = __pickFirstNonEmpty([__jdFamilyFromJD]);
  4429:   const __jobFamilyFromInference = __inferFamilyFromRoleSSOT(
  4430:     __pickFirstNonEmpty([__roleInferenceObj?.familyRole])
  4431:   );
  4432:   const __jobFamilyFromTargetRole = __inferFamilyFromRoleSSOT(__normalizedTargetRoleFinal);
```

---

### 3) decisionPack/reportPack/buildDecisionPack 호출 직전 구간

```js
  4570:           if (smBase || smSt || smDbg) {
  4571:             merged.semanticMatches = { ...(smBase || {}), ...(smSt || {}), ...(smDbg || {}) };
  4572:           }
  4573:         } catch { }
  4574: 
  4575:         return merged;
  4576:       })();
  4577:       decisionPack = buildDecisionPack({
  4578:         state,
  4579:         ai: __ai_for_decision,
  4580:         structural,
  4581:         evidenceFit,
  4582:         // (하위호환) 기존 경로 + (디버그 보험) __DBG_ACTIVE__
  4583:         careerSignals: __cs_for_decision,
  4584:       });
  4585:     } else {
  4586:       decisionPack = null;
  4587:     }
```

(reportPack 생성 위치 참고)

```js
  5389:  const reportPack = {
```

---

### 4) objective.normalized* 7개 append 실제 코드 블록

```js
  4448:   objective.normalizedCurrentRole = __normalizedCurrentRoleFinal;
  4449:   objective.normalizedTargetRole = __normalizedTargetRoleFinal;
  4450:   objective.normalizedCurrentDomain = __normalizedCurrentDomainFinal;
  4451:   objective.normalizedTargetDomain = __normalizedTargetDomainFinal;
  4452:   objective.normalizedJobFamily = __normalizedJobFamilyFinal;
  4453:   objective.normalizedJobFamilySource = __normalizedJobFamilySource;
  4454:   objective.normalizedJobFamilyConfidence = __normalizedJobFamilyConfidence;
```

---

## 검수 포인트 대응 메모

- Hotfix 위치: `objective` 생성 이후, `evidenceFit`/`buildDecisionPack` 이전에 존재합니다.
- 중간 참조 여부: 발췌 기준에서 `objective.normalized*`는 append 후에 downstream으로 전달됩니다.
- 타입/충돌 관점: `inferJobFamilyFromJD(__jdTextForSSOT)` + `__inferFamilyFromRoleSSOT(...)` 조합이며, 최종 fallback은 `"UNKNOWN"`/`"unknown"`으로 고정됩니다.
