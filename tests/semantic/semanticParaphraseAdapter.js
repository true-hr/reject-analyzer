import {
  pickSemanticBestScore,
  semanticMatchJDResume,
} from "../../src/lib/semantic/match.js";

function pickBestObservedDebug(result) {
  const rows = Array.isArray(result?.matches) ? result.matches : [];
  return rows.reduce((best, row) => {
    const observedScore = Number(row?.debug?.observedBestScore);
    const acceptedScore = Number(row?.best?.score);
    const score = Number.isFinite(observedScore)
      ? observedScore
      : (Number.isFinite(acceptedScore) ? acceptedScore : null);

    if (!Number.isFinite(score)) {
      return best;
    }

    if (!best || score > best.score) {
      return {
        score,
        debug: row?.debug ?? null,
      };
    }

    return best;
  }, null);
}

export function createSemanticParaphraseAdapter(options = {}) {
  return {
    async evaluate({ jd, resume, meta }) {
      const result = await semanticMatchJDResume(jd, resume, {
        maxJdUnits: options.maxJdUnits ?? 12,
        maxResumeUnits: options.maxResumeUnits ?? 40,
        topK: 1,
        concurrency: 1,
        device: options.device ?? "cpu",
        dtype: options.dtype ?? "q8",
        useLocalStorageCache: false,
      });

      const acceptedScore = pickSemanticBestScore(result);
      const observed = pickBestObservedDebug(result);
      const observedScore =
        Number.isFinite(Number(observed?.score)) ? Number(observed.score) : null;
      const lexicalPenalty = Number(observed?.debug?.lexicalPenalty ?? 0) || 0;

      let predicted = "unknown_safe";
      let failureType = "insufficient_evidence";

      if (acceptedScore !== null) {
        if (acceptedScore >= 0.8 && lexicalPenalty < 0.08) {
          predicted = "match";
          failureType = null;
        } else {
          predicted = "partial";
          failureType = "partial_overlap";
        }
      } else if (observedScore !== null && observedScore >= 0.5) {
        predicted = "partial";
        failureType = "partial_overlap";
      }

      return {
        predicted,
        rawScore: acceptedScore ?? observedScore,
        pairState: observed?.debug?.pairState ?? null,
        failureType,
        debug: {
          meta,
          acceptedScore,
          observedScore,
          lexicalBoost: Number(observed?.debug?.lexicalBoost ?? 0) || 0,
          lexicalPenalty,
          semantic: result?.debug ?? null,
          best: observed?.debug ?? null,
        },
      };
    },
  };
}
