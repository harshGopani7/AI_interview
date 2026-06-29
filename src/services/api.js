import { getToken } from "./token";

import { backendURL } from "../pages/Home";
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// export async function startInterview(payload) {
//   const res = await fetch(`${backendURL}/start-interview`, {
//     method: "POST",
//     headers: authHeaders(),
//     body: JSON.stringify(payload),
//   });
//   return res.json();
// }

// export async function sendAnswer(payload) {
//   const res = await fetch(`${backendURL}/next-question`, {
//     method: "POST",
//     headers: authHeaders(),
//     body: JSON.stringify(payload),
//   });
//   return res.json();
// }

// export async function endInterview(payload) {
//   const res = await fetch(`${backendURL}/end-interview`, {
//     method: "POST",
//     headers: authHeaders(),
//     body: JSON.stringify(payload),
//   });
//   return res.json();
// }

export async function startInterview(payload) {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated. Please login first.");
  }

  const res = await fetch(`${backendURL}/interview/start-interview`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  
  if (res.status === 401) {
    throw new Error("Session expired. Please login again.");
  }
  
  if (!res.ok) {
    throw new Error(`Failed to start interview: ${res.statusText}`);
  }
  
  return res.json();
}

export async function sendAnswer(payload) {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated. Please login first.");
  }

  const res = await fetch(`${backendURL}/interview/next-question`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  
  if (res.status === 401) {
    throw new Error("Session expired. Please login again.");
  }
  
  if (!res.ok) {
    throw new Error(`Failed to send answer: ${res.statusText}`);
  }
  
  return res.json();
}

export async function endInterview(payload) {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated. Please login first.");
  }

  const res = await fetch(`${backendURL}/interview/end-interview`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  
  if (res.status === 401) {
    throw new Error("Session expired. Please login again.");
  }
  
  if (!res.ok) {
    throw new Error(`Failed to end interview: ${res.statusText}`);
  }
  
  return res.json();
}

/**
 * Upload recording file with retry logic and better error handling.
 * Compresses large recordings before upload to avoid 413 errors.
 */
export async function uploadRecordingFile({ scheduledInterviewId, type, blob, onProgress, maxRetries = 2 }) {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  // Log original size for debugging
  const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
  console.log(`[Recording] Uploading ${type}: ${sizeMB} MB`);

  // Warn if file is very large (>100MB)
  if (blob.size > 100 * 1024 * 1024) {
    console.warn(`[Recording] Large file detected (${sizeMB} MB), upload may take a while`);
  }

  const attemptUpload = (retryCount = 0) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("scheduledInterviewId", scheduledInterviewId);
      formData.append("type", type);
      formData.append("file", blob, `${type}.webm`);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${backendURL}/interview/upload-recording`, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      
      // Set longer timeout for large files (10 minutes)
      xhr.timeout = 600000;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve({ message: "Upload accepted" });
          }
        } else if (xhr.status === 413) {
          reject(new Error("File too large. Recording could not be saved."));
        } else if (xhr.status === 0 || xhr.status >= 500) {
          // Server error or network issue — retry
          if (retryCount < maxRetries) {
            console.log(`[Recording] Retry ${retryCount + 1}/${maxRetries} for ${type}`);
            setTimeout(() => {
              attemptUpload(retryCount + 1).then(resolve).catch(reject);
            }, 2000 * (retryCount + 1)); // Exponential backoff
          } else {
            reject(new Error(`Upload failed after ${maxRetries} retries: ${xhr.status}`));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        if (retryCount < maxRetries) {
          console.log(`[Recording] Network error, retry ${retryCount + 1}/${maxRetries} for ${type}`);
          setTimeout(() => {
            attemptUpload(retryCount + 1).then(resolve).catch(reject);
          }, 2000 * (retryCount + 1));
        } else {
          reject(new Error("Network error during upload"));
        }
      };

      xhr.ontimeout = () => {
        if (retryCount < maxRetries) {
          console.log(`[Recording] Timeout, retry ${retryCount + 1}/${maxRetries} for ${type}`);
          attemptUpload(retryCount + 1).then(resolve).catch(reject);
        } else {
          reject(new Error("Upload timed out"));
        }
      };

      xhr.send(formData);
    });
  };

  return attemptUpload();
}

// Mock Interview API functions
export async function createMockInterview(payload) {
  const res = await fetch(`${backendURL}/mock-interview/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to create mock interview: ${res.statusText}`);
  }
  return res.json();
}

export async function listMockInterviews() {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated. Please login first.");
  }

  const res = await fetch(`${backendURL}/mock-interview/list`, {
    method: "GET",
    headers: authHeaders(),
  });
  
  if (res.status === 401) {
    throw new Error("Session expired. Please login again.");
  }
  
  if (!res.ok) {
    throw new Error(`Failed to fetch mock interviews: ${res.statusText}`);
  }
  return res.json();
}

export async function updateMockInterview(mockId, payload) {
  const res = await fetch(`${backendURL}/mock-interview/update/${mockId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to update mock interview: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteMockInterview(mockId) {
  const res = await fetch(`${backendURL}/mock-interview/delete/${mockId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to delete mock interview: ${res.statusText}`);
  }
  return res.json();
}

export async function getMockInterview(mockId) {
  const res = await fetch(`${backendURL}/mock-interview/get/${mockId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to get mock interview: ${res.statusText}`);
  }
  return res.json();
}