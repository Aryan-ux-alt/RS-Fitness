import { Component } from "react";
import { C } from "../../constants/data";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error: error.toString(),
      errorInfo: errorInfo.componentStack
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1E3A5F 0%, #2D5A8C 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(16px, 5vw, 24px)",
          fontFamily: "'Barlow', sans-serif"
        }}>
          <div style={{
            textAlign: "center",
            maxWidth: 420,
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: 20,
            padding: "clamp(24px, 5vw, 40px)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            width: "100%"
          }}>
            {/* Icon */}
            <div style={{
              width: 80,
              height: 80,
              background: "linear-gradient(135deg, #FECACA 0%, #FCA5A5 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: 40
            }}>
              ⚠️
            </div>

            {/* Title */}
            <h1 style={{
              color: "#1E3A5F",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(22px, 6vw, 28px)",
              fontWeight: 800,
              margin: "0 0 12px",
              letterSpacing: 1
            }}>
              Something Went Wrong
            </h1>

            {/* Description */}
            <p style={{
              color: "#6B7280",
              fontSize: "clamp(13px, 3vw, 15px)",
              lineHeight: 1.6,
              margin: "0 0 24px",
              fontWeight: 500
            }}>
              The app encountered an unexpected error. Please try refreshing or contact support if the problem persists.
            </p>

            {/* Error Details (Dev Mode) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 12,
                padding: "clamp(12px, 3vw, 16px)",
                marginBottom: 24,
                textAlign: "left",
                maxHeight: 200,
                overflowY: "auto"
              }}>
                <div style={{
                  color: "#B91C1C",
                  fontWeight: 700,
                  fontSize: "clamp(11px, 2vw, 12px)",
                  marginBottom: 8,
                  fontFamily: "monospace"
                }}>
                  Error Details (Dev Only):
                </div>
                <div style={{
                  color: "#7F1D1D",
                  fontSize: "clamp(10px, 2vw, 11px)",
                  fontFamily: "monospace",
                  wordBreak: "break-word",
                  lineHeight: 1.5
                }}>
                  {this.state.error}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              gap: "clamp(8px, 2vw, 12px)",
              flexWrap: "wrap",
              marginBottom: 20
            }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  flex: 1,
                  minWidth: 120,
                  background: "#3B82F6",
                  border: "none",
                  borderRadius: 10,
                  padding: "clamp(10px, 2vw, 12px)",
                  color: "#fff",
                  fontSize: "clamp(12px, 3vw, 14px)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  textTransform: "uppercase",
                  minHeight: 40,
                  transition: "opacity 0.2s"
                }}
                onMouseEnter={e => e.target.style.opacity = "0.85"}
                onMouseLeave={e => e.target.style.opacity = "1"}
              >
                🔄 Refresh
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  minWidth: 120,
                  background: "transparent",
                  border: "1.5px solid #3B82F6",
                  borderRadius: 10,
                  padding: "clamp(10px, 2vw, 12px)",
                  color: "#3B82F6",
                  fontSize: "clamp(12px, 3vw, 14px)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  textTransform: "uppercase",
                  minHeight: 40,
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => e.target.style.background = "rgba(59, 130, 246, 0.1)"}
                onMouseLeave={e => e.target.style.background = "transparent"}
              >
                🏠 Home
              </button>
            </div>

            {/* Support Info */}
            <div style={{
              background: "#F0F9FF",
              border: "1px solid #BFDBFE",
              borderRadius: 12,
              padding: "clamp(12px, 3vw, 16px)"
            }}>
              <div style={{
                fontSize: "clamp(11px, 2vw, 12px)",
                color: "#1E40AF",
                fontWeight: 600,
                marginBottom: 4
              }}>
                💬 Need Help?
              </div>
              <div style={{
                fontSize: "clamp(11px, 2vw, 12px)",
                color: "#0369A1",
                fontWeight: 500,
                lineHeight: 1.5
              }}>
                Contact support@rsfitness.com or try refreshing the page
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
