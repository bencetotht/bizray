import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import BackgroundNetwork from "../components/BackgroundNetwork";
import "./LoginPage.css";
import { useAuth } from "../context/AuthContext";




export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
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

    //TODO: Implement actual login logic
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    //TODO: Implement actual login logic with backend 
    // for now, it just simulate successful login and navigate to account page
    try {
      console.log("Login attempt:", { email, password });
      await login({ email, password });
      navigate("/account");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-bg">
        <BackgroundNetwork />
        <div className="auth-overlay" />
      </div>

      <div className="container">
        <div className="auth-card-wrapper">
          <div className="auth-card">
            <header className="auth-header">
              <div className="auth-icon">
                <LogIn size={32} />
              </div>
              <h1>Welcome Back</h1>
              <p className="auth-subtitle">
                Sign in to your account to continue
              </p>
            </header>

            <form className="auth-form" onSubmit={handleSubmit}>
              {error && (
                <div className="auth-error">
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
                  placeholder="Write your email here"
                  value={email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  required
                  className={fieldErrors.email ? "input-error" : ""}
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
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
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

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="btn btn-primary btn-full">
                Sign In
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="auth-link">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

