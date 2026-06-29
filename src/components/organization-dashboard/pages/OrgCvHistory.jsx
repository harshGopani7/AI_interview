import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./OrgCvHistory.css";
import "./OrgCvAnalyzer.css";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import {
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineChevronDown,
  HiOutlineArrowLeft,
  HiOutlineExclamationTriangle,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineCalendar,
} from "react-icons/hi2";
import {
  getHistoryJobs,
  getReport,
} from "../../../services/resumeScreeningApi";
import { getSubscriptionStatus } from "../../../services/subscriptionApi";
import CvUpgradeGate from "./CvUpgradeGate";

// ───────────────────────────────────────────
// Helpers (pure – no AI)
// ───────────────────────────────────────────
function groupJobsByDate(jobs) {
  const groups = {};
  for (const job of jobs) {
    const dateStr = job.completedAt || job.createdAt;
    let dateKey = "Unknown Date";
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        dateKey = d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    }
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(job);
  }
  return groups;
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getStatusLabel(status) {
  if (status === "completed") return "Completed";
  if (status === "partial") return "Partial";
  if (status === "failed") return "Failed";
  return status;
}

function getScoreClass(score, scale) {
  const pct = scale === "100" ? score : (score / 10) * 100;
  if (pct >= 70) return "cv-score-high";
  if (pct >= 40) return "cv-score-mid";
  return "cv-score-low";
}

