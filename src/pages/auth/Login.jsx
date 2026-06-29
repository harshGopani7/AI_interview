import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../../components/auth/AuthCard";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import { unifiedLogin } from "../../services/authApi";
import { saveToken } from "../../services/token";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await unifiedLogin(form);

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      saveToken(res.token);
      sessionStorage.setItem("userRole", res.user.role);

      if (res.user.role === "organization") {
        sessionStorage.setItem("organizationName", res.user.organizationName || "Organization");
        if (res.user.payment_status !== "paid") {
          navigate("/subscribe", {
            state: {
              email: res.user.email,
              serviceType: res.user.serviceType || null,
            },
          });
        } else {
          navigate("/organization/dashboard");
        }
      } else if (res.user.role === "scheduled_candidate") {
        sessionStorage.setItem("candidateData", JSON.stringify(res.user));
        navigate("/dashboard");
      } else {
        sessionStorage.setItem("userName", res.user.name || "Student");
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <AuthCard
        title="Welcome Back"
        subtitle="Sign in with your email or username"
      >
        <form className="auth-form-container" onSubmit={handleSubmit}>
          <Input
            label="Email or Username"
            type="text"
            placeholder="name@company.com or username"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {error && (
            <div className="auth-error-message">
              {error}
            </div>
          )}

          <Button type="submit" className="w-100 py-3 mt-2" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="auth-footer mt-4">
            Don't have an account? <a href="/signup" className="brand-link">Sign up</a>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}