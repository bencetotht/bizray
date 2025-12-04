import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff, Home } from "lucide-react";
import BackgroundNetwork from "../components/BackgroundNetwork";
import "./AdminLoginPage.css";

const API_BASE_URL = "https://apibizray.bnbdevelopment.hu/api/v1";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const value = e.target.value;
    const fieldName = e.target.id;
    
    if (e.target.type === "email") {
      setEmail(value);
    } else {
      setPassword(value);
    }
    
    if (fieldErrors[fieldName]) {
      setFieldErrors({
        ...fieldErrors,
        [fieldName]: "",
      });
    }
    
    if (e.target.validity.valueMissing) {
      e.target.setCustomValidity("Please fill in this field.");
    } else if (e.target.validity.typeMismatch && e.target.type === "email") {
      e.target.setCustomValidity("Please enter a valid email address.");
    } else {
      e.target.setCustomValidity("");
    }
  };

  const handleBlur = (e) => {
    const fieldName = e.target.id;
    let error = "";
    
    if (!e.target.value || e.target.value.trim() === "") {
      error = "Please fill in this field.";
    } else if (e.target.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
      error = "Please enter a valid email address.";
    }
    
    if (error) {
      setFieldErrors({
        ...fieldErrors,
        [fieldName]: error,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        const errorMessage = data.detail || data.message || "Invalid email or password";
        throw new Error(errorMessage);
      }

      if (!data.user || data.user.role !== "admin") {
        setError("no_access");
        setLoading(false);
        return;
      }
      
      if (!data.token) {
        throw new Error("No authentication token received");
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-login-page">
      <div className="admin-login-bg">
        <BackgroundNetwork />
        <div className="admin-login-overlay" />
      </div>

      <div className="container">
        <div className="admin-login-card-wrapper">
          <div className="admin-login-card">
            <header className="admin-login-header">
              <div className="admin-login-icon">
                <Shield size={32} />
              </div>
              <h1>Admin Login</h1>
              <p className="admin-login-subtitle">
                Sign in to access the admin dashboard
              </p>
            </header>

            {error === "no_access" ? (
              <div className="admin-login-access-denied">
                <div className="access-denied-icon">
                  <Shield size={48} />
                </div>
                <h3>Access Denied</h3>
                <p>You do not have access to this page.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-full"
                  onClick={() => navigate("/")}
                >
                  <Home size={18} />
                  Go to Home Page
                </button>
              </div>
            ) : (
              <form className="admin-login-form" onSubmit={handleSubmit}>
                {error && (
                  <div className="admin-login-error">
                    {error}
                  </div>
                )}

                <div className="form-group">
                <label htmlFor="email">
                  <Mail size={18} />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your admin email"
                  value={email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  required
                  className={fieldErrors.email ? "input-error" : ""}
                  disabled={loading}
                />
                {fieldErrors.email && (
                  <span className="field-error">
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <Lock size={18} />
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    required
                    className={fieldErrors.password ? "input-error" : ""}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <span className="field-error">
                    {fieldErrors.password}
                  </span>
                )}
              </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-full"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}

