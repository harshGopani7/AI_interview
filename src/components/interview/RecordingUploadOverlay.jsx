import { useState, useEffect } from "react";
import "./RecordingUploadOverlay.css";

export default function RecordingUploadOverlay({
  progress,
  status, // "uploading" | "saving" | "done" | "error"
  errorMessage,
  onDone,
}) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (status === "uploading" || status === "saving") {
      const interval = setInterval(() => {
        setDots((d) => (d.length >= 3 ? "" : d + "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="upload-overlay">
      <div className="upload-overlay-card">
        <div className="upload-overlay-icon">
          {status === "done" ? (
            <svg viewBox="0 0 24 24" fill="none" className="upload-icon-svg done">
              <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" />
              <path d="M7 12.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : status === "error" ? (
            <svg viewBox="0 0 24 24" fill="none" className="upload-icon-svg error">
              <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" />
              <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <div className="upload-spinner-ring">
              <div className="upload-spinner-inner" />
            </div>
          )}
        </div>

        <h2 className="upload-overlay-title">
          {status === "uploading" && `Wrapping up your interview${dots}`}
          {status === "saving" && `Almost done${dots}`}
          {status === "done" && "Interview Complete!"}
          {status === "error" && "Something went wrong"}
        </h2>

        <p className="upload-overlay-subtitle">
          {(status === "uploading" || status === "saving") &&
            "Please wait while we finish processing. Do not close this page."}
          {status === "done" &&
            "Your interview has been submitted successfully. You can now leave this page."}
          {status === "error" && (errorMessage || "Your interview results are still saved. You can continue to the dashboard.")}
        </p>

        {(status === "uploading" || status === "saving") && (
          <div className="upload-progress-section">
            <div className="upload-progress-bar">
              <div
                className="upload-progress-fill"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
            <span className="upload-progress-pct">{progress ?? 0}%</span>
          </div>
        )}

        {(status === "done" || status === "error") && (
          <button className="upload-overlay-btn" onClick={onDone}>
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