// ───────────────────────────────────────────
// Component
// ───────────────────────────────────────────
export default function OrgCvHistory() {
  const navigate = useNavigate();

  // Subscription gate
  const [subLoading, setSubLoading] = useState(true);
  const [isBasicPlan, setIsBasicPlan] = useState(false);
  const [planName, setPlanName] = useState("");

  // View: "list" or "report"
  const [view, setView] = useState("list");

  // History list state
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Report view state
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [sortField, setSortField] = useState("rank");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});

  // ─── Check subscription on mount ────────
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const data = await getSubscriptionStatus();
        const tier = (data?.subscriptionTier || data?.subscription?.tier || "basic").toLowerCase();
        setPlanName(data?.planName || tier.charAt(0).toUpperCase() + tier.slice(1));
        setIsBasicPlan(tier === "basic");
      } catch (err) {
        console.error("Error checking subscription:", err);
        setIsBasicPlan(true);
      } finally {
        setSubLoading(false);
      }
    };
    checkSubscription();
  }, []);

  // ─── Fetch history on mount ─────────────
  useEffect(() => {
    if (!isBasicPlan && !subLoading) {
      fetchHistory();
    }
  }, [isBasicPlan, subLoading]);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getHistoryJobs();
      setJobs(res.jobs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Report handlers ────────────────────
  const openReport = async (jobId) => {
    setView("report");
    setReportLoading(true);
    setReportError("");
    setReport(null);
    setSortField("rank");
    setSortAsc(true);
    setExpandedCards({});
    try {
      const data = await getReport(jobId);
      setReport(data);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  const backToList = () => {
    setView("list");
    setReport(null);
    setReportError("");
    setExpandedCards({});
  };

  const getSortedCandidates = () => {
    if (!report?.candidates) return [];
    return [...report.candidates].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const toggleCard = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ─── Subscription gate ──────────────────
  if (subLoading) {
    return (
      <div className="cv-history-container fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="cv-spinner-inline" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (isBasicPlan) {
    return <CvUpgradeGate planName={planName} />;
  }

  // ─── Render: History List ───────────────
  if (view === "list") {
    const grouped = groupJobsByDate(jobs);
    const dateKeys = Object.keys(grouped);

    return (
      <div className="cv-history-container fade-in">
        <div className="cv-history-top-bar">
          <Button
            variant="secondary"
            onClick={() => navigate("/organization/dashboard/cv-analyser")}
          >
            <HiOutlineArrowLeft style={{ marginRight: 6 }} />
            Back to Job Setup
          </Button>
          <h2 className="cv-history-title">Screening History</h2>
        </div>

        {/* Loading */}
        {loading && (
          <Card>
            <div className="cv-history-center">
              <span className="cv-spinner-inline" />
              <span style={{ marginLeft: 12 }}>Loading history...</span>
            </div>
          </Card>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="cv-error-banner">
            <HiOutlineExclamationTriangle style={{ fontSize: "1.3rem" }} />
            <span>{error}</span>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && jobs.length === 0 && (
          <Card>
            <div className="cv-history-center cv-history-empty">
              <HiOutlineDocumentText style={{ fontSize: "2.5rem", color: "var(--text-muted)" }} />
              <p>No screening history yet.</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Results will appear here after you analyze resumes.
              </p>
            </div>
          </Card>
        )}

        {/* Date-grouped list */}
        {!loading && !error && dateKeys.length > 0 && (
          <div className="cv-history-groups">
            {dateKeys.map((dateKey) => (
              <div key={dateKey} className="cv-history-date-group">
                <div className="cv-history-date-header">
                  <HiOutlineCalendarDays style={{ fontSize: "1.1rem" }} />
                  <span>{dateKey}</span>
                </div>

                <div className="cv-history-items">
                  {grouped[dateKey].map((job) => (
                    <Card key={job.jobId} hover>
                      <div className="cv-history-item">
                        <div className="cv-history-item-main">
                          <div className="cv-history-item-title">{job.jobTitle}</div>
                          <div className="cv-history-item-meta">
                            <span>{job.analyzedResumes} resume{job.analyzedResumes !== 1 ? "s" : ""} analyzed</span>
                            <span className="cv-history-meta-sep" />
                            <span>{job.reportType === "DETAILED" ? "Detailed Report" : "Summary Report"}</span>
                            <span className="cv-history-meta-sep" />
                            <span
                              className={`cv-status-badge cv-status-${job.status}`}
                            >
                              {getStatusLabel(job.status)}
                            </span>
                            {(job.completedAt || job.createdAt) && (
                              <>
                                <span className="cv-history-meta-sep" />
                                <HiOutlineClock style={{ fontSize: "0.85rem" }} />
                                <span>{formatTime(job.completedAt || job.createdAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="cv-history-item-actions">
                          <Button
                            variant="secondary"
                            onClick={() => openReport(job.jobId)}
                          >
                            <HiOutlineEye style={{ marginRight: 4 }} />
                            View Report
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => navigate("/organization/dashboard/smart-scheduler", { 
                              state: { 
                                position: job.jobTitle,
                                fromHistory: true 
                              } 
                            })}
                          >
                            <HiOutlineCalendar style={{ marginRight: 4 }} />
                            Schedule Interview
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Render: Read-Only Report ───────────
  return (
    <div className="cv-history-container fade-in">
      <div className="cv-history-top-bar">
        <Button variant="secondary" onClick={backToList}>
          <HiOutlineArrowLeft style={{ marginRight: 6 }} />
          Back to History
        </Button>
        <h2 className="cv-history-title">
          {report?.job?.jobTitle || "Report"}
        </h2>
      </div>

      {/* Read-only banner */}
      <div className="cv-history-readonly-banner">
        <HiOutlineChartBar style={{ fontSize: "1.2rem", flexShrink: 0 }} />
        Previously Generated Report (Read-Only)
      </div>

      {/* Loading */}
      {reportLoading && (
        <Card>
          <div className="cv-history-center">
            <span className="cv-spinner-inline" />
            <span style={{ marginLeft: 12 }}>Loading report...</span>
          </div>
        </Card>
      )}

      {/* Error */}
      {!reportLoading && reportError && (
        <div className="cv-error-banner">
          <HiOutlineExclamationTriangle style={{ fontSize: "1.3rem" }} />
          <span>{reportError}</span>
        </div>
      )}

      {/* Report content */}
      {!reportLoading && !reportError && report && (
        <Card>
          <div className="cv-section-header">
            <h2>Screening Results</h2>
            <p>
              {report.job?.jobTitle} — {report.candidates?.length} candidate
              {report.candidates?.length !== 1 ? "s" : ""} screened
              {report.job?.scoringScale &&
                ` (scored out of ${report.job.scoringScale})`}
            </p>
            {report.buckets && (
              <div className="cv-history-buckets">
                <span className="cv-history-bucket cv-history-bucket-shortlist">
                  Shortlisted: {report.buckets.shortlist ?? 0}
                </span>
                <span className="cv-history-bucket cv-history-bucket-borderline">
                  Borderline: {report.buckets.borderline ?? 0}
                </span>
                <span className="cv-history-bucket cv-history-bucket-reject">
                  Rejected: {report.buckets.reject ?? 0}
                </span>
              </div>
            )}
          </div>

          {/* ── SUMMARY REPORT ── */}
          {report.job?.reportType === "SUMMARY" && (
            <div className="cv-results-table-wrapper">
              <table className="cv-results-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("rank")}>
                      Rank{" "}
                      {sortField === "rank" && (
                        <span className="cv-sort-indicator">
                          {sortAsc ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                    <th onClick={() => handleSort("candidateName")}>
                      Name{" "}
                      {sortField === "candidateName" && (
                        <span className="cv-sort-indicator">
                          {sortAsc ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                    <th onClick={() => handleSort("score")}>
                      Score{" "}
                      {sortField === "score" && (
                        <span className="cv-sort-indicator">
                          {sortAsc ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                    <th onClick={() => handleSort("verdict")}>
                      Verdict{" "}
                      {sortField === "verdict" && (
                        <span className="cv-sort-indicator">
                          {sortAsc ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedCandidates().map((c) => (
                    <tr key={c.resumeId}>
                      <td>
                        <span
                          className={`cv-rank-badge ${
                            c.rank === 1
                              ? "cv-rank-1"
                              : c.rank === 2
                              ? "cv-rank-2"
                              : c.rank === 3
                              ? "cv-rank-3"
                              : ""
                          }`}
                        >
                          {c.rank}
                        </span>
                      </td>
                      <td>{c.candidateName}</td>
                      <td>
                        <div className="cv-score-bar">
                          <span style={{ fontWeight: 600, minWidth: 36 }}>
                            {c.score}/{report.job.scoringScale}
                          </span>
                          <div className="cv-score-bar-track">
                            <div
                              className={`cv-score-bar-fill ${getScoreClass(
                                c.score,
                                report.job.scoringScale
                              )}`}
                              style={{
                                width: `${
                                  (c.score / Number(report.job.scoringScale)) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`cv-verdict-badge cv-verdict-${(
                            c.verdict || ""
                          ).toLowerCase()}`}
                        >
                          {c.verdict || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`cv-status-badge cv-status-${c.status}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate("/organization/dashboard/smart-scheduler", { 
                            state: { 
                              resumeId: c.resumeId,
                              position: report?.job?.jobTitle,
                              fromCvHistory: true 
                            } 
                          })}
                        >
                          <HiOutlineCalendar style={{ marginRight: 4 }} />
                          Schedule
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── DETAILED REPORT ── */}
          {report.job?.reportType === "DETAILED" && (
            <div className="cv-detail-cards">
              {getSortedCandidates().map((c) => (
                <div key={c.resumeId} className="cv-detail-card">
                  <div
                    className="cv-detail-card-header"
                    onClick={() => toggleCard(c.resumeId)}
                  >
                    <div className="cv-detail-card-left">
                      <span
                        className={`cv-rank-badge ${
                          c.rank === 1
                            ? "cv-rank-1"
                            : c.rank === 2
                            ? "cv-rank-2"
                            : c.rank === 3
                            ? "cv-rank-3"
                            : ""
                        }`}
                      >
                        #{c.rank}
                      </span>
                      <div>
                        <strong>{c.candidateName}</strong>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Score: {c.score}/{report.job.scoringScale}
                          {c.verdict && (
                            <span
                              className={`cv-verdict-badge cv-verdict-${(
                                c.verdict || ""
                              ).toLowerCase()}`}
                              style={{ marginLeft: 8 }}
                            >
                              {c.verdict}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-sm)",
                      }}
                    >
                      <span
                        className={`cv-status-badge cv-status-${c.status}`}
                      >
                        {c.status}
                      </span>
                      <HiOutlineChevronDown
                        className={`cv-chevron ${
                          expandedCards[c.resumeId] ? "open" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {expandedCards[c.resumeId] && (
                    <div className="cv-detail-card-body">
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">File</span>
                        <span className="cv-detail-value">{c.filename}</span>
                      </div>
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">Experience Match</span>
                        <span className="cv-detail-value">
                          {c.experienceMatch || "—"}
                        </span>
                      </div>
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">Skills Match</span>
                        <span className="cv-detail-value">
                          {c.skillsMatchPercent != null
                            ? `${c.skillsMatchPercent}%`
                            : "—"}
                        </span>
                      </div>
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">Role Fit</span>
                        <span className="cv-detail-value">
                          {c.roleFit || "—"}
                        </span>
                      </div>
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">Matched Skills</span>
                        <div className="cv-detail-skills">
                          {c.matchedSkills?.length > 0 ? (
                            c.matchedSkills.map((s) => (
                              <span key={s} className="cv-detail-skill-matched">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="cv-detail-value">—</span>
                          )}
                        </div>
                      </div>
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">Missing Skills</span>
                        <div className="cv-detail-skills">
                          {c.missingSkills?.length > 0 ? (
                            c.missingSkills.map((s) => (
                              <span key={s} className="cv-detail-skill-missing">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="cv-detail-value">—</span>
                          )}
                        </div>
                      </div>
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">Summary</span>
                        <span className="cv-detail-value">
                          {c.summary || "—"}
                        </span>
                      </div>
                      <div className="cv-detail-actions">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate("/organization/dashboard/smart-scheduler", { 
                            state: { 
                              resumeId: c.resumeId,
                              position: report?.job?.jobTitle,
                              fromCvHistory: true 
                            } 
                          })}
                        >
                          <HiOutlineCalendar style={{ marginRight: 4 }} />
                          Schedule Interview
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
