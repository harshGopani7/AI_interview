import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../../services/token";
import { FaClock, FaCalendar, FaBriefcase, FaPlay, FaCheckCircle } from "react-icons/fa";
import { HiOutlineSparkles ,HiOutlineCalendarDays, HiOutlineChartBar, HiOutlineClipboardDocumentCheck, HiOutlineTrophy, HiOutlineClock, HiOutlineCommandLine } from "react-icons/hi2";
import "./ScheduledInterviews.css";
import Card from "../../../ui/Card";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { backendURL } from "../../../pages/Home";

export default function ScheduledInterviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [candidateData, setCandidateData] = useState(null);

  useEffect(() => {
    fetchScheduledInterviews();
  }, []);

  const fetchScheduledInterviews = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/candidate/scheduled-interviews`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      console.log(res)

      if (res.ok) {
        const data = await res.json();
        console.log(data)
        setInterviews(data.scheduledInterviews || []);
        // console.log(data)
        localStorage.setItem("scheduledInterviews", JSON.stringify(data.scheduledInterviews || []));
      }
    } catch (error) {
      console.error("Error fetching scheduled interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = (interview) => {
    // console.log(interview)
    navigate("/interview", {
      state: {
        //step-1
        candidateName: interview.candidateName,
        role: interview.position,
        natureOfRole: interview.natureOfPosition,
        educationalQualification: interview.educationalQualification,
        //step-2
        pastYearsExperience: interview.pastWorkExperienceYears,
        pastYearsExperienceField: interview.pastWorkExperienceField,
        currentYearExperience: interview.currentWorkExperienceYears,
        currentYearExperienceField: interview.currentWorkExperienceField,
        coreSkillSet: interview.coreSkillSet,
        typeOfCompany: interview.typeOfCompany,
        //step-3
        interviewType: interview.interviewType,
        duration: interview.duration,
        credentialId: interview.credentialId,
        scheduledInterviewId: interview._id,
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDeadline = (deadlineString) => {
    if (!deadlineString) return "N/A";
    const deadline = new Date(deadlineString);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day left";
    return `${diffDays} days left`;
  };

  if (loading) {
    return (
      <div className="scheduled-interviews">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your scheduled interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scheduled-interviews-container fade-in">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-end mb-5">
        <div>
          <h2 className="dashboard-title mb-1">HR Scheduled Sessions</h2>
          <p className="text-muted small">Interviews assigned to you by organizations</p>
        </div>
        <div className="status-legend d-none d-md-flex gap-3">
          <div className="legend-item"><span className="dot dot-pending"></span> Pending</div>
          <div className="legend-item"><span className="dot dot-completed"></span> Completed</div>
        </div>
      </div>

      {interviews.length === 0 ? (
        <Card className="text-center py-5 border-dashed">
          <div className="empty-state-content">
            <HiOutlineClipboardDocumentList className="display-1 text-muted opacity-25 mb-3" />
            <h3 className="text-muted">No Scheduled Interviews</h3>
            <p className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
              You don't have any pending assignments. Practice in the "Self Practice" 
              section to stay sharp!
            </p>
          </div>
        </Card>
      ) : (
        <div className="interviews-grid">
          {interviews.map((interview) => (
            <Card key={interview._id} className="scheduled-interview-card" hover>
              {/* Left Accent Bar based on completion */}
              <div className={`status-accent-bar ${interview.completed ? 'bg-success' : 'bg-warning'}`}></div>
              
              <div className="card-top-row d-flex justify-content-between align-items-start mb-4">
                <div className="role-info">
                  <h3 className="interview-position-title">{interview.position}</h3>
                  <div className="org-tag">
                    <HiOutlineSparkles className="me-1" />
                    {interview.organizationName || "Partner Organization"}
                  </div>
                </div>
                <span className={`badge-pill ${interview.completed ? 'pill-success' : 'pill-warning'}`}>
                  {interview.completed ? <HiOutlineClipboardDocumentCheck className="me-1" /> : <HiOutlineClock className="me-1" />}
                  {interview.completed ? "Completed" : "Pending"}
                </span>
              </div>

              <div className="interview-specs-grid">
                <div className="spec-item">
                  <HiOutlineCommandLine className="spec-icon" />
                  <div className="spec-content">
                    <label>Interview Type</label>
                    <span>{interview.interviewType}</span>
                  </div>
                </div>

                <div className="spec-item">
                  <HiOutlineClock className="spec-icon" />
                  <div className="spec-content">
                    <label>Duration</label>
                    <span>{interview.duration} Minutes</span>
                  </div>
                </div>

                {/* Conditional Timing Logic */}
                {interview.schedulingType === "specific" && interview.scheduledDate ? (
                  <div className="col-12 mt-2">
                    <div className="timing-box fixed-time">
                      <HiOutlineCalendarDays className="me-2" />
                      <span>{formatDate(interview.scheduledDate)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="col-12 mt-2">
                    <div className={`timing-box ${formatDeadline(interview.deadline) === 'Expired' ? 'expired' : 'deadline'}`}>
                      <HiOutlineClock className="me-2" />
                      <span>Deadline: {formatDeadline(interview.deadline)}</span>
                    </div>
                  </div>
                )}
              </div>

              {interview.notes && (
                <div className="notes-preview mt-3">
                  <p className="small text-muted mb-0">
                    <strong className="text-primary-dark">HR Note:</strong> {interview.notes}
                  </p>
                </div>
              )}

              <div className="card-footer-cta mt-4 pt-3 border-top">
                {!interview.completed ? (
                  <button
                    className="btn-start-session w-100"
                    onClick={() => handleStartInterview(interview)}
                  >
                    <FaPlay className="me-2 small" /> Launch Interview Environment
                  </button>
                ) : (
                  <button className="btn-completed-static w-100" disabled>
                    Session Finalized
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
