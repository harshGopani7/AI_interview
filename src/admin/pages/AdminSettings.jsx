import { useState, useEffect } from "react";
import { getToken } from "../../services/token";
import Card from "../../ui/Card";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import "../../components/organization-dashboard/pages/OrgSettings.css";
import { backendURL } from "../../pages/Home";

export default function AdminSettings() {
  const [adminData, setAdminData] = useState({
    name: "",
    email: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/admin/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setAdminData({
          name: data.name || "",
          email: data.email || ""
        });
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="org-settings-container">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="org-settings-container fade-in">
      <h2 className="dashboard-title mb-4">Admin Settings</h2>

      <Card className="p-4">
        <h3 className="mb-4">Account Information</h3>
        <div className="row g-3">
          <div className="col-md-6">
            <Input
              label="Full Name"
              value={adminData.name}
              disabled
            />
          </div>
          <div className="col-md-6">
            <Input
              label="Email Address"
              type="email"
              value={adminData.email}
              disabled
            />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-muted small">
            Contact system administrator to update account information.
          </p>
        </div>
      </Card>
    </div>
  );
}
