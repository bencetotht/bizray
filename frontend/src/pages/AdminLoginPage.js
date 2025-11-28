import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
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
      //only for dvelopment mode: allow login with mock admin credentials
      const DEV_ADMIN_EMAIL = "admin@admin.com";
      const DEV_ADMIN_PASSWORD = "admin123";
      
      if (email === DEV_ADMIN_EMAIL && password === DEV_ADMIN_PASSWORD) {
        const mockAdminUser = {
          id: 1,
          uuid: "dev-admin-uuid",
          username: "admin",
          email: DEV_ADMIN_EMAIL,
          role: "admin",
          registered_at: new Date().toISOString()
        };
        
        localStorage.setItem("adminToken", "dev-mock-admin-token");
        localStorage.setItem("adminUser", JSON.stringify(mockAdminUser));
        navigate("/admin");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid email or password");
      }

      if (data.user && data.user.role === "admin") {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", JSON.stringify(data.user));
        navigate("/admin");
      } else {
        setError("Access denied. Admin privileges required.");
      }
    } catch (err) {
      if (email === "admin@admin.com" && password === "admin123") {
        const mockAdminUser = {
          id: 1,
          uuid: "dev-admin-uuid",
          username: "admin",
          email: "admin@admin.com",
          role: "admin",
          registered_at: new Date().toISOString()
        };
        localStorage.setItem("adminToken", "dev-mock-admin-token");
        localStorage.setItem("adminUser", JSON.stringify(mockAdminUser));
        navigate("/admin");
      } else {
        setError(err.message || "Login failed. Please try again.");
        console.error("Login error:", err);
      }
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

            <div style={{ 
              marginTop: "24px", 
              padding: "12px", 
              background: "#f0f9ff", 
              border: "1px solid #bae6fd", 
              borderRadius: "8px",
              fontSize: "0.875rem",
              color: "#0369a1",
              textAlign: "center"
            }}>
              <strong>Development Mode:</strong> Use <code>admin@admin.com</code> / <code>admin123</code> to test
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

