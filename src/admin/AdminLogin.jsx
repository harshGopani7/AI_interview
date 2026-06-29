import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { saveToken } from "../services/token";
import "../pages/auth/Login.css";
// import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { backendURL } from "../pages/Home";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${backendURL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      saveToken(data.token);
      localStorage.setItem("userRole", "admin");
      localStorage.setItem("adminName", data.user.name || "Admin");
      navigate("/admin/dashboard");
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="auth-page-wrapper">
      <AuthCard
        title="Admin Login"
        subtitle="Secure access to admin dashboard"
      >
        <form className="auth-form-container" onSubmit={handleSubmit}>
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

          <Button type="submit" className="w-100 py-3 mt-2">
            Sign In
          </Button>

          <div className="auth-footer mt-4">
            Don't have an account? <a href="/admin/signup" className="brand-link">Create admin account</a>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}