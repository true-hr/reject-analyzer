import React from "react";
import ResumeExperienceCard from "./ResumeExperienceCard.jsx";
import ResumeQualityPanel from "./ResumeQualityPanel.jsx";

function Bucket({ label, items }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {list.length ? (
          list.map((item) => (
            <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{item}</span>
          ))
        ) : (
          <span className="text-sm text-slate-400">아직 없습니다.</span>
        )}
      </div>
    </div>
  );
}

export default function ResumeImportReview({ profile }) {
  if (!profile) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
        <h2 className="text-base font-semibold text-slate-950">이력서 검수</h2>
        <p className="mt-2 text-sm text-slate-500">검수할 이력서 데이터가 아직 없습니다.</p>
      </section>
    );
  }

  const experiences = Array.isArray(profile.experiences) ? profile.experiences : [];
  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  const education = Array.isArray(profile.education) ? profile.education : [];
  const skills = profile.skills || {};

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-950">이력서 검수</h2>
        <p className="mt-1 text-sm text-slate-500">가져온 이력서가 어떻게 구조화됐는지 확인하세요.</p>
      </header>

      <ResumeQualityPanel quality={profile.quality} />

      <section>
        <h3 className="text-sm font-semibold text-slate-950">경력</h3>
        <div className="mt-3 space-y-3">
          {experiences.length ? (
            experiences.map((experience) => <ResumeExperienceCard key={experience.id} experience={experience} />)
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">경력 정보가 아직 없습니다.</div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">프로젝트</h3>
          <div className="mt-3 space-y-3">
            {projects.length ? (
              projects.map((project) => (
                <div key={project.id} className="rounded-md bg-slate-50 px-3 py-2">
                  <div className="text-sm font-medium text-slate-900">{project.name || "프로젝트명 미확인"}</div>
                  {project.role ? <div className="mt-1 text-xs text-slate-500">{project.role}</div> : null}
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">프로젝트 정보가 아직 없습니다.</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-950">스킬</h3>
          <div className="mt-3 space-y-4">
            <Bucket label="기술" items={skills.technical} />
            <Bucket label="도구" items={skills.tools} />
            <Bucket label="도메인" items={skills.domain} />
            <Bucket label="언어" items={skills.language} />
            <Bucket label="자격" items={skills.certificates} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-950">학력</h3>
        <div className="mt-3 space-y-2">
          {education.length ? (
            education.map((item) => (
              <div key={item.id} className="text-sm text-slate-700">
                {item.school || "학교명 미확인"} {item.major ? `· ${item.major}` : ""} {item.degree ? `· ${item.degree}` : ""}
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500">학력 정보가 아직 없습니다.</div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        패스맵 업무기록과 AI Inbox 기반 보강 후보는 다음 단계에서 연결됩니다.
      </section>
    </section>
  );
}
