const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const MATCH_ORDER = { missing: 0, weak: 1, partial: 2, unclear: 3, strong: 4 };

export function getRequirementMetadataWeight(gap) {
  const source = String(gap.source || 'unknown').toLowerCase();
  const requirementType = String(gap.requirementType || 'unknown').toLowerCase();

  if (source === 'qualification' && requirementType === 'core') return 0;
  if (source === 'responsibility' && requirementType === 'core') return 1;
  if (requirementType === 'adjacent') return 2;
  if (requirementType === 'operational') return 3;
  if (requirementType === 'advanced') return 4;
  if (source === 'preferred' || requirementType === 'preferred') return 5;
  return 2;
}

export function calibrateGapByRequirementMetadata(gap) {
  const source = String(gap.source || 'unknown').toLowerCase();
  const requirementType = String(gap.requirementType || 'unknown').toLowerCase();
  const logic = String(gap.logic || 'unknown').toLowerCase();
  const severity = String(gap.severity || '').toLowerCase();
  const matchLevel = String(gap.matchLevel || '').toLowerCase();
  const resumeEvidence = String(gap.resumeEvidence || '').trim();

  if (source === 'unknown' && requirementType === 'unknown' && logic === 'unknown') {
    return gap;
  }

  let newSeverity = gap.severity;
  let newMatchLevel = gap.matchLevel;

  if (source === 'preferred' || requirementType === 'preferred') {
    if (severity === 'critical' || severity === 'high') newSeverity = 'medium';
  }

  if (requirementType === 'advanced') {
    if (severity === 'critical' || severity === 'high') newSeverity = 'medium';
  }

  if (requirementType === 'operational') {
    if (severity === 'critical' || severity === 'high') newSeverity = 'medium';
  }

  if (logic === 'oneof') {
    const hasEvidence = resumeEvidence !== '' && resumeEvidence !== '불명확함';
    if (matchLevel === 'missing' && hasEvidence) {
      newMatchLevel = 'partial';
    }
    if ((matchLevel === 'missing' && hasEvidence) || matchLevel === 'partial') {
      if (severity === 'critical' || severity === 'high') newSeverity = 'medium';
    }
  }

  if (newSeverity === gap.severity && newMatchLevel === gap.matchLevel) return gap;
  return { ...gap, severity: newSeverity, matchLevel: newMatchLevel };
}

export function getMetadataSortTuple(gap) {
  const metaWeight = getRequirementMetadataWeight(gap);
  const sevOrder = SEV_ORDER[String(gap.severity || '').toLowerCase()] ?? 99;
  const matchOrder = MATCH_ORDER[String(gap.matchLevel || '').toLowerCase()] ?? 99;
  return [metaWeight, sevOrder, matchOrder];
}
