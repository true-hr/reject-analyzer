import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AdminAnalysisPage from "./pages/AdminAnalysisPage.jsx";
import ConsultingLeadPage from "./pages/ConsultingLeadPage.jsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.jsx";
import AppErrorBoundary from "./components/debug/AppErrorBoundary.jsx";
import "./index.css";

try {
  if (window?.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init("239fc077c344b10fedc59dad3f558022");
  }
} catch { }

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      {(() => {
        try {
          const pathname = String(window?.location?.pathname || "").replace(/\/+$/, "");
          if (
            pathname === "/privacy" ||
            pathname === "/privacy-policy" ||
            pathname === "/reject-analyzer/privacy" ||
            pathname === "/reject-analyzer/privacy-policy"
          ) {
            return <PrivacyPolicyPage />;
          }
          const sp = new URLSearchParams(window?.location?.search || "");
          const page = String(sp.get("page") || "").trim().toLowerCase();
          if (page === "admin-analysis") {
            return <AdminAnalysisPage />;
          }
          if (page === "consulting-lead") {
            const rawType = String(sp.get("type") || "").trim().toLowerCase();
            const type = ["mini", "onepoint", "care"].includes(rawType) ? rawType : "mini";
            return <ConsultingLeadPage type={type} />;
          }
        } catch { }
        return <App />;
      })()}
    </AppErrorBoundary>
  </React.StrictMode>
);
