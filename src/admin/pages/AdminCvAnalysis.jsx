import { useState, useEffect } from "react";
import { getToken } from "../../services/token";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import {
  HiOutlineDocumentMagnifyingGlass,
  HiOutlineBuildingOffice2,
  HiOutlineDocumentText,
  HiOutlineChevronDown,
  HiOutlineXMark,
  HiOutlineArrowDownTray,
  HiOutlineEye,
  HiOutlineSparkles,
  HiOutlineChartBar,
} from "react-icons/hi2";
import { backendURL } from "../../pages/Home";
import "./AdminCvAnalysis.css";

export default function AdminCvAnalysis() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedResumes, setExpandedResumes] = useState({});

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/admin/cv-analysis`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Error fetching CV analysis jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (job) => {
    setSelectedJob(job);
    setDetailLoading(true);
    setExpandedResumes({});
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/admin/cv-analysis/${job.jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
      }
    } catch (err) {
      console.error("Error fetching detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedJob(null);
    setDetailData(null);
  };

  const toggleResume = (id) => {
    setExpandedResumes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownload = async (resumeId, filename) => {
    try {
      const token = getToken();
      const res = await fetch(
        `${backendURL}/admin/cv-analysis/resume/${resumeId}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "resume";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const handleDownloadAll = () => {
    if (!detailData?.resumes) return;
    detailData.resumes.forEach((r) => {
      handleDownload(r.resumeId, r.originalName);
    });
  };

  const getScoreClass = (score, scale) => {
    const pct = scale === "100" ? score : (score / 10) * 100;
    if (pct >= 70) return "high";
    if (pct >= 40) return "mid";
    return "low";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatNumber = (n) => {
    if (!n) return "0";
    return n.toLocaleString();
  };

  // Stats
  const totalJobs = jobs.length;
  const totalResumes = jobs.reduce((s, j) => s + (j.totalResumes || 0), 0);
  const totalTokensAll = jobs.reduce((s, j) => s + (j.totalTokens || 0), 0);
  const uniqueOrgs = new Set(jobs.map((j) => j.organizationId)).size;

  if (loading) {
    return (
      <div className="admin-cv-container">
        <h2 className="dashboard-title mb-1">CV Analysis</h2>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-cv-container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title mb-1">CV Analysis</h2>
          <p className="text-muted small">
            Monitor all resume screening jobs across organizations
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-cv-stats">
        <div className="admin-cv-stat-card">
          <div className="admin-cv-stat-icon primary">
            <HiOutlineDocumentMagnifyingGlass />
          </div>
          <div>
            <div className="admin-cv-stat-value">{totalJobs}</div>
            <div className="admin-cv-stat-label">Total Jobs</div>
          </div>
        </div>
        <div className="admin-cv-stat-card">
          <div className="admin-cv-stat-icon success">
            <HiOutlineDocumentText />
          </div>
          <div>
            <div className="admin-cv-stat-value">{totalResumes}</div>
            <div className="admin-cv-stat-label">Total Resumes</div>
          </div>
        </div>
        <div className="admin-cv-stat-card">
          <div className="admin-cv-stat-icon info">
            <HiOutlineBuildingOffice2 />
          </div>
          <div>
            <div className="admin-cv-stat-value">{uniqueOrgs}</div>
            <div className="admin-cv-stat-label">Organizations</div>
          </div>
        </div>
        <div className="admin-cv-stat-card">
          <div className="admin-cv-stat-icon warning">
            <HiOutlineSparkles />
          </div>
          <div>
            <div className="admin-cv-stat-value">
              {formatNumber(totalTokensAll)}
            </div>
            <div className="admin-cv-stat-label">Total Tokens Used</div>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      {jobs.length === 0 ? (
        <Card className="text-center py-5">
          <div className="empty-state">
            <HiOutlineDocumentMagnifyingGlass className="display-1 text-muted opacity-25 mb-3" />
            <h4 className="text-muted">No CV analysis jobs yet</h4>
            <p className="text-muted small">
              Jobs will appear here once organizations run CV screening.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden border-light shadow-sm">
          <div className="table-responsive">
            <table className="admin-cv-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Job Title</th>
                  <th>Resumes</th>
                  <th>Status</th>
                  <th>Total Tokens</th>
                  <th>Created</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.jobId} onClick={() => openDetail(job)}>
                    <td>
                      <div className="admin-cv-org-cell">
                        <div className="admin-cv-org-avatar">
                          {job.organizationName?.charAt(0) || "O"}
                        </div>
                        <span style={{ fontWeight: 600 }}>
                          {job.organizationName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{job.jobTitle}</div>
                      <div
                        className="text-muted"
                        style={{ fontSize: 12 }}
                      >
                        {job.industry} · {job.seniorityLevel}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {job.analyzedResumes}
                      </span>
                      <span className="text-muted">/{job.totalResumes}</span>
                    </td>
                    <td>
                      <span className={`admin-cv-status ${job.status}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="admin-cv-token-cell">
                      {formatNumber(job.totalTokens)}
                    </td>
                    <td className="text-muted" style={{ fontSize: 13 }}>
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn-table-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(job);
                        }}
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

      {/* Detail Modal */}
      {selectedJob && (
        <div className="admin-cv-modal-overlay" onClick={closeDetail}>
          <div
            className="admin-cv-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-cv-modal-header">
              <div>
                <h2>{selectedJob.jobTitle}</h2>
                <p>
                  {selectedJob.organizationName} · {selectedJob.industry} ·{" "}
                  {selectedJob.seniorityLevel}
                </p>
              </div>
              <button className="admin-cv-modal-close" onClick={closeDetail}>
                <HiOutlineXMark />
              </button>
            </div>

            <div className="admin-cv-modal-meta">
              <div className="admin-cv-modal-meta-item">
                <HiOutlineChartBar />
                Scale: <strong>{selectedJob.scoringScale}</strong>
              </div>
              <div className="admin-cv-modal-meta-item">
                Report: <strong>{selectedJob.reportType}</strong>
              </div>
              <div className="admin-cv-modal-meta-item">
                Resumes:{" "}
                <strong>
                  {selectedJob.analyzedResumes}/{selectedJob.totalResumes}
                </strong>
              </div>
              <div className="admin-cv-modal-meta-item">
                <HiOutlineSparkles />
                Total Tokens:{" "}
                <strong>{formatNumber(selectedJob.totalTokens)}</strong>
              </div>
              <div className="admin-cv-modal-meta-item">
                Status:{" "}
                <span className={`admin-cv-status ${selectedJob.status}`}>
                  {selectedJob.status}
                </span>
              </div>
            </div>

            <div className="admin-cv-modal-body">
              {detailLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: 40,
                  }}
                >
                  <div className="spinner"></div>
                </div>
              ) : detailData ? (
                <>
                  <div className="admin-cv-modal-actions">
                    <button
                      className="admin-cv-btn-sm"
                      onClick={handleDownloadAll}
                    >
                      <HiOutlineArrowDownTray /> Download All Resumes
                    </button>
                  </div>

                  {detailData.resumes
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((r, idx) => {
                      const isOpen = expandedResumes[r.resumeId];
                      const scale = detailData.job?.scoringScale || "10";
                      const scoreClass = getScoreClass(r.score, scale);
                      return (
                        <div key={r.resumeId} className="admin-cv-resume-card">
                          <div
                            className="admin-cv-resume-header"
                            onClick={() => toggleResume(r.resumeId)}
                          >
                            <div className="admin-cv-resume-left">
                              <div
                                className={`admin-cv-resume-rank ${idx < 3 ? "top" : ""}`}
                              >
                                {idx + 1}
                              </div>
                              <div>
                                <div className="admin-cv-resume-name">
                                  {r.candidateName}
                                </div>
                                <div className="admin-cv-resume-file">
                                  {r.originalName}
                                </div>
                              </div>
                            </div>
                            <div className="admin-cv-resume-right">
                              <div
                                className={`admin-cv-resume-score ${scoreClass}`}
                              >
                                {r.score}/{scale}
                              </div>
                              {r.verdict && (
                                <span
                                  className={`admin-cv-resume-verdict ${r.verdict}`}
                                >
                                  {r.verdict}
                                </span>
                              )}
                              <HiOutlineChevronDown
                                className={`admin-cv-resume-chevron ${isOpen ? "open" : ""}`}
                              />
                            </div>
                          </div>

                          {isOpen && (
                            <div className="admin-cv-resume-detail">
                              <div className="admin-cv-detail-grid">
                                <div className="admin-cv-detail-item">
                                  <label>Experience Match</label>
                                  <span>{r.experienceMatch || "—"}</span>
                                </div>
                                <div className="admin-cv-detail-item">
                                  <label>Skills Match</label>
                                  <span>{r.skillsMatchPercent}%</span>
                                </div>
                                <div className="admin-cv-detail-item">
                                  <label>Role Fit</label>
                                  <span>{r.roleFit || "—"}</span>
                                </div>
                                <div className="admin-cv-detail-item">
                                  <label>AI Content</label>
                                  <span>
                                    {r.aiContentProbability || "—"}
                                  </span>
                                </div>
                                <div className="admin-cv-detail-item">
                                  <label>Status</label>
                                  <span
                                    className={`admin-cv-status ${r.status}`}
                                  >
                                    {r.status}
                                  </span>
                                </div>
                                <div className="admin-cv-detail-item">
                                  <label>Analyzed At</label>
                                  <span>{formatDate(r.analyzedAt)}</span>
                                </div>
                              </div>

                              {(r.matchedSkills?.length > 0 ||
                                r.missingSkills?.length > 0) && (
                                <div style={{ marginBottom: 10 }}>
                                  <div
                                    className="admin-cv-detail-item"
                                    style={{ marginBottom: 6 }}
                                  >
                                    <label>Skills</label>
                                  </div>
                                  <div className="admin-cv-skills-row">
                                    {r.matchedSkills?.map((s) => (
                                      <span
                                        key={s}
                                        className="admin-cv-skill-tag matched"
                                      >
                                        ✓ {s}
                                      </span>
                                    ))}
                                    {r.missingSkills?.map((s) => (
                                      <span
                                        key={s}
                                        className="admin-cv-skill-tag missing"
                                      >
                                        ✗ {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {r.summary && (
                                <div className="admin-cv-summary-text">
                                  {r.summary}
                                </div>
                              )}

                              <div className="admin-cv-resume-actions">
                                <button
                                  className="admin-cv-btn-sm"
                                  onClick={() =>
                                    handleDownload(
                                      r.resumeId,
                                      r.originalName
                                    )
                                  }
                                >
                                  <HiOutlineArrowDownTray /> Download
                                </button>
                                <button
                                  className="admin-cv-btn-sm"
                                  onClick={async () => {
                                    try {
                                      const token = getToken();
                                      const res = await fetch(
                                        `${backendURL}/admin/cv-analysis/resume/${r.resumeId}/download`,
                                        { headers: { Authorization: `Bearer ${token}` } }
                                      );
                                      if (res.ok) {
                                        const blob = await res.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        window.open(url, "_blank");
                                      }
                                    } catch (err) {
                                      console.error("Open error:", err);
                                    }
                                  }}
                                >
                                  <HiOutlineEye /> Open
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </>
              ) : (
                <p className="text-muted text-center">
                  Failed to load details.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
