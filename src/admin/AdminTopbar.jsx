import { useNavigate } from "react-router-dom";
import { removeToken } from "../services/token";
import "../components/organization-dashboard/OrgTopbar.css";
import { HiOutlineBell, HiOutlineUserCircle } from "react-icons/hi2";

export default function AdminTopbar() {
  const navigate = useNavigate();
  const adminName = localStorage.getItem("adminName") || "Admin";
  
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminName");
    navigate("/admin");
  };

  return (
    <header className="org-topbar">
      <div className="topbar-left">
        <span className="topbar-date">{today}</span>
        <h1 className="topbar-welcome">Welcome, {adminName}</h1>
      </div>
      
      <div className="topbar-right">
        <button className="topbar-icon-btn" aria-label="Notifications">
          <HiOutlineBell />
          <span className="notification-dot"></span>
        </button>

        <div className="topbar-divider"></div>

        <div className="topbar-profile">
          <div className="profile-info text-end d-none d-md-block">
            <span className="profile-name">{adminName}</span>
            <span className="profile-role">Admin Account</span>
          </div>
          <div className="profile-avatar">
            {adminName.charAt(0)}
          </div>
          
          <button className="logout-link-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
