import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./OrgCvAnalyzer.css";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import {
  HiOutlineDocumentText,
  HiOutlineCloudArrowUp,
  HiOutlineMagnifyingGlass,
  HiOutlineChartBar,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlineChevronDown,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
  HiOutlineClock,
  HiOutlineCalendar,
} from "react-icons/hi2";
import {
  createScreeningJob,
  uploadResumes,
  analyzeResumes,
  getReport,
  deleteResume,
  getCvUsage,
  validateCV,
} from "../../../services/resumeScreeningApi";
import { getSubscriptionStatus } from "../../../services/subscriptionApi";
import { getJobPositions } from "../../../services/jobMasterApi";
import CvUpgradeGate from "./CvUpgradeGate";
import CvLimitModal from "./CvLimitModal";

// ───────────────────────────────────────────
// Constants
// ───────────────────────────────────────────
const MAX_RESUMES = 10;
const STEPS = [
  { key: "job", label: "Position Requirements", icon: HiOutlineDocumentText },
  { key: "upload", label: "Upload Resumes", icon: HiOutlineCloudArrowUp },
  { key: "analyze", label: "Analyze", icon: HiOutlineMagnifyingGlass },
  { key: "results", label: "Results", icon: HiOutlineChartBar },
];

const SENIORITY_OPTIONS = [
  "Intern",
  "Junior",
  "Mid-Level",
  "Senior",
  "Lead",
  "Manager",
  "Director",
  "VP",
  "C-Level",
];

const INDUSTRY_OPTIONS = [
  "Technology / IT",
  "Finance / Banking",
  "Healthcare / Pharma",
  "Education",
  "Manufacturing",
  "Retail / E-Commerce",
  "Consulting",
  "Media / Entertainment",
  "Government / Public Sector",
  "Energy / Utilities",
  "Logistics / Supply Chain",
  "Real Estate",
  "Legal",
  "Other",
];

const INITIAL_JOB_FORM = {
  jobTitle: "",
  jobDescription: "",
  requiredExperience: "",
  mandatorySkills: [],
  industry: "",
  seniorityLevel: "",
  scoringScale: "10",
  reportType: "SUMMARY",
};

