import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Subscribe.css";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { HiCheckCircle } from "react-icons/hi2";
import { getPlans, createCheckoutSession } from "../services/subscriptionApi";
import RazorpayCheckout from "../components/RazorpayCheckout";

// Payment provider icons (inline SVG to avoid extra deps)
function StripeIcon() {
  return (
    <svg viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="provider-logo">
      <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.5 10.5 0 01-4.56.95c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.4 0 .4-.04 1.28-.06 1.73zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.15c-1.05 0-1.68-.39-2.1-.67l-.01 2.99-3.94.84V5.43h3.47l.18 1.02c.4-.44 1.32-1.27 2.9-1.27 2.55 0 5.07 2.3 5.07 7.4 0 5.23-2.49 7.57-5.57 7.57zm-.97-11.32c-.86 0-1.37.3-1.72.67l.02 5.26c.33.34.83.63 1.7.63 1.32 0 2.23-1.48 2.23-3.28 0-1.83-.92-3.28-2.23-3.28zM28.24 5.43h3.95v14.4h-3.95V5.43zm0-4.43l3.95-.84v3.2l-3.95.84V1zM23.95 8.29l-.25-2.86h-3.4v14.4h3.93V10.5c.93-1.2 2.5-1 2.98-.84V5.43c-.5-.17-2.3-.44-3.26 2.86zM14.4 2.86L10.53 3.7l-.02 13.48c0 2.49 1.87 4.33 4.36 4.33 1.38 0 2.39-.25 2.95-.55v-3.19c-.54.22-3.19.99-3.19-1.48V8.9h3.19V5.43h-3.19l.01-2.57zM3.94 10.23c0-.64.53-.89 1.4-.89 1.25 0 2.83.38 4.08 1.05V6.78A10.83 10.83 0 005.34 5.2C2.15 5.2 0 6.83 0 10.4c0 5.55 7.65 4.66 7.65 7.06 0 .76-.66 1.01-1.58 1.01-1.37 0-3.12-.56-4.5-1.32v3.67c1.52.66 3.06 1.02 4.5 1.02 3.43 0 5.79-1.7 5.79-5.3-.01-5.99-7.92-4.93-7.92-7.31z" fill="#635BFF"/>
    </svg>
  );
}

function RazorpayIcon() {
  return (
    <svg viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="provider-logo">
      <path d="M14.4 0L0 30h8.4L22.8 0H14.4z" fill="#072654"/>
      <path d="M22.8 0L8.4 30h8.4L31.2 0H22.8z" fill="#3395FF"/>
      <text x="36" y="22" fontFamily="Arial" fontWeight="700" fontSize="16" fill="#072654">razorpay</text>
    </svg>
  );
}

