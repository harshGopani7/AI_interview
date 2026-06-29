import "./Hero.css";
import Button from "../../ui/Button";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge fade-in">
              <span className="badge-custom">AI-Powered Hiring Platform</span>
            </div>

            <h1 className="hero-title">
              Screen Resumes & Interview Candidates with{" "}
              <span className="text-gradient">AI Precision</span>
            </h1>

            <p className="hero-description">
              Stop spending hours reading resumes manually. Our AI analyzes
              every CV against your job criteria, ranks candidates instantly,
              and lets you schedule AI-driven interviews — all from one
              dashboard.
            </p>

            <div className="hero-actions">
              <Button className="btn-brand-primary" onClick={() => navigate("/signup")}>
                Start Hiring Smarter
              </Button>
              <Button variant="secondary" className="btn-brand-outline" onClick={() => navigate("/features")}>
                See How It Works
              </Button>
            </div>

            <div className="hero-trust-text">
              <span>No credit card required</span>
              <span className="dot-separator">•</span>
              <span>Setup in under 2 minutes</span>
            </div>
          </div>

          <div className="hero-image-col">
            <img
              src="/images/cv-analysis.png"
              alt="AI-powered CV Analysis"
              className="hero-image fade-in"
            />
          </div>
        </div>
      </div>

      <div className="hero-glow"></div>
    </section>
  );
}