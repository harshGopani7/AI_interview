import { useState, useEffect } from "react";
import "./OrgOverview.css";
import Card from "../../../ui/Card";
import {
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineUsers,
  HiOutlineCalendarDays,
  HiOutlineUserPlus,
  HiOutlineClipboardDocumentList,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass
} from "react-icons/hi2";
import { getToken } from "../../../services/token";
import { backendURL } from "../../../pages/Home";

export default function OrgOverview() {
  const [loading, setLoading] = useState(true);

  const [totalInterviews, setTotalInterviews] = useState(0);
  const [scheduledInterviews, setScheduledInterviews] = useState(0);
  const [completedInterviews, setCompletedInterviews] = useState(0);
  // const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [stats] = useState({
    totalCandidates: 24
  });

  useEffect(() => {
    fetchInterviews();
    fetchCandidates();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/interviews`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();

        // For each Interview, find Total Inteviews, secheduled and completed interviews
        const totalInterviews = data.interviews.length;
        const completedInterviews = data.interviews.filter(interview => interview.completed === true).length;
        const scheduledInterviews = totalInterviews - completedInterviews;

        setTotalInterviews(totalInterviews);
        setCompletedInterviews(completedInterviews);
        setScheduledInterviews(scheduledInterviews);

        // setInterviews(data.interviews || []);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/candidates-list`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates.length);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="reports">
        <h2>Dashboard Overview</h2>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="org-overview-container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="dashboard-title">Dashboard Overview</h2>
        <span className="badge badge-info">Real-time Data</span>
      </div>

      {/* Stats Grid */}
      <div className="row g-4 mb-5">
        {[
          { label: "Total Interviews", val: totalInterviews, icon: <HiOutlineChartBar />, color: "var(--info)" },
          { label: "Scheduled", val: scheduledInterviews, icon: <HiOutlineCalendar />, color: "var(--warning)" },
          { label: "Completed", val: completedInterviews, icon: <HiOutlineCheckCircle />, color: "var(--success)" },
          { label: "Total Candidates", val: candidates, icon: <HiOutlineUsers />, color: "var(--accent-primary)" },
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

      {/* Quick Actions & Recent Activity */}
      <div className="row">
        <div className="col-lg-12">
          <h3 className="section-heading mb-3">Quick Actions</h3>
          <div className="row justify-content-center g-4">
            <div className="col-lg-4 col-md-5">
              <a href="/organization/dashboard/cv-analyser" className="action-link">
                <Card hover className="action-card text-center">
                  <HiOutlineDocumentText className="action-icon" />
                  <h4>Analyze CV</h4>
                  <p className="action-description">Screen resumes with AI-powered matching</p>
                </Card>
              </a>
            </div>
            <div className="col-lg-4 col-md-5">
              <a href="/organization/dashboard/smart-scheduler" className="action-link">
                <Card hover className="action-card text-center">
                  <HiOutlineCalendarDays className="action-icon" />
                  <h4>Schedule Interview</h4>
                  <p className="action-description">Book interviews with candidates</p>
                </Card>
              </a>
            </div>
            
            {/* <div className="col-lg-3 col-md-6">
              <a href="/organization/dashboard/interviews" className="action-link">
                <Card hover className="action-card text-center">
                  <HiOutlineClipboardDocumentList className="action-icon" />
                  <h4>View All Interviews</h4>
                  <p className="action-description">Browse interview history</p>
                </Card>
              </a>
            </div> */}
          </div>
        </div>

        {/* <div className="col-lg-4">
          <h3 className="section-heading mb-3">Recent Activity</h3>
          <Card className="activity-card h-100">
            <div className="empty-state">
              <img src="/api/placeholder/80/80" alt="No data" className="mb-2 opacity-50" />
              <p>No recent activity to display</p>
            </div>
          </Card>
        </div> */}
      </div>
    </div>
  );
}