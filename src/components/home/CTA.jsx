import "./CTA.css";
import Button from "../../ui/Button";
import { useNavigate } from "react-router-dom";

export default function CTA() {
  const navigate = useNavigate();
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-wrapper text-center">
          <h2 className="cta-title">Ready to Transform Your Hiring?</h2>
          <p className="cta-text">
            Join forward-thinking HR teams using AI to screen resumes and
            interview candidates faster than ever. Get started in under
            2 minutes.
          </p>
          <div className="cta-buttons d-flex justify-content-center gap-3">
            <Button
              className="btn-light btn-lg px-5 text-black fw-bold"
              onClick={() => navigate("/signup")}
            >
              Sign Up Now
            </Button>
            <Button
              variant="secondary"
              className="btn-outline-light btn-lg px-5"
              onClick={() => navigate("/contact")}
            >
              Contact Sales
            </Button>
          </div>
          <p className="cta-footer-text mt-4">
            No credit card to sign up • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}