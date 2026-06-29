import { useState, useEffect } from "react";
import { getRazorpayStatus, repurchaseRazorpaySubscription, loadRazorpayScript, verifyRazorpayPayment } from "../../../services/razorpayService";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import {
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineInformationCircle,
  HiOutlineCreditCard,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import "./SubscriptionBilling.css";

export default function RazorpaySubscriptionBilling() {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [repurchasing, setRepurchasing] = useState(false);
  const [repurchaseMsg, setRepurchaseMsg] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getRazorpayStatus();
      setSubscriptionData(data);
      setInvoices(data?.invoices || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRepurchase = async () => {
    setRepurchasing(true);
    setRepurchaseMsg("");
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
          prefill: { name: org_name || "", email: email || "", contact: contact || "" },
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
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (r) => reject(new Error(r.error?.description || "Payment failed")));
        rzp.open();
      });

      setRepurchaseMsg("Plan repurchased! Your CV credits have been renewed.");
      fetchData();
    } catch (err) {
      if (err.message !== "Payment cancelled") setRepurchaseMsg(err.message);
    } finally {
      setRepurchasing(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "status-active";
      case "paid":   return "status-active";
      case "cancelled":
      case "canceled": return "status-canceled";
      case "past_due": return "status-past-due";
      case "completed": return "status-canceled";
      default: return "status-unknown";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
      case "paid":
        return <HiOutlineCheckCircle />;
      case "cancelled":
      case "canceled":
      case "completed":
        return <HiOutlineXCircle />;
      case "past_due":
        return <HiOutlineClock />;
      default:
        return <HiOutlineInformationCircle />;
    }
  };

  if (loading) {
    return (
      <div className="billing-container">
        <div className="billing-loading">
          <div className="spinner"></div>
          <p>Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="billing-container">
        <Card className="billing-error-card">
          <div className="billing-error">
            <HiOutlineInformationCircle style={{ fontSize: "1.2rem" }} />
            <span>{error}</span>
          </div>
        </Card>
      </div>
    );
  }

  const subscription = subscriptionData?.subscription;
  const cvUsed = subscriptionData?.cvUsed ?? 0;
  const cvLimit = subscriptionData?.cvLimit ?? 0;
  const cvExhausted = cvLimit > 0 && cvUsed >= cvLimit;
  const cvPct = cvLimit > 0 ? Math.min(Math.round((cvUsed / cvLimit) * 100), 100) : 0;

  return (
    <div className="billing-container fade-in">
      <div className="billing-header">
        <h1 className="billing-title">Billing & Invoices</h1>
        <p className="billing-subtitle">
          Manage your Razorpay subscription and view billing history
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card className="current-subscription-card">
          <div className="subscription-header">
            <div className="subscription-header-left">
              <HiOutlineCreditCard className="subscription-header-icon" />
              <h2 className="subscription-title">Current Subscription</h2>
            </div>
            <div className={`subscription-status ${getStatusColor(subscription.status)}`}>
              {getStatusIcon(subscription.status)}
              <span>
                {subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1)}
              </span>
            </div>
          </div>

          <div className="subscription-details">
            <div className="subscription-plan">
              <h3>{subscriptionData.planName} Plan</h3>
              <div className="subscription-price">
                <span className="price-amount">${subscriptionData.planPrice}</span>
                <span className="price-period">/month</span>
              </div>
            </div>

            {/* CV Usage Bar */}
            {cvLimit > 0 && (
              <div className="billing-cv-usage">
                <div className="billing-cv-usage-header">
                  <span className="billing-cv-label">CV Analysis Usage</span>
                  <span className={`billing-cv-count ${cvExhausted ? "billing-cv-exhausted" : ""}`}>
                    {cvUsed} / {cvLimit}
                  </span>
                </div>
                <div className="billing-cv-bar-bg">
                  <div
                    className={`billing-cv-bar-fill ${
                      cvPct >= 100 ? "bar-danger" : cvPct >= 80 ? "bar-warn" : "bar-ok"
                    }`}
                    style={{ width: `${cvPct}%` }}
                  />
                </div>
                {cvExhausted && (
                  <p className="billing-cv-exhausted-msg">
                    CV analysis credits exhausted — repurchase to continue.
                  </p>
                )}
              </div>
            )}

            {subscriptionData.planFeatures?.length > 0 && (
              <ul className="subscription-features">
                {subscriptionData.planFeatures.map((feat, idx) => (
                  <li key={idx}>
                    <HiOutlineCheckCircle className="feat-icon" />
                    {feat}
                  </li>
                ))}
              </ul>
            )}

            {/* Repurchase section */}
            {cvExhausted && (
              <div className="billing-repurchase-section">
                {repurchaseMsg && (
                  <p className={`billing-repurchase-msg ${
                    repurchaseMsg.includes("renewed") ? "" : ""
                  }`}>{repurchaseMsg}</p>
                )}
                <Button
                  variant="primary"
                  onClick={handleRepurchase}
                  disabled={repurchasing}
                >
                  <HiOutlineArrowPath style={{ marginRight: 6 }} />
                  {repurchasing ? "Opening Razorpay..." : `Repurchase ${subscriptionData.planName} Plan`}
                </Button>
                <p className="billing-repurchase-hint">
                  Pay ${subscriptionData.planPrice}/month via Razorpay to get a fresh allocation of CV credits.
                </p>
              </div>
            )}

            <div className="subscription-periods">
              {(subscription.currentPeriodStart || subscription.currentPeriodEnd) && (
                <div className="period-item">
                  <HiOutlineCalendar className="period-icon" />
                  <div className="period-info">
                    <span className="period-label">Current Period</span>
                    <span className="period-date">
                      {formatDate(subscription.currentPeriodStart)} —{" "}
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                </div>
              )}

              {subscription.cancelAtPeriodEnd && (
                <div className="cancellation-notice">
                  <HiOutlineInformationCircle className="notice-icon" />
                  <div className="notice-content">
                    <strong>Subscription will cancel</strong> on{" "}
                    {formatDate(subscription.currentPeriodEnd)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Invoice History */}
      <Card className="invoice-history-card">
        <div className="invoice-history-header">
          <h2 className="invoice-history-title">Payment History</h2>
          {invoices.length > 0 && (
            <span className="invoice-count">
              {invoices.length} payment{invoices.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {invoices.length === 0 ? (
          <div className="no-invoices">
            <HiOutlineDocumentText className="no-invoices-icon" />
            <p>No payments recorded yet</p>
          </div>
        ) : (
          <div className="invoice-list">
            {invoices.map((invoice, index) => (
              <div key={invoice.invoiceId || invoice.razorpayPaymentId || index} className="invoice-item">
                <div className="invoice-info">
                  <div className="invoice-item-header">
                    <h4 className="invoice-id">
                      {invoice.number ||
                        (invoice.razorpayPaymentId
                          ? `Pay: ...${invoice.razorpayPaymentId.slice(-10)}`
                          : `#${invoice.invoiceId?.slice(-8) || "Unknown"}`)}
                    </h4>
                    <div className={`invoice-status ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      <span>{invoice.status}</span>
                    </div>
                  </div>

                  <div className="invoice-details">
                    <div className="invoice-detail-item">
                      <HiOutlineCurrencyDollar className="detail-icon" />
                      <span className="detail-amount">
                        {formatCurrency(invoice.amount, invoice.currency || "USD")}
                      </span>
                    </div>

                    <div className="invoice-detail-item">
                      <HiOutlineCalendar className="detail-icon" />
                      <span>
                        {formatDate(invoice.periodStart)} — {formatDate(invoice.periodEnd)}
                      </span>
                    </div>

                    <div className="invoice-detail-item">
                      <HiOutlineClock className="detail-icon" />
                      <span>Billed: {formatDate(invoice.created)}</span>
                    </div>

                    {invoice.billingReason && (
                      <span className="reason-badge">
                        {invoice.billingReason.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Razorpay has no hosted invoice URL — show payment ID only */}
                <div className="invoice-actions">
                  {invoice.razorpayPaymentId && (
                    <span className="summary-value summary-mono" style={{ fontSize: "0.78rem" }}>
                      {invoice.razorpayPaymentId}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Billing Summary */}
      <Card className="billing-summary-card">
        <h3 className="billing-summary-title">Billing Summary</h3>
        <div className="billing-summary-grid">
          <div className="summary-item">
            <span className="summary-label">Plan</span>
            <span className="summary-value">{subscriptionData?.planName || "—"}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Price</span>
            <span className="summary-value">${subscriptionData?.planPrice || 0}/month</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Status</span>
            <span className={`summary-status-badge ${getStatusColor(subscription?.status || "unknown")}`}>
              {getStatusIcon(subscription?.status)}
              {subscription?.status || "Unknown"}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Subscription ID</span>
            <span className="summary-value summary-mono">
              {subscription?.razorpaySubscriptionId
                ? `...${subscription.razorpaySubscriptionId.slice(-12)}`
                : "N/A"}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Provider</span>
            <span className="summary-value">Razorpay</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Auto-Renew</span>
            <span className="summary-value">
              {subscription?.willRenew ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
