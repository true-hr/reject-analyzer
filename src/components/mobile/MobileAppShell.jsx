import { useEffect, useState } from "react";
import MobileBottomTab from "./MobileBottomTab.jsx";
import MobileHomeDashboard from "./MobileHomeDashboard.jsx";
import MobileAnalysisHub from "./MobileAnalysisHub.jsx";
import MobileRecordTab from "./MobileRecordTab.jsx";
import MobileResumeTab from "./MobileResumeTab.jsx";
import MobileSettingsTab from "./MobileSettingsTab.jsx";
import CareerAssetMapMock from "../home/CareerAssetMapMock.jsx";
import AiCaptureGuideModal from "../onboarding/AiCaptureGuideModal.jsx";
import FullProductGuidedTour from "../onboarding/FullProductGuidedTour.jsx";

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
  aiInboxOpenSignal = 0,
  firstRecordTourRecordSignal = 0,
  onStartFirstRecordTour = null,
  initialRecordDate = null,
  reminderProps,
  careerBaselineProps,
}) {
  const [activeTab, setActiveTab] = useState(() =>
    Number(aiInboxOpenSignal) > 0 || initialRecordDate ? "record" : "home"
  );
  const [mobileAiInboxOpenSignal, setMobileAiInboxOpenSignal] = useState(0);
  const [aiCaptureGuideOpen, setAiCaptureGuideOpen] = useState(false);
  const [fullProductTourOpen, setFullProductTourOpen] = useState(false);
  const effectiveAiInboxOpenSignal = Number(aiInboxOpenSignal) + mobileAiInboxOpenSignal;

  const openMobileAiInbox = () => {
    setAiCaptureGuideOpen(false);
    setMobileAiInboxOpenSignal((n) => n + 1);
    setActiveTab("record");
  };

  const startManualFirstRecordTour = () => {
    setActiveTab("home");
    window.setTimeout(() => {
      onStartFirstRecordTour?.();
    }, 0);
  };

  const startManualFullProductTour = () => {
    setActiveTab("settings");
    setFullProductTourOpen(true);
  };

  const navigateFullProductTour = (action) => {
    if (action === "mobile-settings") {
      setActiveTab("settings");
      return;
    }
    if (action === "home") {
      setActiveTab("home");
      return;
    }
    if (action === "asset-map") {
      setActiveTab("asset-map");
      return;
    }
    if (action === "resume") {
      setActiveTab("resume");
      return;
    }
    if (action === "analysis") {
      setActiveTab("analysis");
    }
  };

  useEffect(() => {
    if (Number(aiInboxOpenSignal) <= 0) return;
    setActiveTab("record");
  }, [aiInboxOpenSignal]);

  useEffect(() => {
    if (!initialRecordDate) return;
    setActiveTab("record");
  }, [initialRecordDate]);

  useEffect(() => {
    if (Number(firstRecordTourRecordSignal) <= 0) return;
    setActiveTab("record");
  }, [firstRecordTourRecordSignal]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50">
      <div className="flex-1 overflow-y-auto">
        {activeTab === "home" && (
          <MobileHomeDashboard
            onNavigate={setActiveTab}
            onOpenAiInbox={() => setAiCaptureGuideOpen(true)}
            auth={auth}
            pmLastInput={resumeLastInput}
            careerLabel={recordCareerLabel}
            onLogin={onHomeLogin}
            onStartFirstRecordTour={onStartFirstRecordTour}
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
            careerBaseline={careerBaselineProps?.value}
          />
        )}
        {activeTab === "record"   && (
          <MobileRecordTab
            currentCareerRoleLabel={recordCareerLabel}
            currentJobId={recordJobId}
            onRecordSubmit={onRecordSubmit}
            onOpenLogin={onRecordLogin}
            onOpenResumeView={() => setActiveTab("resume")}
            onOpenAssetMap={() => setActiveTab("asset-map")}
            onOpenAnalysis={() => setActiveTab("analysis")}
            auth={auth}
            aiInboxOpenSignal={effectiveAiInboxOpenSignal}
            tourOpenSignal={firstRecordTourRecordSignal}
            initialRecordDate={initialRecordDate}
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
            onNavigateRecord={() => setActiveTab("record")}
            onStartFirstRecordTour={startManualFirstRecordTour}
            onStartFullProductTour={startManualFullProductTour}
          />
        )}
        {activeTab === "asset-map" && (
          <div className="px-3 py-4">
            <CareerAssetMapMock
              onOpenRecordInput={() => setActiveTab("record")}
              onOpenResumeResult={() => setActiveTab("resume")}
              postSaveContextTourVariant="mobile"
            />
          </div>
        )}
      </div>
      <MobileBottomTab activeTab={activeTab} onTabChange={setActiveTab} />
      <AiCaptureGuideModal
        open={aiCaptureGuideOpen}
        onClose={() => setAiCaptureGuideOpen(false)}
        onGoToInbox={openMobileAiInbox}
      />
      <FullProductGuidedTour
        open={fullProductTourOpen}
        variant="mobile"
        onNavigate={navigateFullProductTour}
        onClose={() => setFullProductTourOpen(false)}
        onComplete={() => setFullProductTourOpen(false)}
      />
    </div>
  );
}
