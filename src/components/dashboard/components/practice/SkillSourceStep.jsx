import { useState } from "react";
import Button from "../../../../ui/Button";
import { HiOutlineDocumentText, HiOutlinePencilSquare, HiOutlineCloudArrowUp } from "react-icons/hi2";

export default function SkillSourceStep({ data, onNext, onBack }) {
  const [sourceType, setSourceType] = useState(data.sourceType || "manual");
  const [content, setContent] = useState(data.content || "");

  const handleNext = () => {
    onNext({ sourceType, content });
  };

  return (
    <div className="step-fade-in">
      <div className="step-header mb-4">
        <h4 className="fw-bold">Skill Source</h4>
        <p className="text-muted small">Choose how the AI should identify relevant skills for your practice.</p>
      </div>

      {/* Source Selection Tiles */}
      <div className="source-picker-grid mb-5">
        <div 
          className={`source-tile ${sourceType === "job_description" ? "active" : ""}`}
          onClick={() => setSourceType("job_description")}
        >
          <div className="tile-icon"><HiOutlineDocumentText /></div>
          <div className="tile-info">
            <h5>Job Description</h5>
            <p>Paste text from a job posting</p>
          </div>
        </div>

        <div 
          className={`source-tile ${sourceType === "manual" ? "active" : ""}`}
          onClick={() => setSourceType("manual")}
        >
          <div className="tile-icon"><HiOutlinePencilSquare /></div>
          <div className="tile-info">
            <h5>Manual Selection</h5>
            <p>Pick skills from our database</p>
          </div>
        </div>

        <div 
          className={`source-tile ${sourceType === "resume" ? "active" : ""}`}
          onClick={() => setSourceType("resume")}
        >
          <div className="tile-icon"><HiOutlineCloudArrowUp /></div>
          <div className="tile-info">
            <h5>Upload Resume</h5>
            <p>Let AI extract skills from your CV</p>
          </div>
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div className="source-input-area mb-4">
        {sourceType === "job_description" && (
          <div className="fade-in">
            <label className="label-ui mb-2">Paste Job Description *</label>
            <textarea 
              className="input-ui" 
              rows="8" 
              placeholder="Paste the full job description text here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
        )}

        {sourceType === "resume" && (
          <div className="resume-upload-hint fade-in p-4 text-center border-dashed rounded-3">
             <HiOutlineCloudArrowUp className="display-4 text-muted mb-3" />
             <p className="mb-0">Please use the <strong>Resume Upload</strong> button on the next screen if you choose this option.</p>
             <span className="text-muted small">(Feature integration active)</span>
          </div>
        )}

        {sourceType === "manual" && (
          <div className="manual-hint fade-in p-4 bg-light rounded-3">
            <p className="mb-0 text-secondary">
              Great! In the next step, you'll be able to search and select specific technical and soft skills from our curated list.
            </p>
          </div>
        )}
      </div>

      <div className="step-footer mt-5 border-top pt-4 d-flex justify-content-between">
        <Button variant="secondary" onClick={onBack}>
          Back to Details
        </Button>
        <Button onClick={handleNext} disabled={sourceType === 'job_description' && !content}>
          Continue to Skill Selection
        </Button>
      </div>
    </div>
  );
}