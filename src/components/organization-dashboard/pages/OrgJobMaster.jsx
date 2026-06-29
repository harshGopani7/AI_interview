import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./OrgJobMaster.css";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import JobHistoryModal from "./JobHistoryModal";
import {
  HiOutlineBriefcase,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineMapPin,
  HiOutlineAcademicCap,
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineArrowUturnLeft,
  HiOutlineEye,
  HiOutlineAdjustmentsHorizontal
  // HiOutlineArrowUturnLeft,
} from "react-icons/hi2";
import {
  getJobPositions,
  createJobPosition,
  updateJobPosition,
  deleteJobPosition,
} from "../../../services/jobMasterApi";

const EDUCATION_OPTIONS = [
  "High School",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate (PhD)",
  "Professional Certification",
  "No Formal Education Required",
  "Other",
];

const EXPERIENCE_OPTIONS = [
  "0-1 years (Entry Level)",
  "1-3 years (Junior)",
  "3-5 years (Mid-Level)",
  "5-8 years (Senior)",
  "8-12 years (Lead)",
  "12+ years (Expert)",
];

const EDUCATION_FIELD_OPTIONS = [
  "Engineering",
  "Arts",
  "Commerce",
  "Science",
  "Medicine",
  "Law",
  "Management",
  "Computer Science / IT",
  "Design",
  "Education",
  "Any Field",
  "Other",
];

const INITIAL_FORM = {
  jobTitle: "",
  jobDescription: "",
  minEducation: "",
  customMinEducation: "",
  educationField: "",
  customEducationField: "",
  minExperience: "",
  otherRequirements: "",
  jobLocation: "",
};

