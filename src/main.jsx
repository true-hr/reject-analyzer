import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

try {
  if (window?.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init("239fc077c344b10fedc59dad3f558022");
  }
} catch { }

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
