import { useState, useEffect } from "react";
import { C } from "../../constants/data";

export default function OfflineScreen() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div style={{ 
      position: "fixed", 
      inset: 0, 
      background: "linear-gradient(135deg, #1E3A5F 0%, #2D5A8C 100%)",
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      zIndex: 9999,
      minHeight: "100vh",
      padding: "clamp(16px, 5vw, 24px)"
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .offline-icon {
          animation: pulse 2s ease-in-out infinite;
        }
        .offline-dot {
          animation: bounce 1.5s ease-in-out infinite;
        }
        @media (max-width: 640px) {
          .offline-container { max-width: 100% !important; }
          .offline-title { font-size: 24px !important; }
          .offline-desc { font-size: 14px !important; }
          .offline-tips { font-size: 13px !important; }
        }
      `}</style>

      <div className="offline-container" style={{
        textAlign: "center",
        maxWidth: 420,
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: 20,
        padding: "clamp(24px, 5vw, 40px)",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        backdropFilter: "blur(10px)",
        width: "100%"
      }}>
        {/* Icon */}
        <div className="offline-icon" style={{
          width: 80,
          height: 80,
          background: "linear-gradient(135deg, #FCA5A5 0%, #F87171 100%)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: 40
        }}>
          📡
        </div>

        {/* Title */}
        <h1 className="offline-title" style={{
          color: "#1E3A5F",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(22px, 6vw, 28px)",
          fontWeight: 800,
          margin: "0 0 12px",
          letterSpacing: 1
        }}>
          No Internet Connection
        </h1>

        {/* Description */}
        <p className="offline-desc" style={{
          color: "#6B7280",
          fontSize: "clamp(13px, 3vw, 15px)",
          lineHeight: 1.6,
          margin: "0 0 24px",
          fontWeight: 500
        }}>
          It looks like you've lost your internet connection. Please check your network and try again.
        </p>

        {/* Tips */}
        <div style={{
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: 12,
          padding: "clamp(14px, 3vw, 18px)",
          marginBottom: 24,
          textAlign: "left"
        }}>
          <div className="offline-tips" style={{
            color: "#B91C1C",
            fontWeight: 700,
            fontSize: "clamp(12px, 2vw, 14px)",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <span>⚠️</span> Try This:
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: "clamp(16px, 3vw, 20px)",
            color: "#7F1D1D",
            fontSize: "clamp(12px, 2vw, 13px)",
            lineHeight: 1.8,
            fontWeight: 500
          }}>
            <li style={{ marginBottom: 8 }}>Check if WiFi or mobile data is enabled</li>
            <li style={{ marginBottom: 8 }}>Move closer to your WiFi router</li>
            <li style={{ marginBottom: 8 }}>Restart your router or device</li>
            <li>Contact your internet provider if issues persist</li>
          </ul>
        </div>

        {/* Retry Info */}
        <div style={{
          background: "#F0F9FF",
          border: "1px solid #BFDBFE",
          borderRadius: 12,
          padding: "clamp(12px, 3vw, 16px)",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: "clamp(11px, 2vw, 12px)",
            color: "#1E40AF",
            fontWeight: 600,
            marginBottom: 6
          }}>
            ✓ Auto-Reconnecting
          </div>
          <div style={{
            fontSize: "clamp(11px, 2vw, 12px)",
            color: "#0369A1",
            fontWeight: 500
          }}>
            App will resume when connection is restored
          </div>
        </div>

        {/* Status Indicator */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginTop: 24,
          padding: "12px",
          background: "#F5F5F5",
          borderRadius: 10,
          flexWrap: "wrap"
        }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#DC2626",
            animation: "pulse 1s ease-in-out infinite"
          }}/>
          <span style={{
            fontSize: "clamp(11px, 2vw, 12px)",
            color: "#6B7280",
            fontWeight: 600,
            letterSpacing: 0.5
          }}>
            OFFLINE MODE
          </span>
        </div>

        {/* Footer Help */}
        <div style={{
          marginTop: 20,
          fontSize: "clamp(10px, 2vw, 11px)",
          color: "#9CA3AF",
          fontWeight: 500
        }}>
          Need help? Contact support or check your connection settings
        </div>
      </div>
    </div>
  );
}
