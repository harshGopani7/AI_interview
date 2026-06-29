import { useState } from "react";
import Input from "../../../../ui/Input";
import Button from "../../../../ui/Button";

export default function JobDetailsStep({ data, onNext }) {
  const [formData, setFormData] = useState({
    position: data.position || "",
    jobTitle: data.jobTitle || "",
    level: data.level || "Entry Level",
    interviewType: data.interviewType || "Technical",
    duration: data.duration || "30",
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    endDate: data.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="step-fade-in">
      <div className="step-header mb-4">
        <h4 className="fw-bold">Interview Context</h4>
        <p className="text-muted small">Tell the AI what role you are preparing for.</p>
      </div>

      <div className="row g-4">
        {/* Core Details */}
        <div className="col-md-6">
          <Input
            label="Target Position *"
            placeholder="e.g. Senior Frontend Engineer"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <Input
            label="Specific Job Title *"
            placeholder="e.g. React Developer"
            value={formData.jobTitle}
            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            required
          />
        </div>

        {/* Level and Type */}
        <div className="col-md-4">
          <div className="input-group-ui">
            <label className="label-ui">Experience Level *</label>
            <select
              className="input-ui"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              required
            >
              <option value="Internship">Internship</option>
              <option value="Entry Level">Entry Level</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior">Senior</option>
              <option value="Lead/Managerial">Lead / Managerial</option>
            </select>
          </div>
        </div>

        <div className="col-md-4">
          <div className="input-group-ui">
            <label className="label-ui">Interview Category *</label>
            <select
              className="input-ui"
              value={formData.interviewType}
              onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })}
              required
            >
              <option value="Technical">Technical Assessment</option>
              <option value="Behavioral">Behavioral / Culture Fit</option>
              <option value="Full Loop">Full Loop Mock</option>
            </select>
          </div>
        </div>

        <div className="col-md-4">
          <div className="input-group-ui">
            <label className="label-ui">Total Duration *</label>
            <select
              className="input-ui"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
            >
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="45">45 Minutes</option>
              <option value="60">60 Minutes</option>
            </select>
          </div>
        </div>

        {/* Schedule window for practice */}
        <div className="col-md-6">
          <Input
            label="Practice Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div className="col-md-6">
          <Input
            label="Practice End Date"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="step-footer mt-5 border-top pt-4 text-end">
        <Button type="submit" className="px-5">
          Continue to Skill Source
        </Button>
      </div>
    </form>
  );
}