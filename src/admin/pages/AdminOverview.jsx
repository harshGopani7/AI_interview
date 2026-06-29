import { useState, useEffect } from "react";
import "../../components/organization-dashboard/pages/OrgOverview.css";
import Card from "../../ui/Card";
import { getToken } from "../../services/token";
import { 
  HiOutlineChartBar, 
  HiOutlineCalendar, 
  HiOutlineCheckCircle, 
  HiOutlineUsers, 
  HiOutlineBuildingOffice,
  HiOutlineClipboardDocumentList 
} from "react-icons/hi2";
import { backendURL } from "../../pages/Home";

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalCandidates: 0,
    totalInterviews: 0,
    completedInterviews: 0,
    scheduledInterviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/admin/stats`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="org-overview-container">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="org-overview-container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="dashboard-title">Admin Dashboard Overview</h2>
        <span className="badge badge-info">Real-time Data</span>
      </div>
      
      <div className="row g-4 mb-5">
        {[
          { label: "Total Organizations", val: stats.totalOrganizations, icon: <HiOutlineBuildingOffice />, color: "var(--accent-primary)" },
          { label: "Total Candidates", val: stats.totalCandidates, icon: <HiOutlineUsers />, color: "var(--info)" },
          { label: "Total Interviews", val: stats.totalInterviews, icon: <HiOutlineChartBar />, color: "var(--warning)" },
          { label: "Completed", val: stats.completedInterviews, icon: <HiOutlineCheckCircle />, color: "var(--success)" },
          { label: "Scheduled", val: stats.scheduledInterviews, icon: <HiOutlineCalendar />, color: "var(--error)" },
        ].map((item, i) => (
          <div className="col-xl-3 col-md-6" key={i}>
            <Card className="stat-card">
              <div className="stat-icon-wrapper" style={{ color: item.color, backgroundColor: `${item.color}15` }}>
                {item.icon}
              </div>
              <div className="stat-data">
                <h3>{item.val}</h3>
                <p>{item.label}</p>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <h3 className="section-heading mb-3">Quick Actions</h3>
          <div className="row g-3">
            <div className="col-md-4">
              <a href="/admin/dashboard/organizations" className="action-link">
                <Card hover className="action-card text-center">
                  <HiOutlineBuildingOffice className="action-icon" />
                  <h4>View Organizations</h4>
                </Card>
              </a>
            </div>
            <div className="col-md-4">
              <a href="/admin/dashboard/candidates" className="action-link">
                <Card hover className="action-card text-center">
                  <HiOutlineUsers className="action-icon" />
                  <h4>View Candidates</h4>
                </Card>
              </a>
            </div>
            <div className="col-md-4">
              <a href="/admin/dashboard/interviews" className="action-link">
                <Card hover className="action-card text-center">
                  <HiOutlineClipboardDocumentList className="action-icon" />
                  <h4>All Interviews</h4>
                </Card>
              </a>
            </div>
          </div>
        </div>

        {/* <div className="col-lg-4">
          <h3 className="section-heading mb-3">System Status</h3>
          <Card className="activity-card h-100">
            <div className="empty-state">
              <p className="text-success fw-bold">System Running</p>
              <p className="text-muted small">All services operational</p>
            </div>
          </Card>
        </div> */}
      </div>
    </div>
  );
}
