import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageSubscription.css";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import {
  HiCheckCircle,
  HiOutlineArrowPath,
  HiOutlineXCircle,
  HiOutlineCreditCard,
  HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineDocumentText,
} from "react-icons/hi2";
import {
  getSubscriptionStatus,
  cancelSubscription,
  getPlans,
} from "../../../services/subscriptionApi";

export default function ManageSubscription() {
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statusData, plansData] = await Promise.all([
        getSubscriptionStatus(),
        getPlans(),
      ]);
      console.log(statusData)

      setSub(statusData);
      setPlans(plansData.plans || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.")) return;
    setActionLoading("cancel");
    setError("");
    setSuccess("");
    try {
      const data = await cancelSubscription();
      setSuccess(data.message);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleUpgrade = (tier) => {
    navigate("/organization/dashboard/upgrade-subscription", {
      state: { tier },
    });
  };

  const formatDate = (unix) => {
    if (!unix) return "—";
    return new Date(unix * 1000).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="manage-sub-container">
        <div className="manage-sub-loading">
          <div className="spinner"></div>
          <p>Loading subscription...</p>
        </div>
      </div>
    );
  }

  const tierOrder = ["basic", "gold", "platinum"];
  const currentTierIndex = tierOrder.indexOf(sub?.subscriptionTier);
  const subscription = sub?.subscription;
  const isRazorpay = subscription?.provider === "razorpay";
  const cvUsed = sub?.cvUsed ?? 0;
  const planName = sub?.planName || "";
  // const cvUsed =35;

  const cvLimit = sub?.cvLimit ?? 0;
  const cvExhausted = cvLimit > 0 && cvUsed >= cvLimit;
  const cvPct = cvLimit > 0 ? Math.min(Math.round((cvUsed / cvLimit) * 100), 100) : 0;

  return (
    <div className="manage-sub-container fade-in">
      <h2 className="manage-sub-title">Subscription Management</h2>

      {error && <div className="manage-sub-alert manage-sub-alert-error">{error}</div>}
      {success && <div className="manage-sub-alert manage-sub-alert-success">{success}</div>}

      {/* Current Plan Card */}
      <Card className="current-plan-card">
        <div className="current-plan-header">
          <div className="current-plan-icon">
            <HiOutlineCreditCard />
          </div>
          <div>
            <h3 className="current-plan-name">
              {sub?.planName || "No Plan"} Plan
            </h3>
            <p className="current-plan-status">
              {sub?.isActive ? (
                <span className="status-active"><HiCheckCircle /> Active</span>
              ) : (
                <span className="status-inactive">{sub?.subscriptionStatus || "Inactive"}</span>
              )}
            </p>
          </div>
        </div>

        {sub?.isActive && (
          <>
            <div className="current-plan-price">
              <span className="currency">$</span>
              <span className="amount">{sub.planPrice}</span>
              <span className="period">/month</span>
            </div>

            {/* Billing Period Info */}
            {subscription?.currentPeriodStart && subscription?.currentPeriodEnd && (
              <div className="billing-info">
                <HiOutlineCalendar className="billing-info-icon" />
                <div className="billing-info-text">
                  <span className="billing-label">Current billing period</span>
                  <span className="billing-dates">
                    {formatDate(subscription.currentPeriodStart)} — {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </div>
              </div>
            )}

            {/* CV Usage Bar */}
            {cvLimit > 0 && (
              <div className="cv-usage-section">
                <div className="cv-usage-header">
                  <span className="cv-usage-label">CV Analysis Usage</span>
                  <span className={`cv-usage-count ${cvExhausted ? "cv-usage-exhausted" : ""}`}>
                    {cvUsed} / {cvLimit}
                  </span>
                </div>
                <div className="cv-usage-bar-bg">
                  <div
                    className={`cv-usage-bar-fill ${
                      cvPct >= 100 ? "bar-danger" : cvPct >= 80 ? "bar-warn" : "bar-ok"
                    }`}
                    style={{ width: `${cvPct}%` }}
                  />
                </div>
                {cvExhausted && (
                  <p className="cv-exhausted-msg">
                    You've used all your CV analysis credits. Repurchase to continue.
                  </p>
                )}
              </div>
            )}

            <ul className="current-plan-features">
              {sub.planFeatures?.map((feat, idx) => (
                <li key={idx}><HiCheckCircle className="feat-check" /> {feat}</li>
              ))}
            </ul>

            <div className="current-plan-actions">
              {/* Top Up CV Credits — shown for all providers when limit is near or exhausted, but not for Free Trial */}
              {cvLimit > 0 && cvPct >= 0 && planName !== "Free Trial" && (
                <Button
                  variant="primary"
                  onClick={() => handleUpgrade(sub.subscriptionTier)}
                >
                  <HiOutlineArrowPath style={{ marginRight: 6 }} />
                  {cvExhausted ? `Repurchase ${sub.planName} Plan` : "Top Up CV Credits"}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={actionLoading === "cancel"}
              >
                <HiOutlineXCircle style={{ marginRight: 6 }} />
                {actionLoading === "cancel" ? "Canceling..." : "Cancel Subscription"}
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Latest Invoice */}
      {sub?.invoices?.length > 0 && (
        <Card className="invoice-card">
          <div className="invoice-header">
            <HiOutlineDocumentText className="invoice-header-icon" />
            <h3>Latest Invoice</h3>
          </div>
          <div className="invoice-row">
            <span className="invoice-label">Invoice</span>
            <span className="invoice-value">{sub.invoices[0].number || sub.invoices[0].invoiceId}</span>
          </div>
          <div className="invoice-row">
            <span className="invoice-label">Amount</span>
            <span className="invoice-value">${(sub.invoices[0].amount / 100).toFixed(2)} {sub.invoices[0].currency?.toUpperCase()}</span>
          </div>
          <div className="invoice-row">
            <span className="invoice-label">Status</span>
            <span className="invoice-status-badge">{sub.invoices[0].status}</span>
          </div>
          <div className="invoice-row">
            <span className="invoice-label">Date</span>
            <span className="invoice-value">{formatDate(sub.invoices[0].created)}</span>
          </div>
          {sub.invoices[0].hostedInvoiceUrl && (
            <a
              href={sub.invoices[0].hostedInvoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="invoice-link"
            >
              View Invoice
            </a>
          )}
        </Card>
      )}

      {/* Upgrade Options */}
      {sub?.isActive && (
        <>
          <h3 className="upgrade-heading">
            <HiOutlineSparkles style={{ marginRight: 8 }} />
            Upgrade Your Plan
          </h3>

          {plans.filter((p) => tierOrder.indexOf(p.tier) > currentTierIndex).length === 0 ? (
            <Card className="no-upgrades-card">
              <div className="no-upgrades-content">
                <HiOutlineSparkles className="no-upgrades-icon" />
                <h4>You're on our highest tier!</h4>
                <p>You're already enjoying all the features of our {sub?.planName} plan. No further upgrades are available at this time.</p>
              </div>
            </Card>
          ) : (
            <div className="upgrade-plans-grid">
              {plans
                .filter((p) => tierOrder.indexOf(p.tier) > currentTierIndex)
                .map((plan) => (
                <Card key={plan.tier} className="upgrade-plan-card card-hover">
                  {plan.isPopular && <span className="popular-badge">Popular</span>}
                  <h4 className="plan-name">{plan.name}</h4>
                  <p className="plan-description">{plan.description}</p>
                  <div className="plan-price">
                    <span className="currency">$</span>
                    <span className="amount">{plan.price}</span>
                    <span className="period">/mo</span>
                  </div>
                  <ul className="plan-features">
                    {plan.features.map((feat, idx) => (
                      <li key={idx}><HiCheckCircle className="feat-icon" /> {feat}</li>
                    ))}
                  </ul>
                  <Button
                    className="upgrade-plan-btn"
                    onClick={() => handleUpgrade(plan.tier)}
                  >
                    <HiOutlineArrowPath style={{ marginRight: 6 }} />
                    Upgrade to {plan.name}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
