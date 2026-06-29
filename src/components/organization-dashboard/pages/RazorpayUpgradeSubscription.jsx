import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getSubscriptionStatus,
  getPlans,
} from "../../../services/subscriptionApi";
import {
  previewRazorpayUpgrade,
  createRazorpayUpgradeOrder,
  verifyRazorpayUpgradeOrder,
  repurchaseRazorpaySubscription,
  loadRazorpayScript,
  verifyRazorpayPayment,
} from "../../../services/razorpayService";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import {
  HiOutlineArrowLeft,
  HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
  HiOutlineCurrencyDollar,
  HiOutlineCreditCard,
} from "react-icons/hi2";
import "./UpgradeSubscription.css";

export default function RazorpayUpgradeSubscription() {
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
  const [orgEmail, setOrgEmail] = useState("");
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
      const [statusData, plansData] = await Promise.all([
        getSubscriptionStatus(),
        getPlans(),
      ]);

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

      // Same tier = repurchase flow — skip preview fetch and tier validation
      const sameTier = newIndex === currentIndex;

      if (!sameTier) {
        if (newIndex < currentIndex) {
          setError("Downgrades are not allowed mid-cycle.");
          setLoading(false);
          return;
        }
        // Only fetch proration preview for actual upgrades
        const previewData = await previewRazorpayUpgrade(targetTier);
        setPreview(previewData);
      }

      setCurrentPlan(fetchedCurrentPlan);
      setSelectedPlan(fetchedSelectedPlan);
      setOrgEmail(statusData.email || "");
      setStatusData(statusData);
    } catch (err) {
      setError(err.message || "Failed to load upgrade details.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleRepurchase = async () => {
    setRepurchasing(true);
    setError("");
    setSuccess("");
    try {
      await loadRazorpayScript();
      const data = await repurchaseRazorpaySubscription();
      const { subscription_id, key_id, currency, org_name, email, contact, plan_name } = data;

      await new Promise((resolve, reject) => {
        const options = {
          key: key_id,
          subscription_id,
          currency: currency || "USD",
          name: "AI Interview Platform",
          description: `Repurchase ${plan_name} Plan`,
          prefill: { name: org_name || "", email: email || orgEmail, contact: contact || "" },
          theme: { color: "#6366f1" },
          handler: async (response) => {
            try {
              await verifyRazorpayPayment(
                response.razorpay_payment_id,
                response.razorpay_subscription_id,
                response.razorpay_signature
              );
              resolve(response);
            } catch (e) { reject(e); }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled by user")) },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (r) => reject(new Error(r.error?.description || "Payment failed")));
        rzp.open();
      });

      setSuccess(`${plan_name} plan repurchased! Your CV credits have been renewed.`);
      setTimeout(() => navigate("/organization/dashboard/subscription?repurchased=true"), 1800);
      window.location.reload();
    } catch (err) {
      if (err.message !== "Payment cancelled by user") setError(err.message);
    } finally {
      setRepurchasing(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    setError("");
    setSuccess("");

    try {
      await loadRazorpayScript();

      // Step 1: Create a Razorpay Order for the exact prorated amount
      const orderData = await createRazorpayUpgradeOrder(selectedPlan.tier);
      const { order_id, key_id, amount, currency, org_name, email, contact } = orderData;

      // Step 2: Open Razorpay checkout with the order (not a subscription)
      const paymentResponse = await new Promise((resolve, reject) => {
        const options = {
          key: key_id,
          order_id,
          amount,
          currency: currency || "INR",
          name: "AI Interview Platform",
          description: `Upgrade to ${selectedPlan.name} Plan (prorated)`,
          image: "/logo.png",
          prefill: {
            name: org_name || "",
            email: email || orgEmail,
            contact: contact || "",
          },
          notes: { tier: selectedPlan.tier, upgrade: "true" },
          theme: { color: "#6366f1" },
          handler: (response) => resolve(response),
          modal: { ondismiss: () => reject(new Error("Payment cancelled by user")) },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp) =>
          reject(new Error(resp.error?.description || "Payment failed."))
        );
        rzp.open();
      });

      // Step 3: Verify payment and activate upgraded subscription
      await verifyRazorpayUpgradeOrder({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        new_tier: selectedPlan.tier,
        amount,
      });

      setSuccess(`Successfully upgraded to ${selectedPlan.name}! Redirecting...`);
      setTimeout(() => {
        navigate("/organization/dashboard/subscription?upgraded=true");
      }, 1800);
    } catch (err) {
      const msg = err.message || "Upgrade failed.";
      if (msg !== "Payment cancelled by user") {
        setError(msg);
      }
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
            <HiOutlineArrowLeft style={{ marginRight: 6 }} /> Back to Subscription
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
          <HiOutlineArrowLeft style={{ marginRight: 6 }} /> Back to Subscription
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
        <Card className="upgrade-error-card" style={{ borderColor: "var(--success, #059669)" }}>
          <div className="upgrade-error" style={{ color: "var(--success, #059669)" }}>
            <HiOutlineCheckCircle style={{ fontSize: "1.2rem" }} />
            <span>{success}</span>
          </div>
        </Card>
      )}

      {/* Repurchase Card — same-tier repurchase to top up CV limits */}
      {isSameTier && (
        <Card className="repurchase-card">
          <div className="repurchase-header">
            <HiOutlineCreditCard className="repurchase-icon" />
            <div>
              <h2 className="repurchase-title">Repurchase {currentPlan?.name} Plan</h2>
              <p className="repurchase-subtitle">
                Top up your CV analysis credits by purchasing the {currentPlan?.name} plan again via Razorpay.
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
                  className={`repurchase-bar-fill ${
                    cvPct >= 100 ? "bar-danger" : cvPct >= 80 ? "bar-warn" : "bar-ok"
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
                Price: <strong>{formatCurrency(currentPlan?.price)}/month</strong> — paid via Razorpay
              </span>
            </div>
          </div>

          <div className="repurchase-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={handleRepurchase}
              disabled={repurchasing || !!success}
              className="upgrade-button"
            >
              {repurchasing
                ? "Opening Razorpay..."
                : `Pay ${formatCurrency(currentPlan?.price)} & Repurchase`}
            </Button>
            <p className="secure-notice">Secure payment powered by Razorpay</p>
          </div>
        </Card>
      )}

      {/* Plan Comparison + Proration + Action — only for actual tier upgrades */}
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
                  <span className="amount">{formatCurrency(currentPlan.price)}</span>
                  <span className="period">/month</span>
                </div>
                <ul className="plan-feature-list">
                  {currentPlan.features?.map((feat, idx) => (
                    <li key={idx}><HiOutlineCheckCircle className="feat-icon" />{feat}</li>
                  ))}
                </ul>
              </div>
            </Card>

            <div className="upgrade-arrow"><HiOutlineSparkles /></div>

            <Card className="plan-card new-plan">
              <div className="plan-header">
                <h3>New Plan</h3>
                <span className="plan-badge new">Upgrade</span>
              </div>
              <div className="plan-info">
                <h4>{selectedPlan.name}</h4>
                <div className="plan-price">
                  <span className="amount">{formatCurrency(selectedPlan.price)}</span>
                  <span className="period">/month</span>
                </div>
                <ul className="plan-feature-list">
                  {selectedPlan.features?.map((feat, idx) => (
                    <li key={idx}><HiOutlineCheckCircle className="feat-icon" />{feat}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          {/* Proration Breakdown */}
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
                <div className="calculation-item credit">
                  <div className="item-label">
                    <span>Unused credit from {currentPlan.name} ({preview.remainingDays} days remaining)</span>
                  </div>
                  <span className="item-value credit">
                    − {formatCurrency(preview.unusedCredit, preview.currency || "USD")}
                  </span>
                </div>

                <div className="calculation-item cost">
                  <div className="item-label">
                    <span>{selectedPlan.name} Plan (full month)</span>
                  </div>
                  <span className="item-value cost">
                    {formatCurrency(preview.newPlanPrice, preview.currency || "USD")}
                  </span>
                </div>

                <div className="calculation-divider" />

                <div className="calculation-item total">
                  <div className="item-label">
                    <strong>Amount due today</strong>
                    <span className="item-detail">Prorated upgrade cost</span>
                  </div>
                  <span className="item-value total">
                    {formatCurrency(preview.proratedCharge, preview.currency || "USD")}
                  </span>
                </div>
              </div>

              <div className="next-billing">
                <HiOutlineCalendar style={{ fontSize: "1rem" }} />
                <span>
                  Next full billing: <strong>{formatCurrency(selectedPlan.price)}/month</strong> starting{" "}
                  {preview.periodEnd
                    ? new Date(preview.periodEnd * 1000).toLocaleDateString()
                    : "next cycle"}
                </span>
              </div>
            </Card>
          )}

          {/* Summary */}
          <Card className="summary-card">
            <h3 className="summary-title">Upgrade Summary</h3>
            <div className="summary-items">
              <div className="summary-item">
                <HiOutlineCheckCircle className="summary-icon success" />
                <span>Immediate access to all {selectedPlan.name} features</span>
              </div>
              <div className="summary-item">
                <HiOutlineCheckCircle className="summary-icon success" />
                <span>Prorated billing — you only pay the difference for remaining days</span>
              </div>
              <div className="summary-item">
                <HiOutlineCheckCircle className="summary-icon success" />
                <span>No service interruption during upgrade</span>
              </div>
              <div className="summary-item">
                <HiOutlineCheckCircle className="summary-icon success" />
                <span>Pay via UPI, Netbanking, Card, or Wallet through Razorpay</span>
              </div>
            </div>
          </Card>

          {/* Action */}
          <div className="upgrade-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={handleUpgrade}
              disabled={upgrading || !!success}
              className="upgrade-button"
            >
              {upgrading
                ? "Opening Razorpay..."
                : `Pay ${preview ? formatCurrency(preview.proratedCharge, preview.currency || "USD") : ""} & Upgrade`}
            </Button>
            <p className="secure-notice">
              Secure payment powered by Razorpay
            </p>
          </div>
        </>
      )}
    </div>
  );
}
