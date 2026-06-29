/**
 * RazorpayCheckout — standalone Razorpay checkout button component.
 * Does NOT modify or depend on any Stripe component.
 *
 * Props:
 *   email       {string}  — customer email
 *   tier        {string}  — plan tier: "basic" | "gold" | "platinum"
 *   planName    {string}  — display name for the plan
 *   onSuccess   {fn}      — called with { tier } on successful payment
 *   onError     {fn}      — called with error message string
 *   children    {node}    — button label (optional)
 *   disabled    {bool}    — disable the button
 *   className   {string}  — extra CSS classes
 */

import { useState } from "react";
import {
  loadRazorpayScript,
  createRazorpaySubscription,
  verifyRazorpayPayment,
} from "../services/razorpayService";

export default function RazorpayCheckout({
  email,
  tier,
  planName,
  onSuccess,
  onError,
  children,
  disabled = false,
  className = "",
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!email || !tier) {
      onError?.("Email and plan tier are required.");
      return;
    }

    setLoading(true);

    try {
      // 1. Load Razorpay checkout script dynamically
      await loadRazorpayScript();

      // 2. Create subscription on backend
      const subData = await createRazorpaySubscription(email, tier);

      const {
        subscription_id,
        key_id,
        currency,
        org_name,
        contact,
      } = subData;

      // 3. Open Razorpay checkout modal
      await new Promise((resolve, reject) => {
        const options = {
          key: key_id,
          subscription_id: subscription_id,
          currency: currency || "INR",
          name: "AI Interview Platform",
          description: `${planName || tier} Plan — Monthly Subscription`,
          image: "/logo.png",
          prefill: {
            name: org_name || "",
            email: email,
            contact: contact || "",
          },
          notes: {
            tier: tier,
            email: email,
          },
          theme: {
            color: "#6366f1",
          },
          handler: async function (response) {
            try {
              // 4. Verify payment signature on backend
              const result = await verifyRazorpayPayment(
                response.razorpay_payment_id,
                response.razorpay_subscription_id,
                response.razorpay_signature
              );
              resolve(result);
            } catch (verifyErr) {
              reject(verifyErr);
            }
          },
          modal: {
            ondismiss: function () {
              reject(new Error("Payment cancelled by user"));
            },
          },
        };

        const rzp = new window.Razorpay(options);

        rzp.on("payment.failed", function (response) {
          reject(
            new Error(
              response.error?.description || "Payment failed. Please try again."
            )
          );
        });

        rzp.open();
      });

      // 5. Payment verified — notify parent
      onSuccess?.({ tier });
    } catch (err) {
      const msg = err.message || "Payment failed. Please try again.";
      if (msg !== "Payment cancelled by user") {
        onError?.(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`rzp-checkout-btn ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="rzp-btn-loading">
          <span className="rzp-spinner" />
          Processing...
        </span>
      ) : (
        children || "Pay with Razorpay"
      )}
    </button>
  );
}
