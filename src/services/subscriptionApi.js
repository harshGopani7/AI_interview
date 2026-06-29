import { backendURL } from "../pages/Home";
import { getToken } from "./token";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function getPlans() {
  const res = await fetch(`${backendURL}/subscription/plans`);
  if (!res.ok) throw new Error("Failed to fetch plans");
  return res.json();
}

export async function createCheckoutSession(email, tier) {
  const res = await fetch(`${backendURL}/subscription/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, tier }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create checkout session");
  }
  return res.json();
}

export async function verifySession(sessionId) {
  const res = await fetch(
    `${backendURL}/subscription/verify-session?session_id=${sessionId}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to verify session");
  }
  return res.json();
}

export async function getSubscriptionStatus() {
  const res = await fetch(`${backendURL}/subscription/status`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch subscription status");
  }
  return res.json();
}

export async function cancelSubscription() {
  const res = await fetch(`${backendURL}/subscription/cancel`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to cancel subscription");
  }
  return res.json();
}

export async function upgradePreview(tier) {
  const res = await fetch(`${backendURL}/subscription/upgrade/preview`, {
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

export async function upgradeSubscription(tier) {
  const res = await fetch(`${backendURL}/subscription/upgrade`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ tier }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upgrade subscription");
  }
  return res.json();
}

export async function getInterviewUsage() {
  const res = await fetch(`${backendURL}/organization/interview-usage`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch interview usage");
  }
  return res.json();
}

export async function repurchaseSubscription() {
  const res = await fetch(`${backendURL}/subscription/repurchase`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to initiate repurchase");
  }
  return res.json();
}
