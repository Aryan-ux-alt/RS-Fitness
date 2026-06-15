import { useState, useEffect } from "react";
import AuthScreen from "./components/auth/AuthScreen";
import GymOwnerDashboard from "./components/gym-owner/GymOwnerDashboard";
import App from "./App";
import OfflineScreen from "./components/error/OfflineScreen";
import ErrorBoundary from "./components/error/ErrorBoundary";
import APIErrorDisplay from "./components/error/APIErrorDisplay";

export default function Root() {
  useEffect(() => {
    try {
      Object.keys(localStorage).filter(k => k.startsWith("rs_")).forEach(k => {
        try { const v = localStorage.getItem(k); if (v) JSON.parse(v); }
        catch { localStorage.removeItem(k); }
      });
    } catch {}
  }, []);

  const [user, setUser] = useState(() => {
    try {
      const v = localStorage.getItem("rs_session");
      if (!v) return null;
      const p = JSON.parse(v);
      const storedUser = p?.user || p;
      if (!storedUser || !storedUser.email || !storedUser.name) { localStorage.removeItem("rs_session"); return null; }
      return storedUser;
    } catch { localStorage.removeItem("rs_session"); return null; }
  });
  const [gymOwner, setGymOwner] = useState(() => {
    try {
      const v = localStorage.getItem("rs_gym_owner_session");
      if (!v) return null;
      const p = JSON.parse(v);
      const storedGymOwner = p?.gymOwner || p;
      if (!storedGymOwner || !storedGymOwner.email || !storedGymOwner.gymName) { localStorage.removeItem("rs_gym_owner_session"); return null; }
      return storedGymOwner;
    } catch { localStorage.removeItem("rs_gym_owner_session"); return null; }
  });

  const handleAuth = session => {
    if (session.accountType === "gym_owner") {
      try {
        localStorage.setItem("rs_gym_owner_session", JSON.stringify(session));
        localStorage.removeItem("rs_session");
      } catch {}
      setGymOwner(session.gymOwner);
      setUser(null);
      return;
    }
    try {
      localStorage.setItem("rs_session", JSON.stringify(session));
      localStorage.removeItem("rs_gym_owner_session");
    } catch {}
    setUser(session.user || session);
    setGymOwner(null);
  };
  const handleLogout = () => {
    try {
      localStorage.removeItem("rs_session");
      localStorage.removeItem("rs_gym_owner_session");
    } catch {}
    setUser(null);
    setGymOwner(null);
  };

  const appContent = gymOwner 
    ? <GymOwnerDashboard gymOwner={gymOwner} onLogout={handleLogout}/>
    : !user 
    ? <AuthScreen onAuth={handleAuth}/> 
    : <App user={user} onLogout={handleLogout}/>;

  return (
    <ErrorBoundary>
      <OfflineScreen />
      <APIErrorDisplay />
      {appContent}
    </ErrorBoundary>
  );
}
