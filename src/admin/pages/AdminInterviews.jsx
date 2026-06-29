import { useState, useEffect } from "react";
import { getToken } from "../../services/token";
import Card from "../../ui/Card";
import { HiOutlineClipboardDocumentList, HiOutlineXMark } from "react-icons/hi2";
import { FaDesktop, FaVideo, FaUser, FaEnvelope, FaBriefcase, FaClock, FaCalendarAlt, FaBuilding } from "react-icons/fa";
import "../../components/organization-dashboard/pages/OrgInterviews.css";
import { backendURL } from "../../pages/Home";

export default function AdminInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/admin/interviews`, {
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
    const statusMap = {
      true: "badge-ui-success",
      false: "badge-ui-warning",
      cancelled: "badge-ui-error",
      in_progress: "badge-ui-info"
    };
    return statusMap[status] || "badge-ui-secondary";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="org-interviews-container">
        <h2>Interviews</h2>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="org-interviews-container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title mb-1">All Interviews</h2>
          <p className="text-muted small">View all scheduled interviews across all organizations</p>
        </div>
      </div>

      {interviews.length === 0 ? (
        <Card className="text-center py-5">
          <div className="empty-state">
            <HiOutlineClipboardDocumentList className="display-1 text-muted opacity-25 mb-3" />
            <h4 className="text-muted">No interviews scheduled yet</h4>
            <p className="text-muted small">Interviews will appear here once organizations schedule them.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden border-light shadow-sm">
          <div className="table-responsive">
            <table className="table custom-dashboard-table mb-0">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Organization</th>
                  <th>Position</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Tokens</th>
                  <th>Scheduled</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((interview, index) => (
                  <tr key={index}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar-placeholder">
                          {interview.candidateName?.charAt(0) || "C"}
                        </div>
                        <div>
                          <div className="fw-bold text-primary-dark">{interview.candidateName}</div>
                          <div className="text-muted small">{interview.candidateEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-ui badge-ui-info">{interview.organizationName}</span>
                    </td>
                    <td className="text-secondary-dark">{interview.position}</td>
                    <td>
                      <span className="badge-ui badge-ui-secondary">
                        {interview.interviewType || "—"}
                      </span>
                    </td>
                    <td>
                      
                      <span className={`badge-ui ${getStatusBadge(interview.completed)}`}>
                        {interview.completed === true ? "Completed" : "Scheduled"}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {interview.tokens || "—"}
                    </td>
                    <td className="text-muted small">
                      {interview.createdAt ? new Date(interview.createdAt).toLocaleDateString() : "—"}
                    </td>
                      <td className="text-end">
                      <button
                        className="btn-table-action"
                        onClick={() => setSelectedInterview(interview)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Interview Detail Modal ── */}
      {selectedInterview && (
        <div
          className="admin-cv-modal-overlay"
          onClick={() => setSelectedInterview(null)}
        >
          <div
            className="admin-cv-modal"
            style={{ maxWidth: 700 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-cv-modal-header">
              <div>
                <h2 style={{ margin: 0 }}>Interview Details</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                  {selectedInterview.candidateName} — {selectedInterview.position}
                </p>
              </div>
              <button
                className="admin-cv-modal-close"
                onClick={() => setSelectedInterview(null)}
              >
                <HiOutlineXMark />
              </button>
            </div>

            <div style={{ padding: "24px 28px" }}>
              {/* Info Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 24
              }}>
                <div className="d-flex align-items-center gap-2">
                  <FaUser style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>Candidate</div>
                    <div style={{ fontWeight: 600 }}>{selectedInterview.candidateName}</div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <FaEnvelope style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>Email</div>
                    <div style={{ fontWeight: 500 }}>{selectedInterview.candidateEmail}</div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <FaBuilding style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>Organization</div>
                    <div style={{ fontWeight: 600 }}>{selectedInterview.organizationName}</div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <FaBriefcase style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>Position</div>
                    <div style={{ fontWeight: 500 }}>{selectedInterview.position}</div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <FaClock style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>Duration</div>
                    <div style={{ fontWeight: 500 }}>{selectedInterview.duration || "—"} mins</div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <FaCalendarAlt style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>Created</div>
                    <div style={{ fontWeight: 500 }}>{formatDate(selectedInterview.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* Status Row */}
              <div style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                padding: "14px 18px",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-md)",
                marginBottom: 24,
                fontSize: 13
              }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Type: </span>
                  <strong>{selectedInterview.interviewType || "—"}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Scheduling: </span>
                  <strong>{selectedInterview.schedulingType || "—"}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Status: </span>
                  <span className={`badge-ui ${getStatusBadge(selectedInterview.completed)}`}>
                    {selectedInterview.completed ? "Completed" : "Scheduled"}
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Tokens: </span>
                  <strong>{selectedInterview.tokens || "—"}</strong>
                </div>
                {selectedInterview.deadline && (
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Deadline: </span>
                    <strong>{formatDate(selectedInterview.deadline)}</strong>
                  </div>
                )}
              </div>

              {/* Recordings Section */}
              {(selectedInterview.screenRecordingUrl || selectedInterview.cameraRecordingUrl) ? (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
                    Interview Recordings
                  </h4>
                  <div className="d-flex gap-3 flex-wrap">
                    {selectedInterview.screenRecordingUrl && (
                      <a
                        href={selectedInterview.screenRecordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 20px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-light)",
                          background: "var(--bg-card)",
                          color: "var(--accent-primary)",
                          fontWeight: 600,
                          fontSize: 13,
                          textDecoration: "none",
                          transition: "var(--transition-fast)"
                        }}
                      >
                        <FaDesktop /> Screen Recording
                      </a>
                    )}
                    {selectedInterview.cameraRecordingUrl && (
                      <a
                        href={selectedInterview.cameraRecordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 20px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-light)",
                          background: "var(--bg-card)",
                          color: "var(--accent-primary)",
                          fontWeight: 600,
                          fontSize: 13,
                          textDecoration: "none",
                          transition: "var(--transition-fast)"
                        }}
                      >
                        <FaVideo /> Camera Recording
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: "16px",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 13
                }}>
                  No recordings available for this interview.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
