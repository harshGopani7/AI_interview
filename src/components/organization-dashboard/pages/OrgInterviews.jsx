import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../../services/token";
import { FaCopy, FaEdit, FaTrash, FaEye, FaCheckCircle, FaClock, FaCalendarAlt, FaUser, FaBriefcase, FaChartLine, FaSearch, FaTimes } from "react-icons/fa";
import "./OrgInterviews.css";
import Card from "../../../ui/Card";
import { backendURL } from "../../../pages/Home";

export default function OrgInterviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCredentials, setShowCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/interviews`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data)
        // Sort interviews by creation date (latest first)
        const sortedInterviews = (data.interviews || []).sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA; // Descending order (latest first)
        });
        setInterviews(sortedInterviews);
      }
      
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleCopyCredentials = (interview) => {
    const credentials = `Interview Credentials\n\nUsername: ${interview.username || "N/A"}\nPassword: ${interview.password || "N/A"}\nEmail: ${interview.candidateEmail || "N/A"}\n\nPlease use these credentials to login at: [Your Portal URL]`;
    copyToClipboard(credentials, `all-${interview._id}`);
  };

  const handleEdit = (interview) => {
    navigate("/organization/dashboard/smart-scheduler", {
      state: { editInterview: interview }
    });
  };

  const handleDelete = async (interviewId) => {
    if (!window.confirm("Are you sure you want to delete this interview?")) {
      return;
    }
    
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/interviews/${interviewId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        fetchInterviews();
      }
    } catch (error) {
      console.error("Error deleting interview:", error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: "badge badge-info",
      completed: "badge badge-success",
      cancelled: "badge badge-error",
      pending: "badge badge-warning"
    };
    return badges[status] || "badge";
  };

  const getInterviewDateTime = (interview) => {
    // If scheduledDate exists, show the date and time
    if (interview.scheduledDate) {
      const date = new Date(interview.scheduledDate);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // If deadline exists, calculate days remaining
    if (interview.deadline) {
      const deadline = new Date(interview.deadline);
      const now = new Date();
      const diffTime = deadline - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return `Expired ${Math.abs(diffDays)} days ago`;
      } else if (diffDays === 0) {
        return "Due today";
      } else if (diffDays === 1) {
        return "Due in 1 day";
      } else {
        return `Due in ${diffDays} days`;
      }
    }
    
    // If daysTimer exists, show it
    if (interview.daysTimer) {
      return `${interview.daysTimer} days timer`;
    }
    
    return "Not scheduled";
  };

  // Get unique job roles for filter dropdown
  const uniqueRoles = [...new Set(interviews.map(i => i.position).filter(Boolean))];

  const filteredInterviews = interviews.filter(interview => {
    // Status filter
    if (filter !== "all" && interview.status !== filter) return false;
    
    // Role filter
    if (selectedRole !== "all" && interview.position !== selectedRole) return false;
    
    // Search filter (name or email)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const name = (interview.candidateName || "").toLowerCase();
      const email = (interview.candidateEmail || "").toLowerCase();
      const role = (interview.position || "").toLowerCase();
      
      if (!name.includes(search) && !email.includes(search) && !role.includes(search)) {
        return false;
      }
    }
    
    return true;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRole("all");
    setFilter("all");
  };

  const hasActiveFilters = searchTerm || selectedRole !== "all" || filter !== "all";

  if (loading) {
    return (
      <div className="org-interviews">
        <h2>All Interviews</h2>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="org-interviews-container fade-in">
      {/* Header */}
      <div className="interviews-header mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="dashboard-title mb-1">All Interviews</h2>
            <p className="text-muted small mb-0">
              {filteredInterviews.length} of {interviews.length} interviews
              {hasActiveFilters && " (filtered)"}
            </p>
          </div>
          {hasActiveFilters && (
            <button className="btn-clear-filters" onClick={clearFilters}>
              <FaTimes /> Clear Filters
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="filters-container">
          {/* Search Bar */}
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="search-clear-btn"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Role Filter Dropdown */}
          <div className="filter-dropdown">
            <FaBriefcase className="dropdown-icon" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="role-select"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
 
          {/* Status Filter */}
          <div className="filter-group">
            {["all", "scheduled", "completed"].map((type) => (
              <button
                key={type}
                className={`filter-btn ${filter === type ? "active" : ""}`}
                onClick={() => setFilter(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interviews Grid */}
      {filteredInterviews.length === 0 ? (
        <div className="empty-state-wrapper py-5 text-center">
          <Card className="py-5">
            <FaCalendarAlt className="empty-icon mb-3" />
            <h3>No interviews found</h3>
            <p className="text-muted">Try adjusting your filters or schedule a new session.</p>
          </Card>
        </div>
      ) : (
        <div className="interviews-grid">
          {filteredInterviews.map((interview) => (
            <Card key={interview._id} className="interview-management-card">
              {/* Status Indicator Strip */}
              <div className={`status-strip status-${interview.status || "pending"}`}></div>
              
              <div className="card-top d-flex justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="candidate-avatar-circle">
                    <FaUser />
                  </div>
                  <div>
                    <h4 className="candidate-name mb-0">{interview.candidateName || "Candidate"}</h4>
                    <span className="candidate-email-text">{interview.candidateEmail}</span>
                  </div>
                </div>
                <span className={`status-pill pill-${interview.status || "pending"}`}>
                  {interview.status}
                </span>
              </div>

              <div className="interview-meta-grid my-4">
                <div className="meta-item">
                  <FaBriefcase />
                  <span>{interview.position}</span>
                </div>
                <div className="meta-item">
                  <FaClock />
                  <span>{interview.duration} Min</span>
                </div>
                <div className="meta-item">
                  <FaCalendarAlt />
                  <span>{interview.interviewType}</span>
                </div>
                <div className="meta-item meta-datetime">
                  <FaCalendarAlt />
                  <span className="datetime-text">{getInterviewDateTime(interview)}</span>
                </div>
              </div>

              {/* Credentials Section */}
              <div className={`credentials-panel ${showCredentials === interview._id ? "open" : ""}`}>
                <div className="credential-row">
                  <label>Username</label>
                  <div className="copy-box">
                    <code>{interview.username || "N/A"}</code>
                    <button onClick={() => copyToClipboard(interview.username, `user-${interview._id}`)}>
                      {copiedField === `user-${interview._id}` ? "✓" : <FaCopy />}
                    </button>
                  </div>
                </div>
                <div className="credential-row mt-2">
                  <label>Password</label>
                  <div className="copy-box">
                    <code>{interview.password || "N/A"}</code>
                    <button onClick={() => copyToClipboard(interview.password, `pass-${interview._id}`)}>
                      {copiedField === `pass-${interview._id}` ? "✓" : <FaCopy />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="card-actions-footer pt-3 mt-3 border-top d-flex gap-2">
                {interview.status === "completed" ? (
                  <button 
                    className="btn-action-primary flex-grow-1"
                    onClick={() => navigate(`/organization/dashboard/interview-results/${interview._id}`)}
                  >
                    <FaChartLine /> View Results
                  </button>
                ) : (
                  <button 
                    className="btn-action-primary flex-grow-1"
                    onClick={() => setShowCredentials(showCredentials === interview._id ? null : interview._id)}
                  >
                    <FaEye /> {showCredentials === interview._id ? "Hide" : "Credentials"}
                  </button>
                )}
                <button 
                  className="btn-action-outline"
                  onClick={() => handleCopyCredentials(interview)}
                  title="Copy Invite Text"
                >
                  {copiedField === `all-${interview._id}` ? "✓" : <FaCopy />}
                </button>
                {interview.status !== "completed" && (
                  <button 
                    className="btn-action-edit" 
                    onClick={() => handleEdit(interview)}
                    title="Edit Interview"
                  >
                    <FaEdit />
                  </button>
                )}
                <button className="btn-action-delete" onClick={() => handleDelete(interview._id)}>
                  <FaTrash />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
