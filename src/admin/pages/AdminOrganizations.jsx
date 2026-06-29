import { useState, useEffect } from "react";
import { getToken } from "../../services/token";
import Card from "../../ui/Card";
import { HiOutlineBuildingOffice } from "react-icons/hi2";
import "../../components/organization-dashboard/pages/OrgCandidates.css";
import { backendURL } from "../../pages/Home";

export default function AdminOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/admin/organizations`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="org-candidates-container">
        <h2>Organizations</h2>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="org-candidates-container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title mb-1">Organizations Directory</h2>
          <p className="text-muted small">Manage all registered organizations</p>
        </div>
      </div>

      {organizations.length === 0 ? (
        <Card className="text-center py-5">
          <div className="empty-state">
            <HiOutlineBuildingOffice className="display-1 text-muted opacity-25 mb-3" />
            <h4 className="text-muted">No organizations registered yet</h4>
            <p className="text-muted small">Organizations will appear here once they sign up.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden border-light shadow-sm">
          <div className="table-responsive">
            <table className="table custom-dashboard-table mb-0">
              <thead>
                <tr>
                  <th>Organization Name</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Industry</th>
                  <th>Company Size</th>
                  <th className="text-center">Candidates</th>
                  <th className="text-center">Interviews</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org, index) => (
                  <tr key={index}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar-placeholder">
                          {org.organizationName?.charAt(0) || "O"}
                        </div>
                        <span className="fw-bold text-primary-dark">{org.organizationName}</span>
                      </div>
                    </td>
                    <td className="text-secondary-dark">{org.contactPersonName}</td>
                    <td className="text-muted">{org.email}</td>
                    <td>
                      <span className="badge-ui badge-ui-info">{org.industry || "—"}</span>
                    </td>
                    <td className="text-muted">{org.companySize || "—"}</td>
                    <td className="text-center">
                      <span className="count-pill">{org.candidateCount || 0}</span>
                    </td>
                    <td className="text-center">
                      <span className="count-pill">{org.interviewCount || 0}</span>
                    </td>
                    <td className="text-muted small">
                      {org.created_at ? new Date(org.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