export default function OrgJobMaster() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [educationFilter, setEducationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedJobForHistory, setSelectedJobForHistory] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getJobPositions();
      setJobs(data.jobs || []);
      setFilteredJobs(data.jobs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, educationFilter, experienceFilter]);

  const filterJobs = () => {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jobLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jobDescription.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Education filter
    if (educationFilter) {
      filtered = filtered.filter(job => job.minEducation === educationFilter);
    }

    // Experience filter
    if (experienceFilter) {
      filtered = filtered.filter(job => job.minExperience === experienceFilter);
    }

    setFilteredJobs(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setEducationFilter("");
    setExperienceFilter("");
  };

  const handleShowHistory = (job) => {
    setSelectedJobForHistory(job);
    setShowHistoryModal(true);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.jobTitle.trim()) errors.jobTitle = "Job title is required";
    if (!form.jobDescription.trim()) errors.jobDescription = "Job description is required";
    if (!form.minEducation) errors.minEducation = "Minimum education is required";
    if (form.minEducation === "Other" && !form.customMinEducation.trim()) {
      errors.customMinEducation = "Please specify the education level";
    }
    if (!form.educationField) errors.educationField = "Education field is required";
    if (form.educationField === "Other" && !form.customEducationField.trim()) {
      errors.customEducationField = "Please specify the education field";
    }
    if (!form.minExperience) errors.minExperience = "Minimum experience is required";
    if (!form.jobLocation.trim()) errors.jobLocation = "Job location is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError("");

    try {
      // Prepare data with custom values if "Other" is selected
      const submitData = {
        ...form,
        minEducation: form.minEducation === "Other" ? form.customMinEducation : form.minEducation,
        educationField: form.educationField === "Other" ? form.customEducationField : form.educationField,
      };

      if (editingJob) {
        await updateJobPosition(editingJob._id, submitData);
      } else {
        await createJobPosition(submitData);
      }
      await fetchJobs();
      handleCloseForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setForm({
      jobTitle: job.jobTitle,
      jobDescription: job.jobDescription,
      minEducation: job.minEducation,
      customMinEducation: job.customMinEducation || "",
      educationField: job.educationField || "",
      customEducationField: job.customEducationField || "",
      minExperience: job.minExperience,
      otherRequirements: job.otherRequirements || "",
      jobLocation: job.jobLocation,
    });
    setShowForm(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job position?")) return;

    setError("");
    try {
      await deleteJobPosition(jobId);
      await fetchJobs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingJob(null);
    setForm({ ...INITIAL_FORM });
    setFormErrors({});
  };

  if (loading) {
    return (
      <div className="job-master-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="job-master-container fade-in">
      <div className="job-master-header">
        <div>
          <h1 className="job-master-title">
            <HiOutlineBriefcase className="me-2" />
            Job Master
          </h1>
          <p className="job-master-subtitle">
            Manage job positions for interviews and CV analysis
          </p>
        </div>
        <div className="job-master-actions">
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedJobForHistory(null);
              setShowHistoryModal(true);
            }}
            disabled={jobs.length === 0}
            className="me-2"
          >
            <HiOutlineArrowUturnLeft className="me-2" />
            History
          </Button>
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            <HiOutlinePlus className="me-2" />
            Add New Job
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <HiOutlineXMark className="me-2" style={{ fontSize: "1.2rem" }} />
          <span>{error}</span>
        </div>
      )}

      {/* Job Form */}
      {showForm && (
        <Card className="job-form-card" >
          <div className="job-form-header" ref={formRef}>
            <h3 >{editingJob ? "Edit Job Position" : "Create New Job Position"}</h3>
            <button className="btn-close-form" onClick={handleCloseForm}>
              <HiOutlineXMark />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <Input
                  label="Job Title"
                  placeholder="e.g. Senior Software Engineer"
                  value={form.jobTitle}
                  onChange={(e) => handleFormChange("jobTitle", e.target.value)}
                  required
                />
                {formErrors.jobTitle && <div className="field-error">{formErrors.jobTitle}</div>}
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Minimum Experience</label>
                  <select
                    className="form-select"
                    value={form.minExperience}
                    onChange={(e) => handleFormChange("minExperience", e.target.value)}
                    required
                  >
                    <option value="">Select minimum experience</option>
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {formErrors.minExperience && <div className="field-error">{formErrors.minExperience}</div>}
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Minimum Education</label>
                  <select
                    className="form-select"
                    value={form.minEducation}
                    onChange={(e) => handleFormChange("minEducation", e.target.value)}
                    required
                  >
                    <option value="">Select minimum education</option>
                    {EDUCATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {formErrors.minEducation && <div className="field-error">{formErrors.minEducation}</div>}
                </div>
                {form.minEducation === "Other" && (
                  <div className="mt-2">
                    <Input
                      placeholder="Specify education level"
                      value={form.customMinEducation}
                      onChange={(e) => handleFormChange("customMinEducation", e.target.value)}
                      required
                    />
                    {formErrors.customMinEducation && <div className="field-error">{formErrors.customMinEducation}</div>}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Education Field</label>
                  <select
                    className="form-select"
                    value={form.educationField}
                    onChange={(e) => handleFormChange("educationField", e.target.value)}
                    required
                  >
                    <option value="">Select education field</option>
                    {EDUCATION_FIELD_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {formErrors.educationField && <div className="field-error">{formErrors.educationField}</div>}
                </div>
                {form.educationField === "Other" && (
                  <div className="mt-2">
                    <Input
                      placeholder="Specify education field"
                      value={form.customEducationField}
                      onChange={(e) => handleFormChange("customEducationField", e.target.value)}
                      required
                    />
                    {formErrors.customEducationField && <div className="field-error">{formErrors.customEducationField}</div>}
                  </div>
                )}
              </div>

              <div className="col-12">
                <div className="form-group">
                  <label className="form-label">Job Description</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Describe the role, responsibilities, and key requirements..."
                    value={form.jobDescription}
                    onChange={(e) => handleFormChange("jobDescription", e.target.value)}
                    required
                  />
                  {formErrors.jobDescription && <div className="field-error">{formErrors.jobDescription}</div>}
                </div>
              </div>

              <div className="col-12">
                <Input
                  label="Job Location"
                  placeholder="e.g. New York, Remote, Hybrid"
                  value={form.jobLocation}
                  onChange={(e) => handleFormChange("jobLocation", e.target.value)}
                  required
                />
                {formErrors.jobLocation && <div className="field-error">{formErrors.jobLocation}</div>}
              </div>

              <div className="col-12">
                <div className="form-group">
                  <label className="form-label">Other Requirements (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Any additional requirements, skills, or qualifications..."
                    value={form.otherRequirements}
                    onChange={(e) => handleFormChange("otherRequirements", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingJob ? "Update Job" : "Create Job"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search and Filters */}
      {jobs.length > 0 && (
        <Card className="job-filters-card mb-4">

          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <div className="form-group">
                <label className="form-label">
                  <HiOutlineMagnifyingGlass />
                  Search
                </label>
                <input
                  placeholder="Search by title, location, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label className="form-label">
                  <HiOutlineAcademicCap />
                  Education
                </label>
                <select
                  className="form-select"
                  value={educationFilter}
                  onChange={(e) => setEducationFilter(e.target.value)}
                >
                  <option value="">All Education Levels</option>
                  {EDUCATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label className="form-label">
                  <HiOutlineClock />
                  Experience
                </label>
                <select
                  className="form-select"
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                >
                  <option value="">All Experience Levels</option>
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-2">
              <Button
                variant="secondary"
                onClick={clearFilters}
                className="btn w-100"
              >
                <HiOutlineFunnel />
                Clear
              </Button>
            </div>
          </div>

          {/* Active Filter Tags */}
          {(searchTerm || educationFilter || experienceFilter) && (
            <div className="active-filters">
              {searchTerm && (
                <span className="filter-tag">
                  Search: "{searchTerm}"
                  <button
                    className="filter-tag-remove"
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    ×
                  </button>
                </span>
              )}
              {educationFilter && (
                <span className="filter-tag">
                  Education: {educationFilter}
                  <button
                    className="filter-tag-remove"
                    onClick={() => setEducationFilter('')}
                    title="Clear education filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {experienceFilter && (
                <span className="filter-tag">
                  Experience: {experienceFilter}
                  <button
                    className="filter-tag-remove"
                    onClick={() => setExperienceFilter('')}
                    title="Clear experience filter"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Job Table */}
      <div className="job-table-container">
        {jobs.length === 0 ? (
          <Card className="empty-state">
            <HiOutlineBriefcase className="empty-icon" />
            <h3>No Job Positions Yet</h3>
            <p>Create your first job position to start conducting interviews and analyzing CVs.</p>
            <Button onClick={() => setShowForm(true)} type="button" variant="primary">
              Create First Job
            </Button>
          </Card>
        ) : (
          <Card className="job-table-card">
            <div className="table-responsive">
              <table className="job-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Minimum Education</th>
                    <th>Experience</th>
                    <th>Location</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="no-results">
                          <HiOutlineFunnel className="no-results-icon" />
                          <p>No jobs found matching your filters</p>
                          <Button variant="secondary" onClick={clearFilters} size="sm">
                            Clear Filters
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr key={job._id}>
                        <td>
                          <div className="job-title-cell">
                            <strong>{job.jobTitle}</strong>
                            <small className="text-muted d-block">
                              {job.educationField && `Field: ${job.educationField}`}
                            </small>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {/* <HiOutlineAcademicCap className="me-1" /> */}
                            {job.minEducation}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-info text-white">
                            {/* <HiOutlineClock className="me-1" /> */}
                            {job.minExperience}
                          </span>
                        </td>
                        <td>
                          <span className="location-text">
                            {/* <HiOutlineMapPin className="me-1" /> */}
                            {job.jobLocation}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </small>
                        </td>
                        <td>
                          <div className="job-actions-cell">
                            <button
                              className="btn-icon btn-sm"
                              onClick={() => handleShowHistory(job)}
                              title="View History"
                            >
                              <HiOutlineEye />
                            </button>
                            <button
                              className="btn-icon btn-sm btn-secondary"
                              onClick={() => handleEdit(job)}
                              title="Edit"
                            >
                              <HiOutlinePencil />
                            </button>
                            <button
                              className="btn-icon btn-sm btn-danger"
                              onClick={() => handleDelete(job._id)}
                              title="Delete"
                            >
                              <HiOutlineTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredJobs.length > 0 && (
              <div className="table-footer">
                <small className="text-muted">
                  Showing {filteredJobs.length} of {jobs.length} job positions
                </small>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Job History Modal */}
      {showHistoryModal && (
        <JobHistoryModal
          job={selectedJobForHistory}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedJobForHistory(null);
          }}
        />
      )}
    </div>
  );
}
