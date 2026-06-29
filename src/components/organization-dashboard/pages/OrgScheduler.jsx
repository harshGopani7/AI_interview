import { useState, useEffect } from "react";
import { getToken } from "../../../services/token";
import { useNavigate, useLocation } from "react-router-dom";
import "./OrgScheduler.css";
import { 
  HiOutlineBriefcase,
  HiOutlineDocumentText, 
  HiOutlineCloudArrowUp, 
  HiOutlineCalendarDays, 
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineClipboard
} from "react-icons/hi2";
import Input from "../../../ui/Input";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import { backendURL } from "../../../pages/Home";
import { getJobPositions } from "../../../services/jobMasterApi";
import { getInterviewUsage } from "../../../services/subscriptionApi";

const STEPS = [
  { number: 1, title: "Select Position", icon: HiOutlineBriefcase },
  { number: 2, title: "Upload CV", icon: HiOutlineDocumentText },
  { number: 3, title: "Review Details", icon: HiOutlineCheckCircle },
  { number: 4, title: "Schedule Interview", icon: HiOutlineCalendarDays }
];

const NATURE_OF_POSITION = ["Junior", "Mid-Level", "Senior", "Lead", "Manager", "Director", "Other"];
const INTERVIEW_TYPES = ["technical", "hr", "managerial", "cultural-fit"];

