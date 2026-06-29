import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../../components/auth/AuthCard";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import { signupUser } from "../../services/authApi";
import "./Signup.css";
import { FaArrowLeft, FaBuilding, FaFileAlt, FaLayerGroup } from "react-icons/fa";

// Service type constants
const SERVICE_CV_ONLY = "cv_only";
const SERVICE_CV_INTERVIEW = "cv_interview";

export default function Signup() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  // "cv_only" → Basic plan only | "cv_interview" → Gold/Platinum plans
  const [serviceType, setServiceType] = useState(null);
  const [candidateForm, setCandidateForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [organizationForm, setOrganizationForm] = useState({
    organizationName: "",
    contactPersonName: "",
    email: "",
    password: "",
    phone: "",
    industry: "",
    companySize: "",
    website: "",
  });
  const [error, setError] = useState("");

  const handleCandidateSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await signupUser({ ...candidateForm, role: "candidate" });
    if (res.error) { setError(res.error); return; }
    navigate("/login");
  };

  const handleOrganizationSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await signupUser({ ...organizationForm, role: "organization", serviceType });
    if (res.error) { setError(res.error); return; }
    navigate("/subscribe", {
      state: { email: organizationForm.email, serviceType },
    });
  };

  // ── Step 1: Role Selection ──
  if (!selectedRole) {
    return (
      <div className="auth-page-wrapper">
        <AuthCard
          title="Create Account"
          subtitle="Choose how you want to use the platform"
        >
          <div className="role-selection-grid">
            <button className="role-tile" onClick={() => setSelectedRole("organization")}>
              <div className="role-tile-icon"><FaBuilding /></div>
              <div className="role-tile-content">
                <h4>Organization</h4>
                <p>Hire faster with automated screening</p>
              </div>
            </button>
          </div>
          <div className="auth-footer text-center mt-4">
            Already have an account? <a href="/login" className="brand-link">Sign in</a>
          </div>
        </AuthCard>
      </div>
    );
  }

  // ── Step 2: Service Type Selection (organization only) ──
  if (selectedRole === "organization" && !serviceType) {
    return (
      <div className="auth-page-wrapper">
        <AuthCard
          title="What do you need?"
          subtitle="Select the service that fits your hiring workflow"
        >
          <button className="back-link-btn" onClick={() => setSelectedRole(null)} type="button">
            <FaArrowLeft /> Back
          </button>

          <div className="service-selection-grid">
            {/* CV Analysis only */}
            <button
              className="service-tile"
              onClick={() => setServiceType(SERVICE_CV_ONLY)}
            >
              <div className="service-tile-icon service-tile-icon--cv">
                <FaFileAlt />
              </div>
              <div className="service-tile-content">
                <h4>CV Analysis</h4>
                <p>AI-powered resume screening and candidate ranking</p>
                <span className="service-tile-plan">Basic Plan</span>
              </div>
            </button>

            {/* CV Analysis + Interview */}
            <button
              className="service-tile service-tile--featured"
              onClick={() => setServiceType(SERVICE_CV_INTERVIEW)}
            >
              <div className="service-tile-icon service-tile-icon--both">
                <FaLayerGroup />
              </div>
              <div className="service-tile-content">
                <h4>CV Analysis + Interview</h4>
                <p>Full hiring suite — screening, AI interviews &amp; scoring</p>
                <span className="service-tile-plan">Gold &amp; Platinum Plans</span>
              </div>
              <span className="service-tile-badge">Recommended</span>
            </button>
          </div>

          <div className="auth-footer text-center mt-4">
            Already have an account? <a href="/login" className="brand-link">Sign in</a>
          </div>
        </AuthCard>
      </div>
    );
  }

  // ── Step 3: Organization Registration Form ──
  return (
    <div className="auth-page-wrapper">
      <AuthCard
        title="Register Organization"
        subtitle="Fill in your details to get started"
        className="auth-card-wide"
      >
        <button
          className="back-link-btn"
          onClick={() => setServiceType(null)}
          type="button"
        >
          <FaArrowLeft /> Back to service selection
        </button>

        {/* Service type indicator */}
        <div className="service-type-indicator">
          {serviceType === SERVICE_CV_ONLY ? (
            <><FaFileAlt className="sti-icon" /> CV Analysis — Basic Plan</>
          ) : (
            <><FaLayerGroup className="sti-icon" /> CV Analysis + Interview — Gold / Platinum</>
          )}
        </div>

        {/* ORGANIZATION FORM */}
        <form className="auth-form-container" onSubmit={handleOrganizationSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <Input
                label="Organization Name"
                placeholder="Company Inc."
                value={organizationForm.organizationName}
                onChange={(e) => setOrganizationForm({ ...organizationForm, organizationName: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <Input
                label="Contact Person"
                placeholder="HR Manager Name"
                value={organizationForm.contactPersonName}
                onChange={(e) => setOrganizationForm({ ...organizationForm, contactPersonName: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <Input
                label="Work Email"
                type="email"
                placeholder="hr@company.com"
                value={organizationForm.email}
                onChange={(e) => setOrganizationForm({ ...organizationForm, email: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="Company phone"
                value={organizationForm.phone}
                onChange={(e) => setOrganizationForm({ ...organizationForm, phone: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <Input
                label="Industry"
                placeholder="e.g. Technology"
                value={organizationForm.industry}
                onChange={(e) => setOrganizationForm({ ...organizationForm, industry: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <div className="input-group-ui">
                <label className="label-ui">Company Size</label>
                <select
                  className="input-ui select-ui"
                  value={organizationForm.companySize}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, companySize: e.target.value })}
                  required
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="200+">200+</option>
                </select>
              </div>
            </div>
            <div className="col-12">
              <Input
                label="Website (Optional)"
                type="url"
                placeholder="https://company.com"
                value={organizationForm.website}
                onChange={(e) => setOrganizationForm({ ...organizationForm, website: e.target.value })}
              />
            </div>
            <div className="col-12">
              <Input
                label="Password"
                type="password"
                placeholder="Set account password"
                value={organizationForm.password}
                onChange={(e) => setOrganizationForm({ ...organizationForm, password: e.target.value })}
                required
              />
            </div>
          </div>

          {error && <div className="auth-error-message mt-2">{error}</div>}

          <Button type="submit" className="w-100 py-3 mt-4">Register Organization</Button>
        </form>

        <div className="auth-footer mt-4">
          Already have an account? <a href="/login" className="brand-link">Sign in</a>
        </div>
      </AuthCard>
    </div>
  );
}