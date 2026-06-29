import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import "../components/organization-dashboard/OrgDashboardLayout.css";

export default function AdminDashboardLayout({ children }) {
  return (
    <div className="org-dashboard-layout">
      <AdminSidebar />
      <div className="org-dashboard-main">
        <AdminTopbar />
        <div className="org-dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}
