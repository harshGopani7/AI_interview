/**
 * Razorpay Service — all API calls for Razorpay payment flow.
 * Completely isolated from Stripe/subscriptionApi.js.
 */

import { backendURL } from "../pages/Home";
import { getToken } from "./token";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

/**
 * Dynamically load the Razorpay checkout script.
 * Returns a Promise that resolves when the script is ready.
 */
export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });
}

/**
 * Fetch the Razorpay public key from backend.
 */
export async function getRazorpayKey() {
  const res = await fetch(`${backendURL}/razorpay/key`);
  if (!res.ok) throw new Error("Failed to fetch Razorpay key");
  return res.json();
}

/**
 * Create a Razorpay subscription on the backend.
 * @param {string} email
 * @param {string} tier  — "basic" | "gold" | "platinum"
 * @returns {Promise<object>} subscription details including subscription_id
 */
export async function createRazorpaySubscription(email, tier) {
  const res = await fetch(`${backendURL}/razorpay/create-subscription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, tier }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create Razorpay subscription");
  }
  return res.json();
}

/**
 * Verify a completed Razorpay payment on the backend.
 * @param {string} razorpay_payment_id
 * @param {string} razorpay_subscription_id
 * @param {string} razorpay_signature
 */
export async function verifyRazorpayPayment(
  razorpay_payment_id,
  razorpay_subscription_id,
  razorpay_signature
) {
  const res = await fetch(`${backendURL}/razorpay/verify-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Payment verification failed");
  }
  return res.json();
}

/**
 * Get current Razorpay subscription status (JWT required).
 */
export async function getRazorpayStatus() {
  const res = await fetch(`${backendURL}/razorpay/status`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch Razorpay status");
  }
  return res.json();
}

/**
 * Cancel Razorpay subscription at period end (JWT required).
 */
export async function cancelRazorpaySubscription() {
  const res = await fetch(`${backendURL}/razorpay/cancel`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to cancel Razorpay subscription");
  }
  return res.json();
}

/**
 * Preview proration for a Razorpay upgrade (JWT required).
 * @param {string} tier — new tier
 */
export async function previewRazorpayUpgrade(tier) {
  const res = await fetch(`${backendURL}/razorpay/upgrade/preview`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ tier }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch upgrade preview");
  }
  return res.json();
}

/**
 * Repurchase the same plan (JWT required) — used when cv_limit is exhausted.
 * Returns new subscription details to open checkout.
 */
export async function repurchaseRazorpaySubscription() {
  const res = await fetch(`${backendURL}/razorpay/repurchase`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to initiate repurchase");
  }
  return res.json();
}

/**
 * Step 1: Create a Razorpay Order for the prorated upgrade amount (JWT required).
 * @param {string} tier — new tier
 */
export async function createRazorpayUpgradeOrder(tier) {
  const res = await fetch(`${backendURL}/razorpay/upgrade/create-order`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ tier }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create upgrade order");
  }
  return res.json();
}

/**
 * Step 2: Verify the order payment and activate the upgraded subscription (JWT required).
 */
export async function verifyRazorpayUpgradeOrder({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  new_tier,
  amount,
}) {
  const res = await fetch(`${backendURL}/razorpay/upgrade/verify-order`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, new_tier, amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upgrade verification failed");
  }
  return res.json();
}
