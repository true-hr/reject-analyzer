import { useState } from "react";
import MobileBottomTab from "./MobileBottomTab.jsx";
import MobileHomeDashboard from "./MobileHomeDashboard.jsx";
import MobileAnalysisHub from "./MobileAnalysisHub.jsx";
import MobileRecordTab from "./MobileRecordTab.jsx";
import MobileResumeTab from "./MobileResumeTab.jsx";
import MobileSettingsTab from "./MobileSettingsTab.jsx";

function PlaceholderScreen({ label }) {
  return (
    <div className="flex h-full items-center justify-center pb-20">
      <p className="text-sm text-slate-400">{label} 준비 중</p>
    </div>
  );
}

export default function MobileAppShell({
  onStartJobAnalysis,
  onStartRejectAnalysis,
  onViewResults,
  recordCareerLabel,
  recordJobId,
  onRecordSubmit,
  onRecordLogin,
  resumeLastInput,
  resumeCareerLabel,
  resumeJobId,
  onResumeLogin,
  auth,
  onSettingsLogin,
  onSettingsLogout,
}) {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50">
      <div className="flex-1 overflow-y-auto">
        {activeTab === "home"     && <MobileHomeDashboard onNavigate={setActiveTab} />}
        {activeTab === "analysis" && (
          <MobileAnalysisHub
            onStartJobAnalysis={onStartJobAnalysis}
            onStartRejectAnalysis={onStartRejectAnalysis}
            onViewResults={onViewResults}
          />
        )}
        {activeTab === "record"   && (
          <MobileRecordTab
            currentCareerRoleLabel={recordCareerLabel}
            currentJobId={recordJobId}
            onRecordSubmit={onRecordSubmit}
            onOpenLogin={onRecordLogin}
          />
        )}
        {activeTab === "resume"   && (
          <MobileResumeTab
            externalLastInput={resumeLastInput}
            currentCareerRoleLabel={resumeCareerLabel}
            currentJobId={resumeJobId}
            onOpenLogin={onResumeLogin}
            onNavigateRecord={() => setActiveTab("record")}
            onNavigateAnalysis={() => setActiveTab("analysis")}
          />
        )}
        {activeTab === "settings" && (
          <MobileSettingsTab
            auth={auth}
            onLogin={onSettingsLogin}
            onLogout={onSettingsLogout}
          />
        )}
      </div>
      <MobileBottomTab activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
