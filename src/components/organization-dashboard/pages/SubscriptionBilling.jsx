import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSubscriptionStatus, repurchaseSubscription } from "../../../services/subscriptionApi";
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

import { FaFileDownload, FaEye } from "react-icons/fa";

import "./SubscriptionBilling.css";

export default function SubscriptionBilling() {
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [repurchasing, setRepurchasing] = useState(false);
  const [repurchaseMsg, setRepurchaseMsg] = useState("");

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const data = await getSubscriptionStatus();
      if (data?.subscription?.provider === "razorpay") {
        navigate("/organization/dashboard/billing/razorpay", { replace: true });
        return;
      }
      setSubscriptionData(data);
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
      const data = await repurchaseSubscription();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setRepurchaseMsg("Unexpected response. Please try again.");
      }
    } catch (err) {
      setRepurchaseMsg(err.message || "Failed to initiate repurchase.");
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
      currency: currency,
    }).format(amount / 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "status-active";
      case "paid":
        return "status-active";
      case "canceled":
        return "status-canceled";
      case "past_due":
        return "status-past-due";
      case "incomplete":
        return "status-incomplete";
      case "trialing":
        return "status-trialing";
      default:
        return "status-unknown";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
      case "paid":
        return <HiOutlineCheckCircle />;
      case "canceled":
        return <HiOutlineXCircle />;
      case "past_due":
        return <HiOutlineClock />;
      case "trialing":
        return <HiOutlineInformationCircle />;
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

  const { subscription, invoices } = subscriptionData;
  const cvUsed = subscriptionData.cvUsed ?? 0;
  const cvLimit = subscriptionData.cvLimit ?? 0;
  const cvExhausted = cvLimit > 0 && cvUsed >= cvLimit;
  const cvPct = cvLimit > 0 ? Math.min(Math.round((cvUsed / cvLimit) * 100), 100) : 0;

  return (
    <div className="billing-container fade-in">
      <div className="billing-header">
        <h1 className="billing-title">Billing & Invoices</h1>
        <p className="billing-subtitle">
          Manage your subscription and view billing history
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
              <span>{subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1)}</span>
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
                  <p className="billing-repurchase-msg">{repurchaseMsg}</p>
                )}
                <Button
                  variant="primary"
                  onClick={handleRepurchase}
                  disabled={repurchasing}
                >
                  <HiOutlineArrowPath style={{ marginRight: 6 }} />
                  {repurchasing ? "Redirecting to Stripe..." : `Repurchase ${subscriptionData.planName} Plan`}
                </Button>
                <p className="billing-repurchase-hint">
                  Pay ${subscriptionData.planPrice}/month to get a fresh allocation of CV credits.
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
                      {formatDate(subscription.currentPeriodStart)} — {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                </div>
              )}

              {subscription.trialEnd && subscription.trialEnd > Date.now() / 1000 && (
                <div className="period-item trial">
                  <HiOutlineInformationCircle className="period-icon" />
                  <div className="period-info">
                    <span className="period-label">Trial Ends</span>
                    <span className="period-date">{formatDate(subscription.trialEnd)}</span>
                  </div>
                </div>
              )}

              {subscription.cancelAtPeriodEnd && (
                <div className="cancellation-notice">
                  <HiOutlineInformationCircle className="notice-icon" />
                  <div className="notice-content">
                    <strong>Subscription will cancel</strong> on {formatDate(subscription.currentPeriodEnd)}
                  </div>
                </div>
              )}
            </div>

            {/* Latest Invoice Quick Access */}
            {subscription.hostedInvoiceUrl && (
              <div className="latest-invoice">
                <h4>Latest Invoice</h4>
                <div className="invoice-actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(subscription.hostedInvoiceUrl, "_blank")}
                  >
                    <FaEye style={{ marginRight: 4 }} />
                    View Invoice
                  </Button>
                  {subscription.invoicePdf && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(subscription.invoicePdf, "_blank")}
                    >
                      <FaFileDownload style={{ marginRight: 4 }} />
                      Download PDF
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Invoice History */}
      <Card className="invoice-history-card">
        <div className="invoice-history-header">
          <h2 className="invoice-history-title">Invoice History</h2>
          {invoices && invoices.length > 0 && (
            <span className="invoice-count">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {!invoices || invoices.length === 0 ? (
          <div className="no-invoices">
            <HiOutlineDocumentText className="no-invoices-icon" />
            <p>No invoices available yet</p>
          </div>
        ) : (
          <div className="invoice-list">
            {invoices.map((invoice, index) => (
              <div key={invoice.invoiceId || index} className="invoice-item">
                <div className="invoice-info">
                  <div className="invoice-item-header">
                    <h4 className="invoice-id">
                      {invoice.number || `#${invoice.invoiceId?.slice(-8) || "Unknown"}`}
                    </h4>
                    <div className={`invoice-status ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      <span>{invoice.status}</span>
                    </div>
                  </div>
                  
                  <div className="invoice-details">
                    <div className="invoice-detail-item">
                      <HiOutlineCurrencyDollar className="detail-icon" />
                      <span className="detail-amount">{formatCurrency(invoice.amount, invoice.currency)}</span>
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

                <div className="invoice-actions">
                  {invoice.hostedInvoiceUrl && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.open(invoice.hostedInvoiceUrl, "_blank")}
                    >
                      <FaEye style={{ marginRight: 4 }} />
                      View
                    </Button>
                  )}
                  {invoice.invoicePdf && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(invoice.invoicePdf, "_blank")}
                    >
                      <FaFileDownload style={{ marginRight: 4 }} />
                      PDF
                    </Button>
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
            <span className="summary-value">{subscriptionData.planName || "—"}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Price</span>
            <span className="summary-value">${subscriptionData.planPrice || 0}/month</span>
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
              {(subscriptionData.stripeSubscriptionId || subscription?.stripeSubscriptionId)
                ? `...${(subscriptionData.stripeSubscriptionId || subscription?.stripeSubscriptionId).slice(-12)}`
                : "N/A"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
