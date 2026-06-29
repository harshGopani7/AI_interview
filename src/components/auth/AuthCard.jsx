import "./AuthCard.css";

export default function AuthCard({ title, subtitle, children, className = "" }) {
  return (
    <div className="auth-wrapper">
      <div className={`auth-card-container fade-in ${className}`}>
        {/* Brand Header */}
        <div className="auth-card-header text-center">
          {/* <img src="/oneweblogo.png" alt="InterviewAI" className="auth-logo mb-3" /> */}
          <h2 className="auth-title">{title}</h2>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>

        {/* Form/Content Area */}
        <div className="auth-card-body">
          {children}
        </div>
      </div>
    </div>
  );
}