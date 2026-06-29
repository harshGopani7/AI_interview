import { NavLink, useNavigate } from "react-router-dom";
import "./OrgSidebar.css";
import {
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineClipboardDocumentList,
  HiOutlineUsers,
  HiOutlineCog6Tooth,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineCreditCard,
  HiOutlineDocumentText,
  HiOutlineBriefcase,
  HiOutlineSparkles
} from "react-icons/hi2"; // Switched to Hi2 for modern look
import { useEffect, useState } from "react";
import { getSubscriptionStatus } from "../../services/subscriptionApi";

export default function OrgSidebar() {
  const ORG_ICON_SIZE = 26;
  const navigate = useNavigate();
  const [plan, setPlan] = useState();

  const handleLogout = () => {
    localStorage.removeItem("interview_ai_token");
    navigate("/login");
  };
  // fetch the subscription status, if it is basic , dont show smart scheduler and All interviews
  useEffect(() => {
    getSubscriptionStatus().then((data) => {
      console.log(data)
      setPlan(data.planName)
    })
  }, []);

  return (
    <aside className="org-sidebar">
      <div className="org-sidebar-header">
        <img src="/oneweblogo.png" alt="Logo" className="sidebar-logo" />
      </div>

      <div className="sidebar-nav-container">
        <nav className="org-sidebar-nav">
          <NavLink to="/organization/dashboard" className="org-nav-item" end>
            <HiOutlineChartBar className="org-nav-icon" size={ORG_ICON_SIZE} />
            <span className="org-nav-text">Overview</span>
          </NavLink>

          {/* <NavLink to="/organization/dashboard/schedule-interview" className="org-nav-item">
            <HiOutlineCalendar className="org-nav-icon" size={ORG_ICON_SIZE}/>
            <span className="org-nav-text">Interview Scheduler</span>
          </NavLink> */}

          {plan !== "Basic" && (
            <NavLink to="/organization/dashboard/smart-scheduler" className="org-nav-item">
              <HiOutlineSparkles className="org-nav-icon" size={ORG_ICON_SIZE} />
              <span className="org-nav-text">Smart Scheduler</span>
            </NavLink>
          )}

          {plan !== "Basic" && (
            <NavLink to="/organization/dashboard/interviews" className="org-nav-item">
              <HiOutlineClipboardDocumentList className="org-nav-icon" size={ORG_ICON_SIZE} />
              <span className="org-nav-text">All Interviews</span>
            </NavLink>
          )}


          <NavLink to="/organization/dashboard/cv-analyser" className="org-nav-item">
            <HiOutlineClipboardDocumentList className="org-nav-icon" size={ORG_ICON_SIZE} />
            <span className="org-nav-text">CV Analyser</span>
          </NavLink>

          <NavLink to="/organization/dashboard/job-master" className="org-nav-item">
            <HiOutlineBriefcase className="org-nav-icon" size={ORG_ICON_SIZE} />
            <span className="org-nav-text">Job Master</span>
          </NavLink>

          <NavLink to="/organization/dashboard/candidates" className="org-nav-item">
            <HiOutlineUsers className="org-nav-icon" size={ORG_ICON_SIZE} />
            <span className="org-nav-text">Candidates</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/organization/dashboard/subscription" className="org-nav-item">
            <HiOutlineCreditCard className="org-nav-icon" size={ORG_ICON_SIZE} />
            <span className="org-nav-text">Subscription</span>
          </NavLink>
          <NavLink to="/organization/dashboard/billing" className="org-nav-item">
            <HiOutlineDocumentText className="org-nav-icon" size={ORG_ICON_SIZE} />
            <span className="org-nav-text">Billing</span>
          </NavLink>
          <NavLink to="/organization/dashboard/settings" className="org-nav-item">
            <HiOutlineCog6Tooth className="org-nav-icon" size={ORG_ICON_SIZE} />
            <span className="org-nav-text">Settings</span>
          </NavLink>
          <button className="org-nav-item logout-btn" onClick={handleLogout}>
            <HiOutlineArrowLeftOnRectangle className="org-nav-icon" size={ORG_ICON_SIZE} />
            <span className="org-nav-text">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}