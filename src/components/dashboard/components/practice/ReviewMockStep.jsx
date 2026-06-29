import { useState } from "react";
import { HiOutlineBriefcase, HiOutlineCalendarDays, HiOutlineDocumentText, HiOutlineCloudArrowUp, HiOutlineClipboardDocumentCheck, HiOutlineCheckCircle } from "react-icons/hi2";
import "./ReviewMockStep.css";

export default function ReviewMockStep({ mockData, onSave, onBack, saving }) {
  return (
    <div className="review-mock-container step-fade-in">
      <div className="step-header mb-4 d-flex justify-content-between align-items-start">
        <div>
          <h4 className="fw-bold mb-1">Final Review</h4>
          <p className="text-muted small">Double-check your configuration before the AI generates your session.</p>
        </div>
        <span className="badge-pill pill-info">Ready to Generate</span>
      </div>

      <div className="review-sections-stack">
        {/* Section 1: Role & Core Details */}
        <div className="review-card-sub mb-4">
          <div className="sub-card-header">
            <HiOutlineBriefcase className="header-icon" />
            <h5>Interview Context</h5>
          </div>
          <div className="review-data-grid">
            <div className="data-item">
              <label>Target Position</label>
              <span>{mockData.jobDetails.position}</span>
            </div>
            <div className="data-item">
              <label>Experience Level</label>
              <span>{mockData.jobDetails.level}</span>
            </div>
            <div className="data-item">
              <label>Session Type</label>
              <span>{mockData.jobDetails.interviewType}</span>
            </div>
            <div className="data-item">
              <label>Duration</label>
              <span className="text-accent-bold">{mockData.jobDetails.duration} Minutes</span>
            </div>
          </div>
        </div>

        {/* Section 2: Timeline */}
        <div className="review-card-sub mb-4">
          <div className="sub-card-header">
            <HiOutlineCalendarDays className="header-icon" />
            <h5>Practice Window</h5>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="data-item-inline">
                <label>Available From:</label>
                <span>{new Date(mockData.jobDetails.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="col-md-6">
              <div className="data-item-inline">
                <label>Expiry Date:</label>
                <span>{new Date(mockData.jobDetails.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Knowledge Source */}
        <div className="review-card-sub mb-4">
          <div className="sub-card-header">
            <HiOutlineDocumentText className="header-icon" />
            <h5>Knowledge Source</h5>
          </div>
          <div className="source-display p-3 bg-light rounded">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="small-label">Source Mode:</span>
              <span className="badge-pill pill-secondary text-capitalize">
                {mockData.skillSource.sourceType?.replace('-', ' ')}
              </span>
            </div>
            {mockData.skillSource.sourceType === "job-description" ? (
              <p className="description-text-preview">
                "{mockData.skillSource.jobDescription}"
              </p>
            ) : (
              <div className="resume-attached-indicator">
                <HiOutlineCloudArrowUp className="text-success" />
                <span>Resume document linked for AI parsing</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Target Skills */}
        <div className="review-card-sub mb-4">
          <div className="sub-card-header">
            <HiOutlineClipboardDocumentCheck className="header-icon" />
            <h5>Evaluated Skills ({mockData.skills.selectedSkills.length})</h5>
          </div>
          <div className="review-skills-tags">
            {mockData.skills.selectedSkills.map((skill) => (
              <span key={skill} className="final-skill-tag">
                <HiOutlineCheckCircle className="text-success me-1" /> {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="step-footer mt-5 border-top pt-4 d-flex justify-content-between">
        <button className="btn-ui btn-ui-secondary px-4" onClick={onBack} disabled={saving}>
          Back to Selection
        </button>
        <button 
          className={`btn-ui btn-ui-primary px-5 shadow-orange ${saving ? 'loading' : ''}`} 
          onClick={onSave} 
          disabled={saving}
        >
          {saving ? "Finalizing Session..." : "Confirm & Save Mock"}
        </button>
      </div>
    </div>
  );
}
