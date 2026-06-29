import { useState, useEffect } from "react";
import { getToken } from "../../../services/token";
import { HiOutlineClipboardDocumentList, HiOutlineBriefcase, HiOutlineCalendar, HiOutlineStar } from "react-icons/hi2";
import Card from "../../../ui/Card";
import "./Interviews.css";
import { backendURL } from "../../../pages/Home";

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/interview/my-interviews`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setInterviews(data.interviews || []);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: "badge badge-success",
      in_progress: "badge badge-info",
      scheduled: "badge badge-warning"
    };
    return badges[status] || "badge";
  };

  const filteredInterviews = interviews.filter(interview => {
    if (filter === "all") return true;
    return interview.status === filter;
  });

  if (loading) {
    return (
      <div className="interviews">
        <h2>My Interviews</h2>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-history-container fade-in">
      {/* Header & Filters */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
        <div>
          <h2 className="dashboard-title mb-1">My Interviews</h2>
          <p className="text-muted small mb-0">Review your past performance and upcoming sessions</p>
        </div>

        <div className="filter-tab-group">
          {["all", "completed", "scheduled"].map((t) => (
            <button
              key={t}
              className={`filter-tab-item ${filter === t ? "active" : ""}`}
              onClick={() => setFilter(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Interviews Grid */}
      {filteredInterviews.length === 0 ? (
        <Card className="text-center py-5">
          <div className="empty-state-illustration mb-3">
            <HiOutlineClipboardDocumentList className="display-1 opacity-25" />
          </div>
          <h4 className="text-muted">No sessions found</h4>
          <p className="text-muted small">Try changing your filters or start a practice session.</p>
        </Card>
      ) : (
        <div className="history-grid">
          {filteredInterviews.map((interview, index) => (
            <Card key={index} className="history-item-card" hover>
              <div className="card-accent-bar"></div>
              
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div className="role-badge-group">
                  <div className="role-icon-circle">
                    <HiOutlineBriefcase />
                  </div>
                  <div>
                    <h3 className="history-role-title">{interview.role || "Interview Session"}</h3>
                    <span className="history-category-text">{interview.type || "General Assessment"}</span>
                  </div>
                </div>
                <span className={getStatusBadge(interview.status)}>
                  {interview.status?.replace('_', ' ') || "completed"}
                </span>
              </div>

              <div className="history-meta-row">
                <div className="meta-block">
                  <HiOutlineCalendar className="meta-icon" />
                  <div className="meta-content">
                    <label>Scheduled On</label>
                    <span>{interview.date || "Jan 02, 2026"}</span>
                  </div>
                </div>
                
                {interview.status === 'completed' && (
                  <div className="meta-block">
                    <HiOutlineStar className="meta-icon icon-gold" />
                    <div className="meta-content">
                      <label>AI Score</label>
                      <span className="score-text">{interview.score || "0"}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-footer-action mt-4 pt-3 border-top">
                <button className="btn-details-link">
                  {interview.status === 'completed' ? "View Feedback Report" : "Prepare Now"}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
