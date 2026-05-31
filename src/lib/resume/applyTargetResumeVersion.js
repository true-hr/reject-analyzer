function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function rankBullet(bullet, promotedSet, selectedSet) {
  if (promotedSet.has(bullet?.id)) return 0;
  if (selectedSet.has(bullet?.id)) return 1;
  return 2;
}

export function applyTargetResumeVersion(profile = {}, targetVersion = {}) {
  const view = clone(profile);
  const hiddenSet = new Set(Array.isArray(targetVersion.hiddenBulletIds) ? targetVersion.hiddenBulletIds : []);
  const promotedSet = new Set(Array.isArray(targetVersion.promotedBulletIds) ? targetVersion.promotedBulletIds : []);
  const selectedSet = new Set(Array.isArray(targetVersion.selectedBulletIds) ? targetVersion.selectedBulletIds : []);

  view.experiences = (Array.isArray(view.experiences) ? view.experiences : []).map((experience) => {
    const originalBullets = Array.isArray(experience.bullets) ? experience.bullets : [];
    const filtered = originalBullets.filter((bullet) => {
      if (hiddenSet.has(bullet?.id)) return false;
      if (selectedSet.size === 0) return true;
      return selectedSet.has(bullet?.id) || promotedSet.has(bullet?.id);
    });
    return {
      ...experience,
      bullets: filtered.sort((a, b) => rankBullet(a, promotedSet, selectedSet) - rankBullet(b, promotedSet, selectedSet)),
    };
  });

  view.versions = [
    ...(Array.isArray(view.versions) ? view.versions : []),
    {
      id: targetVersion.id,
      label: targetVersion.targetRole ? `JD tailored: ${targetVersion.targetRole}` : "JD tailored resume",
      createdAt: targetVersion.createdAt,
      source: { type: "jd_rewrite", refId: targetVersion.id, label: "JD tailoring preview", confidence: null },
      notes: "Deterministic JD-tailored export view",
      targetVersion,
    },
  ];
  view.meta = {
    ...(view.meta || {}),
    appliedTargetVersionId: targetVersion.id,
  };

  return view;
}

export default applyTargetResumeVersion;
