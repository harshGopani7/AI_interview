import { useState, useEffect } from "react";
import { getToken } from "../../../services/token";
import { useNavigate, useLocation } from "react-router-dom";
import "./ScheduleInterview.css";
import { HiOutlineClipboard ,HiOutlineSparkles,HiOutlineUserPlus  ,HiOutlinePencilSquare, HiOutlineDocumentText, HiOutlineCloudArrowUp, HiOutlineCalendarDays, HiOutlineClock } from "react-icons/hi2";
import Input from "../../../ui/Input";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import { backendURL } from "../../../pages/Home";
import UpgradeModal from "./UpgradeModal";
import { getSubscriptionStatus } from "../../../services/subscriptionApi";

export default function ScheduleInterview() {
  const navigate = useNavigate();
  const location = useLocation();
  const editInterview = location.state?.editInterview;
  const [scheduleType, setScheduleType] = useState("manual");
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [credentials, setCredentials] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [manualForm, setManualForm] = useState({
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
  const [resumeForm, setResumeForm] = useState({
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
  const [resumeFile, setResumeFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formErrors, setFormErrors] = useState({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [usageData, setUsageData] = useState({});

  useEffect(() => {
    fetchCandidates();
    fetchInterviewUsage();
    
    // Pre-populate form if editing
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
      
      setManualForm({
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
    }
  }, [editInterview]);

  const fetchInterviewUsage = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/interview-usage`, {
        headers: { "Authorization": `Bearer ${token}` }
      }); 
      if (res.ok) {
        const data = await res.json();
        console.log(data);
        setUsageData(data);
        if (!data.canSchedule && !editInterview) {
          setShowUpgradeModal(true);
        }
        if (data.currentCount >= data.maxAllowed && !editInterview) {
          setShowUpgradeModal(true);
        }
      }
    } catch (error) {
      console.error("Error fetching interview usage:", error);
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
        setCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleCandidateSelect = (e) => {
    const selectedEmail = e.target.value;
    if (selectedEmail) {
      const candidate = candidates.find(c => c.email === selectedEmail);
      if (candidate) {
        setManualForm({
          ...manualForm,
          candidateName: candidate.name,
          candidateEmail: candidate.email
        });
      }
    } else {
      setManualForm({
        ...manualForm,
        candidateName: "",
        candidateEmail: ""
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
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
      setResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const validateStep = (step) => {
    const errors = {};
    const form = scheduleType === "manual" ? manualForm : resumeForm;

    if (step === 1) {
      if (scheduleType === "manual") {
        if (!manualForm.candidateName.trim()) errors.candidateName = "Candidate name is required";
        else if (manualForm.candidateName.trim().length < 2) errors.candidateName = "Name must be at least 2 characters";
        else if (!/^[a-zA-Z\s.'-]+$/.test(manualForm.candidateName.trim())) errors.candidateName = "Name contains invalid characters";

        if (!manualForm.candidateEmail.trim()) errors.candidateEmail = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualForm.candidateEmail.trim())) errors.candidateEmail = "Enter a valid email address";
      }
      if (scheduleType === "resume" && !resumeFile) {
        errors.resumeFile = "Please upload a resume file";
      }

      if (!form.position.trim()) errors.position = "Position is required";
      else if (form.position.trim().length < 2) errors.position = "Position must be at least 2 characters";
      else if (form.position.trim().length > 100) errors.position = "Position must be under 100 characters";

      if (form.natureOfPosition === "Custom" && !form.customNatureOfPosition.trim()) {
        errors.customNatureOfPosition = "Custom position nature is required";
      }

      if (!form.educationalQualification.trim()) errors.educationalQualification = "Educational qualification is required";
      else if (form.educationalQualification.trim().length < 3) errors.educationalQualification = "Please provide a valid qualification";
    }

    if (step === 2) {
      if (!form.coreSkillSet.trim()) errors.coreSkillSet = "Core skill set is required";
      else if (form.coreSkillSet.trim().length < 3) errors.coreSkillSet = "Please provide at least one meaningful skill";
      else if (form.coreSkillSet.trim().length > 500) errors.coreSkillSet = "Skill set is too long (max 500 characters)";

      if (!form.typeOfCompany.trim()) errors.typeOfCompany = "Type of company is required";
      else if (form.typeOfCompany.trim().length < 2) errors.typeOfCompany = "Please provide a valid company type";

      const expYears = form.currentWorkExperienceYears;
      if (expYears !== "" && (isNaN(expYears) || Number(expYears) < 0 || Number(expYears) > 50)) {
        errors.currentWorkExperienceYears = "Experience must be 0-50 years";
      }
    }

    if (step === 3) {
      if (form.schedulingType === "specific") {
        if (!form.specificDate) errors.specificDate = "Date is required";
        else {
          const selected = new Date(form.specificDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selected < today) errors.specificDate = "Date cannot be in the past";
        }
        if (!form.specificTime) errors.specificTime = "Time is required";
      } else {
        if (!form.daysTimer) errors.daysTimer = "Deadline days is required";
        else if (isNaN(form.daysTimer) || Number(form.daysTimer) < 1 || Number(form.daysTimer) > 30) {
          errors.daysTimer = "Deadline must be between 1 and 30 days";
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(3)) return;

    if (!isEditMode && !usageData.canSchedule) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = getToken();
      const payload = {
        candidateName: manualForm.candidateName,
        candidateEmail: manualForm.candidateEmail,
        position: manualForm.position,
        natureOfPosition: manualForm.natureOfPosition === "Custom" ? manualForm.customNatureOfPosition : manualForm.natureOfPosition,
        educationalQualification: manualForm.educationalQualification,
        pastWorkExperienceYears: manualForm.pastWorkExperienceYears,
        pastWorkExperienceField: manualForm.pastWorkExperienceField,
        currentWorkExperienceYears: manualForm.currentWorkExperienceYears,
        currentWorkExperienceField: manualForm.currentWorkExperienceField,
        coreSkillSet: manualForm.coreSkillSet,
        typeOfCompany: manualForm.typeOfCompany,
        schedulingType: manualForm.schedulingType,
        specificDate: manualForm.schedulingType === "specific" ? manualForm.specificDate : null,
        specificTime: manualForm.schedulingType === "specific" ? manualForm.specificTime : null,
        daysTimer: manualForm.schedulingType === "timer" ? parseInt(manualForm.daysTimer) : null,
        interviewType: manualForm.interviewType,
        duration: parseInt(manualForm.duration)
      };
      console.log(payload);

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

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: isEditMode ? "Interview updated successfully!" : "Interview scheduled successfully!" });
        
        if (!isEditMode) {
          setCredentials(data.credentials);
          setShowCredentials(true);
        }
        
        setManualForm({
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
        setCurrentStep(1);
        setIsEditMode(false);
        fetchCandidates();
        
        // Navigate back to interviews page after edit
        if (isEditMode) {
          setTimeout(() => {
            navigate("/organization/dashboard/interviews");
          }, 1500);
        }
      } else {
        if (data.limitReached) {
          setShowUpgradeModal(true);
        }
        setMessage({ type: "error", text: data.error || `Failed to ${isEditMode ? 'update' : 'schedule'} interview` });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(3)) return;

    if (!usageData.canSchedule) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!resumeFile) {
      setMessage({ type: "error", text: "Please upload a resume" });
      setLoading(false);
      return;
    }

    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("position", resumeForm.position);
      formData.append("natureOfPosition", resumeForm.natureOfPosition === "Custom" ? resumeForm.customNatureOfPosition : resumeForm.natureOfPosition);
      formData.append("educationalQualification", resumeForm.educationalQualification);
      formData.append("pastWorkExperienceYears", resumeForm.pastWorkExperienceYears);
      formData.append("pastWorkExperienceField", resumeForm.pastWorkExperienceField);
      formData.append("currentWorkExperienceYears", resumeForm.currentWorkExperienceYears);
      formData.append("currentWorkExperienceField", resumeForm.currentWorkExperienceField);
      formData.append("coreSkillSet", resumeForm.coreSkillSet);
      formData.append("typeOfCompany", resumeForm.typeOfCompany);
      formData.append("schedulingType", resumeForm.schedulingType);
      formData.append("specificDate", resumeForm.schedulingType === "specific" ? resumeForm.specificDate : "");
      formData.append("specificTime", resumeForm.schedulingType === "specific" ? resumeForm.specificTime : "");
      formData.append("daysTimer", resumeForm.schedulingType === "timer" ? resumeForm.daysTimer : "");
      formData.append("interviewType", resumeForm.interviewType);
      formData.append("duration", resumeForm.duration);

      const res = await fetch(`${backendURL}/organization/schedule-interview-resume`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Interview scheduled successfully with resume!" });
        setCredentials(data.credentials);
        setShowCredentials(true);
        setResumeForm({
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
        setCurrentStep(1);
        setResumeFile(null);
        fetchCandidates();
      } else {
        if (data.limitReached) {
          setShowUpgradeModal(true);
        }
        setMessage({ type: "error", text: data.error || "Failed to schedule interview" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="schedule-interview-container fade-in">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title mb-1">{isEditMode ? "Edit Interview Session" : "Schedule New Session"}</h2>
          <p className="text-muted small">{isEditMode ? "Update interview details and configuration" : "Invite candidates to an AI-powered evaluation"}</p>
        </div>
        {candidates.length === 0 && !loadingCandidates && (
          <Button variant="secondary" onClick={() => navigate("/organization/dashboard/candidates")}>
            <HiOutlineUserPlus className="me-2" /> Add Candidate First
          </Button>
        )}
      </div>

      {/* Modern Tabs */}
      <div className="tabs-wrapper mb-4">
        <button
          className={`tab-item ${scheduleType === "manual" ? "active" : ""}`}
          onClick={() => setScheduleType("manual")}
        >
          <HiOutlinePencilSquare /> Manual Entry
        </button>
        <button
          className={`tab-item ${scheduleType === "resume" ? "active" : ""}`}
          onClick={() => setScheduleType("resume")}
        >
          <HiOutlineCloudArrowUp /> Upload Resume
        </button>
      </div>

      {message.text && (
        <div className={`alert-ui mb-4 ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={usageData.tier}
        currentCount={usageData.currentCount}
        maxAllowed={usageData.maxAllowed}
      />

      {/* Success Credentials Modal */}
      {showCredentials && credentials && (
        <div className="modal-overlay">
          <Card className="modal-content shadow-lg border-0 p-0 overflow-hidden">
            <div className="modal-header-accent bg-black text-white p-4 text-center">
              <HiOutlineSparkles className="display-4 mb-2" />
              <h3 className="fw-bold">Interview Scheduled!</h3>
            </div>
            <div className="p-4 modal-body bg-black">
              <p className="text-white  text-center mb-4">
                Share these secure credentials with the candidate to allow them access to the session.
              </p>

              <div className="credentials-list">
                {[
                  { label: "Username", val: credentials.username },
                  { label: "Password", val: credentials.password },
                  { label: "Email", val: credentials.email }
                ].map((item, i) => (
                  <div className="credential-row-item mb-2" key={i}>
                    <label className="small fw-bold text-white">{item.label}</label>
                    <div className="credential-copy-field">
                      <code>{item.val}</code>
                      <button onClick={() => copyToClipboard(item.val)} className="copy-btn">
                        <HiOutlineClipboard />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-flex gap-2 mt-4">
                <Button className="w-100" onClick={() => {
                  const text = `Interview Login:\nUser: ${credentials.username}\nPass: ${credentials.password}`;
                  copyToClipboard(text);
                }}>
                  Copy All
                </Button>
                <Button variant="secondary" onClick={() => setShowCredentials(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card>
        {/* Step Indicator */}
        <div className="step-indicator mb-5">
          <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-circle">1</div>
            <div className="step-label">Candidate Info</div>
          </div>
          <div className={`step-line ${currentStep > 1 ? 'completed' : ''}`}></div>
          <div className={`step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-circle">2</div>
            <div className="step-label">Experience & Skills</div>
          </div>
          <div className={`step-line ${currentStep > 2 ? 'completed' : ''}`}></div>
          <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <div className="step-label">Schedule Interview</div>
          </div>
        </div>

        <form onSubmit={scheduleType === "manual" ? handleManualSubmit : handleResumeSubmit}>
          {/* STEP 1: Candidate Information */}
          {currentStep === 1 && (
            <div className="step-content fade-in">
              <h4 className="fw-bold mb-4">Step 1: Candidate Information</h4>
              
              {Object.keys(formErrors).length > 0 && (
                <div className="alert-ui alert-error mb-4" style={{ fontSize: 13 }}>
                  Please fix the highlighted errors before proceeding.
                </div>
              )}

              {scheduleType === "resume" && (
                <div className="mb-5">
                  <h5 className="fw-bold mb-3">Upload Candidate Resume</h5>
                  <div
                    className={`file-upload-area ${dragActive ? "drag-over" : ""} ${resumeFile ? "has-file" : ""}`}
                    style={formErrors.resumeFile ? { borderColor: "var(--error)" } : {}}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("resume-upload").click()}
                  >
                    <HiOutlineDocumentText className="upload-icon-large" />
                    {resumeFile ? (
                      <div className="text-center">
                        <p className="mb-0 fw-bold">{resumeFile.name}</p>
                        <span className="small text-muted">{(resumeFile.size / 1024).toFixed(2)} KB</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="mb-0 fw-bold">Click or drag resume here</p>
                        <span className="small text-muted">PDF, DOC, DOCX up to 5MB</span>
                      </div>
                    )}
                    <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} hidden />
                  </div>
                  {formErrors.resumeFile && <div className="text-danger small mt-1">{formErrors.resumeFile}</div>}
                </div>
              )}

              {scheduleType === "manual" && (
                <div className="row g-3">
                  {candidates.length > 0 && (
                    <div className="col-12 mb-2">
                      <div className="input-group-ui">
                        <label className="label-ui">Quick Select (Existing Candidate)</label>
                        <select className="input-ui select-special" onChange={handleCandidateSelect} defaultValue="">
                          <option value="">-- Or type new details below --</option>
                          {candidates.map((c) => (
                            <option key={c._id} value={c.email}>{c.name} ({c.email})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="col-md-6">
                    <Input
                      label="Candidate Full Name *"
                      placeholder="e.g. Jane Cooper"
                      value={manualForm.candidateName}
                      onChange={(e) => setManualForm({ ...manualForm, candidateName: e.target.value })}
                      required
                    />
                    {formErrors.candidateName && <div className="text-danger small mt-1">{formErrors.candidateName}</div>}
                  </div>
                  <div className="col-md-6">
                    <Input
                      label="Candidate Email Address *"
                      type="email"
                      placeholder="jane.c@example.com"
                      value={manualForm.candidateEmail}
                      onChange={(e) => setManualForm({ ...manualForm, candidateEmail: e.target.value })}
                      required
                    />
                    {formErrors.candidateEmail && <div className="text-danger small mt-1">{formErrors.candidateEmail}</div>}
                  </div>
                </div>
              )}

              <div className="row g-3 mt-3">
                <div className="col-md-6">
                  <Input
                    label="Target Position *"
                    value={scheduleType === "manual" ? manualForm.position : resumeForm.position}
                    onChange={(e) => {
                      const val = e.target.value;
                      scheduleType === "manual"
                        ? setManualForm({ ...manualForm, position: val })
                        : setResumeForm({ ...resumeForm, position: val })
                    }}
                    placeholder="e.g. Senior React Developer"
                    required
                  />
                  {formErrors.position && <div className="text-danger small mt-1">{formErrors.position}</div>}
                </div>

                <div className="col-md-6">
                  <div className="input-group-ui">
                    <label className="label-ui">Nature of Position *</label>
                    <select
                      className="input-ui"
                      value={scheduleType === "manual" ? manualForm.natureOfPosition : resumeForm.natureOfPosition}
                      onChange={(e) => {
                        const val = e.target.value;
                        scheduleType === "manual"
                          ? setManualForm({ ...manualForm, natureOfPosition: val })
                          : setResumeForm({ ...resumeForm, natureOfPosition: val })
                      }}
                      required
                    >
                      <option value="Junior">Junior</option>
                      <option value="Middle">Middle</option>
                      <option value="Officer">Officer</option>
                      <option value="Functional Executive">Functional Executive</option>
                      <option value="Management">Management</option>
                      <option value="Top Management">Top Management</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>

                {(scheduleType === "manual" ? manualForm.natureOfPosition : resumeForm.natureOfPosition) === "Custom" && (
                  <div className="col-12">
                    <Input
                      label="Custom Nature of Position *"
                      value={scheduleType === "manual" ? manualForm.customNatureOfPosition : resumeForm.customNatureOfPosition}
                      onChange={(e) => {
                        const val = e.target.value;
                        scheduleType === "manual"
                          ? setManualForm({ ...manualForm, customNatureOfPosition: val })
                          : setResumeForm({ ...resumeForm, customNatureOfPosition: val })
                      }}
                      placeholder="Enter custom position nature"
                      required
                    />
                    {formErrors.customNatureOfPosition && <div className="text-danger small mt-1">{formErrors.customNatureOfPosition}</div>}
                  </div>
                )}

                <div className="col-12">
                  <Input
                    label="Educational Qualification *"
                    value={scheduleType === "manual" ? manualForm.educationalQualification : resumeForm.educationalQualification}
                    onChange={(e) => {
                      const val = e.target.value;
                      scheduleType === "manual"
                        ? setManualForm({ ...manualForm, educationalQualification: val })
                        : setResumeForm({ ...resumeForm, educationalQualification: val })
                    }}
                    placeholder="e.g. Bachelor's in Computer Science"
                    required
                  />
                  {formErrors.educationalQualification && <div className="text-danger small mt-1">{formErrors.educationalQualification}</div>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Experience & Skills */}
          {currentStep === 2 && (
            <div className="step-content fade-in">
              <h4 className="fw-bold mb-4">Step 2: Experience & Skills</h4>
              
              <div className="row g-3">
                {/* <div className="col-12">
                  <h5 className="fw-bold mb-3">Past Work Experience</h5>
                </div>
                <div className="col-md-6">
                  <Input
                    label="Years of Experience"
                    type="number"
                    min="0"
                    value={scheduleType === "manual" ? manualForm.pastWorkExperienceYears : resumeForm.pastWorkExperienceYears}
                    onChange={(e) => {
                      const val = e.target.value;
                      scheduleType === "manual"
                        ? setManualForm({ ...manualForm, pastWorkExperienceYears: val })
                        : setResumeForm({ ...resumeForm, pastWorkExperienceYears: val })
                    }}
                    placeholder="e.g. 3"
                  />
                </div>
                <div className="col-md-6">
                  <Input
                    label="Field/Domain"
                    value={scheduleType === "manual" ? manualForm.pastWorkExperienceField : resumeForm.pastWorkExperienceField}
                    onChange={(e) => {
                      const val = e.target.value;
                      scheduleType === "manual"
                        ? setManualForm({ ...manualForm, pastWorkExperienceField: val })
                        : setResumeForm({ ...resumeForm, pastWorkExperienceField: val })
                    }}
                    placeholder="e.g. Web Development"
                  />
                </div> */}

                <div className="col-12 mt-4">
                  <h5 className="fw-bold mb-3">Current Work Experience</h5>
                </div>
                <div className="col-md-6">
                  <Input
                    label="Years of Experience"
                    type="number"
                    min="0"
                    value={scheduleType === "manual" ? manualForm.currentWorkExperienceYears : resumeForm.currentWorkExperienceYears}
                    onChange={(e) => {
                      const val = e.target.value;
                      scheduleType === "manual"
                        ? setManualForm({ ...manualForm, currentWorkExperienceYears: val })
                        : setResumeForm({ ...resumeForm, currentWorkExperienceYears: val })
                    }}
                    placeholder="e.g. 2"
                  />
                  {formErrors.currentWorkExperienceYears && <div className="text-danger small mt-1">{formErrors.currentWorkExperienceYears}</div>}
                </div>
                <div className="col-md-6">
                  <Input
                    label="Field/Domain"
                    value={scheduleType === "manual" ? manualForm.currentWorkExperienceField : resumeForm.currentWorkExperienceField}
                    onChange={(e) => {
                      const val = e.target.value;
                      scheduleType === "manual"
                        ? setManualForm({ ...manualForm, currentWorkExperienceField: val })
                        : setResumeForm({ ...resumeForm, currentWorkExperienceField: val })
                    }}
                    placeholder="e.g. Full Stack Development"
                  />
                </div>

                <div className="col-12 mt-4">
                  <Input
                    label="Core Skill Set *"
                    value={scheduleType === "manual" ? manualForm.coreSkillSet : resumeForm.coreSkillSet}
                    onChange={(e) => {
                      const val = e.target.value;
                      scheduleType === "manual"
                        ? setManualForm({ ...manualForm, coreSkillSet: val })
                        : setResumeForm({ ...resumeForm, coreSkillSet: val })
                    }}
                    placeholder="e.g. React, Node.js, MongoDB, AWS"
                    required
                  />
                  {formErrors.coreSkillSet && <div className="text-danger small mt-1">{formErrors.coreSkillSet}</div>}
                </div>

                <div className="col-12">
                  <Input
                    label="Type of Company *"
                    value={scheduleType === "manual" ? manualForm.typeOfCompany : resumeForm.typeOfCompany}
                    onChange={(e) => {
                      const val = e.target.value;
                      scheduleType === "manual"
                        ? setManualForm({ ...manualForm, typeOfCompany: val })
                        : setResumeForm({ ...resumeForm, typeOfCompany: val })
                    }}
                    placeholder="e.g. Tech Startup, Enterprise, Consulting"
                    required
                  />
                  {formErrors.typeOfCompany && <div className="text-danger small mt-1">{formErrors.typeOfCompany}</div>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Schedule Interview */}
          {currentStep === 3 && (
            <div className="step-content fade-in">
              <h4 className="fw-bold mb-4">Step 3: Schedule Interview</h4>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="input-group-ui">
                    <label className="label-ui">Interview Type *</label>
                    <select
                      className="input-ui"
                      value={scheduleType === "manual" ? manualForm.interviewType : resumeForm.interviewType}
                      onChange={(e) => {
                        const val = e.target.value;
                        scheduleType === "manual"
                          ? setManualForm({ ...manualForm, interviewType: val })
                          : setResumeForm({ ...resumeForm, interviewType: val })
                      }}
                      required
                    >
                      <option value="technical">Technical Assessment</option>
                      <option value="behavioral">Behavioral Round</option>
                      <option value="hr">Culture Fit / HR</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="input-group-ui">
                    <label className="label-ui">Total Duration *</label>
                    <select
                      className="input-ui"
                      value={scheduleType === "manual" ? manualForm.duration : resumeForm.duration}
                      onChange={(e) => {
                        const val = e.target.value;
                        scheduleType === "manual"
                          ? setManualForm({ ...manualForm, duration: val })
                          : setResumeForm({ ...resumeForm, duration: val })
                      }}
                      required
                    > 
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">60 Minutes</option>
                    </select>
                  </div>
                </div>

                <div className="col-12 mt-4">
                  <label className="label-ui mb-3">When should this interview happen? *</label>
                  <div className="scheduling-type-toggle">
                    <label className={`toggle-option ${(scheduleType === "manual" ? manualForm.schedulingType : resumeForm.schedulingType) === "specific" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        value="specific"
                        checked={(scheduleType === "manual" ? manualForm.schedulingType : resumeForm.schedulingType) === "specific"}
                        onChange={(e) => {
                          const val = e.target.value;
                          scheduleType === "manual"
                            ? setManualForm({ ...manualForm, schedulingType: val })
                            : setResumeForm({ ...resumeForm, schedulingType: val })
                        }}
                        hidden
                      />
                      <HiOutlineCalendarDays className="me-2" /> Specific Date & Time
                    </label>

                    <label className={`toggle-option ${(scheduleType === "manual" ? manualForm.schedulingType : resumeForm.schedulingType) === "timer" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        value="timer"
                        checked={(scheduleType === "manual" ? manualForm.schedulingType : resumeForm.schedulingType) === "timer"}
                        onChange={(e) => {
                          const val = e.target.value;
                          scheduleType === "manual"
                            ? setManualForm({ ...manualForm, schedulingType: val })
                            : setResumeForm({ ...resumeForm, schedulingType: val })
                        }}
                        hidden
                      />
                      <HiOutlineClock className="me-2" /> Dynamic Timer (Deadline)
                    </label>
                  </div>
                </div>

                {(scheduleType === "manual" ? manualForm.schedulingType : resumeForm.schedulingType) === "specific" ? (
                  <div className="col-12 fade-in">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <Input
                          label="Session Date *"
                          type="date"
                          value={scheduleType === "manual" ? manualForm.specificDate : resumeForm.specificDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            scheduleType === "manual"
                              ? setManualForm({ ...manualForm, specificDate: val })
                              : setResumeForm({ ...resumeForm, specificDate: val })
                          }}
                          required
                        />
                        {formErrors.specificDate && <div className="text-danger small mt-1">{formErrors.specificDate}</div>}
                      </div>
                      <div className="col-md-6">
                        <Input
                          label="Start Time *"
                          type="time"
                          value={scheduleType === "manual" ? manualForm.specificTime : resumeForm.specificTime}
                          onChange={(e) => {
                            const val = e.target.value;
                            scheduleType === "manual"
                              ? setManualForm({ ...manualForm, specificTime: val })
                              : setResumeForm({ ...resumeForm, specificTime: val })
                          }}
                          required
                        />
                        {formErrors.specificTime && <div className="text-danger small mt-1">{formErrors.specificTime}</div>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="col-12 fade-in">
                    <Input
                      label="Deadline (Number of Days) *"
                      type="number"
                      min="1"
                      max="30"
                      placeholder="e.g. 3"
                      value={scheduleType === "manual" ? manualForm.daysTimer : resumeForm.daysTimer}
                      onChange={(e) => {
                        const val = e.target.value;
                        scheduleType === "manual"
                          ? setManualForm({ ...manualForm, daysTimer: val })
                          : setResumeForm({ ...resumeForm, daysTimer: val })
                      }}
                      required
                    />
                    {formErrors.daysTimer && <div className="text-danger small mt-1">{formErrors.daysTimer}</div>}
                    <small className="text-muted mt-n2 d-block">The candidate must complete the session within this window after receiving the invite.</small>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-5 border-top pt-4 d-flex justify-content-between">
            <div>
              {currentStep > 1 && (
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-3"
                >
                  Previous
                </Button>
              )}
            </div>
            <div>
              {isEditMode && currentStep === 1 && (
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => navigate("/organization/dashboard/interviews")}
                  className="px-4 py-3 me-2"
                >
                  Cancel
                </Button>
              )}
              {currentStep < 3 ? (
                <Button 
                  type="button" 
                  onClick={handleNextStep}
                  className="px-5 py-3 shadow-sm"
                >
                  Next Step
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="px-5 py-3 shadow-sm">
                  {loading ? (isEditMode ? "Updating..." : "Scheduling Session...") : (isEditMode ? "Update Interview" : "Confirm & Send Invitation")}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
