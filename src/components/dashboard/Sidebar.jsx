import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import { HiOutlineChartBar, HiOutlineCalendarDays, HiOutlineMicrophone, HiOutlineCommandLine, HiOutlineDocumentChartBar, HiOutlineUserCircle } from "react-icons/hi2";
import { useEffect } from "react";
import { getSubscriptionStatus } from "../../services/subscriptionApi";

export default function Sidebar() {


  
  const candidateData = JSON.parse(sessionStorage.getItem("candidateData") || "{}");
  const candidateName = candidateData.name || "Candidate";

  return (
    <aside className="sidebar">
      {/* Branding Section */}
      <div className="sidebar-header">
        <img src="/oneweblogo.png" alt="InterviewAI" className="sidebar-logo-img" />
      </div>

      {/* Profile Summary Area */}
      <div className="sidebar-user-profile">
        <div className="user-avatar-main">
          {candidateName.charAt(0)}
        </div>
        <div className="user-info-text">
          <span className="user-greeting">Welcome back,</span>
          <h5 className="user-display-name text-truncate">{candidateName}</h5>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="sidebar-nav-list">
        <NavLink to="/dashboard" className="nav-item-link" end>
          <HiOutlineChartBar className="nav-link-icon" />
          <span>Overview</span>
        </NavLink>

        <NavLink to="/dashboard/scheduled-interviews" className="nav-item-link">
          <HiOutlineCalendarDays className="nav-link-icon" />
          <span>HR Scheduled</span>
        </NavLink>

        {/* <NavLink to="/dashboard/audio-testing" className="nav-item-link">
          <HiOutlineMicrophone className="nav-link-icon" />
          <span>Audio Testing</span>
        </NavLink> */}

        {/* <NavLink to="/dashboard/practice" className="nav-item-link">
          <HiOutlineCommandLine className="nav-link-icon" />
          <span>Self Practice</span>
        </NavLink> */}

        <NavLink to="/dashboard/reports" className="nav-item-link">
          <HiOutlineDocumentChartBar className="nav-link-icon" />
          <span>My Reports</span>
        </NavLink>

        <div className="nav-divider"></div>

        {/* <NavLink to="/dashboard/profile" className="nav-item-link">
          <HiOutlineUserCircle className="nav-link-icon" />
          <span>Profile Settings</span>
        </NavLink> */}
      </nav>
      

    </aside>
  );
}
