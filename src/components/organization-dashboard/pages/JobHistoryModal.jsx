import { useState, useEffect } from "react";
import "./JobHistoryModal.css";
import {
  HiOutlineXMark,
  HiOutlineDocumentText,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineMapPin,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineVideoCamera,
  HiOutlineExclamationTriangle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineEye,
  HiChevronDown,
  HiChevronRight,
} from "react-icons/hi2";
import { getToken } from "../../../services/token";
import { backendURL } from "../../../pages/Home";

// ── Main Modal ──────────────────────────────────────────────────────────────
export default function JobHistoryModal({ job, onClose }) {
  // job === null  →  "all jobs" mode (header button)
  // job === {...} →  "single job" mode (row Eye button)
  const isAllMode = !job;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);       // single-job payload
  const [allData, setAllData] = useState(null); // all-jobs payload
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("cv"); // "cv" | "interviews"
  const [expandedJob, setExpandedJob] = useState(null); // for all-mode accordion

  useEffect(() => {
    if (isAllMode) {
      fetchAll();
    } else {
      fetchSingle();
    }
  }, [job]);

  const fetchSingle = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/job-history/${job._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch job history");
      const d = await res.json();
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/job-history-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch history");
      const d = await res.json();
      setAllData(d);
      if (d.jobs && d.jobs.length > 0) setExpandedJob(d.jobs[0].jobId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jhm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="jhm-dialog">
        {/* ── Header ── */}
        <div className="jhm-header">
          <div className="jhm-header-left">
            <div className="jhm-header-icon">
              <HiOutlineChartBar />
            </div>
            <div>
              <h2 className="jhm-title">
                {isAllMode ? "Job Master History" : "Job History"}
              </h2>
              {!isAllMode && <p className="jhm-subtitle">{job.jobTitle}</p>}
              {!isAllMode && (
                <div className="jhm-meta">
                  <span className="jhm-meta-pill"><HiOutlineMapPin />{job.jobLocation}</span>
                  <span className="jhm-meta-pill"><HiOutlineAcademicCap />{job.minEducation}</span>
                  <span className="jhm-meta-pill"><HiOutlineClock />{job.minExperience}</span>
                </div>
              )}
            </div>
          </div>
          <button className="jhm-close-btn" onClick={onClose} title="Close">
            <HiOutlineXMark />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="jhm-body">
          {loading && (
            <div className="jhm-loading">
              <div className="jhm-spinner" />
              <p>Loading history…</p>
            </div>
          )}

          {error && !loading && (
            <div className="jhm-error">
              <HiOutlineExclamationTriangle />
              <span>{error}</span>
            </div>
          )}

          {/* ════ ALL-JOBS MODE ════════════════════════════════════════════ */}
          {!loading && !error && isAllMode && allData && (
            <AllJobsView
              allData={allData}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              expandedJob={expandedJob}
              setExpandedJob={setExpandedJob}
            />
          )}

          {/* ════ SINGLE-JOB MODE ══════════════════════════════════════════ */}
          {!loading && !error && !isAllMode && data && (
            <SingleJobView
              data={data}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </div>

        {/* ── Footer ── */}
        {/* <div className="jhm-footer">
          <button className="jhm-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div> */}
      </div>
    </div>
  );
}

// ── Single-Job View ──────────────────────────────────────────────────────────
function SingleJobView({ data, activeTab, setActiveTab }) {
  return (
    <>
      {/* Stats Row */}
      <div className="jhm-stats-grid">
        <StatCard icon={<HiOutlineDocumentText />} value={data.totalCVsAnalyzed ?? 0} label="CVs Analysed" color="brand" />
        <StatCard icon={<HiOutlineUser />} value={data.uniqueCandidates ?? 0} label="Unique Candidates" color="info" />
        <StatCard icon={<HiOutlineCalendar />} value={data.interviewsScheduled ?? 0} label="Interviews Scheduled" color="success" />
        <StatCard icon={<HiOutlineChartBar />} value={data.averageScore || "N/A"} label="Avg Match Score" color="warning" />
      </div>

      {/* Tabs */}
      <div className="jhm-tabs">
        <button className={`jhm-tab ${activeTab === "cv" ? "active" : ""}`} onClick={() => setActiveTab("cv")}>
          <HiOutlineDocumentText /> CV Analyses ({data.recentAnalyses?.length ?? 0})
        </button>
        <button className={`jhm-tab ${activeTab === "interviews" ? "active" : ""}`} onClick={() => setActiveTab("interviews")}>
          <HiOutlineVideoCamera /> Interviews ({data.interviews?.length ?? 0})
        </button>
      </div>

      {activeTab === "cv" && (
        <CVTable analyses={data.recentAnalyses || []} />
      )}
      {activeTab === "interviews" && (
        <InterviewTable interviews={data.interviews || []} />
      )}
    </>
  );
}

// ── All-Jobs View ────────────────────────────────────────────────────────────
function AllJobsView({ allData, activeTab, setActiveTab, expandedJob, setExpandedJob }) {
  return (
    <>
      {/* Grand Totals */}
      <div className="jhm-stats-grid">
        <StatCard icon={<HiOutlineBriefcase />} value={allData.totalJobs ?? 0} label="Total Job Positions" color="brand" />
        <StatCard icon={<HiOutlineDocumentText />} value={allData.totalCVsAnalyzed ?? 0} label="Total CVs Analysed" color="info" />
        <StatCard icon={<HiOutlineCalendar />} value={allData.totalInterviewsScheduled ?? 0} label="Total Interviews" color="success" />
      </div>

      {/* Per-job accordion */}
      {allData.jobs && allData.jobs.length > 0 ? (
        <div className="jhm-accordion">
          {allData.jobs.map((j) => {
            const isOpen = expandedJob === j.jobId;
            return (
              <div key={j.jobId} className={`jhm-accordion-item ${isOpen ? "open" : ""}`}>
                <button
                  className="jhm-accordion-trigger"
                  onClick={() => setExpandedJob(isOpen ? null : j.jobId)}
                >
                  <div className="jhm-acc-left">
                    <div className="jhm-acc-icon"><HiOutlineBriefcase /></div>
                    <div>
                      <span className="jhm-acc-title">{j.jobTitle}</span>
                      <span className="jhm-acc-meta">
                        {j.jobLocation && <><HiOutlineMapPin />{j.jobLocation}</>}
                        {j.minExperience && <><HiOutlineClock />{j.minExperience}</>}
                      </span>
                    </div>
                  </div>
                  <div className="jhm-acc-right">
                    <span className="jhm-acc-pill cv">{j.totalCVsAnalyzed} CVs</span>
                    <span className="jhm-acc-pill int">{j.interviewsScheduled} Interviews</span>
                    {/* <span className="jhm-acc-pill score">{j.averageScore}</span> */}
                    {isOpen ? <HiChevronDown /> : <HiChevronRight />}
                  </div>
                </button>

                {isOpen && (
                  <div className="jhm-accordion-body">
                    {/* Sub-tabs */}
                    <div className="jhm-tabs jhm-tabs-sub">
                      <button className={`jhm-tab ${activeTab === "cv" ? "active" : ""}`} onClick={() => setActiveTab("cv")}>
                        <HiOutlineDocumentText /> CV Analyses ({j.recentAnalyses?.length ?? 0})
                      </button>
                      <button className={`jhm-tab ${activeTab === "interviews" ? "active" : ""}`} onClick={() => setActiveTab("interviews")}>
                        <HiOutlineVideoCamera /> Interviews ({j.interviews?.length ?? 0})
                      </button>
                    </div>
                    {activeTab === "cv" && <CVTable analyses={j.recentAnalyses || []} />}
                    {activeTab === "interviews" && <InterviewTable interviews={j.interviews || []} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<HiOutlineBriefcase />}
          title="No Job History Yet"
          desc="Create job positions and run CV analyses or schedule interviews to see history here."
        />
      )}
    </>
  );
}

// ── CV Analysis Table ─────────────────────────────────────────────────────────
async function openResume(resumeId, token) {
  try {
    const res = await fetch(`${(await import("../../../pages/Home")).backendURL}/organization/resume-view/${resumeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { alert("File not available on server."); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    // revoke after a short delay so the tab has time to load
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    alert("Could not open resume. The file may have been deleted from the server.");
  }
}

function CVTable({ analyses }) {
  if (!analyses || analyses.length === 0) {
    return (
      <EmptyState
        icon={<HiOutlineDocumentText />}
        title="No CV Analyses Yet"
        desc="Analyse CVs against this job to see results here."
        link={{ href: "/organization/dashboard/cv-analyser", label: "Analyse CVs" }}
      />
    );
  }
  const token = getToken();
  return (
    <div className="jhm-table-wrap">
      <table className="jhm-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Candidate</th>
            <th>File</th>
            <th>Match</th>
            <th>Verdict</th>
            {/* <th>Role Fit</th> */}
            <th>Analysed</th>
            <th>CV</th>
          </tr>
        </thead>
        <tbody>
          {analyses.map((a, i) => (
            <tr key={`${a.resumeId}-${i}`}>
              <td className="jhm-td-num">{i + 1}</td>
              <td><span className="jhm-candidate-name">{a.candidateName || "—"}</span></td>
              <td>
                <span className="jhm-filename" title={a.fileName}>
                  {a.fileName ? a.fileName.slice(0, 24) + (a.fileName.length > 24 ? "…" : "") : "—"}
                </span>
              </td>
              <td>
                <span className={`jhm-score-badge ${scoreClass(a.matchScore)}`}>
                  {a.matchScore ?? 0}%
                </span>
              </td>
              <td>
                <span className={`jhm-status-pill ${verdictClass(a.verdict)}`}>
                  {a.verdict || "—"}
                </span>
              </td>
              {/* <td>
                <span className={`jhm-status-pill ${roleFitClass(a.roleFit)}`}>
                  {a.roleFit || "—"}
                </span>
              </td> */}
              <td className="jhm-td-date">
                {a.analyzedAt ? new Date(a.analyzedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
              </td>
              <td>
                {a.resumeId ? (
                  <button
                    className="jhm-view-btn"
                    title={`View ${a.fileName}`}
                    onClick={() => openResume(a.resumeId, token)}
                  >
                    <HiOutlineEye />
                  </button>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Interview Table ───────────────────────────────────────────────────────────
function InterviewTable({ interviews }) {
  if (!interviews || interviews.length === 0) {
    return (
      <EmptyState
        icon={<HiOutlineVideoCamera />}
        title="No Interviews Scheduled"
        desc="Schedule interviews for this job position to see them here."
        link={{ href: "/organization/dashboard/schedule-interview", label: "Schedule Interview" }}
      />
    );
  }
  return (
    <div className="jhm-table-wrap">
      <table className="jhm-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Candidate</th>
            <th>Email</th>
            <th>Type</th>
            <th>Duration</th>
            <th>Schedule</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {interviews.map((iv, i) => {
            const scheduleDisplay = iv.schedulingType === "specific"
              ? (iv.scheduledDate ? formatDate(iv.scheduledDate) : "—")
              : iv.schedulingType === "timer"
                ? `${iv.daysTimer || "?"} day timer`
                : iv.schedulingType || "—";

            const completedBadge = iv.completed
              ? <span className="jhm-status-pill success">Completed</span>
              : <span className="jhm-status-pill warning">Pending</span>;
            const deadlineDisplay = iv.deadline ? (
              <span className="jhm-deadline" title={`Deadline: ${formatDate(iv.deadline)}`}>
                ⏳ {formatDate(iv.deadline)}
              </span>
            ) : null;

            return (
              <tr key={iv._id || i}>
                <td className="jhm-td-num">{i + 1}</td>
                <td><span className="jhm-candidate-name">{iv.candidateName || "—"}</span></td>
                <td><span className="jhm-email">{iv.candidateEmail || "—"}</span></td>
                <td>
                  <span className={`jhm-status-pill ${iv.interviewType === "technical" ? "info" : "secondary"}`}>
                    {iv.interviewType || "—"}
                  </span>
                </td>
                <td><span className="jhm-duration">{iv.duration ? `${iv.duration} min` : "—"}</span></td>
                <td>
                  <span className="jhm-schedule-info">
                    {scheduleDisplay}
                    {deadlineDisplay}
                  </span>
                </td>
                <td>{completedBadge}</td>
                <td className="jhm-td-date">
                  {iv.createdAt ? new Date(iv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color }) {
  return (
    <div className={`jhm-stat-card jhm-stat-${color}`}>
      <div className="jhm-stat-icon">{icon}</div>
      <div className="jhm-stat-body">
        <div className="jhm-stat-value">{value}</div>
        <div className="jhm-stat-label">{label}</div>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ icon, title, desc, link }) {
  return (
    <div className="jhm-empty">
      <div className="jhm-empty-icon">{icon}</div>
      <h4>{title}</h4>
      <p>{desc}</p>
      {link && (
        <a href={link.href} className="jhm-btn-primary">
          {link.label} <HiOutlineArrowTopRightOnSquare style={{ marginLeft: 4, verticalAlign: "middle" }} />
        </a>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreClass(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}
function verdictClass(v) {
  const l = v?.toLowerCase();
  if (["shortlist", "shortlisted", "strong hire"].includes(l)) return "success";
  if (["reject", "rejected"].includes(l)) return "danger";
  if (["maybe", "consider"].includes(l)) return "warning";
  return "secondary";
}
function roleFitClass(v) {
  const l = v?.toLowerCase();
  if (l === "high") return "success";
  if (l === "medium") return "warning";
  if (l === "low") return "danger";
  return "secondary";
}
function formatDate(raw) {
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return raw;
  }
}