export default function Subscribe() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  // "cv_only" → show only Basic | "cv_interview" → show Gold & Platinum | null → show all
  const serviceType = location.state?.serviceType || null;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Payment provider selection state — null means not yet chosen
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentProvider, setPaymentProvider] = useState(null);

  const canceled = new URLSearchParams(location.search).get("canceled");

  useEffect(() => {
    if (!email) {
      navigate("/signup");
      return;
    }
    getPlans()
      .then((data) => {
        let allPlans = data.plans || [];
        // Filter plans based on the service type chosen during signup
        if (serviceType === "cv_only") {
          allPlans = allPlans.filter((p) => p.tier === "basic");
        } else if (serviceType === "cv_interview") {
          allPlans = allPlans.filter((p) => p.tier !== "basic");
        }
        setPlans(allPlans);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load plans. Please refresh.");
        setLoading(false);
      });
  }, [email, navigate, serviceType]);

  // ── Stripe flow (unchanged) ──
  const handleStripeSelect = async (tier) => {
    setError("");
    setCheckoutLoading(tier);
    try {
      const data = await createCheckoutSession(email, tier);
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Could not start checkout. Please try again.");
        setCheckoutLoading(null);
      }
    } catch (err) {
      setError(err.message);
      setCheckoutLoading(null);
    }
  };

  // ── Plan card click — open provider picker ──
  const handlePlanClick = (plan) => {
    setError("");
    setSuccess("");
    setSelectedPlan(plan);
    setPaymentProvider(null);
  };

  // ── Provider confirmed — proceed ──
  const handleProviderConfirm = () => {
    if (!paymentProvider) {
      setError("Please select a payment method.");
      return;
    }
    if (paymentProvider === "stripe") {
      setSelectedPlan(null);
      handleStripeSelect(selectedPlan.tier);
    }
    // Razorpay: RazorpayCheckout component handles the flow inline
  };

  // ── Razorpay success callback ──
  const handleRazorpaySuccess = ({ tier }) => {
    setSelectedPlan(null);
    setPaymentProvider(null);
    setSuccess(`Payment successful! Your ${tier} plan is now active.`);
    setTimeout(() => navigate("/login"), 3000);
  };

  // ── Razorpay error callback ──
  const handleRazorpayError = (msg) => {
    setError(msg);
  };

  if (loading) {
    return (
      <div className="subscribe-page">
        <div className="text-center p-5">
          <div className="spinner mx-auto"></div>
          <p className="mt-3" style={{ color: "var(--text-muted)" }}>
            Loading plans...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscribe-page">
      <div className="container">
        <div className="subscribe-header text-center">
          <span className="subscribe-badge">Almost There!</span>
          <h1 className="subscribe-title">Choose Your Plan</h1>
          <p className="subscribe-subtitle">
            Select a subscription to unlock AI-powered CV screening and
            interviews. You can upgrade or cancel anytime.
          </p>
        </div>

        {canceled && (
          <div className="subscribe-canceled-banner">
            Payment was canceled. You can select a plan below to try again.
          </div>
        )}

        {error && <div className="subscribe-error">{error}</div>}
        {success && <div className="subscribe-success">{success}</div>}

        {/* ── Plan cards ── */}
        <div className="subscribe-plans-grid">
          {plans.map((plan) => (
            <Card
              key={plan.tier}
              className={`subscribe-plan-card ${plan.isPopular ? "popular" : ""}`}
            >
              {plan.isPopular && (
                <span className="popular-badge">Most Popular</span>
              )}
              <div className="plan-header text-center">
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">
                  <span className="currency">$</span>
                  <span className="amount">{plan.price}</span>
                  <span className="period">/mo</span>
                </div>
              </div>
              <ul className="plan-features">
                {plan.features.map((feat, idx) => (
                  <li key={idx}>
                    <HiCheckCircle className="feat-icon" /> {feat}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-100 py-3 ${plan.isPopular ? "" : "btn-subscribe-outline"}`}
                onClick={() => handlePlanClick(plan)}
                disabled={checkoutLoading !== null}
              >
                {checkoutLoading === plan.tier ? "Redirecting..." : "Get Started"}
              </Button>
            </Card>
          ))}
        </div>

        <p className="subscribe-footer-text text-center">
          Secure payment powered by Stripe &amp; Razorpay. Cancel anytime from your dashboard.
        </p>
      </div>

      {/* ── Payment Provider Modal ── */}
      {selectedPlan && (
        <div className="provider-modal-overlay" onClick={() => { setSelectedPlan(null); setPaymentProvider(null); }}>
          <div className="provider-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="provider-modal-close"
              onClick={() => { setSelectedPlan(null); setPaymentProvider(null); setError(""); }}
              aria-label="Close"
            >
              ×
            </button>

            <div className="provider-modal-header">
              <h3>Complete Your Purchase</h3>
              <p>
                <strong>{selectedPlan.name} Plan</strong> — ${selectedPlan.price}/month
              </p>
            </div>

            <p className="provider-modal-label">Choose your payment method:</p>

            <div className="provider-options">
              {/* Stripe option */}
              {/* <button
                className={`provider-option ${paymentProvider === "stripe" ? "selected" : ""}`}
                onClick={() => setPaymentProvider("stripe")}
              >
                <StripeIcon />
                <span className="provider-option-name">Stripe</span>
                <span className="provider-option-desc">Credit / Debit Card (USD)</span>
                {paymentProvider === "stripe" && <span className="provider-check">✓</span>}
              </button> */}

              {/* Razorpay option */}
              <button
                className={`provider-option ${paymentProvider === "razorpay" ? "selected" : ""}`}
                onClick={() => setPaymentProvider("razorpay")}
              >
                <RazorpayIcon />
                <span className="provider-option-name">Razorpay</span>
                <span className="provider-option-desc">UPI / Cards / Netbanking (INR)</span>
                {paymentProvider === "razorpay" && <span className="provider-check">✓</span>}
              </button>
            </div>

            {error && <div className="subscribe-error mt-3">{error}</div>}

            <div className="provider-modal-actions">
              {paymentProvider === "razorpay" ? (
                <RazorpayCheckout
                  email={email}
                  tier={selectedPlan.tier}
                  planName={selectedPlan.name}
                  onSuccess={handleRazorpaySuccess}
                  onError={handleRazorpayError}
                  className="w-100 py-3 rzp-proceed-btn"
                >
                  Pay with Razorpay
                </RazorpayCheckout>
              ) : (
                <Button
                  className="w-100 py-3"
                  onClick={handleProviderConfirm}
                  disabled={!paymentProvider || checkoutLoading !== null}
                >
                  {checkoutLoading === selectedPlan?.tier ? "Redirecting..." : "Continue to Payment"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
