import { useState, useEffect } from "react";
import Section from "../../ui/Section";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import { backendURL } from "../../pages/Home";
import {
  HiOutlineBuildingOffice,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlinePencil,
  HiOutlineArrowPath,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineFunnel,
} from "react-icons/hi2";
import "./AdminSubscriptions.css";

function getAdminToken() {
  return sessionStorage.getItem("interview_ai_token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAdminToken()}`,
  };
}

const STATUS_COLOR = {
  active: "sub-status-active",
  authenticated: "sub-status-active",
  created: "sub-status-pending",
  cancelled: "sub-status-cancelled",
  canceled: "sub-status-cancelled",
  past_due: "sub-status-past-due",
};

const TIER_COLOR = {
  "free trial": "tier-free-trial",
  basic: "tier-basic",
  gold: "tier-gold",
  platinum: "tier-platinum",
};

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");
  const [expandedOrg, setExpandedOrg] = useState(null);

  // Edit state
  const [editingOrg, setEditingOrg] = useState(null);
  const [editCvLimit, setEditCvLimit] = useState("");
  const [editInterviewLimit, setEditInterviewLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${backendURL}/admin/subscriptions`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      const data = await res.json();
      console.log(data);
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLimits = async (orgId) => {
    setSaving(true);
    setSaveMsg("");
    try {
      const cvVal = parseInt(editCvLimit, 10);
      const intVal = parseInt(editInterviewLimit, 10);

      if (!isNaN(cvVal)) {
        const r = await fetch(`${backendURL}/admin/subscriptions/${orgId}/cv-limit`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ cvLimit: cvVal }),
        });
        if (!r.ok) throw new Error((await r.json()).error || "Failed to update CV limit");
      }

      if (!isNaN(intVal)) {
        const r = await fetch(`${backendURL}/admin/subscriptions/${orgId}/interview-limit`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ interviewLimit: intVal }),
        });
        if (!r.ok) throw new Error((await r.json()).error || "Failed to update interview limit");
      }

      setSaveMsg("Limits updated!");
      setEditingOrg(null);
      fetchSubscriptions();
    } catch (err) {
      setSaveMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetUsage = async (orgId, resetInterview = false) => {
    if (!window.confirm(`Reset CV usage${resetInterview ? " and interview usage" : ""} for this org?`)) return;
    try {
      const r = await fetch(`${backendURL}/admin/subscriptions/${orgId}/reset-usage`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ resetCv: true, resetInterview }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Reset failed");
      fetchSubscriptions();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = (org) => {
    setEditingOrg(org.orgId);
    setEditCvLimit(String(org.cvLimit ?? ""));
    setEditInterviewLimit(String(org.interviewLimit ?? ""));
    setSaveMsg("");
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    return new Date(ts * 1000).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const usagePercent = (used, limit) => {
    if (!limit) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const filtered = subscriptions.filter((s) => {
    const matchSearch =
      !search ||
      s.organizationName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    const matchTier =
      filterTier === "all" || s.subscription?.tier === filterTier;
    const matchProvider =
      filterProvider === "all" || s.subscription?.provider === filterProvider;
    return matchSearch && matchTier && matchProvider;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.subscription?.status === "active").length,
    stripe: subscriptions.filter((s) => s.subscription?.provider === "stripe").length,
    razorpay: subscriptions.filter((s) => s.subscription?.provider === "razorpay").length,
    noSub: subscriptions.filter((s) => !s.subscription).length,
  };

  return (
    <Section title="Subscription Management">
      {/* Stats Row */}
      <div className="sub-stats-row">
        <div className="sub-stat-card">
          <span className="sub-stat-num">{stats.total}</span>
          <span className="sub-stat-label">Total Orgs</span>
        </div>
        <div className="sub-stat-card active">
          <span className="sub-stat-num">{stats.active}</span>
          <span className="sub-stat-label">Active</span>
        </div>
        <div className="sub-stat-card stripe">
          <span className="sub-stat-num">{stats.stripe}</span>
          <span className="sub-stat-label">Stripe</span>
        </div>
        <div className="sub-stat-card razorpay">
          <span className="sub-stat-num">{stats.razorpay}</span>
          <span className="sub-stat-label">Razorpay</span>
        </div>
        <div className="sub-stat-card none">
          <span className="sub-stat-num">{stats.noSub}</span>
          <span className="sub-stat-label">No Sub</span>
        </div>
      </div>

      {/* Filters */}
      <div className="sub-filters">
        <div className="sub-search-wrap">
          <input
            className="sub-search"
            placeholder="Search by org name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sub-filter-group">
          <HiOutlineFunnel className="filter-icon" />
          <select className="sub-filter-select" value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
            <option value="all">All Tiers</option>
            <option value="free trial">Free Trial</option>
            <option value="basic">Basic</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
          <select className="sub-filter-select" value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)}>
            <option value="all">All Providers</option>
            <option value="stripe">Stripe</option>
            <option value="razorpay">Razorpay</option>
          </select>
          <button className="sub-refresh-btn" onClick={fetchSubscriptions} title="Refresh">
            <HiOutlineArrowPath />
          </button>
        </div>
      </div>

      {saveMsg && <div className="sub-save-msg">{saveMsg}</div>}
      {error && <div className="sub-error">{error}</div>}

      {loading ? (
        <div className="sub-loading">
          <div className="spinner"></div>
          <p>Loading subscriptions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card><p className="text-muted text-center py-4">No subscriptions found.</p></Card>
      ) : (
        <div className="sub-list">
          {filtered.map((org) => {
            const sub = org.subscription;
            const isExpanded = expandedOrg === org.orgId;
            const isEditing = editingOrg === org.orgId;
            const cvPct = usagePercent(org.cvUsed, org.cvLimit);
            const intPct = usagePercent(org.interviewUsed, org.interviewLimit);
            const cvExhausted = org.cvLimit > 0 && org.cvUsed >= org.cvLimit;

            return (
              <Card key={org.orgId} className={`sub-org-card ${cvExhausted ? "sub-org-card-warn" : ""}`}>
                {/* Header row */}
                <div className="sub-org-header" onClick={() => setExpandedOrg(isExpanded ? null : org.orgId)}>
                  <div className="sub-org-left">
                    <HiOutlineBuildingOffice className="sub-org-icon" />
                    <div>
                      <div className="sub-org-name">{org.organizationName}</div>
                      <div className="sub-org-email">{org.email}</div>
                    </div>
                  </div>

                  <div className="sub-org-badges">
                    {sub?.tier && (
                      <span className={`tier-badge ${TIER_COLOR[sub.tier] || ""}`}>
                        {sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1)}
                      </span>
                    )}
                    {sub?.status ? (
                      <span className={`sub-status-badge ${STATUS_COLOR[sub.status] || ""}`}>
                        {sub.status === "active" ? <HiOutlineCheckCircle /> : sub.status === "cancelled" ? <HiOutlineXCircle /> : <HiOutlineClock />}
                        {sub.status}
                      </span>
                    ) : (
                      <span className="sub-status-badge sub-status-none">No subscription</span>
                    )}
                    {sub?.provider && (
                      <span className={`provider-badge provider-${sub.provider}`}>{sub.provider}</span>
                    )}
                    {cvExhausted && (
                      <span className="cv-exhausted-badge">CV Limit Reached</span>
                    )}
                  </div>

                  <div className="sub-org-expand">
                    {isExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                  </div>
                </div>

                {/* Usage bars — always visible */}
                <div className="sub-usage-row">
                  <div className="sub-usage-item">
                    <div className="sub-usage-label">
                      <span>CV Analysis</span>
                      <span className={cvExhausted ? "usage-count-warn" : "usage-count"}>
                        {org.cvUsed} / {org.cvLimit || "∞"}
                      </span>
                    </div>
                    <div className="sub-usage-bar-bg">
                      <div
                        className={`sub-usage-bar-fill ${cvPct >= 100 ? "bar-danger" : cvPct >= 80 ? "bar-warn" : "bar-ok"}`}
                        style={{ width: `${cvPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="sub-usage-item">
                    <div className="sub-usage-label">
                      <span>Interviews</span>
                      <span className="usage-count">{org.interviewUsed} / {org.interviewLimit || "∞"}</span>
                    </div>
                    <div className="sub-usage-bar-bg">
                      <div
                        className={`sub-usage-bar-fill ${intPct >= 100 ? "bar-danger" : intPct >= 80 ? "bar-warn" : "bar-ok"}`}
                        style={{ width: `${intPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="sub-org-detail">
                    <div className="sub-detail-grid">
                      <div className="sub-detail-item">
                        <span className="sub-detail-label">Service Type</span>
                        <span className="sub-detail-value">{org.serviceType || "—"}</span>
                      </div>
                      <div className="sub-detail-item">
                        <span className="sub-detail-label">Plan</span>
                        <span className="sub-detail-value">{org.planName || "—"} {org.planPrice ? `($${org.planPrice}/mo)` : ""}</span>
                      </div>
                      <div className="sub-detail-item">
                        <span className="sub-detail-label">Period End</span>
                        <span className="sub-detail-value">{formatDate(sub?.currentPeriodEnd)}</span>
                      </div>
                      <div className="sub-detail-item">
                        <span className="sub-detail-label">Auto-Renew</span>
                        <span className="sub-detail-value">{sub?.cancelAtPeriodEnd ? "No (cancels)" : "Yes"}</span>
                      </div>
                      {sub?.razorpaySubscriptionId && (
                        <div className="sub-detail-item">
                          <span className="sub-detail-label">Razorpay Sub ID</span>
                          <span className="sub-detail-value sub-mono">...{sub.razorpaySubscriptionId.slice(-12)}</span>
                        </div>
                      )}
                      {sub?.stripeSubscriptionId && (
                        <div className="sub-detail-item">
                          <span className="sub-detail-label">Stripe Sub ID</span>
                          <span className="sub-detail-value sub-mono">...{sub.stripeSubscriptionId.slice(-12)}</span>
                        </div>
                      )}
                      <div className="sub-detail-item">
                        <span className="sub-detail-label">Phone</span>
                        <span className="sub-detail-value">{org.phone || "—"}</span>
                      </div>
                    </div>

                    {/* Limit editor */}
                    {isEditing ? (
                      <div className="sub-edit-form">
                        <h5 className="sub-edit-title">Edit Limits</h5>
                        <div className="sub-edit-row">
                          <div className="sub-edit-field">
                            <label>CV Analysis Limit</label>
                            <input
                              type="number"
                              min="0"
                              className="sub-edit-input"
                              value={editCvLimit}
                              onChange={(e) => setEditCvLimit(e.target.value)}
                            />
                          </div>
                          <div className="sub-edit-field">
                            <label>Interview Limit</label>
                            <input
                              type="number"
                              min="0"
                              className="sub-edit-input"
                              value={editInterviewLimit}
                              onChange={(e) => setEditInterviewLimit(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="sub-edit-actions">
                          <Button onClick={() => handleSaveLimits(org.orgId)} disabled={saving}>
                            {saving ? "Saving..." : "Save Limits"}
                          </Button>
                          <Button variant="secondary" onClick={() => setEditingOrg(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="sub-action-row">
                        <button className="sub-action-btn" onClick={() => openEdit(org)}>
                          <HiOutlinePencil /> Edit Limits
                        </button>
                        <button className="sub-action-btn sub-action-reset" onClick={() => handleResetUsage(org.orgId, false)}>
                          <HiOutlineArrowPath /> Reset CV Usage
                        </button>
                        <button className="sub-action-btn sub-action-reset" onClick={() => handleResetUsage(org.orgId, true)}>
                          <HiOutlineArrowPath /> Reset All Usage
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Section>
  );
}
