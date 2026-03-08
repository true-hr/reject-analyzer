import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      info: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, info) {
    console.error("APP_ERROR_BOUNDARY_CAUGHT");
    console.error(error);
    console.error(info?.componentStack || "");
    if (typeof window !== "undefined") {
      window.__PASSMAP_LAST_RENDER_ERROR__ = {
        message: error?.message || String(error),
        stack: error?.stack || "",
        componentStack: info?.componentStack || "",
      };
    }
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      const message =
        this.state.error?.message || String(this.state.error || "Unknown render error");
      const stack = this.state.error?.stack || "";
      const componentStack = this.state.info?.componentStack || "";

      return (
        <div style={{ padding: 16, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
          <h2>PASSMAP Render Crash</h2>
          <div><strong>message:</strong> {message}</div>
          <div style={{ marginTop: 12 }}>
            <strong>stack:</strong>
            <pre>{stack}</pre>
          </div>
          <div style={{ marginTop: 12 }}>
            <strong>componentStack:</strong>
            <pre>{componentStack}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

