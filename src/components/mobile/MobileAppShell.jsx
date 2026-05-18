import { useState } from "react";
import MobileBottomTab from "./MobileBottomTab.jsx";
import MobileHomeDashboard from "./MobileHomeDashboard.jsx";
import MobileAnalysisHub from "./MobileAnalysisHub.jsx";
import MobileRecordTab from "./MobileRecordTab.jsx";
import MobileResumeTab from "./MobileResumeTab.jsx";
import MobileSettingsTab from "./MobileSettingsTab.jsx";

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
  onHomeLogin,
  onSettingsLogin,
  onSettingsLogout,
  mobileAnalysisMode,
  onExecuteAnalysis,
  onClearMobileAnalysisMode,
  onSubmitTransitionLite,
  reminderProps,
  careerBaselineProps,
}) {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50">
      <div className="flex-1 overflow-y-auto">
        {activeTab === "home" && (
          <MobileHomeDashboard
            onNavigate={setActiveTab}
            auth={auth}
            pmLastInput={resumeLastInput}
            careerLabel={recordCareerLabel}
            onLogin={onHomeLogin}
            careerBaseline={careerBaselineProps?.value}
          />
        )}
        {activeTab === "analysis" && (
          <MobileAnalysisHub
            onStartJobAnalysis={onStartJobAnalysis}
            onStartRejectAnalysis={onStartRejectAnalysis}
            onViewResults={onViewResults}
            activeAnalysisMode={mobileAnalysisMode}
            onExecuteAnalysis={onExecuteAnalysis}
            onClearMobileAnalysisMode={onClearMobileAnalysisMode}
            onSubmitTransitionLite={onSubmitTransitionLite}
          />
        )}
        {activeTab === "record"   && (
          <MobileRecordTab
            currentCareerRoleLabel={recordCareerLabel}
            currentJobId={recordJobId}
            onRecordSubmit={onRecordSubmit}
            onOpenLogin={onRecordLogin}
            onOpenResumeView={() => setActiveTab("resume")}
            onOpenAnalysis={() => setActiveTab("analysis")}
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
            auth={auth}
          />
        )}
        {activeTab === "settings" && (
          <MobileSettingsTab
            auth={auth}
            onLogin={onSettingsLogin}
            onLogout={onSettingsLogout}
            reminderProps={reminderProps}
            careerBaselineProps={careerBaselineProps}
          />
        )}
      </div>
      <MobileBottomTab activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
