import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard";
import Input from "../ui/Input";
import Button from "../ui/Button";
import "../pages/auth/Login.css";
import { backendURL } from "../pages/Home";

export default function AdminSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${backendURL}/admin/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      navigate("/admin");
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="auth-page-wrapper">
      <AuthCard
        title="Create Admin Account"
        subtitle="Register as a platform administrator"
      >
        <form className="auth-form-container" onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="admin@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {error && (
            <div className="auth-error-message">
              {error}
            </div>
          )}

          <Button type="submit" className="w-100 py-3 mt-2">
            Create Admin Account
          </Button>

          <div className="auth-footer mt-4">
            Already have an account? <a href="/admin/login" className="brand-link">Sign in</a>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}
