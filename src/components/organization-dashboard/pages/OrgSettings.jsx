import { useState, useEffect } from "react";
import { getToken } from "../../../services/token";
import Input from "../../../ui/Input";
import Button from "../../../ui/Button";
import Card from "../../../ui/Card";
import "./OrgOverview.css";
import { backendURL } from "../../../pages/Home";

export default function OrgSettings() {
  const [form, setForm] = useState({
    organizationName: "", contactPersonName: "", email: "", 
    phone: "", industry: "", companySize: "", website: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log(data)
        setForm({ ...data });
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/update-profile`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const data = await res.json();
        console.log(data)
        setMessage({ type: "success", text: "Profile updated successfully" });
      }
    } catch (error) { 
      console.error(error); 
      setMessage({ type: "error", text: "Failed to update profile" });
    } 
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="d-flex flex-column align-items-center justify-content-center p-5">
      <div className="spinner"></div>
      <p className="mt-3 text-muted">Loading your settings...</p>
    </div>
  );

  return (
    <div className="org-settings-container fade-in">
      <h2 className="dashboard-title mb-4">Organization Settings</h2>

      {message.text && (
        <div className={`alert-ui ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="settings-form">
          <h4 className="fw-bold mb-4">Organization Information</h4>

          <div className="row g-3">
            <div className="col-md-6">
              <Input label="Organization Name *" value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <Input label="Contact Person Name *" value={form.contactPersonName}
                onChange={(e) => setForm({ ...form, contactPersonName: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <Input label="Email Address" type="email" value={form.email} disabled />
              <small className="text-muted d-block mt-n2">Primary email is permanent</small>
            </div>
            <div className="col-md-6">
              <Input label="Phone Number *" type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <Input label="Industry *" value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <div className="input-group-ui">
                <label className="label-ui">Company Size *</label>
                <select className="input-ui" value={form.companySize}
                  onChange={(e) => setForm({ ...form, companySize: e.target.value })} required >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201+">200+ employees</option>
                </select>
              </div>
            </div>
            <div className="col-12">
              <Input label="Website" type="url" value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
            </div>
          </div>

          <div className="mt-4 border-top pt-4 text-end">
            <Button type="submit" className="px-5 py-2" disabled={saving}>
              {saving ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}