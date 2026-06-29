import { useState, useEffect } from "react";
import { getToken } from "../../services/token";
import Card from "../../ui/Card";
import { HiOutlineUsers } from "react-icons/hi2";
import "../../components/organization-dashboard/pages/OrgCandidates.css";
import { backendURL } from "../../pages/Home";

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/admin/candidates`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="org-candidates-container">
        <h2>Candidates</h2>
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
          <h2 className="dashboard-title mb-1">All Candidates</h2>
          <p className="text-muted small">View all candidates across all organizations</p>
        </div>
      </div>

      {candidates.length === 0 ? (
        <Card className="text-center py-5">
          <div className="empty-state">
            <HiOutlineUsers className="display-1 text-muted opacity-25 mb-3" />
            <h4 className="text-muted">No candidates registered yet</h4>
            <p className="text-muted small">Candidates will appear here once organizations add them.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden border-light shadow-sm">
          <div className="table-responsive">
            <table className="table custom-dashboard-table mb-0">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Organization</th>
                  <th className="text-center">Interviews</th>
                  <th>Created</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, index) => (
                  <tr key={index}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar-placeholder">
                          {candidate.name?.charAt(0) || "C"}
                        </div>
                        <span className="fw-bold text-primary-dark">{candidate.name}</span>
                      </div>
                    </td>
                    <td className="text-muted">{candidate.email}</td>
                    <td className="text-secondary-dark">{candidate.username || "—"}</td>
                    <td>
                      <span className="badge-ui badge-ui-info">{candidate.organizationName}</span>
                    </td>
                    <td className="text-center">
                      <span className="count-pill">{candidate.interviewCount || 0}</span>
                    </td>
                    <td className="text-muted small">
                      {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="text-end">
                      <button className="btn-table-action">View Details</button>
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
