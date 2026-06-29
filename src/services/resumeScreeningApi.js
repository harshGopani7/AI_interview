import { getToken } from "./token";
import { backendURL } from "../pages/Home";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

function authHeadersMultipart() {
  return {
    Authorization: `Bearer ${getToken()}`,
  };
}

// ===========================
// 1. POST /api/job/create
// ===========================
export async function createScreeningJob(payload) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please login first.");

  const res = await fetch(`${backendURL}/api/job/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (res.status === 401) throw new Error("Session expired. Please login again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create job: ${res.statusText}`);
  }
  return res.json();
}

// ===========================
// 2. POST /api/resumes/upload
// ===========================
export async function uploadResumes(jobId, files) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please login first.");

  const formData = new FormData();
  formData.append("jobId", jobId);
  for (const file of files) {
    formData.append("resumes", file);
  }

  const res = await fetch(`${backendURL}/api/resumes/upload`, {
    method: "POST",
    headers: authHeadersMultipart(),
    body: formData,
  });

  if (res.status === 401) throw new Error("Session expired. Please login again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to upload resumes: ${res.statusText}`);
  }
  return res.json();
}

// ===========================
// 3. POST /api/resumes/analyze
// ===========================
export async function analyzeResumes(jobId) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please login first.");

  const res = await fetch(`${backendURL}/api/resumes/analyze`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ jobId }),
  });

  if (res.status === 401) throw new Error("Session expired. Please login again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to analyze resumes: ${res.statusText}`);
  }
  return res.json();
}

// ===========================
// 4. GET /api/reports/:jobId
// ===========================
export async function getReport(jobId) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please login first.");

  const res = await fetch(`${backendURL}/api/reports/${jobId}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (res.status === 401) throw new Error("Session expired. Please login again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch report: ${res.statusText}`);
  }
  return res.json();
}

// ===========================
// 5. GET /api/history/jobs
// ===========================
export async function getHistoryJobs() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please login first.");

  const res = await fetch(`${backendURL}/api/history/jobs`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (res.status === 401) throw new Error("Session expired. Please login again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch history: ${res.statusText}`);
  }
  return res.json();
}

// ===========================
// 6. DELETE /api/resumes/:resumeId
// ===========================
export async function deleteResume(resumeId) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please login first.");

  const res = await fetch(`${backendURL}/api/resumes/${resumeId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (res.status === 401) throw new Error("Session expired. Please login again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to delete resume: ${res.statusText}`);
  }
  return res.json();
}

// ===========================
// 7. GET /api/cv-usage
// ===========================
export async function getCvUsage() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please login first.");

  const res = await fetch(`${backendURL}/api/cv-usage`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (res.status === 401) throw new Error("Session expired. Please login again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch CV usage: ${res.statusText}`);
  }
  return res.json();
}

// ===========================
// 8. POST /api/validate-cv
// ===========================
export async function validateCV(resumeFile, jobDetails) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated. Please login first.");

  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("jobTitle", jobDetails.jobTitle || "");
  formData.append("jobDescription", jobDetails.jobDescription || "");
  formData.append("requiredExperience", jobDetails.requiredExperience || "");
  formData.append("mandatorySkills", jobDetails.mandatorySkills?.join(", ") || "");

  const res = await fetch(`${backendURL}/api/validate-cv`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (res.status === 401) throw new Error("Session expired. Please login again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `CV validation failed: ${res.statusText}`);
  }
  return res.json();
}
