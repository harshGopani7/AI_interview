
import { backendURL } from "../pages/Home";

export async function signupUser(payload) {
  const res = await fetch(`${backendURL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

export async function loginUser(payload) {
  const res = await fetch(`${backendURL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

export async function getCurrentUser(token) {
  const res = await fetch(`${backendURL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

export async function unifiedLogin(payload) {
  const res = await fetch(`${backendURL}/auth/unified-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

export async function loginCandidate(payload) {
  const res = await fetch(`${backendURL}/auth/candidate-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

//-----------------------------
// Admin Backend URLs
//-----------------------------
// Admin Login
export async function loginAdmin(payload) {
  const res = await fetch(`${backendURL}/auth/admin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

//-----------------------------
// Admin Signup
//-----------------------------
export async function signupAdmin(payload) {
  const res = await fetch(`${backendURL}/auth/admin-signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}