export default function OrgScheduler() {
  const navigate = useNavigate();
  const location = useLocation();
  const editInterview = location.state?.editInterview;
  const resumeIdFromHistory = location.state?.resumeId;
  const fromCvHistory = location.state?.fromCvHistory;
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [credentials, setCredentials] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  
  // Interview usage
  const [interviewUsed, setInterviewUsed] = useState(0);
  const [interviewLimit, setInterviewLimit] = useState(0);
  const [interviewTier, setInterviewTier] = useState("basic");

  // Job Master Integration
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // CV Upload
  const [cvFile, setCvFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  
  // Auto-filled form data
  const [formData, setFormData] = useState({
    candidateName: "",
    candidateEmail: "",
    position: "",
    natureOfPosition: "Junior",
    customNatureOfPosition: "",
    educationalQualification: "",
    pastWorkExperienceYears: "",
    pastWorkExperienceField: "",
    currentWorkExperienceYears: "",
    currentWorkExperienceField: "",
    coreSkillSet: "",
    typeOfCompany: "",
    schedulingType: "specific",
    specificDate: "",
    specificTime: "",
    daysTimer: "",
    interviewType: "technical",
    duration: "30"
  });
  
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchJobs();
    fetchInterviewUsage();
  }, []);

  // Separate effect to handle CV history after jobs are loaded
  useEffect(() => {
    if (fromCvHistory && resumeIdFromHistory && jobs.length > 0) {
      const position = location.state?.position || "";
      const jobData = jobs.find(j => j.jobTitle === position);
      
      if (jobData) {
        setSelectedJob(jobData);
        setFormData(prev => ({
          ...prev,
          position: jobData.jobTitle,
          educationalQualification: jobData.minEducation,
        }));
      }
      
      // Skip Step 1 and go to Step 2, then automatically trigger CV parsing
      setCurrentStep(2);
      fetchResumeData(resumeIdFromHistory);
    }
  }, [fromCvHistory, resumeIdFromHistory, jobs]);

  // Handle edit mode
  useEffect(() => {
    if (editInterview) {
      setIsEditMode(true);
      
      // Parse scheduled date if it exists
      let parsedDate = "";
      let parsedTime = "";
      if (editInterview.scheduledDate) {
        const dateTimeParts = editInterview.scheduledDate.split(" ");
        if (dateTimeParts.length === 2) {
          parsedDate = dateTimeParts[0];
          parsedTime = dateTimeParts[1];
        }
      }
      
      // Pre-fill form data
      setFormData({
        candidateName: editInterview.candidateName || "",
        candidateEmail: editInterview.candidateEmail || "",
        position: editInterview.position || "",
        natureOfPosition: editInterview.natureOfPosition || "Junior",
        customNatureOfPosition: editInterview.customNatureOfPosition || "",
        educationalQualification: editInterview.educationalQualification || "",
        pastWorkExperienceYears: editInterview.pastWorkExperienceYears || "",
        pastWorkExperienceField: editInterview.pastWorkExperienceField || "",
        currentWorkExperienceYears: editInterview.currentWorkExperienceYears || "",
        currentWorkExperienceField: editInterview.currentWorkExperienceField || "",
        coreSkillSet: editInterview.coreSkillSet || "",
        typeOfCompany: editInterview.typeOfCompany || "",
        schedulingType: editInterview.daysTimer ? "timer" : "specific",
        specificDate: parsedDate,
        specificTime: parsedTime,
        daysTimer: editInterview.daysTimer ? String(editInterview.daysTimer) : "",
        interviewType: editInterview.interviewType || "technical",
        duration: editInterview.duration ? String(editInterview.duration) : "30"
      });
      
      // Skip to step 3 (Review Details) in edit mode
      setCurrentStep(3);
    }
  }, [editInterview, fromCvHistory, resumeIdFromHistory]);

  const fetchInterviewUsage = async () => {
    try {
      const data = await getInterviewUsage();
      setInterviewUsed(data.interviewUsed ?? 0);
      setInterviewLimit(data.interviewLimit ?? 0);
      setInterviewTier(data.tier ?? "basic");
    } catch (err) {
      console.error("Error fetching interview usage:", err);
    }
  };

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const data = await getJobPositions();
      setJobs(data.jobs || []);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load job positions" });
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchResumeData = async (resumeId) => {
    setParsing(true);
    setMessage({ type: "", text: "" });
    
    try {
      const token = getToken();
      const position = location.state?.position || "";
      
      // Find the job from jobs list to get job description
      const selectedJobData = jobs.find(j => j.jobTitle === position);
      
      const res = await fetch(`${backendURL}/organization/parse-cv-from-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeId: resumeId,
          jobTitle: position,
          jobDescription: selectedJobData?.jobDescription || ""
        })
      });

      if (res.ok) {
        const cvData = await res.json();
        console.log("CV parsed from history:", cvData);
        
        // Auto-fill form data just like normal CV upload flow
        setFormData(prev => ({
          ...prev,
          candidateName: cvData.candidateName || "",
          candidateEmail: cvData.candidateEmail || "",
          position: position || prev.position,
          educationalQualification: cvData.educationalQualification || prev.educationalQualification,
          pastWorkExperienceYears: cvData.pastWorkExperienceYears || "",
          pastWorkExperienceField: cvData.pastWorkExperienceField || "",
          currentWorkExperienceYears: cvData.currentWorkExperienceYears || "",
          currentWorkExperienceField: cvData.currentWorkExperienceField || "",
          coreSkillSet: cvData.coreSkillSet || "",
          typeOfCompany: cvData.typeOfCompany || "",
          natureOfPosition: cvData.natureOfPosition || "Junior"
        }));
        
        // Set CV file indicator
        setCvFile({ name: "Resume from CV History", fromHistory: true });
        
        setMessage({ type: "success", text: "CV parsed successfully! Review the details below." });
        
        // Move to step 3 (Review Details) - normal flow
        setCurrentStep(3);
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to parse CV from history" });
      }
    } catch (error) {
      console.error("Error parsing CV from history:", error);
      setMessage({ type: "error", text: "Error parsing CV. Please try again." });
    } finally {
      setParsing(false);
    }
  };

  const handleJobSelect = (job) => {
    console.log("Job selected:", job);
    setSelectedJob(job);
    setFormData(prev => ({
      ...prev,
      position: job.jobTitle,
      educationalQualification: job.minEducation,
    }));
    console.log("Moving to step 2");
    setCurrentStep(2);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Please upload a PDF or Word document" });
      return;
    }

    setCvFile(file);
    setParsing(true);
    setMessage({ type: "", text: "" });

    try {
      const token = getToken();
      const formDataToSend = new FormData();
      formDataToSend.append("cv", file);
      formDataToSend.append("jobTitle", selectedJob.jobTitle);
      formDataToSend.append("jobDescription", selectedJob.jobDescription);

      const res = await fetch(`${backendURL}/organization/parse-cv`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (res.ok) {
        const data = await res.json();
        console.log("CV parsed data:", data);
        setFormData(prev => ({
          ...prev,
          candidateName: data.candidateName || "",
          candidateEmail: data.candidateEmail || "",
          educationalQualification: data.educationalQualification || prev.educationalQualification,
          pastWorkExperienceYears: data.pastWorkExperienceYears || "",
          pastWorkExperienceField: data.pastWorkExperienceField || "",
          currentWorkExperienceYears: data.currentWorkExperienceYears || "",
          currentWorkExperienceField: data.currentWorkExperienceField || "",
          coreSkillSet: data.coreSkillSet || "",
          typeOfCompany: data.typeOfCompany || "",
          natureOfPosition: data.natureOfPosition || "Junior"
        }));
        setMessage({ type: "success", text: "CV parsed successfully! Review the details below." });
        console.log("Setting current step to 3");
        setCurrentStep(3);
        console.log("Current step set to:", 3);
      } else {
        const error = await res.json();
        console.error("CV parsing error:", error);
        setMessage({ type: "error", text: error.error || "Failed to parse CV" });
      }
    } catch (error) {
      console.error("Exception during CV upload:", error);
      setMessage({ type: "error", text: "Error parsing CV. Please try again." });
    } finally {
      setParsing(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.candidateName.trim()) errors.candidateName = "Candidate name is required";
    if (!formData.candidateEmail.trim()) errors.candidateEmail = "Email is required";
    if (!formData.position.trim()) errors.position = "Position is required";
    if (!formData.educationalQualification.trim()) errors.educationalQualification = "Educational qualification is required";
    
    if (formData.schedulingType === "specific") {
      if (!formData.specificDate) errors.specificDate = "Date is required";
      if (!formData.specificTime) errors.specificTime = "Time is required";
    } else {
      if (!formData.daysTimer) errors.daysTimer = "Number of days is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = getToken();
      const payload = { ...formData };

      let res;
      if (isEditMode && editInterview?._id) {
        // Update existing interview
        res = await fetch(`${backendURL}/organization/interviews/${editInterview._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new interview
        res = await fetch(`${backendURL}/organization/schedule-interview`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const data = await res.json();
        
        if (isEditMode) {
          setMessage({ type: "success", text: "Interview updated successfully!" });
          // Redirect back to interviews page after a short delay
          setTimeout(() => {
            navigate("/organization/dashboard/interviews");
          }, 1500);
        } else {
          console.log("Interview scheduled, credentials:", data.credentials);
          setCredentials(data.credentials);
          setShowCredentials(true);
          setMessage({ type: "success", text: "Interview scheduled successfully!" });
          fetchInterviewUsage();
        }
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || `Failed to ${isEditMode ? 'update' : 'schedule'} interview` });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Error ${isEditMode ? 'updating' : 'scheduling'} interview. Please try again.` });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: "Copied to clipboard!" });
  };

  return (
    <div className="org-scheduler-container fade-in">
      {/* Header */}
      <div className="scheduler-header">
        <div>
          <h1 className="scheduler-title">
            <HiOutlineSparkles className="title-icon" />
            {isEditMode ? "Edit Interview" : "Smart Interview Scheduler"}
          </h1>
          <p className="scheduler-subtitle">
            {isEditMode 
              ? "Update interview details and scheduling information" 
              : "Streamline your hiring process with AI-powered CV parsing and automated scheduling"
            }
          </p>
        </div>
        {interviewLimit > 0 && (
          <div className="scheduler-usage-box">
            <div className="scheduler-usage-header">
              <span className="scheduler-usage-label">Interview Usage</span>
              <span className={`scheduler-usage-count${interviewUsed >= interviewLimit ? " usage-exhausted" : ""}`}>
                {interviewUsed} / {interviewLimit}
              </span>
            </div>
            <div className="scheduler-usage-bar-bg">
              <div
                className={`scheduler-usage-bar-fill ${
                  interviewUsed >= interviewLimit ? "bar-danger" : interviewUsed / interviewLimit >= 0.8 ? "bar-warn" : "bar-ok"
                }`}
                style={{ width: `${Math.min(Math.round((interviewUsed / interviewLimit) * 100), 100)}%` }}
              />
            </div>
            {interviewUsed >= interviewLimit && (
              <p className="scheduler-usage-exhausted-msg">
                Limit reached. <button className="scheduler-upgrade-link" onClick={() => navigate("/organization/dashboard/manage-subscription")}>Upgrade plan</button> to schedule more.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <Card className="progress-card">
        <div className="progress-steps">
          {STEPS.map((step, index) => (
            <div key={step.number} className="progress-step-wrapper">
              <div 
                className={`progress-step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
              >
                <div className="step-number">
                  {currentStep > step.number ? (
                    <HiOutlineCheckCircle />
                  ) : (
                    <step.icon />
                  )}
                </div>
                <div className="step-info">
                  <span className="step-label">Step {step.number}</span>
                  <span className="step-title">{step.title}</span>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`step-connector ${currentStep > step.number ? 'completed' : ''}`} />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Messages */}
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.type === "success" ? <HiOutlineCheckCircle /> : <HiOutlineXCircle />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Step 1: Select Position */}
      {currentStep === 1 && (
        <Card className="step-card">
          <div className="step-header">
            <HiOutlineBriefcase className="step-icon" />
            <div>
              <h2>Select Job Position</h2>
              <p>Choose the position you're hiring for from your job master</p>
            </div>
          </div>

          {interviewLimit > 0 && interviewUsed >= interviewLimit ? (
            <div className="empty-state">
              <HiOutlineXCircle className="empty-icon" style={{ color: "#ef4444" }} />
              <h3>Interview Limit Reached</h3>
              <p>You've used all {interviewLimit} interviews on your {interviewTier.charAt(0).toUpperCase() + interviewTier.slice(1)} plan.</p>
              <Button onClick={() => navigate("/organization/dashboard/manage-subscription")}>
                Upgrade Plan
              </Button>
            </div>
          ) : loadingJobs ? (
            <div className="loading-state">
              <div className="spinner-border" role="status"></div>
              <p>Loading available positions...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <HiOutlineBriefcase className="empty-icon" />
              <h3>No Job Positions Available</h3>
              <p>Please create job positions in Job Master before scheduling interviews</p>
              <Button onClick={() => navigate("/organization/dashboard/job-master")}>
                Go to Job Master
              </Button>
            </div>
          ) : (
            <div className="jobs-grid">
              {jobs.map((job) => (
                <div 
                  key={job._id} 
                  className="job-card-wrapper"
                  onClick={() => handleJobSelect(job)}
                >
                  <Card className="job-card" hover>
                    <h3>{job.jobTitle}</h3>
                    <div className="job-meta">
                      <span className="meta-item">
                        <strong>Education:</strong> {job.minEducation}
                      </span>
                      <span className="meta-item">
                        <strong>Experience:</strong> {job.minExperience}
                      </span>
                      <span className="meta-item">
                        <strong>Location:</strong> {job.jobLocation}
                      </span>
                    </div>
                    <p className="job-description">{job.jobDescription.substring(0, 150)}...</p>
                    <div className="job-action">
                      <span className="select-badge">
                        Click to Select <HiOutlineArrowRight />
                      </span>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Upload CV */}
      {currentStep === 2 && (
        <Card className="step-card">
          <div className="step-header">
            <HiOutlineDocumentText className="step-icon" />
            <div>
              <h2>Upload Candidate's CV</h2>
              <p>Upload the candidate's resume to automatically extract their information</p>
            </div>
          </div>

          <div className="selected-job-info">
            <strong>Selected Position:</strong> {selectedJob?.jobTitle}
          </div>

          <div
            className={`cv-upload-zone ${dragActive ? 'drag-active' : ''} ${cvFile ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {parsing ? (
              <div className="parsing-state">
                <div className="spinner-border" role="status"></div>
                <HiOutlineSparkles className="sparkle-icon" />
                <h3>Analyzing CV with AI...</h3>
                <p>Extracting candidate information automatically</p>
              </div>
            ) : cvFile ? (
              <div className="file-uploaded">
                <HiOutlineCheckCircle className="success-icon" />
                <h3>{cvFile.name}</h3>
                <p>File uploaded successfully</p>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setCvFile(null);
                    setFormData(prev => ({
                      ...prev,
                      candidateName: "",
                      candidateEmail: "",
                      pastWorkExperienceYears: "",
                      pastWorkExperienceField: "",
                      currentWorkExperienceYears: "",
                      currentWorkExperienceField: "",
                      coreSkillSet: "",
                      typeOfCompany: ""
                    }));
                  }}
                >
                  Upload Different CV
                </Button>
              </div>
            ) : (
              <>
                <HiOutlineCloudArrowUp className="upload-icon" />
                <h3>Drag & Drop CV Here</h3>
                <p>or click to browse files</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <span className="file-types">Supported: PDF, DOC, DOCX</span>
              </>
            )}
          </div>

          <div className="step-actions">
            <Button variant="secondary" onClick={() => setCurrentStep(1)}>
              <HiOutlineArrowLeft /> Back
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Review Details */}
      {currentStep === 3 && (
        <Card className="step-card">
          <div className="step-header">
            <HiOutlineCheckCircle className="step-icon" />
            <div>
              <h2>Review Candidate Details</h2>
              <p>Verify and edit the auto-filled information extracted from the CV</p>
            </div>
          </div>

          <form className="review-form">
            <div className="form-section">
              <h3 className="section-title">Candidate Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <Input
                    label="Full Name *"
                    value={formData.candidateName}
                    onChange={(e) => handleFormChange("candidateName", e.target.value)}
                    error={formErrors.candidateName}
                    placeholder="Enter candidate's full name"
                  />
                </div>
                <div className="form-group">
                  <Input
                    label="Email Address *"
                    type="email"
                    value={formData.candidateEmail}
                    onChange={(e) => handleFormChange("candidateEmail", e.target.value)}
                    error={formErrors.candidateEmail}
                    placeholder="candidate@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Position Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <Input
                    label="Position *"
                    value={formData.position}
                    onChange={(e) => handleFormChange("position", e.target.value)}
                    error={formErrors.position}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nature of Position *</label>
                  <select
                    className="form-select"
                    value={formData.natureOfPosition}
                    onChange={(e) => handleFormChange("natureOfPosition", e.target.value)}
                  >
                    {NATURE_OF_POSITION.map(nature => (
                      <option key={nature} value={nature}>{nature}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.natureOfPosition === "Other" && (
                <div className="form-group">
                  <Input
                    label="Specify Nature of Position"
                    value={formData.customNatureOfPosition}
                    onChange={(e) => handleFormChange("customNatureOfPosition", e.target.value)}
                    placeholder="Enter custom position level"
                  />
                </div>
              )}
            </div>

            <div className="form-section">
              <h3 className="section-title">Qualifications & Experience</h3>
              <div className="form-group">
                <Input
                  label="Educational Qualification *"
                  value={formData.educationalQualification}
                  onChange={(e) => handleFormChange("educationalQualification", e.target.value)}
                  error={formErrors.educationalQualification}
                  placeholder="e.g., Bachelor's in Computer Science"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <Input
                    label="Past Work Experience (Years)"
                    value={formData.pastWorkExperienceYears}
                    onChange={(e) => handleFormChange("pastWorkExperienceYears", e.target.value)}
                    placeholder="e.g., 3"
                  />
                </div>
                <div className="form-group">
                  <Input
                    label="Past Work Field"
                    value={formData.pastWorkExperienceField}
                    onChange={(e) => handleFormChange("pastWorkExperienceField", e.target.value)}
                    placeholder="e.g., Software Development"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <Input
                    label="Current Work Experience (Years)"
                    value={formData.currentWorkExperienceYears}
                    onChange={(e) => handleFormChange("currentWorkExperienceYears", e.target.value)}
                    placeholder="e.g., 2"
                  />
                </div>
                <div className="form-group">
                  <Input
                    label="Current Work Field"
                    value={formData.currentWorkExperienceField}
                    onChange={(e) => handleFormChange("currentWorkExperienceField", e.target.value)}
                    placeholder="e.g., Full Stack Development"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <Input
                    label="Core Skill Set"
                    value={formData.coreSkillSet}
                    onChange={(e) => handleFormChange("coreSkillSet", e.target.value)}
                    placeholder="e.g., React, Node.js, Python"
                  />
                </div>
                <div className="form-group">
                  <Input
                    label="Type of Company"
                    value={formData.typeOfCompany}
                    onChange={(e) => handleFormChange("typeOfCompany", e.target.value)}
                    placeholder="e.g., Product-based, Service-based"
                  />
                </div>
              </div>
            </div>

            <div className="step-actions">
              <Button variant="secondary" onClick={() => setCurrentStep(2)}>
                <HiOutlineArrowLeft /> Back
              </Button>
              <Button variant="primary" onClick={() => setCurrentStep(4)}>
                Continue to Schedule <HiOutlineArrowRight />
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Step 4: Schedule Interview */}
      {currentStep === 4 && (
        <Card className="step-card">
          <div className="step-header">
            <HiOutlineCalendarDays className="step-icon" />
            <div>
              <h2>Schedule Interview</h2>
              <p>Set the interview date, time, and preferences</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="schedule-form">
            <div className="form-section">
              <h3 className="section-title">Interview Timing</h3>
              
              <div className="scheduling-type-selector">
                <label className="radio-card">
                  <input
                    type="radio"
                    name="schedulingType"
                    value="specific"
                    checked={formData.schedulingType === "specific"}
                    onChange={(e) => handleFormChange("schedulingType", e.target.value)}
                  />
                  <div className="radio-content">
                    <HiOutlineCalendarDays />
                    <div>
                      <strong>Specific Date & Time</strong>
                      <p>Schedule for a particular date and time</p>
                    </div>
                  </div>
                </label>

                <label className="radio-card">
                  <input
                    type="radio"
                    name="schedulingType"
                    value="timer"
                    checked={formData.schedulingType === "timer"}
                    onChange={(e) => handleFormChange("schedulingType", e.target.value)}
                  />
                  <div className="radio-content">
                    <HiOutlineClock />
                    <div>
                      <strong>Flexible Timer</strong>
                      <p>Candidate can schedule within X days</p>
                    </div>
                  </div>
                </label>
              </div>

              {formData.schedulingType === "specific" ? (
                <div className="form-row">
                  <div className="form-group">
                    <Input
                      label="Interview Date *"
                      type="date"
                      value={formData.specificDate}
                      onChange={(e) => handleFormChange("specificDate", e.target.value)}
                      error={formErrors.specificDate}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <Input
                      label="Interview Time *"
                      type="time"
                      value={formData.specificTime}
                      onChange={(e) => handleFormChange("specificTime", e.target.value)}
                      error={formErrors.specificTime}
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <Input
                    label="Number of Days *"
                    type="number"
                    value={formData.daysTimer}
                    onChange={(e) => handleFormChange("daysTimer", e.target.value)}
                    error={formErrors.daysTimer}
                    placeholder="e.g., 7"
                    min="1"
                  />
                  <small className="form-hint">
                    Candidate will receive a link to schedule within this timeframe
                  </small>
                </div>
              )}
            </div>

            <div className="form-section">
              <h3 className="section-title">Interview Configuration</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Interview Type *</label>
                  <select
                    className="form-select"
                    value={formData.interviewType}
                    onChange={(e) => handleFormChange("interviewType", e.target.value)}
                  >
                    {INTERVIEW_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (minutes) *</label>
                  <select
                    className="form-select"
                    value={formData.duration}
                    onChange={(e) => handleFormChange("duration", e.target.value)}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {credentials && (
              <Card className="credentials-card">
                <h3>
                  <HiOutlineCheckCircle /> Interview Scheduled Successfully!
                </h3>
                <p>Candidate credentials have been generated. Share these with the candidate:</p>
                <div className="credentials-info">
                  <div className="credential-item">
                    <strong>Username:</strong>
                    <span>{credentials.username}</span>
                    <button 
                      type="button"
                      className="copy-btn"
                      onClick={() => copyToClipboard(credentials.username)}
                    >
                      Copy
                    </button>
                  </div>
                  <div className="credential-item">
                    <strong>Password:</strong>
                    <span>{credentials.password}</span>
                    <button 
                      type="button"
                      className="copy-btn"
                      onClick={() => copyToClipboard(credentials.password)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </Card>
            )}

            <div className="step-actions">
              <Button variant="secondary" onClick={() => setCurrentStep(3)} disabled={loading}>
                <HiOutlineArrowLeft /> Back
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading 
                  ? (isEditMode ? "Updating..." : "Scheduling...") 
                  : (isEditMode ? "Update Interview" : "Schedule Interview")
                }
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Success Credentials Modal */}
      {showCredentials && credentials && (
        <div className="modal-overlay">
          <Card className="credentials-modal">
            <div className="modal-header-accent">
              <HiOutlineSparkles className="success-icon" />
              <h3>Interview Scheduled Successfully!</h3>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Share these secure credentials with the candidate to allow them access to the interview session.
              </p>

              <div className="credentials-list">
                {[
                  { label: "Username", val: credentials.username },
                  { label: "Password", val: credentials.password },
                  { label: "Email", val: credentials.email }
                ].map((item, i) => (
                  <div className="credential-row-item" key={i}>
                    <label className="credential-label">{item.label}</label>
                    <div className="credential-copy-field">
                      <code className="credential-value">{item.val}</code>
                      <button 
                        type="button"
                        onClick={() => copyToClipboard(item.val)} 
                        className="copy-icon-btn"
                      >
                        <HiOutlineClipboard />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <Button 
                  variant="primary"
                  onClick={() => {
                    const text = `Interview Login:\nUsername: ${credentials.username}\nPassword: ${credentials.password}\nEmail: ${credentials.email}`;
                    copyToClipboard(text);
                  }}
                >
                  Copy All Credentials
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setShowCredentials(false);
                    navigate("/organization/dashboard/interviews");
                  }}
                >
                  View All Interviews
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
