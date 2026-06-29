import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaPlay, FaTrash, FaEdit } from "react-icons/fa";
import { HiOutlineCheckCircle, HiOutlineXMark, HiOutlineCommandLine } from "react-icons/hi2";
import Button from "../../../ui/Button";
import Card from "../../../ui/Card";

import { 
  createMockInterview, 
  listMockInterviews, 
  updateMockInterview, 
  deleteMockInterview 
} from "../../../services/api";
import JobDetailsStep from "../components/practice/JobDetailsStep";
import SkillSourceStep from "../components/practice/SkillSourceStep";
import SkillSelectionStep from "../components/practice/SkillSelectionStep";
import ReviewMockStep from "../components/practice/ReviewMockStep";
import "./Practice.css";

export default function Practice() {
  const navigate = useNavigate();
  const [view, setView] = useState("list"); // 'list' or 'create'
  const [currentStep, setCurrentStep] = useState(1);
  const [mockData, setMockData] = useState({
    jobDetails: {},
    skillSource: {},
    skills: {},
  });
  const [savedMocks, setSavedMocks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingMockId, setEditingMockId] = useState(null);

  // Load saved mocks from backend
  useEffect(() => {
    fetchMocks();
  }, []);

  const fetchMocks = async () => {
    try {
      const data = await listMockInterviews();
      setSavedMocks(data.mocks || []);
    } catch (error) {
      console.error("Error fetching mocks:", error);
      // Fallback to localStorage if backend fails
      const saved = localStorage.getItem("savedMocks");
      if (saved) {
        setSavedMocks(JSON.parse(saved));
      }
    }
  };

  const handleStepNext = (stepData, step) => {
    setMockData((prev) => ({
      ...prev,
      [step]: stepData,
    }));
    setCurrentStep((prev) => prev + 1);
  };

  const handleStepBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSaveMock = async () => {
    setSaving(true);
    
    try {
      if (editingMockId) {
        await updateMockInterview(editingMockId, mockData);
      } else {
        await createMockInterview(mockData);
      }
      
      // Refresh the mocks list
      await fetchMocks();
      
      setSaving(false);
      setView("list");
      setCurrentStep(1);
      setEditingMockId(null);
      setMockData({
        jobDetails: {},
        skillSource: {},
        skills: {},
      });
    } catch (error) {
      console.error("Error saving mock:", error);
      alert("Failed to save mock interview. Please try again.");
      setSaving(false);
    }
  };

  const handleStartInterview = (mock) => {
    navigate("/interview", { 
      state: {
        type: mock.jobDetails.interviewType,
        role: mock.jobDetails.position,
        level: mock.jobDetails.level,
        skills: mock.skills.selectedSkills,
        mockId: mock.id
      }
    });
  };

  const handleEditMock = (mock) => {
    setEditingMockId(mock.id);
    setMockData({
      jobDetails: mock.jobDetails,
      skillSource: mock.skillSource,
      skills: mock.skills,
    });
    setView("create");
    setCurrentStep(1);
  };

  const handleDeleteMock = async (mockId) => {
    if (window.confirm("Are you sure you want to delete this mock interview?")) {
      try {
        await deleteMockInterview(mockId);
        // Refresh the mocks list
        await fetchMocks();
      } catch (error) {
        console.error("Error deleting mock:", error);
        alert("Failed to delete mock interview. Please try again.");
      }
    }
  };

  

  const renderProgressBar = () => {
    const steps = [
      { number: 1, label: "Details" },
      { number: 2, label: "Source" },
      { number: 3, label: "Skills" },
      { number: 4, label: "Review" },
    ];

    return (
      <div className="practice-progress-container mb-5">
        <div className="progress-track-line"></div>
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          
          return (
            <div key={step.number} className="step-node-wrapper">
              <div className={`step-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}>
                <div className="node-circle">
                  {isCompleted ? <HiOutlineCheckCircle /> : step.number}
                </div>
                <span className="node-label">{step.label}</span>
              </div>
              {/* Connector line between nodes */}
              {index < steps.length - 1 && (
                <div className={`node-connector ${isCompleted ? 'filled' : ''}`}></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (view === "create") {
    return (
      <div className="practice-create-mode fade-in">
        {/* Creation Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="dashboard-title mb-0">
              {editingMockId ? "Update Your Mock" : "Configure New Practice Session"}
            </h2>
            <p className="text-muted small">Step {currentStep} of 4</p>
          </div>
          <button 
            className="btn-exit-creation"
            onClick={() => {
              setView("list");
              setCurrentStep(1);
              setEditingMockId(null);
            }}
          >
            <HiOutlineXMark className="me-2" /> Exit Editor
          </button>
        </div>

        {/* The Progress Bar we just built */}
        {renderProgressBar()}

        {/* Form Content Area */}
        <div className="practice-step-container">
          <Card className="p-0 overflow-hidden shadow-lg border-light">
            <div className="step-content-padding p-4 p-md-5">
              {currentStep === 1 && (
                <JobDetailsStep 
                  data={mockData.jobDetails} 
                  onNext={(data) => handleStepNext(data, "jobDetails")} 
                />
              )}
              {currentStep === 2 && (
                <SkillSourceStep 
                  data={mockData.skillSource} 
                  onNext={(data) => handleStepNext(data, "skillSource")} 
                  onBack={handleStepBack} 
                />
              )}
              {currentStep === 3 && (
                <SkillSelectionStep 
                  data={mockData.skills} 
                  onNext={(data) => handleStepNext(data, "skills")} 
                  onBack={handleStepBack} 
                />
              )}
              {currentStep === 4 && (
                <ReviewMockStep 
                  mockData={mockData} 
                  onSave={handleSaveMock} 
                  onBack={handleStepBack} 
                  saving={saving} 
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="practice-container fade-in">
      {/* Header Section */}
      <div className="practice-view-header d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
        <div>
          <h2 className="dashboard-title mb-1">Practice Interviews</h2>
          <p className="text-muted small mb-0">Design custom AI sessions to target your specific weak spots</p>
        </div>
        <Button onClick={() => setView("create")}>
          <FaPlus className="me-2" /> Create New Mock
        </Button>
      </div>

      {/* Main Content: List of Saved Mocks */}
      {savedMocks.length === 0 ? (
        <Card className="empty-practice-card text-center py-5">
          <div className="empty-state-visual">
            <div className="icon-circle-bg">
              <HiOutlineCommandLine />
            </div>
          </div>
          <h3 className="mt-4">Ready to level up?</h3>
          <p className="text-muted mx-auto mb-4" style={{ maxWidth: '420px' }}>
            You haven't created any custom mock interviews yet. Custom mocks allow 
            you to practice specific job roles and skill sets.
          </p>
          <Button onClick={() => setView("create")} variant="primary">
            Build Your First Mock
          </Button>
        </Card>
      ) : (
        <div className="mocks-grid-layout">
          {savedMocks.map((mock) => (
            <Card key={mock.id} className="mock-session-card" hover>
              <div className="mock-card-badge">Self Practice</div>
              
              <div className="mock-card-header mb-4">
                <h3 className="mock-title">{mock.jobDetails.position}</h3>
                <span className="mock-level-tag">{mock.jobDetails.level}</span>
              </div>

              <div className="mock-meta-info mb-4">
                <div className="meta-row">
                  <span className="meta-label">Interview Type</span>
                  <span className="meta-value">{mock.jobDetails.interviewType}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Duration</span>
                  <span className="meta-value">{mock.jobDetails.duration} Minutes</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Target Skills</span>
                  <span className="meta-value badge-pill-count">
                    {mock.skills.selectedSkills.length} Skills
                  </span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mock-card-footer pt-3 mt-3 border-top">
                <div className="d-flex gap-2">
                  <button 
                    className="btn-practice-start flex-grow-1" 
                    onClick={() => handleStartInterview(mock)}
                  >
                    <FaPlay className="me-2" /> Start Now
                  </button>
                  <button className="btn-practice-icon" onClick={() => handleEditMock(mock)} title="Edit Configuration">
                    <FaEdit />
                  </button>
                  <button className="btn-practice-icon btn-delete-accent" onClick={() => handleDeleteMock(mock.id)} title="Delete Mock">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
