import { NavLink, useNavigate } from "react-router-dom";
import "../components/organization-dashboard/OrgSidebar.css";
import { 
  HiOutlineChartBar, 
  HiOutlineUsers, 
  HiOutlineClipboardDocumentList, 
  HiOutlineBuildingOffice,
  HiOutlineCog6Tooth,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineDocumentMagnifyingGlass,
  HiOutlineCreditCard,
} from "react-icons/hi2";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("interview_ai_token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminName");
    navigate("/admin");
  };

  return (
    <aside className="org-sidebar">
      <div className="org-sidebar-header">
        <img src="/oneweblogo.png" alt="Logo" className="sidebar-logo" />
      </div>
      
      <div className="sidebar-nav-container">
        <nav className="org-sidebar-nav">
          <NavLink to="/admin/dashboard" className="org-nav-item" end>
            <HiOutlineChartBar className="org-nav-icon" />
            <span>Overview</span>
          </NavLink>

          <NavLink to="/admin/dashboard/organizations" className="org-nav-item">
            <HiOutlineBuildingOffice className="org-nav-icon" />
            <span>Organizations</span>
          </NavLink>

          <NavLink to="/admin/dashboard/candidates" className="org-nav-item">
            <HiOutlineUsers className="org-nav-icon" />
            <span>Candidates</span>
          </NavLink>

          <NavLink to="/admin/dashboard/interviews" className="org-nav-item">
            <HiOutlineClipboardDocumentList className="org-nav-icon" />
            <span>All Interviews</span>
          </NavLink>

          <NavLink to="/admin/dashboard/cv-analysis" className="org-nav-item">
            <HiOutlineDocumentMagnifyingGlass className="org-nav-icon" />
            <span>CV Analysis</span>
          </NavLink>

          <NavLink to="/admin/dashboard/pricing" className="org-nav-item">
            <HiOutlineClipboardDocumentList className="org-nav-icon" />
            <span>Pricing</span>
          </NavLink>

          <NavLink to="/admin/dashboard/subscriptions" className="org-nav-item">
            <HiOutlineCreditCard className="org-nav-icon" />
            <span>Subscriptions</span>
          </NavLink>

          <NavLink to="/admin/dashboard/prompts" className="org-nav-item">
            <HiOutlineChatBubbleBottomCenterText className="org-nav-icon" />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/admin/dashboard/settings" className="org-nav-item">
            <HiOutlineCog6Tooth className="org-nav-icon" />
            <span>Profile</span>
          </NavLink>
          <button className="org-nav-item logout-btn" onClick={handleLogout}>
            <HiOutlineArrowLeftOnRectangle className="org-nav-icon" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
