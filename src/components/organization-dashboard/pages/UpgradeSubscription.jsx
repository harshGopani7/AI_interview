import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getSubscriptionStatus,
  getPlans,
  upgradeSubscription,
  upgradePreview,
  repurchaseSubscription,
} from "../../../services/subscriptionApi";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import {
  HiOutlineArrowLeft,
  HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineCreditCard,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
  HiOutlineCurrencyDollar,
} from "react-icons/hi2";
import "./UpgradeSubscription.css";

export default function UpgradeSubscription() {
  const navigate = useNavigate();
  const location = useLocation();
  const targetTier = location.state?.selectedPlan?.tier || location.state?.tier;

  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [repurchasing, setRepurchasing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPlan, setCurrentPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [preview, setPreview] = useState(null);
  const [statusData, setStatusData] = useState(null);

  useEffect(() => {
    if (!targetTier) {
      navigate("/organization/dashboard/subscription");
      return;
    }
    fetchData();
  }, [targetTier]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Check provider first — redirect Razorpay users to the Razorpay upgrade page
      const statusCheck = await getSubscriptionStatus();
      console.log(statusCheck)
      if (statusCheck?.subscription?.provider === "razorpay") {
        navigate("/organization/dashboard/upgrade-subscription/razorpay", {
          state: { tier: targetTier },
          replace: true,
        });
        return;
      }

      // Stripe flow: fetch plans first, then conditionally fetch preview
      const plansData = await getPlans();
      const statusData = statusCheck;

      const plans = plansData.plans || [];
      const currentTier = statusData.subscriptionTier;
      const fetchedCurrentPlan = plans.find((p) => p.tier === currentTier);
      const fetchedSelectedPlan = plans.find((p) => p.tier === targetTier);

      if (!fetchedCurrentPlan || !fetchedSelectedPlan) {
        setError("Unable to load plan details. Please go back and try again.");
        setLoading(false);
        return;
      }

      const tierHierarchy = ["basic", "gold", "platinum"];
      const currentIndex = tierHierarchy.indexOf(fetchedCurrentPlan.tier);
      const newIndex = tierHierarchy.indexOf(fetchedSelectedPlan.tier);

      // Same tier = repurchase flow — skip preview and tier validation
      const sameTier = newIndex === currentIndex;

      if (!sameTier) {
        if (newIndex < currentIndex) {
          setError("Downgrades are not allowed. You can only upgrade to higher tiers.");
          setLoading(false);
          return;
        }
        // Only fetch proration preview for actual upgrades
        const previewData = await upgradePreview(targetTier);
        setPreview(previewData);
      }

      setCurrentPlan(fetchedCurrentPlan);
      setSelectedPlan(fetchedSelectedPlan);
      setStatusData(statusData);
    } catch (err) {
      setError(err.message || "Failed to load subscription data.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount / 100);
  };

  const handleRepurchase = async () => {
    setRepurchasing(true);
    setError("");
    setSuccess("");
    try {
      const data = await repurchaseSubscription();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Unexpected response. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Failed to initiate repurchase.");
    } finally {
      setRepurchasing(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    setError("");

    try {
      const data = await upgradeSubscription(selectedPlan.tier);
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        console.log("Upgrade paid instantly, redirecting to dashboard.");
        navigate("/organization/dashboard/subscription?upgraded=true");
        window.location.reload();

      } else {
        console.warn("Upgrade response missing url and success:", data);
        setError("Unexpected response. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Failed to initiate upgrade.");
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="upgrade-container">
        <div className="upgrade-loading">
          <div className="spinner"></div>
          <p>Loading upgrade details...</p>
        </div>
      </div>
    );
  }

  if (!selectedPlan || !currentPlan) {
    return (
      <div className="upgrade-container">
        <div className="upgrade-header">
          <Button variant="secondary" onClick={() => navigate("/organization/dashboard/subscription")}>
            <HiOutlineArrowLeft style={{ marginRight: 6 }} />
            Back to Subscription
          </Button>
        </div>
        {error && (
          <Card className="upgrade-error-card">
            <div className="upgrade-error">
              <HiOutlineInformationCircle style={{ fontSize: "1.2rem" }} />
              <span>{error}</span>
            </div>
          </Card>
        )}
      </div>
    );
  }

  const cvUsed = statusData?.cvUsed ?? 0;
  const cvLimit = statusData?.cvLimit ?? 0;
  const cvExhausted = cvLimit > 0 && cvUsed >= cvLimit;
  const cvPct = cvLimit > 0 ? Math.min(Math.round((cvUsed / cvLimit) * 100), 100) : 0;
  const isSameTier = statusData?.subscriptionTier === targetTier;

  return (
    <div className="upgrade-container fade-in">
      <div className="upgrade-header">
        <Button variant="secondary" onClick={() => navigate("/organization/dashboard/subscription")}>
          <HiOutlineArrowLeft style={{ marginRight: 6 }} />
          Back to Subscription
        </Button>
        <h1 className="upgrade-title">
          {isSameTier ? "Increase CV Limits" : "Upgrade Subscription"}
        </h1>
      </div>

      {error && (
        <Card className="upgrade-error-card">
          <div className="upgrade-error">
            <HiOutlineInformationCircle style={{ fontSize: "1.2rem" }} />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {success && (
        <Card className="upgrade-success-card">
          <div className="upgrade-success">
            <HiOutlineCheckCircle style={{ fontSize: "1.2rem" }} />
            <span>{success}</span>
          </div>
        </Card>
      )}

      {/* CV Limit Exhausted — Repurchase Banner */}
      {isSameTier && (
        <Card className="repurchase-card">
          <div className="repurchase-header">
            <HiOutlineCreditCard className="repurchase-icon" />
            <div>
              <h2 className="repurchase-title">Repurchase {currentPlan?.name} Plan</h2>
              <p className="repurchase-subtitle">
                Top up your CV analysis credits by purchasing the {currentPlan?.name} plan again.
              </p>
            </div>
          </div>

          {cvLimit > 0 && (
            <div className="repurchase-usage">
              <div className="repurchase-usage-header">
                <span className="repurchase-usage-label">Current CV Analysis Usage</span>
                <span className={`repurchase-usage-count ${cvExhausted ? "usage-exhausted" : ""}`}>
                  {cvUsed} / {cvLimit} used
                </span>
              </div>
              <div className="repurchase-bar-bg">
                <div
                  className={`repurchase-bar-fill ${cvPct >= 100 ? "bar-danger" : cvPct >= 80 ? "bar-warn" : "bar-ok"
                    }`}
                  style={{ width: `${cvPct}%` }}
                />
              </div>
              {cvExhausted && (
                <p className="repurchase-exhausted-msg">
                  Your CV analysis credits are fully used. Repurchase to get a fresh allocation.
                </p>
              )}
            </div>
          )}

          <div className="repurchase-details">
            <div className="repurchase-detail-item">
              <HiOutlineCheckCircle className="repurchase-check" />
              <span>Fresh CV analysis credits added immediately after payment</span>
            </div>
            <div className="repurchase-detail-item">
              <HiOutlineCheckCircle className="repurchase-check" />
              <span>All existing features and access remain unchanged</span>
            </div>
            <div className="repurchase-detail-item">
              <HiOutlineCurrencyDollar className="repurchase-check" />
              <span>
                Price: <strong>${currentPlan?.price}/month</strong> — billed via Stripe
              </span>
            </div>
          </div>

          <div className="repurchase-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={handleRepurchase}
              disabled={repurchasing}
              className="upgrade-button"
            >
              <HiOutlineCreditCard style={{ marginRight: 8 }} />
              {repurchasing ? "Redirecting to Stripe..." : `Pay $${currentPlan?.price} & Repurchase`}
            </Button>
            <p className="secure-notice">
              <HiOutlineCreditCard style={{ fontSize: "0.9rem" }} />
              Secure payment powered by Stripe
            </p>
          </div>
        </Card>
      )}

      {/* Current vs New Plan Comparison + Proration + Action — only for actual tier upgrades */}
      {!isSameTier && (
        <>
          <div className="upgrade-comparison">
            <Card className="plan-card current-plan">
              <div className="plan-header">
                <h3>Current Plan</h3>
                <span className="plan-badge current">Current</span>
              </div>
              <div className="plan-info">
                <h4>{currentPlan.name}</h4>
                <div className="plan-price">
                  <span className="amount">{formatCurrency(currentPlan.price * 100, preview?.currency || "usd")}</span>
                  <span className="period">/month</span>
                </div>
                <ul className="plan-feature-list">
                  {currentPlan.features?.map((feat, idx) => (
                    <li key={idx}>
                      <HiOutlineCheckCircle className="feat-icon" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <div className="upgrade-arrow">
              <HiOutlineSparkles />
            </div>

            <Card className="plan-card new-plan">
              <div className="plan-header">
                <h3>New Plan</h3>
                <span className="plan-badge new">Upgrade</span>
              </div>
              <div className="plan-info">
                <h4>{selectedPlan.name}</h4>
                <div className="plan-price">
                  <span className="amount">{formatCurrency(selectedPlan.price * 100, preview?.currency || "usd")}</span>
                  <span className="period">/month</span>
                </div>
                <ul className="plan-feature-list">
                  {selectedPlan.features?.map((feat, idx) => (
                    <li key={idx}>
                      <HiOutlineCheckCircle className="feat-icon" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          {/* Stripe Proration Breakdown */}
          {preview && (
            <Card className="calculation-card">
              <div className="calculation-header">
                <HiOutlineCurrencyDollar style={{ fontSize: "1.5rem" }} />
                <h2>Prorated Billing Details</h2>
              </div>

              {preview.periodEnd && (
                <div className="billing-period">
                  <div className="period-info">
                    <HiOutlineCalendar style={{ fontSize: "1.1rem" }} />
                    <span>
                      Current billing period ends on{" "}
                      <strong>{new Date(preview.periodEnd * 1000).toLocaleDateString()}</strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="calculation-breakdown">
                {preview.lines?.map((line, idx) => (
                  <div
                    key={idx}
                    className={`calculation-item ${line.amount < 0 ? "credit" : "cost"}`}
                  >
                    <div className="item-label">
                      <span>{line.description}</span>
                    </div>
                    <span className={`item-value ${line.amount < 0 ? "credit" : "cost"}`}>
                      {line.amount < 0 ? "-" : ""}
                      {formatCurrency(Math.abs(line.amount), line.currency)}
                    </span>
                  </div>
                ))}

                <div className="calculation-divider" />

                <div className="calculation-item total">
                  <div className="item-label">
                    <strong>Amount due today</strong>
                    <span className="item-detail">Prorated upgrade cost</span>
                  </div>
                  <span className="item-value total">
                    {formatCurrency(preview.amountDue, preview.currency)}
                  </span>
                </div>
              </div>

              <div className="next-billing">
                <HiOutlineCalendar style={{ fontSize: "1rem" }} />
                <span>
                  Next full billing: <strong>{formatCurrency(selectedPlan.price * 100, preview?.currency || "usd")}/month</strong> starting{" "}
                  {preview.periodEnd
                    ? new Date(preview.periodEnd * 1000).toLocaleDateString()
                    : "next cycle"}
                </span>
              </div>
            </Card>
          )}

          {/* Upgrade Summary */}
          <Card className="summary-card">
            <h3 className="summary-title">Upgrade Summary</h3>
            <div className="summary-items">
              <div className="summary-item">
                <HiOutlineCheckCircle className="summary-icon success" />
                <span>Immediate access to all {selectedPlan.name} features</span>
              </div>
              <div className="summary-item">
                <HiOutlineCheckCircle className="summary-icon success" />
                <span>Prorated billing — you only pay the difference for remaining time</span>
              </div>
              <div className="summary-item">
                <HiOutlineCheckCircle className="summary-icon success" />
                <span>No service interruption during upgrade</span>
              </div>
              <div className="summary-item">
                <HiOutlineCheckCircle className="summary-icon success" />
                <span>You'll be redirected to Stripe to confirm payment</span>
              </div>
            </div>
          </Card>

          {/* Action Button */}
          <div className="upgrade-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={handleUpgrade}
              disabled={upgrading}
              className="upgrade-button"
            >
              <HiOutlineCreditCard style={{ marginRight: 8 }} />
              {upgrading
                ? "Processing..."
                : `Pay ${preview ? formatCurrency(preview.amountDue, preview.currency) : ""} & Upgrade`}
            </Button>
            <p className="secure-notice">
              <HiOutlineCreditCard style={{ fontSize: "0.9rem" }} />
              Secure payment powered by Stripe
            </p>
          </div>
        </>
      )}

    </div>
  );
}
