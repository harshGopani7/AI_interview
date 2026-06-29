import { useState, useEffect } from "react";
import { FaTimes, FaClock, FaCheckCircle, FaHourglassHalf, FaCalendarAlt, FaBriefcase, FaUser, FaEnvelope, FaKey, FaClipboardList, FaCopy, FaChartLine, FaPhone, FaDesktop, FaVideo } from "react-icons/fa";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import { getToken } from "../../../services/token";
import { backendURL } from "../../../pages/Home";
import "./CandidateDetailsModal.css";

export default function CandidateDetailsModal({ candidateId, onClose }) {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedField, setCopiedField] = useState("");

  useEffect(() => {
    fetchCandidateDetails();
  }, [candidateId]);

  const fetchCandidateDetails = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/candidate-details/${candidateId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data);
        setCandidate(data);
      }
    } catch (error) {
      console.error("Error fetching candidate details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, completed) => {
    if (completed) {
      return <span className="status-badge status-completed"><FaCheckCircle /> Completed</span>;
    }
    if (status === "scheduled") {
      return <span className="status-badge status-scheduled"><FaClock /> Scheduled</span>;
    }
    return <span className="status-badge status-pending"><FaHourglassHalf /> Pending</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const calculateAverageScore = (scoreObj) => {
    if (typeof scoreObj === 'number') return scoreObj;
    if (typeof scoreObj === 'object' && scoreObj !== null) {
      const scores = Object.values(scoreObj);
      const average = scores.reduce((sum, val) => sum + val, 0) / scores.length;
      return average.toFixed(1);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <Card className="candidate-details-modal">
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <Card className="candidate-details-modal">
        <div className="modal-header-light">
          <div className="header-content">
            <div className="candidate-avatar-large">
              {candidate.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="candidate-name-title">{candidate.name}</h2>
              <p className="candidate-email-subtitle">{candidate.email}</p>
            </div>
          </div>
          <button className="btn-close-light" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="tabs-container-light">
          <button
            className={`tab-light ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FaUser /> Overview
          </button>
          <button
            className={`tab-light ${activeTab === "interviews" ? "active" : ""}`}
            onClick={() => setActiveTab("interviews")}
          >
            <FaClipboardList /> Interviews ({candidate.totalInterviews})
          </button>
          <button
            className={`tab-light ${activeTab === "credentials" ? "active" : ""}`}
            onClick={() => setActiveTab("credentials")}
          >
            <FaKey /> Credentials
          </button>
        </div>

        <div className="modal-body-light">
          {activeTab === "overview" && (
            <div className="overview-section">
              <div className="info-grid">
                <div className="info-card-light">
                  <div className="info-icon">
                    <FaUser />
                  </div>
                  <div>
                    <p className="info-label">Full Name</p>
                    <p className="info-value">{candidate.name}</p>
                  </div>
                </div>

                <div className="info-card-light">
                  <div className="info-icon">
                    <FaEnvelope />
                  </div>
                  <div>
                    <p className="info-label">Email Address</p>
                    <p className="info-value">{candidate.email}</p>
                  </div>
                </div>

                <div className="info-card-light">
                  <div className="info-icon">
                    <FaPhone />
                  </div>
                  <div>
                    <p className="info-label">Phone Number</p>
                    <p className="info-value">{candidate.phone || "—"}</p>
                  </div>
                </div>

                <div className="info-card-light">
                  <div className="info-icon">
                    <FaClipboardList />
                  </div>
                  <div>
                    <p className="info-label">Total Interviews</p>
                    <p className="info-value">{candidate.totalInterviews}</p>
                  </div>
                </div>

                <div className="info-card-light">
                  <div className="info-icon">
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <p className="info-label">Registered On</p>

                    <p className="info-value">
                      {new Date(candidate.createdAt).toLocaleString()}
                    </p>                  </div>
                </div>
              </div>

              {candidate.totalInterviews > 0 && (
                <div className="recent-interviews-section">
                  <h3 className="section-title">Recent Interview Activity</h3>
                  <div className="interview-summary-cards">
                    {candidate.interviews.slice(0, 3).map((interview) => (
                      <div key={interview._id} className="interview-summary-card">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h4 className="interview-position">{interview.position}</h4>
                            <p className="interview-type-text">
                              {interview.interviewType} • {interview.duration} mins
                            </p>
                          </div>
                          {getStatusBadge(interview.status, interview.completed)}
                        </div>
                        {interview.hasResults && (
                          <div className="score-display">
                            Score: <span className="score-value">{calculateAverageScore(interview.score)}/10</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "interviews" && (
            <div className="interviews-section">
              {candidate.interviews.length === 0 ? (
                <div className="empty-state-light">
                  <HiOutlineDocumentText className="empty-icon" />
                  <p>No interviews scheduled yet</p>
                </div>
              ) : (
                <div className="interviews-list">
                  {candidate.interviews.map((interview) => (
                    <div key={interview._id} className="interview-card-light">
                      <div className="interview-card-header">
                        <div>
                          <h4 className="interview-card-title">
                            <FaBriefcase className="me-2" />
                            {interview.position}
                          </h4>
                          <p className="interview-card-meta">
                            Type: <strong>{interview.interviewType}</strong> •
                            Duration: <strong>{interview.duration} minutes</strong>
                          </p>
                        </div>
                        {getStatusBadge(interview.status, interview.completed)}
                      </div>

                      <div className="interview-card-body">
                        <div className="interview-detail-row">
                          <span className="detail-label">Scheduling Type:</span>
                          <span className="detail-value">{interview.schedulingType}</span>
                        </div>
                        <div className="interview-detail-row">
                          <span className="detail-label">Created:</span>
                          <span className="detail-value">{formatDate(interview.createdAt)}</span>
                        </div>
                        {interview.deadline && (
                          <div className="interview-detail-row">
                            <span className="detail-label">Deadline:</span>
                            <span className="detail-value">{formatDate(interview.deadline)}</span>
                          </div>
                        )}
                        {interview.scheduledDate && (
                          <div className="interview-detail-row">
                            <span className="detail-label">Scheduled Date:</span>
                            <span className="detail-value">{formatDate(interview.scheduledDate)}</span>
                          </div>
                        )}
                        {/* {interview.notes && (
                          <div className="interview-notes">
                            <span className="detail-label">Notes:</span>
                            <p className="notes-text">{interview.notes}</p>
                          </div>
                        )} */}
                      </div>

                      {interview.hasResults && (
                        <div className="interview-results-preview">
                          <div className="results-header">
                            <span className="results-label">Interview Results</span>
                            {interview.published ? (
                              <span className="published-badge">Published</span>
                            ) : (
                              <span className="unpublished-badge">Unpublished</span>
                            )}
                          </div>
                          <div className="score-large">
                            Score: <span>{calculateAverageScore(interview.score)}/10</span>
                          </div>
                          <button
                            className="btn-view-results"
                            onClick={() => {
                              navigate(`/organization/dashboard/interview-results/${interview._id}`);
                              onClose();
                            }}
                          >
                            <FaChartLine /> View Full Results
                          </button>
                        </div>
                      )}

                      {(interview.screenRecordingUrl || interview.cameraRecordingUrl) && (
                        <div className="interview-recordings-section">
                          <span className="results-label" style={{ display: "block", marginBottom: 8 }}>Recordings</span>
                          <div className="d-flex gap-2 flex-wrap">
                            {interview.screenRecordingUrl && (
                              <a
                                href={interview.screenRecordingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-view-results"
                                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                              >
                                <FaDesktop /> Screen Recording
                              </a>
                            )}
                            {interview.cameraRecordingUrl && (
                              <a
                                href={interview.cameraRecordingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-view-results"
                                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                              >
                                <FaVideo /> Camera Recording
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "credentials" && (
            <div className="credentials-section">
              <div className="credentials-card-light">
                <h3 className="section-title mb-4">Login Credentials</h3>
                <div className="credential-item">
                  <label className="credential-label">Username</label>
                  <div className="credential-value-box-with-copy">
                    <div className="credential-value-content">
                      <FaUser className="credential-icon" />
                      <span>{candidate.username}</span>
                    </div>
                    <button
                      className="btn-copy-credential"
                      onClick={() => copyToClipboard(candidate.username, "username")}
                      title="Copy username"
                    >
                      {copiedField === "username" ? "✓" : <FaCopy />}
                    </button>
                  </div>
                </div>
                <div className="credential-item">
                  <label className="credential-label">Password</label>
                  <div className="credential-value-box-with-copy">
                    <div className="credential-value-content">
                      <FaKey className="credential-icon" />
                      <span>{candidate.plainPassword}</span>
                    </div>
                    <button
                      className="btn-copy-credential"
                      onClick={() => copyToClipboard(candidate.plainPassword, "password")}
                      title="Copy password"
                    >
                      {copiedField === "password" ? "✓" : <FaCopy />}
                    </button>
                  </div>
                </div>
                <div className="credential-item">
                  <label className="credential-label">Email</label>
                  <div className="credential-value-box-with-copy">
                    <div className="credential-value-content">
                      <FaEnvelope className="credential-icon" />
                      <span>{candidate.email}</span>
                    </div>
                    <button
                      className="btn-copy-credential"
                      onClick={() => copyToClipboard(candidate.email, "email")}
                      title="Copy email"
                    >
                      {copiedField === "email" ? "✓" : <FaCopy />}
                    </button>
                  </div>
                </div>
                <div className="credential-note">
                  <p>⚠️ Share these credentials securely with the candidate</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* <div className="modal-footer-light">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div> */}
      </Card>
    </div>
  );
}
