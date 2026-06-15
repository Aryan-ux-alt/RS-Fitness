import { useState, useEffect } from "react";
import { C } from "../../constants/data";

export default function APIErrorDisplay() {
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Store global error handler
    window.handleAPIError = (errorMessage, retry = null) => {
      setError({ message: errorMessage, retry });
      setRetryCount(0);
    };

    // Listen for fetch errors globally
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args)
        .catch(err => {
          if (err.message.includes("Network") || err.message.includes("Failed")) {
            window.handleAPIError("Network request failed. Please check your connection.");
          }
          throw err;
        });
    };

    return () => {
      if (window.handleAPIError) delete window.handleAPIError;
    };
  }, []);

  const handleRetry = () => {
    if (error?.retry) {
      error.retry();
      setRetryCount(c => c + 1);
    }
    setError(null);
  };

  const handleDismiss = () => {
    setError(null);
  };

  if (!error) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "clamp(16px, 3vw, 24px)",
      left: "clamp(12px, 3vw, 16px)",
      right: "clamp(12px, 3vw, 16px)",
      background: "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)",
      border: "2px solid #F87171",
      borderRadius: 12,
      padding: "clamp(12px, 3vw, 16px)",
      boxShadow: "0 10px 30px rgba(239, 68, 68, 0.2)",
      zIndex: 1000,
      animation: "slideUp 0.3s ease-out",
      maxWidth: 400
    }}>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .error-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>

      <div style={{
        display: "flex",
        gap: "clamp(8px, 2vw, 12px)",
        alignItems: "flex-start"
      }}>
        {/* Icon */}
        <div style={{
          fontSize: "clamp(18px, 5vw, 24px)",
          flexShrink: 0,
          marginTop: 2
        }}>
          ⚠️
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: "#B91C1C",
            fontWeight: 700,
            fontSize: "clamp(12px, 3vw, 13px)",
            marginBottom: 4,
            fontFamily: "'Barlow Condensed', sans-serif"
          }}>
            ERROR
          </div>
          <div style={{
            color: "#7F1D1D",
            fontSize: "clamp(11px, 3vw, 12px)",
            lineHeight: 1.5,
            fontWeight: 500,
            marginBottom: error?.retry ? 10 : 0,
            wordBreak: "break-word"
          }}>
            {error?.message}
          </div>

          {/* Action Buttons */}
          {error?.retry && (
            <div style={{
              display: "flex",
              gap: "clamp(6px, 2vw, 8px)",
              flexWrap: "wrap"
            }}>
              <button
                onClick={handleRetry}
                style={{
                  background: "#DC2626",
                  border: "none",
                  borderRadius: 6,
                  padding: "clamp(6px, 2vw, 8px) clamp(10px, 3vw, 12px)",
                  color: "#fff",
                  fontSize: "clamp(10px, 2vw, 11px)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  textTransform: "uppercase",
                  minHeight: 32,
                  transition: "opacity 0.2s"
                }}
                onMouseEnter={e => e.target.style.opacity = "0.85"}
                onMouseLeave={e => e.target.style.opacity = "1"}
              >
                🔄 Retry
              </button>
              <button
                onClick={handleDismiss}
                style={{
                  background: "transparent",
                  border: "1px solid #DC2626",
                  borderRadius: 6,
                  padding: "clamp(6px, 2vw, 8px) clamp(10px, 3vw, 12px)",
                  color: "#DC2626",
                  fontSize: "clamp(10px, 2vw, 11px)",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  textTransform: "uppercase",
                  minHeight: 32,
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => e.target.style.background = "rgba(220, 38, 38, 0.1)"}
                onMouseLeave={e => e.target.style.background = "transparent"}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        {!error?.retry && (
          <button
            onClick={handleDismiss}
            style={{
              background: "transparent",
              border: "none",
              color: "#991B1B",
              fontSize: 18,
              cursor: "pointer",
              padding: 0,
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
