import { getToken } from "./token";
import { backendURL } from "../pages/Home";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// ===========================
// GET /api/job-master
// ===========================
export async function getJobPositions() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please login first.");

  const res = await fetch(`${backendURL}/api/job-master`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (res.status === 401) throw new Error("Session expired. Please login again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch job positions: ${res.statusText}`);
  }
  return res.json();
}

// ===========================
// POST /api/job-master
// ===========================
export async function createJobPosition(jobData) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please login first.");

  const res = await fetch(`${backendURL}/api/job-master`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(jobData),
  });

  if (res.status === 401) throw new Error("Session expired. Please login again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create job position: ${res.statusText}`);
  }
  return res.json();
}

// ===========================
// PUT /api/job-master/:id
// ===========================
export async function updateJobPosition(jobId, jobData) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please login first.");

  const res = await fetch(`${backendURL}/api/job-master/${jobId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(jobData),
  });

  if (res.status === 401) throw new Error("Session expired. Please login again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update job position: ${res.statusText}`);
  }
  return res.json();
}

// ===========================
// DELETE /api/job-master/:id
// ===========================
export async function deleteJobPosition(jobId) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please login first.");

  const res = await fetch(`${backendURL}/api/job-master/${jobId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (res.status === 401) throw new Error("Session expired. Please login again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to delete job position: ${res.statusText}`);
  }
  return res.json();
}

// ===========================
// GET /api/job-master/check-first-time
// ===========================
export async function checkFirstTime() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please login first.");

  const res = await fetch(`${backendURL}/api/job-master/check-first-time`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (res.status === 401) throw new Error("Session expired. Please login again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to check first time: ${res.statusText}`);
  }
  return res.json();
}
