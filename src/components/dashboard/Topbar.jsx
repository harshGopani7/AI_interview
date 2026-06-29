import { useNavigate } from "react-router-dom";
import { removeToken } from "../../services/token";
import "./Topbar.css";

export default function Topbar() {
  const navigate = useNavigate();
  const userData = JSON.parse(sessionStorage.getItem("candidateData") || "{}");
  const candidateName = userData.name || "Candidate";

  // Dynamic date for 2026 context
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  const handleLogout = () => {
    // Thorough cleanup of all auth-related keys
    const keysToRemove = [
      "userRole", "userName", "candidateData", 
      "Interview_ai_candidateData", "Interview_ai_scheduledInterviews", 
      "Interview_ai_token", "interview_ai_token"
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    removeToken();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar-left-section">
        <span className="topbar-date-badge">{today}</span>
        <h1 className="topbar-greeting">Hello, {candidateName}</h1>
      </div>
      
      <div className="topbar-right-section">
        {/* Status indicator for AI Readiness */}
        {/* <div className="system-status-pill d-none d-md-flex">
          <span className="status-dot-pulse"></span>
          AI Assistant Online
        </div> */}

        <div className="topbar-vertical-divider"></div>

        <div className="topbar-user-control">
          <div className="user-meta d-none d-sm-block">
            <span className="user-meta-name">{candidateName}</span>
            <span className="user-meta-role">Candidate Account</span>
          </div>
          
          <div className="user-avatar-small">
            {candidateName.charAt(0)}
          </div>

          <button className="topbar-logout-btn" onClick={handleLogout} title="Sign Out">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
