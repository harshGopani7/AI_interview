import { useNavigate } from "react-router-dom";
import { removeToken } from "../../services/token";
import "./OrgTopbar.css";
import { HiOutlineBell, HiOutlineUserCircle } from "react-icons/hi2";

export default function OrgTopbar() {
  const navigate = useNavigate();
  const organizationName = sessionStorage.getItem("organizationName") || "Organization";
  
  // Format current date: e.g., "Tuesday, Jan 20"
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  const handleLogout = () => {
    removeToken();
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("organizationName");
    navigate("/login");
  };

  return (
    <header className="org-topbar">
      <div className="topbar-left">
        <h1 className="topbar-welcome">Welcome, {organizationName}</h1>
        <span className="topbar-date">{today}</span>
      </div>
      
      <div className="topbar-right">
        {/* Utility Icons */}
        {/* <button className="topbar-icon-btn" aria-label="Notifications">
          <HiOutlineBell />
          <span className="notification-dot"></span>
        </button> */}

        <div className="topbar-divider"></div>

        {/* Profile Section */}
        <div className="topbar-profile">
          <div className="profile-info text-end d-none ">
            {/* <span className="profile-name">{organizationName}</span> */}
            {/* <span className="profile-role">Admin Account</span> */}
          </div>
          <div className="profile-avatar">
            {organizationName.charAt(0)}
          </div>
          
          <button className="logout-link-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}