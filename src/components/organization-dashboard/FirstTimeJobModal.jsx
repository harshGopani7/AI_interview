import { useNavigate } from "react-router-dom";
import {
  HiOutlineBriefcase,
  HiOutlineRocketLaunch,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import "./FirstTimeJobModal.css";

export default function FirstTimeJobModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCreateJob = () => {
    onClose();
    navigate("/organization/dashboard/job-master");
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="first-time-modal-overlay" onClick={handleSkip}>
      <div className="first-time-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="first-time-modal-icon-wrapper">
          <HiOutlineBriefcase className="first-time-modal-icon" />
        </div>

        <h2 className="first-time-modal-title">Welcome to Your Dashboard!</h2>
        <p className="first-time-modal-subtitle">
          Before you can start conducting interviews and analyzing CVs, you need to create at least one job position.
        </p>

        <div className="first-time-modal-features">
          <div className="first-time-feature">
            <HiOutlineCheckCircle className="feature-icon" />
            <div>
              <h4>Define Job Requirements</h4>
              <p>Set education, experience, and location criteria</p>
            </div>
          </div>
          <div className="first-time-feature">
            <HiOutlineCheckCircle className="feature-icon" />
            <div>
              <h4>Conduct Targeted Interviews</h4>
              <p>Schedule interviews based on specific job positions</p>
            </div>
          </div>
          <div className="first-time-feature">
            <HiOutlineCheckCircle className="feature-icon" />
            <div>
              <h4>Analyze CVs Effectively</h4>
              <p>Screen resumes against job-specific requirements</p>
            </div>
          </div>
        </div>

        <div className="first-time-modal-actions">
          <button className="btn-skip" onClick={handleSkip}>
            Maybe Later
          </button>
          <button className="btn-create-job" onClick={handleCreateJob}>
            <HiOutlineRocketLaunch className="me-2" />
            Create Job Position
          </button>
        </div>
      </div>
    </div>
  );
}
