import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import OrgSidebar from "./OrgSidebar";
import OrgTopbar from "./OrgTopbar";
import FirstTimeJobModal from "./FirstTimeJobModal";
import { checkFirstTime } from "../../services/jobMasterApi";
import "./OrgDashboardLayout.css";

export default function OrgDashboardLayout({ children }) {
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [checkedFirstTime, setCheckedFirstTime] = useState(false);

  useEffect(() => {
    const checkIfFirstTime = async () => {
      try {
        const data = await checkFirstTime();
        if (data.isFirstTime && !sessionStorage.getItem("firstTimeModalShown")) {
          setShowFirstTimeModal(true);
        }
      } catch (err) {
        console.error("Error checking first time:", err);
      } finally {
        setCheckedFirstTime(true);
      }
    };

    checkIfFirstTime();
  }, []);

  const handleCloseFirstTimeModal = () => {
    setShowFirstTimeModal(false);
    sessionStorage.setItem("firstTimeModalShown", "true");
  };

  return (
    <div className="org-dashboard-layout">
      <FirstTimeJobModal 
        isOpen={showFirstTimeModal} 
        onClose={handleCloseFirstTimeModal} 
      />
      <OrgSidebar />
      <div className="org-dashboard-main">
        <OrgTopbar />
        <div className="org-dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}
