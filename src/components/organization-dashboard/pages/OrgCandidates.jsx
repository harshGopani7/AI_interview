import { useState, useEffect } from "react";
import { getToken } from "../../../services/token";
import { FaPlus, FaTimes, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import Button from "../../../ui/Button";
import { HiOutlineUsers } from "react-icons/hi2";
import Input from "../../../ui/Input";
import Card from "../../../ui/Card";
import "./OrgCandidates.css";
import { backendURL } from "../../../pages/Home";
import CandidateDetailsModal from "./CandidateDetailsModal";

export default function OrgCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", phone: "" });
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/candidates-list`, {
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

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/add-candidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Candidate added successfully!" });
        setFormData({ name: "", email: "", phone: "" });
        setShowAddForm(false);
        fetchCandidates();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to add candidate" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (candidate) => {
    setEditingCandidate(candidate);
    setEditFormData({ name: candidate.name, email: candidate.email, phone: candidate.phone || "" });
    setMessage({ type: "", text: "" });
  };

  const handleEditCandidate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/edit-candidate/${editingCandidate._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Candidate updated successfully!" });
        setEditingCandidate(null);
        setEditFormData({ name: "", email: "", phone: "" });
        fetchCandidates();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update candidate" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setSubmitting(true);

    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/delete-candidate/${deleteCandidate._id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Candidate deleted successfully!" });
        setDeleteCandidate(null);
        fetchCandidates();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to delete candidate" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="org-candidates">
        <h2>Candidates</h2>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

return (
    <div className="org-candidates-container fade-in">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title mb-1">Candidate Directory</h2>
          <p className="text-muted small">Manage your talent pool and track interview history</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <FaPlus className="me-2" /> Add New Candidate
        </Button>
      </div>

      {message.text && (
        <div className={`alert-ui mb-4 ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      {/* Modern Add Candidate Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <Card className="modal-content shadow-lg border-0 p-0 overflow-hidden" style={{ maxWidth: '500px' }}>
            <div className="modal-header-simple p-4 border-bottom d-flex justify-content-between align-items-center">
              <h3 className="fw-bold mb-0">Add New Candidate</h3>
              <button className="btn-close-custom" onClick={() => setShowAddForm(false)}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleAddCandidate} className="p-4">
              <div className="mb-3">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Robert Fox"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="robert@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="e.g. +1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              
              <div className="d-flex gap-2">
                <Button type="submit" className="flex-grow-1" disabled={submitting}>
                  {submitting ? "Processing..." : "Register Candidate"}
                </Button>
                <Button variant="secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Main Content: Table */}
      {candidates.length === 0 ? (
        <Card className="text-center py-5">
          <div className="empty-state">
            <HiOutlineUsers className="display-1 text-muted opacity-25 mb-3" />
            <h4 className="text-muted">No candidates registered yet</h4>
            <p className="text-muted small">Start by adding your first candidate to the system.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden border-light shadow-sm">
          <div className="table-responsive">
            <table className="table custom-dashboard-table mb-0">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Email Info</th>
                  <th>Latest Position</th>
                  <th className="text-center">Interviews</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, index) => (
                  <tr key={index}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar-placeholder">
                          {candidate.name.charAt(0)}
                        </div>
                        <span className="fw-bold text-primary-dark">{candidate.name}</span>
                      </div>
                    </td>
                    <td className="text-muted">{candidate.email}</td>
                    <td>
                      <span className="text-secondary-dark">{candidate.position || "—"}</span>
                    </td>
                    <td className="text-center">
                      <span className="count-pill">{candidate.interviewCount || 0}</span>
                    </td>
                    <td>
                      <span className={`badge-ui badge-ui-${candidate.status === "active" ? "success" : "info"}`}>
                        {candidate.status || "active"}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="action-buttons-group">
                        <button 
                          className="btn-action-icon btn-view"
                          onClick={() => setSelectedCandidateId(candidate._id)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="btn-action-icon btn-edit"
                          onClick={() => handleEditClick(candidate)}
                          title="Edit Candidate"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn-action-icon btn-delete"
                          onClick={() => setDeleteCandidate(candidate)}
                          title="Delete Candidate"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Candidate Modal */}
      {editingCandidate && (
        <div className="modal-overlay">
          <Card className="modal-content shadow-lg border-0 p-0 overflow-hidden" style={{ maxWidth: '500px' }}>
            <div className="modal-header-simple p-4 border-bottom d-flex justify-content-between align-items-center">
              <h3 className="fw-bold mb-0">Edit Candidate</h3>
              <button className="btn-close-custom" onClick={() => setEditingCandidate(null)}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleEditCandidate} className="p-4">
              <div className="mb-3">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Robert Fox"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="robert@example.com"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="e.g. +1 234 567 8900"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>
              
              <div className="d-flex gap-2">
                <Button type="submit" className="flex-grow-1" disabled={submitting}>
                  {submitting ? "Updating..." : "Update Candidate"}
                </Button>
                <Button variant="secondary" onClick={() => setEditingCandidate(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="modal-overlay">
          <Card className="modal-content shadow-lg border-0 p-0 overflow-hidden" style={{ maxWidth: '500px' }}>
            <div className="modal-header-simple p-4 border-bottom d-flex justify-content-between align-items-center">
              <h3 className="fw-bold mb-0 text-danger">Delete Candidate</h3>
              <button className="btn-close-custom" onClick={() => setDeleteCandidate(null)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="p-4">
              <p className="mb-3 text-white">Are you sure you want to delete <strong>{deleteCandidate.name}</strong>?</p>
              <p className="text-white small mb-4">
                ⚠️ This will permanently delete the candidate and all associated interviews and results. This action cannot be undone.
              </p>
              
              <div className="d-flex gap-2">
                <Button 
                  className="flex-grow-1 btn-danger" 
                  onClick={handleDeleteConfirm}
                  disabled={submitting}
                  style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                >
                  {submitting ? "Deleting..." : "Delete Candidate"}
                </Button>
                <Button variant="secondary" onClick={() => setDeleteCandidate(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Candidate Details Modal */}
      {selectedCandidateId && (
        <CandidateDetailsModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
          onUpdate={fetchCandidates}
        />
      )}
    </div>
  );
}
