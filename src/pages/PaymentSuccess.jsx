import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./PaymentSuccess.css";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { HiCheckCircle, HiExclamationTriangle } from "react-icons/hi2";
import { verifySession } from "../services/subscriptionApi";
import { signupUser } from "../services/authApi";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState("loading");
  const [tier, setTier] = useState("");
  const [error, setError] = useState("");
  const [organizationData, setOrganizationData] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setError("No session ID found. Please contact support.");
      return;
    }

    verifySession(sessionId)
      .then(async (data) => {
        if (data.status === "paid") {
          setTier(data.tier || "");
          
          // Check if this is a new organization signup
          console.log("[DEBUG] Payment verification data:", data);
          
          if (data.organizationData) {
            try {
              console.log("[DEBUG] Raw organization data:", data.organizationData);
              
              // Parse organization data and complete signup
              const orgData = typeof data.organizationData === 'string' 
                ? JSON.parse(data.organizationData) 
                : data.organizationData;
              
              console.log("[DEBUG] Parsed organization data:", orgData);
              setOrganizationData(orgData);
              
              // Complete the organization signup
              const signupResult = await signupUser({ 
                ...orgData, 
                role: "organization" 
              });
              
              console.log("[DEBUG] Signup result:", signupResult);
              
              if (signupResult.error) {
                setStatus("error");
                setError(`Payment successful but signup failed: ${signupResult.error}. Please contact support.`);
                return;
              }
              
              setStatus("success");
            } catch (err) {
              console.error("[ERROR] Organization data processing error:", err);
              setStatus("error");
              setError(`Payment successful but failed to process organization data: ${err.message}. Please contact support.`);
            }
          } else {
            // Existing organization upgrade
            setStatus("success");
          }
        } else {
          setStatus("error");
          setError(`Payment status: ${data.status}. Please try again or contact support.`);
        }
      })
      .catch((err) => {
        setStatus("error");
        setError(err.message);
      });
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="payment-success-page">
        <Card className="payment-success-card text-center">
          <div className="spinner mx-auto"></div>
          <p className="mt-3" style={{ color: "var(--text-muted)" }}>
            Verifying your payment...
          </p>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="payment-success-page">
        <Card className="payment-success-card text-center">
          <div className="payment-icon-wrapper payment-icon-error">
            <HiExclamationTriangle />
          </div>
          <h2 className="payment-title">Payment Issue</h2>
          <p className="payment-desc">{error}</p>
          <Button className="w-100 py-3 mt-3" onClick={() => navigate("/subscribe")}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="payment-success-page">
      <Card className="payment-success-card text-center">
        <div className="payment-icon-wrapper payment-icon-success">
          <HiCheckCircle />
        </div>
        <h2 className="payment-title">
          {organizationData ? "Account Created Successfully!" : "Payment Successful!"}
        </h2>
        <p className="payment-desc">
          {organizationData ? (
            <>
              Your <strong>{organizationData.organizationName}</strong> account has been created with the 
              <strong> {tier?.charAt(0).toUpperCase() + tier?.slice(1)}</strong> plan.
              You can now log in and start screening candidates immediately.
            </>
          ) : (
            <>
              Your <strong>{tier?.charAt(0).toUpperCase() + tier?.slice(1)}</strong> plan
              is now active. You can log in and start screening candidates immediately.
            </>
          )}
        </p>
        <Button className="w-100 py-3 mt-3" onClick={() => navigate("/login")}>
          Go to Login
        </Button>
        <p className="payment-footer mt-3">
          You can manage your subscription from the dashboard anytime.
        </p>
      </Card>
    </div>
  );
}
