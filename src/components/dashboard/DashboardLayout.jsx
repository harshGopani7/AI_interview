import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./DashboardLayout.css";

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-container">
      {/* Sidebar - Fixed width on desktop */}
      <Sidebar />
      
      <div className="dashboard-viewport">
        {/* Topbar - Sticky at the top */}
        <Topbar />
        
        {/* Scrollable Content Area */}
        <main className="dashboard-content-area">
          <div className="content-inner fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}