// ───────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────
export default function OrgCvAnalyzer() {
  const navigate = useNavigate();

  // Subscription gate
  const [subLoading, setSubLoading] = useState(true);
  const [planName, setPlanName] = useState("");
  const [subscription, setSubscription] = useState(null);

  // CV usage limit
  const [cvUsed, setCvUsed] = useState(0);
  const [cvLimit, setCvLimit] = useState(0);
  const [cvTier, setCvTier] = useState("basic");
  const [showCvLimitModal, setShowCvLimitModal] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const data = await getSubscriptionStatus();
        // console.log(data)
        const tier = (data?.subscriptionTier || data?.subscription?.tier || "basic").toLowerCase();
        setSubscription(data);
        setPlanName(data?.planName || tier.charAt(0).toUpperCase() + tier.slice(1));

        // Fetch CV usage for all plans (basic included)
        try {
          const usage = await getCvUsage();
          console.log(usage)
          setCvUsed(usage.cvUsed || 0);
          setCvLimit(usage.cvLimit || 0);
          setCvTier(usage.tier || tier);
        } catch (usageErr) {
          console.error("Error fetching CV usage:", usageErr);
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
      } finally {
        setSubLoading(false);
      }
    };
    checkSubscription();
  }, []);

  // Step state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Job Master integration
  const [availableJobs, setAvailableJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobs = await getJobPositions();
        setAvailableJobs(jobs);
      } catch (err) {
        console.error("Error fetching jobs:", err);
      }
    };
    fetchJobs();
  }, []);

  // Job form state
  const [jobForm, setJobForm] = useState({ ...INITIAL_JOB_FORM });
  const [skillInput, setSkillInput] = useState("");
  const [jobErrors, setJobErrors] = useState({});
  const [jobLoading, setJobLoading] = useState(false);
  const [jobSuccess, setJobSuccess] = useState(false);
  const [jobId, setJobId] = useState(null);

  // Upload state
  const [resumeFiles, setResumeFiles] = useState([]); // { file, id?, status, error?, validation? }
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // CV Validation state
  const [validatingIndex, setValidatingIndex] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [currentValidation, setCurrentValidation] = useState(null);

  // Analyze state
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 });
  const [analyzeError, setAnalyzeError] = useState("");

  // Results state
  const [report, setReport] = useState(null);
  const [sortField, setSortField] = useState("rank");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});

  // Global error
  const [globalError, setGlobalError] = useState("");

  // ─── Helpers ──────────────────────────────
  const markStepComplete = (idx) => {
    setCompletedSteps((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  };

  const goToStep = (idx) => setCurrentStep(idx);

  // ─── Job Form Handlers ────────────────────
  const handleJobSelection = (jobId) => {
    setSelectedJobId(jobId);
    if (!jobId) {
      setJobForm({ ...INITIAL_JOB_FORM });
      return;
    }

    const selectedJob = availableJobs.jobs?.find((j) => j._id === jobId);
    if (selectedJob) {
      // Map Job Master fields to CV Analyzer fields
      setJobForm({
        jobTitle: selectedJob.jobTitle || "",
        jobDescription: selectedJob.jobDescription || "",
        requiredExperience: selectedJob.minExperience || "",
        industry: selectedJob.educationField || "",
        mandatorySkills: [], // Will need to be added manually
        seniorityLevel: "", // Not in Job Master, needs manual selection
        scoringScale: "10",
        reportType: "SUMMARY",
      });
    }
  };

  const handleJobChange = (field, value) => {
    setJobForm((prev) => ({ ...prev, [field]: value }));
    if (jobErrors[field]) setJobErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (jobForm.mandatorySkills.includes(trimmed)) return;
    handleJobChange("mandatorySkills", [...jobForm.mandatorySkills, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    handleJobChange(
      "mandatorySkills",
      jobForm.mandatorySkills.filter((s) => s !== skill)
    );
  };

  const validateJobForm = () => {
    const errs = {};
    if (!jobForm.jobTitle.trim()) errs.jobTitle = "Job title is required";
    if (!jobForm.jobDescription.trim()) errs.jobDescription = "Job description is required";
    if (!jobForm.requiredExperience.trim()) errs.requiredExperience = "Experience is required";
    if (jobForm.mandatorySkills.length === 0) errs.mandatorySkills = "Add at least one skill";
    if (!jobForm.industry) errs.industry = "Select an industry";
    if (!jobForm.seniorityLevel) errs.seniorityLevel = "Select seniority level";
    setJobErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleJobSubmit = async () => {
    if (!validateJobForm()) return;
    setJobLoading(true);
    setGlobalError("");
    try {
      const res = await createScreeningJob(jobForm);
      setJobId(res.jobId);
      setJobSuccess(true);
      markStepComplete(0);
      setTimeout(() => goToStep(1), 1200);
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setJobLoading(false);
    }
  };

  // ─── Upload Handlers ──────────────────────
  const handleFilesSelected = async (fileList) => {
    const newFiles = Array.from(fileList).map((f) => ({
      file: f,
      id: null,
      status: "validating",
      error: null,
      validation: null,
    }));
    
    setResumeFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > MAX_RESUMES) {
        setUploadError(`You can upload a maximum of ${MAX_RESUMES} resumes at a time. ${combined.length - MAX_RESUMES} file(s) were not added.`);
        return combined.slice(0, MAX_RESUMES);
      }
      setUploadError("");
      return combined;
    });

    // Validate each file
    for (let i = 0; i < newFiles.length; i++) {
      const fileIndex = resumeFiles.length + i;
      await validateResumeFile(fileIndex, newFiles[i].file);
    }
  };

  const validateResumeFile = async (index, file) => {
    setValidatingIndex(index);
    try {
      const validation = await validateCV(file, jobForm);
      
      setResumeFiles((prev) => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            status: "pending",
            validation: {
              score: validation.matching_score,
              summary: validation.summary,
            },
          };
        }
        return updated;
      });

      // Show modal if score is low
      if (validation.matching_score < 40) {
        setCurrentValidation({
          index,
          filename: file.name,
          score: validation.matching_score,
          summary: validation.summary,
        });
        setShowValidationModal(true);
      }
    } catch (err) {
      console.error("Validation error:", err);
      // If validation fails, still allow the file but mark as pending
      setResumeFiles((prev) => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            status: "pending",
            validation: null,
          };
        }
        return updated;
      });
    } finally {
      setValidatingIndex(null);
    }
  };

  const handleRemoveValidatedFile = (index) => {
    setResumeFiles((prev) => prev.filter((_, i) => i !== index));
    if (currentValidation?.index === index) {
      setShowValidationModal(false);
      setCurrentValidation(null);
    }
  };

  const handleContinueWithFile = () => {
    setShowValidationModal(false);
    setCurrentValidation(null);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFilesSelected(e.dataTransfer.files);
  }, []);

  const handleRemoveFile = (index) => {
    setResumeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveUploaded = async (index) => {
    const item = resumeFiles[index];
    if (item.id) {
      try {
        await deleteResume(item.id);
      } catch {
        // still remove from UI
      }
    }
    setResumeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (!jobId) return;
    setUploadLoading(true);
    setUploadError("");
    setGlobalError("");

    const pendingFiles = resumeFiles.filter((r) => r.status === "pending").map((r) => r.file);
    if (pendingFiles.length === 0) {
      setUploadLoading(false);
      return;
    }

    try {
      const res = await uploadResumes(jobId, pendingFiles);

      setResumeFiles((prev) => {
        const updated = [...prev];
        let uploadIdx = 0;
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].status === "pending") {
            const match = res.uploaded?.[uploadIdx];
            const errMatch = res.errors?.find((e) => e.filename === updated[i].file.name);
            if (errMatch) {
              updated[i] = { ...updated[i], status: "error", error: errMatch.error };
            } else if (match) {
              updated[i] = { ...updated[i], status: "uploaded", id: match.resumeId };
            }
            uploadIdx++;
          }
        }
        return updated;
      });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const uploadedCount = resumeFiles.filter((r) => r.status === "uploaded").length;
  const pendingCount = resumeFiles.filter((r) => r.status === "pending").length;
  const canProceedToAnalyze = uploadedCount > 0;

  const handleProceedToAnalyze = () => {
    markStepComplete(1);
    goToStep(2);
  };

  // ─── Analyze Handlers ─────────────────────
  const handleAnalyze = async () => {
    if (!jobId) return;
    setAnalyzing(true);
    setAnalyzeError("");
    setGlobalError("");
    setAnalyzeProgress({ current: 0, total: uploadedCount });

    // Simulate incremental progress while waiting for backend
    const progressInterval = setInterval(() => {
      setAnalyzeProgress((prev) => {
        if (prev.current < prev.total - 1) {
          return { ...prev, current: prev.current + 1 };
        }
        return prev;
      });
    }, 1500);

    try {
      await analyzeResumes(jobId);
      clearInterval(progressInterval);
      setAnalyzeProgress({ current: uploadedCount, total: uploadedCount });

      // Fetch report
      const reportData = await getReport(jobId);
      setReport(reportData);
      markStepComplete(2);
      setTimeout(() => goToStep(3), 800);
    } catch (err) {
      clearInterval(progressInterval);
      setAnalyzeError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Results Handlers ─────────────────────
  const getSortedCandidates = () => {
    if (!report?.candidates) return [];
    const sorted = [...report.candidates].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
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

  const getScoreClass = (score, scale) => {
    const pct = scale === "100" ? score : (score / 10) * 100;
    if (pct >= 70) return "cv-score-high";
    if (pct >= 40) return "cv-score-mid";
    return "cv-score-low";
  };

  const handleStartNew = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setJobForm({ ...INITIAL_JOB_FORM });
    setSkillInput("");
    setJobErrors({});
    setJobLoading(false);
    setJobSuccess(false);
    setJobId(null);
    setResumeFiles([]);
    setUploadLoading(false);
    setUploadError("");
    setAnalyzing(false);
    setAnalyzeProgress({ current: 0, total: 0 });
    setAnalyzeError("");
    setReport(null);
    setSortField("rank");
    setSortAsc(true);
    setExpandedCards({});
    setGlobalError("");
  };

  // ─── Render ───────────────────────────────

  if (subLoading) {
    return (
      <div className="cv-analyzer-container fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="cv-spinner-inline" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  const cvLimitExceeded = cvLimit > 0 && cvUsed >= cvLimit;

  return (
    <div className="cv-analyzer-container fade-in">
      {/* CV Limit Modal */}
      <CvLimitModal
        isOpen={showCvLimitModal || cvLimitExceeded}
        onClose={() => setShowCvLimitModal(false)}
        currentTier={cvTier}
        cvUsed={cvUsed}
        cvLimit={cvLimit}
      />

      {/* Stepper */}
      <div className="cv-stepper">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isDone = completedSteps.includes(idx);
          return (
            <div key={step.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              {idx > 0 && (
                <div className={`cv-step-divider ${isDone || completedSteps.includes(idx - 1) ? "completed" : ""}`} />
              )}
              <div className={`cv-step ${isActive ? "active" : ""} ${isDone ? "completed" : ""}`}>
                <Icon style={{ fontSize: "1.1rem" }} />
                <span>{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Error */}
      {globalError && (
        <div className="cv-error-banner">
          <HiOutlineExclamationTriangle style={{ fontSize: "1.3rem", flexShrink: 0 }} />
          <span>{globalError}</span>
          <button
            onClick={() => setGlobalError("")}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--error)" }}
          >
            <HiOutlineXMark />
          </button>
        </div>
      )}

      {/* ============================
          STEP 0 – Position Requirements
         ============================ */}
      {currentStep === 0 && (
        <Card>
          <div className="cv-section-header">
            <h2>Position Requirements</h2>
            <p>Provide the job details so we can screen resumes against your requirements.</p>
          </div>

          {jobSuccess && (
            <div className="cv-success-banner">
              <HiOutlineCheckCircle style={{ fontSize: "1.4rem" }} />
              Job created successfully! Proceeding to resume upload...
            </div>
          )}

          {/* Job Selection from Job Master */}
          {availableJobs.jobs && availableJobs.jobs.length > 0 && (
            <div className="cv-job-selector" style={{ marginBottom: "var(--space-lg)", padding: "var(--space-md)", background: "var(--accent-soft)", borderRadius: "var(--radius-md)", border: "1px solid var(--accent-primary)" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "var(--space-sm)", color: "var(--text-primary)" }}>
                Quick Start: Select from Existing Job Positions
              </label>
              <select
                className="cv-select"
                value={selectedJobId}
                onChange={(e) => handleJobSelection(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">-- Select a job to auto-fill details --</option>
                {availableJobs.jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.jobTitle} ({job.jobLocation})
                  </option>
                ))}
              </select>
              <small style={{ display: "block", marginTop: "var(--space-xs)", color: "var(--text-muted)" }}>
                Selecting a job will auto-fill the title, description, and experience fields below. You can still modify them as needed.
              </small>
            </div>
          )}

          <div className="cv-form-grid">
            {/* Job Title */}
            <div>
              <Input
                label="Job Title"
                placeholder="e.g. Senior Frontend Engineer"
                value={jobForm.jobTitle}
                onChange={(e) => handleJobChange("jobTitle", e.target.value)}
              />
              {jobErrors.jobTitle && <div className="cv-field-error">{jobErrors.jobTitle}</div>}
            </div>

            {/* Required Experience */}
            <div className="cv-select-group">
              <label>Required Experience</label>
              <select
                className="cv-select"
                value={jobForm.requiredExperience}
                onChange={(e) => handleJobChange("requiredExperience", e.target.value)}
              >
                <option value="">Select experience level</option>
                <option value="0-1 years (Entry Level)">Fresher (0 years)</option>
                <option value="1-3 years (Junior)">Junior (1-2 years)</option>
                <option value="3-5 years (Mid-Level)">Mid-Level (3-5 years)</option>
                <option value="5-8 years (Senior)">Senior (6-8 years)</option>
                <option value="8-12 years (Lead)">Lead (9-12 years)</option>
                <option value="12+ years (Expert)">Manager (13+ years)</option>
              </select>
              {jobErrors.requiredExperience && <div className="cv-field-error">{jobErrors.requiredExperience}</div>}
            </div>

            {/* Industry */}
            <div className="cv-select-group">
              <label>Industry / Domain</label>
              <select
                className="cv-select"
                value={jobForm.industry}
                onChange={(e) => handleJobChange("industry", e.target.value)}
              >
                <option value="">-- Select Industry --</option>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {jobErrors.industry && <div className="cv-field-error">{jobErrors.industry}</div>}
            </div>

            {/* Seniority Level */}
            <div className="cv-select-group">
              <label>Seniority Level</label>
              <select
                className="cv-select"
                value={jobForm.seniorityLevel}
                onChange={(e) => handleJobChange("seniorityLevel", e.target.value)}
              >
                <option value="">-- Select Level --</option>
                {SENIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {jobErrors.seniorityLevel && <div className="cv-field-error">{jobErrors.seniorityLevel}</div>}
            </div>

            {/* Scoring Scale */}
            <div className="cv-select-group">
              <label>Scoring Scale</label>
              <select
                className="cv-select"
                value={jobForm.scoringScale}
                onChange={(e) => handleJobChange("scoringScale", e.target.value)}
              >
                <option value="10">Out of 10</option>
                <option value="100">Out of 100</option>
              </select>
            </div>

            {/* Report Type */}
            <div className="cv-select-group">
              <label>Report Type</label>
              <select
                className="cv-select"
                value={jobForm.reportType}
                onChange={(e) => handleJobChange("reportType", e.target.value)}
              >
                <option value="SUMMARY">Summary Report</option>
                <option value="DETAILED">Detailed Report</option>
              </select>
            </div>

            {/* Job Description – full width */}
            <div className="cv-field-full">
              <div className="cv-select-group">
                <label>Job Description</label>
                <textarea
                  className="cv-textarea"
                  placeholder="Paste or type the full job description here..."
                  value={jobForm.jobDescription}
                  onChange={(e) => handleJobChange("jobDescription", e.target.value)}
                  rows={10}
                />
                {jobErrors.jobDescription && <div className="cv-field-error">{jobErrors.jobDescription}</div>}
              </div>
            </div>

            {/* Mandatory Skills – full width */}
            <div className="cv-field-full">
              <div className="cv-select-group">
                <label>Mandatory Skills</label>
                <div className="cv-skills-input-row">
                  <input
                    className="cv-select"
                    placeholder="Type a skill and press Add (e.g. React, Python)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button variant="secondary" onClick={addSkill}>
                    Add
                  </Button>
                </div>
                {jobErrors.mandatorySkills && <div className="cv-field-error">{jobErrors.mandatorySkills}</div>}
                {jobForm.mandatorySkills.length > 0 && (
                  <div className="cv-skills-tags">
                    {jobForm.mandatorySkills.map((skill) => (
                      <span key={skill} className="cv-skill-tag">
                        {skill}
                        <button onClick={() => removeSkill(skill)} title="Remove">
                          <HiOutlineXMark />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="cv-form-actions">
            <Button
              variant="secondary"
              onClick={() => navigate("/organization/dashboard/cv-analyser/history")}
            >
              <HiOutlineClock style={{ marginRight: 6 }} />
              History
            </Button>
            <Button onClick={handleJobSubmit} disabled={jobLoading || jobSuccess}>
              {jobLoading ? (
                <>
                  <span className="cv-spinner-inline" style={{ marginRight: 8 }} />
                  Creating Job...
                </>
              ) : jobSuccess ? (
                "Job Created"
              ) : (
                "Create Job & Continue"
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* ============================
          STEP 1 – Resume Upload
         ============================ */}
      {currentStep === 1 && (
        <Card>
          <div className="cv-section-header">
            <h2>Upload Resumes</h2>
            <p>Upload one or more resumes (PDF, DOC, DOCX) to screen against the job requirements.</p>
          </div>

          {/* Drop zone */}
          <div
            className={`cv-upload-zone ${dragOver ? "drag-over" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <HiOutlineCloudArrowUp className="cv-upload-zone-icon" />
            <p><strong>Click to browse</strong> or drag & drop resumes here</p>
            <p>Supports PDF, DOC, DOCX &middot; Max {MAX_RESUMES} files</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {uploadError && (
            <div className="cv-error-banner" style={{ marginTop: "var(--space-md)" }}>
              <HiOutlineExclamationTriangle style={{ fontSize: "1.3rem" }} />
              <span>{uploadError}</span>
            </div>
          )}

          {/* File list */}
          {resumeFiles.length > 0 && (
            <div className="cv-resume-list">
              {resumeFiles.map((item, idx) => (
                <div key={idx} className="cv-resume-item">
                  <div className="cv-resume-item-info">
                    <HiOutlineDocumentText className="cv-resume-item-icon" />
                    <div style={{ flex: 1 }}>
                      <div className="cv-resume-item-name">{item.file.name}</div>
                      <div className="cv-resume-item-size">
                        {(item.file.size / 1024).toFixed(1)} KB
                        {item.status === "validating" && validatingIndex === idx && (
                          <span style={{ marginLeft: 8, color: "var(--accent-primary)", fontSize: "0.85rem" }}>
                            <span className="cv-spinner-inline" style={{ width: 12, height: 12, marginRight: 4 }} />
                            Validating...
                          </span>
                        )}
                        {item.status === "uploaded" && (
                          <span className="cv-status-badge cv-status-completed" style={{ marginLeft: 8 }}>
                            Uploaded
                          </span>
                        )}
                        {item.status === "pending" && item.validation && (
                          <span 
                            className="cv-status-badge" 
                            style={{ 
                              marginLeft: 8,
                              background: item.validation.score >= 70 ? "var(--success-soft)" : 
                                         item.validation.score >= 40 ? "var(--warning-soft)" : "var(--error-soft)",
                              color: item.validation.score >= 70 ? "var(--success)" : 
                                     item.validation.score >= 40 ? "var(--warning)" : "var(--error)",
                              border: `1px solid ${item.validation.score >= 70 ? "var(--success)" : 
                                                   item.validation.score >= 40 ? "var(--warning)" : "var(--error)"}`
                            }}
                          >
                            Match: {item.validation.score}%
                          </span>
                        )}
                        {item.status === "pending" && !item.validation && (
                          <span className="cv-status-badge cv-status-uploaded" style={{ marginLeft: 8 }}>
                            Ready
                          </span>
                        )}
                        {item.status === "error" && (
                          <span className="cv-resume-item-error" style={{ marginLeft: 8 }}>
                            {item.error}
                          </span>
                        )}
                      </div>
                      {item.validation && item.validation.summary && (
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>
                          {item.validation.summary}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="cv-resume-item-delete"
                    title="Remove"
                    onClick={() =>
                      item.status === "uploaded" ? handleRemoveUploaded(idx) : handleRemoveFile(idx)
                    }
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="cv-form-actions">
            <Button variant="secondary" onClick={() => goToStep(0)}>
              Back
            </Button>

            {pendingCount > 0 && (
              <Button variant="secondary" onClick={handleUploadAll} disabled={uploadLoading}>
                {uploadLoading ? (
                  <>
                    <span className="cv-spinner-inline" style={{ marginRight: 8 }} />
                    Uploading...
                  </>
                ) : (
                  `Upload ${pendingCount} File${pendingCount > 1 ? "s" : ""}`
                )}
              </Button>
            )}

            <Button onClick={handleProceedToAnalyze} disabled={!canProceedToAnalyze}>
              Proceed to Analyze
            </Button>
          </div>
        </Card>
      )}

      {/* ============================
          STEP 2 – Analyze
         ============================ */}
      {currentStep === 2 && (
        <Card>
          <div className="cv-section-header">
            <h2>Analyze Resumes</h2>
            <p>
              {uploadedCount} resume{uploadedCount !== 1 ? "s" : ""} ready for analysis.
              Click below to start the AI-powered screening.
            </p>
          </div>

          {analyzeError && (
            <div className="cv-error-banner">
              <HiOutlineExclamationTriangle style={{ fontSize: "1.3rem" }} />
              <span>{analyzeError}</span>
            </div>
          )}

          {analyzing && (
            <div className="cv-progress-container">
              <div className="cv-progress-bar-track">
                <div
                  className="cv-progress-bar-fill"
                  style={{
                    width: `${analyzeProgress.total ? (analyzeProgress.current / analyzeProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="cv-progress-text">
                Analyzing resume {analyzeProgress.current + 1} of {analyzeProgress.total}...
              </div>
            </div>
          )}

          <div className="cv-form-actions">
            <Button variant="secondary" onClick={() => goToStep(1)} disabled={analyzing}>
              Back
            </Button>
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? (
                <>
                  <span className="cv-spinner-inline" style={{ marginRight: 8 }} />
                  Analyzing...
                </>
              ) : (
                "Analyze Resumes"
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* ============================
          STEP 3 – Results
         ============================ */}
      {currentStep === 3 && report && (
        <Card>
          <div className="cv-section-header">
            <h2>Screening Results</h2>
            <p>
              {report.job?.jobTitle} — {report.candidates?.length} candidate{report.candidates?.length !== 1 ? "s" : ""} screened
              {report.job?.scoringScale && ` (scored out of ${report.job.scoringScale})`}
            </p>
          </div>

          {/* ── SUMMARY REPORT ── */}
          {report.job?.reportType === "SUMMARY" && (
            <div className="cv-results-table-wrapper">
              <table className="cv-results-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("rank")}>
                      Rank {sortField === "rank" && <span className="cv-sort-indicator">{sortAsc ? "▲" : "▼"}</span>}
                    </th>
                    <th onClick={() => handleSort("candidateName")}>
                      Name {sortField === "candidateName" && <span className="cv-sort-indicator">{sortAsc ? "▲" : "▼"}</span>}
                    </th>
                    <th onClick={() => handleSort("score")}>
                      Score {sortField === "score" && <span className="cv-sort-indicator">{sortAsc ? "▲" : "▼"}</span>}
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
                            c.rank === 1 ? "cv-rank-1" : c.rank === 2 ? "cv-rank-2" : c.rank === 3 ? "cv-rank-3" : ""
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
                              className={`cv-score-bar-fill ${getScoreClass(c.score, report.job.scoringScale)}`}
                              style={{
                                width: `${(c.score / Number(report.job.scoringScale)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`cv-status-badge cv-status-${c.status}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate("/organization/dashboard/smart-scheduler", { 
                            state: { 
                              candidateName: c.candidateName,
                              position: report?.job?.jobTitle,
                              fromAnalyzer: true 
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
                  <div className="cv-detail-card-header" onClick={() => toggleCard(c.resumeId)}>
                    <div className="cv-detail-card-left">
                      <span
                        className={`cv-rank-badge ${
                          c.rank === 1 ? "cv-rank-1" : c.rank === 2 ? "cv-rank-2" : c.rank === 3 ? "cv-rank-3" : ""
                        }`}
                      >
                        #{c.rank}
                      </span>
                      <div>
                        <strong>{c.candidateName}</strong>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          Score: {c.score}/{report.job.scoringScale}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                      <span className={`cv-status-badge cv-status-${c.status}`}>{c.status}</span>
                      <HiOutlineChevronDown className={`cv-chevron ${expandedCards[c.resumeId] ? "open" : ""}`} />
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
                        <span className="cv-detail-value">{c.experienceMatch || "—"}</span>
                      </div>
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">Matched Skills</span>
                        <div className="cv-detail-skills">
                          {c.matchedSkills?.length > 0
                            ? c.matchedSkills.map((s) => (
                                <span key={s} className="cv-detail-skill-matched">{s}</span>
                              ))
                            : <span className="cv-detail-value">—</span>}
                        </div>
                      </div>
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">Missing Skills</span>
                        <div className="cv-detail-skills">
                          {c.missingSkills?.length > 0
                            ? c.missingSkills.map((s) => (
                                <span key={s} className="cv-detail-skill-missing">{s}</span>
                              ))
                            : <span className="cv-detail-value">—</span>}
                        </div>
                      </div>
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">Summary</span>
                        <span className="cv-detail-value">{c.summary || "—"}</span>
                      </div>
                      <div className="cv-detail-actions">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate("/organization/dashboard/smart-scheduler", { 
                            state: { 
                              candidateName: c.candidateName,
                              position: report?.job?.jobTitle,
                              fromAnalyzer: true 
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

          <div className="cv-new-job-row">
            <Button variant="secondary" onClick={handleStartNew}>
              <HiOutlineArrowPath style={{ marginRight: 6 }} />
              Screen New Job
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate("/organization/dashboard/smart-scheduler", { 
                state: { 
                  position: jobForm.jobTitle,
                  fromAnalyzer: true 
                } 
              })}
            >
              <HiOutlineCalendar style={{ marginRight: 6 }} />
              Schedule Interviews
            </Button>
          </div>
        </Card>
      )}

      {/* CV Validation Modal */}
      {showValidationModal && currentValidation && (
        <div className="cv-validation-modal-overlay">
          <div className="cv-validation-modal-content">
            <div className="cv-validation-modal-header">
              <HiOutlineExclamationTriangle 
                className={`cv-validation-modal-icon ${currentValidation.score < 40 ? 'low' : 'moderate'}`} 
              />
              <div>
                <h3 className="cv-validation-modal-title">
                  {currentValidation.score < 40 ? "Low Match Detected" : "Moderate Match"}
                </h3>
                <p className="cv-validation-modal-filename">
                  {currentValidation.filename}
                </p>
              </div>
            </div>

            <div className="cv-validation-modal-score-section">
              <div className="cv-validation-modal-score-row">
                <span className="cv-validation-modal-score-label">Matching Score:</span>
                <span 
                  className={`cv-validation-modal-score-value ${
                    currentValidation.score >= 70 ? 'high' : 
                    currentValidation.score >= 40 ? 'medium' : 'low'
                  }`}
                >
                  {currentValidation.score}%
                </span>
              </div>
              
              <div 
                className={`cv-validation-modal-summary ${
                  currentValidation.score >= 70 ? 'high' : 
                  currentValidation.score >= 40 ? 'medium' : 'low'
                }`}
              >
                <p className="cv-validation-modal-summary-text">
                  {currentValidation.summary}
                </p>
              </div>
            </div>

            {currentValidation.score < 40 && (
              <div className="cv-validation-modal-warning">
                <p className="cv-validation-modal-warning-text">
                  ⚠️ This resume may not be a good fit for the position. Consider reviewing the candidate's qualifications before proceeding.
                </p>
              </div>
            )}

            <div className="cv-validation-modal-actions">
              <Button 
                variant="secondary" 
                onClick={() => handleRemoveValidatedFile(currentValidation.index)}
              >
                <HiOutlineTrash style={{ marginRight: 6 }} />
                Remove File
              </Button>
              <Button 
                variant="primary" 
                onClick={handleContinueWithFile}
              >
                <HiOutlineCheckCircle style={{ marginRight: 6 }} />
                Continue Anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}